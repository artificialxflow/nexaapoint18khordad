import { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import { setCalendarEventRsvp } from '@/src/lib/meizito/calendar/server';

type RouteParams = { params: Promise<{ businessId: string }> };

const patchSchema = z.object({
  eventId: z.string().min(1),
  userId: z.string().min(1),
  status: z.enum(['accepted', 'declined', 'pending']),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const body = patchSchema.parse(await req.json());
    const event = await setCalendarEventRsvp(
      businessId,
      body.eventId,
      body.userId,
      body.status,
      access.user.id
    );
    return jsonOk({ event });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.calendarEvents.rsvp');
  }
}
