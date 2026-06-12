import { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import { updateWorkspaceBoard } from '@/src/lib/meizito/workspace/server';

type RouteParams = { params: Promise<{ businessId: string; boardId: string }> };

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  memberNames: z.array(z.string()).optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId, boardId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const body = patchSchema.parse(await req.json());
    const board = await updateWorkspaceBoard(businessId, boardId, body, access.user.id);
    return jsonOk({ board });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.boards.patch');
  }
}
