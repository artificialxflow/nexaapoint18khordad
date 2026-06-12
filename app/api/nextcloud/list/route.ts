import { isNextcloudConfigured, ncList, nextcloudNotConfiguredResponse } from '@/src/lib/nextcloud/client';
import { requireNcPathAccess } from '@/src/lib/nextcloud/access';
import { createLogger } from '@/src/lib/logger';

const log = createLogger('nextcloud');

export async function GET(req: Request) {
  if (!isNextcloudConfigured()) return nextcloudNotConfiguredResponse();

  const { searchParams } = new URL(req.url);
  const pathRaw = searchParams.get('path') || '/Nexa/';

  try {
    const { path, businessId, user } = await requireNcPathAccess(req as import('next/server').NextRequest, pathRaw);
    log.info('list.start', { businessId, userId: user.id, path });
    const items = await ncList(path);
    log.info('list.ok', { businessId, path, count: items.length });
    return Response.json({ path, items });
  } catch (e) {
    if (e instanceof Error && (e.message === 'UNAUTHORIZED' || e.message === 'FORBIDDEN')) {
      log.warn('list forbidden', { error: e.message });
      return Response.json({ error: 'دسترسی مجاز نیست' }, { status: e.message === 'UNAUTHORIZED' ? 401 : 403 });
    }
    const message = e instanceof Error ? e.message : 'خطای نامشخص';
    log.error('list.failed', { error: message });
    return Response.json({ error: message }, { status: 502 });
  }
}
