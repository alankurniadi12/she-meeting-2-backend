import { ObjectId } from 'mongodb';

const filterKeys = ['responsibleDivisionIds', 'reporterDivisionId', 'status', 'priority', 'q', 'from', 'to', 'dateBasis', 'cancellation', 'sort'];
const invalid = () => Object.assign(new Error('Filter temuan tidak valid.'), {
  status: 400, code: 'INVALID_QUERY', publicMessage: 'Filter temuan tidak valid. Periksa tanggal, pilihan filter, dan nomor halaman.',
});
const objectId = (value) => /^[a-fA-F0-9]{24}$/.test(value);
function dateOnly(value) {
  if (!/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function parseFindingQuery(query, { pagination = true } = {}) {
  const allowed = pagination ? [...filterKeys, 'page', 'pageSize'] : filterKeys;
  if (Object.keys(query).some((key) => !allowed.includes(key)) || Object.values(query).some((value) => typeof value !== 'string')) throw invalid();
  const ids = query.responsibleDivisionIds === undefined ? [] : query.responsibleDivisionIds.split(',');
  if (ids.length > 50 || ids.some((id) => !objectId(id))) throw invalid();
  if (query.reporterDivisionId !== undefined && !objectId(query.reporterDivisionId)) throw invalid();
  if (query.status !== undefined && !['IN_PROGRESS', 'ON_HOLD', 'COMPLETED'].includes(query.status)) throw invalid();
  if (query.priority !== undefined && !['LOW', 'MEDIUM', 'HIGH', 'UNASSESSED'].includes(query.priority)) throw invalid();
  const q = query.q?.trim() || '';
  if (q.length > 100) throw invalid();
  if (query.from !== undefined && !dateOnly(query.from)) throw invalid();
  if (query.to !== undefined && !dateOnly(query.to)) throw invalid();
  if (query.from && query.to && query.from > query.to) throw invalid();
  const dateBasis = query.dateBasis ?? 'reported';
  const cancellation = query.cancellation ?? 'active';
  const sort = query.sort ?? 'reportedDate:desc';
  if (!['reported', 'completed'].includes(dateBasis) || !['active', 'cancelled', 'all'].includes(cancellation) ||
      !/^(reportedDate|updatedAt):(asc|desc)$/.test(sort)) throw invalid();
  const { page = '1', pageSize = '20' } = query;
  if (!/^[1-9]\d{0,5}$/.test(page) || !/^[1-9]\d{0,2}$/.test(pageSize) || Number(pageSize) > 100) throw invalid();
  return {
    responsibleDivisionIds: [...new Set(ids.map((id) => id.toLowerCase()))],
    reporterDivisionId: query.reporterDivisionId?.toLowerCase(), status: query.status, priority: query.priority,
    q, from: query.from, to: query.to, dateBasis, cancellation, sort,
    page: Number(page), pageSize: Number(pageSize),
  };
}

export function buildFindingMatch(filters, timeZone) {
  const clauses = [];
  if (filters.cancellation === 'active') clauses.push({ cancelledAt: null });
  if (filters.cancellation === 'cancelled') clauses.push({ cancelledAt: { $ne: null } });
  if (filters.responsibleDivisionIds.length) clauses.push({ responsibleDivisionIds: { $in: filters.responsibleDivisionIds.map((id) => new ObjectId(id)) } });
  if (filters.reporterDivisionId) clauses.push({ reporterDivisionId: new ObjectId(filters.reporterDivisionId) });
  if (filters.status) clauses.push({ status: filters.status });
  if (filters.priority) clauses.push({ priority: filters.priority === 'UNASSESSED' ? null : filters.priority });
  if (filters.q) {
    const literal = filters.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    clauses.push({ $or: ['reference', 'description', 'location', 'reporterName'].map((field) => ({ [field]: { $regex: literal, $options: 'i' } })) });
  }
  const bounds = {};
  if (filters.from) bounds.$gte = filters.from;
  if (filters.to) bounds.$lte = filters.to;
  if (filters.dateBasis === 'completed') {
    clauses.push({ status: 'COMPLETED', completedAt: { $type: 'date' } });
    const date = { $dateToString: { date: '$completedAt', format: '%Y-%m-%d', timezone: timeZone, onNull: null } };
    if (filters.from) clauses.push({ $expr: { $gte: [date, filters.from] } });
    if (filters.to) clauses.push({ $expr: { $lte: [date, filters.to] } });
  } else if (Object.keys(bounds).length) clauses.push({ reportedDate: bounds });
  return clauses.length ? { $and: clauses } : {};
}
