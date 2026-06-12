import type { MeizitoApprovalStep, MeizitoInternalRequest } from '@/src/types/meizito';

type InternalRequestRow = {
  id: string;
  businessId: string;
  subject: string;
  body: string;
  status: 'open' | 'closed';
  priority: 'low' | 'medium' | 'high';
  category: string;
  authorUserId: string;
  authorName: string;
  referredToUserIds: unknown;
  referredTo: unknown;
  ccUserIds: unknown;
  attachments: unknown;
  threadId: string | null;
  replyToRequestId: string | null;
  sourceChatMessageId: string | null;
  approvalState: MeizitoInternalRequest['approvalState'];
  currentAssigneeUserId: string | null;
  submittedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type ApprovalStepRow = {
  id: string;
  businessId: string;
  entityType: string;
  entityId: string;
  action: MeizitoApprovalStep['action'];
  actorUserId: string;
  actorName: string;
  assigneeUserId: string | null;
  comment: string | null;
  forwardedToIds: unknown;
  forwardedToNames: unknown;
  createdAt: Date;
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}

function asAttachments(value: unknown): MeizitoInternalRequest['attachments'] {
  return Array.isArray(value) ? (value as MeizitoInternalRequest['attachments']) : [];
}

export function serializeApprovalStepRow(row: ApprovalStepRow): MeizitoApprovalStep {
  const forwardedToIds = asStringArray(row.forwardedToIds);
  const forwardedToNames = asStringArray(row.forwardedToNames);
  return {
    id: row.id,
    actorId: row.actorUserId,
    actorName: row.actorName,
    action: row.action,
    comment: row.comment ?? undefined,
    forwardedToId: forwardedToIds[0],
    forwardedToName: forwardedToNames.join('، ') || undefined,
    forwardedToIds: forwardedToIds.length > 0 ? forwardedToIds : undefined,
    forwardedToNames: forwardedToNames.length > 0 ? forwardedToNames : undefined,
    at: row.createdAt.toISOString(),
  };
}

export function serializeInternalRequestRow(
  row: InternalRequestRow,
  approvalSteps: MeizitoApprovalStep[] = []
): MeizitoInternalRequest {
  return {
    id: row.id,
    subject: row.subject,
    body: row.body,
    status: row.status,
    priority: row.priority,
    category: (row.category || undefined) as MeizitoInternalRequest['category'],
    authorId: row.authorUserId,
    authorName: row.authorName,
    referredToUserIds: asStringArray(row.referredToUserIds),
    referredTo: asStringArray(row.referredTo),
    ccUserIds: asStringArray(row.ccUserIds),
    attachments: asAttachments(row.attachments),
    threadId: row.threadId ?? row.id,
    replyToRequestId: row.replyToRequestId ?? undefined,
    sourceChatMessageId: row.sourceChatMessageId ?? undefined,
    approvalState: row.approvalState,
    approvalSteps,
    currentAssigneeId: row.currentAssigneeUserId ?? undefined,
    submittedAt: row.submittedAt?.toISOString(),
    closedAt: row.closedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export type RequestsSnapshot = {
  requests: MeizitoInternalRequest[];
};
