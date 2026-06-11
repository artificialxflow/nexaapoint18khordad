import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/lib/db/prisma';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { writeAuditLog } from '@/src/lib/auth/audit';
import { requireSessionUser } from '@/src/lib/auth/session';
import { DEFAULT_CREDIT_LABEL, DEFAULT_FISCAL_YEAR, defaultBusinessExpiry } from '@/src/lib/business/defaults';
import { serializeBusiness } from '@/src/lib/business/serialize';

export async function GET(req: NextRequest) {
  try {
    const user = await requireSessionUser(req);

    const memberships = await prisma.businessMember.findMany({
      where: { userId: user.id, business: { status: 'active' } },
      include: { business: true },
      orderBy: { business: { createdAt: 'desc' } },
    });

    return jsonOk({
      businesses: memberships.map((m) => serializeBusiness(m.business, m)),
    });
  } catch (err) {
    return handleAuthRouteError(err, 'businesses.list');
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(200),
  plan: z.enum(['trial', 'active']).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireSessionUser(req);
    const body = createSchema.parse(await req.json());
    const name = body.name.trim();

    const business = await prisma.$transaction(async (tx) => {
      const created = await tx.business.create({
        data: {
          name,
          plan: body.plan ?? 'trial',
          expiresAt: defaultBusinessExpiry(),
          creditLabel: DEFAULT_CREDIT_LABEL,
          createdById: user.id,
          members: {
            create: { userId: user.id, role: 'owner' },
          },
          profile: {
            create: { tradeName: name },
          },
          fiscalYears: {
            create: {
              ...DEFAULT_FISCAL_YEAR,
              isActive: true,
            },
          },
        },
        include: {
          members: { where: { userId: user.id } },
        },
      });
      return created;
    });

    const membership = business.members[0];
    await writeAuditLog({
      actorId: user.id,
      action: 'business.create',
      targetType: 'business',
      targetId: business.id,
      meta: { name: business.name },
    });

    return jsonOk(
      { business: serializeBusiness(business, membership) },
      { status: 201 }
    );
  } catch (err) {
    return handleAuthRouteError(err, 'businesses.create');
  }
}
