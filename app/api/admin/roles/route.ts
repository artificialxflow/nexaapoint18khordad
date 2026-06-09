import { NextRequest } from 'next/server';
import { prisma } from '@/src/lib/db/prisma';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { PERMISSION_CATALOG } from '@/src/lib/auth/permissions-catalog';
import { getPermissions, hasPermission } from '@/src/lib/auth/rbac';
import { requireSessionUser } from '@/src/lib/auth/session';

export async function GET(req: NextRequest) {
  try {
    const actor = await requireSessionUser(req);
    if (!hasPermission(actor.systemRole, 'users:read')) throw new Error('FORBIDDEN');

    const roles = await prisma.systemRole.findMany({
      orderBy: { level: 'desc' },
      include: { _count: { select: { users: true } } },
    });

    return jsonOk({
      roles: roles.map((r) => ({
        id: r.id,
        slug: r.slug,
        nameFa: r.nameFa,
        level: r.level,
        isSystem: r.isSystem,
        permissions: getPermissions(r),
        userCount: r._count.users,
      })),
      catalog: PERMISSION_CATALOG,
    });
  } catch (err) {
    return handleAuthRouteError(err, 'admin.roles.list');
  }
}
