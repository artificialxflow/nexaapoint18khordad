import { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import {
  recordInternalRequestApproval,
  submitInternalRequestForApproval,
} from '@/src/lib/meizito/requests/server';

type RouteParams = { params: Promise<{ businessId: string }> };

const approvalSchema = z.object({
  requestId: z.string().min(1),
  action: z.enum(['approve', 'reject', 'forward', 'comment', 'submit', 'cancel']),
  comment: z.string().optional(),
  forwardToUserId: z.string().optional(),
  forwardToUserName: z.string().optional(),
  forwardToUserIds: z.array(z.string()).optional(),
  forwardToUserNames: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const body = approvalSchema.parse(await req.json());
    const { requestId, action, ...payload } = body;

    if (action === 'submit') {
      const request = await submitInternalRequestForApproval(
        businessId,
        requestId,
        access.user.id,
        access.user.displayName ?? access.user.username
      );
      return jsonOk({ request });
    }

    const request = await recordInternalRequestApproval(
      businessId,
      requestId,
      { action, ...payload },
      access.user.id,
      access.user.displayName ?? access.user.username
    );
    return jsonOk({ request });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.requests.approval');
  }
}
