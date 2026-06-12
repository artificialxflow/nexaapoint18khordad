import { meizitoFetch } from '@/src/lib/meizito/client';
import type { RequestsSnapshot } from '@/src/lib/meizito/requests/serialize';
import type { MeizitoInternalRequest } from '@/src/types/meizito';
import type { RecordApprovalPayload } from '@/src/lib/meizito/approval';

export async function fetchRequestsSnapshot(businessId: string): Promise<RequestsSnapshot> {
  return meizitoFetch<RequestsSnapshot>(businessId, '/requests');
}

export async function apiCreateInternalRequest(
  businessId: string,
  input: Omit<
    MeizitoInternalRequest,
    'id' | 'createdAt' | 'status' | 'approvalState' | 'approvalSteps' | 'submittedAt' | 'closedAt'
  > & { status?: MeizitoInternalRequest['status'] },
  options?: { submitForApproval?: boolean }
) {
  return meizitoFetch<{ request: MeizitoInternalRequest }>(businessId, '/requests', {
    method: 'POST',
    body: JSON.stringify({ ...input, options }),
  });
}

export async function apiUpdateInternalRequestStatus(
  businessId: string,
  requestId: string,
  status: 'open' | 'closed'
) {
  return meizitoFetch<{ request: MeizitoInternalRequest }>(businessId, '/request-update', {
    method: 'PATCH',
    body: JSON.stringify({ requestId, status }),
  });
}

export async function apiInternalRequestApproval(
  businessId: string,
  requestId: string,
  payload: Omit<RecordApprovalPayload, 'actorId' | 'actorName'>
) {
  return meizitoFetch<{ request: MeizitoInternalRequest }>(businessId, '/request-approval', {
    method: 'POST',
    body: JSON.stringify({ requestId, ...payload }),
  });
}

export async function apiSubmitInternalRequest(businessId: string, requestId: string) {
  return meizitoFetch<{ request: MeizitoInternalRequest }>(businessId, '/request-approval', {
    method: 'POST',
    body: JSON.stringify({ requestId, action: 'submit' }),
  });
}

export async function fetchPendingApprovals(businessId: string) {
  return meizitoFetch<{ requests: MeizitoInternalRequest[]; letters: unknown[] }>(
    businessId,
    '/pending-approvals'
  );
}
