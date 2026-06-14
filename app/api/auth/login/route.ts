import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/lib/db/prisma';
import { handleAuthRouteError, jsonError, jsonOk } from '@/src/lib/auth/api';
import { verifyPassword } from '@/src/lib/auth/password';
import { serializeAuthUser } from '@/src/lib/auth/rbac';
import { createSession, setSessionCookie } from '@/src/lib/auth/session';
import { findUserByUsername, normalizeUsername } from '@/src/lib/auth/users';
import { createLogger, maskUsername } from '@/src/lib/logger';

const log = createLogger('auth');

const bodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = bodySchema.parse(await req.json());
    const username = normalizeUsername(body.username);

    log.info('login attempt', { username: maskUsername(username) });

    const user = await findUserByUsername(username);
    if (!user) {
      log.warn('login failed: user not found', { username: maskUsername(username) });
      return jsonError('INVALID_CREDENTIALS', 'نام کاربری یا رمز عبور اشتباه است.', 401);
    }

    if (user.status !== 'active') {
      log.warn('login failed: disabled', { userId: user.id });
      return jsonError('USER_DISABLED', 'حساب کاربری غیرفعال است.', 403);
    }

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) {
      log.warn('login failed: bad password', { userId: user.id });
      return jsonError('INVALID_CREDENTIALS', 'نام کاربری یا رمز عبور اشتباه است.', 401);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { token, expiresAt } = await createSession(user.id, req);
    await setSessionCookie(token, expiresAt, req);
    const response = jsonOk({ user: serializeAuthUser(user) });

    log.info('login success', { userId: user.id, role: user.systemRole.slug });
    return response;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError('VALIDATION_ERROR', 'ورودی نامعتبر است.', 400);
    }
    return handleAuthRouteError(err, 'login');
  }
}
