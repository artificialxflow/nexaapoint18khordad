import { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import { updateInternalLetter } from '@/src/lib/meizito/letters/server';

type RouteParams = { params: Promise<{ businessId: string }> };

const patchSchema = z.object({
  letterId: z.string().min(1),
  box: z.enum(['inbox', 'outbox', 'archive']).optional(),
  status: z.enum(['open', 'closed']).optional(),
  category: z.enum(['financial', 'administrative', 'hr', 'operations', 'other']).optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const body = patchSchema.parse(await req.json());
    const { letterId, ...patch } = body;
    const letter = await updateInternalLetter(businessId, letterId, patch, access.user.id);
    return jsonOk({ letter });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.letters.patch');
  }
}
