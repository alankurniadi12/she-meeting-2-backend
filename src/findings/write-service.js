import { BSON, ObjectId } from 'mongodb';
import { createHash, randomUUID } from 'node:crypto';
import { calendarDate } from '../lib/calendar.js';
import { coreFields, progressFields, envelope, objectId, text, validateCore, findingError } from './validation.js';

const businessFields = [...coreFields, 'status', 'holdReason', 'completedAt'];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const notFound = () => findingError(404, 'NOT_FOUND', 'Temuan tidak ditemukan.');
const conflict = (row) => findingError(409, 'VERSION_CONFLICT', 'Data sudah diubah akun lain. Draf Anda tetap tersedia; tinjau versi terbaru sebelum menyimpan ulang.', { currentVersion: row.version });
const acknowledgement = (row) => ({ id: row._id.toString(), reference: row.reference, version: row.version, status: row.status, updatedAt: row.updatedAt });
const snapshot = (row) => Object.fromEntries(businessFields.map((key) => [key, row[key] ?? null]));
function requestHash(kind, body, account) {
  const canonical = Object.fromEntries(Object.keys(body).filter((key) => key !== 'mutationId').sort().map((key) => [key, body[key]]));
  return createHash('sha256').update(JSON.stringify({ kind, account: String(account._id), body: canonical })).digest('hex');
}
function replay(row, mutationId, hash) {
  const receipt = (row.mutationReceipts || []).find((item) => item.mutationId === mutationId);
  if (!receipt) return null;
  if (receipt.requestHash !== hash) throw findingError(409, 'MUTATION_REUSED', 'ID operasi sudah dipakai untuk isian berbeda. Muat ulang data sebelum mencoba kembali.');
  return { data: receipt.result, meta: { replayed: true } };
}
async function actorSnapshot(database, account) {
  const division = account.divisionId ? await database.collection('divisions').findOne({ _id: account.divisionId }) : null;
  return { accountId: account._id, username: account.username, displayName: account.displayName,
    divisionId: account.divisionId ?? null, divisionName: division?.name ?? null, source: 'ACCOUNT' };
}
async function divisionSnapshots(database, ...rows) {
  const ids = [...new Map(rows.flatMap((row) => [row.reporterDivisionId, ...(row.responsibleDivisionIds || [])])
    .filter(Boolean).map((id) => [String(id), id])).values()];
  const divisions = await database.collection('divisions').find({ _id: { $in: ids } }, { projection: { code: 1, name: 1 } }).toArray();
  return divisions.map((division) => ({ id: division._id, code: division.code, name: division.name }));
}
function capacity(row) {
  if (BSON.calculateObjectSize(row) > 8 * 1024 * 1024) throw findingError(409, 'HISTORY_CAPACITY_REACHED', 'Kapasitas riwayat temuan tercapai. Hubungi ICT; data tidak dihapus.');
}
export async function createFinding(database, { body, account, timeZone, now = new Date() }) {
  envelope(body, coreFields);
  const mutationId = body.mutationId.toLowerCase();
  const hash = requestHash('CREATE', body, account);
  const collection = database.collection('findings');
  const previous = await collection.findOne({ createMutationId: mutationId });
  if (previous) return replay(previous, mutationId, hash);
  const fields = await validateCore(database, body, calendarDate(now, timeZone));
  const actor = await actorSnapshot(database, account);
  const divisions = await divisionSnapshots(database, fields);
  const id = new ObjectId();
  const row = { _id: id, ...fields, reference: `SM-${fields.reportedDate.slice(0, 4)}-${id}`, status: 'IN_PROGRESS', holdReason: null, completedAt: null,
    cancelledAt: null, cancellationReason: null, cancelledBy: null, version: 1, createMutationId: mutationId,
    createdAt: now, updatedAt: now, createdBy: actor, updatedBy: actor, attachments: [], progressEntries: [],
    audit: [{ id: randomUUID(), action: 'CREATED', actor, timestamp: now, revision: 1, mutationId, divisionSnapshots: divisions, before: null, after: snapshot({ ...fields, status: 'IN_PROGRESS', holdReason: null, completedAt: null }) }],
  };
  row.mutationReceipts = [{ mutationId, requestHash: hash, result: acknowledgement(row) }];
  capacity(row);
  try { await collection.insertOne(row); }
  catch (error) {
    if (error.code !== 11000) throw error;
    const duplicate = await collection.findOne({ createMutationId: mutationId });
    if (!duplicate) throw error;
    return replay(duplicate, mutationId, hash);
  }
  return { data: acknowledgement(row), meta: { replayed: false } };
}

