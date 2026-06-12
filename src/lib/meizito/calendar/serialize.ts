import type { MeizitoCalendar, MeizitoCalendarEvent } from '@/src/types/meizito';

type CalendarRow = {
  id: string;
  businessId: string;
  slug: string | null;
  name: string;
  color: string;
  kind: MeizitoCalendar['kind'];
  sharedWith: unknown;
  ownerUserId: string;
  ownerName: string;
  visible: boolean;
  sortOrder: number;
};

type CalendarEventRow = {
  id: string;
  businessId: string;
  calendarId: string;
  title: string;
  dateKey: string;
  time: string | null;
  sourceCardId: string | null;
  notes: string | null;
  reminderMinutes: number | null;
  attendeeIds: unknown;
  rsvp: unknown;
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}

function asRsvp(value: unknown): MeizitoCalendarEvent['rsvp'] {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as MeizitoCalendarEvent['rsvp'];
  }
  return {};
}

export function clientCalendarId(row: Pick<CalendarRow, 'id' | 'slug'>): string {
  return row.slug ?? row.id;
}

export function serializeCalendarRow(row: CalendarRow): MeizitoCalendar {
  return {
    id: clientCalendarId(row),
    name: row.name,
    color: row.color,
    kind: row.kind,
    sharedWith: asStringArray(row.sharedWith),
    ownerName: row.ownerName,
    visible: row.visible,
  };
}

export function serializeCalendarEventRow(
  row: CalendarEventRow,
  calendarSlugByInternalId: Map<string, string | null>
): MeizitoCalendarEvent {
  const slug = calendarSlugByInternalId.get(row.calendarId);
  return {
    id: row.id,
    calendarId: slug ?? row.calendarId,
    title: row.title,
    date: row.dateKey,
    time: row.time ?? undefined,
    sourceCardId: row.sourceCardId ?? undefined,
    notes: row.notes ?? undefined,
    reminderMinutes: row.reminderMinutes ?? undefined,
    attendeeIds: asStringArray(row.attendeeIds),
    rsvp: asRsvp(row.rsvp),
  };
}

export type CalendarSnapshot = {
  calendars: MeizitoCalendar[];
  events: MeizitoCalendarEvent[];
};
