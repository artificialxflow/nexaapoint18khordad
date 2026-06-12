import { NextRequest } from 'next/server';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import { syncCalendarEventsFromCards } from '@/src/lib/meizito/calendar/server';

type RouteParams = { params: Promise<{ businessId: string }> };

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const events = await syncCalendarEventsFromCards(
      businessId,
      access.user.id,
      access.user.displayName ?? access.user.username
    );
    return jsonOk({ events });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.calendarEvents.syncFromCards');
  }
}
