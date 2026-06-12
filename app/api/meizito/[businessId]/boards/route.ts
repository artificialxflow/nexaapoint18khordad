import { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import { createWorkspaceBoard } from '@/src/lib/meizito/workspace/server';

type RouteParams = { params: Promise<{ businessId: string }> };

const createSchema = z.object({ name: z.string().min(1).max(200) });

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const body = createSchema.parse(await req.json());
    const board = await createWorkspaceBoard(businessId, body.name, access.user.id);
    return jsonOk({ board }, { status: 201 });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.boards.create');
  }
}
