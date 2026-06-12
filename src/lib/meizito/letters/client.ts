import { meizitoFetch } from '@/src/lib/meizito/client';
import type { LettersSnapshot } from '@/src/lib/meizito/letters/serialize';
import type { MeizitoLetter, MeizitoLetterCategory } from '@/src/types/meizito';
import type { RecordApprovalPayload } from '@/src/lib/meizito/approval';

export async function fetchLettersSnapshot(
  businessId: string,
  box?: MeizitoLetter['box']
): Promise<LettersSnapshot> {
  const qs = box ? `?box=${encodeURIComponent(box)}` : '';
  return meizitoFetch<LettersSnapshot>(businessId, `/letters${qs}`);
}

export async function apiCreateLetter(
  businessId: string,
  input: Omit<MeizitoLetter, 'id' | 'threadId' | 'createdAt' | 'approvalState' | 'approvalSteps' | 'submittedAt'> & {
    threadId?: string;
  }
) {
  return meizitoFetch<{ letter: MeizitoLetter }>(businessId, '/letters', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function apiReplyToLetter(
  businessId: string,
  sourceLetterId: string,
  input: Omit<MeizitoLetter, 'id' | 'replyToLetterId' | 'threadId' | 'createdAt' | 'approvalState' | 'approvalSteps' | 'submittedAt'>
) {
  return meizitoFetch<{ letter: MeizitoLetter }>(businessId, '/letter-reply', {
    method: 'POST',
    body: JSON.stringify({ sourceLetterId, ...input }),
  });
}

export async function apiUpdateLetter(
  businessId: string,
  letterId: string,
  patch: {
    box?: MeizitoLetter['box'];
    status?: MeizitoLetter['status'];
    category?: MeizitoLetterCategory;
  }
) {
  return meizitoFetch<{ letter: MeizitoLetter }>(businessId, '/letter-update', {
    method: 'PATCH',
    body: JSON.stringify({ letterId, ...patch }),
  });
}

export async function apiLetterApproval(
  businessId: string,
  letterId: string,
  payload: Omit<RecordApprovalPayload, 'actorId' | 'actorName'>
) {
  return meizitoFetch<{ letter: MeizitoLetter }>(businessId, '/letter-approval', {
    method: 'POST',
    body: JSON.stringify({ letterId, ...payload }),
  });
}

export async function apiSubmitLetter(businessId: string, letterId: string) {
  return meizitoFetch<{ letter: MeizitoLetter }>(businessId, '/letter-approval', {
    method: 'POST',
    body: JSON.stringify({ letterId, action: 'submit' }),
  });
}
