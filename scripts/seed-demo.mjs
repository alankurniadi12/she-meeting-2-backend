import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { mkdir, open, readFile } from 'node:fs/promises';
import { loadConfig } from '../src/config/env.js';
import { connectDatabase } from '../src/lib/database.js';
import { prepareAuthStore } from '../src/auth/store.js';
import { hashPassword } from '../src/auth/password.js';

const config = loadConfig();
// Seed is intentionally confined to the local development environment for D0-02.
if (config.appEnv !== 'development' || !config.databaseName.startsWith('she_meeting_dev') ||
    !/^mongodb:\/\/(127\.0\.0\.1|localhost):\d+\/?$/.test(config.mongoUri)) {
  throw new Error('Seed hanya diizinkan pada MongoDB development loopback tanpa kredensial.');
}
const directory = new URL('../.local/', import.meta.url);
const credentialsPath = new URL('demo-accounts.json', directory);
await mkdir(directory, { recursive: true, mode: 0o700 });
let credentials;
try { credentials = JSON.parse(await readFile(credentialsPath, 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; credentials = {}; }
// Persist each newly generated password BEFORE insert, so a failed run can safely retry.
async function persist() {
  const file = await open(credentialsPath, 'w', 0o600);
  try { await file.chmod(0o600); await file.writeFile(`${JSON.stringify(credentials, null, 2)}\n`); }
  finally { await file.close(); }
}
let client;
try {
  const connection = await connectDatabase(config);
  client = connection.client;
  const db = connection.database;
  await prepareAuthStore(db);
  const divisionIds = {};
  for (const [code, name] of [['CAMP', 'Camp'], ['TRANSPORT', 'Transport'], ['ICT', 'ICT']]) {
    const now = new Date();
    const division = await db.collection('divisions').findOneAndUpdate({ code }, { $setOnInsert: {
      code, name, active: true, version: 1, audit: [], createdAt: now, updatedAt: now, seedKey: 'D0-02',
    } }, { upsert: true, returnDocument: 'after' });
    if (division.seedKey !== 'D0-02') throw new Error('Kode divisi bertabrakan dengan data lain. Seed dihentikan tanpa menimpa.');
    divisionIds[code] = division._id;
  }
  for (const [username, displayName, code, role] of [
    ['camp', 'Camp', 'CAMP', 'DIVISION'], ['transport', 'Transport', 'TRANSPORT', 'DIVISION'],
    ['ict', 'ICT', 'ICT', 'DIVISION'], ['admin.ict', 'Admin ICT', null, 'ADMIN'],
  ]) {
    const existing = await db.collection('accounts').findOne({ username });
    if (existing) {
      if (existing.seedKey !== 'D0-02') throw new Error('Username bertabrakan dengan data lain. Seed dihentikan tanpa menimpa.');
      continue; // Never reset a password, reactivate an account, or change a role on rerun.
    }
    const password = credentials[username]?.password || randomBytes(18).toString('base64url');
    credentials[username] = { username, password, displayName, database: config.databaseName };
    await persist();
    const now = new Date();
    await db.collection('accounts').updateOne({ username }, { $setOnInsert: {
      username, displayName, divisionId: code ? divisionIds[code] : null, role,
      passwordHash: await hashPassword(password), active: true, sessionVersion: 1, version: 1,
      audit: [], createdAt: now, updatedAt: now, seedKey: 'D0-02',
    } }, { upsert: true });
  }
  console.log('Seed dummy selesai: Camp, Transport, ICT, Admin ICT. Tidak ada temuan yang dibuat.');
  console.log('Kredensial lokal: .local/demo-accounts.json (privat, diabaikan Git). Seed ulang tidak mereset akun.');
} finally { await client?.close(); }
