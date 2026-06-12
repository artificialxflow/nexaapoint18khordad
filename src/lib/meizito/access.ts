import type { NextRequest } from 'next/server';
import {
  assertCanManageBusiness,
  requireBusinessAccess,
  type BusinessAccess,
} from '@/src/lib/business/access';
import { meizitoLog } from '@/src/lib/meizito/logger';

export type MeizitoAccess = BusinessAccess;

export async function requireMeizitoAccess(
  req: NextRequest,
  businessId: string
): Promise<MeizitoAccess> {
  const access = await requireBusinessAccess(req, businessId);
  meizitoLog.debug('access granted', {
    businessId,
    userId: access.user.id,
    memberRole: access.memberRole,
  });
  return access;
}

export async function requireMeizitoManagerAccess(
  req: NextRequest,
  businessId: string
): Promise<MeizitoAccess> {
  const access = await requireMeizitoAccess(req, businessId);
  assertCanManageBusiness(access.memberRole);
  return access;
}

export { assertCanManageBusiness, assertOwner } from '@/src/lib/business/access';
