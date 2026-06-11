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

    let profile = await prisma.businessProfile.findUnique({ where: { businessId: id } });
    if (!profile) {
      profile = await prisma.businessProfile.create({
        data: { businessId: id },
      });
    }

    return jsonOk({ profile });
  } catch (err) {
    return handleAuthRouteError(err, 'businesses.profile.get');
  }
}

const patchSchema = z.object({
  legalName: z.string().optional(),
  tradeName: z.string().optional(),
  nationalId: z.string().optional(),
  economicCode: z.string().optional(),
  regNo: z.string().optional(),
  phone: z.string().optional(),
  fax: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  website: z.string().optional(),
  email: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const access = await requireBusinessAccess(req, id);
    assertCanManageBusiness(access.memberRole);

    const body = patchSchema.parse(await req.json());
    const profile = await prisma.businessProfile.upsert({
      where: { businessId: id },
      create: { businessId: id, ...body },
      update: body,
    });

    return jsonOk({ profile });
  } catch (err) {
    return handleAuthRouteError(err, 'businesses.profile.patch');
  }
}
