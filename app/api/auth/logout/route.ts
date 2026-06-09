import { NextRequest } from 'next/server';
import { appendSetCookie, handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { buildClearSessionCookie, destroySessionFromRequest } from '@/src/lib/auth/session';
import { createLogger } from '@/src/lib/logger';

const log = createLogger('auth');

export async function POST(req: NextRequest) {
  try {
    await destroySessionFromRequest(req);
    log.info('logout success');
    const response = jsonOk({ loggedOut: true });
    appendSetCookie(response, buildClearSessionCookie());
    return response;
  } catch (err) {
    return handleAuthRouteError(err, 'logout');
  }
}
