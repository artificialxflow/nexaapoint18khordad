/**
 * Meizito workspace smoke — phase 2.
 * Usage: npm run dev then npm run test:meizito:workspace
 */

import { PrismaClient } from '@prisma/client';

const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';
const BOOTSTRAP_USER = process.env.SMOKE_BOOTSTRAP_USER ?? 'artificialxflow';
const BOOTSTRAP_PASS = process.env.SMOKE_BOOTSTRAP_PASS ?? 'Ronak#123Ronak';
const TEST_PREFIX = 'test_meizito_ws_';

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
  console.log(`\n[meizito-smoke-workspace] base=${BASE}\n`);

  let cookie = '';
  let businessId = '';
  let userId = '';
  let boardId = '';
  let columnId = '';
  let cardId = '';
  let projectId = '';
  let noteId = '';
  let reportId = '';
  let visitId = '';

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
    const userName = loginData?.user?.name ?? 'Test User';
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

    const emptyWs = await fetchJson(`/api/meizito/${businessId}/workspace`, { cookie });
    const emptyData = data<{ boards?: unknown[]; cards?: unknown[] }>(emptyWs.json);
    if (emptyWs.res.ok && (emptyData?.boards?.length ?? 0) === 0) {
      pass('GET workspace (empty)');
    } else {
      fail('GET workspace (empty)', `boards=${emptyData?.boards?.length ?? '?'}`);
    }

    const createBoard = await fetchJson(`/api/meizito/${businessId}/boards`, {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'میز تست smoke' }),
    });
    const boardData = data<{ board?: { id: string; columnIds?: string[] } }>(createBoard.json);
    boardId = boardData?.board?.id ?? '';
    columnId = boardData?.board?.columnIds?.[0] ?? '';
    if (createBoard.res.ok && boardId && columnId) pass('POST board', boardId);
    else fail('POST board', `status=${createBoard.res.status}`);

    const createCard = await fetchJson(`/api/meizito/${businessId}/cards`, {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        boardId,
        columnId,
        title: 'کار smoke',
        assignee: userName,
      }),
    });
    const cardData = data<{ card?: { id: string; columnId: string } }>(createCard.json);
    cardId = cardData?.card?.id ?? '';
    if (createCard.res.ok && cardId) pass('POST card', cardId);
    else fail('POST card', `status=${createCard.res.status}`);

    const moveTargetCol = boardData?.board?.columnIds?.[1] ?? columnId;
    const moveCard = await fetchJson(`/api/meizito/${businessId}/card-move`, {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId, columnId: moveTargetCol }),
    });
    const moved = data<{ card?: { columnId: string } }>(moveCard.json);
    if (moveCard.res.ok && moved?.card?.columnId === moveTargetCol) pass('POST card move');
    else fail('POST card move', apiErr(moveCard.json, moveCard.res));

    const patchBoard = await fetchJson(`/api/meizito/${businessId}/boards/${boardId}`, {
      method: 'PATCH',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'میز تست smoke (ویرایش)' }),
    });
    const patchedBoard = data<{ board?: { name?: string } }>(patchBoard.json);
    if (patchBoard.res.ok && patchedBoard?.board?.name?.includes('ویرایش')) pass('PATCH board');
    else fail('PATCH board');

    const createProject = await fetchJson(`/api/meizito/${businessId}/projects`, {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'پروژه smoke', memberIds: [userId], boardId }),
    });
    const projectData = data<{ project?: { id: string; ncFolderPath?: string } }>(createProject.json);
    projectId = projectData?.project?.id ?? '';
    if (createProject.res.ok && projectId && projectData?.project?.ncFolderPath) {
      pass('POST project', projectData.project.ncFolderPath);
    } else {
      fail('POST project');
    }

    const createNoteBoard = await fetchJson(`/api/meizito/${businessId}/note-boards`, {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'یادداشت smoke' }),
    });
    const nbData = data<{ noteBoard?: { id: string } }>(createNoteBoard.json);
    const noteBoardId = nbData?.noteBoard?.id ?? '';
    if (createNoteBoard.res.ok && noteBoardId) pass('POST note-board');
    else fail('POST note-board');

    const createNote = await fetchJson(`/api/meizito/${businessId}/notes`, {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'یادداشت تست',
        content: 'محتوای smoke',
        color: '#fef08a',
        boardId: noteBoardId,
      }),
    });
    const noteData = data<{ note?: { id: string } }>(createNote.json);
    noteId = noteData?.note?.id ?? '';
    if (createNote.res.ok && noteId) pass('POST note');
    else fail('POST note');

    const starNote = await fetchJson(`/api/meizito/${businessId}/notes/${noteId}`, {
      method: 'PATCH',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ starred: true }),
    });
    if (starNote.res.ok) pass('PATCH note star');
    else fail('PATCH note star', apiErr(starNote.json, starNote.res));

    const dateKey = todayKey();
    const createReport = await fetchJson(`/api/meizito/${businessId}/daily-reports`, {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorId: userId,
        authorName: userName,
        date: dateKey,
        title: 'گزارش smoke',
        body: 'متن گزارش',
        status: 'draft',
      }),
    });
    const reportData = data<{ report?: { id: string } }>(createReport.json);
    reportId = reportData?.report?.id ?? '';
    if (createReport.res.ok && reportId) pass('POST daily-report');
    else fail('POST daily-report');

    const submitReport = await fetchJson(`/api/meizito/${businessId}/daily-reports/${reportId}`, {
      method: 'PATCH',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'submitted' }),
    });
    if (submitReport.res.ok) pass('PATCH daily-report submit');
    else fail('PATCH daily-report submit', apiErr(submitReport.json, submitReport.res));

    const createVisit = await fetchJson(`/api/meizito/${businessId}/field-visits`, {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: dateKey,
        customerName: 'مشتری smoke',
        authorId: userId,
        authorName: userName,
        visitedBy: userName,
        durationMinutes: 30,
        visitorCount: 1,
        result: 'positive',
      }),
    });
    const visitData = data<{ visit?: { id: string } }>(createVisit.json);
    visitId = visitData?.visit?.id ?? '';
    if (createVisit.res.ok && visitId) pass('POST field-visit');
    else fail('POST field-visit');

    const snapshot = await fetchJson(`/api/meizito/${businessId}/workspace`, { cookie });
    const snap = data<{
      boards?: unknown[];
      cards?: unknown[];
      projects?: unknown[];
      notes?: unknown[];
      dailyReports?: unknown[];
      fieldVisits?: unknown[];
    }>(snapshot.json);
    if (
      snapshot.res.ok &&
      (snap?.boards?.length ?? 0) >= 1 &&
      (snap?.cards?.length ?? 0) >= 1 &&
      (snap?.projects?.length ?? 0) >= 1 &&
      (snap?.notes?.length ?? 0) >= 1 &&
      (snap?.dailyReports?.length ?? 0) >= 1 &&
      (snap?.fieldVisits?.length ?? 0) >= 1
    ) {
      pass('GET workspace snapshot (populated)');
    } else {
      fail('GET workspace snapshot (populated)');
    }

    const search = await fetchJson(
      `/api/meizito/${businessId}/card-search?boardId=${encodeURIComponent(boardId)}&q=${encodeURIComponent('smoke')}`,
      { cookie }
    );
    const searchData = data<{ cards?: unknown[] }>(search.json);
    if (search.res.ok && (searchData?.cards?.length ?? 0) >= 1) pass('GET cards search');
    else fail('GET cards search', apiErr(search.json, search.res));

    const deleteVisit = await fetchJson(`/api/meizito/${businessId}/field-visits/${visitId}`, {
      method: 'DELETE',
      cookie,
    });
    if (deleteVisit.res.ok) pass('DELETE field-visit');
    else fail('DELETE field-visit', apiErr(deleteVisit.json, deleteVisit.res));

    const boardRow = await prisma.workspaceBoard.findFirst({ where: { id: boardId, businessId } });
    if (boardRow?.name.includes('ویرایش')) pass('DB WorkspaceBoard persisted');
    else fail('DB WorkspaceBoard persisted');
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(
    `\n[meizito-smoke-workspace] ${results.length - failed.length}/${results.length} passed\n`
  );
  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
