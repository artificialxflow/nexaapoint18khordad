'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  MeizitoApprovableEntityType,
  MeizitoBoard,
  MeizitoCalendar,
  MeizitoCalendarEvent,
  MeizitoCalendarKind,
  MeizitoCard,
  MeizitoChatMessage,
  MeizitoChatThread,
  MeizitoDailyReport,
  MeizitoFieldVisit,
  MeizitoInternalRequest,
  MeizitoLetter,
  MeizitoLetterCategory,
  MeizitoMessageType,
  MeizitoMockUser,
  MeizitoThreadType,
  MeizitoColumn,
  MeizitoNote,
  MeizitoNoteBoard,
  MeizitoProject,
  MeizitoRecurrence,
} from '@/src/types/meizito';
import {
  MEIZITO_CURRENT_USER_NAME,
  MEIZITO_CURRENT_USER_ID_KEY,
  MEIZITO_MOCK_USERS,
  MEIZITO_TASKS_CALENDAR_ID,
} from '@/src/types/meizito';
import {
  applyApprovalAction,
  applySubmitForApproval,
  listTeamDirectory,
  normalizeApprovableFields,
  resolveForwardTargets,
  type RecordApprovalPayload,
  type TeamDirectoryFilter,
} from '@/src/lib/meizito/approval';
import {
  canReviewDailyReport,
  getReviewerRoleLabel,
  isManagerRole,
  newFeedbackId,
  normalizeDailyReport,
  normalizeInternalRequest as normalizeRequestReferrals,
  primaryAssigneeFromReferrals,
} from '@/src/lib/meizito/teamHierarchy';
import {
  buildCustomerName,
  parseLegacyCustomerName,
  totalVisitorCount,
} from '@/src/lib/meizito/visitHelpers';
import { useAuthOptional } from '@/src/context/AuthContext';
import { useBusinessOptional } from '@/src/context/BusinessContext';
import {
  MEIZITO_DATA_SOURCES,
  useMockUserSwitcher as isMockUserSwitcherEnabled,
  type MeizitoDataSources,
} from '@/src/lib/meizito/config';

export { MEIZITO_CURRENT_USER_NAME };

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return String(Date.now());
}

const STORAGE_KEY = 'nexa-meizito-v2';
const STORAGE_KEY_LEGACY = 'nexa-meizito-v1';

const DEFAULT_USER_ID = MEIZITO_MOCK_USERS[0]?.id ?? 'user-manager';

type Stored = Partial<{
  boards: MeizitoBoard[];
  columns: MeizitoColumn[];
  cards: MeizitoCard[];
  projects: MeizitoProject[];
  threads: MeizitoChatThread[];
  messages: MeizitoChatMessage[];
  letters: MeizitoLetter[];
  dailyReports: MeizitoDailyReport[];
  fieldVisits: MeizitoFieldVisit[];
  internalRequests: MeizitoInternalRequest[];
  currentUserId: string;
  notes: MeizitoNote[];
  noteBoards: MeizitoNoteBoard[];
  activeNoteBoardId: string;
  calendars: MeizitoCalendar[];
  calendarEvents: MeizitoCalendarEvent[];
  activeCalendarId: string;
  activeBoardId: string;
  activeThreadId: string;
}>;

function inferLetterCategory(labels: string[]): MeizitoLetterCategory {
  const joined = labels.join(' ').toLowerCase();
  if (/مالی|finance/i.test(joined)) return 'financial';
  if (/اداری|admin/i.test(joined)) return 'administrative';
  if (/منابع|hr/i.test(joined)) return 'hr';
  if (/عملیات|ops/i.test(joined)) return 'operations';
  return 'other';
}

const DEFAULT_NOTE_BOARD_ID = 'note-board-general';

function normalizeCalendar(c: MeizitoCalendar): MeizitoCalendar {
  return {
    ...c,
    sharedWith: c.sharedWith ?? [],
    ownerName: c.ownerName ?? MEIZITO_CURRENT_USER_NAME,
    visible: c.visible ?? true,
  };
}

function normalizeCalendarEvent(e: MeizitoCalendarEvent): MeizitoCalendarEvent {
  return {
    ...e,
    time: e.time || undefined,
    attendeeIds: e.attendeeIds ?? [],
    rsvp: e.rsvp ?? {},
  };
}

function defaultCalendarsSeed(): MeizitoCalendar[] {
  return [
    {
      id: MEIZITO_TASKS_CALENDAR_ID,
      name: 'وظایف میز کار',
      color: '#6366f1',
      kind: 'general',
      sharedWith: [],
      ownerName: MEIZITO_CURRENT_USER_NAME,
    },
    {
      id: 'cal-customer',
      name: 'پیگیری مشتری',
      color: '#f59e0b',
      kind: 'customer_followup',
      sharedWith: ['1', '3'],
      ownerName: MEIZITO_CURRENT_USER_NAME,
    },
    {
      id: 'cal-service',
      name: 'خدمت‌رسانی',
      color: '#10b981',
      kind: 'service',
      sharedWith: ['3'],
      ownerName: MEIZITO_CURRENT_USER_NAME,
    },
  ];
}

function normalizeMessage(m: MeizitoChatMessage): MeizitoChatMessage {
  return {
    ...m,
    type: m.type ?? 'text',
    attachmentNames: m.attachmentNames ?? [],
    attachmentRefs: m.attachmentRefs ?? [],
  };
}

function normalizeThread(t: MeizitoChatThread): MeizitoChatThread {
  return {
    ...t,
    threadType: t.threadType ?? 'direct',
    participantNames: t.participantNames ?? [],
    pinned: t.pinned ?? false,
    starred: t.starred ?? false,
  };
}

function normalizeProject(p: MeizitoProject): MeizitoProject {
  const memberIds = p.memberIds ?? [];
  return {
    ...p,
    memberIds,
    members: p.members,
    ncFolderPath: p.ncFolderPath ?? `/Nexa/projects/${p.id}/`,
  };
}

function normalizeNote(n: MeizitoNote, defaultBoardId: string): MeizitoNote {
  return {
    ...n,
    boardId: n.boardId ?? defaultBoardId,
    ncAttachments: n.ncAttachments ?? [],
  };
}

function normalizeFieldVisit(v: MeizitoFieldVisit): MeizitoFieldVisit {
  let visitorGender = v.visitorGender;
  let visitorTitle = v.visitorTitle;
  let visitorFirstName = v.visitorFirstName ?? '';
  let visitorLastName = v.visitorLastName ?? '';

  if (!visitorFirstName && !visitorLastName && v.customerName?.trim()) {
    const parsed = parseLegacyCustomerName(v.customerName);
    visitorGender = visitorGender ?? parsed.visitorGender;
    visitorTitle = visitorTitle ?? parsed.visitorTitle;
    visitorFirstName = parsed.visitorFirstName;
    visitorLastName = parsed.visitorLastName;
  }

  const maleCompanionCount = Math.max(0, v.maleCompanionCount ?? 0);
  const femaleCompanionCount = Math.max(0, v.femaleCompanionCount ?? 0);
  const customerName =
    buildCustomerName({
      visitorTitle,
      visitorFirstName,
      visitorLastName,
      visitorGender,
    }) !== '—'
      ? buildCustomerName({
          visitorTitle,
          visitorFirstName,
          visitorLastName,
          visitorGender,
        })
      : v.customerName?.trim() || '—';

  const designerName = v.designerName?.trim() || '';
  const hasDesigner =
    v.hasDesigner ?? (!!designerName && designerName !== '—');
  const visitedBy = v.visitedBy ?? (hasDesigner ? designerName : '—');
  const timeFrom = v.timeFrom ?? v.time;
  const timeTo = v.timeTo;
  const withCounts = {
    ...v,
    visitorGender,
    visitorTitle,
    visitorFirstName,
    visitorLastName,
    maleCompanionCount,
    femaleCompanionCount,
    customerName,
  };

  return {
    ...withCounts,
    designerName: hasDesigner ? designerName || visitedBy : '—',
    visitedBy,
    hasDesigner,
    designerMobile: v.designerMobile,
    customerMobile: v.customerMobile,
    priorityTags: v.priorityTags ?? [],
    timeFrom,
    timeTo,
    purchaseProbability: v.purchaseProbability ?? 'unknown',
    visitorCount: v.visitorCount ?? totalVisitorCount(withCounts),
    visitKind: v.visitKind ?? 'new',
    followUpActions: v.followUpActions ?? [],
    productInterestIds: v.productInterestIds ?? [],
    salesConsultantName: v.salesConsultantName ?? v.authorName,
    description: v.description ?? v.notes,
  };
}

