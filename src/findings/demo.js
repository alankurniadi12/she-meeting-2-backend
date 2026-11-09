import { ObjectId } from 'mongodb';
import { calendarDate, shiftDate } from '../lib/calendar.js';
import { prepareFindingStore } from './store.js';

export function buildDemoFindings({ divisionIds, now = new Date(), timeZone = 'Asia/Jakarta' }) {
  const today = calendarDate(now, timeZone);
  const monthStart = `${today.slice(0, 7)}-01`;
  const previousMonthEnd = shiftDate(monthStart, -1);
  const previousMonthStart = `${previousMonthEnd.slice(0, 7)}-01`;
  const actor = { accountId: null, username: 'seed.demo', displayName: 'Seed data demo', divisionId: null, divisionName: null, source: 'DEMO_SEED' };
  const descriptions = [
    'Pintu panel contoh perlu diperbaiki.', 'Permukaan lantai contoh licin saat basah.',
    'Lampu jalur contoh perlu diganti.', 'Pagar pembatas contoh perlu diperkuat.',
    'Rambu area contoh kurang terbaca.', 'Pegangan tangga contoh perlu diperiksa.',
  ];
  return Array.from({ length: 18 }, (_, index) => {
    const id = new ObjectId();
    const status = ['IN_PROGRESS', 'ON_HOLD', 'COMPLETED'][index % 3];
    const reportedDate = index < 9 ? shiftDate(today, -index) : shiftDate(previousMonthStart, index - 9);
    const targetDate = index % 4 === 0 ? null : index % 4 === 1 ? today : shiftDate(today, -1);
    // Old reports can be marked completed this month; counts must use their own dates.
    const completedAt = status === 'COMPLETED' ? (index < 15 ? now : new Date(`${previousMonthEnd}T05:00:00Z`)) : null;
    const cancelled = index === 16 || index === 17;
    const responsibleCodes = index % 4 === 0 ? ['CAMP', 'ICT'] : [['CAMP'], ['TRANSPORT'], ['ICT']][index % 3];
    const reportedAt = new Date(`${reportedDate}T01:00:00Z`);
    return {
      _id: id, seedKey: `D0-03-finding-${String(index + 1).padStart(2, '0')}`,
      reference: `SM-DEMO-${id.toHexString()}`, reportedDate,
      description: `${descriptions[index % descriptions.length]} Data dummy ${String(index + 1).padStart(2, '0')}.`,
      location: `Area Demo ${String.fromCharCode(65 + index % 3)}`,
      reporterName: `Pelapor Contoh ${String(index + 1).padStart(2, '0')}`,
      reporterDivisionId: divisionIds[['CAMP', 'TRANSPORT', 'ICT'][(index + 1) % 3]],
      responsibleDivisionIds: responsibleCodes.map((code) => divisionIds[code]),
      priority: [null, 'LOW', 'MEDIUM', 'HIGH'][index % 4], targetDate, status,
      holdReason: status === 'ON_HOLD' ? 'Contoh kendala: menunggu material demo.' : null,
      completedAt, cancelledAt: cancelled ? now : null,
      cancellationReason: cancelled ? 'Contoh data dibatalkan untuk menguji pengecualian ringkasan.' : null,
      cancelledBy: cancelled ? actor : null,
      version: 1, progressEntries: [], attachments: [],
      audit: [{ action: 'DEMO_SEED', actor, timestamp: now, revision: 1 }],
      createdBy: actor, updatedBy: actor, createdAt: reportedAt, updatedAt: now,
    };
  });
}

export async function seedDemoFindings(database, options) {
  await prepareFindingStore(database);
  let inserted = 0;
  for (const finding of buildDemoFindings(options)) {
    // Only insert missing fixtures. Never redate, reset progress, or overwrite future edits.
    const result = await database.collection('findings').updateOne({ seedKey: finding.seedKey }, { $setOnInsert: finding }, { upsert: true });
    inserted += result.upsertedCount;
  }
  return inserted;
}
