import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const targets = [
  { dir: 'she-meeting-backend', args: ['--watch', 'src/server.js'] },
  { dir: 'she-meeting-frontend', args: ['node_modules/vite/bin/vite.js'] },
];
for (const target of targets) {
  if (!existsSync(`${root}${target.dir}/node_modules`)) {
    console.error(`Dependency ${target.dir} belum terpasang. Ikuti README.md.`);
    process.exit(1);
  }
}
const children = targets.map(({ dir, args }) => spawn(process.execPath, args, {
  cwd: `${root}${dir}`, stdio: 'inherit', env: process.env,
}));
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (child.exitCode === null) child.kill('SIGTERM');
  process.exitCode = code;
}
for (const child of children) {
  child.on('error', () => { console.error('Proses development gagal dijalankan.'); stop(1); });
  child.on('exit', (code, signal) => { if (!stopping) stop(code ?? (signal ? 1 : 0)); });
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
