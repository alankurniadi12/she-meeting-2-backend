import { calendarDate } from '../lib/calendar.js';
import { objectId, findingError } from './validation.js';
const actor = (value) => value ? { accountId: value.accountId?.toString() ?? null, username: value.username, displayName: value.displayName,
  divisionId: value.divisionId?.toString() ?? null, divisionName: value.divisionName ?? null, source: value.source ?? 'ACCOUNT' } : null;
export async function findingDetail(database, { id, timeZone, now = new Date() }) {
  const row = await database.collection('findings').findOne({ _id: objectId(id) }, { projection: { mutationReceipts: 0, audit: 0 } });
  if (!row) throw findingError(404, 'NOT_FOUND', 'Temuan tidak ditemukan.');
  const divisions = await database.collection('divisions').find({}, { projection: { code: 1, name: 1, active: 1 } }).toArray();
  const map = new Map(divisions.map((item) => [String(item._id), { id: String(item._id), code: item.code, name: item.name, active: item.active }]));
  const division = (value) => map.get(String(value)) || { id: String(value), code: null, name: null, active: false };
  const today = calendarDate(now, timeZone);
  const ageDays = Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${row.reportedDate}T00:00:00Z`)) / 86400000);
  return { id: String(row._id), reference: row.reference, version: row.version,
    reportedDate: row.reportedDate, description: row.description, location: row.location, reporterName: row.reporterName,
    reporterDivisionId: String(row.reporterDivisionId), reporterDivision: division(row.reporterDivisionId),
    responsibleDivisionIds: row.responsibleDivisionIds.map(String), responsibleDivisions: row.responsibleDivisionIds.map(division),
    priority: row.priority ?? null, targetDate: row.targetDate ?? null, status: row.status, holdReason: row.holdReason ?? null,
    completedAt: row.completedAt ?? null, cancelledAt: row.cancelledAt ?? null, cancellationReason: row.cancellationReason ?? null,
    createdBy: actor(row.createdBy), updatedBy: actor(row.updatedBy), createdAt: row.createdAt, updatedAt: row.updatedAt,
    progressEntries: (row.progressEntries || []).slice(-10).reverse().map((entry) => ({ id: entry.id, text: entry.text, actor: actor(entry.actor), timestamp: entry.timestamp })),
    progressTotal: row.progressEntries?.length ?? 0, attachmentCount: row.attachments?.length ?? 0,
    ageDays, isNew: ageDays >= 0 && ageDays < 7,
    isOverdue: !row.cancelledAt && ['IN_PROGRESS', 'ON_HOLD'].includes(row.status) && row.targetDate != null && row.targetDate < today,
    today, timeZone, asOf: now.toISOString(), dataMode: 'DEMO',
  };
}