function normalizeInternalRequest(r: MeizitoInternalRequest): MeizitoInternalRequest {
  const legacyApproved = !r.approvalState && !r.submittedAt;
  const approval = normalizeApprovableFields(
    {
      approvalState: r.approvalState,
      approvalSteps: r.approvalSteps,
      currentAssigneeId: r.currentAssigneeId,
      submittedAt: r.submittedAt,
    },
    legacyApproved
  );
  return {
    ...normalizeRequestReferrals(r),
    ...approval,
    status: r.status ?? 'open',
    createdAt: r.createdAt ?? new Date().toISOString(),
    attachments: r.attachments ?? [],
    threadId: r.threadId ?? r.id,
    priority: r.priority ?? 'medium',
  };
}

function normalizeLetter(l: MeizitoLetter): MeizitoLetter {
  const id = l.id;
  const labels = l.labels ?? [];
  const legacyApproved = !l.approvalState && !l.submittedAt;
  const approval = normalizeApprovableFields(
    {
      approvalState: l.approvalState,
      approvalSteps: l.approvalSteps,
      currentAssigneeId: l.currentAssigneeId,
      submittedAt: l.submittedAt,
    },
    legacyApproved
  );
  return {
    ...l,
    ...approval,
    labels,
    category: l.category ?? inferLetterCategory(labels),
    status: l.status ?? (l.box === 'archive' ? 'closed' : 'open'),
    referredTo: l.referredTo ?? [],
    referredFrom: l.referredFrom ?? '',
    threadId: l.threadId ?? id,
    attachments: l.attachments ?? [],
    createdAt: l.createdAt ?? new Date().toISOString(),
  };
}

function readCurrentUserIdFromBrowser(): string {
  if (typeof window === 'undefined') return DEFAULT_USER_ID;
  const id = window.localStorage.getItem(MEIZITO_CURRENT_USER_ID_KEY);
  if (id && MEIZITO_MOCK_USERS.some((u) => u.id === id)) return id;
  return DEFAULT_USER_ID;
}

function readStored(): Stored {
  if (typeof window === 'undefined') return {};
  try {
    let raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) raw = window.localStorage.getItem(STORAGE_KEY_LEGACY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Stored;
    if (parsed.messages) parsed.messages = parsed.messages.map(normalizeMessage);
    if (parsed.threads) parsed.threads = parsed.threads.map(normalizeThread);
    if (parsed.letters) parsed.letters = parsed.letters.map(normalizeLetter);
    if (parsed.fieldVisits) parsed.fieldVisits = parsed.fieldVisits.map(normalizeFieldVisit);
    if (parsed.internalRequests) {
      parsed.internalRequests = parsed.internalRequests.map(normalizeInternalRequest);
    }
    if (parsed.dailyReports) {
      parsed.dailyReports = parsed.dailyReports.map(normalizeDailyReport);
    }
    if (!parsed.noteBoards?.length) {
      parsed.noteBoards = [
        { id: DEFAULT_NOTE_BOARD_ID, name: 'عمومی', color: '#fef08a', order: 0 },
        { id: 'note-board-work', name: 'کاری', color: '#bbf7d0', order: 1 },
      ];
    }
    if (!parsed.activeNoteBoardId) {
      parsed.activeNoteBoardId = parsed.noteBoards[0]?.id ?? DEFAULT_NOTE_BOARD_ID;
    }
    const defaultBoardId =
      parsed.noteBoards?.[0]?.id ?? parsed.noteBoards?.find((b) => b.order === 0)?.id ?? DEFAULT_NOTE_BOARD_ID;
    if (parsed.notes) parsed.notes = parsed.notes.map((n) => normalizeNote(n, defaultBoardId));
    if (parsed.projects) parsed.projects = parsed.projects.map(normalizeProject);
    if (!parsed.calendars?.length) {
      parsed.calendars = defaultCalendarsSeed();
    } else {
      parsed.calendars = parsed.calendars.map(normalizeCalendar);
    }
    if (!parsed.activeCalendarId) {
      parsed.activeCalendarId = parsed.calendars[0]?.id ?? 'cal-customer';
    }
    if (parsed.calendarEvents) {
      parsed.calendarEvents = parsed.calendarEvents.map(normalizeCalendarEvent);
    }
    if (!parsed.currentUserId) {
      parsed.currentUserId = readCurrentUserIdFromBrowser();
    }
    return parsed;
  } catch {
    return {};
  }
}

function dateKeyOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function seedData() {
  const bId = 'board-1';
  const c1 = 'col-todo';
  const c2 = 'col-doing';
  const c3 = 'col-done';
  const todayKey = dateKeyOffset(0);
  const yesterdayKey = dateKeyOffset(-1);
  const overdueKey = dateKeyOffset(-5);
  const labels = [
    { id: 'l1', name: 'مهم', color: '#ef4444' },
    { id: 'l2', name: 'نرم‌افزار', color: '#6366f1' },
  ];
  const card1: MeizitoCard = {
    id: 'card-1',
    boardId: bId,
    columnId: c1,
    title: 'هماهنگی جلسه تولید',
    description: '',
    labelIds: ['l1'],
    category: 'جلسات',
    assignee: MEIZITO_CURRENT_USER_NAME,
    checklist: [
      { id: newId(), title: 'باز کردن میز کار', done: true },
      { id: newId(), title: 'دعوت پرسنل', done: false },
    ],
    attachments: [],
    dueDate: todayKey,
    dueTime: '10:00',
    recurrence: 'none',
    starred: false,
  };
  const card2: MeizitoCard = {
    id: 'card-2',
    boardId: bId,
    columnId: c2,
    title: 'پیگیری فاکتور نمونه',
    description: '',
    labelIds: ['l2'],
    category: 'مالی',
    assignee: 'سارا',
    checklist: [],
    attachments: [{ id: newId(), name: 'فاکتور.pdf', size: '۱۲۰ KB' }],
    dueDate: todayKey,
    dueTime: '',
    recurrence: 'weekly',
    starred: true,
  };
  const card3: MeizitoCard = {
    id: 'card-3',
    boardId: bId,
    columnId: c1,
    title: 'تماس با تأمین‌کننده',
    description: '',
    labelIds: [],
    category: 'تدارکات',
    assignee: 'رضا',
    checklist: [],
    attachments: [],
    dueDate: yesterdayKey,
    dueTime: '',
    recurrence: 'none',
    starred: false,
  };
  const card4: MeizitoCard = {
    id: 'card-4',
    boardId: bId,
    columnId: c2,
    title: 'بروزرسانی لیست قیمت',
    description: '',
    labelIds: ['l2'],
    category: 'فروش',
    assignee: 'سارا',
    checklist: [],
    attachments: [],
    dueDate: overdueKey,
    dueTime: '',
    recurrence: 'none',
    starred: false,
  };
  const board: MeizitoBoard = {
    id: bId,
    name: 'میز کار عمومی',
    memberNames: ['امیرحسین', 'سارا', 'رضا'],
    columnIds: [c1, c2, c3],
    labelPalette: labels,
  };
  const columns: MeizitoColumn[] = [
    { id: c1, boardId: bId, title: 'برای انجام', order: 0, cardIds: [card1.id, card3.id] },
    { id: c2, boardId: bId, title: 'در حال انجام', order: 1, cardIds: [card2.id, card4.id] },
    { id: c3, boardId: bId, title: 'انجام شده', order: 2, cardIds: [] },
  ];
  const thDirect = 'thread-direct';
  const thGroup = 'thread-group';
  const thChannel = 'thread-channel';
  const now = new Date().toISOString();
  const msg1: MeizitoChatMessage = {
    id: 'msg-1',
    threadId: thDirect,
    author: 'واحد تولید',
    body: 'سلام، گزارش QC خط تولید امروز آماده شد.',
    createdAt: now,
    type: 'text',
    attachmentNames: [],
  };
  const msg2: MeizitoChatMessage = {
    id: 'msg-2',
    threadId: thDirect,
    author: MEIZITO_CURRENT_USER_NAME,
    body: 'عالیه، لطفاً فایل نهایی را همینجا ارسال کنید.',
    createdAt: now,
    type: 'text',
    attachmentNames: [],
  };
  const msg3: MeizitoChatMessage = {
    id: 'msg-3',
    threadId: thGroup,
    author: 'سارا',
    body: 'فاکتور جدید در سیستم ثبت شد.',
    createdAt: now,
    type: 'text',
    attachmentNames: [],
  };
  const msg4: MeizitoChatMessage = {
    id: 'msg-4',
    threadId: thChannel,
    author: 'مدیریت',
    body: 'بخشنامه جدید حقوق و مزایا صادر شد.',
    createdAt: now,
    type: 'text',
    attachmentNames: [],
  };
  const threadDirect: MeizitoChatThread = {
    id: thDirect,
    title: 'واحد تولید',
    threadType: 'direct',
    participantNames: ['واحد تولید'],
    starred: false,
    pinned: false,
    messageIds: [msg1.id, msg2.id],
  };
  const threadGroup: MeizitoChatThread = {
    id: thGroup,
    title: 'تیم فروش نکسایی',
    threadType: 'group',
    participantNames: ['امیرحسین', 'سارا', 'رضا'],
    starred: true,
    pinned: true,
    messageIds: [msg3.id],
  };
  const threadChannel: MeizitoChatThread = {
    id: thChannel,
    title: 'اطلاعیه‌های سازمان',
    threadType: 'channel',
    participantNames: [],
    starred: false,
    pinned: false,
    messageIds: [msg4.id],
  };
  return {
    boards: [board],
    columns,
    cards: [card1, card2, card3, card4],
    projects: [
      {
        id: 'proj-1',
        name: 'پروژه نمونه',
        memberIds: ['1', '3'],
        boardId: bId,
        ncFolderPath: '/Nexa/projects/proj-1/',
      },
    ],
    threads: [threadDirect, threadGroup, threadChannel],
    messages: [msg1, msg2, msg3, msg4],
    letters: (() => {
      const threadLet = 'thread-let-1';
      const t0 = new Date(Date.now() - 2 * 86400000).toISOString();
      const t1 = new Date(Date.now() - 86400000).toISOString();
      return [
        {
          id: 'let-1',
          subject: 'درخواست جلسه',
          body: 'با سلام،\nبدینوسیله درخواست جلسه در تاریخ ... را اعلام می‌کنم.',
          to: ['مدیر فروش'],
          labels: ['اداری'],
          category: 'administrative' as const,
          status: 'open' as const,
          box: 'inbox' as const,
          referredTo: ['واحد مالی'],
          referredFrom: MEIZITO_CURRENT_USER_NAME,
          threadId: threadLet,
          attachments: [],
          createdAt: t0,
        },
        {
          id: 'let-2',
          subject: 'Re: درخواست جلسه',
          body: 'با سلام،\nموضوع در دست بررسی است.\n\n---\nنامه قبلی:\nدرخواست جلسه...',
          to: [MEIZITO_CURRENT_USER_NAME],
          labels: ['اداری'],
          category: 'administrative' as const,
          status: 'open' as const,
          box: 'inbox' as const,
          referredTo: [],
          referredFrom: 'مدیر فروش',
          replyToLetterId: 'let-1',
          threadId: threadLet,
          attachments: [],
          createdAt: t1,
        },
        {
          id: 'let-3',
          subject: 'گزارش ماهانه',
          body: 'پیوست گزارش ارسال شد.',
          to: ['مدیریت'],
          labels: ['گزارش', 'مالی'],
          category: 'financial' as const,
          status: 'closed' as const,
          box: 'archive' as const,
          referredTo: ['مدیریت'],
          referredFrom: MEIZITO_CURRENT_USER_NAME,
          threadId: 'thread-let-2',
          attachments: [{ name: 'report.pdf', size: '۲۴۰ KB' }],
          createdAt: new Date().toISOString(),
        },
      ];
    })(),
    dailyReports: (() => {
      const todayKey = dateKeyOffset(0);
      const now = new Date().toISOString();
      return [
        {
          id: 'dr-1',
          authorId: 'user-sara',
          authorName: 'سارا',
          date: todayKey,
          title: 'گزارش فروش روز',
          body: '۳ تماس پیگیری و ۱ پیش‌فاکتور صادر شد.',
          status: 'submitted' as const,
          feedbackEntries: [
            {
              id: 'fb-seed-1',
              authorId: 'user-manager',
              authorName: 'امیرحسین',
              roleLabel: 'مدیر مستقیم',
              text: 'عالی، فردا پیگیری مشتری VIP را اولویت بده.',
              kind: 'feedback' as const,
              at: now,
            },
          ],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'dr-2',
          authorId: 'user-reza',
          authorName: 'رضا',
          date: todayKey,
          title: 'گزارش تولید',
          body: 'خط تولید بدون توقف.',
          status: 'submitted' as const,
          createdAt: now,
          updatedAt: now,
        },
      ];
    })(),
    fieldVisits: (() => {
      const todayKey = dateKeyOffset(0);
      const now = new Date().toISOString();
      return [
        {
          id: 'fv-1',
          date: todayKey,
          timeFrom: '10:00',
          timeTo: '10:45',
          customerName: 'خانم علوی',
          visitorGender: 'female' as const,
          visitorTitle: 'خانم',
          visitorFirstName: 'علوی',
          visitorLastName: '',
          customerMobile: '09121234567',
          hasDesigner: true,
          designerName: 'مهندس سمیعی',
          designerMobile: '09129876543',
          visitedBy: 'مهندس سمیعی',
          durationMinutes: 45,
          maleCompanionCount: 0,
          femaleCompanionCount: 1,
          visitorCount: 2,
          result: 'positive' as const,
          likedItems: 'سرویس خواب مدرن، کمد دیواری',
          customerPriorities: 'تحویل سریع و گارانتی',
          priorityTags: ['delivery', 'warranty', 'price'],
          purchaseProbability: 'high' as const,
          interests: 'مینیمال، چوب روشن',
          notes: 'علاقه به سرویس خواب',
          description:
            'از مجموعه بازدید کردند. مبل انجل و غذاخوری را پسندیدند. ان‌شاءالله فردا نهایی می‌شود.',
          customerTypeId: 'new',
          acquaintanceSourceId: 'instagram',
          contactMethodId: 'showroom',
          salesConsultantName: 'رضایی',
          followUpActions: ['تماس فردا صبح', 'ارسال پیش‌فاکتور'],
          authorId: 'user-sara',
          authorName: 'سارا',
          createdAt: now,
        },
        {
          id: 'fv-2',
          date: todayKey,
          timeFrom: '09:00',
          timeTo: '09:20',
          customerName: 'آقای تهرانی',
          visitorGender: 'male' as const,
          visitorTitle: 'آقای',
          visitorFirstName: 'تهرانی',
          visitorLastName: '',
          designerName: '—',
          visitedBy: MEIZITO_CURRENT_USER_NAME,
          durationMinutes: 20,
          visitorCount: 1,
          result: 'neutral' as const,
          purchaseProbability: 'medium' as const,
          likedItems: 'میز ناهارخوری',
          authorId: 'user-manager',
          authorName: MEIZITO_CURRENT_USER_NAME,
          createdAt: now,
        },
        {
          id: 'fv-3',
          date: dateKeyOffset(-1),
          timeFrom: '15:00',
          timeTo: '16:00',
          customerName: 'شرکت نوسازان',
          designerName: 'مریم',
          visitedBy: 'مریم',
          durationMinutes: 60,
          visitorCount: 4,
          result: 'positive' as const,
          purchaseProbability: 'low' as const,
          customerPriorities: 'قیمت عمده و نمونه کار',
          authorId: 'user-maryam',
          authorName: 'مریم',
          createdAt: now,
        },
      ];
    })(),
    currentUserId: DEFAULT_USER_ID,
    noteBoards: [
      { id: 'note-board-general', name: 'عمومی', color: '#fef08a', order: 0 },
      { id: 'note-board-work', name: 'کاری', color: '#bbf7d0', order: 1 },
    ],
    notes: [
      {
        id: 'note-1',
        boardId: 'note-board-general',
        title: 'ایده کمپین',
        content: 'تمرکز بر بسته‌بندی جدید',
        color: '#fef08a',
        checklist: [{ id: 'cl-1', title: 'طراحی بسته‌بندی', done: false }],
        archived: false,
        deletedAt: null,
        starred: true,
      },
      {
        id: 'note-2',
        boardId: 'note-board-work',
        title: 'جلسه هفتگی',
        content: 'دستور جلسه را قبل از دوشنبه آماده کنید.',
        color: '#bbf7d0',
        checklist: [],
        archived: false,
        deletedAt: null,
        starred: false,
      },
    ],
    activeNoteBoardId: 'note-board-general',
    calendars: defaultCalendarsSeed(),
    calendarEvents: [
      {
        id: 'evt-1',
        calendarId: 'cal-customer',
        title: 'تماس پیگیری مشتری VIP',
        date: todayKey,
        time: '14:00',
        notes: 'پیگیری سفارش معوق',
      },
      {
        id: 'evt-2',
        calendarId: 'cal-service',
        title: 'بازدید سرویس دوره‌ای',
        date: dateKeyOffset(3),
        time: '09:30',
      },
    ],
    activeCalendarId: 'cal-customer',
    internalRequests: [
      {
        id: 'req-1',
        subject: 'هماهنگی پرینتر',
        body: 'لطفاً پرینتر طبقه فروش را بررسی و کارتریج تهیه کنید.',
        status: 'open' as const,
        referredToUserIds: ['user-maryam'],
        referredTo: ['مریم'],
        ccUserIds: [],
        authorId: 'user-sara',
        authorName: 'سارا',
        createdAt: new Date().toISOString(),
        approvalState: 'approved' as const,
        approvalSteps: [],
      },
      {
        id: 'req-2',
        subject: 'درخواست کامپیوتر',
        body: 'لطفاً برای ایستگاه کاری جدید یک سیستم تاییدشده تهیه شود.',
        status: 'open' as const,
        authorId: 'user-reza',
        authorName: 'رضا',
        createdAt: new Date().toISOString(),
        priority: 'high' as const,
        category: 'administrative' as const,
        attachments: [],
        approvalState: 'pending' as const,
        currentAssigneeId: 'user-manager',
        submittedAt: new Date().toISOString(),
        approvalSteps: [
          {
            id: 'ap-seed-1',
            actorId: 'user-reza',
            actorName: 'رضا',
            action: 'submit' as const,
            comment: 'ارسال برای تایید',
            at: new Date().toISOString(),
          },
        ],
      },
    ],
    activeBoardId: bId,
    activeThreadId: thDirect,
  };
}

