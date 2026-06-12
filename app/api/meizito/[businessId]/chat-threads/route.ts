import { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import { createChatThread } from '@/src/lib/meizito/chat/server';

type RouteParams = { params: Promise<{ businessId: string }> };

const createSchema = z.object({
  title: z.string().min(1).max(200),
  threadType: z.enum(['direct', 'group', 'channel']).default('direct'),
  participantNames: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const body = createSchema.parse(await req.json());
    const thread = await createChatThread(
      businessId,
      body.title,
      body.threadType,
      body.participantNames,
      access.user.id
    );
    return jsonOk({ thread }, { status: 201 });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.chatThreads.create');
  }
}
