/**
 * Business smoke test — run against local dev server.
 * Usage: npm run dev (separate terminal) then npm run test:business
 */

import { PrismaClient } from '@prisma/client';

const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';
const BOOTSTRAP_USER = process.env.SMOKE_BOOTSTRAP_USER ?? 'artificialxflow';
const BOOTSTRAP_PASS = process.env.SMOKE_BOOTSTRAP_PASS ?? 'Ronak#123Ronak';
const TEST_PREFIX = 'test_biz_smoke_';

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
  const businesses = await prisma.business.findMany({
    where: { name: { startsWith: TEST_PREFIX } },
    select: { id: true },
  });
  if (businesses.length) {
    await prisma.business.deleteMany({ where: { id: { in: businesses.map((b) => b.id) } } });
  }
}

async function main() {
  console.log(`\n[business-smoke] base=${BASE}\n`);

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

    const listEmpty = await fetchJson('/api/businesses', { cookie });
    if (listEmpty.res.ok) pass('GET /api/businesses');
    else fail('GET /api/businesses', `status=${listEmpty.res.status}`);

    const stamp = Date.now();
    const name = `${TEST_PREFIX}${stamp}`;

    const create = await fetchJson('/api/businesses', {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const createData = create.json.data as { business?: { id: string; name: string; role?: string } } | undefined;
    businessId = createData?.business?.id ?? '';
    if (create.res.ok && businessId && createData?.business?.role === 'owner') {
      pass('POST /api/businesses', businessId);
    } else {
      fail('POST /api/businesses', `status=${create.res.status}`);
    }

    if (businessId) {
      const getOne = await fetchJson(`/api/businesses/${businessId}`, { cookie });
      if (getOne.res.ok) pass('GET /api/businesses/[id]');
      else fail('GET /api/businesses/[id]', `status=${getOne.res.status}`);

      const profile = await fetchJson(`/api/businesses/${businessId}/profile`, {
        method: 'PATCH',
        cookie,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeName: 'نام تجاری تست', legalName: 'نام حقوقی تست' }),
      });
      if (profile.res.ok) pass('PATCH /api/businesses/[id]/profile');
      else fail('PATCH /api/businesses/[id]/profile', `status=${profile.res.status}`);

      const fiscal = await fetchJson(`/api/businesses/${businessId}/fiscal-years`, { cookie });
      if (fiscal.res.ok) pass('GET /api/businesses/[id]/fiscal-years');
      else fail('GET /api/businesses/[id]/fiscal-years', `status=${fiscal.res.status}`);

      const project = await fetchJson(`/api/businesses/${businessId}/projects`, {
        method: 'POST',
        cookie,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'پروژه smoke', isDefault: true }),
      });
      const projectData = project.json.data as { project?: { id: string } } | undefined;
      const projectId = projectData?.project?.id ?? '';
      if (project.res.ok && projectId) pass('POST /api/businesses/[id]/projects', projectId);
      else fail('POST /api/businesses/[id]/projects', `status=${project.res.status}`);

      if (projectId) {
        const patchProject = await fetchJson(`/api/businesses/${businessId}/projects/${projectId}`, {
          method: 'PATCH',
          cookie,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'پروژه smoke ویرایش' }),
        });
        if (patchProject.res.ok) pass('PATCH /api/businesses/[id]/projects/[projectId]');
        else fail('PATCH project', `status=${patchProject.res.status}`);

        const delProject = await fetchJson(`/api/businesses/${businessId}/projects/${projectId}`, {
          method: 'DELETE',
          cookie,
        });
        if (delProject.res.ok) pass('DELETE /api/businesses/[id]/projects/[projectId]');
        else fail('DELETE project', `status=${delProject.res.status}`);
      }

      const archive = await fetchJson(`/api/businesses/${businessId}`, {
        method: 'DELETE',
        cookie,
      });
      if (archive.res.ok) pass('DELETE /api/businesses/[id] (archive)');
      else fail('DELETE /api/businesses/[id]', `status=${archive.res.status}`);

      const listAfter = await fetchJson('/api/businesses', { cookie });
      const listData = listAfter.json.data as { businesses?: { id: string }[] } | undefined;
      const stillListed = listData?.businesses?.some((b) => b.id === businessId);
      if (listAfter.res.ok && !stillListed) pass('archived business hidden from list');
      else fail('archived business hidden from list');
    }
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }

  printSummary();
  const failed = results.filter((r) => !r.ok).length;
  process.exit(failed ? 1 : 0);
}

function printSummary() {
  const failed = results.filter((r) => !r.ok);
  console.log('\n[business-smoke] summary');
  console.log(`  passed: ${results.length - failed.length}/${results.length}`);
  if (failed.length) {
    console.log('  failed steps:');
    for (const f of failed) console.log(`    - ${f.name}: ${f.detail ?? ''}`);
  }
  console.log('');
}

main().catch((err) => {
  console.error('[business-smoke] fatal', err);
  prisma.$disconnect().finally(() => process.exit(1));
});
