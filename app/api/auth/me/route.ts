import { jsonError, jsonOk } from '@/src/lib/auth/api';
import { serializeAuthUser } from '@/src/lib/auth/rbac';
import { getSessionUser, readSessionTokenFromCookieHeader } from '@/src/lib/auth/session';
import { getAuthConfig } from '@/src/lib/auth/config';

export async function GET(req: Request) {
  getAuthConfig();
  const token = readSessionTokenFromCookieHeader(req.headers.get('cookie'));
  const user = await getSessionUser(token);
  if (!user) {
    return jsonError('AUTH_UNAUTHORIZED', 'لطفاً وارد شوید', 401);
  }
  return jsonOk({ user: serializeAuthUser(user) });
}