export interface MeizitoContextValue {
  boards: MeizitoBoard[];
  columns: MeizitoColumn[];
  cards: MeizitoCard[];
  projects: MeizitoProject[];
  threads: MeizitoChatThread[];
  messages: MeizitoChatMessage[];
  letters: MeizitoLetter[];
  notes: MeizitoNote[];
  noteBoards: MeizitoNoteBoard[];
  activeNoteBoardId: string;
  setActiveNoteBoardId: (id: string) => void;
  activeBoardId: string;
  activeThreadId: string;
  setActiveBoardId: (id: string) => void;
  setActiveThreadId: (id: string) => void;
  updateBoard: (id: string, patch: Partial<Pick<MeizitoBoard, 'name' | 'memberNames'>>) => void;
  addBoard: (name: string) => void;
  addColumn: (boardId: string, title: string) => void;
  addCard: (boardId: string, columnId: string, title: string) => void;
  moveCard: (cardId: string, toColumnId: string, index: number) => void;
  updateCard: (id: string, patch: Partial<MeizitoCard>) => void;
  copyCardForAssignees: (cardId: string, assignees: string[]) => void;
  toggleCardStar: (id: string) => void;
  addProject: (name: string, memberIds: string[], boardId?: string) => void;
  updateProject: (id: string, patch: Partial<MeizitoProject>) => void;
  addMessage: (
    threadId: string,
    author: string,
    body: string,
    options?: {
      type?: MeizitoMessageType;
      attachmentNames?: string[];
      attachmentRefs?: import('@/src/types/nextcloud').NcFileRef[];
      voiceDurationSec?: number;
      imageDataUrl?: string;
    }
  ) => void;
  addThread: (title: string, threadType: MeizitoThreadType, participantNames?: string[]) => string;
  createCardFromText: (boardId: string, columnId: string, title: string, assignee: string, dueDate: string, recurrence: MeizitoRecurrence) => void;
  toggleThreadStar: (id: string) => void;
  toggleThreadPin: (id: string) => void;
  addLetter: (letter: Omit<MeizitoLetter, 'id' | 'threadId'> & { threadId?: string }) => string;
  replyToLetter: (
    sourceId: string,
    letter: Omit<MeizitoLetter, 'id' | 'replyToLetterId' | 'threadId'>
  ) => void;
  getLetterThread: (threadId: string) => MeizitoLetter[];
  updateLetterBox: (id: string, box: MeizitoLetter['box']) => void;
  closeLetter: (id: string) => void;
  reopenLetter: (id: string) => void;
  setLetterCategory: (id: string, category: MeizitoLetterCategory) => void;
  dailyReports: MeizitoDailyReport[];
  fieldVisits: MeizitoFieldVisit[];
  currentUserId: string;
  setCurrentUserId: (id: string) => void;
  sessionUserId: string | null;
  activeBusinessId: string | null;
  dataSources: MeizitoDataSources;
  useMockUserSwitcher: boolean;
  isCurrentUserManager: boolean;
  canReviewDailyReport: (report: MeizitoDailyReport) => boolean;
  mockUsers: typeof MEIZITO_MOCK_USERS;
  addDailyReport: (report: Omit<MeizitoDailyReport, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateDailyReport: (id: string, patch: Partial<Pick<MeizitoDailyReport, 'title' | 'body' | 'status'>>) => void;
  submitDailyReport: (id: string) => void;
  addFeedbackToReport: (id: string, feedback: string) => void;
  approveDailyReport: (id: string) => void;
  getDailyReportsForDate: (dateKey: string) => MeizitoDailyReport[];
  getMyDailyReportForDate: (dateKey: string) => MeizitoDailyReport | undefined;
  getTeamMembersWithoutReportForDate: (dateKey: string) => typeof MEIZITO_MOCK_USERS;
  addFieldVisit: (visit: Omit<MeizitoFieldVisit, 'id' | 'createdAt'>) => void;
  updateFieldVisit: (id: string, patch: Partial<Omit<MeizitoFieldVisit, 'id' | 'createdAt'>>) => void;
  deleteFieldVisit: (id: string) => void;
  getFieldVisitsForDate: (dateKey: string) => MeizitoFieldVisit[];
  fieldVisitsAll: MeizitoFieldVisit[];
  internalRequests: MeizitoInternalRequest[];
  addInternalRequest: (
    req: Omit<MeizitoInternalRequest, 'id' | 'createdAt' | 'status'> & { status?: MeizitoInternalRequest['status'] },
    options?: { submitForApproval?: boolean }
  ) => string;
  closeInternalRequest: (id: string) => void;
  reopenInternalRequest: (id: string) => void;
  submitForApproval: (entityType: MeizitoApprovableEntityType, id: string) => void;
  recordApprovalAction: (
    entityType: MeizitoApprovableEntityType,
    id: string,
    payload: Omit<RecordApprovalPayload, 'actorId' | 'actorName'>
  ) => void;
  getPendingApprovalCounts: (userId: string) => { letters: number; requests: number };
  getMockUserById: (id: string) => MeizitoMockUser | undefined;
  listTeamDirectory: (filter?: TeamDirectoryFilter, search?: string) => MeizitoMockUser[];
  updateChatMessage: (messageId: string, patch: Partial<Pick<MeizitoChatMessage, 'body' | 'editedAt'>>) => void;
  setEventRsvp: (eventId: string, userId: string, status: 'accepted' | 'declined' | 'pending') => void;
  getThreadMessages: (threadId: string) => MeizitoChatMessage[];
  addNoteBoard: (name: string) => void;
  updateNoteBoard: (id: string, patch: Partial<Pick<MeizitoNoteBoard, 'name' | 'color' | 'order'>>) => void;
  addNote: (
    title: string,
    content: string,
    color: string,
    boardId?: string,
    ncAttachments?: import('@/src/types/nextcloud').NcFileRef[]
  ) => void;
  updateNote: (id: string, patch: Partial<MeizitoNote>) => void;
  toggleNoteStar: (id: string) => void;
  archiveNote: (id: string, archived?: boolean) => void;
  getThreadMessagesForDate: (threadId: string, dateKey: string) => MeizitoChatMessage[];
  currentUserName: string;
  getCardsDueOn: (dateKey: string, boardId?: string) => MeizitoCard[];
  getOverdueCards: (todayKey: string, boardId?: string) => MeizitoCard[];
  getCardsAssignedToOthers: (boardId?: string) => MeizitoCard[];
  searchCards: (boardId: string, query: string, labelId?: string) => MeizitoCard[];
  calendars: MeizitoCalendar[];
  calendarEvents: MeizitoCalendarEvent[];
  activeCalendarId: string;
  setActiveCalendarId: (id: string) => void;
  addCalendar: (name: string, kind: MeizitoCalendarKind, color: string) => void;
  updateCalendar: (id: string, patch: Partial<MeizitoCalendar>) => void;
  addCalendarEvent: (event: Omit<MeizitoCalendarEvent, 'id'>) => string;
  updateCalendarEvent: (id: string, patch: Partial<MeizitoCalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;
  getCalendarEventsForDate: (calendarId: string, dateKey: string) => MeizitoCalendarEvent[];
  syncEventsFromCards: () => void;
}

const MeizitoContext = createContext<MeizitoContextValue | null>(null);

export function MeizitoProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthOptional();
  const business = useBusinessOptional();
  const activeBusinessId = business?.activeBusinessId ?? null;
  const sessionUserId = auth?.user?.id ?? null;
  const dataSources = MEIZITO_DATA_SOURCES;
  const useMockUserSwitcher = isMockUserSwitcherEnabled();

  const stored = useMemo(() => readStored(), []);
  const seed = useMemo(() => seedData(), []);
  const [boards, setBoards] = useState<MeizitoBoard[]>(() => stored.boards ?? seed.boards);
  const [columns, setColumns] = useState<MeizitoColumn[]>(() => stored.columns ?? seed.columns);
  const [cards, setCards] = useState<MeizitoCard[]>(() => stored.cards ?? seed.cards);
  const [projects, setProjects] = useState<MeizitoProject[]>(() =>
    (stored.projects ?? seed.projects).map(normalizeProject)
  );
  const [threads, setThreads] = useState<MeizitoChatThread[]>(() => stored.threads ?? seed.threads);
  const [messages, setMessages] = useState<MeizitoChatMessage[]>(() => stored.messages ?? seed.messages);
  const [letters, setLetters] = useState<MeizitoLetter[]>(() =>
    (stored.letters ?? seed.letters).map(normalizeLetter)
  );
  const [dailyReports, setDailyReports] = useState<MeizitoDailyReport[]>(() =>
    (stored.dailyReports ?? seed.dailyReports ?? []).map(normalizeDailyReport)
  );
  const [fieldVisits, setFieldVisits] = useState<MeizitoFieldVisit[]>(() =>
    (stored.fieldVisits ?? seed.fieldVisits ?? []).map(normalizeFieldVisit)
  );
  const [internalRequests, setInternalRequests] = useState<MeizitoInternalRequest[]>(() =>
    (stored.internalRequests ?? seed.internalRequests ?? []).map(normalizeInternalRequest)
  );
  const [currentUserId, setCurrentUserIdState] = useState(
    () => stored.currentUserId ?? seed.currentUserId ?? DEFAULT_USER_ID
  );
  const [noteBoards, setNoteBoards] = useState<MeizitoNoteBoard[]>(
    () => stored.noteBoards ?? seed.noteBoards ?? []
  );
  const [notes, setNotes] = useState<MeizitoNote[]>(() => {
    const boards = stored.noteBoards ?? seed.noteBoards ?? [];
    const defaultBoardId = boards[0]?.id ?? DEFAULT_NOTE_BOARD_ID;
    const raw = stored.notes ?? seed.notes ?? [];
    return raw.map((n) => normalizeNote(n, defaultBoardId));
  });
  const [activeNoteBoardId, setActiveNoteBoardIdState] = useState(
    () => stored.activeNoteBoardId ?? seed.activeNoteBoardId ?? DEFAULT_NOTE_BOARD_ID
  );
  const [calendars, setCalendars] = useState<MeizitoCalendar[]>(() =>
    (stored.calendars ?? seed.calendars ?? defaultCalendarsSeed()).map(normalizeCalendar)
  );
  const [calendarEvents, setCalendarEvents] = useState<MeizitoCalendarEvent[]>(() =>
    (stored.calendarEvents ?? seed.calendarEvents ?? []).map(normalizeCalendarEvent)
  );
  const [activeCalendarId, setActiveCalendarIdState] = useState(
    () => stored.activeCalendarId ?? seed.activeCalendarId ?? 'cal-customer'
  );
  const [activeBoardId, setActiveBoardIdState] = useState(() => stored.activeBoardId ?? seed.activeBoardId);
  const [activeThreadId, setActiveThreadIdState] = useState(() => stored.activeThreadId ?? seed.activeThreadId);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload: Stored = {
      boards,
      columns,
      cards,
      projects,
      threads,
      messages,
      letters,
      dailyReports,
      fieldVisits,
      internalRequests,
      currentUserId,
      notes,
      noteBoards,
      activeNoteBoardId,
      calendars,
      calendarEvents,
      activeCalendarId,
      activeBoardId,
      activeThreadId,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    boards,
    columns,
    cards,
    projects,
    threads,
    messages,
    letters,
    dailyReports,
    fieldVisits,
    internalRequests,
    currentUserId,
    notes,
    noteBoards,
    activeNoteBoardId,
    calendars,
    calendarEvents,
    activeCalendarId,
    activeBoardId,
    activeThreadId,
  ]);