export async function updateFinding(database, { id, body, account, timeZone, now = new Date(), kind = 'CORRECT' }) {
  objectId(id);
  envelope(body, kind === 'PROGRESS' ? progressFields : coreFields, true);
  const mutationId = body.mutationId.toLowerCase();
  const hash = requestHash(kind, body, account);
  const collection = database.collection('findings');
  const row = await collection.findOne({ _id: objectId(id) });
  if (!row) throw notFound();
  const repeated = replay(row, mutationId, hash);
  if (repeated) return repeated;
  if (row.cancelledAt) throw findingError(409, 'FINDING_CANCELLED', 'Temuan dibatalkan dan tidak dapat diubah.');
  if (row.version !== body.version) throw conflict(row);
  const fields = kind === 'CORRECT' ? await validateCore(database, body, calendarDate(now, timeZone), row) : {};
  let progress = null;
  let correctionReason = null;
  if (kind === 'PROGRESS') {
    const status = body.status === undefined ? row.status : body.status;
    if (!['IN_PROGRESS', 'ON_HOLD', 'COMPLETED'].includes(status)) throw findingError(422, 'VALIDATION_FAILED', 'Status tidak valid.', { fields: { status: 'Pilih status pekerjaan yang valid.' } });
    const core = await validateCore(database, { priority: body.priority, targetDate: body.targetDate }, calendarDate(now, timeZone), row);
    fields.priority = core.priority; fields.targetDate = core.targetDate; fields.status = status;
    fields.holdReason = status === 'ON_HOLD' ? text(body.holdReason === undefined ? row.holdReason : body.holdReason, 'holdReason', 1, 2000) : null;
    if (status !== 'ON_HOLD' && body.holdReason != null && body.holdReason !== '') throw findingError(422, 'VALIDATION_FAILED', 'Alasan tunda hanya untuk status Tertunda.', { fields: { holdReason: 'Kosongkan alasan saat bukan Tertunda.' } });
    fields.completedAt = status === 'COMPLETED' ? (row.status === 'COMPLETED' ? row.completedAt : now) : null;
    if (row.status === 'COMPLETED' && status !== 'COMPLETED') correctionReason = text(body.correctionReason, 'correctionReason', 1, 2000);
    else if (body.correctionReason) correctionReason = text(body.correctionReason, 'correctionReason', 1, 2000);
    if (body.text != null && body.text !== '') progress = text(body.text, 'text', 1, 2000);
  }
  const changes = Object.fromEntries(Object.entries(fields).filter(([key, value]) => !same(value, row[key] ?? null)));
  if (!Object.keys(changes).length && !progress) throw findingError(422, 'NO_CHANGES', 'Isi catatan progres atau ubah setidaknya satu kolom.');
  const actor = await actorSnapshot(database, account);
  const next = { ...row, ...changes, version: row.version + 1, updatedBy: actor, updatedAt: now };
  const before = Object.fromEntries(Object.keys(changes).map((key) => [key, row[key] ?? null]));
  const event = { id: randomUUID(), action: kind === 'PROGRESS' ? 'PROGRESS_UPDATED' : 'CORRECTED', actor, timestamp: now,
    revision: next.version, mutationId, before, after: changes, correctionReason, divisionSnapshots: await divisionSnapshots(database, row, next) };
  const entry = progress ? { id: randomUUID(), text: progress, actor, timestamp: now, revision: next.version } : null;
  if (entry) event.progressEntryId = entry.id;
  const receipt = { mutationId, requestHash: hash, result: acknowledgement(next) };
  capacity({ ...next, audit: [...(row.audit || []), event], progressEntries: [...(row.progressEntries || []), ...(entry ? [entry] : [])], mutationReceipts: [...(row.mutationReceipts || []), receipt] });
  const push = { audit: event, mutationReceipts: receipt };
  if (entry) push.progressEntries = entry;
  const saved = await collection.updateOne({ _id: row._id, version: row.version, cancelledAt: null }, {
    $set: { ...changes, updatedBy: actor, updatedAt: now }, $inc: { version: 1 }, $push: push,
  });
  if (!saved.matchedCount) {
    const current = await collection.findOne({ _id: row._id });
    if (!current) throw notFound();
    const concurrentReplay = replay(current, mutationId, hash);
    if (concurrentReplay) return concurrentReplay;
    throw current.cancelledAt ? findingError(409, 'FINDING_CANCELLED', 'Temuan sudah dibatalkan.') : conflict(current);
  }
  return { data: acknowledgement(next), meta: { replayed: false } };
}

