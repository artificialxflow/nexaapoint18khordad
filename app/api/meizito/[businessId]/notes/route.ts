import { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import { createWorkspaceNote, updateWorkspaceNote } from '@/src/lib/meizito/workspace/server';

type RouteParams = { params: Promise<{ businessId: string }> };

const createSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().default(''),
  color: z.string().default('#fef08a'),
  boardId: z.string().optional(),
  ncAttachments: z.array(z.unknown()).optional(),
});

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const body = createSchema.parse(await req.json());
    const note = await createWorkspaceNote(businessId, body, access.user.id);
    return jsonOk({ note }, { status: 201 });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.notes.create');
  }
}
