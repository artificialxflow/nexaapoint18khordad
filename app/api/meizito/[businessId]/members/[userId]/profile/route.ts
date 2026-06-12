import { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoManagerAccess } from '@/src/lib/meizito/access';
import { logMeizitoAction } from '@/src/lib/meizito/audit';
import { meizitoModuleLog } from '@/src/lib/meizito/logger';
import { serializeTeamMember } from '@/src/lib/meizito/serialize';
import { defaultMeizitoRole } from '@/src/lib/meizito/team-server';
import { prisma } from '@/src/lib/db/prisma';

const log = meizitoModuleLog('members');

type RouteParams = { params: Promise<{ businessId: string; userId: string }> };

const patchSchema = z.object({
  jobTitle: z.string().max(200).optional(),
  department: z.string().max(200).optional(),
  mobile: z.string().max(50).optional(),
  extension: z.string().max(20).optional(),
  managerUserId: z.string().nullable().optional(),
  meizitoRole: z.enum(['member', 'manager', 'senior_manager']).optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId, userId } = await params;
    const access = await requireMeizitoManagerAccess(req, businessId);
    const body = patchSchema.parse(await req.json());

    const member = await prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId, userId } },
      include: {
        user: { select: { id: true, displayName: true, username: true } },
        profile: true,
      },
    });
    if (!member) throw new Error('NOT_FOUND');

    if (body.managerUserId) {
      const managerMember = await prisma.businessMember.findUnique({
        where: { businessId_userId: { businessId, userId: body.managerUserId } },
      });
      if (!managerMember) throw new Error('NOT_FOUND');
    }

    const profile = await prisma.businessMemberProfile.upsert({
      where: { memberId: member.id },
      create: {
        memberId: member.id,
        jobTitle: body.jobTitle ?? '',
        department: body.department ?? '',
        mobile: body.mobile ?? '',
        extension: body.extension ?? '',
        managerUserId: body.managerUserId ?? null,
        meizitoRole: body.meizitoRole ?? defaultMeizitoRole(member.role, 'member'),
      },
      update: {
        ...(body.jobTitle !== undefined ? { jobTitle: body.jobTitle } : {}),
        ...(body.department !== undefined ? { department: body.department } : {}),
        ...(body.mobile !== undefined ? { mobile: body.mobile } : {}),
        ...(body.extension !== undefined ? { extension: body.extension } : {}),
        ...(body.managerUserId !== undefined ? { managerUserId: body.managerUserId } : {}),
        ...(body.meizitoRole !== undefined ? { meizitoRole: body.meizitoRole } : {}),
      },
    });

    const updated = {
      ...member,
      profile,
    };
    const serialized = {
      ...serializeTeamMember(updated),
      role: defaultMeizitoRole(member.role, profile.meizitoRole),
    };

    log.info('member.profile.updated', { businessId, userId, actorId: access.user.id });
    await logMeizitoAction({
      actorId: access.user.id,
      action: 'member.profile.update',
      businessId,
      targetType: 'business_member',
      targetId: member.id,
      meta: { userId },
    });

    return jsonOk({ member: serialized });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.member.profile.patch');
  }
}
