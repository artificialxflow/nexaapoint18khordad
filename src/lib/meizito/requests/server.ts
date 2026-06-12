import type { Prisma } from '@prisma/client';
import { prisma } from '@/src/lib/db/prisma';
import { logMeizitoAction } from '@/src/lib/meizito/audit';
import {
  applyApprovalAction,
  applySubmitForApproval,
  resolveForwardTargets,
  type RecordApprovalPayload,
} from '@/src/lib/meizito/approval';
import { meizitoModuleLog } from '@/src/lib/meizito/logger';
import { loadBusinessTeamMembers } from '@/src/lib/meizito/team-server';
import { primaryAssigneeFromReferrals } from '@/src/lib/meizito/teamHierarchy';
import type { MeizitoInternalRequest } from '@/src/types/meizito';
import {
  serializeApprovalStepRow,
  serializeInternalRequestRow,
  type RequestsSnapshot,
} from '@/src/lib/meizito/requests/serialize';

const log = meizitoModuleLog('requests');
const ENTITY_TYPE = 'request';

async function getRequestOrThrow(businessId: string, requestId: string) {
  const row = await prisma.internalRequest.findFirst({ where: { id: requestId, businessId } });
  if (!row) throw new Error('NOT_FOUND');
  return row;
}

async function loadStepsForRequest(businessId: string, requestId: string) {
  const rows = await prisma.meizitoApprovalStep.findMany({
    where: { businessId, entityType: ENTITY_TYPE, entityId: requestId },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map(serializeApprovalStepRow);
}

async function serializeRequestWithSteps(businessId: string, row: Awaited<ReturnType<typeof getRequestOrThrow>>) {
  const steps = await loadStepsForRequest(businessId, row.id);
  return serializeInternalRequestRow(row, steps);
}

async function persistApprovalStep(
  businessId: string,
  requestId: string,
  step: ReturnType<typeof applyApprovalAction>['approvalSteps'][number],
  assigneeUserId?: string
) {
  await prisma.meizitoApprovalStep.create({
    data: {
      businessId,
      entityType: ENTITY_TYPE,
      entityId: requestId,
      action: step.action,
      actorUserId: step.actorId,
      actorName: step.actorName,
      assigneeUserId: assigneeUserId ?? null,
      comment: step.comment ?? null,
      forwardedToIds: step.forwardedToIds ?? [],
      forwardedToNames: step.forwardedToNames ?? [],
    },
  });
}

export async function loadRequestsSnapshot(businessId: string): Promise<RequestsSnapshot> {
  const rows = await prisma.internalRequest.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
  });
  const requests = await Promise.all(rows.map((row) => serializeRequestWithSteps(businessId, row)));
  return { requests };
}

export type CreateInternalRequestInput = Omit<
  MeizitoInternalRequest,
  'id' | 'createdAt' | 'status' | 'approvalState' | 'approvalSteps' | 'submittedAt' | 'closedAt'
> & { status?: MeizitoInternalRequest['status'] };

export async function createInternalRequest(
  businessId: string,
  input: CreateInternalRequestInput,
  actorId: string,
  options?: { submitForApproval?: boolean }
) {
  const members = await loadBusinessTeamMembers(businessId);
  const authorName =
    members.find((m) => m.id === input.authorId)?.name ?? input.authorName ?? 'کاربر';
  const threadId = input.threadId;

  let approvalState: MeizitoInternalRequest['approvalState'] = 'draft';
  let currentAssigneeUserId: string | null = input.currentAssigneeId ?? null;
  let submittedAt: Date | null = null;
  const steps: ReturnType<typeof applyApprovalAction>['approvalSteps'] = [];

  if (options?.submitForApproval !== false) {
    const assigneeId =
      primaryAssigneeFromReferrals(input.referredToUserIds) ??
      input.referredToUserId ??
      input.currentAssigneeId;
    const approval = applySubmitForApproval({}, input.authorId, authorName, assigneeId, members);
    approvalState = approval.approvalState ?? 'pending';
    currentAssigneeUserId = approval.currentAssigneeId ?? null;
    submittedAt = approval.submittedAt ? new Date(approval.submittedAt) : new Date();
    steps.push(...(approval.approvalSteps ?? []));
  }

  const row = await prisma.internalRequest.create({
    data: {
      businessId,
      subject: input.subject.trim() || 'درخواست بدون عنوان',
      body: input.body ?? '',
      status: input.status ?? 'open',
      priority: input.priority ?? 'medium',
      category: input.category ?? '',
      authorUserId: input.authorId,
      authorName,
      referredToUserIds: input.referredToUserIds ?? [],
      referredTo: input.referredTo ?? [],
      ccUserIds: input.ccUserIds ?? [],
      attachments: (input.attachments ?? []) as Prisma.InputJsonValue,
      threadId: threadId ?? undefined,
      replyToRequestId: input.replyToRequestId ?? null,
      sourceChatMessageId: input.sourceChatMessageId ?? null,
      approvalState,
      currentAssigneeUserId,
      submittedAt,
    },
  });

  const resolvedThreadId = row.threadId ?? row.id;
  if (!row.threadId) {
    await prisma.internalRequest.update({
      where: { id: row.id },
      data: { threadId: resolvedThreadId },
    });
  }

  for (const step of steps) {
    await persistApprovalStep(businessId, row.id, step, currentAssigneeUserId ?? undefined);
  }

  log.info('request.create', { businessId, requestId: row.id, actorId });
  await logMeizitoAction({
    actorId,
    action: 'request.create',
    businessId,
    targetType: 'internal_request',
    targetId: row.id,
  });

  return serializeRequestWithSteps(businessId, row);
}

