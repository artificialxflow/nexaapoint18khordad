import { prisma } from '@/src/lib/db/prisma';
import { createLogger } from '@/src/lib/logger';

const log = createLogger('admin');

export async function writeAuditLog(params: {
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string;
  meta?: Record<string, unknown>;
}) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        meta: params.meta ?? undefined,
      },
    });
  } catch (err) {
    log.warn('audit log failed', {
      action: params.action,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
