import { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import { addWorkspaceColumn } from '@/src/lib/meizito/workspace/server';

type RouteParams = { params: Promise<{ businessId: string; boardId: string }> };

const createSchema = z.object({ title: z.string().min(1).max(200) });

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId, boardId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const body = createSchema.parse(await req.json());
    const column = await addWorkspaceColumn(businessId, boardId, body.title, access.user.id);
    return jsonOk({ column }, { status: 201 });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.columns.create');
  }
}
