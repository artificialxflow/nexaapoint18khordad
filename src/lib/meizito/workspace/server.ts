import type { Prisma } from '@prisma/client';
import { prisma } from '@/src/lib/db/prisma';
import { logMeizitoAction } from '@/src/lib/meizito/audit';
import { meizitoModuleLog } from '@/src/lib/meizito/logger';
import {
  canReviewDailyReport,
  getReviewerRoleLabel,
  newFeedbackId,
  normalizeDailyReport,
} from '@/src/lib/meizito/teamHierarchy';
import { loadBusinessTeamMembers } from '@/src/lib/meizito/team-server';
import { ncPathForWorkspaceProject } from '@/src/lib/nextcloud/paths';
import type {
  MeizitoCard,
  MeizitoDailyReport,
  MeizitoFieldVisit,
  MeizitoNote,
  MeizitoProject,
  MeizitoReportFeedback,
} from '@/src/types/meizito';
import {
  serializeDailyReportRow,
  serializeFieldVisitRow,
  serializeNoteBoard,
  serializeWorkspaceBoard,
  serializeWorkspaceCard,
  serializeWorkspaceColumn,
  serializeWorkspaceNote,
  serializeWorkspaceProject,
  type WorkspaceSnapshot,
} from '@/src/lib/meizito/workspace/serialize';

const log = meizitoModuleLog('workspace');

function cardIdsFromJson(value: unknown): string[] {
  return Array.isArray(value) ? [...(value as string[])] : [];
}

async function getBoardOrThrow(businessId: string, boardId: string) {
  const board = await prisma.workspaceBoard.findFirst({ where: { id: boardId, businessId } });
  if (!board) throw new Error('NOT_FOUND');
  return board;
}

async function getCardOrThrow(businessId: string, cardId: string) {
  const card = await prisma.workspaceCard.findFirst({ where: { id: cardId, businessId } });
  if (!card) throw new Error('NOT_FOUND');
  return card;
}

