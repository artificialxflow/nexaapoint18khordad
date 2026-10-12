/**
 * Runtime DB checks before prisma migrate deploy (Docker entrypoint + local via npm run db:preflight).
 * Logs host/port/db/user only — never passwords.
 */

const net = require('net');

function parsePostgresUrl(name, raw) {
  if (!raw || !raw.trim()) {
    return { error: `${name} is empty` };
  }
  try {
    const normalized = raw.replace(/^postgres:\/\//, 'postgresql://');
    const u = new URL(normalized);
    return {
      host: u.hostname,
      port: u.port || '5432',
      database: decodeURIComponent(u.pathname.replace(/^\//, '') || ''),
      user: decodeURIComponent(u.username || ''),
    };
  } catch (e) {
    return { error: `${name} invalid URL: ${e.message}` };
  }
}

function tcpCheck(host, port, timeoutMs = 10_000) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port: Number(port) }, () => {
      socket.destroy();
      resolve({ ok: true });
    });
    socket.setTimeout(timeoutMs);
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ ok: false, error: 'ETIMEDOUT' });
    });
    socket.on('error', (err) => {
      resolve({ ok: false, error: err.code || err.message });
    });
  });
}

async function checkEnvVar(name) {
  const parsed = parsePostgresUrl(name, process.env[name]);
  if (parsed.error) {
    console.error(`[preflight] ERROR: ${parsed.error}`);
    return { name, fatal: true, ok: false };
  }

  console.log(
    `[preflight] ${name} → user=${parsed.user || '(none)'} host=${parsed.host} port=${parsed.port} db=${parsed.database}`,
  );

  const tcp = await tcpCheck(parsed.host, parsed.port);
  if (tcp.ok) {
    console.log(`[preflight] ${name} TCP connect ${parsed.host}:${parsed.port} OK`);
    return { name, fatal: false, ok: true, parsed };
  }

  console.error(
    `[preflight] ${name} TCP connect ${parsed.host}:${parsed.port} FAILED (${tcp.error})`,
  );
  return { name, fatal: false, ok: false, parsed, tcpError: tcp.error };
}

async function main() {
  console.log('[preflight] nexaapp database preflight');
  console.log(`[preflight] NODE_ENV=${process.env.NODE_ENV ?? 'unset'}`);

  const results = [];
  for (const name of ['DATABASE_URL', 'DIRECT_URL']) {
    if (!process.env[name]) {
      console.error(`[preflight] ERROR: ${name} is not set`);
      process.exit(1);
    }
    results.push(await checkEnvVar(name));
  }

  const db = results.find((r) => r.name === 'DATABASE_URL');
  if (!db?.ok) {
    console.error('[preflight] ─────────────────────────────────────────');
    console.error('[preflight] DATABASE_URL is not reachable from this runtime.');
    console.error('[preflight] Runflare: use Internal Postgres URL in app Environment → Runtime.');
    console.error('[preflight] Local PC: enable Remote access + allowlist your IP, or use internal shell.');
    console.error('[preflight] prisma migrate deploy will fail with P1001 until TCP succeeds.');
    console.error('[preflight] ─────────────────────────────────────────');
    process.exit(1);
  }

  if (results.some((r) => !r.ok)) {
    console.error('[preflight] WARNING: DIRECT_URL TCP failed but DATABASE_URL OK — migrate may still work.');
  }

  const secret = process.env.AUTH_SESSION_SECRET ?? '';
  if (secret.length < 32) {
    console.error(
      `[preflight] ERROR: AUTH_SESSION_SECRET must be at least 32 characters (got ${secret.length})`,
    );
    console.error('[preflight] Set it in Runflare → Environment → Runtime');
    process.exit(1);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  if (!appUrl) {
    console.error('[preflight] ERROR: NEXT_PUBLIC_APP_URL is not set (Build + Runtime on Runflare)');
    process.exit(1);
  }
  console.log(`[preflight] NEXT_PUBLIC_APP_URL=${appUrl}`);
  console.log(`[preflight] AUTH_SESSION_SECRET length=${secret.length} OK`);

  console.log('[preflight] preflight OK — proceeding to prisma migrate deploy');
}

main().catch((err) => {
  console.error('[preflight] unexpected error:', err);
  process.exit(1);
});
