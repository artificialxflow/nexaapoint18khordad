/**
 * Meizito calendar smoke — phase 5.
 * Usage: npm run dev then npm run test:meizito:calendar
 */

import { PrismaClient } from '@prisma/client';

const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';
const BOOTSTRAP_USER = process.env.SMOKE_BOOTSTRAP_USER ?? 'artificialxflow';
const BOOTSTRAP_PASS = process.env.SMOKE_BOOTSTRAP_PASS ?? 'Ronak#123Ronak';
const TEST_PREFIX = 'test_meizito_cal_';

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

function todayKey() {
  return new Date().toISOString().slice(0, 10);
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
  console.log(`\n[meizito-smoke-calendar] base=${BASE}\n`);

  let cookie = '';
  let businessId = '';
  let userId = '';
  let eventId = '';
  let boardId = '';
  let columnId = '';
  let cardId = '';

  try {
    await cleanup();

    const login = await fetchJson('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: BOOTSTRAP_USER, password: BOOTSTRAP_PASS }),
    });
    cookie = parseCookie(login.res.headers.get('set-cookie'));
    const loginData = data<{ user?: { id: string } }>(login.json);
    userId = loginData?.user?.id ?? '';
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

    const snapshot = await fetchJson(`/api/meizito/${businessId}/calendar`, { cookie });
    const snapData = data<{ calendars?: { id: string }[]; events?: unknown[] }>(snapshot.json);
    const calIds = snapData?.calendars?.map((c) => c.id) ?? [];
    if (
      snapshot.res.ok &&
      calIds.includes('cal-tasks') &&
      calIds.includes('cal-customer') &&
      (snapData?.events?.length ?? 0) === 0
    ) {
      pass('GET calendar (defaults)', `${calIds.length} calendars`);
    } else {
      fail('GET calendar (defaults)', `ids=${calIds.join(',')}`);
    }

    const createCal = await fetchJson(`/api/meizito/${businessId}/calendars`, {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'تقویم smoke', kind: 'custom', color: '#8b5cf6' }),
    });
    const calData = data<{ calendar?: { id: string; name?: string } }>(createCal.json);
    if (createCal.res.ok && calData?.calendar?.id) pass('POST calendars', calData.calendar.id);
    else fail('POST calendars', apiErr(createCal.json, createCal.res));

    const createEvent = await fetchJson(`/api/meizito/${businessId}/calendar-events`, {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        calendarId: 'cal-customer',
        title: 'رویداد smoke',
        date: todayKey(),
        time: '10:00',
        notes: 'تست',
      }),
    });
    const evtData = data<{ event?: { id: string; calendarId?: string } }>(createEvent.json);
    eventId = evtData?.event?.id ?? '';
    if (createEvent.res.ok && eventId && evtData?.event?.calendarId === 'cal-customer') {
      pass('POST calendar-events', eventId);
    } else {
      fail('POST calendar-events', apiErr(createEvent.json, createEvent.res));
    }

    const patchCal = await fetchJson(`/api/meizito/${businessId}/calendar-update`, {
      method: 'PATCH',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ calendarId: 'cal-customer', sharedWith: [userId] }),
    });
    const patchCalData = data<{ calendar?: { sharedWith?: string[] } }>(patchCal.json);
    if (patchCal.res.ok && patchCalData?.calendar?.sharedWith?.includes(userId)) {
      pass('PATCH calendar-update');
    } else {
      fail('PATCH calendar-update', apiErr(patchCal.json, patchCal.res));
    }

    const createBoard = await fetchJson(`/api/meizito/${businessId}/boards`, {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'میز smoke cal' }),
    });
    const boardData = data<{ board?: { id: string; columnIds?: string[] } }>(createBoard.json);
    boardId = boardData?.board?.id ?? '';
    columnId = boardData?.board?.columnIds?.[0] ?? '';
    if (createBoard.res.ok && boardId && columnId) pass('POST board (for sync)', boardId);
    else fail('POST board (for sync)');

    const createCard = await fetchJson(`/api/meizito/${businessId}/cards`, {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        boardId,
        columnId,
        title: 'کارت با سررسید',
        dueDate: todayKey(),
        dueTime: '15:30',
      }),
    });
    const cardData = data<{ card?: { id: string } }>(createCard.json);
    cardId = cardData?.card?.id ?? '';
    if (createCard.res.ok && cardId) pass('POST card (due date)', cardId);
    else fail('POST card (due date)', apiErr(createCard.json, createCard.res));

    const sync = await fetchJson(`/api/meizito/${businessId}/calendar-events-sync-from-cards`, {
      method: 'POST',
      cookie,
    });
    const syncData = data<{ events?: { sourceCardId?: string }[] }>(sync.json);
    const synced = syncData?.events?.some((e) => e.sourceCardId === cardId) ?? false;
    if (sync.res.ok && synced) pass('POST calendar-events-sync-from-cards', `${syncData?.events?.length ?? 0} events`);
    else fail('POST calendar-events-sync-from-cards', apiErr(sync.json, sync.res));

    const rsvp = await fetchJson(`/api/meizito/${businessId}/calendar-event-rsvp`, {
      method: 'PATCH',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, userId, status: 'accepted' }),
    });
    const rsvpData = data<{ event?: { rsvp?: Record<string, string> } }>(rsvp.json);
    if (rsvp.res.ok && rsvpData?.event?.rsvp?.[userId] === 'accepted') {
      pass('PATCH calendar-event-rsvp');
    } else {
      fail('PATCH calendar-event-rsvp', apiErr(rsvp.json, rsvp.res));
    }

    const patchEvt = await fetchJson(`/api/meizito/${businessId}/calendar-event-update`, {
      method: 'PATCH',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, title: 'رویداد smoke (ویرایش)' }),
    });
    const patchEvtData = data<{ event?: { title?: string } }>(patchEvt.json);
    if (patchEvt.res.ok && patchEvtData?.event?.title?.includes('ویرایش')) {
      pass('PATCH calendar-event-update');
    } else {
      fail('PATCH calendar-event-update', apiErr(patchEvt.json, patchEvt.res));
    }

    const list = await fetchJson(`/api/meizito/${businessId}/calendar`, { cookie });
    const listData = data<{ events?: { id: string }[] }>(list.json);
    const ids = listData?.events?.map((e) => e.id) ?? [];
    if (list.res.ok && ids.includes(eventId)) {
      pass('GET calendar (with events)', `${ids.length} event(s)`);
    } else {
      fail('GET calendar (with events)', `count=${ids.length}`);
    }

    const delEvt = await fetchJson(`/api/meizito/${businessId}/calendar-event-update`, {
      method: 'PATCH',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, delete: true }),
    });
    if (delEvt.res.ok) pass('PATCH calendar-event-update (delete)');
    else fail('PATCH calendar-event-update (delete)', apiErr(delEvt.json, delEvt.res));
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n[meizito-smoke-calendar] ${results.length - failed.length}/${results.length} passed\n`);
  if (failed.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
