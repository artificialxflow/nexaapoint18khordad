import { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import { updateChatThread } from '@/src/lib/meizito/chat/server';

type RouteParams = { params: Promise<{ businessId: string }> };

const patchSchema = z.object({
  threadId: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  starred: z.boolean().optional(),
  pinned: z.boolean().optional(),
  participantNames: z.array(z.string()).optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const body = patchSchema.parse(await req.json());
    const { threadId, ...patch } = body;
    const thread = await updateChatThread(businessId, threadId, patch, access.user.id);
    return jsonOk({ thread });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.chatThreads.patch');
  }
}
