import { isNextcloudConfigured, ncList, nextcloudNotConfiguredResponse, sanitizeNcPath } from '@/src/lib/nextcloud/client';

export async function GET(req: Request) {
  if (!isNextcloudConfigured()) return nextcloudNotConfiguredResponse();

  const { searchParams } = new URL(req.url);
  const path = sanitizeNcPath(searchParams.get('path') || '/Nexa/');

  try {
    const items = await ncList(path);
    return Response.json({ path, items });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'خطای نامشخص';
    return Response.json({ error: message }, { status: 502 });
  }
}
