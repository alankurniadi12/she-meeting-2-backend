import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { MongoClient } from 'mongodb';
import { loadConfig } from '../src/config/env.js';
import { createApp } from '../src/app.js';
import { prepareAuthStore } from '../src/auth/store.js';
import { createAuthRouter } from '../src/auth/router.js';
import { hashPassword, verifyPassword } from '../src/auth/password.js';

// Explicit opt-in; never fall back to the development database or delete existing data.
const uri = process.env.MONGODB_TEST_URI;
test('autentikasi HTTP dan MongoDB nyata', { skip: !uri }, async (t) => {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });
  await client.connect();
  const db = client.db(`she_meeting_test_auth_${randomUUID().replaceAll('-', '')}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  await prepareAuthStore(db);
  const divisionId = (await db.collection('divisions').insertOne({ code: 'CAMP', name: 'Camp', active: true })).insertedId;
  const password = randomUUID();
  const passwordHash = await hashPassword(password);
  const campId = (await db.collection('accounts').insertOne({ username: 'camp', displayName: 'Camp', divisionId,
    role: 'DIVISION', passwordHash, active: true, sessionVersion: 1 })).insertedId;
  await db.collection('accounts').insertOne({ username: 'admin.ict', displayName: 'Admin ICT', divisionId: null,
    role: 'ADMIN', passwordHash, active: true, sessionVersion: 1 });
  const origin = 'http://localhost:5173';
  let clock = new Date();
  const config = loadConfig({ APP_ENV: 'test', MONGODB_DB: db.databaseName });
  const authRouter = await createAuthRouter({ database: db, config, now: () => clock });
  const server = createServer(createApp({ config, authRouter, checkDatabase: async () => true }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }));
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  const request = (path, { method = 'GET', cookie, csrf, body, requestOrigin = origin } = {}) => fetch(`${base}${path}`, {
    method, headers: { ...(requestOrigin ? { Origin: requestOrigin } : {}),
      ...(cookie ? { Cookie: cookie } : {}), ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  async function login(username = 'camp', cookie) {
    const response = await request('/auth/login', { method: 'POST', cookie, body: { username, password } });
    assert.equal(response.status, 200);
    const result = await response.json();
    return { cookie: response.headers.get('set-cookie').split(';')[0], csrf: result.data.csrfToken,
      account: result.data.account, rawCookie: response.headers.get('set-cookie') };
  }
  let camp;
  let admin;
  await t.test('hash Argon2id, salt unik dan sandi salah ditolak', async () => {
    assert.match(passwordHash, /^\$argon2id\$/);
    assert.notEqual(passwordHash, await hashPassword(password));
    assert.equal(await verifyPassword(passwordHash, 'salah'), false);
  });
  await t.test('tanpa sesi seluruh namespace data/admin 401', async () => {
    for (const path of ['/auth/me', '/divisions', '/findings', '/dashboard', '/admin/accounts']) {
      assert.equal((await request(path)).status, 401);
    }
    assert.equal((await request('/divisions', { cookie: 'she_session_dev=forged' })).status, 401);
  });
  await t.test('login memerlukan Origin allowlist dan field tervalidasi', async () => {
    for (const requestOrigin of [null, 'https://evil.invalid']) {
      assert.equal((await request('/auth/login', { method: 'POST', requestOrigin, body: { username: 'camp', password } })).status, 403);
    }
    for (const body of [{ username: { $ne: null }, password }, { username: 'camp', password, role: 'ADMIN' }, { username: 'camp', password: 12 }]) {
      assert.equal((await request('/auth/login', { method: 'POST', body })).status, 422);
    }
  });
  await t.test('username tidak ada dan sandi salah punya respons generik sama', async () => {
    for (const username of ['absent', 'camp']) {
      const response = await request('/auth/login', { method: 'POST', body: { username, password: 'wrong' } });
      assert.equal(response.status, 401);
      assert.equal((await response.json()).error.code, 'INVALID_CREDENTIALS');
    }
  });
  await t.test('login membuat cookie privat, identitas benar, token DB berupa hash', async () => {
    camp = await login();
    assert.equal(camp.account.role, 'DIVISION');
    assert.equal(camp.account.division.name, 'Camp');
    assert.match(camp.rawCookie, /HttpOnly/);
    assert.match(camp.rawCookie, /SameSite=Lax/);
    assert.match(camp.rawCookie, /Path=\//);
    assert.match(camp.rawCookie, /Max-Age=43200/);
    assert.ok(!camp.rawCookie.includes('Domain='));
    const stored = await db.collection('sessions').findOne();
    assert.notEqual(stored._id, camp.cookie.split('=')[1]);
    assert.equal(stored.expiresAt.getTime() - stored.createdAt.getTime(), 43200000);
    const response = await request('/auth/me', camp);
    const text = await response.text();
    assert.equal(response.status, 200);
    assert.ok(!text.includes('passwordHash') && !text.includes('sessionVersion') && !text.includes(stored._id));
  });
  await t.test('divisi tidak boleh admin; payload/cookie tidak menaikkan peran', async () => {
    assert.equal((await request('/admin/accounts', camp)).status, 403);
    const forged = `${camp.cookie}; role=ADMIN`;
    assert.equal((await request('/admin/accounts', { cookie: forged })).status, 403);
    assert.equal((await request('/admin/accounts/fake/reset-password', { ...camp, method: 'POST', body: {} })).status, 403);
    assert.equal((await request('/divisions', camp)).status, 200);
  });
  await t.test('admin mendapat akun aman dengan pagination dan tanpa rahasia', async () => {
    admin = await login('admin.ict');
    const response = await request('/admin/accounts?pageSize=1', admin);
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.meta.total, 2);
    assert.equal(result.data.length, 1);
    const serialized = JSON.stringify(result);
    for (const secret of ['passwordHash', 'sessionVersion', password, 'csrfToken', 'audit']) assert.ok(!serialized.includes(secret));
    for (const query of ['page=0', 'pageSize=101', 'page[$ne]=1', 'page=1&page=2', 'role=ADMIN']) {
      assert.equal((await request(`/admin/accounts?${query}`, admin)).status, 400);
    }
  });
  await t.test('mutasi wajib Origin dan CSRF yang terikat sesi', async () => {
    for (const options of [{ cookie: camp.cookie }, { ...camp, csrf: 'a'.repeat(64) }, { ...camp, csrf: admin.csrf }, { ...camp, requestOrigin: null }, { ...camp, requestOrigin: 'https://evil.invalid' }]) {
      assert.equal((await request('/auth/logout', { ...options, method: 'POST' })).status, 403);
    }
    assert.equal((await request('/auth/me', camp)).status, 200);
  });
  await t.test('admin mengelola akun divisi dummy; reset dan nonaktif mencabut sesi', async () => {
    const secondDivisionId = (await db.collection('divisions').insertOne({ code: 'TRANSPORT', name: 'Transport', active: true })).insertedId;
    const initialPassword = randomUUID(); const mutationId = randomUUID();
    const body = { username: 'transport', displayName: 'Transport', role: 'DIVISION', divisionId: String(secondDivisionId), initialPassword, mutationId };
    assert.equal((await request('/admin/accounts', { ...camp, method: 'POST', body })).status, 403);
    assert.equal((await request('/admin/accounts', { ...admin, method: 'POST', body: { ...body, role: 'ADMIN' } })).status, 403);
    assert.equal((await request('/admin/accounts', { ...admin, method: 'POST', body: { ...body, mutationId: randomUUID(), initialPassword: { invalid: true } } })).status, 422);
    const created = await request('/admin/accounts', { ...admin, method: 'POST', body });
    assert.equal(created.status, 201);
    const account = (await created.json()).data;
    assert.equal(account.version, 1);
    assert.equal((await request('/admin/accounts', { ...admin, method: 'POST', body })).status, 200);
    assert.equal(await db.collection('accounts').countDocuments({ username: 'transport' }), 1);
    const firstLogin = await request('/auth/login', { method: 'POST', body: { username: 'transport', password: initialPassword } });
    assert.equal(firstLogin.status, 200);
    const divisionCookie = firstLogin.headers.get('set-cookie').split(';')[0];
    const resetPassword = randomUUID();
    const resetBody = { version: 1, mutationId: randomUUID(), newPassword: resetPassword };
    assert.equal((await request(`/admin/accounts/${account.id}/reset-password`, { ...admin, method: 'POST', body: { ...resetBody, newPassword: { invalid: true } } })).status, 422);
    assert.equal((await request(`/admin/accounts/${account.id}/reset-password`, { ...admin, method: 'POST', body: resetBody })).status, 200);
    assert.equal((await request('/auth/me', { cookie: divisionCookie })).status, 401);
    assert.equal((await request('/auth/login', { method: 'POST', body: { username: 'transport', password: initialPassword } })).status, 401);
    const secondLogin = await request('/auth/login', { method: 'POST', body: { username: 'transport', password: resetPassword } });
    assert.equal(secondLogin.status, 200);
    const secondCookie = secondLogin.headers.get('set-cookie').split(';')[0];
    const disableBody = { version: 2, mutationId: randomUUID(), active: false };
    assert.equal((await request(`/admin/accounts/${account.id}`, { ...admin, method: 'PATCH', body: disableBody })).status, 200);
    assert.equal((await request('/auth/me', { cookie: secondCookie })).status, 401);
    assert.equal((await request(`/admin/accounts/${account.id}`, { ...admin, method: 'PATCH', body: disableBody })).status, 200);
    const stored = await db.collection('accounts').findOne({ username: 'transport' });
    assert.deepEqual(stored.audit.map((event) => event.action), ['ACCOUNT_CREATED', 'PASSWORD_RESET', 'ACCOUNT_UPDATED']);
    const auditText = JSON.stringify(stored.audit);
    assert.ok(!auditText.includes(initialPassword) && !auditText.includes(resetPassword) && !auditText.includes('passwordHash'));
    assert.equal((await request('/admin/accounts', admin)).status, 200);
  });
  await t.test('master divisi: akses admin, unik, audit, versi dan nonaktif terjaga', async () => {
    assert.equal((await request('/admin/divisions', camp)).status, 403);
    assert.equal((await request('/admin/divisions', { ...camp, method: 'POST', body: {} })).status, 403);
    assert.equal((await request('/admin/divisions?unexpected=1', admin)).status, 400);
    const body = { code: 'DEMO', name: 'Unit Demo', mutationId: randomUUID() };
    const created = await request('/admin/divisions', { ...admin, method: 'POST', body });
    assert.equal(created.status, 201);
    const division = (await created.json()).data;
    assert.equal(division.code, 'DEMO'); assert.equal(division.version, 1);
    assert.equal((await request('/admin/divisions', { ...admin, method: 'POST', body })).status, 200);
    assert.equal((await request('/admin/divisions', { ...admin, method: 'POST', body: { ...body, name: 'Berbeda' } })).status, 409);
    assert.equal((await request('/admin/divisions', { ...admin, method: 'POST', body: { ...body, code: 'OTHER', name: 'unit demo', mutationId: randomUUID() } })).status, 409);
    const rename = { version: 1, mutationId: randomUUID(), name: 'Unit Demo Baru' };
    assert.equal((await request(`/admin/divisions/${division.id}`, { ...admin, method: 'PATCH', body: rename })).status, 200);
    assert.equal((await request(`/admin/divisions/${division.id}`, { ...admin, method: 'PATCH', body: rename })).status, 200);
    assert.equal((await request(`/admin/divisions/${division.id}`, { ...admin, method: 'PATCH', body: { ...rename, mutationId: randomUUID() } })).status, 409);
    const createAccountBody = { username: 'demo.unit', displayName: 'Unit Demo', role: 'DIVISION', divisionId: division.id,
      initialPassword: randomUUID(), mutationId: randomUUID() };
    const accountCreated = await request('/admin/accounts', { ...admin, method: 'POST', body: createAccountBody });
    assert.equal(accountCreated.status, 201);
    const accountId = (await accountCreated.json()).data.id;
    const disable = { version: 2, mutationId: randomUUID(), active: false };
    assert.equal((await request(`/admin/divisions/${division.id}`, { ...admin, method: 'PATCH', body: disable })).status, 409);
    assert.equal((await request(`/admin/accounts/${accountId}`, { ...admin, method: 'PATCH', body: { version: 1, mutationId: randomUUID(), active: false } })).status, 200);
    assert.equal((await request(`/admin/divisions/${division.id}`, { ...admin, method: 'PATCH', body: disable })).status, 200);
    assert.equal((await request(`/admin/accounts/${accountId}`, { ...admin, method: 'PATCH', body: { version: 2, mutationId: randomUUID(), active: true } })).status, 409);
    const listing = await request('/admin/divisions', admin);
    assert.equal(listing.status, 200);
    assert.ok((await listing.json()).data.some((item) => item.id === division.id && item.active === false));
    const stored = await db.collection('divisions').findOne({ code: 'DEMO' });
    assert.deepEqual(stored.audit.map((event) => event.action), ['DIVISION_CREATED', 'DIVISION_UPDATED', 'DIVISION_UPDATED']);
    assert.equal(stored.audit[1].before.name, 'Unit Demo'); assert.equal(stored.audit[1].after.name, 'Unit Demo Baru');
  });
  await t.test('beberapa perangkat: logout mencabut satu sesi saja', async () => {
    const other = await login();
    assert.notEqual(other.cookie, camp.cookie);
    const logout = await request('/auth/logout', { ...other, method: 'POST' });
    assert.equal(logout.status, 204);
    assert.match(logout.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/);
    assert.equal((await request('/auth/me', other)).status, 401);
    assert.equal((await request('/auth/me', camp)).status, 200);
  });
  await t.test('login ulang merotasi token dan mencabut token sebelumnya', async () => {
    const previous = camp;
    camp = await login('camp', previous.cookie);
    assert.notEqual(previous.cookie, camp.cookie);
    assert.equal((await request('/auth/me', previous)).status, 401);
  });
  await t.test('fitur belum tersedia 404 bagi pengguna login', async () => {
    assert.equal((await request('/findings', camp)).status, 404);
    assert.equal((await request('/exports/findings.pdf', admin)).status, 404);
  });
  await t.test('sesi kedaluwarsa ditolak walau TTL MongoDB belum menghapus', async () => {
    clock = new Date(clock.getTime() + 12 * 60 * 60 * 1000);
    assert.equal((await request('/auth/me', camp)).status, 401);
    assert.ok(await db.collection('sessions').countDocuments() > 0);
  });
  await t.test('akun nonaktif dan sessionVersion baru langsung mencabut akses', async () => {
    camp = await login();
    await db.collection('accounts').updateOne({ _id: campId }, { $set: { active: false } });
    assert.equal((await request('/auth/me', camp)).status, 401);
    await db.collection('accounts').updateOne({ _id: campId }, { $set: { active: true }, $inc: { sessionVersion: 1 } });
    assert.equal((await request('/auth/me', camp)).status, 401);
    const response = await request('/auth/login', { method: 'POST', body: { username: 'camp', password } });
    assert.equal(response.status, 200);
  });
  await t.test('rate limit username bertahan saat router/API dibuat ulang', async () => {
    await db.collection('loginAttempts').deleteMany({});
    for (let index = 0; index < 10; index++) {
      assert.equal((await request('/auth/login', { method: 'POST', body: { username: 'unknown', password: 'wrong' } })).status, 401);
    }
    const limited = await request('/auth/login', { method: 'POST', body: { username: 'unknown', password: 'wrong' } });
    assert.equal(limited.status, 429);
    assert.ok(Number(limited.headers.get('retry-after')) > 0);
    const recreated = await createAuthRouter({ database: db, config, now: () => clock });
    const restarted = createServer(createApp({ config, authRouter: recreated, checkDatabase: async () => true }));
    await new Promise((resolve) => restarted.listen(0, '127.0.0.1', resolve));
    try {
      const response = await fetch(`http://127.0.0.1:${restarted.address().port}/api/v1/auth/login`, {
        method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'unknown', password: 'wrong' }),
      });
      assert.equal(response.status, 429);
    } finally { await new Promise((resolve) => { restarted.close(resolve); restarted.closeAllConnections(); }); }
    clock = new Date(clock.getTime() + 15 * 60 * 1000);
    assert.equal((await request('/auth/login', { method: 'POST', body: { username: 'unknown', password: 'wrong' } })).status, 401);
  });
  await t.test('rotasi username tetap dibatasi per IP, X-Forwarded-For tidak dipercaya', async () => {
    await db.collection('loginAttempts').deleteMany({});
    for (let index = 0; index < 30; index++) {
      // Invalid passwords stop before Argon2 but must still consume the IP budget.
      assert.equal((await request('/auth/login', { method: 'POST', body: { username: `user${index}`, password: 42 } })).status, 422);
    }
    const response = await fetch(`${base}/auth/login`, {
      method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'X-Forwarded-For': '192.0.2.1' },
      body: JSON.stringify({ username: 'new-user', password }),
    });
    assert.equal(response.status, 429);
    await db.collection('loginAttempts').deleteMany({});
  });
  await t.test('cookie demo HTTPS memakai __Host-, Secure dan logout menghapus cookie yang sama', async () => {
    const secureOrigin = 'https://she.example.com';
    const secureConfig = loadConfig({ APP_ENV: 'demo', MONGODB_DB: 'she_meeting_demo', ALLOWED_ORIGINS: secureOrigin });
    const secureRouter = await createAuthRouter({ database: db, config: secureConfig, now: () => clock });
    const secureServer = createServer(createApp({ config: secureConfig, authRouter: secureRouter, checkDatabase: async () => true }));
    await new Promise((resolve) => secureServer.listen(0, '127.0.0.1', resolve));
    try {
      const response = await fetch(`http://127.0.0.1:${secureServer.address().port}/api/v1/auth/login`, {
        method: 'POST', headers: { Origin: secureOrigin, 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'admin.ict', password }),
      });
      assert.equal(response.status, 200);
      const cookie = response.headers.get('set-cookie');
      assert.match(cookie, /^__Host-she_session=/);
      assert.match(cookie, /; Secure/);
      assert.ok(!cookie.includes('Domain='));
      const csrf = (await response.json()).data.csrfToken;
      const logout = await fetch(`http://127.0.0.1:${secureServer.address().port}/api/v1/auth/logout`, {
        method: 'POST', headers: { Origin: secureOrigin, Cookie: cookie.split(';')[0], 'X-CSRF-Token': csrf },
      });
      assert.equal(logout.status, 204);
      assert.match(logout.headers.get('set-cookie'), /^__Host-she_session=.*; Secure/);
    } finally { await new Promise((resolve) => { secureServer.close(resolve); secureServer.closeAllConnections(); }); }
    // Header-level test over loopback; this does not prove cross-subdomain browser/TLS deployment.
  });
});
