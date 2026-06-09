import { NextRequest } from 'next/server';
import { handleAuthRouteError, jsonError, jsonOk } from '@/src/lib/auth/api';
import { revokeInvite } from '@/src/lib/auth/invites';
import { hasPermission } from '@/src/lib/auth/rbac';
import { requireSessionUser } from '@/src/lib/auth/session';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const actor = await requireSessionUser(req);
    if (!hasPermission(actor.systemRole, 'invites:write')) throw new Error('FORBIDDEN');

    const { id } = await context.params;
    await revokeInvite(id, actor.id);
    return jsonOk({ revoked: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'ALREADY_USED') {
      return jsonError('ALREADY_USED', 'دعوت استفاده‌شده قابل لغو نیست.', 400);
    }
    return handleAuthRouteError(err, 'admin.invites.revoke');
  }
}
