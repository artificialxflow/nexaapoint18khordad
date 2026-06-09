import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/lib/db/prisma';
import { handleAuthRouteError, jsonError, jsonOk } from '@/src/lib/auth/api';
import { hashPassword } from '@/src/lib/auth/password';
import { canAssignRole, canManageUser, hasPermission, serializeAuthUser } from '@/src/lib/auth/rbac';
import { requireSessionUser } from '@/src/lib/auth/session';
import {
  findUserByUsername,
  normalizeUsername,
  validatePassword,
  validateUsername,
} from '@/src/lib/auth/users';
import { createLogger } from '@/src/lib/logger';

const log = createLogger('admin');

async function requireAdmin(req: NextRequest, permission: string) {
  const actor = await requireSessionUser(req);
  if (!hasPermission(actor.systemRole, permission)) throw new Error('FORBIDDEN');
  return actor;
}

export async function GET(req: NextRequest) {
  try {
    const actor = await requireAdmin(req, 'users:read');
    const users = await prisma.user.findMany({
      include: { systemRole: true },
      orderBy: { createdAt: 'desc' },
    });

    const visible = users.filter((u) => canManageUser(actor.systemRole, u.systemRole) || u.id === actor.id);

    return jsonOk({
      users: visible.map((u) => ({
        ...serializeAuthUser(u),
        accessLevelPreset: u.accessLevelPreset,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
      })),
      roles: await prisma.systemRole.findMany({ orderBy: { level: 'desc' } }),
    });
  } catch (err) {
    return handleAuthRouteError(err, 'admin.users.list');
  }
}

const createSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  displayName: z.string().min(1),
  systemRoleId: z.string().min(1),
  mustChangePassword: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const actor = await requireAdmin(req, 'users:write');
    const body = createSchema.parse(await req.json());

    const usernameError = validateUsername(body.username);
    if (usernameError) return jsonError('VALIDATION_ERROR', usernameError, 400);

    const passwordError = validatePassword(body.password);
    if (passwordError) return jsonError('VALIDATION_ERROR', passwordError, 400);

    const role = await prisma.systemRole.findUnique({ where: { id: body.systemRoleId } });
    if (!role) return jsonError('NOT_FOUND', 'نقش یافت نشد.', 404);
    if (!canAssignRole(actor.systemRole, role)) {
      return jsonError('FORBIDDEN', 'اجازه تعیین این نقش را ندارید.', 403);
    }

    const existing = await findUserByUsername(body.username);
    if (existing) return jsonError('USERNAME_TAKEN', 'این نام کاربری قبلاً ثبت شده است.', 409);

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        username: normalizeUsername(body.username),
        passwordHash,
        displayName: body.displayName.trim(),
        systemRoleId: role.id,
        createdById: actor.id,
        mustChangePassword: body.mustChangePassword ?? false,
        status: 'active',
      },
      include: { systemRole: true },
    });

    log.info('user created', { actorId: actor.id, targetId: user.id, role: role.slug });
    return jsonOk({ user: serializeAuthUser(user) }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError('VALIDATION_ERROR', 'ورودی نامعتبر است.', 400);
    }
    return handleAuthRouteError(err, 'admin.users.create');
  }
}
