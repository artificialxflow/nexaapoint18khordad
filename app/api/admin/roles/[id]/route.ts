import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/lib/db/prisma';
import { writeAuditLog } from '@/src/lib/auth/audit';
import { handleAuthRouteError, jsonError, jsonOk } from '@/src/lib/auth/api';
import { getPermissions, isSuperAdmin } from '@/src/lib/auth/rbac';
import { requireSessionUser } from '@/src/lib/auth/session';
import { createLogger } from '@/src/lib/logger';

const log = createLogger('admin');

type RouteContext = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  permissions: z.record(z.boolean()).optional(),
});

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const actor = await requireSessionUser(req);
    if (!isSuperAdmin(actor.systemRole)) throw new Error('FORBIDDEN');

    const { id } = await context.params;
    const role = await prisma.systemRole.findUnique({ where: { id } });
    if (!role) return jsonError('NOT_FOUND', 'نقش یافت نشد.', 404);
    if (role.slug === 'super_admin') {
      return jsonError('FORBIDDEN', 'نقش مدیر کل قابل ویرایش نیست.', 403);
    }

    const body = patchSchema.parse(await req.json());
    if (!body.permissions) return jsonError('VALIDATION_ERROR', 'permissions الزامی است.', 400);

    const updated = await prisma.systemRole.update({
      where: { id },
      data: { permissions: body.permissions },
    });

    await writeAuditLog({
      actorId: actor.id,
      action: 'role.permissions.update',
      targetType: 'SystemRole',
      targetId: id,
      meta: { slug: role.slug },
    });

    log.info('role permissions updated', { actorId: actor.id, roleId: id });
    return jsonOk({ role: { id: updated.id, permissions: getPermissions(updated) } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError('VALIDATION_ERROR', 'ورودی نامعتبر است.', 400);
    }
    return handleAuthRouteError(err, 'admin.roles.patch');
  }
}
