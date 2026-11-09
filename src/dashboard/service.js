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
  return {
    dataMode: 'DEMO', asOf: now.toISOString(), today, timeZone,
    scope: { responsibleDivisionIds },
    snapshot: {
      totalValid: result.totalValid,
      counts: { IN_PROGRESS: result.inProgress, ON_HOLD: result.onHold, COMPLETED: result.completed },
      open: result.inProgress + result.onHold, overdue: result.overdue,
    },
    period: { month, reported: result.reportedInMonth, completed: result.completedInMonth },
  };
}
