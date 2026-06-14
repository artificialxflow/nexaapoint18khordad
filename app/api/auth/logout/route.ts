import { NextRequest } from 'next/server';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { clearSessionCookie, destroySessionFromRequest } from '@/src/lib/auth/session';
import { createLogger } from '@/src/lib/logger';

const log = createLogger('auth');

export async function POST(req: NextRequest) {
  try {
    await destroySessionFromRequest(req);
    await clearSessionCookie(req);
    log.info('logout success');
    return jsonOk({ loggedOut: true });
  } catch (err) {
    return handleAuthRouteError(err, 'logout');
  }
}
