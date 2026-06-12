import type { BusinessMemberRole, MeizitoMemberRole } from '@prisma/client';
import { prisma } from '@/src/lib/db/prisma';
import { listTeamDirectory, type TeamDirectoryFilter } from '@/src/lib/meizito/approval';
import { serializeTeamMember } from '@/src/lib/meizito/serialize';
import type { MeizitoMockUser, MeizitoMockUserRole } from '@/src/types/meizito';

const memberInclude = {
  user: { select: { id: true, displayName: true, username: true } },
  profile: true,
} as const;

export function defaultMeizitoRole(
  memberRole: BusinessMemberRole,
  profileRole: MeizitoMemberRole | null | undefined
): MeizitoMockUserRole {
  if (profileRole && profileRole !== 'member') return profileRole;
  if (memberRole === 'owner') return 'senior_manager';
  if (memberRole === 'admin') return 'manager';
  return 'member';
}

export async function ensureMemberProfiles(businessId: string) {
  const members = await prisma.businessMember.findMany({
    where: { businessId },
    select: { id: true, role: true, profile: { select: { memberId: true } } },
  });

  const missing = members.filter((m) => !m.profile);
  if (!missing.length) return;

  await prisma.businessMemberProfile.createMany({
    data: missing.map((m) => ({
      memberId: m.id,
      meizitoRole: defaultMeizitoRole(m.role, 'member'),
    })),
    skipDuplicates: true,
  });
}

export async function loadBusinessTeamMembers(businessId: string): Promise<MeizitoMockUser[]> {
  await ensureMemberProfiles(businessId);

  const rows = await prisma.businessMember.findMany({
    where: { businessId, user: { status: 'active' } },
    include: memberInclude,
    orderBy: [{ user: { displayName: 'asc' } }],
  });

  return rows.map((row) => {
    const base = serializeTeamMember(row);
    return {
      ...base,
      role: defaultMeizitoRole(row.role, row.profile?.meizitoRole),
    };
  });
}

export async function queryTeamDirectory(
  businessId: string,
  filter: TeamDirectoryFilter = 'all',
  search = ''
): Promise<MeizitoMockUser[]> {
  const members = await loadBusinessTeamMembers(businessId);
  return listTeamDirectory(members, filter, search);
}

export async function getBusinessMemberRow(businessId: string, userId: string) {
  return prisma.businessMember.findUnique({
    where: { businessId_userId: { businessId, userId } },
    include: memberInclude,
  });
}
