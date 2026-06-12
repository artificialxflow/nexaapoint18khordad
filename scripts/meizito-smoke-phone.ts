/**
 * Meizito phone directory smoke — phase 1.
 * Usage: npm run dev then npm run test:meizito:phone
 */

import { PrismaClient } from '@prisma/client';

const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';
const BOOTSTRAP_USER = process.env.SMOKE_BOOTSTRAP_USER ?? 'artificialxflow';
const BOOTSTRAP_PASS = process.env.SMOKE_BOOTSTRAP_PASS ?? 'Ronak#123Ronak';
const TEST_PREFIX = 'test_meizito_phone_';

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
  console.log(`\n[meizito-smoke-phone] base=${BASE}\n`);

  let cookie = '';
  let businessId = '';
  let userId = '';

  try {
    await cleanup();

    const login = await fetchJson('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: BOOTSTRAP_USER, password: BOOTSTRAP_PASS }),
    });
    cookie = parseCookie(login.res.headers.get('set-cookie'));
    const loginData = login.json.data as { user?: { id: string } } | undefined;
    userId = loginData?.user?.id ?? '';
    if (login.res.ok && cookie && userId) pass('login bootstrap', userId);
    else fail('login bootstrap', `status=${login.res.status}`);

    const createBiz = await fetchJson('/api/businesses', {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `${TEST_PREFIX}${Date.now()}` }),
    });
    const bizData = createBiz.json.data as { business?: { id: string } } | undefined;
    businessId = bizData?.business?.id ?? '';
    if (createBiz.res.ok && businessId) pass('POST /api/businesses', businessId);
    else fail('POST /api/businesses');

    const list = await fetchJson(`/api/meizito/${businessId}/team-directory`, { cookie });
    const listData = list.json.data as { members?: { id: string; name: string }[] } | undefined;
    if (list.res.ok && listData?.members?.length === 1) {
      pass('GET team-directory', `${listData.members.length} member(s)`);
    } else {
      fail('GET team-directory', `status=${list.res.status} count=${listData?.members?.length ?? 0}`);
    }

    const patch = await fetchJson(`/api/meizito/${businessId}/members/${userId}/profile`, {
      method: 'PATCH',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        department: 'فروش',
        jobTitle: 'مدیر تست',
        mobile: '09120000000',
        extension: '101',
        meizitoRole: 'manager',
      }),
    });
    const patchData = patch.json.data as { member?: { department?: string; role?: string } } | undefined;
    if (patch.res.ok && patchData?.member?.department === 'فروش') {
      pass('PATCH member profile', patchData.member.role);
    } else {
      fail('PATCH member profile', `status=${patch.res.status}`);
    }

    const managers = await fetchJson(
      `/api/meizito/${businessId}/team-directory?filter=managers`,
      { cookie }
    );
    const mgrData = managers.json.data as { members?: unknown[] } | undefined;
    if (managers.res.ok && (mgrData?.members?.length ?? 0) >= 1) {
      pass('GET team-directory filter=managers');
    } else {
      fail('GET team-directory filter=managers');
    }

    const search = await fetchJson(
      `/api/meizito/${businessId}/team-directory?q=${encodeURIComponent('0912')}`,
      { cookie }
    );
    const searchData = search.json.data as { members?: unknown[] } | undefined;
    if (search.res.ok && (searchData?.members?.length ?? 0) >= 1) {
      pass('GET team-directory search');
    } else {
      fail('GET team-directory search');
    }

    const profileRow = await prisma.businessMemberProfile.findFirst({
      where: { member: { businessId, userId } },
    });
    if (profileRow?.department === 'فروش') pass('DB BusinessMemberProfile persisted');
    else fail('DB BusinessMemberProfile persisted');
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n[meizito-smoke-phone] ${results.length - failed.length}/${results.length} passed\n`);
  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
