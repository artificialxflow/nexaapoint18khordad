import { getAuthConfig } from '@/src/lib/auth/config';
import { handleAuthRouteError, jsonError, jsonOk } from '@/src/lib/auth/api';
import { createAndSendOtp } from '@/src/lib/auth/otp';
import { requireExistingUser } from '@/src/lib/auth/users';
import { getClientMeta } from '@/src/lib/auth/session';
import { logAuth, maskMobile } from '@/src/lib/logger';
import { normalizeMobile, MobileValidationError } from '@/src/lib/auth/mobile';

export async function POST(req: Request) {
  try {
    getAuthConfig();
    const body = (await req.json()) as { mobile?: string };
    if (!body.mobile?.trim()) {
      return jsonError('VALIDATION_ERROR', 'شماره موبایل الزامی است', 400);
    }

    const { display } = normalizeMobile(body.mobile);
    const masked = maskMobile(display);
    logAuth.info('otp send requested', { mobile: masked });

    const user = await requireExistingUser(body.mobile);
    if (!user) {
      return jsonError('AUTH_USER_NOT_FOUND', 'دسترسی ندارید — با مدیر سیستم تماس بگیرید', 403);
    }

    if (user.status !== 'active') {
      return jsonError('AUTH_USER_INACTIVE', 'حساب کاربری غیرفعال است', 403);
    }

    const { ip, userAgent } = getClientMeta(req);
    const { resendAfterSeconds } = await createAndSendOtp(body.mobile, ip, userAgent);

    return jsonOk({ resendAfterSeconds });
  } catch (err) {
    if (err instanceof MobileValidationError) {
      return jsonError(err.code, err.message, 400);
    }
    return handleAuthRouteError(err);
  }
}
