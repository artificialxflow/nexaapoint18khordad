import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/lib/db/prisma';
import { handleAuthRouteError, jsonError, jsonOk } from '@/src/lib/auth/api';
import { generatePassword, generateUsername } from '@/src/lib/auth/credentials';
import { createInvite } from '@/src/lib/auth/invites';
import { hashPassword } from '@/src/lib/auth/password';
import { canAssignRole, hasPermission, serializeAuthUser } from '@/src/lib/auth/rbac';
import { requireSessionUser } from '@/src/lib/auth/session';
import {
  findUserByUsername,
  normalizeUsername,
  validatePassword,
  validateUsername,
} from '@/src/lib/auth/users';
import { createLogger } from '@/src/lib/logger';

const log = createLogger('admin');

const provisionSchema = z.object({
  displayName: z.string().min(1),
  systemRoleId: z.string().min(1),
  credentialMode: z.enum(['manual', 'auto', 'self']),
  delivery: z.enum(['direct', 'invite']),
  username: z.string().optional(),
  password: z.string().optional(),
  expiresInDays: z.number().int().positive().max(30).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const actor = await requireSessionUser(req);
    if (!hasPermission(actor.systemRole, 'users:write')) throw new Error('FORBIDDEN');

    const body = provisionSchema.parse(await req.json());

    if (body.delivery === 'invite' && !hasPermission(actor.systemRole, 'invites:write')) {
      throw new Error('FORBIDDEN');
    }

    const role = await prisma.systemRole.findUnique({ where: { id: body.systemRoleId } });
    if (!role) return jsonError('NOT_FOUND', 'نقش یافت نشد.', 404);
    if (!canAssignRole(actor.systemRole, role)) {
      return jsonError('FORBIDDEN', 'اجازه تعیین این نقش را ندارید.', 403);
    }

    const displayName = body.displayName.trim();
    let username = body.username?.trim();
    let password = body.password;
    let generatedCredentials: { username: string; password: string } | null = null;

    if (body.credentialMode === 'self') {
      if (body.delivery === 'direct') {
        return jsonError('VALIDATION_ERROR', 'حالت «خود کاربر» فقط با لینک دعوت امکان‌پذیر است.', 400);
      }
    } else if (body.credentialMode === 'manual') {
      if (!username || !password) {
        return jsonError('VALIDATION_ERROR', 'نام کاربری و رمز عبور الزامی است.', 400);
      }
      const usernameError = validateUsername(username);
      if (usernameError) return jsonError('VALIDATION_ERROR', usernameError, 400);
      const passwordError = validatePassword(password);
      if (passwordError) return jsonError('VALIDATION_ERROR', passwordError, 400);
    } else {
      let attempts = 0;
      while (attempts < 5) {
        username = generateUsername(displayName);
        password = generatePassword();
        const existing = await findUserByUsername(username);
        if (!existing) break;
        attempts++;
      }
      if (attempts >= 5) {
        return jsonError('INTERNAL_ERROR', 'تولید نام کاربری یکتا ممکن نشد.', 500);
      }
      generatedCredentials = { username: username!, password: password! };
    }

    if (body.delivery === 'direct') {
      if (!username || !password) {
        return jsonError('VALIDATION_ERROR', 'اطلاعات ورود ناقص است.', 400);
      }

      const existing = await findUserByUsername(username);
      if (existing) return jsonError('USERNAME_TAKEN', 'این نام کاربری قبلاً ثبت شده است.', 409);

      const user = await prisma.user.create({
        data: {
          username: normalizeUsername(username),
          passwordHash: await hashPassword(password),
          displayName,
          systemRoleId: role.id,
          createdById: actor.id,
          mustChangePassword: body.credentialMode === 'auto',
          status: 'active',
        },
        include: { systemRole: true },
      });

      log.info('user provisioned direct', {
        actorId: actor.id,
        targetId: user.id,
        credentialMode: body.credentialMode,
      });

      return jsonOk(
        {
          delivery: 'direct',
          user: serializeAuthUser(user),
          credentials: generatedCredentials,
        },
        { status: 201 }
      );
    }

    let presetUsername: string | undefined;
    let presetPasswordHash: string | undefined;

    if (body.credentialMode === 'manual' || body.credentialMode === 'auto') {
      if (!username || !password) {
        return jsonError('VALIDATION_ERROR', 'اطلاعات ورود ناقص است.', 400);
      }
      const existing = await findUserByUsername(username);
      if (existing) return jsonError('USERNAME_TAKEN', 'این نام کاربری قبلاً ثبت شده است.', 409);
      presetUsername = normalizeUsername(username);
      presetPasswordHash = await hashPassword(password);
    }

    const { invite, url } = await createInvite({
      systemRoleId: role.id,
      createdById: actor.id,
      expiresInDays: body.expiresInDays,
      displayName,
      credentialMode: body.credentialMode,
      presetUsername,
      presetPasswordHash,
    });

    log.info('user provisioned invite', {
      actorId: actor.id,
      inviteId: invite.id,
      credentialMode: body.credentialMode,
    });

    return jsonOk(
      {
        delivery: 'invite',
        invite: {
          id: invite.id,
          url,
          expiresAt: invite.expiresAt,
          credentialMode: invite.credentialMode,
          role: { slug: role.slug, nameFa: role.nameFa },
        },
        credentials: generatedCredentials,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError('VALIDATION_ERROR', 'ورودی نامعتبر است.', 400);
    }
    return handleAuthRouteError(err, 'admin.users.provision');
  }
}
