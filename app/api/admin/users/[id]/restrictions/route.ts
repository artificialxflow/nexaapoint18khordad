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
  ownSalesOnly: z.boolean().optional(),
  ownPurchaseOnly: z.boolean().optional(),
  timeWindowEnabled: z.boolean().optional(),
  allowedFrom: z.string().nullable().optional(),
  allowedTo: z.string().nullable().optional(),
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

    const row = await prisma.userRestriction.findUnique({ where: { userId: id } });
    return jsonOk({
      restrictions: row ?? {
        ownSalesOnly: false,
        ownPurchaseOnly: false,
        timeWindowEnabled: false,
        allowedFrom: null,
        allowedTo: null,
      },
    });
  } catch (err) {
    return handleAuthRouteError(err, 'admin.restrictions.get');
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
    const row = await prisma.userRestriction.upsert({
      where: { userId: id },
      create: {
        userId: id,
        ownSalesOnly: body.ownSalesOnly ?? false,
        ownPurchaseOnly: body.ownPurchaseOnly ?? false,
        timeWindowEnabled: body.timeWindowEnabled ?? false,
        allowedFrom: body.allowedFrom ?? null,
        allowedTo: body.allowedTo ?? null,
      },
      update: body,
    });

    await writeAuditLog({
      actorId: actor.id,
      action: 'user.restrictions.update',
      targetType: 'User',
      targetId: id,
    });

    return jsonOk({ restrictions: row });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError('VALIDATION_ERROR', 'ورودی نامعتبر است.', 400);
    }
    return handleAuthRouteError(err, 'admin.restrictions.patch');
  }
}
