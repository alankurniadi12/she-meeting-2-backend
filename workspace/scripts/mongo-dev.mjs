import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const directory = fileURLToPath(new URL('../.local/mongodb/', import.meta.url));
await mkdir(directory, { recursive: true });
const args = ['--dbpath', directory, '--bind_ip', '127.0.0.1', '--port', '27027', '--nounixsocket', '--logpath', `${directory}mongod.log`, '--logappend'];
console.log('MongoDB development: 127.0.0.1:27027 (terpisah dari port default).');
console.log(`Log: ${directory}mongod.log`);
const child = spawn('mongod', args, { stdio: 'inherit' });
child.on('error', () => {
  console.error('mongod tidak ditemukan. Pasang MongoDB Community atau gunakan MONGODB_URI untuk database development terpisah.');
  process.exitCode = 1;
});
child.on('exit', (code) => { process.exitCode = code ?? 0; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
