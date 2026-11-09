const allowedEnvironments = new Set(['development', 'test', 'demo']);

export function loadConfig(env = process.env) {
  const appEnv = env.APP_ENV || 'development';
  if (!allowedEnvironments.has(appEnv)) throw new Error('APP_ENV harus development, test, atau demo pada tahap ini.');
  const port = Number(env.PORT || 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT tidak valid.');
  const mongoUri = env.MONGODB_URI || 'mongodb://127.0.0.1:27027';
  if (!/^mongodb(?:\+srv)?:\/\//.test(mongoUri)) throw new Error('MONGODB_URI tidak valid.');
  const databaseName = env.MONGODB_DB || 'she_meeting_dev';
  if (!/^she_meeting_(dev|test|demo)(?:_[a-z0-9_]+)?$/.test(databaseName)) {
    throw new Error('MONGODB_DB harus memakai prefix she_meeting_dev, she_meeting_test, atau she_meeting_demo.');
  }
  if (appEnv === 'test' && !databaseName.startsWith('she_meeting_test')) throw new Error('Lingkungan test wajib memakai database test.');
  if (appEnv === 'demo' && !databaseName.startsWith('she_meeting_demo')) throw new Error('Lingkungan demo wajib memakai database demo.');
  const origins = (env.ALLOWED_ORIGINS || 'http://127.0.0.1:5173,http://localhost:5173').split(',').map((value) => value.trim()).filter(Boolean);
  if (origins.length === 0) throw new Error('ALLOWED_ORIGINS tidak boleh kosong.');
  for (const origin of origins) {
    let parsed;
    try { parsed = new URL(origin); } catch { throw new Error('ALLOWED_ORIGINS tidak valid.'); }
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin || parsed.username || parsed.password) throw new Error('ALLOWED_ORIGINS harus origin HTTP/HTTPS eksplisit.');
  }
  return Object.freeze({
    appEnv, port, host: env.HOST || '127.0.0.1', mongoUri, databaseName,
    allowedOrigins: origins, timeZone: env.APP_TIMEZONE || 'Asia/Jakarta',
  });
}
