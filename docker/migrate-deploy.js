/**
 * prisma migrate deploy with cwd=/app, heartbeat logs, and optional timeout.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const schema = '/app/prisma/schema.prisma';
const cli = '/prisma-cli/node_modules/prisma/build/index.js';
const timeoutMs = Number(process.env.MIGRATE_TIMEOUT_MS || 300_000);
const heartbeatMs = Number(process.env.MIGRATE_HEARTBEAT_MS || 10_000);

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
console.log('[migrate] timeout_ms=', timeoutMs);

const env = { ...process.env };
// Single-replica Runflare: avoid stuck migrate after pod SIGKILL mid-deploy.
if (env.PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK == null) {
  env.PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK = '1';
  console.log('[migrate] PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK=1 (default for single replica)');
}

const child = spawn(process.execPath, [cli, 'migrate', 'deploy', `--schema=${schema}`], {
  stdio: 'inherit',
  env,
});

const started = Date.now();
const heartbeat = setInterval(() => {
  const elapsed = Math.round((Date.now() - started) / 1000);
  console.log(`[migrate] still running... elapsed=${elapsed}s`);
}, heartbeatMs);

const timer = setTimeout(() => {
  console.error(`[migrate] ERROR: timed out after ${timeoutMs}ms — killing prisma`);
  child.kill('SIGKILL');
}, timeoutMs);

child.on('error', (err) => {
  clearInterval(heartbeat);
  clearTimeout(timer);
  console.error('[migrate] spawn error:', err.message);
  process.exit(1);
});

child.on('close', (code, signal) => {
  clearInterval(heartbeat);
  clearTimeout(timer);

  if (signal) {
    console.error('[migrate] killed with signal:', signal);
    process.exit(1);
  }
  if (code !== 0) {
    console.error('[migrate] exit code:', code);
    process.exit(code ?? 1);
  }
  console.log('[migrate] prisma migrate deploy finished successfully');
  process.exit(0);
});
