import { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import { updateInternalRequestStatus } from '@/src/lib/meizito/requests/server';

type RouteParams = { params: Promise<{ businessId: string }> };

const patchSchema = z.object({
  requestId: z.string().min(1),
  status: z.enum(['open', 'closed']),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const body = patchSchema.parse(await req.json());
    const request = await updateInternalRequestStatus(
      businessId,
      body.requestId,
      body.status,
      access.user.id
    );
    return jsonOk({ request });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.requests.patch');
  }
}
