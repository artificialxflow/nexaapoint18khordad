import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/lib/db/prisma';
import { handleAuthRouteError, jsonError, jsonOk } from '@/src/lib/auth/api';
import { findInviteByRawToken, getInviteValidationError } from '@/src/lib/auth/invites';
import { hashPassword } from '@/src/lib/auth/password';
import { serializeAuthUser } from '@/src/lib/auth/rbac';
import {
  findUserByUsername,
  normalizeUsername,
  validatePassword,
  validateUsername,
} from '@/src/lib/auth/users';
import { createLogger } from '@/src/lib/logger';

const log = createLogger('invite');

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    const invite = await findInviteByRawToken(token);
    if (!invite) return jsonError('INVALID_INVITE', 'لینک دعوت نامعتبر است.', 404);

    const validationError = getInviteValidationError(invite);
    if (validationError) return jsonError('INVALID_INVITE', validationError, 410);

    return jsonOk({
      invite: {
        role: {
          slug: invite.systemRole.slug,
          nameFa: invite.systemRole.nameFa,
        },
        expiresAt: invite.expiresAt,
        invitedBy: invite.createdBy.displayName,
        note: invite.note,
        displayName: invite.displayName,
        credentialMode: invite.credentialMode,
        presetUsername: invite.presetUsername,
      },
    });
  } catch (err) {
    return handleAuthRouteError(err, 'invite.get');
  }
}

const acceptSchema = z.object({
  username: z.string().optional(),
  password: z.string().optional(),
  displayName: z.string().optional(),
});

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    const invite = await findInviteByRawToken(token);
    if (!invite) return jsonError('INVALID_INVITE', 'لینک دعوت نامعتبر است.', 404);

    const validationError = getInviteValidationError(invite);
    if (validationError) return jsonError('INVALID_INVITE', validationError, 410);

    const body = acceptSchema.parse(await req.json());

    let username: string;
    let passwordHash: string;
    let displayName: string;
    let mustChangePassword = false;

    if (invite.credentialMode === 'self') {
      if (!body.username || !body.password || !body.displayName) {
        return jsonError('VALIDATION_ERROR', 'نام، نام کاربری و رمز عبور الزامی است.', 400);
      }
      const usernameError = validateUsername(body.username);
      if (usernameError) return jsonError('VALIDATION_ERROR', usernameError, 400);
      const passwordError = validatePassword(body.password);
      if (passwordError) return jsonError('VALIDATION_ERROR', passwordError, 400);
      username = normalizeUsername(body.username);
      passwordHash = await hashPassword(body.password);
      displayName = body.displayName.trim();
    } else {
      if (!invite.presetUsername || !invite.presetPasswordHash) {
        return jsonError('INVALID_INVITE', 'اطلاعات دعوت ناقص است.', 410);
      }
      username = invite.presetUsername;
      passwordHash = invite.presetPasswordHash;
      displayName = (invite.displayName ?? body.displayName ?? username).trim();
      mustChangePassword = invite.credentialMode === 'auto';
    }

    const existing = await findUserByUsername(username);
    if (existing) return jsonError('USERNAME_TAKEN', 'این نام کاربری قبلاً ثبت شده است.', 409);

    const user = await prisma.$transaction(async (tx) => {
      const fresh = await tx.inviteToken.findUnique({ where: { id: invite.id } });
      if (!fresh || fresh.usedAt || fresh.expiresAt <= new Date()) {
        throw new Error('INVALID_INVITE');
      }

      const created = await tx.user.create({
        data: {
          username,
          passwordHash,
          displayName,
          systemRoleId: invite.systemRoleId,
          createdById: invite.createdById,
          status: 'active',
          mustChangePassword,
        },
        include: { systemRole: true },
      });

      await tx.inviteToken.update({
        where: { id: invite.id },
        data: { usedAt: new Date(), usedByUserId: created.id },
      });

      return created;
    });

    log.info('invite accepted', {
      inviteId: invite.id,
      userId: user.id,
      credentialMode: invite.credentialMode,
    });
    return jsonOk({ user: serializeAuthUser(user) }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === 'INVALID_INVITE') {
      return jsonError('INVALID_INVITE', 'لینک دعوت نامعتبر یا منقضی شده است.', 410);
    }
    if (err instanceof z.ZodError) {
      return jsonError('VALIDATION_ERROR', 'ورودی نامعتبر است.', 400);
    }
    return handleAuthRouteError(err, 'invite.accept');
  }
}
