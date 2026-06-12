import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AuthConfigError } from '@/src/lib/auth/config';
import { createLogger } from '@/src/lib/logger';

const log = createLogger('auth');

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: true, data }, init);
}

export function jsonError(
  code: string,
  message: string,
  status = 400,
  details?: unknown
): NextResponse {
  return NextResponse.json({ ok: false, error: { code, message, details } }, { status });
}

export function handleAuthRouteError(err: unknown, context: string): NextResponse {
  if (err instanceof AuthConfigError) {
    log.error(`${context} config error`, { error: err.message });
    return jsonError('CONFIG_ERROR', err.message, 503);
  }

  if (err instanceof ZodError) {
    log.error(`${context} validation error`, { error: err.message });
    return jsonError('CONFIG_ERROR', 'تنظیمات سرور ناقص است. با مدیر سیستم تماس بگیرید.', 503);
  }

  if (err instanceof Error) {
    if (err.message === 'UNAUTHORIZED') {
      return jsonError('UNAUTHORIZED', 'لطفاً وارد شوید.', 401);
    }
    if (err.message === 'FORBIDDEN') {
      return jsonError('FORBIDDEN', 'دسترسی مجاز نیست.', 403);
    }
    if (err.message === 'NOT_FOUND') {
      return jsonError('NOT_FOUND', 'مورد یافت نشد.', 404);
    }
  }

  log.error(`${context} failed`, {
    error: err instanceof Error ? err.message : String(err),
  });
  return jsonError('INTERNAL_ERROR', 'خطای داخلی سرور.', 500);
}

export function appendSetCookie(response: NextResponse, cookie: string): NextResponse {
  response.headers.append('Set-Cookie', cookie);
  return response;
}
