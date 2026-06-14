import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/lib/db/prisma';
import { handleAuthRouteError, jsonError, jsonOk } from '@/src/lib/auth/api';
import { hashPassword, verifyPassword } from '@/src/lib/auth/password';
import { validatePassword } from '@/src/lib/auth/users';
import { requireSessionUser, destroySessionFromRequest, createSession, setSessionCookie } from '@/src/lib/auth/session';
import { createLogger } from '@/src/lib/logger';

const log = createLogger('auth');

const bodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireSessionUser(req);
    const body = bodySchema.parse(await req.json());

    const passwordError = validatePassword(body.newPassword);
    if (passwordError) return jsonError('VALIDATION_ERROR', passwordError, 400);

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return jsonError('NOT_FOUND', 'کاربر یافت نشد.', 404);

    const valid = await verifyPassword(body.currentPassword, dbUser.passwordHash);
    if (!valid) return jsonError('INVALID_CREDENTIALS', 'رمز فعلی اشتباه است.', 401);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(body.newPassword),
        mustChangePassword: false,
      },
    });

    await destroySessionFromRequest(req);
    const { token, expiresAt } = await createSession(user.id, req);
    await setSessionCookie(token, expiresAt, req);

    log.info('password changed', { userId: user.id });
    return jsonOk({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError('VALIDATION_ERROR', 'ورودی نامعتبر است.', 400);
    }
    return handleAuthRouteError(err, 'auth.change-password');
  }
}
