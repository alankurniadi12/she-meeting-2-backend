import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFindingQuery, buildFindingMatch } from '../src/findings/query.js';

test('filter temuan menormalisasi scope dan batas pagination', () => {
  const id = 'ABCDEF123456789012345678';
  const result = parseFindingQuery({ responsibleDivisionIds: `${id},${id.toLowerCase()}`, q: ' panel ', page: '2', pageSize: '100' });
  assert.deepEqual(result.responsibleDivisionIds, [id.toLowerCase()]);
  assert.equal(result.q, 'panel');
  assert.equal(result.page, 2);
  assert.equal(result.pageSize, 100);
  assert.equal(result.cancellation, 'active');
});
test('filter temuan menolak injeksi, array, enum, tanggal dan pagination salah', () => {
  for (const query of [
    { q: { $ne: '' } }, { status: ['ON_HOLD'] }, { unknown: 'x' }, { status: 'NEW' },
    { priority: 'VERY_HIGH' }, { responsibleDivisionIds: '' }, { reporterDivisionId: 'x' },
    { responsibleDivisionIds: Array(51).fill('a'.repeat(24)).join(',') },
    { q: 'x'.repeat(101) }, { from: '2026-02-29' }, { to: '2028-02-30' }, { from: '2026-00-01' },
    { from: '2026-11-02', to: '2026-11-01' }, { dateBasis: 'verified' }, { cancellation: 'deleted' },
    { sort: '$where:asc' }, { page: '0' }, { page: '1e3' }, { page: '1000000' }, { pageSize: '101' },
  ]) assert.throws(() => parseFindingQuery(query), { code: 'INVALID_QUERY' });
  assert.doesNotThrow(() => parseFindingQuery({ from: '2028-02-29', to: '2028-02-29' }));
  assert.throws(() => parseFindingQuery({ page: '1' }, { pagination: false }), { code: 'INVALID_QUERY' });
});
test('pencarian memakai regex literal dan status tidak tertimpa basis selesai', () => {
  const match = buildFindingMatch(parseFindingQuery({ q: 'a+b.(x)', status: 'ON_HOLD', dateBasis: 'completed' }), 'Asia/Jakarta');
  const encoded = JSON.stringify(match);
  assert.ok(encoded.includes('ON_HOLD'));
  assert.ok(encoded.includes('COMPLETED'));
  assert.equal(match.$and.find((item) => item.$or).$or[0].reference.$regex, 'a\\+b\\.\\(x\\)');
});
