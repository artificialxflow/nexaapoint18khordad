import type { MeizitoApprovalStep, MeizitoLetter } from '@/src/types/meizito';
import { serializeApprovalStepRow } from '@/src/lib/meizito/requests/serialize';

export { serializeApprovalStepRow };

type InternalLetterRow = {
  id: string;
  businessId: string;
  subject: string;
  body: string;
  to: unknown;
  labels: unknown;
  category: string;
  status: 'open' | 'closed';
  box: 'inbox' | 'outbox' | 'archive';
  templateId: string | null;
  referredTo: unknown;
  referredFrom: string;
  authorUserId: string;
  replyToLetterId: string | null;
  threadId: string | null;
  attachments: unknown;
  approvalState: MeizitoLetter['approvalState'];
  currentAssigneeUserId: string | null;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}

function asAttachments(value: unknown): MeizitoLetter['attachments'] {
  return Array.isArray(value) ? (value as MeizitoLetter['attachments']) : [];
}

export function serializeInternalLetterRow(
  row: InternalLetterRow,
  approvalSteps: MeizitoApprovalStep[] = []
): MeizitoLetter {
  return {
    id: row.id,
    subject: row.subject,
    body: row.body,
    to: asStringArray(row.to),
    labels: asStringArray(row.labels),
    category: (row.category || 'other') as MeizitoLetter['category'],
    status: row.status,
    box: row.box,
    templateId: row.templateId ?? undefined,
    referredTo: asStringArray(row.referredTo),
    referredFrom: row.referredFrom,
    replyToLetterId: row.replyToLetterId ?? undefined,
    threadId: row.threadId ?? row.id,
    attachments: asAttachments(row.attachments),
    approvalState: row.approvalState,
    approvalSteps,
    currentAssigneeId: row.currentAssigneeUserId ?? undefined,
    submittedAt: row.submittedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export type LettersSnapshot = {
  letters: MeizitoLetter[];
};

export type InternalLetterRowType = InternalLetterRow;
