import { NextRequest } from 'next/server';
import { handleAuthRouteError, jsonError, jsonOk } from '@/src/lib/auth/api';
import { serializeAuthUser } from '@/src/lib/auth/rbac';
import { getSessionUserFromRequest } from '@/src/lib/auth/session';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUserFromRequest(req);
    if (!user) {
      return jsonError('UNAUTHORIZED', 'لطفاً وارد شوید.', 401);
    }
    return jsonOk({ user: serializeAuthUser(user) });
  } catch (err) {
    return handleAuthRouteError(err, 'me');
  }
}
