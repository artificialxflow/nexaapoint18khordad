import { NextRequest } from 'next/server';
import { prisma } from '@/src/lib/db/prisma';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { isSuperAdmin } from '@/src/lib/auth/rbac';
import { requireSessionUser } from '@/src/lib/auth/session';

export async function GET(req: NextRequest) {
  try {
    const actor = await requireSessionUser(req);
    if (!isSuperAdmin(actor.systemRole)) throw new Error('FORBIDDEN');

    const logs = await prisma.adminAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { actor: { select: { displayName: true } } },
    });

    return jsonOk({
      logs: logs.map((l) => ({
        id: l.id,
        action: l.action,
        targetType: l.targetType,
        targetId: l.targetId,
        actor: l.actor.displayName,
        createdAt: l.createdAt,
      })),
    });
  } catch (err) {
    return handleAuthRouteError(err, 'admin.audit.list');
  }
}
