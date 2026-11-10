import { Router } from 'express';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { hashPassword, verifyPassword } from './password.js';
import { publicAccount } from './store.js';
import { createAccount, updateAccount } from './admin-accounts.js';

const SESSION_MS = 12 * 60 * 60 * 1000;
const WINDOW_MS = 15 * 60 * 1000;
const digest = (value) => createHash('sha256').update(value).digest('hex');
const token = () => randomBytes(32).toString('hex');
const fail = (status, code, message) => Object.assign(new Error(message), { status, code, publicMessage: message });

function cookieToken(req, cookieName) {
  const values = (req.headers.cookie || '').split(';').map((part) => part.trim());
  const value = values.find((part) => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  return /^[a-f0-9]{64}$/.test(value || '') ? value : null;
}

export async function createAuthRouter({ database, config, now = () => new Date() }) {
  const router = Router();
  const accounts = database.collection('accounts');
  const divisions = database.collection('divisions');
  const sessions = database.collection('sessions');
  const attempts = database.collection('loginAttempts');
  const dummyHash = await hashPassword(token());
  const cookieName = config.cookieSecure ? '__Host-she_session' : 'she_session_dev';
  const cookieOptions = { httpOnly: true, secure: config.cookieSecure, sameSite: 'lax', path: '/' };
  const checkOrigin = (req) => {
    if (!config.allowedOrigins.includes(req.get('Origin'))) {
      throw fail(403, 'ORIGIN_FORBIDDEN', 'Origin permintaan tidak diizinkan.');
    }
  };

  async function limitLogin(req) {
    const time = now().getTime();
    const window = Math.floor(time / WINDOW_MS);
    const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase().slice(0, 64) : '';
    // Fixed windows live in MongoDB, so restarting the API does not reset them.
    for (const [key, limit] of [[`ip:${req.ip}`, 30], [`username:${username}`, 10]]) {
      const result = await attempts.findOneAndUpdate({ _id: digest(`${window}:${key}`) }, {
        $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((window + 1) * WINDOW_MS) },
      }, { upsert: true, returnDocument: 'after' });
      if (result.count > limit) {
        req.res.set('Retry-After', String(Math.max(1, Math.ceil(((window + 1) * WINDOW_MS - time) / 1000))));
        throw fail(429, 'LOGIN_RATE_LIMITED', 'Terlalu banyak percobaan login. Coba lagi nanti.');
      }
    }
  }

  async function identity(account) {
    const division = account.divisionId ? await divisions.findOne({ _id: account.divisionId }) : null;
    return publicAccount(account, division);
  }

  router.post('/auth/login', async (req, res) => {
    checkOrigin(req);
    await limitLogin(req);
    const body = req.body;
    if (!body || Array.isArray(body) || Object.keys(body).some((key) => !['username', 'password'].includes(key)) ||
        typeof body.username !== 'string' || !/^[a-z0-9._-]{3,64}$/.test(body.username.trim().toLowerCase()) ||
        typeof body.password !== 'string' || body.password.length < 1 || body.password.length > 128) {
      throw fail(422, 'INVALID_CREDENTIAL_INPUT', 'Isi username dan kata sandi dengan format yang valid.');
    }
    const account = await accounts.findOne({ username: body.username.trim().toLowerCase() });
    const valid = await verifyPassword(account?.passwordHash || dummyHash, body.password);
    if (!valid || !account?.active || !['ADMIN', 'DIVISION'].includes(account.role)) {
      throw fail(401, 'INVALID_CREDENTIALS', 'Username atau kata sandi tidak sesuai.');
    }
    const rawToken = token();
    const csrfToken = token();
    const issuedAt = now();
    const expiresAt = new Date(issuedAt.getTime() + SESSION_MS);
    const accountData = await identity(account);
    await sessions.insertOne({ _id: digest(rawToken), accountId: account._id,
      sessionVersion: account.sessionVersion, csrfToken, createdAt: issuedAt, expiresAt });
    const oldToken = cookieToken(req, cookieName);
    if (oldToken) await sessions.deleteOne({ _id: digest(oldToken) });
    res.cookie(cookieName, rawToken, { ...cookieOptions, maxAge: SESSION_MS });
    res.json({ data: { account: accountData, csrfToken, expiresAt } });
  });

  router.use(async (req, _res, next) => {
    const rawToken = cookieToken(req, cookieName);
    const session = rawToken ? await sessions.findOne({ _id: digest(rawToken), expiresAt: { $gt: now() } }) : null;
    const account = session ? await accounts.findOne({ _id: session.accountId, active: true, sessionVersion: session.sessionVersion }) : null;
    if (!account || !['ADMIN', 'DIVISION'].includes(account.role)) {
      throw fail(401, 'UNAUTHENTICATED', 'Sesi tidak tersedia atau sudah berakhir. Silakan login.');
    }
    req.auth = { account, session };
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      checkOrigin(req);
      const supplied = req.get('X-CSRF-Token') || '';
      if (!/^[a-f0-9]{64}$/.test(supplied) || !timingSafeEqual(Buffer.from(supplied, 'hex'), Buffer.from(session.csrfToken, 'hex'))) {
        throw fail(403, 'CSRF_FORBIDDEN', 'Permintaan tidak valid. Muat ulang halaman dan coba kembali.');
      }
    }
    next();
  });

  router.get('/auth/me', async (req, res) => res.json({ data: {
    account: await identity(req.auth.account), csrfToken: req.auth.session.csrfToken, expiresAt: req.auth.session.expiresAt,
  } }));
  router.post('/auth/logout', async (req, res) => {
    await sessions.deleteOne({ _id: req.auth.session._id });
    res.clearCookie(cookieName, cookieOptions);
    res.sendStatus(204);
  });
  router.get('/divisions', async (req, res) => {
    if (Object.keys(req.query).some((key) => key !== 'activeOnly') ||
        (req.query.activeOnly !== undefined && !['true', 'false'].includes(req.query.activeOnly))) {
      throw fail(400, 'INVALID_QUERY', 'Filter divisi tidak valid.');
    }
    const rows = await divisions.find(req.query.activeOnly === 'false' ? {} : { active: true }).sort({ name: 1 }).toArray();
    res.json({ data: rows.map((row) => ({ id: row._id.toString(), code: row.code, name: row.name, active: row.active })) });
  });
  router.use('/admin', (req, _res, next) => {
    if (req.auth.account.role !== 'ADMIN') throw fail(403, 'FORBIDDEN', 'Akses hanya untuk Admin ICT.');
    next();
  });
  router.get('/admin/accounts', async (req, res) => {
    const { page = '1', pageSize = '20' } = req.query;
    if (Object.keys(req.query).some((key) => !['page', 'pageSize'].includes(key)) ||
        typeof page !== 'string' || typeof pageSize !== 'string' ||
        !/^[1-9]\d{0,5}$/.test(page) || !/^[1-9]\d{0,2}$/.test(pageSize) || Number(pageSize) > 100) {
      throw fail(400, 'INVALID_QUERY', 'Pagination tidak valid.');
    }
    const rows = await accounts.find({}, { projection: { passwordHash: 0, audit: 0 } })
      .sort({ username: 1 }).skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize)).toArray();
    res.json({ data: await Promise.all(rows.map(async (row) => ({ ...await identity(row), version: row.version }))), meta: {
      page: Number(page), pageSize: Number(pageSize), total: await accounts.countDocuments(),
    } });
  });
  router.post('/admin/accounts', async (req, res) => {
    const result = await createAccount(database, { body: req.body, admin: req.auth.account, now: now() });
    res.status(result.meta.replayed ? 200 : 201).json(result);
  });
  router.patch('/admin/accounts/:id', async (req, res) => res.json(await updateAccount(database, { id: req.params.id, body: req.body, admin: req.auth.account, now: now() })));
  router.post('/admin/accounts/:id/reset-password', async (req, res) => res.json(await updateAccount(database, { id: req.params.id, body: req.body, admin: req.auth.account, now: now(), reset: true })));
  return router;
}
