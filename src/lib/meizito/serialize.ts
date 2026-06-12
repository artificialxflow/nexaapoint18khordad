import type { BusinessMember, BusinessMemberProfile, User } from '@prisma/client';
import type { MeizitoMockUser, MeizitoMockUserRole } from '@/src/types/meizito';

type MemberWithUser = BusinessMember & {
  user: Pick<User, 'id' | 'displayName' | 'username'>;
  profile: BusinessMemberProfile | null;
};

/** Map DB member → MeizitoMockUser shape (UI unchanged). Expanded in phase 1. */
export function serializeTeamMember(row: MemberWithUser): MeizitoMockUser {
  const profile = row.profile;
  return {
    id: row.user.id,
    name: row.user.displayName,
    role: (profile?.meizitoRole ?? 'member') as MeizitoMockUserRole,
    managerId: profile?.managerUserId ?? undefined,
    department: profile?.department || undefined,
    jobTitle: profile?.jobTitle || undefined,
    mobile: profile?.mobile || undefined,
    extension: profile?.extension || undefined,
  };
}
