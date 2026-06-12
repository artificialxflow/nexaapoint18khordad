import { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import {
  deleteCalendarEvent,
  updateCalendarEvent,
} from '@/src/lib/meizito/calendar/server';

type RouteParams = { params: Promise<{ businessId: string }> };

const patchSchema = z.object({
  eventId: z.string().min(1),
  delete: z.boolean().optional(),
  calendarId: z.string().optional(),
  title: z.string().min(1).max(500).optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  notes: z.string().optional(),
  reminderMinutes: z.number().int().optional(),
  attendeeIds: z.array(z.string()).optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const body = patchSchema.parse(await req.json());
    const { eventId, delete: shouldDelete, ...patch } = body;
    if (shouldDelete) {
      await deleteCalendarEvent(businessId, eventId, access.user.id);
      return jsonOk({ ok: true });
    }
    const event = await updateCalendarEvent(businessId, eventId, patch, access.user.id);
    return jsonOk({ event });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.calendarEvents.patch');
  }
}
