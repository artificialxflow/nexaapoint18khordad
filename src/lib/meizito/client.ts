type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: { code: string; message: string } };

export class MeizitoApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function meizitoFetch<T>(
  businessId: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const url = `/api/meizito/${encodeURIComponent(businessId)}${normalized}`;
  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  let body: ApiOk<T> | ApiErr | Record<string, unknown> = {};
  try {
    body = (await res.json()) as ApiOk<T> | ApiErr;
  } catch {
    body = {};
  }

  if (!res.ok || !('ok' in body) || !body.ok) {
    const fallback = { code: 'HTTP_ERROR', message: res.statusText };
    const err =
      'error' in body &&
      body.error &&
      typeof body.error === 'object' &&
      'code' in body.error &&
      'message' in body.error
        ? (body.error as { code: string; message: string })
        : fallback;
    throw new MeizitoApiError(err.code, err.message, res.status);
  }

  return (body as ApiOk<T>).data;
}
