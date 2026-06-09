import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/lib/db/prisma';
import { writeAuditLog } from '@/src/lib/auth/audit';
import { handleAuthRouteError, jsonError, jsonOk } from '@/src/lib/auth/api';
import { canManageUser, hasPermission } from '@/src/lib/auth/rbac';
import { requireSessionUser } from '@/src/lib/auth/session';
import { findUserById } from '@/src/lib/auth/users';

type RouteContext = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  items: z.array(
    z.object({
      bankAccountId: z.string(),
      allowed: z.boolean(),
    })
  ),
});

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const actor = await requireSessionUser(req);
    if (!hasPermission(actor.systemRole, 'users:read')) throw new Error('FORBIDDEN');

    const { id } = await context.params;
    const target = await findUserById(id);
    if (!target) return jsonError('NOT_FOUND', 'کاربر یافت نشد.', 404);
    if (!canManageUser(actor.systemRole, target.systemRole) && target.id !== actor.id) {
      throw new Error('FORBIDDEN');
    }

    const banks = await prisma.bankAccount.findMany({
      where: { isActive: true },
      orderBy: { nameFa: 'asc' },
    });
    const access = await prisma.userBankAccess.findMany({ where: { userId: id } });
    const accessMap = new Map(access.map((a) => [a.bankAccountId, a.allowed]));

    return jsonOk({
      banks: banks.map((b) => ({
        id: b.id,
        nameFa: b.nameFa,
        code: b.code,
        allowed: accessMap.get(b.id) ?? true,
      })),
    });
  } catch (err) {
    return handleAuthRouteError(err, 'admin.bank-access.get');
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const actor = await requireSessionUser(req);
    if (!hasPermission(actor.systemRole, 'users:write')) throw new Error('FORBIDDEN');

    const { id } = await context.params;
    const target = await findUserById(id);
    if (!target) return jsonError('NOT_FOUND', 'کاربر یافت نشد.', 404);
    if (!canManageUser(actor.systemRole, target.systemRole)) throw new Error('FORBIDDEN');

    const body = patchSchema.parse(await req.json());

    await prisma.$transaction(
      body.items.map((item) =>
        prisma.userBankAccess.upsert({
          where: { userId_bankAccountId: { userId: id, bankAccountId: item.bankAccountId } },
          create: { userId: id, bankAccountId: item.bankAccountId, allowed: item.allowed },
          update: { allowed: item.allowed },
        })
      )
    );

    await writeAuditLog({
      actorId: actor.id,
      action: 'user.bank-access.update',
      targetType: 'User',
      targetId: id,
    });

    return jsonOk({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError('VALIDATION_ERROR', 'ورودی نامعتبر است.', 400);
    }
    return handleAuthRouteError(err, 'admin.bank-access.patch');
  }
}
