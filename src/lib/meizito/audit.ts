import type { Prisma } from '@prisma/client';
import { writeAuditLog } from '@/src/lib/auth/audit';
import { meizitoLog } from '@/src/lib/meizito/logger';

export async function logMeizitoAction(params: {
  actorId: string;
  action: string;
  businessId: string;
  targetType: string;
  targetId?: string;
  meta?: Prisma.InputJsonValue;
}) {
  const action = params.action.startsWith('meizito.') ? params.action : `meizito.${params.action}`;
  meizitoLog.info(action, {
    businessId: params.businessId,
    targetType: params.targetType,
    targetId: params.targetId,
    actorId: params.actorId,
  });
  await writeAuditLog({
    actorId: params.actorId,
    action,
    targetType: params.targetType,
    targetId: params.targetId,
    meta: {
      businessId: params.businessId,
      ...(params.meta && typeof params.meta === 'object' && !Array.isArray(params.meta)
        ? (params.meta as Record<string, unknown>)
        : { detail: params.meta }),
    },
  });
}
