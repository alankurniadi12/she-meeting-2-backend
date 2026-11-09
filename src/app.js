import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { randomUUID } from 'node:crypto';

export function createApp({ config, checkDatabase, authRouter, dashboardRouter, findingRouter }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', false);
  app.use(helmet());
  app.use((req, res, next) => {
    req.requestId = randomUUID();
    res.set('X-Request-Id', req.requestId);
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.use(cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || config.allowedOrigins.includes(origin)) return callback(null, true);
      callback(Object.assign(new Error('Origin ditolak.'), { status: 403, code: 'ORIGIN_FORBIDDEN' }));
    },
  }));
  app.use(express.json({ limit: '64kb', strict: true }));
  app.get('/health', (_req, res) => res.json({ data: { status: 'ok', service: 'she-meeting-api' } }));
  app.get('/ready', async (req, res) => {
    // Internal only. Reverse proxies must not expose this route publicly.
    if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Akses ditolak.', requestId: req.requestId } });
    }
    try {
      if (!await checkDatabase()) throw new Error('Unavailable');
      res.json({ data: { status: 'ready' } });
    } catch {
      res.status(503).json({ error: { code: 'NOT_READY', message: 'Layanan belum siap.', requestId: req.requestId } });
    }
  });
  if (authRouter) app.use('/api/v1', authRouter);
  if (dashboardRouter) app.use('/api/v1/dashboard', dashboardRouter);
  if (findingRouter) app.use('/api/v1/findings', findingRouter);
  // Without a store (e.g. isolated foundation tests), fail closed.
  app.use('/api/v1', (req, res) => res.status(req.auth ? 404 : 401).json({ error: {
    code: req.auth ? 'NOT_FOUND' : 'UNAUTHENTICATED', message: req.auth ? 'Endpoint belum tersedia.' : 'Login diperlukan.', requestId: req.requestId,
  } }));
  app.use((req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint tidak ditemukan.', requestId: req.requestId } }));
  app.use((error, req, res, _next) => {
    const status = [400, 401, 403, 413, 422, 429].includes(error.status) ? error.status : 500;
    if (error.publicMessage && status !== 500) {
      return res.status(status).json({ error: { code: error.code, message: error.publicMessage, requestId: req.requestId } });
    }
    const code = status === 400 ? 'INVALID_JSON' : status === 413 ? 'PAYLOAD_TOO_LARGE' : error.code === 'ORIGIN_FORBIDDEN' ? error.code : 'INTERNAL_ERROR';
    const message = status === 400 ? 'Format JSON tidak valid.' : status === 413 ? 'Payload terlalu besar.' : status === 403 ? 'Origin ditolak.' : 'Terjadi gangguan layanan.';
    res.status(status).json({ error: { code, message, requestId: req.requestId } });
  });
  return app;
}
