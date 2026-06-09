/**
 * Auth smoke test — run against local dev server.
 * Usage: npm run dev (separate terminal) then npm run test:auth
 */

import { PrismaClient } from '@prisma/client';

const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';
const BOOTSTRAP_USER = process.env.SMOKE_BOOTSTRAP_USER ?? 'artificialxflow';
const BOOTSTRAP_PASS = process.env.SMOKE_BOOTSTRAP_PASS ?? 'Ronak#123Ronak';
const TEST_PREFIX = 'test_smoke_';

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
  const users = await prisma.user.findMany({
    where: { username: { startsWith: TEST_PREFIX } },
    select: { id: true },
  });
  if (users.length) {
    await prisma.session.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
    await prisma.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } });
  }
  await prisma.inviteToken.deleteMany({
    where: { displayName: { startsWith: TEST_PREFIX } },
  });
}

async function main() {
  console.log(`\n[auth-smoke] base=${BASE}\n`);

  let cookie = '';

  try {
    await cleanup();

    // 1. Login
    const login = await fetchJson('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: BOOTSTRAP_USER, password: BOOTSTRAP_PASS }),
    });
    cookie = parseCookie(login.res.headers.get('set-cookie'));
    if (login.res.ok && cookie) pass('login bootstrap');
    else fail('login bootstrap', `status=${login.res.status}`);

    // 2. Me
    const me = await fetchJson('/api/auth/me', { cookie });
    if (me.res.ok) pass('GET /api/auth/me');
    else fail('GET /api/auth/me', `status=${me.res.status}`);

    const meData = me.json.data as { user?: { systemRole?: { slug?: string } } } | undefined;
    const rolesRes = await fetchJson('/api/admin/users', { cookie });
    const rolesData = rolesRes.json.data as { roles?: { id: string; slug: string }[] } | undefined;
    const salesRole = rolesData?.roles?.find((r) => r.slug === 'sales');
    if (!salesRole) {
      fail('load roles', 'sales role not found');
      printSummary();
      process.exit(1);
    }

    const stamp = Date.now();
    const displayName = `${TEST_PREFIX}${stamp}`;

    // 3. Direct auto provision
    const direct = await fetchJson('/api/admin/users/provision', {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName,
        systemRoleId: salesRole.id,
        credentialMode: 'auto',
        delivery: 'direct',
      }),
    });
    const directData = direct.json.data as {
      credentials?: { username: string; password: string };
    } | undefined;
    if (direct.res.ok && directData?.credentials?.username) {
      pass('provision direct auto', directData.credentials.username);
    } else {
      fail('provision direct auto', `status=${direct.res.status}`);
    }

    // 4. Invite self
    const inviteSelf = await fetchJson('/api/admin/users/provision', {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: `${TEST_PREFIX}invite_${stamp}`,
        systemRoleId: salesRole.id,
        credentialMode: 'self',
        delivery: 'invite',
      }),
    });
    const inviteSelfData = inviteSelf.json.data as { invite?: { url: string } } | undefined;
    let inviteUrl = inviteSelfData?.invite?.url;
    if (inviteSelf.res.ok && inviteUrl) pass('provision invite self');
    else fail('provision invite self', `status=${inviteSelf.res.status}`);

    // 5. Accept invite self
    if (inviteUrl) {
      const token = inviteUrl.split('/invite/')[1];
      const acceptUser = `${TEST_PREFIX}user_${stamp}`;
      const accept = await fetchJson(`/api/invite/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: acceptUser,
          password: 'TestPass123!',
          displayName: `${TEST_PREFIX}invite user`,
        }),
      });
      if (accept.res.ok) pass('accept invite self', acceptUser);
      else fail('accept invite self', `status=${accept.res.status}`);
    }

    // 6. Invite auto + accept
    const inviteAuto = await fetchJson('/api/admin/users/provision', {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: `${TEST_PREFIX}auto_${stamp}`,
        systemRoleId: salesRole.id,
        credentialMode: 'auto',
        delivery: 'invite',
      }),
    });
    const inviteAutoData = inviteAuto.json.data as {
      invite?: { url: string };
      credentials?: { username: string };
    } | undefined;
    inviteUrl = inviteAutoData?.invite?.url;
    if (inviteAuto.res.ok && inviteUrl) pass('provision invite auto');
    else fail('provision invite auto', `status=${inviteAuto.res.status}`);

    if (inviteUrl) {
      const token = inviteUrl.split('/invite/')[1];
      const acceptAuto = await fetchJson(`/api/invite/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (acceptAuto.res.ok) pass('accept invite auto');
      else fail('accept invite auto', `status=${acceptAuto.res.status}`);
    }

    // 7. Roles list
    const adminRolesRes = await fetchJson('/api/admin/roles', { cookie });
    if (adminRolesRes.res.ok) pass('GET /api/admin/roles');
    else fail('GET /api/admin/roles', `status=${adminRolesRes.res.status}`);

    // 8. Logout
    const logout = await fetchJson('/api/auth/logout', { method: 'POST', cookie });
    if (logout.res.ok) pass('logout');
    else fail('logout', `status=${logout.res.status}`);
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
  console.log('\n[auth-smoke] summary');
  console.log(`  passed: ${results.length - failed.length}/${results.length}`);
  if (failed.length) {
    console.log('  failed steps:');
    for (const f of failed) console.log(`    - ${f.name}: ${f.detail ?? ''}`);
  }
  console.log('');
}

main().catch((err) => {
  console.error('[auth-smoke] fatal', err);
  prisma.$disconnect().finally(() => process.exit(1));
});
