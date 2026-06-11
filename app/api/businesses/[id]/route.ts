import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/lib/db/prisma';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { writeAuditLog } from '@/src/lib/auth/audit';
import {
  assertCanManageBusiness,
  assertOwner,
  requireBusinessAccess,
} from '@/src/lib/business/access';
import { serializeBusiness } from '@/src/lib/business/serialize';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const access = await requireBusinessAccess(req, id);

    const business = await prisma.business.findUniqueOrThrow({ where: { id } });
    return jsonOk({
      business: serializeBusiness(business, { role: access.memberRole }),
    });
  } catch (err) {
    return handleAuthRouteError(err, 'businesses.get');
  }
}

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  plan: z.enum(['trial', 'active']).optional(),
  creditLabel: z.string().max(100).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const access = await requireBusinessAccess(req, id);
    assertCanManageBusiness(access.memberRole);

    const body = patchSchema.parse(await req.json());
    const business = await prisma.business.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.plan !== undefined ? { plan: body.plan } : {}),
        ...(body.creditLabel !== undefined ? { creditLabel: body.creditLabel } : {}),
        ...(body.expiresAt !== undefined
          ? { expiresAt: body.expiresAt ? new Date(body.expiresAt) : null }
          : {}),
      },
    });

    await writeAuditLog({
      actorId: access.user.id,
      action: 'business.update',
      targetType: 'business',
      targetId: id,
    });

    return jsonOk({
      business: serializeBusiness(business, { role: access.memberRole }),
    });
  } catch (err) {
    return handleAuthRouteError(err, 'businesses.patch');
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const access = await requireBusinessAccess(req, id);
    assertOwner(access.memberRole);

    const business = await prisma.business.update({
      where: { id },
      data: { status: 'archived' },
    });

    await writeAuditLog({
      actorId: access.user.id,
      action: 'business.archive',
      targetType: 'business',
      targetId: id,
    });

    return jsonOk({
      business: serializeBusiness(business, { role: access.memberRole }),
    });
  } catch (err) {
    return handleAuthRouteError(err, 'businesses.delete');
  }
}
