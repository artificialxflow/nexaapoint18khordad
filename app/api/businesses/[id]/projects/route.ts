import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/lib/db/prisma';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { assertCanManageBusiness, requireBusinessAccess } from '@/src/lib/business/access';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await requireBusinessAccess(req, id);

    const projects = await prisma.accountingProject.findMany({
      where: { businessId: id },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    return jsonOk({ projects });
  } catch (err) {
    return handleAuthRouteError(err, 'businesses.projects.list');
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(200),
  isDefault: z.boolean().optional(),
  active: z.boolean().optional(),
});

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const access = await requireBusinessAccess(req, id);
    assertCanManageBusiness(access.memberRole);

    const body = createSchema.parse(await req.json());
    const isDefault = body.isDefault ?? false;

    const project = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.accountingProject.updateMany({
          where: { businessId: id },
          data: { isDefault: false },
        });
      }
      return tx.accountingProject.create({
        data: {
          businessId: id,
          name: body.name.trim(),
          isDefault,
          active: body.active ?? true,
        },
      });
    });

    return jsonOk({ project }, { status: 201 });
  } catch (err) {
    return handleAuthRouteError(err, 'businesses.projects.create');
  }
}
