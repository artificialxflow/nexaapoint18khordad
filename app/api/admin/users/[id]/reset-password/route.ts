import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/lib/db/prisma';
import { handleAuthRouteError, jsonError, jsonOk } from '@/src/lib/auth/api';
import { hashPassword } from '@/src/lib/auth/password';
import { canManageUser, hasPermission } from '@/src/lib/auth/rbac';
import { requireSessionUser } from '@/src/lib/auth/session';
import { findUserById, validatePassword } from '@/src/lib/auth/users';
import { createLogger } from '@/src/lib/logger';

const log = createLogger('admin');

type RouteContext = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  newPassword: z.string().min(1),
});

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const actor = await requireSessionUser(req);
    if (!hasPermission(actor.systemRole, 'users:write')) throw new Error('FORBIDDEN');

    const { id } = await context.params;
    const target = await findUserById(id);
    if (!target) return jsonError('NOT_FOUND', 'کاربر یافت نشد.', 404);

    if (!canManageUser(actor.systemRole, target.systemRole) && target.id !== actor.id) {
      return jsonError('FORBIDDEN', 'اجازه تغییر رمز این کاربر را ندارید.', 403);
    }

    const body = bodySchema.parse(await req.json());
    const passwordError = validatePassword(body.newPassword);
    if (passwordError) return jsonError('VALIDATION_ERROR', passwordError, 400);

    const passwordHash = await hashPassword(body.newPassword);
    await prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: false },
    });

    await prisma.session.deleteMany({ where: { userId: id } });

    log.info('password reset', { actorId: actor.id, targetId: id });
    return jsonOk({ reset: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError('VALIDATION_ERROR', 'ورودی نامعتبر است.', 400);
    }
    return handleAuthRouteError(err, 'admin.users.reset-password');
  }
}
