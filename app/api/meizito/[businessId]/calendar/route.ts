import { NextRequest } from 'next/server';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import { loadCalendarSnapshot } from '@/src/lib/meizito/calendar/server';

type RouteParams = { params: Promise<{ businessId: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const snapshot = await loadCalendarSnapshot(
      businessId,
      access.user.id,
      access.user.displayName ?? access.user.username
    );
    return jsonOk(snapshot);
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.calendar.snapshot');
  }
}
