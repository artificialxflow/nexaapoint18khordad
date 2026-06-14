import type { DashboardSummary } from '@/src/lib/dashboard/types';

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: { code: string; message: string } };

export class DashboardApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function fetchDashboardSummary(businessId: string): Promise<DashboardSummary> {
  const url = `/api/dashboard/${encodeURIComponent(businessId)}/summary`;
  const res = await fetch(url, { credentials: 'include' });
  let body: ApiOk<{ summary: DashboardSummary }> | ApiErr | Record<string, unknown> = {};
  try {
    body = (await res.json()) as ApiOk<{ summary: DashboardSummary }> | ApiErr;
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
    throw new DashboardApiError(err.code, err.message, res.status);
  }

  return (body as ApiOk<{ summary: DashboardSummary }>).data.summary;
}
