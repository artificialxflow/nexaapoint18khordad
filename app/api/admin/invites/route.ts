import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/lib/db/prisma';
import { handleAuthRouteError, jsonError, jsonOk } from '@/src/lib/auth/api';
import { createInvite } from '@/src/lib/auth/invites';
import { canAssignRole, hasPermission } from '@/src/lib/auth/rbac';
import { requireSessionUser } from '@/src/lib/auth/session';
import { createLogger } from '@/src/lib/logger';

const log = createLogger('admin');

export async function GET(req: NextRequest) {
  try {
    const actor = await requireSessionUser(req);
    if (!hasPermission(actor.systemRole, 'invites:read')) throw new Error('FORBIDDEN');

    const invites = await prisma.inviteToken.findMany({
      include: { systemRole: true, createdBy: { select: { displayName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return jsonOk({
      invites: invites.map((inv) => ({
        id: inv.id,
        role: { id: inv.systemRole.id, slug: inv.systemRole.slug, nameFa: inv.systemRole.nameFa },
        createdBy: inv.createdBy.displayName,
        expiresAt: inv.expiresAt,
        usedAt: inv.usedAt,
        note: inv.note,
        createdAt: inv.createdAt,
        status: inv.usedAt ? 'used' : inv.expiresAt <= new Date() ? 'expired' : 'pending',
      })),
    });
  } catch (err) {
    return handleAuthRouteError(err, 'admin.invites.list');
  }
}

const createSchema = z.object({
  systemRoleId: z.string().min(1),
  expiresInDays: z.number().int().positive().max(30).optional(),
  note: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const actor = await requireSessionUser(req);
    if (!hasPermission(actor.systemRole, 'invites:write')) throw new Error('FORBIDDEN');

    const body = createSchema.parse(await req.json());
    const role = await prisma.systemRole.findUnique({ where: { id: body.systemRoleId } });
    if (!role) return jsonError('NOT_FOUND', 'نقش یافت نشد.', 404);
    if (!canAssignRole(actor.systemRole, role)) {
      return jsonError('FORBIDDEN', 'اجازه ساخت دعوت با این نقش را ندارید.', 403);
    }

    const { invite, url } = await createInvite({
      systemRoleId: role.id,
      createdById: actor.id,
      expiresInDays: body.expiresInDays,
      note: body.note,
    });

    log.info('invite link created', { actorId: actor.id, inviteId: invite.id });
    return jsonOk({
      invite: {
        id: invite.id,
        url,
        expiresAt: invite.expiresAt,
        role: { slug: role.slug, nameFa: role.nameFa },
      },
    }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError('VALIDATION_ERROR', 'ورودی نامعتبر است.', 400);
    }
    return handleAuthRouteError(err, 'admin.invites.create');
  }
}
