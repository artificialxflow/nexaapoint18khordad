import { NextRequest } from 'next/server';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import { MEIZITO_DATA_SOURCES } from '@/src/lib/meizito/config';
import { meizitoLog } from '@/src/lib/meizito/logger';

type RouteParams = { params: Promise<{ businessId: string }> };

/** Foundation health check — membership + data-source flags. */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    meizitoLog.info('health.ok', { businessId, userId: access.user.id });
    return jsonOk({
      businessId,
      memberRole: access.memberRole,
      userId: access.user.id,
      dataSources: MEIZITO_DATA_SOURCES,
      phase: 'v10-foundation',
    });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.health');
  }
}
