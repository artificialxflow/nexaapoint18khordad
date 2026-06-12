import { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import {
  createFieldVisit,
  deleteFieldVisit,
  updateFieldVisit,
} from '@/src/lib/meizito/workspace/server';

type RouteParams = { params: Promise<{ businessId: string }> };

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const body = z.record(z.unknown()).parse(await req.json()) as Record<string, unknown>;
    const visit = await createFieldVisit(
      businessId,
      body as Parameters<typeof createFieldVisit>[1],
      access.user.id
    );
    return jsonOk({ visit }, { status: 201 });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.fieldVisits.create');
  }
}
