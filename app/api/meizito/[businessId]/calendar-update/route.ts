import { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import { updateCalendar } from '@/src/lib/meizito/calendar/server';

type RouteParams = { params: Promise<{ businessId: string }> };

const patchSchema = z.object({
  calendarId: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  color: z.string().min(1).max(20).optional(),
  kind: z.enum(['customer_followup', 'service', 'general', 'custom']).optional(),
  sharedWith: z.array(z.string()).optional(),
  visible: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const body = patchSchema.parse(await req.json());
    const { calendarId, ...patch } = body;
    const calendar = await updateCalendar(businessId, calendarId, patch, access.user.id);
    return jsonOk({ calendar });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.calendars.patch');
  }
}
