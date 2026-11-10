import { ObjectId } from 'mongodb';
import { calendarDate } from '../lib/calendar.js';

function invalidQuery() {
  return Object.assign(new Error('Filter dashboard tidak valid.'), {
    status: 400, code: 'INVALID_QUERY', publicMessage: 'Filter dashboard tidak valid. Gunakan bulan YYYY-MM dan ID divisi yang valid.',
  });
}

export function parseDashboardQuery(query, defaultMonth) {
  if (Object.keys(query).some((key) => !['month', 'responsibleDivisionIds'].includes(key))) throw invalidQuery();
  const month = query.month ?? defaultMonth;
  if (typeof month !== 'string' || !/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(month)) throw invalidQuery();
  const scope = query.responsibleDivisionIds;
  if (scope !== undefined && (typeof scope !== 'string' || scope.length > 1249)) throw invalidQuery();
  const ids = scope === undefined ? [] : scope.split(',');
  if (ids.length > 50 || ids.some((id) => !/^[a-fA-F0-9]{24}$/.test(id))) throw invalidQuery();
  return { month, responsibleDivisionIds: [...new Set(ids.map((id) => id.toLowerCase()))] };
}

export async function getDashboard(database, { query, timeZone, now = new Date() }) {
  const today = calendarDate(now, timeZone);
  const { month, responsibleDivisionIds } = parseDashboardQuery(query, today.slice(0, 7));
  const match = { cancelledAt: null };
  if (responsibleDivisionIds.length) match.responsibleDivisionIds = { $in: responsibleDivisionIds.map((id) => new ObjectId(id)) };
  const countWhen = (condition) => ({ $sum: { $cond: [condition, 1, 0] } });
  const [totals] = await database.collection('findings').aggregate([
    { $match: match },
    // Match arrays directly: a finding shared by two selected divisions still counts once.
    { $group: {
      _id: null, totalValid: { $sum: 1 },
      inProgress: countWhen({ $eq: ['$status', 'IN_PROGRESS'] }),
      onHold: countWhen({ $eq: ['$status', 'ON_HOLD'] }),
      completed: countWhen({ $eq: ['$status', 'COMPLETED'] }),
      overdue: countWhen({ $and: [
        { $in: ['$status', ['IN_PROGRESS', 'ON_HOLD']] },
        { $eq: [{ $type: '$targetDate' }, 'string'] }, { $lt: ['$targetDate', today] },
      ] }),
      reportedInMonth: countWhen({ $eq: [{ $substrBytes: ['$reportedDate', 0, 7] }, month] }),
      completedInMonth: countWhen({ $and: [
        { $eq: ['$status', 'COMPLETED'] },
        { $eq: [{ $dateToString: { date: '$completedAt', format: '%Y-%m', timezone: timeZone, onNull: null } }, month] },
      ] }),
    } },
  ], { maxTimeMS: 5000 }).toArray();
  const result = totals || { totalValid: 0, inProgress: 0, onHold: 0, completed: 0, overdue: 0, reportedInMonth: 0, completedInMonth: 0 };
  const firstMonth = new Date(`${month}-01T12:00:00Z`);
  firstMonth.setUTCMonth(firstMonth.getUTCMonth() - 5);
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(firstMonth);
    date.setUTCMonth(date.getUTCMonth() + index);
    return date.toISOString().slice(0, 7);
  });
  const reportedRows = await database.collection('findings').aggregate([
    { $match: { ...match, reportedDate: { $gte: `${months[0]}-01`, $lt: `${month}-32` } } },
    { $group: { _id: { $substrBytes: ['$reportedDate', 0, 7] }, count: { $sum: 1 } } },
  ], { maxTimeMS: 5000 }).toArray();
  const completedRows = await database.collection('findings').aggregate([
    { $match: { ...match, status: 'COMPLETED', completedAt: { $type: 'date' } } },
    { $group: { _id: { $dateToString: { date: '$completedAt', format: '%Y-%m', timezone: timeZone } }, count: { $sum: 1 } } },
    { $match: { _id: { $in: months } } },
  ], { maxTimeMS: 5000 }).toArray();
  const reportedByMonth = new Map(reportedRows.map((row) => [row._id, row.count]));
  const completedByMonth = new Map(completedRows.map((row) => [row._id, row.count]));
  const divisionRows = await database.collection('findings').aggregate([
    { $match: match }, { $unwind: '$responsibleDivisionIds' },
    ...(responsibleDivisionIds.length ? [{ $match: { responsibleDivisionIds: { $in: responsibleDivisionIds.map((id) => new ObjectId(id)) } } }] : []),
    { $group: { _id: '$responsibleDivisionIds', total: { $sum: 1 },
      inProgress: countWhen({ $eq: ['$status', 'IN_PROGRESS'] }),
      onHold: countWhen({ $eq: ['$status', 'ON_HOLD'] }), completed: countWhen({ $eq: ['$status', 'COMPLETED'] }) } },
    { $lookup: { from: 'divisions', localField: '_id', foreignField: '_id', as: 'division' } },
    { $project: { total: 1, inProgress: 1, onHold: 1, completed: 1, name: { $arrayElemAt: ['$division.name', 0] }, code: { $arrayElemAt: ['$division.code', 0] } } },
    { $sort: { name: 1, _id: 1 } },
  ], { maxTimeMS: 5000 }).toArray();
  const followUpRows = await database.collection('findings').aggregate([
    { $match: { ...match, status: { $in: ['IN_PROGRESS', 'ON_HOLD'] } } },
    { $addFields: { overdueRank: { $cond: [{ $and: [{ $eq: [{ $type: '$targetDate' }, 'string'] }, { $lt: ['$targetDate', today] }] }, 0, 1] },
      holdRank: { $cond: [{ $eq: ['$status', 'ON_HOLD'] }, 0, 1] } } },
    { $addFields: { attentionDate: { $cond: [{ $eq: ['$overdueRank', 0] }, '$targetDate', '$reportedDate'] } } },
    { $sort: { overdueRank: 1, holdRank: 1, attentionDate: 1, reportedDate: 1, _id: 1 } },
    { $limit: 5 },
    { $project: { reference: 1, reportedDate: 1, location: 1, status: 1, targetDate: 1, updatedAt: 1, overdueRank: 1 } },
  ], { maxTimeMS: 5000 }).toArray();
  return {
    dataMode: 'DEMO', asOf: now.toISOString(), today, timeZone,
    scope: { responsibleDivisionIds },
    snapshot: {
      totalValid: result.totalValid,
      counts: { IN_PROGRESS: result.inProgress, ON_HOLD: result.onHold, COMPLETED: result.completed },
      open: result.inProgress + result.onHold, overdue: result.overdue,
    },
    period: { month, reported: result.reportedInMonth, completed: result.completedInMonth },
    trend: months.map((key) => ({ month: key, reported: reportedByMonth.get(key) || 0, completed: completedByMonth.get(key) || 0 })),
    byDivision: divisionRows.map((row) => ({ id: row._id.toString(), name: row.name || row.code || 'Divisi tidak tersedia',
      total: row.total, counts: { IN_PROGRESS: row.inProgress, ON_HOLD: row.onHold, COMPLETED: row.completed } })),
    followUps: followUpRows.map((row) => ({ id: row._id.toString(), reference: row.reference, reportedDate: row.reportedDate,
      location: row.location, status: row.status, targetDate: row.targetDate ?? null, updatedAt: row.updatedAt ?? null,
      isOverdue: row.overdueRank === 0 })),
  };
}
