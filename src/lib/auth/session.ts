import { createHash, randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import type { SystemRole, User } from '@prisma/client';
import { prisma } from '@/src/lib/db/prisma';
import { getAuthConfig } from '@/src/lib/auth/config';
import { createLogger } from '@/src/lib/logger';

const log = createLogger('session');

export type SessionUser = User & { systemRole: SystemRole };

export type SessionLookup = {
  user: SessionUser;
  token: string;
  expiresAt: Date;
  renewed: boolean;
};

function hashToken(token: string): string {
  const secret = getAuthConfig().AUTH_SESSION_SECRET;
  return createHash('sha256').update(`${token}:${secret}`).digest('hex');
}

function sessionExpiryDate(): Date {
  const { AUTH_SESSION_TTL_DAYS } = getAuthConfig();
  const d = new Date();
  d.setDate(d.getDate() + AUTH_SESSION_TTL_DAYS);
  return d;
}

function renewThresholdMs(): number {
  const { AUTH_SESSION_TTL_DAYS } = getAuthConfig();
  const renewWhenDays = Math.max(1, Math.floor(AUTH_SESSION_TTL_DAYS / 2));
  return renewWhenDays * 24 * 60 * 60 * 1000;
}

export function resolveCookieSecure(req?: Pick<NextRequest, 'headers' | 'nextUrl'>): boolean {
  const { AUTH_COOKIE_SECURE, NEXT_PUBLIC_APP_URL } = getAuthConfig();
  const forwardedProto = req?.headers.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase();
  if (forwardedProto === 'http') return false;
  if (forwardedProto === 'https') return true;
  if (req?.nextUrl.protocol === 'http:') return false;
  if (req?.nextUrl.protocol === 'https:') return true;
  if (NEXT_PUBLIC_APP_URL.startsWith('http://')) return false;
  return AUTH_COOKIE_SECURE;
}

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

export async function createSession(
  userId: string,
  req?: Pick<NextRequest, 'headers'>
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = sessionExpiryDate();

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      ip: req?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req?.headers.get('x-real-ip') ?? undefined,
      userAgent: req?.headers.get('user-agent') ?? undefined,
    },
  });

  log.info('session created', { userId, expiresAt: expiresAt.toISOString() });
  return { token, expiresAt };
}

export async function setSessionCookie(
  token: string,
  expiresAt: Date,
  req?: Pick<NextRequest, 'headers' | 'nextUrl'>
): Promise<void> {
  const { AUTH_SESSION_COOKIE } = getAuthConfig();
  const maxAgeSec = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  const store = await cookies();
  store.set({
    name: AUTH_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: resolveCookieSecure(req),
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSec,
    expires: expiresAt,
  });
}

export async function clearSessionCookie(req?: Pick<NextRequest, 'headers' | 'nextUrl'>): Promise<void> {
  const { AUTH_SESSION_COOKIE } = getAuthConfig();
  const store = await cookies();
  store.set({
    name: AUTH_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    secure: resolveCookieSecure(req),
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/** @deprecated Use setSessionCookie — kept for callers that append Set-Cookie manually */
export function buildSessionCookie(token: string, expiresAt: Date, req?: Pick<NextRequest, 'headers' | 'nextUrl'>): string {
  const { AUTH_SESSION_COOKIE } = getAuthConfig();
  const maxAgeSec = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  const parts = [
    `${AUTH_SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSec}`,
    `Expires=${expiresAt.toUTCString()}`,
  ];
  if (resolveCookieSecure(req)) parts.push('Secure');
  return parts.join('; ');
}

/** @deprecated Use clearSessionCookie */
export function buildClearSessionCookie(req?: Pick<NextRequest, 'headers' | 'nextUrl'>): string {
  const { AUTH_SESSION_COOKIE } = getAuthConfig();
  const parts = [
    `${AUTH_SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (resolveCookieSecure(req)) parts.push('Secure');
  return parts.join('; ');
}

export function getSessionTokenFromRequest(req: NextRequest): string | null {
  const { AUTH_SESSION_COOKIE } = getAuthConfig();
  return req.cookies.get(AUTH_SESSION_COOKIE)?.value ?? null;
}

async function loadSessionRecord(raw: string) {
  const tokenHash = hashToken(raw);
  return prisma.session.findUnique({
    where: { tokenHash },
    include: { user: { include: { systemRole: true } } },
  });
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionLookup | null> {
  const raw = getSessionTokenFromRequest(req);
  if (!raw) return null;

  const session = await loadSessionRecord(raw);
  if (!session) return null;

  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    log.info('session expired', { userId: session.userId });
    return null;
  }

  if (session.user.status !== 'active') return null;

  const msLeft = session.expiresAt.getTime() - Date.now();
  let expiresAt = session.expiresAt;
  let renewed = false;

  if (msLeft < renewThresholdMs()) {
    expiresAt = sessionExpiryDate();
    await prisma.session.update({
      where: { id: session.id },
      data: { expiresAt },
    });
    renewed = true;
    log.info('session renewed', { userId: session.userId, expiresAt: expiresAt.toISOString() });
  }

  return {
    user: session.user,
    token: raw,
    expiresAt,
    renewed,
  };
}

export async function getSessionUserFromRequest(req: NextRequest): Promise<SessionUser | null> {
  const session = await getSessionFromRequest(req);
  return session?.user ?? null;
}

export async function destroySessionFromRequest(req: NextRequest): Promise<void> {
  const raw = getSessionTokenFromRequest(req);
  if (!raw) return;
  const tokenHash = hashToken(raw);
  await prisma.session.deleteMany({ where: { tokenHash } });
  log.info('session destroyed');
}

export async function requireSessionUser(req: NextRequest): Promise<SessionUser> {
  const user = await getSessionUserFromRequest(req);
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}
