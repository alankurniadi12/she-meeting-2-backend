import { calendarDate } from '../lib/calendar.js';
import { parseFindingQuery, buildFindingMatch } from './query.js';

function summaryPipeline(today) {
  const valid = { $eq: [{ $ifNull: ['$cancelledAt', null] }, null] };
  const countWhen = (condition) => ({ $sum: { $cond: [condition, 1, 0] } });
  return [{ $group: {
    _id: null, totalMatched: { $sum: 1 }, totalValid: countWhen(valid),
    inProgress: countWhen({ $and: [valid, { $eq: ['$status', 'IN_PROGRESS'] }] }),
    onHold: countWhen({ $and: [valid, { $eq: ['$status', 'ON_HOLD'] }] }),
    completed: countWhen({ $and: [valid, { $eq: ['$status', 'COMPLETED'] }] }),
    overdue: countWhen({ $and: [valid, { $in: ['$status', ['IN_PROGRESS', 'ON_HOLD']] },
      { $eq: [{ $type: '$targetDate' }, 'string'] }, { $lt: ['$targetDate', today] }] }),
  } }];
}
function summaryResult(row) {
  const data = row || { totalMatched: 0, totalValid: 0, inProgress: 0, onHold: 0, completed: 0, overdue: 0 };
  return { totalMatched: data.totalMatched, totalValid: data.totalValid,
    counts: { IN_PROGRESS: data.inProgress, ON_HOLD: data.onHold, COMPLETED: data.completed },
    open: data.inProgress + data.onHold, overdue: data.overdue, cancelled: data.totalMatched - data.totalValid };
}
function rowResult(row, divisionMap, today) {
  const division = (id) => divisionMap.get(id?.toString()) || { id: id?.toString() || null, name: null, code: null, active: false };
  const ageDays = Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${row.reportedDate}T00:00:00Z`)) / 86400000);
  const cancelled = row.cancelledAt != null;
  return {
    id: row._id.toString(), reference: row.reference, reportedDate: row.reportedDate,
    descriptionExcerpt: row.description.slice(0, 240), descriptionTruncated: row.description.length > 240,
    location: row.location, reporterName: row.reporterName,
    reporterDivision: division(row.reporterDivisionId), responsibleDivisions: row.responsibleDivisionIds.map(division),
    status: row.status, priority: row.priority ?? null, targetDate: row.targetDate ?? null,
    cancelledAt: row.cancelledAt ?? null, updatedAt: row.updatedAt,
    updatedBy: { username: row.updatedBy?.username ?? null, displayName: row.updatedBy?.displayName ?? null, source: row.updatedBy?.source ?? null },
    ageDays, isNew: ageDays >= 0 && ageDays < 7,
    isOverdue: !cancelled && ['IN_PROGRESS', 'ON_HOLD'].includes(row.status) && row.targetDate != null && row.targetDate < today,
  };
}

export async function readFindings(database, { query, timeZone, now = new Date(), summaryOnly = false }) {
  const filters = parseFindingQuery(query, { pagination: !summaryOnly });
  const today = calendarDate(now, timeZone);
  const metadata = { asOf: now.toISOString(), today, timeZone, dataMode: 'DEMO' };
  const pipeline = [{ $match: buildFindingMatch(filters, timeZone) }];
  if (summaryOnly) {
    const rows = await database.collection('findings').aggregate([...pipeline, ...summaryPipeline(today)], { maxTimeMS: 5000 }).toArray();
    return { data: { ...summaryResult(rows[0]), ...metadata } };
  }
  const [sortField, order] = filters.sort.split(':');
  const direction = order === 'asc' ? 1 : -1;
  // Allowlist fields before facet: large embedded history/attachments never enter list output.
  const projection = { reference: 1, reportedDate: 1, description: 1, location: 1, reporterName: 1,
    reporterDivisionId: 1, responsibleDivisionIds: 1, status: 1, priority: 1, targetDate: 1,
    cancelledAt: 1, updatedAt: 1, 'updatedBy.username': 1, 'updatedBy.displayName': 1, 'updatedBy.source': 1 };
  const [result] = await database.collection('findings').aggregate([...pipeline, { $project: projection }, { $facet: {
    rows: [{ $sort: { [sortField]: direction, _id: direction } }, { $skip: (filters.page - 1) * filters.pageSize }, { $limit: filters.pageSize }],
    summary: summaryPipeline(today),
  } }], { maxTimeMS: 5000 }).toArray();
  const summary = summaryResult(result?.summary[0]);
  const divisions = await database.collection('divisions').find({}, { projection: { name: 1, code: 1, active: 1 } }).toArray();
  const divisionMap = new Map(divisions.map((row) => [row._id.toString(), { id: row._id.toString(), name: row.name, code: row.code, active: row.active }]));
  return { data: (result?.rows || []).map((row) => rowResult(row, divisionMap, today)), meta: {
    page: filters.page, pageSize: filters.pageSize, total: summary.totalMatched,
    totalPages: Math.ceil(summary.totalMatched / filters.pageSize), summary, ...metadata,
  } };
}
