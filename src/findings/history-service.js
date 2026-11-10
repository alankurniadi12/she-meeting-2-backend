import { objectId, findingError } from './validation.js';

const allowed = new Set(['page', 'pageSize']);
function pagination(query) {
  if (Object.keys(query).some((key) => !allowed.has(key))) throw findingError(422, 'VALIDATION_FAILED', 'Parameter riwayat tidak valid.');
  const number = (key, fallback, max) => {
    const raw = query[key];
    if (raw === undefined) return fallback;
    if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw) || !Number.isSafeInteger(Number(raw)) || Number(raw) > max) throw findingError(422, 'VALIDATION_FAILED', `Parameter ${key} tidak valid.`);
    return Number(raw);
  };
  return { page: number('page', 1, 100000), pageSize: number('pageSize', 10, 50) };
}
const actor = (value) => value ? { accountId: value.accountId?.toString() ?? null, username: value.username ?? null,
  displayName: value.displayName ?? null, divisionId: value.divisionId?.toString() ?? null,
  divisionName: value.divisionName ?? null, source: value.source ?? 'ACCOUNT' } : null;
const convert = (value) => {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(convert);
  if (typeof value === 'object') return typeof value.toHexString === 'function' ? value.toString() : Object.fromEntries(Object.entries(value).map(([key, item]) => [key, convert(item)]));
  return value;
};

export async function findingHistory(database, { id, query, kind }) {
  const _id = objectId(id);
  const { page, pageSize } = pagination(query);
  const field = kind === 'progress' ? 'progressEntries' : 'audit';
  // MongoDB slices the embedded array before it crosses the application boundary.
  const [row] = await database.collection('findings').aggregate([
    { $match: { _id } },
    { $project: { total: { $size: { $ifNull: [`$${field}`, []] } },
      entries: { $slice: [{ $reverseArray: { $ifNull: [`$${field}`, []] } }, (page - 1) * pageSize, pageSize] } } },
  ], { maxTimeMS: 5000 }).toArray();
  if (!row) throw findingError(404, 'NOT_FOUND', 'Temuan tidak ditemukan.');
  const data = row.entries.map((entry) => kind === 'progress' ? {
    id: entry.id ?? null, text: entry.text, actor: actor(entry.actor), timestamp: entry.timestamp,
    revision: entry.revision ?? null,
  } : {
    id: entry.id ?? null, action: entry.action, actor: actor(entry.actor), timestamp: entry.timestamp,
    revision: entry.revision ?? null, before: convert(entry.before ?? null), after: convert(entry.after ?? null),
    correctionReason: entry.correctionReason ?? null, reason: entry.reason ?? null, progressEntryId: entry.progressEntryId ?? null,
    divisionSnapshots: (entry.divisionSnapshots || []).map((division) => ({ id: division.id?.toString() ?? null, code: division.code ?? null, name: division.name ?? null })),
  });
  return { data, meta: { page, pageSize, total: row.total, totalPages: Math.ceil(row.total / pageSize) } };
}
