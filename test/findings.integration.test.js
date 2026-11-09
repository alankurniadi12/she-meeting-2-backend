import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { MongoClient, ObjectId } from 'mongodb';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';
import { createAuthRouter } from '../src/auth/router.js';
import { prepareAuthStore } from '../src/auth/store.js';
import { hashPassword } from '../src/auth/password.js';
import { prepareFindingStore } from '../src/findings/store.js';
import { buildDemoFindings } from '../src/findings/demo.js';
import { createFindingRouter } from '../src/findings/router.js';

const uri = process.env.MONGODB_TEST_URI;
test('daftar dan ringkasan temuan HTTP dengan MongoDB nyata', { skip: !uri }, async (t) => {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });
  await client.connect();
  const db = client.db(`she_meeting_test_findings_${randomUUID().replaceAll('-', '')}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  await prepareAuthStore(db);
  await prepareFindingStore(db);
  const ids = { CAMP: new ObjectId(), TRANSPORT: new ObjectId(), ICT: new ObjectId() };
  await db.collection('divisions').insertMany(Object.entries(ids).map(([code, _id]) => ({ _id, code, name: code, active: code !== 'CAMP' })));
  const password = randomUUID();
  const accountId = (await db.collection('accounts').insertOne({ username: 'camp', displayName: 'Camp', role: 'DIVISION', divisionId: ids.CAMP,
    active: true, sessionVersion: 1, passwordHash: await hashPassword(password) })).insertedId;
  const config = loadConfig({ APP_ENV: 'test', MONGODB_DB: db.databaseName });
  const clock = new Date('2026-11-01T00:00:00Z');
  const authRouter = await createAuthRouter({ database: db, config });
  const findingRouter = createFindingRouter({ database: db, config, now: () => clock });
  const server = createServer(createApp({ config, authRouter, findingRouter, checkDatabase: async () => true }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }));
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  const login = await fetch(`${base}/auth/login`, { method: 'POST', headers: { Origin: 'http://localhost:5173', 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'camp', password }) });
  assert.equal(login.status, 200);
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const request = (path = '/findings') => fetch(`${base}${path}`, { headers: { Cookie: cookie } });
  const get = async (query = '') => {
    const response = await request(`/findings${query}`);
    assert.equal(response.status, 200);
    return response.json();
  };
  const { _id, seedKey, ...template } = buildDemoFindings({ divisionIds: ids, now: clock })[0];
  const row = (reference, overrides) => ({ ...template, _id: new ObjectId(), reference, reporterDivisionId: ids.ICT, ...overrides });
  await t.test('anonim dan pemasangan tanpa auth gagal tertutup; database kosong nol', async () => {
    for (const path of ['/findings', '/findings/summary']) assert.equal((await fetch(`${base}${path}`)).status, 401);
    const empty = await get();
    assert.deepEqual(empty.data, []);
    assert.equal(empty.meta.total, 0);
    assert.equal(empty.meta.totalPages, 0);
    const isolated = createServer(createApp({ config, findingRouter, checkDatabase: async () => true }));
    await new Promise((resolve) => isolated.listen(0, '127.0.0.1', resolve));
    try { assert.equal((await fetch(`http://127.0.0.1:${isolated.address().port}/api/v1/findings`)).status, 401); }
    finally { await new Promise((resolve) => { isolated.close(resolve); isolated.closeAllConnections(); }); }
  });
  await db.collection('findings').insertMany([
    row('TEST-A', { description: `Panel (A+B) [contoh]. ${'Panjang '.repeat(70)}`, reporterName: 'Pelapor Literal <img src=x>', location: 'Lokasi.A',
      responsibleDivisionIds: [ids.CAMP, ids.ICT], reporterDivisionId: ids.TRANSPORT, audit: [{ secret: 'hidden-history' }],
      attachments: [{ storageKey: 'hidden-storage' }], updatedBy: { ...template.updatedBy, secret: 'hidden-actor' } }),
    row('TEST-B', { description: 'Lantai licin', reportedDate: '2026-10-26', responsibleDivisionIds: [ids.CAMP], reporterDivisionId: ids.CAMP,
      status: 'ON_HOLD', holdReason: 'Material', targetDate: '2026-10-31', priority: 'HIGH' }),
    row('TEST-C', { description: 'Rambu contoh', reportedDate: '2026-10-25', responsibleDivisionIds: [ids.ICT], status: 'COMPLETED',
      completedAt: new Date('2026-10-31T17:00:00Z'), targetDate: '2026-10-30', priority: 'LOW' }),
    row('TEST-D', { description: 'Tangga contoh', reportedDate: '2026-10-31', responsibleDivisionIds: [ids.TRANSPORT], reporterDivisionId: ids.TRANSPORT,
      status: 'ON_HOLD', targetDate: '2026-11-01', priority: 'LOW' }),
    row('TEST-E', { description: 'Data batal', responsibleDivisionIds: [ids.CAMP], cancelledAt: clock, priority: 'HIGH', targetDate: '2026-10-31' }),
    row('TEST-F', { description: 'Data batal selesai', reportedDate: '2026-10-01', responsibleDivisionIds: [ids.ICT], cancelledAt: clock,
      status: 'COMPLETED', completedAt: new Date('2026-10-31T16:00:00Z') }),
    row('TEST-G', { description: 'Tanggal masa depan untuk uji badge saja', reportedDate: '2026-11-02', responsibleDivisionIds: [ids.TRANSPORT], priority: 'MEDIUM' }),
    row('TEST-H', { description: 'Jembatan contoh', reportedDate: '2026-10-02', responsibleDivisionIds: [ids.CAMP], reporterDivisionId: ids.CAMP,
      status: 'COMPLETED', priority: 'HIGH', completedAt: new Date('2026-10-31T16:59:59Z') }),
  ]);
  await t.test('pagination stabil, jumlah seluruh filter dan proyeksi aman', async () => {
    const first = await get('?pageSize=2');
    const second = await get('?pageSize=2&page=2');
    const third = await get('?pageSize=2&page=3');
    assert.deepEqual([...first.data, ...second.data, ...third.data].map((item) => item.reference), ['TEST-G', 'TEST-A', 'TEST-D', 'TEST-B', 'TEST-C', 'TEST-H']);
    assert.equal(first.meta.total, 6);
    assert.equal(first.meta.totalPages, 3);
    assert.deepEqual(first.meta.summary, second.meta.summary);
    assert.deepEqual(first.meta.summary, { totalMatched: 6, totalValid: 6, counts: { IN_PROGRESS: 2, ON_HOLD: 2, COMPLETED: 2 }, open: 4, overdue: 1, cancelled: 0 });
    assert.equal(first.data[1].descriptionExcerpt.length, 240);
    assert.equal(first.data[1].descriptionTruncated, true);
    assert.equal(first.data[1].responsibleDivisions[0].active, false);
    const text = JSON.stringify(first);
    for (const value of ['hidden-history', 'hidden-storage', 'hidden-actor', 'passwordHash', 'seedKey', 'progressEntries']) assert.ok(!text.includes(value));
    const beyond = await get('?pageSize=2&page=99');
    assert.equal(beyond.data.length, 0);
    assert.equal(beyond.meta.total, 6);
    assert.deepEqual(beyond.meta.summary, first.meta.summary);
    const sorted = await get('?sort=updatedAt:asc');
    assert.deepEqual(sorted.data.map((item) => item.id), [...sorted.data.map((item) => item.id)].sort());
  });
  await t.test('scope divisi OR tetap unik dan pembaca lintas divisi diperbolehkan', async () => {
    const scoped = await get(`?responsibleDivisionIds=${ids.CAMP},${ids.ICT},${ids.CAMP}`);
    assert.equal(scoped.meta.total, 4);
    assert.equal(new Set(scoped.data.map((item) => item.id)).size, 4);
    assert.equal((await get(`?responsibleDivisionIds=${ids.TRANSPORT}`)).meta.total, 2);
    assert.equal((await get(`?responsibleDivisionIds=${new ObjectId()}`)).meta.total, 0);
    assert.equal((await get(`?reporterDivisionId=${ids.TRANSPORT}`)).meta.total, 2);
  });
  await t.test('pencarian literal case-insensitive pada kondisi/lokasi/pelapor/referensi', async () => {
    for (const q of ['panel', '(A+B)', 'Lokasi.A', 'pelapor literal', 'TEST-A']) {
      const result = await get(`?q=${encodeURIComponent(q)}`);
      assert.deepEqual(result.data.map((item) => item.reference), ['TEST-A']);
    }
    assert.equal((await get('?q=.*')).meta.total, 0);
    assert.equal((await get('?priority=UNASSESSED')).meta.total, 1);
    assert.equal((await get('?status=ON_HOLD&priority=HIGH')).meta.total, 1);
  });
  await t.test('tanggal inklusif, basis selesai sesuai zona, status bertentangan tidak tertimpa', async () => {
    assert.deepEqual((await get('?from=2026-11-01&to=2026-11-01')).data.map((item) => item.reference), ['TEST-A']);
    assert.deepEqual((await get('?dateBasis=completed&from=2026-11-01&to=2026-11-01')).data.map((item) => item.reference), ['TEST-C']);
    assert.deepEqual((await get('?dateBasis=completed&from=2026-10-31&to=2026-10-31')).data.map((item) => item.reference), ['TEST-H']);
    assert.equal((await get('?dateBasis=completed&status=ON_HOLD')).meta.total, 0);
  });
  await t.test('batal dihitung terpisah, summary statis sama dengan seluruh daftar', async () => {
    const all = await get('?cancellation=all&pageSize=2');
    assert.equal(all.meta.total, 8);
    assert.equal(all.meta.summary.totalValid, 6);
    assert.equal(all.meta.summary.cancelled, 2);
    const cancelled = await get('?cancellation=cancelled');
    assert.equal(cancelled.meta.total, 2);
    assert.equal(cancelled.meta.summary.totalValid, 0);
    assert.equal(cancelled.meta.summary.open, 0);
    assert.ok(cancelled.data.every((item) => !item.isOverdue));
    const summary = await (await request('/findings/summary?cancellation=all')).json();
    for (const key of Object.keys(all.meta.summary)) assert.deepEqual(summary.data[key], all.meta.summary[key]);
  });
  await t.test('badge Baru hari 0/6/7, target kosong/hari ini/selesai, bukan createdAt', async () => {
    const result = await get();
    const rows = Object.fromEntries(result.data.map((item) => [item.reference, item]));
    assert.equal(rows['TEST-A'].ageDays, 0);
    assert.equal(rows['TEST-A'].isNew, true);
    assert.equal(rows['TEST-B'].ageDays, 6);
    assert.equal(rows['TEST-B'].isNew, true);
    assert.equal(rows['TEST-C'].ageDays, 7);
    assert.equal(rows['TEST-C'].isNew, false);
    assert.equal(rows['TEST-G'].isNew, false);
    assert.equal(rows['TEST-B'].isOverdue, true);
    for (const ref of ['TEST-A', 'TEST-C', 'TEST-D']) assert.equal(rows[ref].isOverdue, false);
  });
  await t.test('kueri salah/berulang/operator ditolak, summary tidak menerima pagination', async () => {
    for (const suffix of ['?status=NEW', '?pageSize=101', '?q[$ne]=x', '?status=ON_HOLD&status=COMPLETED', '?from=2026-02-29', '/summary?page=1']) {
      const response = await request(`/findings${suffix}`);
      assert.equal(response.status, 400);
      assert.equal((await response.json()).error.code, 'INVALID_QUERY');
    }
    assert.equal((await request(`/findings/${new ObjectId()}`)).status, 404);
  });
  await t.test('galat pembacaan memberi 500 tanpa data palsu atau detail internal', async () => {
    const failedDatabase = { collection() { return { aggregate() { throw new Error('mongodb://private-secret'); } }; } };
    const failedRouter = createFindingRouter({ database: failedDatabase, config });
    const failing = createServer(createApp({ config, authRouter, findingRouter: failedRouter, checkDatabase: async () => true }));
    await new Promise((resolve) => failing.listen(0, '127.0.0.1', resolve));
    try {
      const response = await fetch(`http://127.0.0.1:${failing.address().port}/api/v1/findings`, { headers: { Cookie: cookie } });
      assert.equal(response.status, 500);
      const text = await response.text();
      assert.ok(!text.includes('private-secret'));
      assert.equal(JSON.parse(text).data, undefined);
    } finally { await new Promise((resolve) => { failing.close(resolve); failing.closeAllConnections(); }); }
  });
  await t.test('revokasi sesi tetap berlaku pada daftar dan summary', async () => {
    await db.collection('accounts').updateOne({ _id: accountId }, { $inc: { sessionVersion: 1 } });
    assert.equal((await request('/findings')).status, 401);
    assert.equal((await request('/findings/summary')).status, 401);
  });
});
