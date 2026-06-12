import { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import { createCalendar } from '@/src/lib/meizito/calendar/server';

type RouteParams = { params: Promise<{ businessId: string }> };

const createSchema = z.object({
  name: z.string().min(1).max(200),
  kind: z.enum(['customer_followup', 'service', 'general', 'custom']).default('custom'),
  color: z.string().min(1).max(20),
});

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const body = createSchema.parse(await req.json());
    const calendar = await createCalendar(
      businessId,
      body.name,
      body.kind,
      body.color,
      access.user.id,
      access.user.displayName ?? access.user.username
    );
    return jsonOk({ calendar }, { status: 201 });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.calendars.create');
  }
}
