import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/lib/db/prisma';
import { handleAuthRouteError, jsonError, jsonOk } from '@/src/lib/auth/api';
import { canAssignRole, canManageUser, hasPermission, serializeAuthUser } from '@/src/lib/auth/rbac';
import { requireSessionUser } from '@/src/lib/auth/session';
import { findUserById } from '@/src/lib/auth/users';
import { createLogger } from '@/src/lib/logger';

const log = createLogger('admin');

type RouteContext = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  displayName: z.string().min(1).optional(),
  systemRoleId: z.string().min(1).optional(),
  status: z.enum(['active', 'disabled']).optional(),
  mustChangePassword: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const actor = await requireSessionUser(req);
    if (!hasPermission(actor.systemRole, 'users:write')) throw new Error('FORBIDDEN');

    const { id } = await context.params;
    const target = await findUserById(id);
    if (!target) return jsonError('NOT_FOUND', 'کاربر یافت نشد.', 404);

    if (target.id !== actor.id && !canManageUser(actor.systemRole, target.systemRole)) {
      return jsonError('FORBIDDEN', 'اجازه ویرایش این کاربر را ندارید.', 403);
    }

    const body = patchSchema.parse(await req.json());
    const data: Record<string, unknown> = {};

    if (body.displayName !== undefined) data.displayName = body.displayName.trim();
    if (body.status !== undefined) {
      if (target.id === actor.id && body.status === 'disabled') {
        return jsonError('FORBIDDEN', 'نمی‌توانید حساب خود را غیرفعال کنید.', 403);
      }
      data.status = body.status;
    }
    if (body.mustChangePassword !== undefined) data.mustChangePassword = body.mustChangePassword;

    if (body.systemRoleId !== undefined) {
      const role = await prisma.systemRole.findUnique({ where: { id: body.systemRoleId } });
      if (!role) return jsonError('NOT_FOUND', 'نقش یافت نشد.', 404);
      if (!canAssignRole(actor.systemRole, role)) {
        return jsonError('FORBIDDEN', 'اجازه تعیین این نقش را ندارید.', 403);
      }
      if (!canManageUser(actor.systemRole, target.systemRole) && target.id !== actor.id) {
        return jsonError('FORBIDDEN', 'اجازه ویرایش نقش این کاربر را ندارید.', 403);
      }
      data.systemRoleId = role.id;
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      include: { systemRole: true },
    });

    log.info('user updated', { actorId: actor.id, targetId: id });
    return jsonOk({ user: serializeAuthUser(updated) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError('VALIDATION_ERROR', 'ورودی نامعتبر است.', 400);
    }
    return handleAuthRouteError(err, 'admin.users.patch');
  }
}
