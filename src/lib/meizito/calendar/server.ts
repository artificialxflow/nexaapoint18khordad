import type { Prisma } from '@prisma/client';
import { prisma } from '@/src/lib/db/prisma';
import { logMeizitoAction } from '@/src/lib/meizito/audit';
import { meizitoModuleLog } from '@/src/lib/meizito/logger';
import type { MeizitoCalendar, MeizitoCalendarEvent, MeizitoCalendarKind } from '@/src/types/meizito';
import { MEIZITO_TASKS_CALENDAR_ID } from '@/src/types/meizito';
import {
  clientCalendarId,
  serializeCalendarEventRow,
  serializeCalendarRow,
  type CalendarSnapshot,
} from '@/src/lib/meizito/calendar/serialize';

const log = meizitoModuleLog('calendar');

const DEFAULT_CALENDARS: Array<{
  slug: string;
  name: string;
  color: string;
  kind: MeizitoCalendarKind;
  sortOrder: number;
  sharedWith?: string[];
}> = [
  {
    slug: MEIZITO_TASKS_CALENDAR_ID,
    name: 'وظایف میز کار',
    color: '#6366f1',
    kind: 'general',
    sortOrder: 0,
  },
  {
    slug: 'cal-customer',
    name: 'پیگیری مشتری',
    color: '#f59e0b',
    kind: 'customer_followup',
    sortOrder: 1,
    sharedWith: [],
  },
  {
    slug: 'cal-service',
    name: 'خدمت‌رسانی',
    color: '#10b981',
    kind: 'service',
    sortOrder: 2,
    sharedWith: [],
  },
];

export async function ensureDefaultCalendars(
  businessId: string,
  ownerUserId: string,
  ownerName: string
) {
  const count = await prisma.meizitoCalendar.count({ where: { businessId } });
  if (count > 0) return;
  await prisma.meizitoCalendar.createMany({
    data: DEFAULT_CALENDARS.map((c) => ({
      businessId,
      slug: c.slug,
      name: c.name,
      color: c.color,
      kind: c.kind,
      sortOrder: c.sortOrder,
      sharedWith: c.sharedWith ?? [],
      ownerUserId,
      ownerName,
    })),
  });
}

