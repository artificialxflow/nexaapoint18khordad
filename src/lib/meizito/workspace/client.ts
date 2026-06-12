import { meizitoFetch } from '@/src/lib/meizito/client';
import type { WorkspaceSnapshot } from '@/src/lib/meizito/workspace/serialize';
import type {
  MeizitoBoard,
  MeizitoCard,
  MeizitoColumn,
  MeizitoDailyReport,
  MeizitoFieldVisit,
  MeizitoNote,
  MeizitoProject,
} from '@/src/types/meizito';

export async function fetchWorkspaceSnapshot(businessId: string): Promise<WorkspaceSnapshot> {
  return meizitoFetch<WorkspaceSnapshot>(businessId, '/workspace');
}

export async function apiCreateBoard(businessId: string, name: string) {
  return meizitoFetch<{ board: MeizitoBoard }>(businessId, '/boards', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function apiUpdateBoard(
  businessId: string,
  boardId: string,
  patch: { name?: string; memberNames?: string[] }
) {
  return meizitoFetch<{ board: MeizitoBoard }>(businessId, `/boards/${boardId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function apiAddColumn(businessId: string, boardId: string, title: string) {
  return meizitoFetch<{ column: MeizitoColumn }>(businessId, `/boards/${boardId}/columns`, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

export async function apiCreateCard(
  businessId: string,
  input: {
    boardId: string;
    columnId: string;
    title: string;
    description?: string;
    assignee?: string;
    dueDate?: string;
    dueTime?: string;
    recurrence?: string;
    category?: string;
    labelIds?: string[];
  }
) {
  return meizitoFetch<{ card: MeizitoCard }>(businessId, '/cards', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function apiUpdateCard(
  businessId: string,
  cardId: string,
  patch: Partial<MeizitoCard>
) {
  return meizitoFetch<{ card: MeizitoCard }>(businessId, `/cards/${cardId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function apiMoveCard(businessId: string, cardId: string, columnId: string) {
  return meizitoFetch<{ card: MeizitoCard }>(businessId, '/card-move', {
    method: 'POST',
    body: JSON.stringify({ cardId, columnId }),
  });
}

export async function apiCreateProject(
  businessId: string,
  input: { name: string; memberIds: string[]; boardId?: string; ncFolderPath?: string }
) {
  return meizitoFetch<{ project: MeizitoProject }>(businessId, '/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function apiUpdateProject(
  businessId: string,
  projectId: string,
  patch: Partial<MeizitoProject>
) {
  return meizitoFetch<{ project: MeizitoProject }>(businessId, `/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function apiCreateNoteBoard(businessId: string, name: string) {
  return meizitoFetch<{ noteBoard: { id: string; name: string; color?: string; order: number } }>(
    businessId,
    '/note-boards',
    { method: 'POST', body: JSON.stringify({ name }) }
  );
}

export async function apiCreateNote(
  businessId: string,
  input: {
    title: string;
    content: string;
    color: string;
    boardId?: string;
    ncAttachments?: unknown;
  }
) {
  return meizitoFetch<{ note: MeizitoNote }>(businessId, '/notes', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function apiUpdateNote(businessId: string, noteId: string, patch: Partial<MeizitoNote>) {
  return meizitoFetch<{ note: MeizitoNote }>(businessId, `/notes/${noteId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function apiCreateDailyReport(
  businessId: string,
  input: Omit<MeizitoDailyReport, 'id' | 'createdAt' | 'updatedAt'>
) {
  return meizitoFetch<{ report: MeizitoDailyReport }>(businessId, '/daily-reports', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function apiUpdateDailyReport(
  businessId: string,
  reportId: string,
  patch: Partial<Pick<MeizitoDailyReport, 'title' | 'body' | 'status'>>
) {
  return meizitoFetch<{ report: MeizitoDailyReport }>(businessId, `/daily-reports/${reportId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function apiDailyReportFeedback(
  businessId: string,
  reportId: string,
  feedback: string,
  kind: 'feedback' | 'approve' = 'feedback'
) {
  return meizitoFetch<{ report: MeizitoDailyReport }>(
    businessId,
    `/daily-reports/${reportId}/feedback`,
    { method: 'POST', body: JSON.stringify({ feedback, kind }) }
  );
}

export async function apiCreateFieldVisit(
  businessId: string,
  visit: Omit<MeizitoFieldVisit, 'id' | 'createdAt'>
) {
  return meizitoFetch<{ visit: MeizitoFieldVisit }>(businessId, '/field-visits', {
    method: 'POST',
    body: JSON.stringify(visit),
  });
}

export async function apiUpdateFieldVisit(
  businessId: string,
  visitId: string,
  patch: Partial<Omit<MeizitoFieldVisit, 'id' | 'createdAt'>>
) {
  return meizitoFetch<{ visit: MeizitoFieldVisit }>(businessId, `/field-visits/${visitId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function apiDeleteFieldVisit(businessId: string, visitId: string) {
  return meizitoFetch<{ ok: boolean }>(businessId, `/field-visits/${visitId}`, {
    method: 'DELETE',
  });
}
