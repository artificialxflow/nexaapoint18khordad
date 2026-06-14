/**
 * ERP dashboard summary smoke — phase 7.
 * Usage: npm run dev then npm run test:dashboard
 */

import { PrismaClient } from '@prisma/client';

const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';
const BOOTSTRAP_USER = process.env.SMOKE_BOOTSTRAP_USER ?? 'artificialxflow';
const BOOTSTRAP_PASS = process.env.SMOKE_BOOTSTRAP_PASS ?? 'Ronak#123Ronak';
const TEST_PREFIX = 'test_dashboard_';

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
  await prisma.business.deleteMany({ where: { name: { startsWith: TEST_PREFIX } } });
}

async function main() {
  console.log(`\n[dashboard-smoke] base=${BASE}\n`);

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

    const createBiz = await fetchJson('/api/businesses', {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `${TEST_PREFIX}${Date.now()}` }),
    });
    const bizData = createBiz.json.data as { business?: { id: string; name?: string } } | undefined;
    businessId = bizData?.business?.id ?? '';
    if (createBiz.res.ok && businessId) pass('POST /api/businesses', businessId);
    else fail('POST /api/businesses');

    const summaryRes = await fetchJson(`/api/dashboard/${businessId}/summary`, { cookie });
    const summaryData = summaryRes.json.data as {
      summary?: {
        businessName?: string;
        stats?: { peopleCount?: number };
        chartData?: unknown[];
        productionStatus?: unknown[];
      };
    } | undefined;
    const summary = summaryData?.summary;
    if (
      summaryRes.res.ok &&
      summary?.businessName &&
      typeof summary.stats?.peopleCount === 'number' &&
      Array.isArray(summary.chartData) &&
      summary.chartData.length === 7 &&
      Array.isArray(summary.productionStatus)
    ) {
      pass('GET /api/dashboard/[id]/summary', `people=${summary.stats.peopleCount}`);
    } else {
      fail('GET /api/dashboard/[id]/summary', `status=${summaryRes.res.status}`);
    }

    const noAuth = await fetchJson(`/api/dashboard/${businessId}/summary`);
    if (noAuth.res.status === 401) pass('summary without session → 401');
    else fail('summary without session → 401', `status=${noAuth.res.status}`);

    const board = await fetchJson(`/api/meizito/${businessId}/boards`, {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'بورد smoke' }),
    });
    const boardData = board.json.data as { board?: { id: string } } | undefined;
    const boardId = boardData?.board?.id ?? '';
    if (board.res.ok && boardId) pass('POST board for production widget', boardId);
    else fail('POST board for production widget');

    const afterBoard = await fetchJson(`/api/dashboard/${businessId}/summary`, { cookie });
    const afterData = afterBoard.json.data as {
      summary?: { productionStatus?: Array<{ label?: string; value?: number }> };
    } | undefined;
    const prod = afterData?.summary?.productionStatus ?? [];
    if (afterBoard.res.ok && prod.some((p) => p.label === 'بورد smoke')) {
      pass('summary reflects workspace board');
    } else {
      fail('summary reflects workspace board', `items=${prod.length}`);
    }
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n[dashboard-smoke] ${results.length - failed.length}/${results.length} passed\n`);
  if (failed.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
