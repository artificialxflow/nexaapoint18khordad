import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createLogger } from '@/src/lib/logger';

const log = createLogger('middleware');

function sessionCookieName(): string {
  return process.env.AUTH_SESSION_COOKIE ?? 'nexa_session';
}

function hasSessionCookie(req: NextRequest): boolean {
  return !!req.cookies.get(sessionCookieName())?.value;
}

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/businesses';
  return next;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/login')) {
    if (hasSessionCookie(req)) {
      const target = req.nextUrl.clone();
      target.pathname = safeNextPath(req.nextUrl.searchParams.get('next'));
      target.search = '';
      log.debug('redirect authenticated user away from login', { next: target.pathname });
      return NextResponse.redirect(target);
    }
    return NextResponse.next();
  }

  const isProtected =
    pathname.startsWith('/dashboard') || pathname.startsWith('/businesses');

  if (!isProtected) {
    return NextResponse.next();
  }

  if (!hasSessionCookie(req)) {
    log.debug('redirect unauthenticated', { pathname });
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/dashboard/:path*', '/businesses/:path*'],
};
