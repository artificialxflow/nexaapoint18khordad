import type { Business, BusinessMember, BusinessMemberRole, BusinessPlan } from '@prisma/client';
import type { NexaBusiness, NexaBusinessRole } from '@/src/types/business';

function mapRole(role: BusinessMemberRole): NexaBusinessRole {
  if (role === 'owner') return 'owner';
  if (role === 'admin') return 'admin';
  return 'member';
}

export function serializeBusiness(
  business: Business,
  membership: Pick<BusinessMember, 'role'>
): NexaBusiness {
  return {
    id: business.id,
    name: business.name,
    role: mapRole(membership.role),
    plan: business.plan as NexaBusiness['plan'],
    expiresAt: business.expiresAt?.toISOString(),
    creditLabel: business.creditLabel,
    createdAt: business.createdAt.toISOString(),
    isArchived: business.status === 'archived',
  };
}
