import { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import { deleteWorkspaceCard, updateWorkspaceCard } from '@/src/lib/meizito/workspace/server';
import type { MeizitoCard } from '@/src/types/meizito';

type RouteParams = { params: Promise<{ businessId: string; cardId: string }> };

const patchSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  assignee: z.string().optional(),
  dueDate: z.string().optional(),
  dueTime: z.string().optional(),
  recurrence: z.enum(['none', 'daily', 'weekly']).optional(),
  category: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
  checklist: z.array(z.unknown()).optional(),
  attachments: z.array(z.unknown()).optional(),
  starred: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId, cardId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const body = patchSchema.parse(await req.json());
    const card = await updateWorkspaceCard(
      businessId,
      cardId,
      body as Partial<MeizitoCard>,
      access.user.id
    );
    return jsonOk({ card });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.cards.patch');
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId, cardId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    await deleteWorkspaceCard(businessId, cardId, access.user.id);
    return jsonOk({ ok: true });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.cards.delete');
  }
}
