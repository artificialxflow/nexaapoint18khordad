import type { BusinessMemberRole } from '@prisma/client';
import type { NextRequest } from 'next/server';
import { prisma } from '@/src/lib/db/prisma';
import { requireSessionUser, type SessionUser } from '@/src/lib/auth/session';

export type BusinessAccess = {
  user: SessionUser;
  businessId: string;
  memberRole: BusinessMemberRole;
};

export async function requireBusinessAccess(
  req: NextRequest,
  businessId: string
): Promise<BusinessAccess> {
  const user = await requireSessionUser(req);

  const business = await prisma.business.findFirst({
    where: { id: businessId, status: 'active' },
  });
  if (!business) throw new Error('NOT_FOUND');

  const member = await prisma.businessMember.findUnique({
    where: { businessId_userId: { businessId, userId: user.id } },
  });
  if (!member) throw new Error('FORBIDDEN');

  return { user, businessId, memberRole: member.role };
}

export function assertCanManageBusiness(role: BusinessMemberRole): void {
  if (role !== 'owner' && role !== 'admin') throw new Error('FORBIDDEN');
}

export function assertOwner(role: BusinessMemberRole): void {
  if (role !== 'owner') throw new Error('FORBIDDEN');
}
