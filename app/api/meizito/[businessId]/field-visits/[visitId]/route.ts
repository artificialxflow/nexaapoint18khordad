import { NextRequest } from 'next/server';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import { deleteFieldVisit, updateFieldVisit } from '@/src/lib/meizito/workspace/server';

type RouteParams = { params: Promise<{ businessId: string; visitId: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId, visitId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const body = (await req.json()) as Record<string, unknown>;
    const visit = await updateFieldVisit(
      businessId,
      visitId,
      body as Parameters<typeof updateFieldVisit>[2],
      access.user.id
    );
    return jsonOk({ visit });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.fieldVisits.patch');
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId, visitId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    await deleteFieldVisit(businessId, visitId, access.user.id);
    return jsonOk({ ok: true });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.fieldVisits.delete');
  }
}
