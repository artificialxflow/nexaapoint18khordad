import {
  isNextcloudConfigured,
  ncUpload,
  nextcloudNotConfiguredResponse,
  sanitizeNcPath,
  MAX_UPLOAD_BYTES,
} from '@/src/lib/nextcloud/client';
import { requireNcPathAccess } from '@/src/lib/nextcloud/access';
import { createLogger } from '@/src/lib/logger';

const log = createLogger('nextcloud');

export async function POST(req: Request) {
  if (!isNextcloudConfigured()) return nextcloudNotConfiguredResponse();

  try {
    const form = await req.formData();
    const file = form.get('file');
    const pathRaw = String(form.get('path') || '/Nexa/');

    if (!(file instanceof File)) {
      log.warn('upload missing file');
      return Response.json({ error: 'فایل ارسال نشده' }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      log.warn('upload too large', { size: file.size });
      return Response.json({ error: 'حداکثر حجم فایل ۲۰ مگابایت است' }, { status: 413 });
    }

    const { path, businessId, user } = await requireNcPathAccess(req as import('next/server').NextRequest, pathRaw);
    const dir = sanitizeNcPath(path.endsWith('/') ? path : `${path}/`);
    const buffer = Buffer.from(await file.arrayBuffer());
    log.info('upload.start', { businessId, userId: user.id, dir, name: file.name, size: file.size });
    const ref = await ncUpload(dir, file.name, buffer, file.type || 'application/octet-stream');
    log.info('upload.ok', { businessId, path: ref.path });
    return Response.json(ref);
  } catch (e) {
    if (e instanceof Error && (e.message === 'UNAUTHORIZED' || e.message === 'FORBIDDEN')) {
      log.warn('upload forbidden', { error: e.message });
      return Response.json({ error: 'دسترسی مجاز نیست' }, { status: e.message === 'UNAUTHORIZED' ? 401 : 403 });
    }
    const message = e instanceof Error ? e.message : 'آپلود ناموفق';
    log.error('upload.failed', { error: message });
    return Response.json({ error: message }, { status: 502 });
  }
}
