import { meizitoFetch } from '@/src/lib/meizito/client';
import type { CalendarSnapshot } from '@/src/lib/meizito/calendar/serialize';
import type { MeizitoCalendar, MeizitoCalendarEvent, MeizitoCalendarKind } from '@/src/types/meizito';

export async function fetchCalendarSnapshot(businessId: string): Promise<CalendarSnapshot> {
  return meizitoFetch<CalendarSnapshot>(businessId, '/calendar');
}

export async function apiCreateCalendar(
  businessId: string,
  name: string,
  kind: MeizitoCalendarKind,
  color: string
) {
  return meizitoFetch<{ calendar: MeizitoCalendar }>(businessId, '/calendars', {
    method: 'POST',
    body: JSON.stringify({ name, kind, color }),
  });
}

export async function apiUpdateCalendar(
  businessId: string,
  calendarId: string,
  patch: Partial<Pick<MeizitoCalendar, 'name' | 'color' | 'kind' | 'sharedWith' | 'visible'>>
) {
  return meizitoFetch<{ calendar: MeizitoCalendar }>(businessId, '/calendar-update', {
    method: 'PATCH',
    body: JSON.stringify({ calendarId, ...patch }),
  });
}

export async function apiCreateCalendarEvent(
  businessId: string,
  event: Omit<MeizitoCalendarEvent, 'id'>
) {
  return meizitoFetch<{ event: MeizitoCalendarEvent }>(businessId, '/calendar-events', {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

export async function apiUpdateCalendarEvent(
  businessId: string,
  eventId: string,
  patch: Partial<Omit<MeizitoCalendarEvent, 'id'>>
) {
  return meizitoFetch<{ event: MeizitoCalendarEvent }>(businessId, '/calendar-event-update', {
    method: 'PATCH',
    body: JSON.stringify({ eventId, ...patch }),
  });
}

export async function apiDeleteCalendarEvent(businessId: string, eventId: string) {
  return meizitoFetch<{ ok: true }>(businessId, '/calendar-event-update', {
    method: 'PATCH',
    body: JSON.stringify({ eventId, delete: true }),
  });
}

export async function apiSyncCalendarEventsFromCards(businessId: string) {
  return meizitoFetch<{ events: MeizitoCalendarEvent[] }>(
    businessId,
    '/calendar-events-sync-from-cards',
    { method: 'POST' }
  );
}

export async function apiSetCalendarEventRsvp(
  businessId: string,
  eventId: string,
  userId: string,
  status: 'accepted' | 'declined' | 'pending'
) {
  return meizitoFetch<{ event: MeizitoCalendarEvent }>(businessId, '/calendar-event-rsvp', {
    method: 'PATCH',
    body: JSON.stringify({ eventId, userId, status }),
  });
}
