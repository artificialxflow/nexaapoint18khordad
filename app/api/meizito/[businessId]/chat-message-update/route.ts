import { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import { updateChatMessage } from '@/src/lib/meizito/chat/server';

type RouteParams = { params: Promise<{ businessId: string }> };

const patchSchema = z.object({
  messageId: z.string().min(1),
  body: z.string().optional(),
  editedAt: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const body = patchSchema.parse(await req.json());
    const { messageId, ...patch } = body;
    const message = await updateChatMessage(businessId, messageId, patch, access.user.id);
    return jsonOk({ message });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.chatMessages.patch');
  }
}
