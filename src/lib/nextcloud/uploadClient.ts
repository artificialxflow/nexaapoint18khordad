import type { NcFileRef } from '@/src/types/nextcloud';

export async function fetchNextcloudStatus(): Promise<{
  configured: boolean;
  filesBaseUrl?: string;
  message?: string;
}> {
  try {
    const res = await fetch('/api/nextcloud/status');
    if (!res.ok) return { configured: false, message: 'خطا در بررسی وضعیت' };
    return res.json();
  } catch {
    return { configured: false, message: 'اتصال به API برقرار نشد' };
  }
}

export async function uploadFileToNextcloud(
  file: File,
  targetPath: string
): Promise<NcFileRef | null> {
  const form = new FormData();
  form.append('file', file);
  form.append('path', targetPath);
  const res = await fetch('/api/nextcloud/upload', { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.warn('Nextcloud upload failed', err);
    return null;
  }
  return res.json() as Promise<NcFileRef>;
}

export function openNcFile(ref: NcFileRef, filesBaseUrl?: string) {
  if (ref.shareUrl) {
    window.open(ref.shareUrl, '_blank', 'noopener');
    return;
  }
  const base = filesBaseUrl || process.env.NEXT_PUBLIC_NEXTCLOUD_URL;
  if (!base) return;
  const dir = ref.path.includes('/')
    ? ref.path.slice(0, ref.path.lastIndexOf('/') + 1)
    : '/Nexa/';
  window.open(
    `${base.replace(/\/$/, '')}/apps/files/?dir=${encodeURIComponent(dir)}`,
    '_blank',
    'noopener'
  );
}
