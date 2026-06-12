import { createHash, randomBytes } from 'crypto';
import type { NextRequest } from 'next/server';
import type { SystemRole, User } from '@prisma/client';
import { prisma } from '@/src/lib/db/prisma';
import { getAuthConfig } from '@/src/lib/auth/config';
import { createLogger } from '@/src/lib/logger';

const log = createLogger('session');

export type SessionUser = User & { systemRole: SystemRole };

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

export function buildSessionCookie(token: string, expiresAt: Date): string {
  const { AUTH_SESSION_COOKIE, AUTH_COOKIE_SECURE } = getAuthConfig();
  const maxAgeSec = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  const parts = [
    `${AUTH_SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSec}`,
    `Expires=${expiresAt.toUTCString()}`,
  ];
  if (AUTH_COOKIE_SECURE) parts.push('Secure');
  return parts.join('; ');
}

export function buildClearSessionCookie(): string {
  const { AUTH_SESSION_COOKIE, AUTH_COOKIE_SECURE } = getAuthConfig();
  const parts = [
    `${AUTH_SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (AUTH_COOKIE_SECURE) parts.push('Secure');
  return parts.join('; ');
}

export function getSessionTokenFromRequest(req: NextRequest): string | null {
  const { AUTH_SESSION_COOKIE } = getAuthConfig();
  return req.cookies.get(AUTH_SESSION_COOKIE)?.value ?? null;
}

export async function getSessionUserFromRequest(req: NextRequest): Promise<SessionUser | null> {
  const raw = getSessionTokenFromRequest(req);
  if (!raw) return null;

  const tokenHash = hashToken(raw);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: { include: { systemRole: true } } },
  });

  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    log.info('session expired', { userId: session.userId });
    return null;
  }

  if (session.user.status !== 'active') return null;
  return session.user;
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
