/**
 * Meizito internal requests smoke — phase 3.
 * Usage: npm run dev then npm run test:meizito:requests
 */

import { PrismaClient } from '@prisma/client';

const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';
const BOOTSTRAP_USER = process.env.SMOKE_BOOTSTRAP_USER ?? 'artificialxflow';
const BOOTSTRAP_PASS = process.env.SMOKE_BOOTSTRAP_PASS ?? 'Ronak#123Ronak';
const TEST_PREFIX = 'test_meizito_req_';

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
  console.log(`\n[meizito-smoke-requests] base=${BASE}\n`);

  let cookie = '';
  let businessId = '';
  let userId = '';
  let userName = '';
  let requestId = '';
  let draftId = '';

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

    const emptyList = await fetchJson(`/api/meizito/${businessId}/requests`, { cookie });
    const emptyData = data<{ requests?: unknown[] }>(emptyList.json);
    if (emptyList.res.ok && (emptyData?.requests?.length ?? 0) === 0) {
      pass('GET requests (empty)');
    } else {
      fail('GET requests (empty)', `count=${emptyData?.requests?.length ?? '?'}`);
    }

    const createDraft = await fetchJson(`/api/meizito/${businessId}/requests`, {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'پیش‌نویس smoke',
        body: 'بدون ارسال',
        authorId: userId,
        authorName: userName,
        options: { submitForApproval: false },
      }),
    });
    const draftData = data<{ request?: { id: string; approvalState?: string } }>(createDraft.json);
    draftId = draftData?.request?.id ?? '';
    if (
      createDraft.res.ok &&
      draftId &&
      (draftData?.request?.approvalState === 'draft' || !draftData?.request?.approvalState)
    ) {
      pass('POST request (draft)', draftId);
    } else {
      fail('POST request (draft)', apiErr(createDraft.json, createDraft.res));
    }

    const submitDraft = await fetchJson(`/api/meizito/${businessId}/request-approval`, {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: draftId, action: 'submit' }),
    });
    const submitData = data<{ request?: { approvalState?: string; currentAssigneeId?: string } }>(
      submitDraft.json
    );
    if (submitDraft.res.ok && submitData?.request?.approvalState === 'pending') {
      pass('POST request-approval (submit draft)', submitData.request.currentAssigneeId ?? '');
    } else {
      fail('POST request-approval (submit draft)', apiErr(submitDraft.json, submitDraft.res));
    }

    const approveDraft = await fetchJson(`/api/meizito/${businessId}/request-approval`, {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: draftId, action: 'approve', comment: 'تایید smoke' }),
    });
    const approveData = data<{ request?: { approvalState?: string } }>(approveDraft.json);
    if (approveDraft.res.ok && approveData?.request?.approvalState === 'approved') {
      pass('POST request-approval (approve draft)');
    } else {
      fail('POST request-approval (approve draft)', apiErr(approveDraft.json, approveDraft.res));
    }

    const createReq = await fetchJson(`/api/meizito/${businessId}/requests`, {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'درخواست smoke',
        body: 'متن تست',
        authorId: userId,
        authorName: userName,
        referredToUserIds: [userId],
        priority: 'high',
        options: { submitForApproval: true },
      }),
    });
    const reqData = data<{ request?: { id: string; approvalState?: string; status?: string } }>(
      createReq.json
    );
    requestId = reqData?.request?.id ?? '';
    if (
      createReq.res.ok &&
      requestId &&
      reqData?.request?.approvalState === 'pending' &&
      reqData?.request?.status === 'open'
    ) {
      pass('POST request (submit on create)', requestId);
    } else {
      fail('POST request (submit on create)', apiErr(createReq.json, createReq.res));
    }

    const pending = await fetchJson(`/api/meizito/${businessId}/pending-approvals`, { cookie });
    const pendingData = data<{ requests?: { id: string }[] }>(pending.json);
    const pendingIds = pendingData?.requests?.map((r) => r.id) ?? [];
    if (pending.res.ok && pendingIds.includes(requestId)) {
      pass('GET pending-approvals', `${pendingIds.length} pending`);
    } else {
      fail('GET pending-approvals', `ids=${pendingIds.join(',')}`);
    }

    const approve = await fetchJson(`/api/meizito/${businessId}/request-approval`, {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, action: 'approve', comment: 'تایید' }),
    });
    const approveReqData = data<{ request?: { approvalState?: string } }>(approve.json);
    if (approve.res.ok && approveReqData?.request?.approvalState === 'approved') {
      pass('POST request-approval (approve)');
    } else {
      fail('POST request-approval (approve)', apiErr(approve.json, approve.res));
    }

    const closeReq = await fetchJson(`/api/meizito/${businessId}/request-update`, {
      method: 'PATCH',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, status: 'closed' }),
    });
    const closeData = data<{ request?: { status?: string; closedAt?: string } }>(closeReq.json);
    if (closeReq.res.ok && closeData?.request?.status === 'closed' && closeData?.request?.closedAt) {
      pass('PATCH request-update (close)');
    } else {
      fail('PATCH request-update (close)', apiErr(closeReq.json, closeReq.res));
    }

    const reopenReq = await fetchJson(`/api/meizito/${businessId}/request-update`, {
      method: 'PATCH',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, status: 'open' }),
    });
    const reopenData = data<{ request?: { status?: string } }>(reopenReq.json);
    if (reopenReq.res.ok && reopenData?.request?.status === 'open') {
      pass('PATCH request-update (reopen)');
    } else {
      fail('PATCH request-update (reopen)', apiErr(reopenReq.json, reopenReq.res));
    }

    const list = await fetchJson(`/api/meizito/${businessId}/requests`, { cookie });
    const listData = data<{ requests?: { id: string }[] }>(list.json);
    const ids = listData?.requests?.map((r) => r.id) ?? [];
    if (list.res.ok && ids.includes(requestId) && ids.includes(draftId)) {
      pass('GET requests (list)', `${ids.length} item(s)`);
    } else {
      fail('GET requests (list)', `count=${ids.length}`);
    }
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n[meizito-smoke-requests] ${results.length - failed.length}/${results.length} passed\n`);
  if (failed.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
