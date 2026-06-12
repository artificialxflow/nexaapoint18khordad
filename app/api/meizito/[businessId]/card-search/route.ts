import { NextRequest } from 'next/server';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import { searchWorkspaceCards } from '@/src/lib/meizito/workspace/server';

type RouteParams = { params: Promise<{ businessId: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    await requireMeizitoAccess(req, businessId);
    const { searchParams } = new URL(req.url);
    const boardId = searchParams.get('boardId') ?? '';
    const q = searchParams.get('q') ?? '';
    const labelId = searchParams.get('labelId') ?? undefined;
    if (!boardId) {
      return handleAuthRouteError(new Error('VALIDATION'), 'meizito.cards.search');
    }
    const cards = await searchWorkspaceCards(businessId, boardId, q, labelId);
    return jsonOk({ cards });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.cards.search');
  }
}
