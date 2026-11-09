import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calendarDate, shiftDate } from '../src/lib/calendar.js';
import { parseDashboardQuery } from '../src/dashboard/service.js';

test('hari kalender mengikuti zona, pergantian tahun dan tahun kabisat', () => {
  assert.equal(calendarDate(new Date('2026-10-31T17:00:00Z'), 'Asia/Jakarta'), '2026-11-01');
  assert.equal(calendarDate(new Date('2026-10-31T16:59:59Z'), 'Asia/Jakarta'), '2026-10-31');
  assert.equal(shiftDate('2027-01-01', -1), '2026-12-31');
  assert.equal(shiftDate('2028-03-01', -1), '2028-02-29');
});
test('filter dashboard membatasi input dan menghapus duplikasi divisi', () => {
  const id = 'ABCDEF123456789012345678';
  assert.deepEqual(parseDashboardQuery({ responsibleDivisionIds: `${id},${id.toLowerCase()}` }, '2026-11'), {
    month: '2026-11', responsibleDivisionIds: [id.toLowerCase()],
  });
  assert.deepEqual(parseDashboardQuery({}, '2026-11'), { month: '2026-11', responsibleDivisionIds: [] });
  for (const query of [
    { month: '2026-13' }, { month: '2026-1' }, { month: ['2026-11'] }, { month: '0000-01' },
    { status: 'IN_PROGRESS' }, { responsibleDivisionIds: '' }, { responsibleDivisionIds: 'x' },
    { responsibleDivisionIds: { $ne: null } }, { responsibleDivisionIds: Array(2).fill(id) },
    { responsibleDivisionIds: Array(51).fill(id).join(',') },
  ]) assert.throws(() => parseDashboardQuery(query, '2026-11'), { code: 'INVALID_QUERY' });
});
