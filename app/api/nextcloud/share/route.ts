import {
  isNextcloudConfigured,
  ncCreateShare,
  nextcloudNotConfiguredResponse,
  sanitizeNcPath,
} from '@/src/lib/nextcloud/client';

export async function POST(req: Request) {
  if (!isNextcloudConfigured()) return nextcloudNotConfiguredResponse();

  try {
    const body = await req.json();
    const path = sanitizeNcPath(String(body.path || ''));
    if (!path || path === '/Nexa') {
      return Response.json({ error: 'مسیر فایل نامعتبر است' }, { status: 400 });
    }
    const expireDays = typeof body.expireDays === 'number' ? body.expireDays : 7;
    const shareUrl = await ncCreateShare(path, expireDays);
    return Response.json({ shareUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'اشتراک‌گذاری ناموفق';
    return Response.json({ error: message }, { status: 502 });
  }
}