  const setActiveBoardId = useCallback((id: string) => setActiveBoardIdState(id), []);
  const setActiveThreadId = useCallback((id: string) => setActiveThreadIdState(id), []);
  const setActiveNoteBoardId = useCallback((id: string) => setActiveNoteBoardIdState(id), []);
  const setActiveCalendarId = useCallback((id: string) => setActiveCalendarIdState(id), []);

  const updateBoard = useCallback((id: string, patch: Partial<Pick<MeizitoBoard, 'name' | 'memberNames'>>) => {
    setBoards((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }, []);

  const addBoard = useCallback((name: string) => {
    const id = newId();
    const c1 = newId();
    const c2 = newId();
    const c3 = newId();
    const nb: MeizitoBoard = {
      id,
      name: name.trim() || 'میز جدید',
      memberNames: [],
      columnIds: [c1, c2, c3],
      labelPalette: [
        { id: newId(), name: 'برچسب', color: '#94a3b8' },
      ],
    };
    setBoards((prev) => [...prev, nb]);
    setColumns((prev) => [
      ...prev,
      { id: c1, boardId: id, title: 'برای انجام', order: 0, cardIds: [] },
      { id: c2, boardId: id, title: 'در حال انجام', order: 1, cardIds: [] },
      { id: c3, boardId: id, title: 'انجام شده', order: 2, cardIds: [] },
    ]);
    setActiveBoardIdState(id);
  }, []);

  const addColumn = useCallback((boardId: string, title: string) => {
    const id = newId();
    const board = boards.find((b) => b.id === boardId);
    const order = board ? board.columnIds.length : 0;
    setColumns((prev) => [...prev, { id, boardId, title: title.trim() || 'ستون', order, cardIds: [] }]);
    setBoards((prev) =>
      prev.map((b) => (b.id === boardId ? { ...b, columnIds: [...b.columnIds, id] } : b))
    );
  }, [boards]);

  const addCard = useCallback(
    (boardId: string, columnId: string, title: string) => {
      const id = newId();
      const card: MeizitoCard = {
        id,
        boardId,
        columnId,
        title: title.trim() || 'وظیفه بدون عنوان',
        description: '',
        labelIds: [],
        category: '',
        assignee: '',
        checklist: [],
        attachments: [],
        dueDate: '',
        dueTime: '',
        recurrence: 'none',
        starred: false,
      };
      setCards((prev) => [...prev, card]);
      setColumns((prev) =>
        prev.map((c) => (c.id === columnId ? { ...c, cardIds: [...c.cardIds, id] } : c))
      );
    },
    []
  );

  const moveCard = useCallback((cardId: string, toColumnId: string, index: number) => {
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, columnId: toColumnId } : c)));
    setColumns((prev) => {
      const stripped = prev.map((col) => ({
        ...col,
        cardIds: col.cardIds.filter((id) => id !== cardId),
      }));
      return stripped.map((col) => {
        if (col.id !== toColumnId) return col;
        const ids = [...col.cardIds];
        const i = Math.max(0, Math.min(index, ids.length));
        ids.splice(i, 0, cardId);
        return { ...col, cardIds: ids };
      });
    });
  }, []);

  const updateCard = useCallback((id: string, patch: Partial<MeizitoCard>) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const copyCardForAssignees = useCallback(
    (cardId: string, assignees: string[]) => {
      const src = cards.find((c) => c.id === cardId);
      if (!src || assignees.length === 0) return;
      const col =
        columns.find((c) => c.boardId === src.boardId && c.order === 0) ||
        columns.find((c) => c.id === src.columnId);
      if (!col) return;
      const copies: MeizitoCard[] = assignees.map((assignee) => ({
        ...src,
        id: newId(),
        columnId: col.id,
        assignee: assignee.trim(),
        checklist: src.checklist.map((x) => ({ ...x, id: newId() })),
        attachments: src.attachments.map((a) => ({ ...a, id: newId() })),
      }));
      setCards((prev) => [...prev, ...copies]);
      setColumns((prev) =>
        prev.map((c) =>
          c.id === col.id ? { ...c, cardIds: [...copies.map((x) => x.id), ...c.cardIds] } : c
        )
      );
    },
    [cards, columns]
  );

  const toggleCardStar = useCallback((id: string) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, starred: !c.starred } : c)));
  }, []);

  const addProject = useCallback((name: string, memberIds: string[], boardId?: string) => {
    const id = newId();
    setProjects((prev) => [
      ...prev,
      {
        id,
        name: name.trim() || 'پروژه',
        memberIds,
        boardId: boardId || undefined,
        ncFolderPath: `/Nexa/projects/${id}/`,
      },
    ]);
  }, []);

  const updateProject = useCallback((id: string, patch: Partial<MeizitoProject>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const addMessage = useCallback(
    (
      threadId: string,
      author: string,
      body: string,
      options?: {
        type?: MeizitoMessageType;
        attachmentNames?: string[];
        attachmentRefs?: import('@/src/types/nextcloud').NcFileRef[];
        voiceDurationSec?: number;
        imageDataUrl?: string;
      }
    ) => {
      const id = newId();
      const msg: MeizitoChatMessage = normalizeMessage({
        id,
        threadId,
        author,
        body,
        createdAt: new Date().toISOString(),
        type: options?.type ?? 'text',
        attachmentNames: options?.attachmentNames ?? [],
        attachmentRefs: options?.attachmentRefs ?? [],
        voiceDurationSec: options?.voiceDurationSec,
        imageDataUrl: options?.imageDataUrl,
      });
      setMessages((prev) => [...prev, msg]);
      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, messageIds: [...t.messageIds, id] } : t))
      );
    },
    []
  );

  const addThread = useCallback(
    (title: string, threadType: MeizitoThreadType, participantNames: string[] = []) => {
      const id = newId();
      const thread: MeizitoChatThread = {
        id,
        title: title.trim() || 'گفتگوی جدید',
        threadType,
        participantNames,
        starred: false,
        pinned: false,
        messageIds: [],
      };
      setThreads((prev) => [...prev, thread]);
      setActiveThreadIdState(id);
      return id;
    },
    []
  );

  const createCardFromText = useCallback(
    (boardId: string, columnId: string, title: string, assignee: string, dueDate: string, recurrence: MeizitoRecurrence) => {
      const id = newId();
      const card: MeizitoCard = {
        id,
        boardId,
        columnId,
        title: title.trim(),
        description: '',
        labelIds: [],
        category: '',
        assignee,
        checklist: [],
        attachments: [],
        dueDate,
        dueTime: '',
        recurrence,
        starred: false,
      };
      setCards((prev) => [...prev, card]);
      setColumns((prev) =>
        prev.map((c) => (c.id === columnId ? { ...c, cardIds: [...c.cardIds, id] } : c))
      );
    },
    []
  );

  const toggleThreadStar = useCallback((id: string) => {
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, starred: !t.starred } : t)));
  }, []);

  const toggleThreadPin = useCallback((id: string) => {
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t)));
  }, []);

  const addLetter = useCallback((letter: Omit<MeizitoLetter, 'id' | 'threadId'> & { threadId?: string }) => {
    const id = newId();
    const full: MeizitoLetter = normalizeLetter({
      ...letter,
      id,
      threadId: letter.threadId || id,
      createdAt: letter.createdAt || new Date().toISOString(),
      approvalState: letter.approvalState ?? 'draft',
    });
    setLetters((prev) => [...prev, full]);
    return id;
  }, []);

  const getLetterThread = useCallback(
    (threadId: string) =>
      letters
        .filter((l) => l.threadId === threadId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [letters]
  );

  const replyToLetter = useCallback(
    (
      sourceId: string,
      letter: Omit<MeizitoLetter, 'id' | 'replyToLetterId' | 'threadId'>
    ) => {
      const source = letters.find((l) => l.id === sourceId);
      if (!source) return;
      const id = newId();
      const threadId = source.threadId || source.id;
      const full: MeizitoLetter = normalizeLetter({
        ...letter,
        id,
        replyToLetterId: sourceId,
        threadId,
        createdAt: letter.createdAt || new Date().toISOString(),
      });
      setLetters((prev) => [...prev, full]);
    },
    [letters]
  );

  const updateLetterBox = useCallback((id: string, box: MeizitoLetter['box']) => {
    setLetters((prev) => prev.map((l) => (l.id === id ? { ...l, box } : l)));
  }, []);

  const closeLetter = useCallback((id: string) => {
    setLetters((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: 'closed' as const, box: 'archive' } : l))
    );
  }, []);

  const reopenLetter = useCallback((id: string) => {
    setLetters((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, status: 'open' as const, box: l.box === 'archive' ? 'inbox' : l.box } : l
      )
    );
  }, []);

  const setLetterCategory = useCallback((id: string, category: MeizitoLetterCategory) => {
    setLetters((prev) => prev.map((l) => (l.id === id ? { ...l, category } : l)));
  }, []);

  const setCurrentUserId = useCallback((id: string) => {
    if (!MEIZITO_MOCK_USERS.some((u) => u.id === id)) return;
    setCurrentUserIdState(id);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(MEIZITO_CURRENT_USER_ID_KEY, id);
    }
  }, []);

  const currentUser = useMemo(
    () => MEIZITO_MOCK_USERS.find((u) => u.id === currentUserId) ?? MEIZITO_MOCK_USERS[0],
    [currentUserId]
  );

  const isCurrentUserManager = isManagerRole(currentUser?.role ?? 'member');

  const canReviewDailyReportCb = useCallback(
    (report: MeizitoDailyReport) => canReviewDailyReport(report, currentUserId, MEIZITO_MOCK_USERS),
    [currentUserId]
  );

  const addDailyReport = useCallback(
    (report: Omit<MeizitoDailyReport, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const id = newId();
      setDailyReports((prev) => [
        ...prev,
        { ...report, id, createdAt: now, updatedAt: now },
      ]);
      return id;
    },
    []
  );

  const updateDailyReport = useCallback(
    (id: string, patch: Partial<Pick<MeizitoDailyReport, 'title' | 'body' | 'status'>>) => {
      const now = new Date().toISOString();
      setDailyReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: now } : r))
      );
    },
    []
  );

  const submitDailyReport = useCallback((id: string) => {
    updateDailyReport(id, { status: 'submitted' });
  }, [updateDailyReport]);

  const addFeedbackToReport = useCallback(
    (id: string, feedback: string) => {
      const now = new Date().toISOString();
      setDailyReports((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          if (!canReviewDailyReport(r, currentUserId, MEIZITO_MOCK_USERS)) return r;
          const roleLabel = getReviewerRoleLabel(r.authorId, currentUserId, MEIZITO_MOCK_USERS);
          const actor = MEIZITO_MOCK_USERS.find((u) => u.id === currentUserId);
          const entry = {
            id: newFeedbackId(),
            authorId: currentUserId,
            authorName: actor?.name ?? MEIZITO_CURRENT_USER_NAME,
            roleLabel,
            text: feedback.trim(),
            kind: 'feedback' as const,
            at: now,
          };
          return normalizeDailyReport({
            ...r,
            feedbackEntries: [...(r.feedbackEntries ?? []), entry],
            updatedAt: now,
          });
        })
      );
    },
    [currentUserId]
  );

  const approveDailyReport = useCallback(
    (id: string) => {
      const now = new Date().toISOString();
      setDailyReports((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          if (!canReviewDailyReport(r, currentUserId, MEIZITO_MOCK_USERS)) return r;
          const roleLabel = getReviewerRoleLabel(r.authorId, currentUserId, MEIZITO_MOCK_USERS);
          const actor = MEIZITO_MOCK_USERS.find((u) => u.id === currentUserId);
          const entry = {
            id: newFeedbackId(),
            authorId: currentUserId,
            authorName: actor?.name ?? MEIZITO_CURRENT_USER_NAME,
            roleLabel,
            text: 'گزارش تایید شد.',
            kind: 'approve' as const,
            at: now,
          };
          return normalizeDailyReport({
            ...r,
            managerApproved: true,
            managerApprovedAt: now,
            feedbackEntries: [...(r.feedbackEntries ?? []), entry],
            updatedAt: now,
          });
        })
      );
    },
    [currentUserId]
  );

  const getDailyReportsForDate = useCallback(
    (dateKey: string) =>
      dailyReports
        .filter((r) => r.date === dateKey)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [dailyReports]
  );

  const getMyDailyReportForDate = useCallback(
    (dateKey: string) =>
      dailyReports.find((r) => r.authorId === currentUserId && r.date === dateKey),
    [dailyReports, currentUserId]
  );

  const getTeamMembersWithoutReportForDate = useCallback(
    (dateKey: string) => {
      const submittedIds = new Set(
        dailyReports
          .filter((r) => r.date === dateKey && r.status === 'submitted')
          .map((r) => r.authorId)
      );
      return MEIZITO_MOCK_USERS.filter((u) => u.role === 'member' && !submittedIds.has(u.id));
    },
    [dailyReports]
  );

  const addFieldVisit = useCallback((visit: Omit<MeizitoFieldVisit, 'id' | 'createdAt'>) => {
    const row = normalizeFieldVisit({
      ...visit,
      id: newId(),
      createdAt: new Date().toISOString(),
    } as MeizitoFieldVisit);
    setFieldVisits((prev) => [...prev, row]);
  }, []);

  const addInternalRequest = useCallback(
    (
      req: Omit<MeizitoInternalRequest, 'id' | 'createdAt' | 'status'> & {
        status?: MeizitoInternalRequest['status'];
      },
      options?: { submitForApproval?: boolean }
    ) => {
      const now = new Date().toISOString();
      const id = newId();
      const authorName =
        MEIZITO_MOCK_USERS.find((u) => u.id === req.authorId)?.name ?? req.authorName;
      let item = normalizeInternalRequest({
        ...req,
        id,
        status: req.status ?? 'open',
        createdAt: now,
        threadId: req.threadId ?? id,
      });
      if (options?.submitForApproval !== false) {
        const assigneeId =
          primaryAssigneeFromReferrals(req.referredToUserIds) ??
          req.referredToUserId ??
          req.currentAssigneeId;
        const approval = applySubmitForApproval(item, req.authorId, authorName, assigneeId);
        item = { ...item, ...approval };
      }
      setInternalRequests((prev) => [...prev, item]);
      return id;
    },
    []
  );

  const closeInternalRequest = useCallback((id: string) => {
    const now = new Date().toISOString();
    setInternalRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'closed', closedAt: now } : r))
    );
  }, []);

  const reopenInternalRequest = useCallback((id: string) => {
    setInternalRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'open', closedAt: undefined } : r))
    );
  }, []);

  const submitForApproval = useCallback(
    (entityType: MeizitoApprovableEntityType, id: string) => {
      const actor = MEIZITO_MOCK_USERS.find((u) => u.id === currentUserId);
      const actorName = actor?.name ?? MEIZITO_CURRENT_USER_NAME;
      if (entityType === 'letter') {
        setLetters((prev) =>
          prev.map((l) => {
            if (l.id !== id) return l;
            const next = applySubmitForApproval(l, currentUserId, actorName);
            return normalizeLetter({ ...l, ...next });
          })
        );
      } else {
        setInternalRequests((prev) =>
          prev.map((r) => {
            if (r.id !== id) return r;
            const next = applySubmitForApproval(
              r,
              currentUserId,
              actorName,
              primaryAssigneeFromReferrals(r.referredToUserIds) ?? r.referredToUserId
            );
            return normalizeInternalRequest({ ...r, ...next });
          })
        );
      }
    },
    [currentUserId]
  );

  const recordApprovalAction = useCallback(
    (
      entityType: MeizitoApprovableEntityType,
      id: string,
      payload: Omit<RecordApprovalPayload, 'actorId' | 'actorName'>
    ) => {
      const actor = MEIZITO_MOCK_USERS.find((u) => u.id === currentUserId);
      const forward = resolveForwardTargets({
        ...payload,
        actorId: currentUserId,
        actorName: actor?.name ?? MEIZITO_CURRENT_USER_NAME,
        forwardToUserNames:
          payload.forwardToUserNames ??
          payload.forwardToUserIds?.map(
            (id) => MEIZITO_MOCK_USERS.find((u) => u.id === id)?.name ?? id
          ),
      });
      const full: RecordApprovalPayload = {
        ...payload,
        actorId: currentUserId,
        actorName: actor?.name ?? MEIZITO_CURRENT_USER_NAME,
        forwardToUserId: forward.primaryId ?? payload.forwardToUserId,
        forwardToUserName: forward.names.join('، ') || payload.forwardToUserName,
        forwardToUserIds: forward.ids.length > 0 ? forward.ids : payload.forwardToUserIds,
        forwardToUserNames: forward.names.length > 0 ? forward.names : payload.forwardToUserNames,
      };
      const applyFields = (item: {
        approvalState?: import('@/src/types/meizito').MeizitoApprovalState;
        approvalSteps?: import('@/src/types/meizito').MeizitoApprovalStep[];
        currentAssigneeId?: string;
        submittedAt?: string;
      }) => applyApprovalAction(item, full);
      if (entityType === 'letter') {
        setLetters((prev) =>
          prev.map((l) => (l.id === id ? normalizeLetter({ ...l, ...applyFields(l) }) : l))
        );
      } else {
        setInternalRequests((prev) =>
          prev.map((r) => {
            if (r.id !== id) return r;
            const merged = { ...r, ...applyFields(r) };
            if (payload.action === 'forward' && forward.ids.length > 1) {
              const extraCc = forward.ids.slice(1);
              merged.ccUserIds = [...new Set([...(r.ccUserIds ?? []), ...extraCc])];
            }
            return normalizeInternalRequest(merged);
          })
        );
      }
    },
    [currentUserId]
  );

  const getPendingApprovalCounts = useCallback(
    (userId: string) => ({
      letters: letters.filter((l) => l.approvalState === 'pending' && l.currentAssigneeId === userId)
        .length,
      requests: internalRequests.filter(
        (r) => r.approvalState === 'pending' && r.currentAssigneeId === userId
      ).length,
    }),
    [letters, internalRequests]
  );

  const getMockUserById = useCallback(
    (id: string) => MEIZITO_MOCK_USERS.find((u) => u.id === id),
    []
  );

  const listTeamDirectoryCb = useCallback(
    (filter: TeamDirectoryFilter = 'all', search = '') =>
      listTeamDirectory(MEIZITO_MOCK_USERS, filter, search),
    []
  );

  const updateChatMessage = useCallback(
    (messageId: string, patch: Partial<Pick<MeizitoChatMessage, 'body' | 'editedAt'>>) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, ...patch } : m))
      );
    },
    []
  );

  const setEventRsvp = useCallback(
    (eventId: string, userId: string, status: 'accepted' | 'declined' | 'pending') => {
      setCalendarEvents((prev) =>
        prev.map((e) => {
          if (e.id !== eventId) return e;
          return normalizeCalendarEvent({
            ...e,
            rsvp: { ...(e.rsvp ?? {}), [userId]: status },
          });
        })
      );
    },
    []
  );

  const updateFieldVisit = useCallback(
    (id: string, patch: Partial<Omit<MeizitoFieldVisit, 'id' | 'createdAt'>>) => {
      setFieldVisits((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
    },
    []
  );

  const deleteFieldVisit = useCallback((id: string) => {
    setFieldVisits((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const getFieldVisitsForDate = useCallback(
    (dateKey: string) =>
      fieldVisits
        .filter((v) => v.date === dateKey)
        .sort((a, b) => (b.time ?? '').localeCompare(a.time ?? '')),
    [fieldVisits]
  );

  const getThreadMessages = useCallback(
    (threadId: string) => {
      const thread = threads.find((t) => t.id === threadId);
      if (!thread) return [];
      return thread.messageIds
        .map((mid) => messages.find((m) => m.id === mid))
        .filter((m): m is MeizitoChatMessage => !!m)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    [threads, messages]
  );

  const addNoteBoard = useCallback((name: string) => {
    const id = newId();
    const boardColors = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff'];
    setNoteBoards((prev) => {
      const board: MeizitoNoteBoard = {
        id,
        name: name.trim() || 'بورد جدید',
        color: boardColors[prev.length % boardColors.length],
        order: prev.length,
      };
      return [...prev, board];
    });
    setActiveNoteBoardIdState(id);
  }, []);

  const updateNoteBoard = useCallback(
    (id: string, patch: Partial<Pick<MeizitoNoteBoard, 'name' | 'color' | 'order'>>) => {
      setNoteBoards((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    },
    []
  );

  const addNote = useCallback(
    (
      title: string,
      content: string,
      color: string,
      boardId?: string,
      ncAttachments?: import('@/src/types/nextcloud').NcFileRef[]
    ) => {
      const bid = boardId ?? activeNoteBoardId;
      setNotes((prev) => [
        ...prev,
        {
          id: newId(),
          boardId: bid,
          title,
          content,
          color,
          checklist: [],
          ncAttachments: ncAttachments ?? [],
          archived: false,
          deletedAt: null,
          starred: false,
        },
      ]);
    },
    [activeNoteBoardId]
  );

  const updateNote = useCallback((id: string, patch: Partial<MeizitoNote>) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }, []);

  const toggleNoteStar = useCallback((id: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, starred: !n.starred } : n)));
  }, []);

  const archiveNote = useCallback((id: string, archived = true) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, archived } : n)));
  }, []);

  const getThreadMessagesForDate = useCallback(
    (threadId: string, dateKey: string) => {
      return messages.filter((m) => {
        if (m.threadId !== threadId) return false;
        const d = m.createdAt.slice(0, 10);
        return d === dateKey;
      });
    },
    [messages]
  );

  const doneColumnIdsForBoard = useCallback(
    (boardId: string) =>
      columns
        .filter((c) => c.boardId === boardId && /انجام\s*شده/.test(c.title))
        .map((c) => c.id),
    [columns]
  );

  const getCardsDueOn = useCallback(
    (dateKey: string, boardId?: string) => {
      const bid = boardId ?? activeBoardId;
      return cards.filter((c) => c.boardId === bid && c.dueDate === dateKey);
    },
    [cards, activeBoardId]
  );

  const getOverdueCards = useCallback(
    (todayKey: string, boardId?: string) => {
      const bid = boardId ?? activeBoardId;
      const doneIds = doneColumnIdsForBoard(bid);
      return cards.filter(
        (c) =>
          c.boardId === bid &&
          c.dueDate &&
          c.dueDate < todayKey &&
          !doneIds.includes(c.columnId)
      );
    },
    [cards, activeBoardId, doneColumnIdsForBoard]
  );

  const getCardsAssignedToOthers = useCallback(
    (boardId?: string) => {
      const bid = boardId ?? activeBoardId;
      const me = currentUser?.name ?? MEIZITO_CURRENT_USER_NAME;
      return cards.filter(
        (c) => c.boardId === bid && c.assignee.trim() !== '' && c.assignee !== me
      );
    },
    [cards, activeBoardId, currentUser]
  );

  const searchCards = useCallback(
    (boardId: string, query: string, labelId?: string) => {
      const q = query.trim().toLowerCase();
      return cards.filter((c) => {
        if (c.boardId !== boardId) return false;
        if (labelId && !c.labelIds.includes(labelId)) return false;
        if (!q) return true;
        return (
          c.title.toLowerCase().includes(q) ||
          c.assignee.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
        );
      });
    },
    [cards]
  );

  const getCalendarEventsForDate = useCallback(
    (calendarId: string, dateKey: string) => {
      const manual = calendarEvents.filter(
        (e) => e.calendarId === calendarId && e.date === dateKey
      );
      if (calendarId !== MEIZITO_TASKS_CALENDAR_ID) return manual;
      const syncedIds = new Set(
        manual.filter((e) => e.sourceCardId).map((e) => e.sourceCardId)
      );
      const fromCards = cards
        .filter((c) => c.dueDate === dateKey && !syncedIds.has(c.id))
        .map(
          (c): MeizitoCalendarEvent => ({
            id: `derived-card-${c.id}`,
            calendarId,
            title: c.title,
            date: c.dueDate,
            time: c.dueTime || undefined,
            sourceCardId: c.id,
          })
        );
      return [...manual, ...fromCards];
    },
    [calendarEvents, cards]
  );

  const syncEventsFromCards = useCallback(() => {
    setCalendarEvents((prev) => {
      const rest = prev.filter(
        (e) => e.calendarId !== MEIZITO_TASKS_CALENDAR_ID || !e.sourceCardId
      );
      const synced = cards
        .filter((c) => c.dueDate)
        .map(
          (c): MeizitoCalendarEvent => ({
            id: `sync-${c.id}`,
            calendarId: MEIZITO_TASKS_CALENDAR_ID,
            title: c.title,
            date: c.dueDate,
            time: c.dueTime || undefined,
            sourceCardId: c.id,
          })
        );
      return [...rest, ...synced];
    });
  }, [cards]);

  const addCalendar = useCallback((name: string, kind: MeizitoCalendarKind, color: string) => {
    const id = newId();
    setCalendars((prev) => [
      ...prev,
      {
        id,
        name: name.trim() || 'تقویم جدید',
        color,
        kind,
        sharedWith: [],
        ownerName: MEIZITO_CURRENT_USER_NAME,
      },
    ]);
    setActiveCalendarIdState(id);
  }, []);

  const updateCalendar = useCallback((id: string, patch: Partial<MeizitoCalendar>) => {
    setCalendars((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const addCalendarEvent = useCallback((event: Omit<MeizitoCalendarEvent, 'id'>) => {
    const id = newId();
    setCalendarEvents((prev) => [...prev, { ...event, id }]);
    return id;
  }, []);

  const updateCalendarEvent = useCallback((id: string, patch: Partial<MeizitoCalendarEvent>) => {
    setCalendarEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  const deleteCalendarEvent = useCallback((id: string) => {
    setCalendarEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const value = useMemo<MeizitoContextValue>(
    () => ({
      boards,
      columns,
      cards,
      projects,
      threads,
      messages,
      letters,
      notes,
      noteBoards,
      activeNoteBoardId,
      setActiveNoteBoardId,
      activeBoardId,
      activeThreadId,
      setActiveBoardId,
      setActiveThreadId,
      updateBoard,
      addBoard,
      addColumn,
      addCard,
      moveCard,
      updateCard,
      copyCardForAssignees,
      toggleCardStar,
      addProject,
      updateProject,
      addMessage,
      addThread,
      createCardFromText,
      toggleThreadStar,
      toggleThreadPin,
      addLetter,
      replyToLetter,
      getLetterThread,
      updateLetterBox,
      closeLetter,
      reopenLetter,
      setLetterCategory,
      dailyReports,
      fieldVisits,
      currentUserId,
      setCurrentUserId,
      sessionUserId,
      activeBusinessId,
      dataSources,
      useMockUserSwitcher,
      isCurrentUserManager,
      canReviewDailyReport: canReviewDailyReportCb,
      mockUsers: MEIZITO_MOCK_USERS,
      addDailyReport,
      updateDailyReport,
      submitDailyReport,
      addFeedbackToReport,
      approveDailyReport,
      getDailyReportsForDate,
      getMyDailyReportForDate,
      getTeamMembersWithoutReportForDate,
      addFieldVisit,
      updateFieldVisit,
      deleteFieldVisit,
      getFieldVisitsForDate,
      fieldVisitsAll: fieldVisits,
      internalRequests,
      addInternalRequest,
      closeInternalRequest,
      reopenInternalRequest,
      submitForApproval,
      recordApprovalAction,
      getPendingApprovalCounts,
      getMockUserById,
      listTeamDirectory: listTeamDirectoryCb,
      updateChatMessage,
      setEventRsvp,
      getThreadMessages,
      addNoteBoard,
      updateNoteBoard,
      addNote,
      updateNote,
      toggleNoteStar,
      archiveNote,
      getThreadMessagesForDate,
      currentUserName: currentUser?.name ?? MEIZITO_CURRENT_USER_NAME,
      getCardsDueOn,
      getOverdueCards,
      getCardsAssignedToOthers,
      searchCards,
      calendars,
      calendarEvents,
      activeCalendarId,
      setActiveCalendarId,
      addCalendar,
      updateCalendar,
      addCalendarEvent,
      updateCalendarEvent,
      deleteCalendarEvent,
      getCalendarEventsForDate,
      syncEventsFromCards,
    }),
    [
      boards,
      columns,
      cards,
      projects,
      threads,
      messages,
      letters,
      notes,
      noteBoards,
      activeNoteBoardId,
      setActiveNoteBoardId,
      activeBoardId,
      activeThreadId,
      setActiveBoardId,
      setActiveThreadId,
      updateBoard,
      addBoard,
      addColumn,
      addCard,
      moveCard,
      updateCard,
      copyCardForAssignees,
      toggleCardStar,
      addProject,
      updateProject,
      addMessage,
      addThread,
      createCardFromText,
      toggleThreadStar,
      toggleThreadPin,
      addLetter,
      replyToLetter,
      getLetterThread,
      updateLetterBox,
      closeLetter,
      reopenLetter,
      setLetterCategory,
      dailyReports,
      fieldVisits,
      currentUserId,
      setCurrentUserId,
      sessionUserId,
      activeBusinessId,
      dataSources,
      useMockUserSwitcher,
      isCurrentUserManager,
      canReviewDailyReportCb,
      addDailyReport,
      updateDailyReport,
      submitDailyReport,
      addFeedbackToReport,
      approveDailyReport,
      getDailyReportsForDate,
      getMyDailyReportForDate,
      getTeamMembersWithoutReportForDate,
      addFieldVisit,
      updateFieldVisit,
      deleteFieldVisit,
      getFieldVisitsForDate,
      internalRequests,
      addInternalRequest,
      closeInternalRequest,
      reopenInternalRequest,
      submitForApproval,
      recordApprovalAction,
      getPendingApprovalCounts,
      getMockUserById,
      listTeamDirectoryCb,
      updateChatMessage,
      setEventRsvp,
      getThreadMessages,
      currentUser,
      addNoteBoard,
      updateNoteBoard,
      addNote,
      updateNote,
      toggleNoteStar,
      archiveNote,
      getThreadMessagesForDate,
      getCardsDueOn,
      getOverdueCards,
      getCardsAssignedToOthers,
      searchCards,
      calendars,
      calendarEvents,
      activeCalendarId,
      setActiveCalendarId,
      addCalendar,
      updateCalendar,
      addCalendarEvent,
      updateCalendarEvent,
      deleteCalendarEvent,
      getCalendarEventsForDate,
      syncEventsFromCards,
    ]
  );

  return <MeizitoContext.Provider value={value}>{children}</MeizitoContext.Provider>;
}

export function useMeizito() {
  const ctx = useContext(MeizitoContext);
  if (!ctx) throw new Error('useMeizito must be used within MeizitoProvider');
  return ctx;
}
