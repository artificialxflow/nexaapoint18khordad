import { prisma } from '@/src/lib/db/prisma';
import { getAuthConfig } from '@/src/lib/auth/config';
import { handleAuthRouteError, jsonError, jsonOk } from '@/src/lib/auth/api';
import { verifyOtpCode } from '@/src/lib/auth/otp';
import { requireExistingUser } from '@/src/lib/auth/users';
import { serializeAuthUser } from '@/src/lib/auth/rbac';
import { createSession, getClientMeta } from '@/src/lib/auth/session';
import { logAuth, maskMobile } from '@/src/lib/logger';
import { normalizeMobile, MobileValidationError } from '@/src/lib/auth/mobile';

export async function POST(req: Request) {
  try {
    getAuthConfig();
    const body = (await req.json()) as { mobile?: string; code?: string };
    if (!body.mobile?.trim() || !body.code?.trim()) {
      return jsonError('VALIDATION_ERROR', 'موبایل و کد الزامی است', 400);
    }

    const { display } = normalizeMobile(body.mobile);
    const masked = maskMobile(display);
    logAuth.info('otp verify requested', { mobile: masked });

    await verifyOtpCode(body.mobile, body.code.trim());

    const user = await requireExistingUser(body.mobile);
    if (!user) {
      return jsonError('AUTH_USER_NOT_FOUND', 'دسترسی ندارید — با مدیر سیستم تماس بگیرید', 403);
    }

    if (user.status !== 'active') {
      return jsonError('AUTH_USER_INACTIVE', 'حساب کاربری غیرفعال است', 403);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { ip, userAgent } = getClientMeta(req);
    const session = await createSession(user.id, ip, userAgent);

    return jsonOk(
      { user: serializeAuthUser(user) },
      { headers: { 'Set-Cookie': session.cookie } }
    );
  } catch (err) {
    if (err instanceof MobileValidationError) {
      return jsonError(err.code, err.message, 400);
    }
    return handleAuthRouteError(err);
  }
}