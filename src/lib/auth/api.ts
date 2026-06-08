import { NextResponse } from 'next/server';
import { MobileValidationError } from '@/src/lib/auth/mobile';
import { OtpError } from '@/src/lib/auth/otp';
import { SmsIrError } from '@/src/lib/sms/smsIrClient';
import { logAuth } from '@/src/lib/logger';

export function jsonOk<T extends Record<string, unknown>>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...data }, init);
}

export function jsonError(
  code: string,
  message: string,
  status = 400,
  extra?: Record<string, unknown>
) {
  return NextResponse.json({ ok: false, code, message, ...extra }, { status });
}

export function handleAuthRouteError(err: unknown) {
  if (err instanceof MobileValidationError) {
    return jsonError(err.code, err.message, 400);
  }
  if (err instanceof OtpError) {
    const status =
      err.code === 'OTP_MAX_ATTEMPTS' ? 429 : err.code === 'OTP_RESEND_TOO_SOON' ? 429 : 400;
    return jsonError(err.code, err.message, status);
  }
  if (err instanceof SmsIrError) {
    logAuth.error('sms send failed', { message: err.message });
    return jsonError(err.code, err.message, 502);
  }
  if (err instanceof Error && err.message.includes('[auth] Invalid environment')) {
    logAuth.error('config error', { message: err.message });
    return jsonError('CONFIG_ERROR', 'پیکربندی سرور ناقص است', 500);
  }
  logAuth.error('unexpected error', {
    message: err instanceof Error ? err.message : String(err),
  });
  return jsonError('INTERNAL_ERROR', 'خطای غیرمنتظره', 500);
}
