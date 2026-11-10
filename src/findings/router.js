import { Router } from 'express';
import { readFindings } from './read-service.js';
import { createFinding, updateFinding, changeCancellation } from './write-service.js';
import { findingDetail } from './detail-service.js';
import { findingHistory } from './history-service.js';
import { uploadAttachment, listAttachments, readAttachment } from './attachments.js';

export function createFindingRouter({ database, config, now = () => new Date() }) {
  const router = Router();
  router.use((req, res, next) => {
    if (!req.auth) return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Login diperlukan.', requestId: req.requestId } });
    next();
  });
  // Keep static summary before /:id.
  router.get('/summary', async (req, res) => res.json(await readFindings(database, { query: req.query, timeZone: config.timeZone, now: now(), summaryOnly: true })));
  router.get('/', async (req, res) => res.json(await readFindings(database, { query: req.query, timeZone: config.timeZone, now: now() })));
  router.post('/', async (req, res) => {
    const result = await createFinding(database, { body: req.body, account: req.auth.account, timeZone: config.timeZone, now: now() });
    res.status(result.meta.replayed ? 200 : 201).json(result);
  });
  router.get('/:id', async (req, res) => res.json({ data: await findingDetail(database, { id: req.params.id, timeZone: config.timeZone, now: now() }) }));
  router.get('/:id/progress', async (req, res) => res.json(await findingHistory(database, { id: req.params.id, query: req.query, kind: 'progress' })));
  router.get('/:id/history', async (req, res) => res.json(await findingHistory(database, { id: req.params.id, query: req.query, kind: 'audit' })));
  router.patch('/:id', async (req, res) => res.json(await updateFinding(database, { id: req.params.id, body: req.body, account: req.auth.account, timeZone: config.timeZone, now: now() })));
  router.post('/:id/progress', async (req, res) => res.json(await updateFinding(database, { id: req.params.id, body: req.body, account: req.auth.account, timeZone: config.timeZone, now: now(), kind: 'PROGRESS' })));
  router.post('/:id/cancel', async (req, res) => res.json(await changeCancellation(database, { id: req.params.id, body: req.body, account: req.auth.account, now: now(), kind: 'CANCEL' })));
  router.post('/:id/restore', async (req, res) => res.json(await changeCancellation(database, { id: req.params.id, body: req.body, account: req.auth.account, now: now(), kind: 'RESTORE' })));
  router.get('/:id/attachments', async (req, res) => res.json({ data: await listAttachments(database, req.params.id) }));
  router.post('/:id/attachments', async (req, res) => {
    const result = await uploadAttachment(database, { id: req.params.id, req, account: req.auth.account, config, now: now() });
    res.status(result.meta.replayed ? 200 : 201).json(result);
  });
  router.get('/:id/attachments/:attachmentId', async (req, res) => {
    const { item, stream } = await readAttachment(database, { id: req.params.id, attachmentId: req.params.attachmentId, config });
    res.set({ 'Content-Type': item.mime, 'Content-Length': String(item.sizeBytes), 'Content-Disposition': 'inline', 'X-Content-Type-Options': 'nosniff' });
    stream.pipe(res);
  });
  return router;
}
