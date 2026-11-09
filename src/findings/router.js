import { Router } from 'express';
import { readFindings } from './read-service.js';

export function createFindingRouter({ database, config, now = () => new Date() }) {
  const router = Router();
  router.use((req, res, next) => {
    if (!req.auth) return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Login diperlukan.', requestId: req.requestId } });
    next();
  });
  // Static summary is registered first; detail and write endpoints arrive in D0-05/D0-06.
  router.get('/summary', async (req, res) => res.json(await readFindings(database, { query: req.query, timeZone: config.timeZone, now: now(), summaryOnly: true })));
  router.get('/', async (req, res) => res.json(await readFindings(database, { query: req.query, timeZone: config.timeZone, now: now() })));
  return router;
}
