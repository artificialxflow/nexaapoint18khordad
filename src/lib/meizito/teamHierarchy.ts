import type {
  MeizitoDailyReport,
  MeizitoInternalRequest,
  MeizitoMockUser,
  MeizitoReportFeedback,
} from '@/src/types/meizito';
import { MEIZITO_MOCK_USERS } from '@/src/types/meizito';

export const MAX_REFERRAL_TARGETS = 3;

export function newFeedbackId(): string {
  return `fb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getDirectManagerId(
  userId: string,
  users: MeizitoMockUser[] = MEIZITO_MOCK_USERS
): string | undefined {
  const user = users.find((u) => u.id === userId);
  return user?.managerId;
}

export function getSeniorManagerId(
  userId: string,
  users: MeizitoMockUser[] = MEIZITO_MOCK_USERS
): string | undefined {
  const directId = getDirectManagerId(userId, users);
  if (!directId) return undefined;
  return getDirectManagerId(directId, users);
}

export function getReviewerRoleLabel(
  reportAuthorId: string,
  reviewerId: string,
  users: MeizitoMockUser[] = MEIZITO_MOCK_USERS
): string {
  const directId = getDirectManagerId(reportAuthorId, users);
  if (reviewerId === directId) return 'مدیر مستقیم';
  const seniorId = getSeniorManagerId(reportAuthorId, users);
  if (reviewerId === seniorId) return 'مدیر بالاتر';
  const reviewer = users.find((u) => u.id === reviewerId);
  if (reviewer?.role === 'senior_manager') return 'مدیر بالاتر';
  if (reviewer?.role === 'manager') return 'مدیر مستقیم';
  return 'مدیر';
}

export function canReviewDailyReport(
  report: Pick<MeizitoDailyReport, 'authorId'>,
  actorId: string,
  users: MeizitoMockUser[] = MEIZITO_MOCK_USERS
): boolean {
  const directId = getDirectManagerId(report.authorId, users);
  const seniorId = getSeniorManagerId(report.authorId, users);
  return actorId === directId || actorId === seniorId;
}

export function isManagerRole(role: MeizitoMockUser['role']): boolean {
  return role === 'manager' || role === 'senior_manager';
}

export function normalizeInternalRequest(
  r: MeizitoInternalRequest,
  users: MeizitoMockUser[] = MEIZITO_MOCK_USERS
): MeizitoInternalRequest {
  let referredToUserIds = r.referredToUserIds ?? [];
  if (referredToUserIds.length === 0 && r.referredToUserId) {
    referredToUserIds = [r.referredToUserId];
  }

  let referredTo: string[] = [];
  const rawReferred = r.referredTo as string | string[] | undefined;
  if (Array.isArray(rawReferred)) {
    referredTo = rawReferred;
  } else if (typeof rawReferred === 'string' && rawReferred) {
    referredTo = [rawReferred];
  }
  if (referredTo.length === 0 && referredToUserIds.length > 0) {
    referredTo = referredToUserIds
      .map((id) => users.find((u) => u.id === id)?.name)
      .filter((n): n is string => Boolean(n));
  }

  const ccUserIds = r.ccUserIds ?? referredToUserIds.slice(1);

  return {
    ...r,
    referredToUserIds,
    ccUserIds,
    referredTo,
  };
}

export function normalizeDailyReport(r: MeizitoDailyReport): MeizitoDailyReport {
  let feedbackEntries = r.feedbackEntries ?? [];
  if (r.managerFeedback && feedbackEntries.length === 0) {
    const entry: MeizitoReportFeedback = {
      id: newFeedbackId(),
      authorId: 'user-manager',
      authorName: 'امیرحسین',
      roleLabel: 'مدیر مستقیم',
      text: r.managerFeedback,
      kind: 'feedback',
      at: r.feedbackAt ?? r.updatedAt,
    };
    feedbackEntries = [entry];
  }
  return { ...r, feedbackEntries };
}

export function formatReferredToDisplay(referredTo?: string[]): string {
  if (!referredTo?.length) return '';
  return referredTo.join('، ');
}

export function resolveReferralIds(
  userIds: string[],
  users: MeizitoMockUser[] = MEIZITO_MOCK_USERS
): { referredToUserIds: string[]; ccUserIds: string[]; referredTo: string[] } {
  const ids = userIds.slice(0, MAX_REFERRAL_TARGETS);
  const referredTo = ids
    .map((id) => users.find((u) => u.id === id)?.name)
    .filter((n): n is string => Boolean(n));
  return {
    referredToUserIds: ids,
    ccUserIds: ids.slice(1),
    referredTo,
  };
}

export function primaryAssigneeFromReferrals(userIds: string[] | undefined): string | undefined {
  return userIds?.[0];
}
