import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/lib/db/prisma';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { assertCanManageBusiness, requireBusinessAccess } from '@/src/lib/business/access';

type RouteParams = { params: Promise<{ id: string; projectId: string }> };

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  isDefault: z.boolean().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id, projectId } = await params;
    const access = await requireBusinessAccess(req, id);
    assertCanManageBusiness(access.memberRole);

    const body = patchSchema.parse(await req.json());

    const project = await prisma.$transaction(async (tx) => {
      if (body.isDefault) {
        await tx.accountingProject.updateMany({
          where: { businessId: id },
          data: { isDefault: false },
        });
      }
      return tx.accountingProject.update({
        where: { id: projectId, businessId: id },
        data: {
          ...(body.name !== undefined ? { name: body.name.trim() } : {}),
          ...(body.isDefault !== undefined ? { isDefault: body.isDefault } : {}),
          ...(body.active !== undefined ? { active: body.active } : {}),
        },
      });
    });

    return jsonOk({ project });
  } catch (err) {
    return handleAuthRouteError(err, 'businesses.projects.patch');
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id, projectId } = await params;
    const access = await requireBusinessAccess(req, id);
    assertCanManageBusiness(access.memberRole);

    await prisma.accountingProject.delete({
      where: { id: projectId, businessId: id },
    });

    return jsonOk({ deleted: true });
  } catch (err) {
    return handleAuthRouteError(err, 'businesses.projects.delete');
  }
}
