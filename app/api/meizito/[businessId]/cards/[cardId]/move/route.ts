import { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import { moveWorkspaceCard } from '@/src/lib/meizito/workspace/server';

type RouteParams = { params: Promise<{ businessId: string; cardId: string }> };

const moveSchema = z.object({ columnId: z.string().min(1) });

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId, cardId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const body = moveSchema.parse(await req.json());
    const card = await moveWorkspaceCard(businessId, cardId, body.columnId, access.user.id);
    return jsonOk({ card });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.cards.move');
  }
}
