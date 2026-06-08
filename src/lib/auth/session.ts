import { createHash, randomBytes } from 'crypto';
import type { SystemRole, User } from '@prisma/client';
import { getAuthConfig, isProduction } from '@/src/lib/auth/config';
import { prisma } from '@/src/lib/db/prisma';
import { logAuth } from '@/src/lib/logger';

export type SessionUser = User & { systemRole: SystemRole };

const TOKEN_BYTES = 32;

function hashToken(token: string): string {
  const secret = getAuthConfig().OTP_SIGNING_SECRET;
  return createHash('sha256').update(`${secret}:session:${token}`).digest('hex');
}

export function getSessionCookieName(): string {
  return getAuthConfig().AUTH_SESSION_COOKIE;
}

export function buildSessionCookie(token: string, expiresAt: Date): string {
  const name = getSessionCookieName();
  const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  const parts = [
    `${name}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (isProduction()) parts.push('Secure');
  return parts.join('; ');
}

export function buildClearSessionCookie(): string {
  const name = getSessionCookieName();
  const parts = [`${name}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (isProduction()) parts.push('Secure');
  return parts.join('; ');
}

export function readSessionTokenFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const name = getSessionCookieName();
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name && rest.length) return rest.join('=');
  }
  return null;
}

export async function createSession(
  userId: string,
  ip?: string | null,
  userAgent?: string | null
): Promise<{ token: string; expiresAt: Date; cookie: string }> {
  const cfg = getAuthConfig();
  const token = randomBytes(TOKEN_BYTES).toString('hex');
  const expiresAt = new Date(Date.now() + cfg.AUTH_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      ip: ip ?? undefined,
      userAgent: userAgent ?? undefined,
    },
  });

  logAuth.info('session created', { userId, expiresAt: expiresAt.toISOString() });

  return { token, expiresAt, cookie: buildSessionCookie(token, expiresAt) };
}

export async function getSessionUser(token: string | null): Promise<SessionUser | null> {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { systemRole: true } } },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    logAuth.info('session expired', { sessionId: session.id });
    return null;
  }
  return session.user;
}

export async function destroySession(token: string | null): Promise<void> {
  if (!token) return;
  const hash = hashToken(token);
  const deleted = await prisma.session.deleteMany({ where: { tokenHash: hash } });
  logAuth.info('session destroyed', { count: deleted.count });
}

export function getClientMeta(req: Request): { ip: string | null; userAgent: string | null } {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip');
  return { ip: ip ?? null, userAgent: req.headers.get('user-agent') };
}
