/**
 * Meizito chat smoke — phase 6.
 * Usage: npm run dev then npm run test:meizito:chat
 */

import { PrismaClient } from '@prisma/client';

const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';
const BOOTSTRAP_USER = process.env.SMOKE_BOOTSTRAP_USER ?? 'artificialxflow';
const BOOTSTRAP_PASS = process.env.SMOKE_BOOTSTRAP_PASS ?? 'Ronak#123Ronak';
const TEST_PREFIX = 'test_meizito_chat_';

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
  console.log(`\n[meizito-smoke-chat] base=${BASE}\n`);

  let cookie = '';
  let businessId = '';
  let userId = '';
  let userName = '';
  let threadId = '';
  let messageId = '';

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

    const empty = await fetchJson(`/api/meizito/${businessId}/chat`, { cookie });
    const emptyData = data<{ threads?: unknown[]; messages?: unknown[] }>(empty.json);
    if (empty.res.ok && (emptyData?.threads?.length ?? 0) === 0) pass('GET chat (empty)');
    else fail('GET chat (empty)', `threads=${emptyData?.threads?.length ?? '?'}`);

    const createThread = await fetchJson(`/api/meizito/${businessId}/chat-threads`, {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'گفتگوی smoke',
        threadType: 'group',
        participantNames: ['کاربر تست'],
      }),
    });
    const threadData = data<{ thread?: { id: string; title?: string } }>(createThread.json);
    threadId = threadData?.thread?.id ?? '';
    if (createThread.res.ok && threadId) pass('POST chat-threads', threadId);
    else fail('POST chat-threads', apiErr(createThread.json, createThread.res));

    const createMsg = await fetchJson(`/api/meizito/${businessId}/chat-messages`, {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        threadId,
        authorName: userName,
        body: 'سلام smoke',
        type: 'text',
      }),
    });
    const msgData = data<{ message?: { id: string; body?: string } }>(createMsg.json);
    messageId = msgData?.message?.id ?? '';
    if (createMsg.res.ok && messageId && msgData?.message?.body === 'سلام smoke') {
      pass('POST chat-messages', messageId);
    } else {
      fail('POST chat-messages', apiErr(createMsg.json, createMsg.res));
    }

    const pinThread = await fetchJson(`/api/meizito/${businessId}/chat-thread-update`, {
      method: 'PATCH',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId, pinned: true, starred: true }),
    });
    const pinData = data<{ thread?: { pinned?: boolean; starred?: boolean } }>(pinThread.json);
    if (pinThread.res.ok && pinData?.thread?.pinned && pinData?.thread?.starred) {
      pass('PATCH chat-thread-update');
    } else {
      fail('PATCH chat-thread-update', apiErr(pinThread.json, pinThread.res));
    }

    const editMsg = await fetchJson(`/api/meizito/${businessId}/chat-message-update`, {
      method: 'PATCH',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, body: 'سلام smoke (ویرایش)' }),
    });
    const editData = data<{ message?: { body?: string; editedAt?: string } }>(editMsg.json);
    if (editMsg.res.ok && editData?.message?.body?.includes('ویرایش') && editData?.message?.editedAt) {
      pass('PATCH chat-message-update');
    } else {
      fail('PATCH chat-message-update', apiErr(editMsg.json, editMsg.res));
    }

    const list = await fetchJson(`/api/meizito/${businessId}/chat`, { cookie });
    const listData = data<{
      threads?: { id: string; messageIds?: string[] }[];
      messages?: { id: string }[];
    }>(list.json);
    const threadIds = listData?.threads?.map((t) => t.id) ?? [];
    const msgIds = listData?.messages?.map((m) => m.id) ?? [];
    if (
      list.res.ok &&
      threadIds.includes(threadId) &&
      msgIds.includes(messageId) &&
      (listData?.threads?.find((t) => t.id === threadId)?.messageIds?.length ?? 0) >= 1
    ) {
      pass('GET chat (list)', `${listData?.threads?.length ?? 0} threads`);
    } else {
      fail('GET chat (list)', `threads=${threadIds.length} messages=${msgIds.length}`);
    }
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n[meizito-smoke-chat] ${results.length - failed.length}/${results.length} passed\n`);
  if (failed.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
