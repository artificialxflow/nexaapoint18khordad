import { NextRequest } from 'next/server';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import { loadChatSnapshot } from '@/src/lib/meizito/chat/server';

type RouteParams = { params: Promise<{ businessId: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    await requireMeizitoAccess(req, businessId);
    const snapshot = await loadChatSnapshot(businessId);
    return jsonOk(snapshot);
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.chat.snapshot');
  }
}
