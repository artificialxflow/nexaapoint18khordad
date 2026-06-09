import { createHash, randomBytes } from 'crypto';
import { prisma } from '@/src/lib/db/prisma';
import { getAppBaseUrl, getAuthConfig } from '@/src/lib/auth/config';
import { createLogger } from '@/src/lib/logger';

const log = createLogger('invite');

function hashInviteToken(token: string): string {
  const secret = getAuthConfig().AUTH_SESSION_SECRET;
  return createHash('sha256').update(`invite:${token}:${secret}`).digest('hex');
}

export function generateInviteToken(): string {
  return randomBytes(24).toString('hex');
}

export async function createInvite(params: {
  systemRoleId: string;
  createdById: string;
  expiresInDays?: number;
  note?: string;
  displayName?: string;
  credentialMode?: 'self' | 'manual' | 'auto';
  presetUsername?: string;
  presetPasswordHash?: string;
}) {
  const token = generateInviteToken();
  const tokenHash = hashInviteToken(token);
  const days = params.expiresInDays ?? 7;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);

  const invite = await prisma.inviteToken.create({
    data: {
      tokenHash,
      systemRoleId: params.systemRoleId,
      createdById: params.createdById,
      expiresAt,
      note: params.note,
      displayName: params.displayName?.trim() || null,
      credentialMode: params.credentialMode ?? 'self',
      presetUsername: params.presetUsername ?? null,
      presetPasswordHash: params.presetPasswordHash ?? null,
    },
    include: { systemRole: true },
  });

  const url = `${getAppBaseUrl()}/invite/${token}`;
  log.info('invite created', {
    inviteId: invite.id,
    role: invite.systemRole.slug,
    credentialMode: invite.credentialMode,
    expiresAt,
  });

  return { invite, url, rawToken: token };
}

export async function findInviteByRawToken(rawToken: string) {
  const tokenHash = hashInviteToken(rawToken);
  return prisma.inviteToken.findUnique({
    where: { tokenHash },
    include: { systemRole: true, createdBy: { select: { displayName: true } } },
  });
}

export function getInviteValidationError(invite: {
  usedAt: Date | null;
  expiresAt: Date;
}): string | null {
  if (invite.usedAt) return 'این لینک دعوت قبلاً استفاده شده است.';
  if (invite.expiresAt <= new Date()) return 'لینک دعوت منقضی شده است.';
  return null;
}

export async function revokeInvite(inviteId: string, actorId: string) {
  const invite = await prisma.inviteToken.findUnique({ where: { id: inviteId } });
  if (!invite) throw new Error('NOT_FOUND');
  if (invite.usedAt) throw new Error('ALREADY_USED');
  await prisma.inviteToken.delete({ where: { id: inviteId } });
  log.info('invite revoked', { inviteId, actorId });
}
