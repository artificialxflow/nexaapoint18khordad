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
import type { MeizitoLetter, MeizitoLetterCategory } from '@/src/types/meizito';
import {
  serializeApprovalStepRow,
  serializeInternalLetterRow,
  type LettersSnapshot,
} from '@/src/lib/meizito/letters/serialize';

const log = meizitoModuleLog('letters');
const ENTITY_TYPE = 'letter';

async function getLetterOrThrow(businessId: string, letterId: string) {
  const row = await prisma.internalLetter.findFirst({ where: { id: letterId, businessId } });
  if (!row) throw new Error('NOT_FOUND');
  return row;
}

async function loadStepsForLetter(businessId: string, letterId: string) {
  const rows = await prisma.meizitoApprovalStep.findMany({
    where: { businessId, entityType: ENTITY_TYPE, entityId: letterId },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map(serializeApprovalStepRow);
}

async function serializeLetterWithSteps(
  businessId: string,
  row: Awaited<ReturnType<typeof getLetterOrThrow>>
) {
  const steps = await loadStepsForLetter(businessId, row.id);
  return serializeInternalLetterRow(row, steps);
}

async function persistApprovalStep(
  businessId: string,
  letterId: string,
  step: ReturnType<typeof applyApprovalAction>['approvalSteps'][number],
  assigneeUserId?: string
) {
  await prisma.meizitoApprovalStep.create({
    data: {
      businessId,
      entityType: ENTITY_TYPE,
      entityId: letterId,
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

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}

export async function loadLettersSnapshot(
  businessId: string,
  box?: MeizitoLetter['box']
): Promise<LettersSnapshot> {
  const rows = await prisma.internalLetter.findMany({
    where: {
      businessId,
      ...(box ? { box } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
  const letters = await Promise.all(rows.map((row) => serializeLetterWithSteps(businessId, row)));
  return { letters };
}

export type CreateInternalLetterInput = Omit<
  MeizitoLetter,
  'id' | 'threadId' | 'createdAt' | 'approvalState' | 'approvalSteps' | 'submittedAt'
> & { threadId?: string };

export async function createInternalLetter(
  businessId: string,
  input: CreateInternalLetterInput,
  actorId: string,
  actorName: string
) {
  const row = await prisma.internalLetter.create({
    data: {
      businessId,
      subject: input.subject.trim() || 'بدون موضوع',
      body: input.body ?? '',
      to: input.to ?? [],
      labels: input.labels ?? [],
      category: input.category ?? 'other',
      status: input.status ?? 'open',
      box: input.box ?? 'outbox',
      templateId: input.templateId ?? null,
      referredTo: input.referredTo ?? [],
      referredFrom: input.referredFrom || actorName,
      authorUserId: actorId,
      replyToLetterId: input.replyToLetterId ?? null,
      threadId: input.threadId ?? undefined,
      attachments: (input.attachments ?? []) as Prisma.InputJsonValue,
      approvalState: 'draft',
    },
  });

  const resolvedThreadId = row.threadId ?? row.id;
  if (!row.threadId) {
    await prisma.internalLetter.update({
      where: { id: row.id },
      data: { threadId: resolvedThreadId },
    });
  }

  log.info('letter.create', { businessId, letterId: row.id, actorId });
  await logMeizitoAction({
    actorId,
    action: 'letter.create',
    businessId,
    targetType: 'internal_letter',
    targetId: row.id,
  });

  return serializeLetterWithSteps(businessId, row);
}

export async function replyToInternalLetter(
  businessId: string,
  sourceLetterId: string,
  input: Omit<CreateInternalLetterInput, 'replyToLetterId' | 'threadId'>,
  actorId: string,
  actorName: string
) {
  const source = await getLetterOrThrow(businessId, sourceLetterId);
  const threadId = source.threadId ?? source.id;
  const row = await prisma.internalLetter.create({
    data: {
      businessId,
      subject: input.subject.trim() || 'بدون موضوع',
      body: input.body ?? '',
      to: input.to ?? [],
      labels: input.labels ?? [],
      category: input.category ?? 'other',
      status: input.status ?? 'open',
      box: input.box ?? 'outbox',
      templateId: input.templateId ?? null,
      referredTo: input.referredTo ?? [],
      referredFrom: input.referredFrom || actorName,
      authorUserId: actorId,
      replyToLetterId: sourceLetterId,
      threadId,
      attachments: (input.attachments ?? []) as Prisma.InputJsonValue,
      approvalState: 'draft',
    },
  });

  log.info('letter.reply', { businessId, letterId: row.id, sourceLetterId, actorId });
  await logMeizitoAction({
    actorId,
    action: 'letter.reply',
    businessId,
    targetType: 'internal_letter',
    targetId: row.id,
  });

  return serializeLetterWithSteps(businessId, row);
}

export type UpdateInternalLetterInput = {
  box?: MeizitoLetter['box'];
  status?: MeizitoLetter['status'];
  category?: MeizitoLetterCategory;
};

export async function updateInternalLetter(
  businessId: string,
  letterId: string,
  patch: UpdateInternalLetterInput,
  actorId: string
) {
  await getLetterOrThrow(businessId, letterId);
  const row = await prisma.internalLetter.update({
    where: { id: letterId },
    data: {
      ...(patch.box !== undefined ? { box: patch.box } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.category !== undefined ? { category: patch.category } : {}),
    },
  });
  log.info('letter.update', { businessId, letterId, actorId, patch });
  return serializeLetterWithSteps(businessId, row);
}

export async function submitInternalLetterForApproval(
  businessId: string,
  letterId: string,
  actorId: string,
  actorName: string
) {
  const existing = await getLetterOrThrow(businessId, letterId);
  const members = await loadBusinessTeamMembers(businessId);
  const steps = await loadStepsForLetter(businessId, letterId);
  const approval = applySubmitForApproval(
    {
      approvalState: existing.approvalState,
      approvalSteps: steps,
      currentAssigneeId: existing.currentAssigneeUserId ?? undefined,
      submittedAt: existing.submittedAt?.toISOString(),
    },
    actorId,
    actorName,
    undefined,
    members
  );
  const newStep = approval.approvalSteps?.[approval.approvalSteps.length - 1];
  if (newStep) {
    await persistApprovalStep(businessId, letterId, newStep, approval.currentAssigneeId);
  }
  const row = await prisma.internalLetter.update({
    where: { id: letterId },
    data: {
      approvalState: approval.approvalState ?? 'pending',
      currentAssigneeUserId: approval.currentAssigneeId ?? null,
      submittedAt: approval.submittedAt ? new Date(approval.submittedAt) : new Date(),
    },
  });
  log.info('letter.submit', { businessId, letterId, actorId });
  await logMeizitoAction({
    actorId,
    action: 'letter.submit',
    businessId,
    targetType: 'internal_letter',
    targetId: letterId,
  });
  return serializeLetterWithSteps(businessId, row);
}

export async function recordInternalLetterApproval(
  businessId: string,
  letterId: string,
  payload: Omit<RecordApprovalPayload, 'actorId' | 'actorName'>,
  actorId: string,
  actorName: string
) {
  const existing = await getLetterOrThrow(businessId, letterId);
  const steps = await loadStepsForLetter(businessId, letterId);
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
    await persistApprovalStep(businessId, letterId, newStep, approval.currentAssigneeId);
  }
  const row = await prisma.internalLetter.update({
    where: { id: letterId },
    data: {
      approvalState: approval.approvalState ?? existing.approvalState,
      currentAssigneeUserId: approval.currentAssigneeId ?? null,
      submittedAt: approval.submittedAt ? new Date(approval.submittedAt) : existing.submittedAt,
    },
  });
  log.info('letter.approval', { businessId, letterId, action: payload.action, actorId });
  await logMeizitoAction({
    actorId,
    action: `letter.${payload.action}`,
    businessId,
    targetType: 'internal_letter',
    targetId: letterId,
  });
  return serializeLetterWithSteps(businessId, row);
}

export async function loadPendingLetterApprovals(businessId: string, userId: string) {
  const rows = await prisma.internalLetter.findMany({
    where: {
      businessId,
      approvalState: 'pending',
      currentAssigneeUserId: userId,
    },
    orderBy: { updatedAt: 'desc' },
  });
  return Promise.all(rows.map((row) => serializeLetterWithSteps(businessId, row)));
}