export async function updateInternalRequestStatus(
  businessId: string,
  requestId: string,
  status: 'open' | 'closed',
  actorId: string
) {
  await getRequestOrThrow(businessId, requestId);
  const row = await prisma.internalRequest.update({
    where: { id: requestId },
    data: {
      status,
      closedAt: status === 'closed' ? new Date() : null,
    },
  });
  log.info('request.status', { businessId, requestId, status, actorId });
  return serializeRequestWithSteps(businessId, row);
}

export async function submitInternalRequestForApproval(
  businessId: string,
  requestId: string,
  actorId: string,
  actorName: string
) {
  const existing = await getRequestOrThrow(businessId, requestId);
  const members = await loadBusinessTeamMembers(businessId);
  const steps = await loadStepsForRequest(businessId, requestId);
  const assigneeId =
    primaryAssigneeFromReferrals(asStringArray(existing.referredToUserIds)) ??
    existing.currentAssigneeUserId ??
    undefined;
  const approval = applySubmitForApproval(
    {
      approvalState: existing.approvalState,
      approvalSteps: steps,
      currentAssigneeId: existing.currentAssigneeUserId ?? undefined,
      submittedAt: existing.submittedAt?.toISOString(),
    },
    actorId,
    actorName,
    assigneeId,
    members
  );
  const newStep = approval.approvalSteps?.[approval.approvalSteps.length - 1];
  if (newStep) {
    await persistApprovalStep(
      businessId,
      requestId,
      newStep,
      approval.currentAssigneeId
    );
  }
  const row = await prisma.internalRequest.update({
    where: { id: requestId },
    data: {
      approvalState: approval.approvalState ?? 'pending',
      currentAssigneeUserId: approval.currentAssigneeId ?? null,
      submittedAt: approval.submittedAt ? new Date(approval.submittedAt) : new Date(),
    },
  });
  log.info('request.submit', { businessId, requestId, actorId });
  await logMeizitoAction({
    actorId,
    action: 'request.submit',
    businessId,
    targetType: 'internal_request',
    targetId: requestId,
  });
  return serializeRequestWithSteps(businessId, row);
}

export async function recordInternalRequestApproval(
  businessId: string,
  requestId: string,
  payload: Omit<RecordApprovalPayload, 'actorId' | 'actorName'>,
  actorId: string,
  actorName: string
) {
  const existing = await getRequestOrThrow(businessId, requestId);
  const steps = await loadStepsForRequest(businessId, requestId);
  const forward = resolveForwardTargets({
    ...payload,
    actorId,
    actorName,
    forwardToUserNames:
      payload.forwardToUserNames ??
      payload.forwardToUserIds?.map((id) => id),
  });
  const full: RecordApprovalPayload = {
    ...payload,
    actorId,
    actorName,
    forwardToUserId: forward.primaryId ?? payload.forwardToUserId,
    forwardToUserName: forward.names.join('، ') || payload.forwardToUserName,
    forwardToUserIds: forward.ids.length > 0 ? forward.ids : payload.forwardToUserIds,
    forwardToUserNames: forward.names.length > 0 ? forward.names : payload.forwardToUserNames,
  };
  const approval = applyApprovalAction(
    {
      approvalState: existing.approvalState,
      approvalSteps: steps,
      currentAssigneeId: existing.currentAssigneeUserId ?? undefined,
      submittedAt: existing.submittedAt?.toISOString(),
    },
    full
  );
  const newStep = approval.approvalSteps[approval.approvalSteps.length - 1];
  if (newStep) {
    await persistApprovalStep(
      businessId,
      requestId,
      newStep,
      approval.currentAssigneeId
    );
  }
  const row = await prisma.internalRequest.update({
    where: { id: requestId },
    data: {
      approvalState: approval.approvalState ?? existing.approvalState,
      currentAssigneeUserId: approval.currentAssigneeId ?? null,
      submittedAt: approval.submittedAt ? new Date(approval.submittedAt) : existing.submittedAt,
      ...(full.action === 'forward' && forward.ids.length > 1
        ? {
            ccUserIds: [
              ...new Set([
                ...asStringArray(existing.ccUserIds),
                ...forward.ids.slice(1),
              ]),
            ] as Prisma.InputJsonValue,
          }
        : {}),
    },
  });
  log.info('request.approval', { businessId, requestId, action: payload.action, actorId });
  await logMeizitoAction({
    actorId,
    action: `request.${payload.action}`,
    businessId,
    targetType: 'internal_request',
    targetId: requestId,
  });
  return serializeRequestWithSteps(businessId, row);
}

export async function loadPendingApprovals(businessId: string, userId: string) {
  const rows = await prisma.internalRequest.findMany({
    where: {
      businessId,
      approvalState: 'pending',
      currentAssigneeUserId: userId,
    },
    orderBy: { updatedAt: 'desc' },
  });
  const requests = await Promise.all(rows.map((row) => serializeRequestWithSteps(businessId, row)));
  return { requests, letters: [] as never[] };
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}
