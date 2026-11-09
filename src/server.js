import 'dotenv/config';
import { createServer } from 'node:http';
import { loadConfig } from './config/env.js';
import { connectDatabase } from './lib/database.js';
import { createApp } from './app.js';
import { prepareAuthStore } from './auth/store.js';
import { createAuthRouter } from './auth/router.js';

let server;
let client;
let stopping = false;
async function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  const deadline = setTimeout(() => process.exit(1), 5000);
  deadline.unref();
  if (server?.listening) await new Promise((resolve) => { server.close(resolve); server.closeIdleConnections(); });
  await client?.close();
  process.exitCode = code;
  clearTimeout(deadline);
}
try {
  const config = loadConfig();
  const connection = await connectDatabase(config);
  client = connection.client;
  await prepareAuthStore(connection.database);
  const authRouter = await createAuthRouter({ database: connection.database, config });
  const app = createApp({ config, authRouter, checkDatabase: async () => {
    const result = await connection.database.command({ ping: 1 }, { timeoutMS: 2000 });
    return result.ok === 1;
  } });
  server = createServer(app);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(config.port, config.host, resolve);
  });
  console.log(`SHE Meeting API: http://${config.host}:${config.port}`);
  console.log('MongoDB development/demo terhubung. Belum ada data operasional.');
  process.on('SIGINT', () => { void shutdown(); });
  process.on('SIGTERM', () => { void shutdown(); });
} catch (error) {
  console.error(error.code === 'EADDRINUSE' ? 'Port backend sedang dipakai. Pilih PORT lain.' : 'Backend gagal dimulai. Periksa konfigurasi dan MongoDB lokal; layanan tidak dibuka.');
  await shutdown(1);
}
