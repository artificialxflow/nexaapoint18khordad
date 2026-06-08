import { getFilesAppUrl, isNextcloudConfigured } from '@/src/lib/nextcloud/client';

export async function GET() {
  const configured = isNextcloudConfigured();
  return Response.json({
    configured,
    message: configured
      ? undefined
      : 'Nextcloud پیکربندی نشده — NEXTCLOUD_URL، NEXTCLOUD_USER و NEXTCLOUD_APP_PASSWORD را تنظیم کنید.',
    filesBaseUrl: configured ? getFilesAppUrl('/Nexa/') : undefined,
  });
}
