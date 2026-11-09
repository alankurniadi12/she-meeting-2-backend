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
import { createDashboardRouter } from '../src/dashboard/router.js';
import { seedDemoFindings } from '../src/findings/demo.js';

const uri = process.env.MONGODB_TEST_URI;
test('dashboard HTTP, agregasi MongoDB dan seed temuan nyata', { skip: !uri }, async (t) => {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });
  await client.connect();
  const db = client.db(`she_meeting_test_dashboard_${randomUUID().replaceAll('-', '')}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  await prepareAuthStore(db);
  const divisionIds = { CAMP: new ObjectId(), TRANSPORT: new ObjectId(), ICT: new ObjectId() };
  await db.collection('divisions').insertMany(Object.entries(divisionIds).map(([code, _id]) => ({ _id, code, name: code, active: true })));
  const password = randomUUID();
  await db.collection('accounts').insertOne({ username: 'camp', displayName: 'Camp', role: 'DIVISION',
    divisionId: divisionIds.CAMP, active: true, sessionVersion: 1, passwordHash: await hashPassword(password) });
  const config = loadConfig({ APP_ENV: 'test', MONGODB_DB: db.databaseName });
  const clock = new Date('2026-11-01T00:00:00Z');
  const dashboardRouter = createDashboardRouter({ database: db, config, now: () => clock });
  const authRouter = await createAuthRouter({ database: db, config });
  const server = createServer(createApp({ config, authRouter, dashboardRouter, checkDatabase: async () => true }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }));
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  const login = await fetch(`${base}/auth/login`, { method: 'POST', headers: { Origin: 'http://localhost:5173', 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'camp', password }) });
  assert.equal(login.status, 200);
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const get = (query = '') => fetch(`${base}/dashboard${query}`, { headers: { Cookie: cookie } });
  const division = divisionIds.CAMP.toHexString();
  const transport = divisionIds.TRANSPORT.toHexString();
  const unknown = new ObjectId().toHexString();
  const baseFinding = { cancelledAt: null, targetDate: null, reportedDate: '2026-10-20', status: 'IN_PROGRESS', completedAt: null };
  await t.test('anonim ditolak dan database kosong benar-benar nol', async () => {
    assert.equal((await fetch(`${base}/dashboard`)).status, 401);
    const response = await get();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const { data } = await response.json();
    assert.deepEqual(data.snapshot, { totalValid: 0, counts: { IN_PROGRESS: 0, ON_HOLD: 0, COMPLETED: 0 }, open: 0, overdue: 0 });
    assert.deepEqual(data.period, { month: '2026-11', reported: 0, completed: 0 });
    assert.equal(data.dataMode, 'DEMO');
    assert.equal(data.today, '2026-11-01');
  });
  await t.test('status semua tanggal, multi-divisi unik, batal dikecualikan dan target hari ini belum terlambat', async () => {
    await db.collection('findings').insertMany([
      { ...baseFinding, reference: 'TEST-1', responsibleDivisionIds: [divisionIds.CAMP, divisionIds.TRANSPORT], targetDate: '2026-10-31', description: 'do-not-expose', reporterName: 'private-test' },
      { ...baseFinding, reference: 'TEST-2', responsibleDivisionIds: [divisionIds.TRANSPORT], status: 'ON_HOLD', targetDate: '2026-11-01', reportedDate: '2026-11-01' },
      { ...baseFinding, reference: 'TEST-3', responsibleDivisionIds: [divisionIds.CAMP], status: 'COMPLETED', targetDate: '2026-10-30', completedAt: new Date('2026-10-31T17:00:00Z') },
      { ...baseFinding, reference: 'TEST-4', responsibleDivisionIds: [divisionIds.ICT], status: 'COMPLETED', completedAt: new Date('2026-10-31T16:59:59Z') },
      { ...baseFinding, reference: 'TEST-5', responsibleDivisionIds: [divisionIds.CAMP], status: 'ON_HOLD', targetDate: '2026-10-25', cancelledAt: clock },
      { ...baseFinding, reference: 'TEST-6', responsibleDivisionIds: [divisionIds.CAMP], completedAt: new Date('2026-10-31T18:00:00Z') },
    ]);
    const response = await get();
    const result = await response.json();
    assert.deepEqual(result.data.snapshot, { totalValid: 5, counts: { IN_PROGRESS: 2, ON_HOLD: 1, COMPLETED: 2 }, open: 3, overdue: 1 });
    assert.deepEqual(result.data.period, { month: '2026-11', reported: 1, completed: 1 });
    assert.equal(result.data.asOf, clock.toISOString());
    const scope = (await (await get(`?responsibleDivisionIds=${division},${transport},${division}`)).json()).data;
    assert.equal(scope.snapshot.totalValid, 4); // TEST-1 appears once, not twice.
    assert.equal(scope.snapshot.overdue, 1);
    assert.equal(scope.scope.responsibleDivisionIds.length, 2);
    assert.equal((await (await get(`?responsibleDivisionIds=${transport}`)).json()).data.snapshot.totalValid, 2);
    const serialized = JSON.stringify(result);
    for (const hidden of ['do-not-expose', 'private-test', 'passwordHash', 'audit', 'csrfToken']) assert.ok(!serialized.includes(hidden));
  });
  await t.test('periode memakai tanggal masuk/selesai masing-masing dan tidak mengubah snapshot', async () => {
    const current = (await (await get()).json()).data;
    const previous = (await (await get('?month=2026-10')).json()).data;
    assert.deepEqual(previous.snapshot, current.snapshot);
    assert.deepEqual(previous.period, { month: '2026-10', reported: 4, completed: 1 });
    assert.equal((await (await get('?month=2027-01')).json()).data.period.reported, 0);
    assert.equal((await (await get(`?responsibleDivisionIds=${unknown}`)).json()).data.snapshot.totalValid, 0);
  });
  await t.test('input salah/kueri operator/parameter berulang ditolak tanpa detail internal', async () => {
    for (const query of ['?month=2026-13', '?month=2026-11&month=2026-10', '?responsibleDivisionIds[$ne]=x', '?responsibleDivisionIds=x', '?status=IN_PROGRESS', '?page=2']) {
      const response = await get(query);
      assert.equal(response.status, 400);
      assert.equal((await response.json()).error.code, 'INVALID_QUERY');
    }
  });
  await t.test('seed 18 temuan tidak menimpa data lain, suntingan, tanggal, maupun audit saat diulang', async () => {
    assert.equal(await seedDemoFindings(db, { divisionIds, now: clock }), 18);
    assert.equal(await db.collection('findings').countDocuments(), 24);
    await db.collection('findings').updateOne({ seedKey: 'D0-03-finding-01' }, { $set: { description: 'Koreksi fixture', version: 2 }, $push: { audit: { action: 'TEST_EDIT' } } });
    const before = await db.collection('findings').find().sort({ reference: 1 }).toArray();
    assert.equal(await seedDemoFindings(db, { divisionIds, now: new Date(clock.getTime() + 40 * 86400000) }), 0);
    assert.deepEqual(await db.collection('findings').find().sort({ reference: 1 }).toArray(), before);
    const fixtures = before.filter((row) => row.seedKey);
    assert.equal(fixtures.length, 18);
    assert.equal(fixtures.filter((row) => row.cancelledAt).length, 2);
    assert.ok(fixtures.every((row) => row.targetDate === null || row.targetDate >= row.reportedDate));
    assert.ok(fixtures.every((row) => row.completedAt === null || row.completedAt <= clock));
  });
  await t.test('dashboard gagal tertutup walau lupa memasang router autentikasi', async () => {
    const isolated = createServer(createApp({ config, dashboardRouter, checkDatabase: async () => true }));
    await new Promise((resolve) => isolated.listen(0, '127.0.0.1', resolve));
    try {
      const response = await fetch(`http://127.0.0.1:${isolated.address().port}/api/v1/dashboard`);
      assert.equal(response.status, 401);
    } finally { await new Promise((resolve) => { isolated.close(resolve); isolated.closeAllConnections(); }); }
  });
  await t.test('galat pembacaan data memberi 500 tanpa angka nol atau detail koneksi palsu', async () => {
    const failedDatabase = { collection() { return { aggregate() { throw new Error('mongodb://private-secret'); } }; } };
    const failingRouter = createDashboardRouter({ database: failedDatabase, config });
    const failing = createServer(createApp({ config, authRouter, dashboardRouter: failingRouter, checkDatabase: async () => true }));
    await new Promise((resolve) => failing.listen(0, '127.0.0.1', resolve));
    try {
      const response = await fetch(`http://127.0.0.1:${failing.address().port}/api/v1/dashboard`, { headers: { Cookie: cookie } });
      assert.equal(response.status, 500);
      const result = await response.json();
      assert.equal(result.error.code, 'INTERNAL_ERROR');
      assert.equal(result.data, undefined);
      assert.ok(!JSON.stringify(result).includes('private-secret'));
    } finally { await new Promise((resolve) => { failing.close(resolve); failing.closeAllConnections(); }); }
  });
});
