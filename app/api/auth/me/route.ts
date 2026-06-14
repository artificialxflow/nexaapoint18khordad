import { NextRequest } from 'next/server';
import { handleAuthRouteError, jsonError, jsonOk } from '@/src/lib/auth/api';
import { serializeAuthUser } from '@/src/lib/auth/rbac';
import { getSessionFromRequest, setSessionCookie } from '@/src/lib/auth/session';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return jsonError('UNAUTHORIZED', 'لطفاً وارد شوید.', 401);
    }
    if (session.renewed) {
      await setSessionCookie(session.token, session.expiresAt, req);
    }
    return jsonOk({ user: serializeAuthUser(session.user) });
  } catch (err) {
    return handleAuthRouteError(err, 'me');
  }
}
