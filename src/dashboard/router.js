import { Router } from 'express';
import { getDashboard } from './service.js';

export function createDashboardRouter({ database, config, now = () => new Date() }) {
  const router = Router();
  // Mount after the session guard. Also fail closed if mounted incorrectly in future.
  router.use((req, res, next) => {
    if (!req.auth) return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Login diperlukan.', requestId: req.requestId } });
    next();
  });
  router.get('/', async (req, res) => {
    const data = await getDashboard(database, { query: req.query, timeZone: config.timeZone, now: now() });
    res.json({ data });
  });
  return router;
}
