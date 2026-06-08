import { jsonOk } from '@/src/lib/auth/api';
import {
  buildClearSessionCookie,
  destroySession,
  getClientMeta,
  readSessionTokenFromCookieHeader,
} from '@/src/lib/auth/session';
import { logAuth } from '@/src/lib/logger';

export async function POST(req: Request) {
  const token = readSessionTokenFromCookieHeader(req.headers.get('cookie'));
  await destroySession(token);
  logAuth.info('logout');
  return jsonOk({}, { headers: { 'Set-Cookie': buildClearSessionCookie() } });
}
