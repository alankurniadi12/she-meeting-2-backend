import { Router } from 'express';
import { calendarDate } from '../lib/calendar.js';
import { loadPdfFindings, renderFindingsPdf } from './findings-pdf.js';

export function createExportsRouter({ database, config, now = () => new Date() }) {
  const router = Router();
  let rendering = false;
  router.use((req, res, next) => {
    if (!req.auth) return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Login diperlukan.', requestId: req.requestId } });
    next();
  });
  router.get('/findings.pdf', async (req, res) => {
    if (rendering) throw Object.assign(new Error('Ekspor lain sedang berjalan.'), { status: 429, code: 'EXPORT_BUSY', publicMessage: 'Ekspor lain sedang berjalan. Coba lagi sebentar.' });
    rendering = true;
    try {
      const timestamp = now();
      const report = await loadPdfFindings(database, { query: req.query, timeZone: config.timeZone, today: calendarDate(timestamp, config.timeZone) });
      const pdf = await renderFindingsPdf({ ...report, account: req.auth.account, now: timestamp, timeZone: config.timeZone });
      const filename = `she-meeting-temuan-${calendarDate(timestamp, config.timeZone).replaceAll('-', '')}.pdf`;
      res.set({ 'Content-Type': 'application/pdf', 'Content-Length': String(pdf.length),
        'Content-Disposition': `attachment; filename="${filename}"`, 'X-Content-Type-Options': 'nosniff' });
      res.end(pdf);
    } finally { rendering = false; }
  });
  return router;
}
