/**
 * prisma migrate deploy with cwd=/app and flushed logging (Runflare/k8s diagnostics).
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const schema = '/app/prisma/schema.prisma';
const cli = '/prisma-cli/node_modules/prisma/build/index.js';

if (!fs.existsSync(schema)) {
  console.error('[migrate] ERROR: schema missing at', schema);
  process.exit(1);
}
if (!fs.existsSync(cli)) {
  console.error('[migrate] ERROR: Prisma CLI missing at', cli);
  process.exit(1);
}

const migrationsDir = path.join('/app/prisma/migrations');
try {
  const dirs = fs.readdirSync(migrationsDir).filter((d) => !d.startsWith('.'));
  console.log(`[migrate] found ${dirs.length} migration folder(s) under prisma/migrations`);
} catch (e) {
  console.error('[migrate] ERROR: cannot read migrations dir:', e.message);
  process.exit(1);
}

process.chdir('/app');
console.log('[migrate] running: node prisma/build/index.js migrate deploy');
console.log('[migrate] cwd=', process.cwd());

const result = spawnSync(process.execPath, [cli, 'migrate', 'deploy', `--schema=${schema}`], {
  stdio: 'inherit',
  env: process.env,
});

if (result.error) {
  console.error('[migrate] spawn error:', result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  console.error('[migrate] exit code:', result.status ?? 'null');
  if (result.signal) console.error('[migrate] signal:', result.signal);
  process.exit(result.status ?? 1);
}

console.log('[migrate] prisma migrate deploy finished successfully');
