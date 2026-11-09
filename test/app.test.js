import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';

async function serve(t, checkDatabase = async () => true) {
  const server = createServer(createApp({ config: loadConfig({}), checkDatabase }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }));
  return `http://127.0.0.1:${server.address().port}`;
}
test('health minimal, no-store, tidak membocorkan DB atau stack', async (t) => {
  const url = await serve(t);
  const response = await fetch(`${url}/health`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-powered-by'), null);
  assert.deepEqual(await response.json(), { data: { status: 'ok', service: 'she-meeting-api' } });
});
test('readiness mengembalikan 503 bila MongoDB tidak siap', async (t) => {
  const url = await serve(t, async () => { throw new Error('mongo://secret'); });
  const response = await fetch(`${url}/ready`);
  assert.equal(response.status, 503);
  const data = await response.json();
  assert.equal(data.error.code, 'NOT_READY');
  assert.ok(!JSON.stringify(data).includes('secret'));
});
test('namespace data ditutup sebelum implementasi autentikasi', async (t) => {
  const url = await serve(t);
  for (const path of ['/api/v1/findings', '/api/v1/admin/accounts', '/api/v1/dashboard']) {
    const response = await fetch(`${url}${path}`);
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error.code, 'UNAUTHENTICATED');
  }
});
test('origin tidak diizinkan ditolak; origin development mendapat credentials', async (t) => {
  const url = await serve(t);
  const denied = await fetch(`${url}/health`, { headers: { Origin: 'https://untrusted.invalid' } });
  assert.equal(denied.status, 403);
  assert.equal(denied.headers.get('access-control-allow-origin'), null);
  const allowed = await fetch(`${url}/health`, { headers: { Origin: 'http://localhost:5173' } });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  assert.equal(allowed.headers.get('access-control-allow-credentials'), 'true');
});
test('JSON rusak dan payload besar tidak membocorkan detail internal', async (t) => {
  const url = await serve(t);
  const invalid = await fetch(`${url}/api/v1/findings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(invalid.status, 400);
  const oversized = await fetch(`${url}/api/v1/findings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: 'x'.repeat(70000) }) });
  assert.equal(oversized.status, 413);
});
