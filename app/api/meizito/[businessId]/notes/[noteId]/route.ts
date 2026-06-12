import { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import { updateWorkspaceNote } from '@/src/lib/meizito/workspace/server';
import type { MeizitoNote } from '@/src/types/meizito';

type RouteParams = { params: Promise<{ businessId: string; noteId: string }> };

const patchSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  color: z.string().optional(),
  starred: z.boolean().optional(),
  archived: z.boolean().optional(),
  checklist: z.array(z.unknown()).optional(),
  ncAttachments: z.array(z.unknown()).optional(),
  deletedAt: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId, noteId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const body = patchSchema.parse(await req.json());
    const note = await updateWorkspaceNote(
      businessId,
      noteId,
      body as Partial<MeizitoNote>,
      access.user.id
    );
    return jsonOk({ note });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.notes.patch');
  }
}
