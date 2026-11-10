import { BSON, ObjectId } from 'mongodb';
import { createHash, randomUUID } from 'node:crypto';
import { envelope, findingError, objectId, text } from '../findings/validation.js';
const fail = (status, code, message, details = {}) => findingError(status, code, message, details);
const actor = (admin) => ({ accountId: admin._id, username: admin.username, displayName: admin.displayName, source: 'ACCOUNT' });
const publicDivision = (row) => ({ id: String(row._id), code: row.code, name: row.name, active: row.active, version: row.version });
const hashRequest = (kind, body, admin) => createHash('sha256').update(JSON.stringify({ kind, admin: String(admin._id),
  body: Object.fromEntries(Object.entries(body).filter(([key]) => key !== 'mutationId').sort()) })).digest('hex');
const replay = (row, mutationId, hash) => {
  const found = (row.mutationReceipts || []).find((item) => item.mutationId === mutationId);
  if (!found) return null;
  if (found.requestHash !== hash) throw fail(409, 'MUTATION_REUSED', 'ID operasi sudah digunakan untuk isian berbeda.');
  return { data: found.result, meta: { replayed: true } };
};
const capacity = (row) => {
  if (BSON.calculateObjectSize(row) > 8 * 1024 * 1024) throw fail(409, 'HISTORY_CAPACITY_REACHED', 'Kapasitas riwayat divisi tercapai. Hubungi ICT.');
};
const divisionCode = (value) => {
  if (typeof value !== 'string' || !/^[A-Z0-9_-]{2,20}$/.test(value.trim().toUpperCase())) throw fail(422, 'VALIDATION_FAILED', 'Kode divisi harus 2–20 karakter huruf, angka, garis atau garis bawah.');
  return value.trim().toUpperCase();
};
export async function listAdminDivisions(database, query) {
  if (Object.keys(query).length) throw fail(400, 'INVALID_QUERY', 'Filter master divisi tidak valid.');
  const rows = await database.collection('divisions').find({}).sort({ name: 1 }).toArray();
  return { data: rows.map(publicDivision) };
}
export async function createDivision(database, { body, admin, now = new Date() }) {
  envelope(body, ['code', 'name']);
  const mutationId = body.mutationId.toLowerCase(); const hash = hashRequest('DIVISION_CREATED', body, admin);
  const divisions = database.collection('divisions');
  const previous = await divisions.findOne({ createMutationId: mutationId });
  if (previous) return replay(previous, mutationId, hash);
  const code = divisionCode(body.code); const name = text(body.name, 'name', 1, 80);
  const row = { _id: new ObjectId(), code, name, active: true, version: 1, createMutationId: mutationId,
    createdAt: now, updatedAt: now };
  const result = publicDivision(row);
  row.audit = [{ id: randomUUID(), action: 'DIVISION_CREATED', actor: actor(admin), timestamp: now,
    revision: 1, before: null, after: { code, name, active: true } }];
  row.mutationReceipts = [{ mutationId, requestHash: hash, result }];
  capacity(row);
  try { await divisions.insertOne(row); }
  catch (error) {
    if (error.code !== 11000) throw error;
    const repeated = await divisions.findOne({ createMutationId: mutationId });
    if (repeated) return replay(repeated, mutationId, hash);
    throw fail(409, 'DIVISION_EXISTS', 'Kode atau nama divisi sudah tersedia.');
  }
  return { data: result, meta: { replayed: false } };
}
export async function updateDivision(database, { id, body, admin, now = new Date() }) {
  envelope(body, ['name', 'active'], true);
  const _id = objectId(id); const mutationId = body.mutationId.toLowerCase(); const hash = hashRequest('DIVISION_UPDATED', body, admin);
  const divisions = database.collection('divisions'); const row = await divisions.findOne({ _id });
  if (!row) throw fail(404, 'NOT_FOUND', 'Divisi tidak ditemukan.');
  const repeated = replay(row, mutationId, hash); if (repeated) return repeated;
  if (row.version !== body.version) throw fail(409, 'VERSION_CONFLICT', 'Divisi berubah. Muat ulang daftar.', { currentVersion: row.version });
  const changes = {};
  if (body.name !== undefined) changes.name = text(body.name, 'name', 1, 80);
  if (body.active !== undefined) {
    if (typeof body.active !== 'boolean') throw fail(422, 'VALIDATION_FAILED', 'Status divisi tidak valid.');
    changes.active = body.active;
  }
  for (const key of Object.keys(changes)) if (changes[key] === row[key]) delete changes[key];
  if (!Object.keys(changes).length) throw fail(422, 'NO_CHANGES', 'Tidak ada perubahan divisi.');
  if (changes.active === false && await database.collection('accounts').countDocuments({ role: 'DIVISION', divisionId: _id, active: true })) {
    throw fail(409, 'DIVISION_HAS_ACTIVE_ACCOUNT', 'Nonaktifkan akun divisi terkait terlebih dahulu.');
  }
  const next = { ...row, ...changes, version: row.version + 1, updatedAt: now };
  const result = publicDivision(next);
  const event = { id: randomUUID(), action: 'DIVISION_UPDATED', actor: actor(admin), timestamp: now, revision: next.version,
    before: Object.fromEntries(Object.keys(changes).map((key) => [key, row[key]])), after: changes };
  const nextReceipt = { mutationId, requestHash: hash, result };
  capacity({ ...next, audit: [...(row.audit || []), event], mutationReceipts: [...(row.mutationReceipts || []), nextReceipt] });
  let saved;
  try { saved = await divisions.updateOne({ _id, version: row.version }, {
    $set: { ...changes, updatedAt: now }, $inc: { version: 1 }, $push: { audit: event, mutationReceipts: nextReceipt },
  }); } catch (error) {
    if (error.code === 11000) throw fail(409, 'DIVISION_EXISTS', 'Nama divisi sudah tersedia.');
    throw error;
  }
  if (!saved.matchedCount) {
    const current = await divisions.findOne({ _id }); const concurrent = current && replay(current, mutationId, hash);
    if (concurrent) return concurrent;
    throw fail(409, 'VERSION_CONFLICT', 'Divisi berubah. Muat ulang daftar.', { currentVersion: current?.version });
  }
  return { data: result, meta: { replayed: false } };
}
