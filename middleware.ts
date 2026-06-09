import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createLogger } from '@/src/lib/logger';

const log = createLogger('middleware');

const PUBLIC_PREFIXES = ['/', '/login', '/invite', '/shop', '/blog', '/mobile'];
const PUBLIC_API_PREFIXES = ['/api/auth/login', '/api/invite/'];

function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) return true;
  if (pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)) return true;

  for (const prefix of PUBLIC_API_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }

  if (pathname === '/') return true;
  if (pathname.startsWith('/login')) return true;
  if (pathname.startsWith('/invite/')) return true;
  if (pathname.startsWith('/shop')) return true;
  if (pathname.startsWith('/blog')) return true;
  if (pathname.startsWith('/mobile')) return true;
  if (pathname.startsWith('/api/nextcloud')) return true;

  for (const prefix of PUBLIC_PREFIXES) {
    if (prefix !== '/' && pathname.startsWith(prefix)) return true;
  }

  return false;
}

function isProtected(pathname: string): boolean {
  return pathname.startsWith('/dashboard') || pathname.startsWith('/businesses');
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  const cookieName = process.env.AUTH_SESSION_COOKIE ?? 'nexa_session';
  const token = req.cookies.get(cookieName)?.value;

  if (!token) {
    log.debug('redirect unauthenticated', { pathname });
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/businesses/:path*'],
};
