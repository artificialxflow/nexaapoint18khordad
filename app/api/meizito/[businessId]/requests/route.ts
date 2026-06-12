import { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import {
  createInternalRequest,
  loadRequestsSnapshot,
  type CreateInternalRequestInput,
} from '@/src/lib/meizito/requests/server';

type RouteParams = { params: Promise<{ businessId: string }> };

const createSchema = z.object({
  subject: z.string().min(1).max(500),
  body: z.string().default(''),
  authorId: z.string().min(1),
  authorName: z.string().default(''),
  referredToUserIds: z.array(z.string()).optional(),
  referredTo: z.array(z.string()).optional(),
  ccUserIds: z.array(z.string()).optional(),
  attachments: z.array(z.unknown()).optional(),
  category: z.enum(['financial', 'administrative', 'hr', 'operations', 'other']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  threadId: z.string().optional(),
  replyToRequestId: z.string().optional(),
  sourceChatMessageId: z.string().optional(),
  options: z.object({ submitForApproval: z.boolean().optional() }).optional(),
});

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    await requireMeizitoAccess(req, businessId);
    const snapshot = await loadRequestsSnapshot(businessId);
    return jsonOk(snapshot);
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.requests.list');
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const body = createSchema.parse(await req.json());
    const { options, ...input } = body;
    const request = await createInternalRequest(
      businessId,
      input as CreateInternalRequestInput,
      access.user.id,
      options
    );
    return jsonOk({ request }, { status: 201 });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.requests.create');
  }
}
