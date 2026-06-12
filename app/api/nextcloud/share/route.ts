import {
  isNextcloudConfigured,
  ncCreateShare,
  nextcloudNotConfiguredResponse,
  sanitizeNcPath,
} from '@/src/lib/nextcloud/client';
import { requireNcPathAccess } from '@/src/lib/nextcloud/access';
import { createLogger } from '@/src/lib/logger';

const log = createLogger('nextcloud');

export async function POST(req: Request) {
  if (!isNextcloudConfigured()) return nextcloudNotConfiguredResponse();

  try {
    const body = await req.json();
    const pathRaw = String(body.path || '');
    if (!pathRaw || pathRaw === '/Nexa') {
      return Response.json({ error: 'مسیر فایل نامعتبر است' }, { status: 400 });
    }
    const { path, businessId, user } = await requireNcPathAccess(req as import('next/server').NextRequest, pathRaw);
    const expireDays = typeof body.expireDays === 'number' ? body.expireDays : 7;
    log.info('share.start', { businessId, userId: user.id, path });
    const shareUrl = await ncCreateShare(sanitizeNcPath(path), expireDays);
    log.info('share.ok', { businessId, path });
    return Response.json({ shareUrl });
  } catch (e) {
    if (e instanceof Error && (e.message === 'UNAUTHORIZED' || e.message === 'FORBIDDEN')) {
      log.warn('share forbidden', { error: e.message });
      return Response.json({ error: 'دسترسی مجاز نیست' }, { status: e.message === 'UNAUTHORIZED' ? 401 : 403 });
    }
    const message = e instanceof Error ? e.message : 'اشتراک‌گذاری ناموفق';
    log.error('share.failed', { error: message });
    return Response.json({ error: message }, { status: 502 });
  }
}
