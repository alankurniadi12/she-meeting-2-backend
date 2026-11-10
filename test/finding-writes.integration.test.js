import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { MongoClient, ObjectId } from 'mongodb';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';
import { prepareAuthStore } from '../src/auth/store.js';
import { createAuthRouter } from '../src/auth/router.js';
import { hashPassword } from '../src/auth/password.js';
import { prepareFindingStore } from '../src/findings/store.js';
import { createFindingRouter } from '../src/findings/router.js';
import { getDashboard } from '../src/dashboard/service.js';
const uri = process.env.MONGODB_TEST_URI;
test('mutasi temuan HTTP, audit atomik, retry dan konflik MongoDB nyata', { skip: !uri }, async (t) => {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });
  await client.connect();
  const db = client.db(`she_meeting_test_write_${randomUUID().replaceAll('-', '')}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  await prepareAuthStore(db); await prepareFindingStore(db);
  const ids = { CAMP: new ObjectId(), TRANSPORT: new ObjectId(), ICT: new ObjectId() };
  await db.collection('divisions').insertMany(Object.entries(ids).map(([code, _id]) => ({ _id, code, name: code, active: true })));
  const password = randomUUID(); const passwordHash = await hashPassword(password);
  await db.collection('accounts').insertMany(['camp', 'transport'].map((username) => ({ username, displayName: username, role: 'DIVISION', divisionId: ids[username.toUpperCase()], active: true, sessionVersion: 1, passwordHash })));
  await db.collection('accounts').insertOne({ username: 'admin', displayName: 'Admin ICT', role: 'ADMIN', divisionId: ids.ICT, active: true, sessionVersion: 1, passwordHash });
  const config = loadConfig({ APP_ENV: 'test', MONGODB_DB: db.databaseName });
  let clock = new Date('2026-11-09T01:00:00Z');
  const authRouter = await createAuthRouter({ database: db, config });
  const findingRouter = createFindingRouter({ database: db, config, now: () => clock });
  const server = createServer(createApp({ config, authRouter, findingRouter, checkDatabase: async () => true }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }));
  const base = `http://127.0.0.1:${server.address().port}/api/v1/findings`;
  const origin = 'http://localhost:5173';
  async function login(username) {
    const response = await fetch(base.replace('/findings', '/auth/login'), { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
    assert.equal(response.status, 200);
    return { cookie: response.headers.get('set-cookie').split(';')[0], csrf: (await response.json()).data.csrfToken };
  }
  const camp = await login('camp'); const transport = await login('transport'); const admin = await login('admin');
  const call = (path = '', body, { session = camp, method = 'POST', requestOrigin = origin, csrf = session?.csrf } = {}) => fetch(`${base}${path}`, {
    method, headers: { ...(requestOrigin ? { Origin: requestOrigin } : {}), ...(session ? { Cookie: session.cookie } : {}), ...(csrf ? { 'X-CSRF-Token': csrf } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) }, body: body === undefined ? undefined : JSON.stringify(body),
  });
  const initial = () => ({ mutationId: randomUUID(), reportedDate: '2026-11-09', description: 'Panel contoh perlu diperbaiki', location: 'Area Demo A', reporterName: 'Pelapor Contoh 01', reporterDivisionId: String(ids.TRANSPORT), responsibleDivisionIds: [String(ids.CAMP), String(ids.ICT)] });
  const get = async (id) => { const response = await call(`/${id}`, undefined, { method: 'GET' }); assert.equal(response.status, 200); return (await response.json()).data; };
  let id; let firstBody; let correctionBody; let correctionAck;
  await t.test('anonim, CSRF dan Origin salah tidak membuat data', async () => {
    for (const options of [{ session: null, csrf: null }, { csrf: null }, { requestOrigin: null }, { csrf: transport.csrf }]) {
      assert.ok([401, 403].includes((await call('', initial(), options)).status));
    }
    assert.equal(await db.collection('findings').countDocuments(), 0);
  });
  await t.test('validasi field, tanggal, divisi, default dan anti spoof pelaku', async () => {
    for (const overrides of [{ description: 'x' }, { reportedDate: '2026-11-10' }, { reportedDate: '2026-02-29' }, { responsibleDivisionIds: [] }, { responsibleDivisionIds: [String(ids.CAMP), String(ids.CAMP)] }, { priority: 'AUTO' }, { targetDate: '2026-11-08' }, { reporterName: { $ne: null } }, { reporterDivisionId: { toString: 7 } }, { status: 'COMPLETED' }, { createdBy: { username: 'admin.ict' } }, { mutationId: 'x' }]) {
      const response = await call('', { ...initial(), ...overrides });
      assert.equal(response.status, 422);
      assert.equal((await response.json()).error.code, 'VALIDATION_FAILED');
    }
    await db.collection('divisions').updateOne({ _id: ids.ICT }, { $set: { active: false } });
    assert.equal((await call('', initial())).status, 422);
    await db.collection('divisions').updateOne({ _id: ids.ICT }, { $set: { active: true } });
    firstBody = initial();
    const response = await call('', firstBody);
    assert.equal(response.status, 201);
    const result = await response.json(); id = result.data.id;
    const row = await get(id);
    assert.equal(row.status, 'IN_PROGRESS'); assert.equal(row.version, 1);
    assert.equal(row.targetDate, null); assert.equal(row.priority, null); assert.equal(row.attachmentCount, 0);
    assert.equal(row.createdBy.username, 'camp'); assert.equal(row.reporterDivision.name, 'TRANSPORT');
    assert.equal(row.responsibleDivisions.length, 2);
    const stored = await db.collection('findings').findOne({ _id: new ObjectId(id) });
    assert.equal(stored.audit.length, 1); assert.equal(stored.audit[0].action, 'CREATED');
    assert.equal(stored.audit[0].actor.username, 'camp');
    assert.ok(!JSON.stringify(row).includes('mutationReceipts') && !JSON.stringify(row).includes('requestHash') && !JSON.stringify(row).includes('passwordHash'));
  });
  await t.test('retry create tidak menggandakan data; payload/aktor berbeda ditolak', async () => {
    const replay = await call('', firstBody); assert.equal(replay.status, 200);
    assert.equal((await replay.json()).data.id, id);
    assert.equal((await call('', { ...firstBody, description: 'Isian berbeda' })).status, 409);
    assert.equal((await call('', firstBody, { session: transport })).status, 409);
    assert.equal(await db.collection('findings').countDocuments(), 1);
    const body = initial();
    const responses = await Promise.all([call('', body), call('', body)]);
    assert.deepEqual(responses.map((item) => item.status).sort(), [200, 201]);
    assert.equal(new Set(await Promise.all(responses.map(async (item) => (await item.json()).data.id))).size, 1);
  });
  await t.test('koreksi lintas divisi, audit before/after dan versi lama ditolak', async () => {
    correctionBody = { mutationId: randomUUID(), version: 1, description: 'Panel contoh dikoreksi oleh Transport' };
    const response = await call(`/${id}`, correctionBody, { method: 'PATCH', session: transport });
    assert.equal(response.status, 200); correctionAck = (await response.json()).data;
    const row = await get(id); assert.equal(row.version, 2); assert.equal(row.updatedBy.username, 'transport');
    const stored = await db.collection('findings').findOne({ _id: new ObjectId(id) });
    assert.equal(stored.audit[1].before.description, firstBody.description);
    assert.equal(stored.audit[1].after.description, correctionBody.description);
    assert.ok(stored.audit[1].divisionSnapshots.some((division) => division.name === 'TRANSPORT'));
    await db.collection('divisions').updateOne({ _id: ids.TRANSPORT }, { $set: { name: 'Nama master berubah' } });
    assert.ok((await db.collection('findings').findOne({ _id: new ObjectId(id) })).audit[1].divisionSnapshots.some((division) => division.name === 'TRANSPORT'));
    await db.collection('divisions').updateOne({ _id: ids.TRANSPORT }, { $set: { name: 'TRANSPORT' } });
    const stale = await call(`/${id}`, { mutationId: randomUUID(), version: 1, location: 'Lokasi lama' }, { method: 'PATCH' });
    assert.equal(stale.status, 409); assert.equal((await stale.json()).error.currentVersion, 2);
    assert.equal((await get(id)).location, 'Area Demo A');
  });
  await t.test('Tertunda wajib alasan, progres append-only dan metadata akun server', async () => {
    assert.equal((await call(`/${id}/progress`, { mutationId: randomUUID(), version: 2, status: 'ON_HOLD' })).status, 422);
    const response = await call(`/${id}/progress`, { mutationId: randomUUID(), version: 2, status: 'ON_HOLD', holdReason: 'Menunggu material contoh', text: 'Material sedang dipersiapkan' });
    assert.equal(response.status, 200);
    const row = await get(id); assert.equal(row.version, 3); assert.equal(row.status, 'ON_HOLD');
    assert.equal(row.progressEntries[0].actor.username, 'camp'); assert.equal(row.progressEntries[0].text, 'Material sedang dipersiapkan');
    assert.equal((await call(`/${id}/progress`, { mutationId: randomUUID(), version: 3, holdReason: null })).status, 422);
    const replay = await call(`/${id}`, correctionBody, { method: 'PATCH', session: transport });
    assert.deepEqual((await replay.json()).data, correctionAck); // Original acknowledgement, even after later writes.
    assert.equal((await get(id)).version, 3);
  });
  await t.test('Selesai tanpa foto/approval; koreksi ke aktif wajib alasan', async () => {
    clock = new Date('2026-11-09T02:00:00Z');
    const completed = await call(`/${id}/progress`, { mutationId: randomUUID(), version: 3, status: 'COMPLETED', priority: 'HIGH', targetDate: '2026-11-12' });
    assert.equal(completed.status, 200);
    let row = await get(id); assert.equal(row.status, 'COMPLETED'); assert.equal(row.completedAt, clock.toISOString()); assert.equal(row.holdReason, null); assert.equal(row.attachmentCount, 0);
    assert.equal((await call(`/${id}/progress`, { mutationId: randomUUID(), version: 4, status: 'IN_PROGRESS' })).status, 422);
    const corrected = await call(`/${id}/progress`, { mutationId: randomUUID(), version: 4, status: 'IN_PROGRESS', correctionReason: 'Salah memilih status saat demo' });
    assert.equal(corrected.status, 200); row = await get(id); assert.equal(row.completedAt, null);
    const stored = await db.collection('findings').findOne({ _id: new ObjectId(id) });
    assert.equal(stored.audit.at(-1).correctionReason, 'Salah memilih status saat demo');
    assert.equal(stored.audit.at(-1).before.completedAt.toISOString(), clock.toISOString());
  });
  await t.test('divisi historis nonaktif boleh tetap, penugasan baru harus aktif', async () => {
    await db.collection('divisions').updateOne({ _id: ids.ICT }, { $set: { active: false } });
    const row = await get(id);
    assert.equal((await call(`/${id}`, { mutationId: randomUUID(), version: row.version, location: 'Area Demo B' }, { method: 'PATCH' })).status, 200);
    const current = await get(id);
    assert.equal((await call(`/${id}`, { mutationId: randomUUID(), version: current.version, responsibleDivisionIds: [String(ids.ICT)] }, { method: 'PATCH' })).status, 422);
    await db.collection('divisions').updateOne({ _id: ids.ICT }, { $set: { active: true } });
  });
  await t.test('dua pembaruan versi sama hanya satu berhasil dan audit tidak parsial', async () => {
    const before = await get(id);
    const results = await Promise.all(['A', 'B'].map((label) => call(`/${id}/progress`, { mutationId: randomUUID(), version: before.version, text: `Catatan serentak ${label}` })));
    assert.deepEqual(results.map((item) => item.status).sort(), [200, 409]);
    const after = await get(id); assert.equal(after.version, before.version + 1); assert.equal(after.progressTotal, before.progressTotal + 1);
    const stored = await db.collection('findings').findOne({ _id: new ObjectId(id) });
    assert.equal(stored.audit.length, stored.version);
    const dashboard = await getDashboard(db, { query: {}, timeZone: config.timeZone, now: clock });
    assert.equal(dashboard.snapshot.totalValid, 2);
  });
  await t.test('retry progres serentak hanya satu catatan dan tanpa perubahan ditolak', async () => {
    const before = await get(id); const body = { mutationId: randomUUID(), version: before.version, text: 'Retry tidak ganda' };
    const results = await Promise.all([call(`/${id}/progress`, body), call(`/${id}/progress`, body)]);
    assert.ok(results.every((response) => response.status === 200));
    assert.equal((await get(id)).progressTotal, before.progressTotal + 1);
    assert.equal((await call(`/${id}/progress`, { mutationId: randomUUID(), version: before.version + 1 })).status, 422);
  });
  await t.test('riwayat before/after dan progres dipaginasi tanpa metadata internal', async () => {
    const before = await get(id);
    for (let index = 0; index < 12; index++) {
      const response = await call(`/${id}/progress`, { mutationId: randomUUID(), version: before.version + index, text: `Catatan halaman ${index + 1}` });
      assert.equal(response.status, 200);
    }
    const first = await call(`/${id}/progress?page=1&pageSize=10`, undefined, { method: 'GET', session: transport });
    assert.equal(first.status, 200);
    const progress = await first.json();
    assert.equal(progress.data.length, 10); assert.equal(progress.meta.total, before.progressTotal + 12);
    assert.equal(progress.data[0].text, 'Catatan halaman 12');
    const second = await call(`/${id}/progress?page=2&pageSize=10`, undefined, { method: 'GET' });
    assert.equal(second.status, 200); assert.ok((await second.json()).data.length > 0);
    const historyResponse = await call(`/${id}/history?page=1&pageSize=10`, undefined, { method: 'GET' });
    assert.equal(historyResponse.status, 200);
    const history = await historyResponse.json();
    assert.equal(history.meta.total, (await get(id)).version);
    assert.deepEqual(history.data[0].after, {}); assert.equal(history.data[0].progressEntryId != null, true);
    const createPage = await call(`/${id}/history?page=2&pageSize=10`, undefined, { method: 'GET' });
    const created = (await createPage.json()).data.find((entry) => entry.action === 'CREATED');
    assert.equal(created.before, null); assert.equal(created.after.reporterDivisionId, String(ids.TRANSPORT));
    assert.ok(!JSON.stringify(history).includes('mutationId') && !JSON.stringify(history).includes('requestHash'));
    for (const path of [`/${id}/history?page=0`, `/${id}/history?pageSize=51`, `/${id}/progress?sort=bad`, `/${id}/history?page=1&page=2`]) assert.equal((await call(path, undefined, { method: 'GET' })).status, 422);
    assert.equal((await call(`/${id}/progress?page=999`, undefined, { method: 'GET' })).status, 200);
    assert.equal((await call(`/${new ObjectId()}/history`, undefined, { method: 'GET' })).status, 404);
    assert.equal((await call(`/${id}/history`, undefined, { method: 'GET', session: null, csrf: null })).status, 401);
    const fixtureId = new ObjectId();
    await db.collection('findings').insertOne({ _id: fixtureId, audit: [{ action: 'DEMO_SEED', actor: { source: 'DEMO_SEED', displayName: 'Seed data demo' }, timestamp: clock, revision: 1 }], progressEntries: [] });
    const fixture = await call(`/${fixtureId}/history`, undefined, { method: 'GET' });
    assert.equal(fixture.status, 200);
    assert.equal((await fixture.json()).data[0].before, null);
  });
  await t.test('batal beralasan, pemulihan admin, audit, retry dan ringkasan tetap konsisten', async () => {
    const created = await call('', initial());
    const targetId = (await created.json()).data.id;
    const countBefore = (await getDashboard(db, { query: {}, timeZone: config.timeZone, now: clock })).snapshot.totalValid;
    const cancelPath = `/${targetId}/cancel`; const restorePath = `/${targetId}/restore`;
    const invalid = { version: 1, mutationId: randomUUID(), reason: '' };
    assert.equal((await call(cancelPath, invalid)).status, 422);
    assert.equal((await call(cancelPath, { ...invalid, reason: 'Duplikat demo', cancelledBy: 'admin' })).status, 422);
    assert.equal((await call(cancelPath, { ...invalid, reason: 'Duplikat demo' }, { session: null, csrf: null })).status, 401);
    assert.equal((await call(cancelPath, { ...invalid, reason: 'Duplikat demo' }, { csrf: null })).status, 403);
    assert.equal((await call(restorePath, { version: 1, mutationId: randomUUID(), reason: 'Pulihkan' }, { session: admin })).status, 409);
    const body = { version: 1, mutationId: randomUUID(), reason: 'Duplikat data dummy' };
    const cancelled = await call(cancelPath, body, { session: transport });
    assert.equal(cancelled.status, 200);
    const cancelledAck = (await cancelled.json()).data;
    assert.equal(cancelledAck.version, 2);
    assert.equal((await getDashboard(db, { query: {}, timeZone: config.timeZone, now: clock })).snapshot.totalValid, countBefore - 1);
    assert.equal((await get(targetId)).cancellationReason, body.reason);
    const cancelledReplay = await call(cancelPath, body, { session: transport });
    assert.equal(cancelledReplay.status, 200);
    assert.equal((await cancelledReplay.json()).meta.replayed, true);
    assert.equal((await call(cancelPath, { ...body, reason: 'Beda' }, { session: transport })).status, 409);
    assert.equal((await call(cancelPath, { version: 2, mutationId: randomUUID(), reason: 'Lagi' })).status, 409);
    assert.equal((await call(`/${targetId}/progress`, { version: 2, mutationId: randomUUID(), text: 'Tidak boleh' })).status, 409);
    assert.equal((await call(`/${targetId}`, { version: 2, mutationId: randomUUID(), location: 'Tidak boleh' }, { method: 'PATCH' })).status, 409);
    const list = await call('?cancellation=cancelled', undefined, { method: 'GET' });
    assert.ok((await list.json()).data.some((item) => item.id === targetId));
    assert.equal((await call(restorePath, { version: 2, mutationId: randomUUID(), reason: 'Salah batal' })).status, 403);
    const restoreBody = { version: 2, mutationId: randomUUID(), reason: 'Salah tandai duplikat demo' };
    const restored = await call(restorePath, restoreBody, { session: admin });
    assert.equal(restored.status, 200); assert.equal((await restored.json()).data.version, 3);
    const restoredReplay = await call(restorePath, restoreBody, { session: admin });
    assert.equal(restoredReplay.status, 200);
    assert.equal((await restoredReplay.json()).meta.replayed, true);
    const detail = await get(targetId);
    assert.equal(detail.cancelledAt, null); assert.equal(detail.cancellationReason, null); assert.equal(detail.status, 'IN_PROGRESS');
    const history = await call(`/${targetId}/history`, undefined, { method: 'GET' });
    const entries = (await history.json()).data;
    assert.deepEqual(entries.map((event) => event.action), ['RESTORED', 'CANCELLED', 'CREATED']);
    assert.equal(entries[0].actor.username, 'admin'); assert.equal(entries[0].reason, restoreBody.reason);
    assert.equal(entries[0].before.cancellationReason, body.reason); assert.equal(entries[0].after.cancelledAt, null);
    assert.equal(entries[1].actor.username, 'transport'); assert.equal(entries[1].before.cancelledAt, null);
    assert.equal(entries[1].after.cancellationReason, body.reason);
    assert.equal((await call(restorePath, { version: 3, mutationId: randomUUID(), reason: 'Lagi' }, { session: admin })).status, 409);
    const summary = await getDashboard(db, { query: {}, timeZone: config.timeZone, now: clock });
    assert.equal(summary.snapshot.totalValid, countBefore);
  });
  await t.test('batal/ID hilang dan guard ukuran histori tidak menyimpan sebagian', async () => {
    assert.equal((await call(`/${new ObjectId()}`, undefined, { method: 'GET' })).status, 404);
    assert.equal((await call('/invalid', undefined, { method: 'GET' })).status, 422);
    const row = await get(id);
    await db.collection('findings').updateOne({ _id: new ObjectId(id) }, { $set: { cancelledAt: clock } });
    assert.equal((await call(`/${id}/progress`, { mutationId: randomUUID(), version: row.version, text: 'Tidak boleh' })).status, 409);
    await db.collection('findings').updateOne({ _id: new ObjectId(id) }, { $set: { cancelledAt: null, audit: [{ padding: 'x'.repeat(8 * 1024 * 1024) }] } });
    const response = await call(`/${id}/progress`, { mutationId: randomUUID(), version: row.version, text: 'Kapasitas penuh' });
    assert.equal(response.status, 409); assert.equal((await response.json()).error.code, 'HISTORY_CAPACITY_REACHED');
    assert.equal((await get(id)).version, row.version);
  });
});
