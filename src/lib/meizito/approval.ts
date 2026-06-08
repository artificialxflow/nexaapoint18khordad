import type {
  MeizitoApprovalAction,
  MeizitoApprovalState,
  MeizitoApprovalStep,
  MeizitoApprovableFields,
  MeizitoMockUser,
} from '@/src/types/meizito';
import { MEIZITO_MOCK_USERS } from '@/src/types/meizito';
import { isManagerRole } from '@/src/lib/meizito/teamHierarchy';

export function newApprovalStepId(): string {
  return `ap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getDefaultManagerId(users: MeizitoMockUser[] = MEIZITO_MOCK_USERS): string {
  return users.find((u) => u.role === 'manager')?.id ?? users[0]?.id ?? 'user-manager';
}

export function normalizeApprovableFields(
  fields: Partial<MeizitoApprovableFields> | undefined,
  legacyApproved = true
): MeizitoApprovableFields {
  const state = fields?.approvalState ?? (legacyApproved ? 'approved' : 'draft');
  return {
    approvalState: state,
    approvalSteps: fields?.approvalSteps ?? [],
    currentAssigneeId: fields?.currentAssigneeId,
    submittedAt: fields?.submittedAt,
  };
}

export function createApprovalStep(
  actorId: string,
  actorName: string,
  action: MeizitoApprovalAction,
  extra?: Pick<
    MeizitoApprovalStep,
    'comment' | 'forwardedToId' | 'forwardedToName' | 'forwardedToIds' | 'forwardedToNames'
  >
): MeizitoApprovalStep {
  return {
    id: newApprovalStepId(),
    actorId,
    actorName,
    action,
    at: new Date().toISOString(),
    ...extra,
  };
}

export function applySubmitForApproval(
  item: Partial<MeizitoApprovableFields>,
  authorId: string,
  authorName: string,
  assigneeId?: string
): MeizitoApprovableFields {
  const managerId = assigneeId ?? getDefaultManagerId();
  const now = new Date().toISOString();
  return {
    approvalState: 'pending',
    currentAssigneeId: managerId,
    submittedAt: now,
    approvalSteps: [
      ...(item.approvalSteps ?? []),
      createApprovalStep(authorId, authorName, 'submit', { comment: 'ارسال برای تایید' }),
    ],
  };
}

export type RecordApprovalPayload = {
  actorId: string;
  actorName: string;
  action: MeizitoApprovalAction;
  comment?: string;
  forwardToUserId?: string;
  forwardToUserName?: string;
  forwardToUserIds?: string[];
  forwardToUserNames?: string[];
};

export function resolveForwardTargets(payload: RecordApprovalPayload): {
  ids: string[];
  names: string[];
  primaryId?: string;
} {
  const ids =
    payload.forwardToUserIds && payload.forwardToUserIds.length > 0
      ? payload.forwardToUserIds
      : payload.forwardToUserId
        ? [payload.forwardToUserId]
        : [];
  const names =
    payload.forwardToUserNames && payload.forwardToUserNames.length > 0
      ? payload.forwardToUserNames
      : payload.forwardToUserName
        ? [payload.forwardToUserName]
        : [];
  return { ids, names, primaryId: ids[0] };
}

export function applyApprovalAction(
  item: Partial<MeizitoApprovableFields>,
  payload: RecordApprovalPayload
): MeizitoApprovableFields {
  const steps = [...(item.approvalSteps ?? [])];
  const forward = resolveForwardTargets(payload);
  const step = createApprovalStep(payload.actorId, payload.actorName, payload.action, {
    comment: payload.comment,
    forwardedToId: forward.primaryId,
    forwardedToName: forward.names.join('، ') || undefined,
    forwardedToIds: forward.ids.length > 0 ? forward.ids : undefined,
    forwardedToNames: forward.names.length > 0 ? forward.names : undefined,
  });
  steps.push(step);

  if (payload.action === 'approve') {
    return {
      approvalState: 'approved',
      approvalSteps: steps,
      currentAssigneeId: undefined,
      submittedAt: item.submittedAt,
    };
  }
  if (payload.action === 'reject') {
    return {
      approvalState: 'rejected',
      approvalSteps: steps,
      currentAssigneeId: undefined,
      submittedAt: item.submittedAt,
    };
  }
  if (payload.action === 'forward' && forward.primaryId) {
    return {
      approvalState: 'pending',
      approvalSteps: steps,
      currentAssigneeId: forward.primaryId,
      submittedAt: item.submittedAt,
    };
  }
  if (payload.action === 'cancel') {
    return {
      approvalState: 'cancelled',
      approvalSteps: steps,
      currentAssigneeId: undefined,
      submittedAt: item.submittedAt,
    };
  }
  return {
    approvalState: item.approvalState ?? 'pending',
    approvalSteps: steps,
    currentAssigneeId: item.currentAssigneeId,
    submittedAt: item.submittedAt,
  };
}

export function countPendingForUser(
  items: { approvalState?: MeizitoApprovalState; currentAssigneeId?: string }[],
  userId: string
): number {
  return items.filter((i) => i.approvalState === 'pending' && i.currentAssigneeId === userId).length;
}

export type TeamDirectoryFilter = 'all' | 'managers' | string;

export function listTeamDirectory(
  users: MeizitoMockUser[],
  filter: TeamDirectoryFilter = 'all',
  search = ''
): MeizitoMockUser[] {
  let list = [...users];
  if (filter === 'managers') list = list.filter((u) => isManagerRole(u.role));
  else if (filter !== 'all') list = list.filter((u) => u.department === filter);
  const q = search.trim();
  if (!q) return list;
  return list.filter(
    (u) =>
      u.name.includes(q) ||
      u.mobile?.includes(q) ||
      u.department?.includes(q) ||
      u.jobTitle?.includes(q) ||
      u.extension?.includes(q)
  );
}
