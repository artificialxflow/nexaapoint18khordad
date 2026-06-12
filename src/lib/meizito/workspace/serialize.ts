import type {
  MeizitoBoard,
  MeizitoCard,
  MeizitoColumn,
  MeizitoDailyReport,
  MeizitoFieldVisit,
  MeizitoNote,
  MeizitoNoteBoard,
  MeizitoProject,
  MeizitoRecurrence,
} from '@/src/types/meizito';
import { normalizeDailyReport } from '@/src/lib/meizito/teamHierarchy';
import { normalizeFieldVisit } from '@/src/lib/meizito/visitHelpers';

type WorkspaceBoardRow = {
  id: string;
  name: string;
  memberNames: unknown;
  labelPalette: unknown;
};

type WorkspaceColumnRow = {
  id: string;
  boardId: string;
  title: string;
  order: number;
  cardIds: unknown;
};

type WorkspaceCardRow = {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description: string;
  labelIds: unknown;
  category: string;
  assignee: string;
  checklist: unknown;
  attachments: unknown;
  dueDate: string;
  dueTime: string;
  recurrence: string;
  starred: boolean;
};

type WorkspaceProjectRow = {
  id: string;
  name: string;
  memberIds: unknown;
  boardId: string | null;
  ncFolderPath: string | null;
};

type NoteBoardRow = {
  id: string;
  name: string;
  color: string;
  order: number;
};

type WorkspaceNoteRow = {
  id: string;
  boardId: string;
  title: string;
  content: string;
  color: string;
  checklist: unknown;
  ncAttachments: unknown;
  starred: boolean;
  archived: boolean;
  deletedAt: string | null;
};

type DailyReportRow = {
  id: string;
  authorUserId: string;
  authorName: string;
  dateKey: string;
  title: string;
  body: string;
  status: MeizitoDailyReport['status'];
  managerApproved: boolean;
  managerApprovedAt: Date | null;
  feedbackEntries: unknown;
  createdAt: Date;
  updatedAt: Date;
};

type FieldVisitRow = {
  id: string;
  authorUserId: string;
  authorName: string;
  dateKey: string;
  details: unknown;
  createdAt: Date;
};
function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}

function asJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  return value as T;
}

export function serializeWorkspaceBoard(
  board: WorkspaceBoardRow,
  columns: WorkspaceColumnRow[]
): MeizitoBoard {
  return {
    id: board.id,
    name: board.name,
    memberNames: asStringArray(board.memberNames),
    columnIds: columns.sort((a, b) => a.order - b.order).map((c) => c.id),
    labelPalette: asJson(board.labelPalette, []),
  };
}

export function serializeWorkspaceColumn(column: WorkspaceColumnRow): MeizitoColumn {
  return {
    id: column.id,
    boardId: column.boardId,
    title: column.title,
    order: column.order,
    cardIds: asStringArray(column.cardIds),
  };
}

export function serializeWorkspaceCard(card: WorkspaceCardRow): MeizitoCard {
  return {
    id: card.id,
    boardId: card.boardId,
    columnId: card.columnId,
    title: card.title,
    description: card.description,
    labelIds: asStringArray(card.labelIds),
    category: card.category,
    assignee: card.assignee,
    checklist: asJson(card.checklist, []),
    attachments: asJson(card.attachments, []),
    dueDate: card.dueDate,
    dueTime: card.dueTime,
    recurrence: card.recurrence as MeizitoRecurrence,
    starred: card.starred,
  };
}

export function serializeWorkspaceProject(project: WorkspaceProjectRow): MeizitoProject {
  return {
    id: project.id,
    name: project.name,
    memberIds: asStringArray(project.memberIds),
    boardId: project.boardId ?? undefined,
    ncFolderPath: project.ncFolderPath ?? undefined,
  };
}

export function serializeNoteBoard(board: NoteBoardRow): MeizitoNoteBoard {
  return {
    id: board.id,
    name: board.name,
    color: board.color,
    order: board.order,
  };
}

export function serializeWorkspaceNote(note: WorkspaceNoteRow): MeizitoNote {
  return {
    id: note.id,
    boardId: note.boardId,
    title: note.title,
    content: note.content,
    color: note.color,
    checklist: asJson(note.checklist, []),
    ncAttachments: asJson(note.ncAttachments, undefined),
    archived: note.archived,
    deletedAt: note.deletedAt,
    starred: note.starred,
  };
}

export function serializeDailyReportRow(row: DailyReportRow): MeizitoDailyReport {
  return normalizeDailyReport({
    id: row.id,
    authorId: row.authorUserId,
    authorName: row.authorName,
    date: row.dateKey,
    title: row.title,
    body: row.body,
    status: row.status,
    managerApproved: row.managerApproved,
    managerApprovedAt: row.managerApprovedAt?.toISOString(),
    feedbackEntries: asJson(row.feedbackEntries, []),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

export function serializeFieldVisitRow(row: FieldVisitRow): MeizitoFieldVisit {
  const details = asJson<Partial<MeizitoFieldVisit>>(row.details, {});
  return normalizeFieldVisit({
    ...details,
    id: row.id,
    date: row.dateKey,
    authorId: row.authorUserId,
    authorName: row.authorName,
    createdAt: row.createdAt.toISOString(),
  } as MeizitoFieldVisit);
}

export type WorkspaceSnapshot = {
  boards: MeizitoBoard[];
  columns: MeizitoColumn[];
  cards: MeizitoCard[];
  projects: MeizitoProject[];
  noteBoards: MeizitoNoteBoard[];
  notes: MeizitoNote[];
  dailyReports: MeizitoDailyReport[];
  fieldVisits: MeizitoFieldVisit[];
  activeBoardId: string | null;
  activeNoteBoardId: string | null;
};
