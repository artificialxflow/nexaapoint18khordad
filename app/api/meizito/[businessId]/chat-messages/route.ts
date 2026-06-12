import { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import { createChatMessage, type CreateChatMessageInput } from '@/src/lib/meizito/chat/server';

type RouteParams = { params: Promise<{ businessId: string }> };

const createSchema = z.object({
  threadId: z.string().min(1),
  authorName: z.string().min(1),
  body: z.string().default(''),
  type: z.enum(['text', 'file', 'voice', 'image', 'video']).optional(),
  attachmentNames: z.array(z.string()).optional(),
  attachmentRefs: z
    .array(
      z.object({
        name: z.string(),
        path: z.string(),
        size: z.number().optional(),
      })
    )
    .optional(),
  voiceDurationSec: z.number().int().optional(),
});

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const body = createSchema.parse(await req.json());
    const message = await createChatMessage(
      businessId,
      body as CreateChatMessageInput,
      access.user.id
    );
    return jsonOk({ message }, { status: 201 });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.chatMessages.create');
  }
}
