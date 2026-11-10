import { PDFDocument } from 'pdfkit';
import { fileURLToPath } from 'node:url';
import { parseFindingQuery, buildFindingMatch } from '../findings/query.js';

const FONT_REGULAR = fileURLToPath(new URL('../../node_modules/@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff', import.meta.url));
const FONT_BOLD = fileURLToPath(new URL('../../node_modules/@fontsource/noto-sans/files/noto-sans-latin-700-normal.woff', import.meta.url));
const MAX_ROWS = 1000;
const text = (value) => String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ').trim() || '-';
const error = (status, code, message) => Object.assign(new Error(message), { status, code, publicMessage: message });
const statusName = { IN_PROGRESS: 'Diproses', ON_HOLD: 'Tertunda', COMPLETED: 'Selesai' };
const priorityName = { LOW: 'Rendah', MEDIUM: 'Sedang', HIGH: 'Tinggi' };
const dateName = (value) => value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`)) : 'Belum ditentukan';
const sortName = { 'reportedDate:desc': 'Laporan terbaru', 'reportedDate:asc': 'Laporan terlama',
  'updatedAt:desc': 'Pembaruan terbaru', 'updatedAt:asc': 'Pembaruan terlama' };

function summaryFor(rows, today) {
  const summary = { totalMatched: rows.length, totalValid: 0, counts: { IN_PROGRESS: 0, ON_HOLD: 0, COMPLETED: 0 }, open: 0, overdue: 0, cancelled: 0 };
  for (const row of rows) {
    if (row.cancelledAt != null) { summary.cancelled++; continue; }
    summary.totalValid++;
    summary.counts[row.status]++;
    if (row.status !== 'COMPLETED') {
      summary.open++;
      if (row.targetDate && row.targetDate < today) summary.overdue++;
    }
  }
  return summary;
}

export async function loadPdfFindings(database, { query, timeZone, today }) {
  const filters = parseFindingQuery(query, { pagination: false });
  const match = buildFindingMatch(filters, timeZone);
  const [sortField, order] = filters.sort.split(':');
  const direction = order === 'asc' ? 1 : -1;
  const projection = { reference: 1, reportedDate: 1, description: 1, location: 1, reporterName: 1,
    reporterDivisionId: 1, responsibleDivisionIds: 1, status: 1, priority: 1, targetDate: 1,
    holdReason: 1, cancelledAt: 1, updatedAt: 1, progressEntries: { $slice: -1 } };
  const rows = await database.collection('findings').find(match, { projection, maxTimeMS: 5000 })
    .sort({ [sortField]: direction, _id: direction }).limit(MAX_ROWS + 1).toArray();
  if (rows.length > MAX_ROWS) throw error(422, 'EXPORT_TOO_LARGE', 'Hasil melebihi 1.000 temuan. Persempit filter lalu coba lagi.');
  const divisions = await database.collection('divisions').find({}, { projection: { name: 1, code: 1 } }).toArray();
  const divisionMap = new Map(divisions.map((row) => [row._id.toString(), row.name]));
  const nameOf = (id) => divisionMap.get(id?.toString()) || 'Divisi tidak tersedia';
  return { rows: rows.map((row) => ({ ...row, reporterDivisionName: nameOf(row.reporterDivisionId),
    responsibleNames: (row.responsibleDivisionIds || []).map(nameOf) })), filters, divisionMap,
    summary: summaryFor(rows, today) };
}

function wrap(doc, value, width) {
  const lines = [];
  for (const paragraph of text(value).split(/\r?\n/)) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (line && doc.widthOfString(`${line} ${word}`) <= width) { line += ` ${word}`; continue; }
      if (line) { lines.push(line); line = ''; }
      if (doc.widthOfString(word) <= width) { line = word; continue; }
      for (const character of word) {
        if (line && doc.widthOfString(`${line}${character}`) > width) { lines.push(line); line = ''; }
        line += character;
      }
    }
    lines.push(line || ' ');
  }
  return lines;
}

export async function renderFindingsPdf({ rows, filters, divisionMap, summary, account, now, timeZone }) {
  const doc = new PDFDocument({ autoFirstPage: false, bufferPages: true, size: 'A4', margin: 0,
    info: { Title: 'SHE Meeting - Data Demo', Author: 'SHE Meeting' } });
  doc.registerFont('Noto', FONT_REGULAR);
  doc.registerFont('NotoBold', FONT_BOLD);
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  const finished = new Promise((resolve, reject) => { doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject); });
  let y = 102;
  const pageBottom = 790;
  const startPage = () => {
    doc.addPage();
    doc.rect(0, 0, 595, 8).fill('#c83d4b');
    doc.font('NotoBold').fontSize(15).fillColor('#244775').text('SHE Meeting', 42, 28, { lineBreak: false });
    doc.font('Noto').fontSize(9).fillColor('#60718a').text('DATA DEMO  |  BAHAN RAPAT', 42, 52, { lineBreak: false });
    doc.moveTo(42, 79).lineTo(553, 79).strokeColor('#dfe6ef').stroke();
    y = 102;
  };
  const ensure = (height) => { if (y + height > pageBottom) startPage(); };
  const line = (value, { bold = false, color = '#24334a', size = 9, indent = 0 } = {}) => {
    doc.font(bold ? 'NotoBold' : 'Noto').fontSize(size).fillColor(color);
    const lines = wrap(doc, value, 511 - indent);
    for (const part of lines) {
      ensure(14);
      doc.font(bold ? 'NotoBold' : 'Noto').fontSize(size).fillColor(color).text(part, 42 + indent, y, { lineBreak: false });
      y += 14;
    }
  };
  const gap = (height = 8) => { ensure(height); y += height; };
  const section = (title) => { gap(8); line(title, { bold: true, color: '#244775', size: 11 }); gap(3); };
  const names = (ids) => ids.length ? ids.map((id) => divisionMap.get(id) || 'Divisi tidak tersedia').join(', ') : 'Semua divisi';
  const filterValues = [
    `Penanggung jawab: ${names(filters.responsibleDivisionIds)}`,
    `Pencarian: ${filters.q || 'Semua'}  |  Status: ${statusName[filters.status] || 'Semua'}  |  Prioritas: ${priorityName[filters.priority] || (filters.priority === 'UNASSESSED' ? 'Belum dinilai' : 'Semua')}`,
    `Divisi pelapor: ${filters.reporterDivisionId ? names([filters.reporterDivisionId]) : 'Semua'}  |  Pembatalan: ${{ active: 'Tidak batal', cancelled: 'Batal saja', all: 'Semua' }[filters.cancellation]}`,
    `Dasar tanggal: ${filters.dateBasis === 'completed' ? 'Tanggal dicatat selesai' : 'Tanggal laporan'}  |  Rentang: ${filters.from ? dateName(filters.from) : 'Awal'} s.d. ${filters.to ? dateName(filters.to) : 'Akhir'}  |  Urutan: ${sortName[filters.sort]}`,
  ];
  startPage();
  line(`Dibuat: ${new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeStyle: 'short', timeZone }).format(now)} (${timeZone})`, { bold: true });
  line(`Akun pembuat: ${text(account.displayName)} (${text(account.username)})`);
  section('Filter laporan');
  for (const value of filterValues) line(value);
  section('Ringkasan seluruh hasil filter');
  line(`Hasil: ${summary.totalMatched}  |  Tidak batal: ${summary.totalValid}  |  Batal: ${summary.cancelled}`);
  line(`Diproses: ${summary.counts.IN_PROGRESS}  |  Tertunda: ${summary.counts.ON_HOLD}  |  Selesai: ${summary.counts.COMPLETED}  |  Terbuka: ${summary.open}  |  Terlambat: ${summary.overdue}`);
  line('Kartu status hanya menghitung data tidak batal. Terlambat berarti target sebelum tanggal cetak dan belum selesai.', { color: '#60718a', size: 8 });
  section('Daftar temuan');
  if (!rows.length) line('Tidak ada temuan yang sesuai dengan filter.', { color: '#60718a' });
  for (const row of rows) {
    ensure(60);
    doc.moveTo(42, y).lineTo(553, y).strokeColor('#dfe6ef').stroke();
    gap(8);
    line(`${text(row.reference)}  |  ${dateName(row.reportedDate)}  |  ${row.cancelledAt ? 'DIBATALKAN - ' : ''}${statusName[row.status] || row.status}`, { bold: true, color: row.cancelledAt ? '#9b4550' : '#244775' });
    line(`Kondisi: ${text(row.description)}`);
    line(`Lokasi: ${text(row.location)}  |  Pelapor: ${text(row.reporterName)} (${row.reporterDivisionName})`);
    line(`Penanggung jawab: ${row.responsibleNames.join(', ') || '-'}`);
    line(`Prioritas: ${priorityName[row.priority] || 'Belum dinilai'}  |  Target: ${dateName(row.targetDate)}`);
    if (row.holdReason) line(`Alasan tunda: ${text(row.holdReason)}`);
    line(`Progres terakhir: ${text(row.progressEntries?.at(-1)?.text || 'Belum ada catatan')}`);
    line(`Pembaruan: ${row.updatedAt ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(row.updatedAt) : 'Belum ada'} (${timeZone})`, { color: '#60718a', size: 8 });
    gap(8);
  }
  const pages = doc.bufferedPageRange().count;
  for (let index = 0; index < pages; index++) {
    doc.switchToPage(index);
    doc.moveTo(42, 807).lineTo(553, 807).strokeColor('#dfe6ef').stroke();
    doc.font('Noto').fontSize(8).fillColor('#60718a').text('SHE Meeting - Data Demo. Bukan dokumen operasional perusahaan.', 42, 817, { lineBreak: false });
    doc.text(`Halaman ${index + 1} / ${pages}`, 458, 817, { width: 95, align: 'right', lineBreak: false });
  }
  doc.end();
  return finished;
}
