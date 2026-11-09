import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config/env.js';

test('default memakai database dan port development terpisah', () => {
  const config = loadConfig({});
  assert.equal(config.databaseName, 'she_meeting_dev');
  assert.equal(config.mongoUri, 'mongodb://127.0.0.1:27027');
  assert.equal(config.host, '127.0.0.1');
});
test('test/demo tidak boleh menyasar database development atau sistem', () => {
  for (const env of [
    { APP_ENV: 'test', MONGODB_DB: 'she_meeting_dev' },
    { APP_ENV: 'demo', MONGODB_DB: 'she_meeting_dev' },
    { MONGODB_DB: 'admin' }, { APP_ENV: 'production' },
  ]) assert.throws(() => loadConfig(env));
});
test('port dan wildcard CORS ditolak', () => {
  for (const env of [{ PORT: '-1' }, { PORT: '0' }, { PORT: 'abc' }, { PORT: '65536' }, { ALLOWED_ORIGINS: '*' }, { ALLOWED_ORIGINS: 'https://example.com/path' }]) {
    assert.throws(() => loadConfig(env));
  }
});
test('demo wajib cookie Secure dengan origin HTTPS; lokal HTTP hanya development/test', () => {
  for (const env of [
    { COOKIE_SECURE: 'yes' }, { COOKIE_SECURE: 'true' },
    { APP_ENV: 'demo', MONGODB_DB: 'she_meeting_demo', COOKIE_SECURE: 'false' },
    { APP_ENV: 'demo', MONGODB_DB: 'she_meeting_demo' },
  ]) assert.throws(() => loadConfig(env));
  assert.equal(loadConfig({ APP_ENV: 'demo', MONGODB_DB: 'she_meeting_demo', ALLOWED_ORIGINS: 'https://frontend.example.com' }).cookieSecure, true);
});
