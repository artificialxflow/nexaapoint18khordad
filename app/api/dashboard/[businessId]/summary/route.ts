import { NextRequest } from 'next/server';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireBusinessAccess } from '@/src/lib/business/access';
import { loadDashboardSummary } from '@/src/lib/dashboard/server';

type RouteParams = { params: Promise<{ businessId: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    await requireBusinessAccess(req, businessId);
    const summary = await loadDashboardSummary(businessId);
    return jsonOk({ summary });
  } catch (err) {
    return handleAuthRouteError(err, 'dashboard.summary');
  }
}
