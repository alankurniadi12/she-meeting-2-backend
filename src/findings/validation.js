import { ObjectId } from 'mongodb';
export function findingError(status, code, message, details = {}) {
  return Object.assign(new Error(message), { status, code, publicMessage: message, ...details });
}
const invalid = (field, message) => findingError(422, 'VALIDATION_FAILED', 'Periksa isian temuan.', { fields: { [field]: message } });
export const coreFields = ['reportedDate', 'description', 'location', 'reporterName', 'reporterDivisionId', 'responsibleDivisionIds', 'priority', 'targetDate'];
export const progressFields = ['text', 'status', 'holdReason', 'priority', 'targetDate', 'correctionReason'];
export function objectId(value, field = 'id') {
  if (typeof value !== 'string' || !/^[a-fA-F0-9]{24}$/.test(value)) throw invalid(field, 'ID tidak valid.');
  return new ObjectId(value);
}
export function text(value, field, min, max) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) throw invalid(field, `Isi ${min}–${max} karakter.`);
  return value.trim();
}
export function calendar(value, field) {
  if (typeof value !== 'string' || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) throw invalid(field, 'Gunakan tanggal kalender yang valid.');
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw invalid(field, 'Tanggal kalender tidak valid.');
  return value;
}
export function envelope(body, fields, update = false) {
  if (!body || Array.isArray(body) || typeof body !== 'object' || Object.keys(body).some((key) => ![...fields, 'mutationId', ...(update ? ['version'] : [])].includes(key))) {
    throw invalid('form', 'Ada kolom yang tidak diizinkan.');
  }
  if (typeof body.mutationId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.mutationId)) throw invalid('mutationId', 'ID operasi UUID v4 wajib.');
  if (update && (!Number.isSafeInteger(body.version) || body.version < 1)) throw invalid('version', 'Versi data wajib dan valid.');
}
export async function validateCore(database, body, today, existing = null) {
  const result = {};
  const input = existing ? Object.fromEntries(coreFields.map((key) => [key, body[key] === undefined ? existing[key] : body[key]])) : body;
  result.reportedDate = calendar(input.reportedDate, 'reportedDate');
  if (result.reportedDate > today) throw invalid('reportedDate', 'Tanggal laporan tidak boleh melewati hari ini.');
  result.description = text(input.description, 'description', 5, 3000);
  result.location = text(input.location, 'location', 1, 200);
  result.reporterName = text(input.reporterName, 'reporterName', 1, 120);
  result.priority = input.priority ?? null;
  if (![null, 'LOW', 'MEDIUM', 'HIGH'].includes(result.priority)) throw invalid('priority', 'Prioritas tidak valid.');
  result.targetDate = input.targetDate == null ? null : calendar(input.targetDate, 'targetDate');
  if (result.targetDate && result.targetDate < result.reportedDate) throw invalid('targetDate', 'Target tidak boleh sebelum tanggal laporan.');
  const reporterId = existing && input.reporterDivisionId instanceof ObjectId ? String(input.reporterDivisionId) : input.reporterDivisionId;
  result.reporterDivisionId = objectId(reporterId, 'reporterDivisionId');
  if (!Array.isArray(input.responsibleDivisionIds) || input.responsibleDivisionIds.length < 1 || input.responsibleDivisionIds.length > 50) throw invalid('responsibleDivisionIds', 'Pilih 1–50 divisi penanggung jawab.');
  result.responsibleDivisionIds = input.responsibleDivisionIds.map((id) => objectId(typeof id === 'string' ? id : existing && id instanceof ObjectId ? id.toString() : id, 'responsibleDivisionIds'));
  if (new Set(result.responsibleDivisionIds.map(String)).size !== result.responsibleDivisionIds.length) throw invalid('responsibleDivisionIds', 'Divisi penanggung jawab tidak boleh berulang.');
  const sameIds = (a, b) => JSON.stringify(a.map(String).sort()) === JSON.stringify(b.map(String).sort());
  const checks = [];
  if (!existing || String(result.reporterDivisionId) !== String(existing.reporterDivisionId)) checks.push(['reporterDivisionId', [result.reporterDivisionId]]);
  if (!existing || !sameIds(result.responsibleDivisionIds, existing.responsibleDivisionIds)) checks.push(['responsibleDivisionIds', result.responsibleDivisionIds]);
  for (const [field, ids] of checks) {
    const count = await database.collection('divisions').countDocuments({ _id: { $in: ids }, active: true });
    if (count !== ids.length) throw invalid(field, 'Pilih divisi aktif yang tersedia.');
  }
  return result;
}
