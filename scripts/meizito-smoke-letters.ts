/**
 * Meizito letters smoke — phase 4.
 * Usage: npm run dev then npm run test:meizito:letters
 */

import { PrismaClient } from '@prisma/client';

const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';
const BOOTSTRAP_USER = process.env.SMOKE_BOOTSTRAP_USER ?? 'artificialxflow';
const BOOTSTRAP_PASS = process.env.SMOKE_BOOTSTRAP_PASS ?? 'Ronak#123Ronak';
const TEST_PREFIX = 'test_meizito_let_';

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

function apiErr(json: Record<string, unknown>, res: Response): string {
  const err = json.error as { code?: string; message?: string } | undefined;
  if (err?.code) return `${err.code}${err.message ? `: ${err.message}` : ''}`;
  return `status=${res.status}`;
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

function data<T>(json: Record<string, unknown>): T {
  return json.data as T;
}

async function cleanup() {
  await prisma.business.deleteMany({ where: { name: { startsWith: TEST_PREFIX } } });
}

async function main() {
  console.log(`\n[meizito-smoke-letters] base=${BASE}\n`);

  let cookie = '';
  let businessId = '';
  let userId = '';
  let userName = '';
  let letterId = '';
  let replyId = '';

  try {
    await cleanup();

    const login = await fetchJson('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: BOOTSTRAP_USER, password: BOOTSTRAP_PASS }),
    });
    cookie = parseCookie(login.res.headers.get('set-cookie'));
    const loginData = data<{ user?: { id: string; name?: string } }>(login.json);
    userId = loginData?.user?.id ?? '';
    userName = loginData?.user?.name ?? 'Test User';
    if (login.res.ok && cookie && userId) pass('login bootstrap', userId);
    else fail('login bootstrap', `status=${login.res.status}`);

    const createBiz = await fetchJson('/api/businesses', {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `${TEST_PREFIX}${Date.now()}` }),
    });
    const bizData = data<{ business?: { id: string } }>(createBiz.json);
    businessId = bizData?.business?.id ?? '';
    if (createBiz.res.ok && businessId) pass('POST /api/businesses', businessId);
    else fail('POST /api/businesses');

    const emptyList = await fetchJson(`/api/meizito/${businessId}/letters`, { cookie });
    const emptyData = data<{ letters?: unknown[] }>(emptyList.json);
    if (emptyList.res.ok && (emptyData?.letters?.length ?? 0) === 0) {
      pass('GET letters (empty)');
    } else {
      fail('GET letters (empty)', `count=${emptyData?.letters?.length ?? '?'}`);
    }

    const createLetter = await fetchJson(`/api/meizito/${businessId}/letters`, {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'نامه smoke',
        body: 'متن تست نامه',
        to: ['مدیر'],
        labels: ['اداری'],
        category: 'administrative',
        box: 'outbox',
        referredFrom: userName,
      }),
    });
    const letterData = data<{ letter?: { id: string; threadId?: string; approvalState?: string } }>(
      createLetter.json
    );
    letterId = letterData?.letter?.id ?? '';
    if (createLetter.res.ok && letterId && letterData?.letter?.approvalState === 'draft') {
      pass('POST letter (draft)', letterId);
    } else {
      fail('POST letter (draft)', apiErr(createLetter.json, createLetter.res));
    }

    const submitLetter = await fetchJson(`/api/meizito/${businessId}/letter-approval`, {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ letterId, action: 'submit' }),
    });
    const submitData = data<{ letter?: { approvalState?: string; currentAssigneeId?: string } }>(
      submitLetter.json
    );
    if (submitLetter.res.ok && submitData?.letter?.approvalState === 'pending') {
      pass('POST letter-approval (submit)', submitData.letter.currentAssigneeId ?? '');
    } else {
      fail('POST letter-approval (submit)', apiErr(submitLetter.json, submitLetter.res));
    }

    const pending = await fetchJson(`/api/meizito/${businessId}/pending-approvals`, { cookie });
    const pendingData = data<{ letters?: { id: string }[] }>(pending.json);
    const pendingLetterIds = pendingData?.letters?.map((l) => l.id) ?? [];
    if (pending.res.ok && pendingLetterIds.includes(letterId)) {
      pass('GET pending-approvals (letters)', `${pendingLetterIds.length} pending`);
    } else {
      fail('GET pending-approvals (letters)', `ids=${pendingLetterIds.join(',')}`);
    }

    const approve = await fetchJson(`/api/meizito/${businessId}/letter-approval`, {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ letterId, action: 'approve', comment: 'تایید smoke' }),
    });
    const approveData = data<{ letter?: { approvalState?: string } }>(approve.json);
    if (approve.res.ok && approveData?.letter?.approvalState === 'approved') {
      pass('POST letter-approval (approve)');
    } else {
      fail('POST letter-approval (approve)', apiErr(approve.json, approve.res));
    }

    const reply = await fetchJson(`/api/meizito/${businessId}/letter-reply`, {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceLetterId: letterId,
        subject: 'Re: نامه smoke',
        body: 'پاسخ تست',
        to: [userName],
        referredFrom: userName,
        box: 'outbox',
      }),
    });
    const replyData = data<{ letter?: { id: string; threadId?: string; replyToLetterId?: string } }>(
      reply.json
    );
    replyId = replyData?.letter?.id ?? '';
    if (
      reply.res.ok &&
      replyId &&
      replyData?.letter?.replyToLetterId === letterId &&
      replyData?.letter?.threadId
    ) {
      pass('POST letter-reply', replyId);
    } else {
      fail('POST letter-reply', apiErr(reply.json, reply.res));
    }

    const moveBox = await fetchJson(`/api/meizito/${businessId}/letter-update`, {
      method: 'PATCH',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ letterId, box: 'inbox' }),
    });
    const moveData = data<{ letter?: { box?: string } }>(moveBox.json);
    if (moveBox.res.ok && moveData?.letter?.box === 'inbox') {
      pass('PATCH letter-update (box)');
    } else {
      fail('PATCH letter-update (box)', apiErr(moveBox.json, moveBox.res));
    }

    const closeLetter = await fetchJson(`/api/meizito/${businessId}/letter-update`, {
      method: 'PATCH',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ letterId, status: 'closed', box: 'archive' }),
    });
    const closeData = data<{ letter?: { status?: string; box?: string } }>(closeLetter.json);
    if (closeLetter.res.ok && closeData?.letter?.status === 'closed' && closeData?.letter?.box === 'archive') {
      pass('PATCH letter-update (close)');
    } else {
      fail('PATCH letter-update (close)', apiErr(closeLetter.json, closeLetter.res));
    }

    const reopenLetter = await fetchJson(`/api/meizito/${businessId}/letter-update`, {
      method: 'PATCH',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ letterId, status: 'open', box: 'inbox' }),
    });
    const reopenData = data<{ letter?: { status?: string; box?: string } }>(reopenLetter.json);
    if (reopenLetter.res.ok && reopenData?.letter?.status === 'open' && reopenData?.letter?.box === 'inbox') {
      pass('PATCH letter-update (reopen)');
    } else {
      fail('PATCH letter-update (reopen)', apiErr(reopenLetter.json, reopenLetter.res));
    }

    const outbox = await fetchJson(`/api/meizito/${businessId}/letters?box=outbox`, { cookie });
    const outboxData = data<{ letters?: { id: string; box?: string }[] }>(outbox.json);
    const outboxIds = outboxData?.letters?.map((l) => l.id) ?? [];
    if (outbox.res.ok && outboxIds.includes(replyId)) {
      pass('GET letters?box=outbox', `${outboxIds.length} item(s)`);
    } else {
      fail('GET letters?box=outbox', `ids=${outboxIds.join(',')}`);
    }

    const list = await fetchJson(`/api/meizito/${businessId}/letters`, { cookie });
    const listData = data<{ letters?: { id: string }[] }>(list.json);
    const ids = listData?.letters?.map((l) => l.id) ?? [];
    if (list.res.ok && ids.includes(letterId) && ids.includes(replyId)) {
      pass('GET letters (list)', `${ids.length} item(s)`);
    } else {
      fail('GET letters (list)', `count=${ids.length}`);
    }
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n[meizito-smoke-letters] ${results.length - failed.length}/${results.length} passed\n`);
  if (failed.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
