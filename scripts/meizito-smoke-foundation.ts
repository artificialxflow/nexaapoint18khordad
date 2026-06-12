/**
 * Meizito v10 foundation smoke — run against local dev server.
 * Usage: npm run dev (separate terminal) then npm run test:meizito:foundation
 */

import { PrismaClient } from '@prisma/client';

const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';
const BOOTSTRAP_USER = process.env.SMOKE_BOOTSTRAP_USER ?? 'artificialxflow';
const BOOTSTRAP_PASS = process.env.SMOKE_BOOTSTRAP_PASS ?? 'Ronak#123Ronak';
const TEST_PREFIX = 'test_meizito_foundation_';

const prisma = new PrismaClient();

type StepResult = { name: string; ok: boolean; detail?: string };
const results: StepResult[] = [];

function pass(name: string, detail?: string) {
  results.push({ name, ok: true, detail });
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name: string, detail?: string) {
  results.push({ name, ok: false, detail });
  console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
}

function parseCookie(setCookie: string | null): string {
  if (!setCookie) return '';
  return setCookie.split(';')[0] ?? '';
}

async function fetchJson(
  path: string,
  init: RequestInit & { cookie?: string } = {}
): Promise<{ res: Response; json: Record<string, unknown> }> {
  const headers = new Headers(init.headers);
  if (init.cookie) headers.set('Cookie', init.cookie);
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  let json: Record<string, unknown> = {};
  try {
    json = (await res.json()) as Record<string, unknown>;
  } catch {
    json = {};
  }
  return { res, json };
}

async function cleanup() {
  await prisma.business.deleteMany({
    where: { name: { startsWith: TEST_PREFIX } },
  });
}

async function main() {
  console.log(`\n[meizito-smoke-foundation] base=${BASE}\n`);

  let cookie = '';
  let businessId = '';

  try {
    await cleanup();

    const login = await fetchJson('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: BOOTSTRAP_USER, password: BOOTSTRAP_PASS }),
    });
    cookie = parseCookie(login.res.headers.get('set-cookie'));
    if (login.res.ok && cookie) pass('login bootstrap');
    else fail('login bootstrap', `status=${login.res.status}`);

    const ncStatus = await fetchJson('/api/nextcloud/status', { cookie });
    if (ncStatus.res.ok) {
      const configured = (ncStatus.json as { configured?: boolean }).configured;
      pass('GET /api/nextcloud/status', configured ? 'configured' : 'not configured (OK for smoke)');
    } else {
      fail('GET /api/nextcloud/status', `status=${ncStatus.res.status}`);
    }

    const createBiz = await fetchJson('/api/businesses', {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `${TEST_PREFIX}${Date.now()}` }),
    });
    const bizData = createBiz.json.data as { business?: { id: string } } | undefined;
    businessId = bizData?.business?.id ?? '';
    if (createBiz.res.ok && businessId) pass('POST /api/businesses', businessId);
    else fail('POST /api/businesses', `status=${createBiz.res.status}`);

    const health = await fetchJson(`/api/meizito/${businessId}/health`, { cookie });
    const healthData = health.json.data as { phase?: string; memberRole?: string } | undefined;
    if (health.res.ok && healthData?.phase === 'v10-foundation') {
      pass('GET /api/meizito/[id]/health', healthData.memberRole);
    } else {
      fail('GET /api/meizito/[id]/health', `status=${health.res.status}`);
    }

    const healthForbidden = await fetchJson('/api/meizito/nonexistent-business-id/health', { cookie });
    if (healthForbidden.res.status === 403 || healthForbidden.res.status === 404) {
      pass('health rejects invalid business', `status=${healthForbidden.res.status}`);
    } else {
      fail('health rejects invalid business', `status=${healthForbidden.res.status}`);
    }

    const profileTable = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'BusinessMemberProfile'
      ) AS exists
    `;
    if (profileTable[0]?.exists) pass('DB table BusinessMemberProfile');
    else fail('DB table BusinessMemberProfile');

    const ncList = await fetchJson(
      `/api/nextcloud/list?path=${encodeURIComponent(`/Nexa/${businessId}/meizito/`)}`,
      { cookie }
    );
    if (ncList.res.ok || ncList.res.status === 502) {
      pass(
        'GET /api/nextcloud/list tenant path',
        ncList.res.ok ? 'ok' : '502 (NC unreachable — auth OK)'
      );
    } else if (ncList.res.status === 401 || ncList.res.status === 403) {
      fail('GET /api/nextcloud/list tenant path', `status=${ncList.res.status}`);
    } else {
      pass('GET /api/nextcloud/list tenant path', `status=${ncList.res.status}`);
    }
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n[meizito-smoke-foundation] ${results.length - failed.length}/${results.length} passed\n`);
  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
