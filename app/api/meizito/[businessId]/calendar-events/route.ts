import { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import { createCalendarEvent, type CreateCalendarEventInput } from '@/src/lib/meizito/calendar/server';

type RouteParams = { params: Promise<{ businessId: string }> };

const createSchema = z.object({
  calendarId: z.string().min(1),
  title: z.string().min(1).max(500),
  date: z.string().min(1),
  time: z.string().optional(),
  sourceCardId: z.string().optional(),
  notes: z.string().optional(),
  reminderMinutes: z.number().int().optional(),
  attendeeIds: z.array(z.string()).optional(),
  rsvp: z.record(z.enum(['pending', 'accepted', 'declined'])).optional(),
});

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const body = createSchema.parse(await req.json());
    const event = await createCalendarEvent(
      businessId,
      body as CreateCalendarEventInput,
      access.user.id
    );
    return jsonOk({ event }, { status: 201 });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.calendarEvents.create');
  }
}
