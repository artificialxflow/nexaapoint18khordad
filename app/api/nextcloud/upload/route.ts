import {
  isNextcloudConfigured,
  ncUpload,
  nextcloudNotConfiguredResponse,
  sanitizeNcPath,
  MAX_UPLOAD_BYTES,
} from '@/src/lib/nextcloud/client';

export async function POST(req: Request) {
  if (!isNextcloudConfigured()) return nextcloudNotConfiguredResponse();

  try {
    const form = await req.formData();
    const file = form.get('file');
    const pathRaw = String(form.get('path') || '/Nexa/');

    if (!(file instanceof File)) {
      return Response.json({ error: 'فایل ارسال نشده' }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return Response.json({ error: 'حداکثر حجم فایل ۲۰ مگابایت است' }, { status: 413 });
    }

    const dir = sanitizeNcPath(pathRaw.endsWith('/') ? pathRaw : `${pathRaw}/`);
    const buffer = Buffer.from(await file.arrayBuffer());
    const ref = await ncUpload(dir, file.name, buffer, file.type || 'application/octet-stream');
    return Response.json(ref);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'آپلود ناموفق';
    return Response.json({ error: message }, { status: 502 });
  }
}
