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

    const fiscalYears = await prisma.fiscalYear.findMany({
      where: { businessId: id },
      orderBy: { createdAt: 'desc' },
    });

    const active = fiscalYears.find((f) => f.isActive) ?? fiscalYears[0] ?? null;

    return jsonOk({ fiscalYears, active });
  } catch (err) {
    return handleAuthRouteError(err, 'businesses.fiscal.get');
  }
}

const upsertSchema = z.object({
  label: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  isActive: z.boolean().optional(),
});

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const access = await requireBusinessAccess(req, id);
    assertCanManageBusiness(access.memberRole);

    const body = upsertSchema.parse(await req.json());
    const isActive = body.isActive ?? true;

    const fiscalYear = await prisma.$transaction(async (tx) => {
      if (isActive) {
        await tx.fiscalYear.updateMany({
          where: { businessId: id },
          data: { isActive: false },
        });
      }
      return tx.fiscalYear.create({
        data: {
          businessId: id,
          label: body.label,
          startDate: body.startDate,
          endDate: body.endDate,
          isActive,
        },
      });
    });

    return jsonOk({ fiscalYear }, { status: 201 });
  } catch (err) {
    return handleAuthRouteError(err, 'businesses.fiscal.post');
  }
}

const patchSchema = z.object({
  fiscalYearId: z.string().min(1),
  label: z.string().min(1).optional(),
  startDate: z.string().min(1).optional(),
  endDate: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const access = await requireBusinessAccess(req, id);
    assertCanManageBusiness(access.memberRole);

    const body = patchSchema.parse(await req.json());

    const fiscalYear = await prisma.$transaction(async (tx) => {
      if (body.isActive) {
        await tx.fiscalYear.updateMany({
          where: { businessId: id },
          data: { isActive: false },
        });
      }
      return tx.fiscalYear.update({
        where: { id: body.fiscalYearId, businessId: id },
        data: {
          ...(body.label !== undefined ? { label: body.label } : {}),
          ...(body.startDate !== undefined ? { startDate: body.startDate } : {}),
          ...(body.endDate !== undefined ? { endDate: body.endDate } : {}),
          ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        },
      });
    });

    return jsonOk({ fiscalYear });
  } catch (err) {
    return handleAuthRouteError(err, 'businesses.fiscal.patch');
  }
}
