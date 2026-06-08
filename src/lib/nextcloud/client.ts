import type { NcFileRef, NcListItem } from '@/src/types/nextcloud';

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export function isNextcloudConfigured(): boolean {
  return Boolean(
    process.env.NEXTCLOUD_URL?.trim() &&
      process.env.NEXTCLOUD_USER?.trim() &&
      process.env.NEXTCLOUD_APP_PASSWORD?.trim()
  );
}

export function nextcloudNotConfiguredResponse() {
  return Response.json(
    { error: 'Nextcloud پیکربندی نشده است. متغیرهای env را در .env.local تنظیم کنید.' },
    { status: 503 }
  );
}

/** جلوگیری از path traversal و محدود به زیر /Nexa */
export function sanitizeNcPath(input: string): string {
  let path = input.replace(/\\/g, '/').replace(/\.\./g, '');
  if (!path.startsWith('/')) path = `/${path}`;
  if (!path.startsWith('/Nexa')) {
    path = path === '/' ? '/Nexa/' : `/Nexa${path}`;
  }
  return path.replace(/\/+/g, '/');
}

function authHeader(): string {
  const user = process.env.NEXTCLOUD_USER!;
  const pass = process.env.NEXTCLOUD_APP_PASSWORD!;
  const token = Buffer.from(`${user}:${pass}`).toString('base64');
  return `Basic ${token}`;
}

function davFilesUrl(relativePath: string): string {
  const base = process.env.NEXTCLOUD_URL!.replace(/\/$/, '');
  const user = encodeURIComponent(process.env.NEXTCLOUD_USER!);
  const segments = relativePath
    .replace(/^\//, '')
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent);
  return `${base}/remote.php/dav/files/${user}/${segments.join('/')}`;
}

export function getFilesAppUrl(dirPath: string): string {
  const base = (
    process.env.NEXT_PUBLIC_NEXTCLOUD_URL || process.env.NEXTCLOUD_URL
  )?.replace(/\/$/, '');
  if (!base) return '';
  const dir = sanitizeNcPath(dirPath);
  return `${base}/apps/files/?dir=${encodeURIComponent(dir)}`;
}

function decodeXml(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');
}

function parsePropfindResponses(xml: string, folderPath: string): NcListItem[] {
  const items: NcListItem[] = [];
  const blocks = xml.match(/<d:response[\s\S]*?<\/d:response>/gi) ?? [];
  const normalizedFolder = sanitizeNcPath(folderPath).replace(/\/$/, '') || '/Nexa';

  for (const block of blocks) {
    const hrefMatch = block.match(/<d:href>([^<]+)<\/d:href>/i);
    if (!hrefMatch) continue;
    const href = decodeURIComponent(decodeXml(hrefMatch[1]));
    const name = href.split('/').filter(Boolean).pop() ?? '';
    if (!name) continue;

    const isCollection = /<d:collection\s*\/>/i.test(block);
    const sizeMatch = block.match(/<d:getcontentlength>(\d+)<\/d:getcontentlength>/i);
    const mimeMatch = block.match(/<d:getcontenttype>([^<]*)<\/d:getcontenttype>/i);

    const fullPath =
      normalizedFolder === '/Nexa'
        ? `/Nexa/${name}${isCollection ? '/' : ''}`
        : `${normalizedFolder}/${name}${isCollection ? '/' : ''}`;

    if (fullPath.replace(/\/$/, '') === normalizedFolder.replace(/\/$/, '')) continue;

    items.push({
      path: sanitizeNcPath(fullPath),
      name,
      type: isCollection ? 'dir' : 'file',
      size: sizeMatch ? Number(sizeMatch[1]) : undefined,
      mimeType: mimeMatch?.[1] || undefined,
    });
  }

  return items.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name, 'fa');
  });
}

export async function ncList(path: string): Promise<NcListItem[]> {
  const safePath = sanitizeNcPath(path);
  const url = davFilesUrl(safePath.endsWith('/') ? safePath : `${safePath}/`);
  const res = await fetch(url, {
    method: 'PROPFIND',
    headers: {
      Authorization: authHeader(),
      Depth: '1',
      'Content-Type': 'application/xml',
    },
    body: `<?xml version="1.0"?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:displayname/>
    <d:getcontentlength/>
    <d:getcontenttype/>
    <d:resourcetype/>
  </d:prop>
</d:propfind>`,
  });

  if (res.status === 404) return [];
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`لیست Nextcloud ناموفق (${res.status}): ${text.slice(0, 120)}`);
  }

  const xml = await res.text();
  return parsePropfindResponses(xml, safePath);
}

export async function ncUpload(
  relativePath: string,
  fileName: string,
  buffer: Buffer,
  mimeType: string
): Promise<NcFileRef> {
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error('حداکثر حجم آپلود ۲۰ مگابایت است.');
  }

  const dir = sanitizeNcPath(relativePath.replace(/\/[^/]+$/, '') || relativePath);
  const fullPath = sanitizeNcPath(`${dir.replace(/\/$/, '')}/${fileName}`);
  const url = davFilesUrl(fullPath);

  const put = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: authHeader(),
      'Content-Type': mimeType || 'application/octet-stream',
    },
    body: new Uint8Array(buffer),
  });

  if (!put.ok) {
    const text = await put.text().catch(() => '');
    throw new Error(`آپلود ناموفق (${put.status}): ${text.slice(0, 120)}`);
  }

  const etag = put.headers.get('etag') ?? undefined;
  return {
    path: fullPath,
    name: fileName,
    mimeType: mimeType || 'application/octet-stream',
    size: buffer.byteLength,
    etag: etag ?? undefined,
  };
}

export async function ncCreateShare(path: string, expireDays = 7): Promise<string> {
  const base = process.env.NEXTCLOUD_URL!.replace(/\/$/, '');
  const safePath = sanitizeNcPath(path);
  const body = new URLSearchParams({
    path: safePath,
    shareType: '3',
    permissions: '1',
  });
  if (expireDays > 0) {
    const expire = new Date();
    expire.setDate(expire.getDate() + expireDays);
    body.set('expireDate', expire.toISOString().slice(0, 10));
  }

  const res = await fetch(`${base}/ocs/v2.php/apps/files_sharing/api/v1/shares`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'OCS-APIRequest': 'true',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`اشتراک‌گذاری ناموفق (${res.status})`);
  }

  const urlMatch = text.match(/<url>([^<]+)<\/url>/i);
  if (urlMatch) return decodeXml(urlMatch[1]);
  const jsonMatch = text.match(/"url"\s*:\s*"([^"]+)"/);
  if (jsonMatch) return jsonMatch[1];
  throw new Error('لینک اشتراک در پاسخ یافت نشد.');
}

export { MAX_UPLOAD_BYTES };
