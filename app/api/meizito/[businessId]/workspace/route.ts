import { NextRequest } from 'next/server';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import { meizitoModuleLog } from '@/src/lib/meizito/logger';
import { loadWorkspaceSnapshot } from '@/src/lib/meizito/workspace/server';

const log = meizitoModuleLog('workspace');

type RouteParams = { params: Promise<{ businessId: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    await requireMeizitoAccess(req, businessId);
    const snapshot = await loadWorkspaceSnapshot(businessId);
    log.info('workspace.load', {
      businessId,
      boards: snapshot.boards.length,
      cards: snapshot.cards.length,
    });
    return jsonOk(snapshot);
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.workspace.load');
  }
}
