import { NextRequest } from 'next/server';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import { loadPendingApprovals } from '@/src/lib/meizito/requests/server';

type RouteParams = { params: Promise<{ businessId: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const pending = await loadPendingApprovals(businessId, access.user.id);
    return jsonOk(pending);
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.pendingApprovals');
  }
}