async function loadCalendarRows(businessId: string) {
  return prisma.meizitoCalendar.findMany({
    where: { businessId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
}

function buildSlugMap(rows: Awaited<ReturnType<typeof loadCalendarRows>>) {
  return new Map(rows.map((r) => [r.id, r.slug]));
}

export async function resolveCalendarInternalId(
  businessId: string,
  clientCalendarId: string
): Promise<string | null> {
  const row = await prisma.meizitoCalendar.findFirst({
    where: {
      businessId,
      OR: [{ slug: clientCalendarId }, { id: clientCalendarId }],
    },
  });
  return row?.id ?? null;
}

async function getCalendarOrThrow(businessId: string, clientCalendarId: string) {
  const row = await prisma.meizitoCalendar.findFirst({
    where: {
      businessId,
      OR: [{ slug: clientCalendarId }, { id: clientCalendarId }],
    },
  });
  if (!row) throw new Error('NOT_FOUND');
  return row;
}

async function getEventOrThrow(businessId: string, eventId: string) {
  const row = await prisma.meizitoCalendarEvent.findFirst({
    where: { id: eventId, businessId },
  });
  if (!row) throw new Error('NOT_FOUND');
  return row;
}

export async function loadCalendarSnapshot(
  businessId: string,
  ownerUserId: string,
  ownerName: string
): Promise<CalendarSnapshot> {
  await ensureDefaultCalendars(businessId, ownerUserId, ownerName);
  const calendarRows = await loadCalendarRows(businessId);
  const slugMap = buildSlugMap(calendarRows);
  const eventRows = await prisma.meizitoCalendarEvent.findMany({
    where: { businessId },
    orderBy: [{ dateKey: 'asc' }, { time: 'asc' }, { createdAt: 'asc' }],
  });
  return {
    calendars: calendarRows.map(serializeCalendarRow),
    events: eventRows.map((row) => serializeCalendarEventRow(row, slugMap)),
  };
}

export async function createCalendar(
  businessId: string,
  name: string,
  kind: MeizitoCalendarKind,
  color: string,
  ownerUserId: string,
  ownerName: string
) {
  const row = await prisma.meizitoCalendar.create({
    data: {
      businessId,
      name: name.trim() || 'تقویم جدید',
      kind,
      color,
      ownerUserId,
      ownerName,
    },
  });
  log.info('calendar.create', { businessId, calendarId: row.id, ownerUserId });
  await logMeizitoAction({
    actorId: ownerUserId,
    action: 'calendar.create',
    businessId,
    targetType: 'meizito_calendar',
    targetId: row.id,
  });
  return serializeCalendarRow(row);
}

export async function updateCalendar(
  businessId: string,
  clientCalendarId: string,
  patch: Partial<Pick<MeizitoCalendar, 'name' | 'color' | 'kind' | 'sharedWith' | 'visible'>>,
  actorId: string
) {
  const existing = await getCalendarOrThrow(businessId, clientCalendarId);
  const row = await prisma.meizitoCalendar.update({
    where: { id: existing.id },
    data: {
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.color !== undefined ? { color: patch.color } : {}),
      ...(patch.kind !== undefined ? { kind: patch.kind } : {}),
      ...(patch.sharedWith !== undefined ? { sharedWith: patch.sharedWith } : {}),
      ...(patch.visible !== undefined ? { visible: patch.visible } : {}),
    },
  });
  log.info('calendar.update', { businessId, calendarId: row.id, actorId });
  return serializeCalendarRow(row);
}

export type CreateCalendarEventInput = Omit<MeizitoCalendarEvent, 'id'>;

export async function createCalendarEvent(
  businessId: string,
  input: CreateCalendarEventInput,
  actorId: string
) {
  const calendar = await getCalendarOrThrow(businessId, input.calendarId);
  const row = await prisma.meizitoCalendarEvent.create({
    data: {
      businessId,
      calendarId: calendar.id,
      title: input.title.trim() || 'رویداد',
      dateKey: input.date,
      time: input.time ?? null,
      sourceCardId: input.sourceCardId ?? null,
      notes: input.notes ?? null,
      reminderMinutes: input.reminderMinutes ?? null,
      attendeeIds: input.attendeeIds ?? [],
      rsvp: (input.rsvp ?? {}) as Prisma.InputJsonValue,
    },
  });
  const slugMap = buildSlugMap(await loadCalendarRows(businessId));
  log.info('calendar.event.create', { businessId, eventId: row.id, actorId });
  await logMeizitoAction({
    actorId,
    action: 'calendar.event.create',
    businessId,
    targetType: 'meizito_calendar_event',
    targetId: row.id,
  });
  return serializeCalendarEventRow(row, slugMap);
}

export async function updateCalendarEvent(
  businessId: string,
  eventId: string,
  patch: Partial<Omit<MeizitoCalendarEvent, 'id'>>,
  actorId: string
) {
  await getEventOrThrow(businessId, eventId);
  const data: Prisma.MeizitoCalendarEventUpdateInput = {};
  if (patch.title !== undefined) data.title = patch.title;
  if (patch.date !== undefined) data.dateKey = patch.date;
  if (patch.time !== undefined) data.time = patch.time ?? null;
  if (patch.notes !== undefined) data.notes = patch.notes ?? null;
  if (patch.reminderMinutes !== undefined) data.reminderMinutes = patch.reminderMinutes ?? null;
  if (patch.attendeeIds !== undefined) data.attendeeIds = patch.attendeeIds;
  if (patch.rsvp !== undefined) data.rsvp = patch.rsvp as Prisma.InputJsonValue;
  if (patch.calendarId !== undefined) {
    const calendar = await getCalendarOrThrow(businessId, patch.calendarId);
    data.calendar = { connect: { id: calendar.id } };
  }
  const row = await prisma.meizitoCalendarEvent.update({ where: { id: eventId }, data });
  const slugMap = buildSlugMap(await loadCalendarRows(businessId));
  log.info('calendar.event.update', { businessId, eventId, actorId });
  return serializeCalendarEventRow(row, slugMap);
}

export async function deleteCalendarEvent(businessId: string, eventId: string, actorId: string) {
  await getEventOrThrow(businessId, eventId);
  await prisma.meizitoCalendarEvent.delete({ where: { id: eventId } });
  log.info('calendar.event.delete', { businessId, eventId, actorId });
  await logMeizitoAction({
    actorId,
    action: 'calendar.event.delete',
    businessId,
    targetType: 'meizito_calendar_event',
    targetId: eventId,
  });
}

export async function syncCalendarEventsFromCards(
  businessId: string,
  actorId: string,
  ownerName: string
) {
  await ensureDefaultCalendars(businessId, actorId, ownerName);
  const tasksCalendar = await prisma.meizitoCalendar.findFirst({
    where: { businessId, slug: MEIZITO_TASKS_CALENDAR_ID },
  });
  if (!tasksCalendar) throw new Error('NOT_FOUND');

  const cards = await prisma.workspaceCard.findMany({
    where: { businessId, dueDate: { not: '' } },
  });

  await prisma.meizitoCalendarEvent.deleteMany({
    where: {
      businessId,
      calendarId: tasksCalendar.id,
      sourceCardId: { not: null },
    },
  });

  if (cards.length > 0) {
    await prisma.meizitoCalendarEvent.createMany({
      data: cards.map((card) => ({
        businessId,
        calendarId: tasksCalendar.id,
        title: card.title,
        dateKey: card.dueDate,
        time: card.dueTime || null,
        sourceCardId: card.id,
      })),
    });
  }

  log.info('calendar.syncFromCards', { businessId, actorId, count: cards.length });
  await logMeizitoAction({
    actorId,
    action: 'calendar.syncFromCards',
    businessId,
    targetType: 'meizito_calendar',
    targetId: tasksCalendar.id,
  });

  const slugMap = buildSlugMap(await loadCalendarRows(businessId));
  const eventRows = await prisma.meizitoCalendarEvent.findMany({
    where: { businessId, calendarId: tasksCalendar.id, sourceCardId: { not: null } },
    orderBy: [{ dateKey: 'asc' }, { time: 'asc' }],
  });
  return eventRows.map((row) => serializeCalendarEventRow(row, slugMap));
}

export async function setCalendarEventRsvp(
  businessId: string,
  eventId: string,
  userId: string,
  status: 'accepted' | 'declined' | 'pending',
  actorId: string
) {
  const existing = await getEventOrThrow(businessId, eventId);
  const rsvp =
    existing.rsvp && typeof existing.rsvp === 'object' && !Array.isArray(existing.rsvp)
      ? { ...(existing.rsvp as Record<string, string>) }
      : {};
  rsvp[userId] = status;
  const row = await prisma.meizitoCalendarEvent.update({
    where: { id: eventId },
    data: { rsvp: rsvp as Prisma.InputJsonValue },
  });
  const slugMap = buildSlugMap(await loadCalendarRows(businessId));
  log.info('calendar.event.rsvp', { businessId, eventId, userId, status, actorId });
  return serializeCalendarEventRow(row, slugMap);
}

export { clientCalendarId };
