import { createHash, randomUUID } from 'node:crypto';
import { BSON, ObjectId } from 'mongodb';
import { hashPassword } from './password.js';
import { publicAccount } from './store.js';
import { findingError, envelope, objectId, text } from '../findings/validation.js';
const fail = (status, code, message) => findingError(status, code, message);
const username = (value) => {
  if (typeof value !== 'string' || !/^[a-z0-9._-]{3,64}$/.test(value.trim().toLowerCase())) throw fail(422, 'VALIDATION_FAILED', 'Username harus 3–64 karakter huruf kecil, angka, titik, garis, atau garis bawah.');
  return value.trim().toLowerCase();
};
const password = (value) => {
  if (typeof value !== 'string' || value.length < 12 || value.length > 128) throw fail(422, 'VALIDATION_FAILED', 'Kata sandi harus 12–128 karakter.');
  return value;
};
const digest = (kind, body, admin) => createHash('sha256').update(JSON.stringify({ kind, admin: String(admin._id),
  body: Object.fromEntries(Object.entries(body).filter(([key]) => key !== 'mutationId').sort().map(([key, value]) =>
    [key, key.endsWith('Password') && typeof value === 'string' ? createHash('sha256').update(value).digest('hex') : value])) })).digest('hex');
const capacity = (row) => {
  if (BSON.calculateObjectSize(row) > 8 * 1024 * 1024) throw fail(409, 'HISTORY_CAPACITY_REACHED', 'Kapasitas riwayat akun tercapai. Hubungi ICT.');
};
const receipt = (row, mutationId, hash) => {
  const found = (row.mutationReceipts || []).find((item) => item.mutationId === mutationId);
  if (!found) return null;
  if (found.requestHash !== hash) throw fail(409, 'MUTATION_REUSED', 'ID operasi sudah digunakan untuk isian berbeda.');
  return { data: found.result, meta: { replayed: true } };
};
const actor = (admin) => ({ accountId: admin._id, username: admin.username, displayName: admin.displayName, source: 'ACCOUNT' });
const summary = (row, division) => ({ ...publicAccount(row, division), version: row.version });
async function identity(database, row) {
  const division = row.divisionId ? await database.collection('divisions').findOne({ _id: row.divisionId }) : null;
  return summary(row, division);
}
export async function createAccount(database, { body, admin, now = new Date() }) {
  envelope(body, ['username', 'displayName', 'role', 'divisionId', 'initialPassword']);
  const accounts = database.collection('accounts'); const mutationId = body.mutationId.toLowerCase(); const hash = digest('ACCOUNT_CREATED', body, admin);
  const previous = await accounts.findOne({ createMutationId: mutationId });
  if (previous) return receipt(previous, mutationId, hash);
  const name = username(body.username); const displayName = text(body.displayName, 'displayName', 1, 120);
  if (body.role !== 'DIVISION') throw fail(403, 'FORBIDDEN', 'Pembuatan admin tambahan belum tersedia.');
  const divisionId = objectId(body.divisionId, 'divisionId');
  if (!await database.collection('divisions').findOne({ _id: divisionId, active: true })) throw fail(422, 'VALIDATION_FAILED', 'Pilih divisi aktif.');
  const row = { _id: new ObjectId(), username: name, displayName, role: body.role, divisionId,
    passwordHash: await hashPassword(password(body.initialPassword)), active: true, sessionVersion: 1, version: 1,
    createMutationId: mutationId, createdAt: now, updatedAt: now };
  const result = await identity(database, row);
  row.audit = [{ id: randomUUID(), action: 'ACCOUNT_CREATED', actor: actor(admin), timestamp: now, revision: 1,
    before: null, after: { username: name, displayName, role: row.role, divisionId, active: true } }];
  row.mutationReceipts = [{ mutationId, requestHash: hash, result }];
  capacity(row);
  try { await accounts.insertOne(row); }
  catch (error) {
    if (error.code !== 11000) throw error;
    const repeated = await accounts.findOne({ createMutationId: mutationId });
    if (repeated) return receipt(repeated, mutationId, hash);
    throw fail(409, 'ACCOUNT_EXISTS', 'Username atau akun aktif divisi sudah tersedia.');
  }
  return { data: result, meta: { replayed: false } };
}
export async function updateAccount(database, { id, body, admin, now = new Date(), reset = false }) {
  envelope(body, reset ? ['newPassword'] : ['displayName', 'active'], true);
  const accounts = database.collection('accounts'); const _id = objectId(id); const mutationId = body.mutationId.toLowerCase();
  const hash = digest(reset ? 'PASSWORD_RESET' : 'ACCOUNT_UPDATED', body, admin);
  const row = await accounts.findOne({ _id });
  if (!row) throw fail(404, 'NOT_FOUND', 'Akun tidak ditemukan.');
  const repeated = receipt(row, mutationId, hash); if (repeated) return repeated;
  if (row.role !== 'DIVISION') throw fail(403, 'FORBIDDEN', 'Perubahan akun admin belum tersedia.');
  if (row.version !== body.version) throw Object.assign(fail(409, 'VERSION_CONFLICT', 'Akun berubah. Muat ulang daftar.'), { currentVersion: row.version });
  const changes = {};
  if (reset) changes.passwordHash = await hashPassword(password(body.newPassword));
  else {
    if (body.displayName !== undefined) changes.displayName = text(body.displayName, 'displayName', 1, 120);
    if (body.active !== undefined) {
      if (typeof body.active !== 'boolean') throw fail(422, 'VALIDATION_FAILED', 'Status akun tidak valid.');
      changes.active = body.active;
    }
    if (!Object.keys(changes).length || Object.entries(changes).every(([key, value]) => row[key] === value)) throw fail(422, 'NO_CHANGES', 'Tidak ada perubahan akun.');
    if (changes.active === true && await accounts.findOne({ role: 'DIVISION', divisionId: row.divisionId, active: true, _id: { $ne: _id } })) throw fail(409, 'DIVISION_ACCOUNT_EXISTS', 'Sudah ada akun aktif untuk divisi ini.');
  }
  const revoke = reset || (changes.active === false && row.active);
  const next = { ...row, ...changes, version: row.version + 1, sessionVersion: row.sessionVersion + (revoke ? 1 : 0), updatedAt: now };
  const result = await identity(database, next);
  const event = { id: randomUUID(), action: reset ? 'PASSWORD_RESET' : 'ACCOUNT_UPDATED', actor: actor(admin), timestamp: now,
    revision: next.version, before: reset ? null : Object.fromEntries(Object.keys(changes).map((key) => [key, row[key]])),
    after: reset ? null : changes };
  const nextReceipt = { mutationId, requestHash: hash, result };
  capacity({ ...next, audit: [...(row.audit || []), event], mutationReceipts: [...(row.mutationReceipts || []), nextReceipt] });
  let saved;
  try { saved = await accounts.updateOne({ _id, version: row.version }, {
    $set: { ...changes, updatedAt: now, ...(revoke ? { sessionVersion: next.sessionVersion } : {}) },
    $inc: { version: 1 }, $push: { audit: event, mutationReceipts: nextReceipt },
  }); } catch (error) {
    if (error.code === 11000) throw fail(409, 'DIVISION_ACCOUNT_EXISTS', 'Sudah ada akun aktif untuk divisi ini.');
    throw error;
  }
  if (!saved.matchedCount) {
    const current = await accounts.findOne({ _id });
    const concurrent = current && receipt(current, mutationId, hash); if (concurrent) return concurrent;
    throw Object.assign(fail(409, 'VERSION_CONFLICT', 'Akun berubah. Muat ulang daftar.'), { currentVersion: current?.version });
  }
  if (revoke) await database.collection('sessions').deleteMany({ accountId: _id });
  return { data: result, meta: { replayed: false } };
}
