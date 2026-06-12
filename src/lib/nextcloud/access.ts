import type { NextRequest } from 'next/server';
import { requireSessionUser } from '@/src/lib/auth/session';
import { requireBusinessAccess } from '@/src/lib/business/access';
import { sanitizeNcPath } from '@/src/lib/nextcloud/client';
import { createLogger } from '@/src/lib/logger';

const log = createLogger('nextcloud');

const BUSINESS_ID_SEGMENT = /^\/Nexa\/([^/]+)\//;

/** Extract tenant id from `/Nexa/{businessId}/...` paths. */
export function extractBusinessIdFromNcPath(path: string): string | null {
  const sanitized = sanitizeNcPath(path);
  const match = sanitized.match(BUSINESS_ID_SEGMENT);
  return match?.[1] ?? null;
}

export function ncPathForBusinessRoot(businessId: string): string {
  const id = businessId.replace(/[^a-zA-Z0-9_-]/g, '');
  return `/Nexa/${id}/`;
}

export function assertNcPathUnderBusiness(path: string, businessId: string): string {
  const sanitized = sanitizeNcPath(path);
  const root = ncPathForBusinessRoot(businessId);
  if (!sanitized.startsWith(root)) {
    throw new Error('FORBIDDEN');
  }
  return sanitized;
}

/**
 * Require session; if path is tenant-scoped, verify business membership.
 * Legacy `/Nexa/meizito/...` (no businessId) still allowed with session only — log warning.
 */
export async function requireNcPathAccess(req: NextRequest, pathRaw: string) {
  const path = sanitizeNcPath(pathRaw);
  const businessId = extractBusinessIdFromNcPath(path);

  if (businessId) {
    const access = await requireBusinessAccess(req, businessId);
    assertNcPathUnderBusiness(path, businessId);
    log.debug('nc path access', { businessId, userId: access.user.id, path });
    return { path, businessId, user: access.user };
  }

  const user = await requireSessionUser(req);
  log.warn('legacy nc path without businessId', { path, userId: user.id });
  return { path, businessId: null as string | null, user };
}

export { log as ncAccessLog };
