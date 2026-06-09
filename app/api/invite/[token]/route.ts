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
      },
    });
  } catch (err) {
    return handleAuthRouteError(err, 'invite.get');
  }
}

const acceptSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  displayName: z.string().min(1),
});

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    const invite = await findInviteByRawToken(token);
    if (!invite) return jsonError('INVALID_INVITE', 'لینک دعوت نامعتبر است.', 404);

    const validationError = getInviteValidationError(invite);
    if (validationError) return jsonError('INVALID_INVITE', validationError, 410);

    const body = acceptSchema.parse(await req.json());

    const usernameError = validateUsername(body.username);
    if (usernameError) return jsonError('VALIDATION_ERROR', usernameError, 400);

    const passwordError = validatePassword(body.password);
    if (passwordError) return jsonError('VALIDATION_ERROR', passwordError, 400);

    const existing = await findUserByUsername(body.username);
    if (existing) return jsonError('USERNAME_TAKEN', 'این نام کاربری قبلاً ثبت شده است.', 409);

    const passwordHash = await hashPassword(body.password);

    const user = await prisma.$transaction(async (tx) => {
      const fresh = await tx.inviteToken.findUnique({ where: { id: invite.id } });
      if (!fresh || fresh.usedAt || fresh.expiresAt <= new Date()) {
        throw new Error('INVALID_INVITE');
      }

      const created = await tx.user.create({
        data: {
          username: normalizeUsername(body.username),
          passwordHash,
          displayName: body.displayName.trim(),
          systemRoleId: invite.systemRoleId,
          createdById: invite.createdById,
          status: 'active',
        },
        include: { systemRole: true },
      });

      await tx.inviteToken.update({
        where: { id: invite.id },
        data: { usedAt: new Date(), usedByUserId: created.id },
      });

      return created;
    });

    log.info('invite accepted', { inviteId: invite.id, userId: user.id });
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