export async function changeCancellation(database, { id, body, account, now = new Date(), kind }) {
  if (kind === 'RESTORE' && account.role !== 'ADMIN') throw findingError(403, 'FORBIDDEN', 'Hanya admin yang dapat memulihkan temuan.');
  const _id = objectId(id);
  envelope(body, ['reason'], true);
  const reason = text(body.reason, 'reason', 1, 2000);
  const mutationId = body.mutationId.toLowerCase();
  const hash = requestHash(kind, body, account);
  const collection = database.collection('findings');
  const row = await collection.findOne({ _id });
  if (!row) throw notFound();
  const repeated = replay(row, mutationId, hash);
  if (repeated) return repeated;
  if (kind === 'CANCEL' && row.cancelledAt) throw findingError(409, 'ALREADY_CANCELLED', 'Temuan sudah dibatalkan.');
  if (kind === 'RESTORE' && !row.cancelledAt) throw findingError(409, 'NOT_CANCELLED', 'Temuan tidak sedang dibatalkan.');
  if (row.version !== body.version) throw conflict(row);
  const actor = await actorSnapshot(database, account);
  const changes = kind === 'CANCEL' ? { cancelledAt: now, cancellationReason: reason, cancelledBy: actor }
    : { cancelledAt: null, cancellationReason: null, cancelledBy: null };
  const next = { ...row, ...changes, version: row.version + 1, updatedBy: actor, updatedAt: now };
  const before = { cancelledAt: row.cancelledAt ?? null, cancellationReason: row.cancellationReason ?? null, cancelledBy: row.cancelledBy ?? null };
  const event = { id: randomUUID(), action: kind === 'CANCEL' ? 'CANCELLED' : 'RESTORED', actor, timestamp: now,
    revision: next.version, mutationId, reason, before, after: changes, divisionSnapshots: await divisionSnapshots(database, row) };
  const receipt = { mutationId, requestHash: hash, result: acknowledgement(next) };
  capacity({ ...next, audit: [...(row.audit || []), event], mutationReceipts: [...(row.mutationReceipts || []), receipt] });
  const saved = await collection.updateOne({ _id, version: row.version, cancelledAt: kind === 'CANCEL' ? null : { $ne: null } }, {
    $set: { ...changes, updatedBy: actor, updatedAt: now }, $inc: { version: 1 }, $push: { audit: event, mutationReceipts: receipt },
  });
  if (!saved.matchedCount) {
    const current = await collection.findOne({ _id });
    if (!current) throw notFound();
    const concurrentReplay = replay(current, mutationId, hash);
    if (concurrentReplay) return concurrentReplay;
    throw conflict(current);
  }
  return { data: acknowledgement(next), meta: { replayed: false } };
}
