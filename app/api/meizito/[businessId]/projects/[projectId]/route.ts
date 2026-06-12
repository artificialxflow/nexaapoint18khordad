import { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import { updateWorkspaceProject } from '@/src/lib/meizito/workspace/server';

type RouteParams = { params: Promise<{ businessId: string; projectId: string }> };

const patchSchema = z.object({
  name: z.string().optional(),
  memberIds: z.array(z.string()).optional(),
  boardId: z.string().nullable().optional(),
  ncFolderPath: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId, projectId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const body = patchSchema.parse(await req.json());
    const project = await updateWorkspaceProject(
      businessId,
      projectId,
      {
        ...body,
        boardId: body.boardId ?? undefined,
        ncFolderPath: body.ncFolderPath ?? undefined,
      },
      access.user.id
    );
    return jsonOk({ project });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.projects.patch');
  }
}