export async function loadWorkspaceSnapshot(businessId: string): Promise<WorkspaceSnapshot> {
  const [boards, columns, cards, projects, noteBoards, notes, dailyReports, fieldVisits] =
    await Promise.all([
      prisma.workspaceBoard.findMany({ where: { businessId }, orderBy: { sortOrder: 'asc' } }),
      prisma.workspaceColumn.findMany({
        where: { board: { businessId } },
        orderBy: { order: 'asc' },
      }),
      prisma.workspaceCard.findMany({
        where: { businessId },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      }),
      prisma.workspaceProject.findMany({ where: { businessId }, orderBy: { createdAt: 'desc' } }),
      prisma.noteBoard.findMany({ where: { businessId }, orderBy: { order: 'asc' } }),
      prisma.workspaceNote.findMany({
        where: { businessId, deletedAt: null },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.dailyReport.findMany({
        where: { businessId },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.fieldVisit.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

  const boardRows = boards.map((b) =>
    serializeWorkspaceBoard(
      b,
      columns.filter((c) => c.boardId === b.id)
    )
  );

  return {
    boards: boardRows,
    columns: columns.map(serializeWorkspaceColumn),
    cards: cards.map(serializeWorkspaceCard),
    projects: projects.map(serializeWorkspaceProject),
    noteBoards: noteBoards.map(serializeNoteBoard),
    notes: notes.map(serializeWorkspaceNote),
    dailyReports: dailyReports.map(serializeDailyReportRow),
    fieldVisits: fieldVisits.map(serializeFieldVisitRow),
    activeBoardId: boardRows[0]?.id ?? null,
    activeNoteBoardId: noteBoards[0]?.id ?? null,
  };
}

export async function createWorkspaceBoard(
  businessId: string,
  name: string,
  actorId: string
) {
  const trimmed = name.trim() || 'میز جدید';
  const result = await prisma.$transaction(async (tx) => {
    const board = await tx.workspaceBoard.create({
      data: {
        businessId,
        name: trimmed,
        createdById: actorId,
        labelPalette: [{ id: crypto.randomUUID(), name: 'برچسب', color: '#94a3b8' }],
      },
    });
    const titles = ['برای انجام', 'در حال انجام', 'انجام شده'];
    const cols = await Promise.all(
      titles.map((title, order) =>
        tx.workspaceColumn.create({
          data: { boardId: board.id, title, order, cardIds: [] },
        })
      )
    );
    return { board, cols };
  });

  log.info('board.create', { businessId, boardId: result.board.id, actorId });
  await logMeizitoAction({
    actorId,
    action: 'board.create',
    businessId,
    targetType: 'workspace_board',
    targetId: result.board.id,
  });

  return serializeWorkspaceBoard(result.board, result.cols);
}

export async function updateWorkspaceBoard(
  businessId: string,
  boardId: string,
  patch: { name?: string; memberNames?: string[] },
  actorId: string
) {
  await getBoardOrThrow(businessId, boardId);
  const board = await prisma.workspaceBoard.update({
    where: { id: boardId },
    data: {
      ...(patch.name !== undefined ? { name: patch.name.trim() || 'میز کار' } : {}),
      ...(patch.memberNames !== undefined ? { memberNames: patch.memberNames } : {}),
    },
  });
  const columns = await prisma.workspaceColumn.findMany({ where: { boardId }, orderBy: { order: 'asc' } });
  log.info('board.update', { businessId, boardId, actorId });
  return serializeWorkspaceBoard(board, columns);
}

export async function addWorkspaceColumn(
  businessId: string,
  boardId: string,
  title: string,
  actorId: string
) {
  await getBoardOrThrow(businessId, boardId);
  const max = await prisma.workspaceColumn.aggregate({
    where: { boardId },
    _max: { order: true },
  });
  const column = await prisma.workspaceColumn.create({
    data: {
      boardId,
      title: title.trim() || 'ستون جدید',
      order: (max._max.order ?? -1) + 1,
      cardIds: [],
    },
  });
  log.info('column.create', { businessId, boardId, columnId: column.id, actorId });
  return serializeWorkspaceColumn(column);
}

type CreateCardInput = {
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
  assignee?: string;
  assigneeUserId?: string;
  dueDate?: string;
  dueTime?: string;
  recurrence?: string;
  category?: string;
  labelIds?: string[];
};

export async function createWorkspaceCard(
  businessId: string,
  input: CreateCardInput,
  actorId: string
) {
  await getBoardOrThrow(businessId, input.boardId);
  const column = await prisma.workspaceColumn.findFirst({
    where: { id: input.columnId, boardId: input.boardId },
  });
  if (!column) throw new Error('NOT_FOUND');

  const card = await prisma.workspaceCard.create({
    data: {
      businessId,
      boardId: input.boardId,
      columnId: input.columnId,
      title: input.title.trim() || 'کار جدید',
      description: input.description ?? '',
      assignee: input.assignee ?? '',
      assigneeUserId: input.assigneeUserId,
      dueDate: input.dueDate ?? '',
      dueTime: input.dueTime ?? '',
      recurrence: (input.recurrence as 'none' | 'daily' | 'weekly') ?? 'none',
      category: input.category ?? '',
      labelIds: input.labelIds ?? [],
    },
  });

  const cardIds = cardIdsFromJson(column.cardIds);
  cardIds.push(card.id);
  await prisma.workspaceColumn.update({
    where: { id: column.id },
    data: { cardIds },
  });

  log.info('card.create', { businessId, cardId: card.id, actorId });
  await logMeizitoAction({
    actorId,
    action: 'card.create',
    businessId,
    targetType: 'workspace_card',
    targetId: card.id,
  });

  return serializeWorkspaceCard(card);
}

export async function updateWorkspaceCard(
  businessId: string,
  cardId: string,
  patch: Partial<MeizitoCard>,
  actorId: string
) {
  await getCardOrThrow(businessId, cardId);
  const card = await prisma.workspaceCard.update({
    where: { id: cardId },
    data: {
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
      ...(patch.assignee !== undefined ? { assignee: patch.assignee } : {}),
      ...(patch.dueDate !== undefined ? { dueDate: patch.dueDate } : {}),
      ...(patch.dueTime !== undefined ? { dueTime: patch.dueTime } : {}),
      ...(patch.recurrence !== undefined ? { recurrence: patch.recurrence } : {}),
      ...(patch.category !== undefined ? { category: patch.category } : {}),
      ...(patch.labelIds !== undefined ? { labelIds: patch.labelIds } : {}),
      ...(patch.checklist !== undefined ? { checklist: patch.checklist as Prisma.InputJsonValue } : {}),
      ...(patch.attachments !== undefined
        ? { attachments: patch.attachments as Prisma.InputJsonValue }
        : {}),
      ...(patch.starred !== undefined ? { starred: patch.starred } : {}),
    },
  });
  log.info('card.update', { businessId, cardId, actorId });
  return serializeWorkspaceCard(card);
}

export async function moveWorkspaceCard(
  businessId: string,
  cardId: string,
  columnId: string,
  actorId: string
) {
  const card = await getCardOrThrow(businessId, cardId);
  if (card.columnId === columnId) return serializeWorkspaceCard(card);

  const [fromCol, toCol] = await Promise.all([
    prisma.workspaceColumn.findUnique({ where: { id: card.columnId } }),
    prisma.workspaceColumn.findFirst({ where: { id: columnId, boardId: card.boardId } }),
  ]);
  if (!fromCol || !toCol) throw new Error('NOT_FOUND');

  const fromIds = cardIdsFromJson(fromCol.cardIds).filter((id) => id !== cardId);
  const toIds = cardIdsFromJson(toCol.cardIds);
  toIds.push(cardId);

  await prisma.$transaction([
    prisma.workspaceColumn.update({ where: { id: fromCol.id }, data: { cardIds: fromIds } }),
    prisma.workspaceColumn.update({ where: { id: toCol.id }, data: { cardIds: toIds } }),
    prisma.workspaceCard.update({ where: { id: cardId }, data: { columnId } }),
  ]);

  const updated = await prisma.workspaceCard.findUniqueOrThrow({ where: { id: cardId } });
  log.info('card.move', { businessId, cardId, fromColumnId: fromCol.id, toColumnId: columnId, actorId });
  return serializeWorkspaceCard(updated);
}

export async function deleteWorkspaceCard(businessId: string, cardId: string, actorId: string) {
  const card = await getCardOrThrow(businessId, cardId);
  const column = await prisma.workspaceColumn.findUnique({ where: { id: card.columnId } });
  if (column) {
    const cardIds = cardIdsFromJson(column.cardIds).filter((id) => id !== cardId);
    await prisma.workspaceColumn.update({ where: { id: column.id }, data: { cardIds } });
  }
  await prisma.workspaceCard.delete({ where: { id: cardId } });
  log.info('card.delete', { businessId, cardId, actorId });
}

export async function searchWorkspaceCards(
  businessId: string,
  boardId: string,
  query: string,
  labelId?: string
) {
  const q = query.trim().toLowerCase();
  const cards = await prisma.workspaceCard.findMany({ where: { businessId, boardId } });
  return cards
    .map(serializeWorkspaceCard)
    .filter((c) => {
      if (labelId && !c.labelIds.includes(labelId)) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.assignee.toLowerCase().includes(q)
      );
    });
}

export async function createWorkspaceProject(
  businessId: string,
  input: { name: string; memberIds: string[]; boardId?: string; ncFolderPath?: string },
  actorId: string
) {
  const created = await prisma.workspaceProject.create({
    data: {
      businessId,
      name: input.name.trim(),
      memberIds: input.memberIds,
      boardId: input.boardId,
      ncFolderPath: input.ncFolderPath,
    },
  });
  const ncFolderPath =
    input.ncFolderPath ?? ncPathForWorkspaceProject(businessId, created.id);
  const project =
    created.ncFolderPath === ncFolderPath
      ? created
      : await prisma.workspaceProject.update({
          where: { id: created.id },
          data: { ncFolderPath },
        });
  log.info('project.create', { businessId, projectId: project.id, actorId });
  return serializeWorkspaceProject(project);
}

export async function updateWorkspaceProject(
  businessId: string,
  projectId: string,
  patch: Partial<MeizitoProject>,
  actorId: string
) {
  const existing = await prisma.workspaceProject.findFirst({ where: { id: projectId, businessId } });
  if (!existing) throw new Error('NOT_FOUND');
  const project = await prisma.workspaceProject.update({
    where: { id: projectId },
    data: {
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.memberIds !== undefined ? { memberIds: patch.memberIds } : {}),
      ...(patch.boardId !== undefined ? { boardId: patch.boardId ?? null } : {}),
      ...(patch.ncFolderPath !== undefined ? { ncFolderPath: patch.ncFolderPath ?? null } : {}),
    },
  });
  return serializeWorkspaceProject(project);
}

export async function createNoteBoard(businessId: string, name: string, actorId: string) {
  const max = await prisma.noteBoard.aggregate({
    where: { businessId },
    _max: { order: true },
  });
  const board = await prisma.noteBoard.create({
    data: {
      businessId,
      name: name.trim() || 'تابلو یادداشت',
      order: (max._max.order ?? -1) + 1,
    },
  });
  return serializeNoteBoard(board);
}

export async function createWorkspaceNote(
  businessId: string,
  input: {
    title: string;
    content: string;
    color: string;
    boardId?: string;
    ncAttachments?: unknown;
  },
  actorId: string
) {
  let boardId = input.boardId;
  if (!boardId) {
    const first = await prisma.noteBoard.findFirst({
      where: { businessId },
      orderBy: { order: 'asc' },
    });
    if (!first) {
      const created = await createNoteBoard(businessId, 'عمومی', actorId);
      boardId = created.id;
    } else {
      boardId = first.id;
    }
  }

  const note = await prisma.workspaceNote.create({
    data: {
      businessId,
      boardId,
      title: input.title.trim() || 'یادداشت',
      content: input.content,
      color: input.color,
      ncAttachments: (input.ncAttachments ?? []) as Prisma.InputJsonValue,
    },
  });
  log.info('note.create', { businessId, noteId: note.id, actorId });
  return serializeWorkspaceNote(note);
}

export async function updateWorkspaceNote(
  businessId: string,
  noteId: string,
  patch: Partial<MeizitoNote>,
  actorId: string
) {
  const existing = await prisma.workspaceNote.findFirst({ where: { id: noteId, businessId } });
  if (!existing) throw new Error('NOT_FOUND');
  const note = await prisma.workspaceNote.update({
    where: { id: noteId },
    data: {
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.content !== undefined ? { content: patch.content } : {}),
      ...(patch.color !== undefined ? { color: patch.color } : {}),
      ...(patch.starred !== undefined ? { starred: patch.starred } : {}),
      ...(patch.archived !== undefined ? { archived: patch.archived } : {}),
      ...(patch.checklist !== undefined
        ? { checklist: patch.checklist as Prisma.InputJsonValue }
        : {}),
      ...(patch.ncAttachments !== undefined
        ? { ncAttachments: patch.ncAttachments as Prisma.InputJsonValue }
        : {}),
      ...(patch.deletedAt !== undefined ? { deletedAt: patch.deletedAt } : {}),
    },
  });
  return serializeWorkspaceNote(note);
}

export async function createDailyReport(
  businessId: string,
  input: Omit<MeizitoDailyReport, 'id' | 'createdAt' | 'updatedAt'>,
  actorId: string
) {
  const row = await prisma.dailyReport.create({
    data: {
      businessId,
      authorUserId: input.authorId,
      authorName: input.authorName,
      dateKey: input.date,
      title: input.title,
      body: input.body,
      status: input.status,
      feedbackEntries: (input.feedbackEntries ?? []) as Prisma.InputJsonValue,
    },
  });
  log.info('dailyReport.create', { businessId, reportId: row.id, actorId });
  return serializeDailyReportRow(row);
}

export async function updateDailyReport(
  businessId: string,
  reportId: string,
  patch: Partial<Pick<MeizitoDailyReport, 'title' | 'body' | 'status'>>,
  actorId: string
) {
  const existing = await prisma.dailyReport.findFirst({ where: { id: reportId, businessId } });
  if (!existing) throw new Error('NOT_FOUND');
  const row = await prisma.dailyReport.update({
    where: { id: reportId },
    data: {
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.body !== undefined ? { body: patch.body } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
    },
  });
  return serializeDailyReportRow(row);
}

export async function addDailyReportFeedback(
  businessId: string,
  reportId: string,
  reviewerId: string,
  feedback: string,
  kind: 'feedback' | 'approve' = 'feedback'
) {
  const team = await loadBusinessTeamMembers(businessId);
  const existing = await prisma.dailyReport.findFirst({ where: { id: reportId, businessId } });
  if (!existing) throw new Error('NOT_FOUND');
  const report = serializeDailyReportRow(existing);
  if (!canReviewDailyReport(report, reviewerId, team)) throw new Error('FORBIDDEN');

  const actor = team.find((u) => u.id === reviewerId);
  const entry: MeizitoReportFeedback = {
    id: newFeedbackId(),
    authorId: reviewerId,
    authorName: actor?.name ?? '',
    roleLabel: getReviewerRoleLabel(report.authorId, reviewerId, team),
    text: feedback.trim(),
    kind,
    at: new Date().toISOString(),
  };
  const entries = [...(report.feedbackEntries ?? []), entry];
  const row = await prisma.dailyReport.update({
    where: { id: reportId },
    data: {
      feedbackEntries: entries as unknown as Prisma.InputJsonValue,
      ...(kind === 'approve'
        ? { managerApproved: true, managerApprovedAt: new Date() }
        : {}),
    },
  });
  log.info('dailyReport.feedback', { businessId, reportId, reviewerId, kind });
  return serializeDailyReportRow(row);
}

export async function createFieldVisit(
  businessId: string,
  visit: Omit<MeizitoFieldVisit, 'id' | 'createdAt'>,
  actorId: string
) {
  const { id: _id, createdAt: _c, ...details } = visit as MeizitoFieldVisit;
  const row = await prisma.fieldVisit.create({
    data: {
      businessId,
      authorUserId: visit.authorId,
      authorName: visit.authorName,
      dateKey: visit.date,
      details: details as Prisma.InputJsonValue,
    },
  });
  log.info('fieldVisit.create', { businessId, visitId: row.id, actorId });
  return serializeFieldVisitRow(row);
}

export async function updateFieldVisit(
  businessId: string,
  visitId: string,
  patch: Partial<Omit<MeizitoFieldVisit, 'id' | 'createdAt'>>,
  actorId: string
) {
  const existing = await prisma.fieldVisit.findFirst({ where: { id: visitId, businessId } });
  if (!existing) throw new Error('NOT_FOUND');
  const current = serializeFieldVisitRow(existing);
  const merged = { ...current, ...patch };
  const { id, createdAt, authorId, authorName, date, ...details } = merged;
  const row = await prisma.fieldVisit.update({
    where: { id: visitId },
    data: {
      authorUserId: authorId,
      authorName,
      dateKey: date,
      details: details as Prisma.InputJsonValue,
    },
  });
  return serializeFieldVisitRow(row);
}

export async function deleteFieldVisit(businessId: string, visitId: string, actorId: string) {
  const existing = await prisma.fieldVisit.findFirst({ where: { id: visitId, businessId } });
  if (!existing) throw new Error('NOT_FOUND');
  await prisma.fieldVisit.delete({ where: { id: visitId } });
  log.info('fieldVisit.delete', { businessId, visitId, actorId });
}
