import Busboy from 'busboy';
import sharp from 'sharp';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { chmod, mkdir, rename, rm, stat } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { objectId, envelope, findingError } from './validation.js';
import { acknowledgement, actorSnapshot, capacity, conflict, divisionSnapshots, replay, requestHash } from './write-service.js';
const MAX = 5 * 1024 * 1024;
const formats = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
const invalid = (message, status = 422) => findingError(status, status === 413 ? 'PHOTO_TOO_LARGE' : 'PHOTO_INVALID', message);
const publicPhoto = (item) => ({ id: item.id, originalName: item.originalName, mime: item.mime, sizeBytes: item.sizeBytes,
  kind: item.kind, uploadedAt: item.uploadedAt, uploadedBy: { username: item.uploadedBy?.username, displayName: item.uploadedBy?.displayName, divisionName: item.uploadedBy?.divisionName } });
function parseUpload(req) {
  return new Promise((resolve, reject) => {
    if (!/^multipart\/form-data\s*;/i.test(req.get('content-type') || '')) return reject(invalid('Gunakan formulir foto multipart.'));
    let parser;
    try { parser = Busboy({ headers: req.headers, limits: { fileSize: MAX + 1, fieldSize: 200, files: 2, fields: 4, parts: 5 } }); }
    catch { return reject(invalid('Formulir foto tidak valid.')); }
    const fields = Object.create(null); const chunks = []; let file = null; let issue = null;
    parser.on('field', (name, value, info) => {
      if (!['version', 'mutationId', 'kind'].includes(name) || Object.hasOwn(fields, name) || info.valueTruncated) issue = invalid('Kolom formulir foto tidak valid.');
      else fields[name] = value;
    });
    parser.on('file', (name, stream, info) => {
      if (name !== 'file' || file) issue = invalid('Pilih satu foto.');
      file = { name: info.filename, mime: info.mimeType };
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('limit', () => { issue = invalid('Foto maksimal 5 MiB.', 413); });
    });
    for (const event of ['filesLimit', 'fieldsLimit', 'partsLimit']) parser.on(event, () => { issue = invalid('Formulir foto melebihi batas.'); });
    parser.on('error', () => reject(invalid('Formulir foto tidak dapat dibaca.')));
    req.on('aborted', () => reject(invalid('Unggah foto terputus.')));
    parser.on('close', () => issue ? reject(issue) : resolve({ fields, file, bytes: Buffer.concat(chunks) }));
    req.pipe(parser);
  });
}
function validate(fields, file, bytes) {
  envelope({ ...fields, version: Number(fields.version) }, ['kind'], true);
  if (!['INITIAL', 'PROGRESS', 'COMPLETION'].includes(fields.kind)) throw invalid('Jenis foto tidak valid.');
  if (!file || !bytes.length || bytes.length > MAX) throw invalid('Pilih foto hingga 5 MiB.', bytes.length > MAX ? 413 : 422);
  if (!Object.values(formats).includes(file.mime)) throw invalid('Gunakan JPEG, PNG, atau WebP.');
  return { version: Number(fields.version), mutationId: fields.mutationId.toLowerCase(), kind: fields.kind };
}
export async function uploadAttachment(database, { id, req, account, config, now = new Date() }) {
  const _id = objectId(id); const { fields, file, bytes } = await parseUpload(req);
  const body = validate(fields, file, bytes);
  const cleanName = basename((file.name || 'foto').replaceAll('\\', '/')).replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 120) || 'foto';
  const digest = createHash('sha256').update(bytes).digest('hex');
  const hash = requestHash('ATTACHMENT', { ...body, digest, name: cleanName, sourceMime: file.mime }, account);
  const collection = database.collection('findings');
  let row = await collection.findOne({ _id });
  if (!row) throw findingError(404, 'NOT_FOUND', 'Temuan tidak ditemukan.');
  const repeated = replay(row, body.mutationId, hash);
  if (repeated) return repeated;
  if (row.cancelledAt) throw findingError(409, 'FINDING_CANCELLED', 'Temuan dibatalkan dan tidak dapat diubah.');
  if (row.version !== body.version) throw conflict(row);
  if ((row.attachments || []).length >= 10) throw findingError(409, 'PHOTO_LIMIT', 'Maksimal 10 foto per temuan.');
  let metadata;
  try { metadata = await sharp(bytes, { limitInputPixels: 40_000_000 }).metadata(); }
  catch { throw invalid('Isi foto tidak valid atau terlalu besar.'); }
  if (formats[metadata.format] !== file.mime || metadata.pages > 1) throw invalid('Format isi foto tidak cocok atau animasi tidak didukung.');
  const actor = await actorSnapshot(database, account);
  const storageKey = `${randomUUID()}.webp`; const temp = join(config.uploadDir, `${storageKey}.tmp`); const final = join(config.uploadDir, storageKey);
  let placed = false;
  try {
    await mkdir(config.uploadDir, { recursive: true, mode: 0o700 });
    await chmod(config.uploadDir, 0o700);
    await sharp(bytes, { limitInputPixels: 40_000_000 }).rotate().resize({ width: 4096, height: 4096, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toFile(temp);
    await chmod(temp, 0o600);
    const output = await stat(temp);
    if (output.size > MAX) throw invalid('Foto hasil olahan melebihi 5 MiB.', 413);
    await rename(temp, final); placed = true;
    const item = { id: randomUUID(), storageKey, originalName: cleanName, mime: 'image/webp', sizeBytes: output.size,
      kind: body.kind, uploadedAt: now, uploadedBy: actor };
    const next = { ...row, attachments: [...(row.attachments || []), item], version: row.version + 1, updatedAt: now, updatedBy: actor };
    const event = { id: randomUUID(), action: 'ATTACHMENT_ADDED', actor, timestamp: now, revision: next.version,
      mutationId: body.mutationId, before: { attachmentCount: (row.attachments || []).length }, after: { attachmentCount: next.attachments.length },
      attachmentId: item.id, divisionSnapshots: await divisionSnapshots(database, row) };
    const result = { ...acknowledgement(next), attachment: publicPhoto(item) };
    const receipt = { mutationId: body.mutationId, requestHash: hash, result };
    capacity({ ...next, audit: [...(row.audit || []), event], mutationReceipts: [...(row.mutationReceipts || []), receipt] });
    const saved = await collection.updateOne({ _id, version: row.version, cancelledAt: null, 'attachments.9': { $exists: false } }, {
      $set: { updatedAt: now, updatedBy: actor }, $inc: { version: 1 }, $push: { attachments: item, audit: event, mutationReceipts: receipt },
    });
    if (!saved.matchedCount) {
      row = await collection.findOne({ _id });
      if (!row) throw findingError(404, 'NOT_FOUND', 'Temuan tidak ditemukan.');
      const concurrent = replay(row, body.mutationId, hash);
      if (concurrent) return concurrent;
      throw row.cancelledAt ? findingError(409, 'FINDING_CANCELLED', 'Temuan sudah dibatalkan.') : conflict(row);
    }
    placed = false;
    return { data: result, meta: { replayed: false } };
  } finally {
    await rm(temp, { force: true });
    if (placed) await rm(final, { force: true });
  }
}
export async function listAttachments(database, id) {
  const row = await database.collection('findings').findOne({ _id: objectId(id) }, { projection: { attachments: 1 } });
  if (!row) throw findingError(404, 'NOT_FOUND', 'Temuan tidak ditemukan.');
  return (row.attachments || []).map(publicPhoto);
}
export async function readAttachment(database, { id, attachmentId, config }) {
  const row = await database.collection('findings').findOne({ _id: objectId(id), 'attachments.id': attachmentId }, { projection: { attachments: 1 } });
  const item = row?.attachments?.find((entry) => entry.id === attachmentId);
  if (!item || !/^[a-f0-9-]{36}\.webp$/.test(item.storageKey)) throw findingError(404, 'NOT_FOUND', 'Foto tidak ditemukan.');
  const filePath = join(config.uploadDir, item.storageKey);
  try { await stat(filePath); } catch { throw findingError(503, 'PHOTO_UNAVAILABLE', 'Berkas foto belum tersedia. Hubungi ICT.'); }
  return { item, stream: createReadStream(filePath) };
}
