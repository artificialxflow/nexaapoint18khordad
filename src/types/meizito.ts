import type { NcFileRef } from '@/src/types/nextcloud';

export const MEIZITO_CURRENT_USER_NAME = 'امیرحسین';

/** تقویم وظایف — رویدادهای کارت‌ها به‌صورت پویا نمایش داده می‌شوند */
export const MEIZITO_TASKS_CALENDAR_ID = 'cal-tasks';

export type MeizitoCalendarKind = 'customer_followup' | 'service' | 'general' | 'custom';

export type MeizitoCalendar = {
  id: string;
  name: string;
  color: string;
  kind: MeizitoCalendarKind;
  sharedWith: string[];
  ownerName: string;
  visible?: boolean;
};

export type MeizitoEventRsvpStatus = 'pending' | 'accepted' | 'declined';

export type MeizitoCalendarEvent = {
  id: string;
  calendarId: string;
  title: string;
  date: string;
  time?: string;
  sourceCardId?: string;
  notes?: string;
  reminderMinutes?: number;
  attendeeIds?: string[];
  rsvp?: Record<string, MeizitoEventRsvpStatus>;
};

export type MeizitoRecurrence = 'none' | 'daily' | 'weekly';

export type MeizitoLabel = {
  id: string;
  name: string;
  color: string;
};

export type MeizitoChecklistItem = {
  id: string;
  title: string;
  done: boolean;
  fileName?: string;
};

export type MeizitoAttachment = {
  id: string;
  name: string;
  size: string;
  ncRef?: NcFileRef;
};

export type MeizitoCard = {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description: string;
  labelIds: string[];
  category: string;
  assignee: string;
  checklist: MeizitoChecklistItem[];
  attachments: MeizitoAttachment[];
  dueDate: string;
  dueTime: string;
  recurrence: MeizitoRecurrence;
  starred: boolean;
};

export type MeizitoColumn = {
  id: string;
  boardId: string;
  title: string;
  order: number;
  cardIds: string[];
};

export type MeizitoBoard = {
  id: string;
  name: string;
  memberNames: string[];
  columnIds: string[];
  labelPalette: MeizitoLabel[];
};

export type MeizitoProject = {
  id: string;
  name: string;
  /** شناسهٔ اشخاص از Catalog */
  memberIds: string[];
  /** نام‌های legacy قبل از مهاجرت — فقط نمایش */
  members?: string[];
  boardId?: string;
  ncFolderPath?: string;
};

export type MeizitoMessageType = 'text' | 'file' | 'voice' | 'image' | 'video';

export type MeizitoThreadType = 'direct' | 'group' | 'channel';

export type MeizitoChatMessage = {
  id: string;
  threadId: string;
  author: string;
  body: string;
  createdAt: string;
  type: MeizitoMessageType;
  attachmentNames: string[];
  attachmentRefs?: NcFileRef[];
  voiceDurationSec?: number;
  imageDataUrl?: string;
  editedAt?: string;
};

export type MeizitoChatThread = {
  id: string;
  title: string;
  threadType: MeizitoThreadType;
  participantNames: string[];
  starred: boolean;
  pinned?: boolean;
  messageIds: string[];
};

export type MeizitoChatListTab = 'all' | MeizitoThreadType;

export const MEIZITO_CHAT_LIST_TABS: { id: MeizitoChatListTab; label: string }[] = [
  { id: 'all', label: 'همه' },
  { id: 'direct', label: 'شخصی' },
  { id: 'group', label: 'گروه‌ها' },
  { id: 'channel', label: 'کانال‌ها' },
];

export const MEIZITO_THREAD_TYPE_LABELS: Record<MeizitoThreadType, string> = {
  direct: 'شخصی',
  group: 'گروه',
  channel: 'کانال',
};

export type MeizitoVisitGender = 'male' | 'female' | 'unknown';

export const MEIZITO_VISIT_GENDER_LABELS: Record<MeizitoVisitGender, string> = {
  male: 'آقا',
  female: 'خانم',
  unknown: 'نامشخص',
};

export const MEIZITO_VISIT_TITLE_OPTIONS = ['آقای', 'خانم', 'آقا', ''] as const;

export type MeizitoVisitPriorityTag =
  | 'discount'
  | 'price'
  | 'delivery'
  | 'quality'
  | 'warranty'
  | 'payment'
  | 'custom';

export const MEIZITO_VISIT_PRIORITY_TAG_LABELS: Record<MeizitoVisitPriorityTag, string> = {
  discount: 'تخفیف',
  price: 'قیمت',
  delivery: 'زمان تحویل',
  quality: 'کیفیت',
  warranty: 'گارانتی',
  payment: 'شرایط پرداخت',
  custom: 'سفارشی',
};

export const MEIZITO_VISIT_PRIORITY_TAG_KEYS = Object.keys(
  MEIZITO_VISIT_PRIORITY_TAG_LABELS
) as MeizitoVisitPriorityTag[];

export type MeizitoLetterAttachment = {
  name: string;
  size?: string;
  ncRef?: NcFileRef;
};

export type MeizitoLetterCategory =
  | 'financial'
  | 'administrative'
  | 'hr'
  | 'operations'
  | 'other';

export type MeizitoLetterStatus = 'open' | 'closed';

export const MEIZITO_LETTER_CATEGORY_LABELS: Record<MeizitoLetterCategory, string> = {
  financial: 'مالی',
  administrative: 'اداری',
  hr: 'منابع انسانی',
  operations: 'عملیات',
  other: 'سایر',
};

export type MeizitoApprovalAction = 'approve' | 'reject' | 'forward' | 'comment' | 'submit' | 'cancel';

export type MeizitoApprovalStep = {
  id: string;
  actorId: string;
  actorName: string;
  action: MeizitoApprovalAction;
  comment?: string;
  forwardedToId?: string;
  forwardedToName?: string;
  forwardedToIds?: string[];
  forwardedToNames?: string[];
  at: string;
};

export type MeizitoApprovalState = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';

export const MEIZITO_APPROVAL_STATE_LABELS: Record<MeizitoApprovalState, string> = {
  draft: 'پیش‌نویس',
  pending: 'منتظر تایید',
  approved: 'تایید شده',
  rejected: 'رد شده',
  cancelled: 'لغو شده',
};

export type MeizitoApprovableEntityType = 'letter' | 'request';

export type MeizitoApprovableFields = {
  approvalState: MeizitoApprovalState;
  approvalSteps: MeizitoApprovalStep[];
  currentAssigneeId?: string;
  submittedAt?: string;
};

export type MeizitoLetter = {
  id: string;
  subject: string;
  body: string;
  to: string[];
  labels: string[];
  category: MeizitoLetterCategory;
  status: MeizitoLetterStatus;
  box: 'inbox' | 'outbox' | 'archive';
  templateId?: string;
  referredTo: string[];
  referredFrom: string;
  replyToLetterId?: string;
  threadId: string;
  attachments: MeizitoLetterAttachment[];
  createdAt: string;
  approvalState?: MeizitoApprovalState;
  approvalSteps?: MeizitoApprovalStep[];
  currentAssigneeId?: string;
  submittedAt?: string;
};

export type MeizitoDailyReportStatus = 'draft' | 'submitted';

export const MEIZITO_DAILY_REPORT_STATUS_LABELS: Record<MeizitoDailyReportStatus, string> = {
  draft: 'پیش‌نویس',
  submitted: 'ارسال‌شده',
};

export type MeizitoReportFeedbackKind = 'feedback' | 'approve';

export type MeizitoReportFeedback = {
  id: string;
  authorId: string;
  authorName: string;
  roleLabel: string;
  text: string;
  kind: MeizitoReportFeedbackKind;
  at: string;
};

export type MeizitoDailyReport = {
  id: string;
  authorId: string;
  authorName: string;
  date: string;
  title: string;
  body: string;
  status: MeizitoDailyReportStatus;
  /** @deprecated use feedbackEntries */
  managerFeedback?: string;
  feedbackAt?: string;
  managerApproved?: boolean;
  managerApprovedAt?: string;
  feedbackEntries?: MeizitoReportFeedback[];
  createdAt: string;
  updatedAt: string;
};

export type MeizitoVisitResult = 'positive' | 'neutral' | 'negative';

export const MEIZITO_VISIT_RESULT_LABELS: Record<MeizitoVisitResult, string> = {
  positive: 'مثبت',
  neutral: 'خنثی',
  negative: 'منفی',
};

export type MeizitoPurchaseProbability = 'low' | 'medium' | 'high' | 'unknown';

export const MEIZITO_PURCHASE_PROBABILITY_LABELS: Record<MeizitoPurchaseProbability, string> = {
  low: 'کم',
  medium: 'متوسط',
  high: 'زیاد',
  unknown: 'نامشخص',
};

export type MeizitoVisitKind = 'new' | 'return';

export const MEIZITO_VISIT_KIND_LABELS: Record<MeizitoVisitKind, string> = {
  new: 'بازدید جدید',
  return: 'بازدید مجدد',
};

export type MeizitoSupplementaryVoice = {
  fileName: string;
  durationSec?: number;
  dataUrl?: string;
};

export type MeizitoInternalRequestStatus = 'open' | 'closed';

export type MeizitoInternalRequestPriority = 'low' | 'medium' | 'high';

export const MEIZITO_INTERNAL_REQUEST_PRIORITY_LABELS: Record<
  MeizitoInternalRequestPriority,
  string
> = {
  low: 'کم',
  medium: 'متوسط',
  high: 'بالا',
};

export type MeizitoInternalRequest = {
  id: string;
  subject: string;
  body: string;
  status: MeizitoInternalRequestStatus;
  /** نام‌های گیرندگان برای نمایش */
  referredTo?: string[];
  referredToUserIds?: string[];
  ccUserIds?: string[];
  /** @deprecated use referredToUserIds */
  referredToUserId?: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  closedAt?: string;
  attachments?: MeizitoLetterAttachment[];
  category?: MeizitoLetterCategory;
  priority?: MeizitoInternalRequestPriority;
  threadId?: string;
  replyToRequestId?: string;
  sourceChatMessageId?: string;
  approvalState?: MeizitoApprovalState;
  approvalSteps?: MeizitoApprovalStep[];
  currentAssigneeId?: string;
  submittedAt?: string;
};

export type MeizitoFieldVisit = {
  id: string;
  visitKind?: MeizitoVisitKind;
  /** بازدید قبلی — برای بازدید مجدد */
  priorVisitId?: string;
  /** تاریخ بازدید (ISO YYYY-MM-DD) */
  date: string;
  /** زمان تکی legacy */
  time?: string;
  timeFrom?: string;
  timeTo?: string;
  /** نمایش یک‌خطی — از عنوان+نام+فامیل ساخته می‌شود */
  customerName: string;
  personId?: string;
  customerMobile?: string;
  visitorGender?: MeizitoVisitGender;
  visitorTitle?: string;
  visitorFirstName?: string;
  visitorLastName?: string;
  maleCompanionCount?: number;
  femaleCompanionCount?: number;
  hasDesigner?: boolean;
  designerName: string;
  designerMobile?: string;
  visitedBy?: string;
  /** شناسه‌های picklist از تنظیمات */
  priorityTags?: string[];
  durationMinutes: number;
  result: MeizitoVisitResult;
  visitorCount?: number;
  /** legacy متن آزاد */
  companions?: string;
  likedItems?: string;
  customerPriorities?: string;
  purchaseProbability?: MeizitoPurchaseProbability;
  interests?: string;
  notes?: string;
  /** توضیحات گزارش (داستان بازدید — مثل واتساپ) */
  description?: string;
  /** picklist ids */
  customerTypeId?: string;
  acquaintanceSourceId?: string;
  contactMethodId?: string;
  groupMembershipId?: string;
  productInterestIds?: string[];
  salesConsultantName?: string;
  followUpActions?: string[];
  supplementaryVoice?: MeizitoSupplementaryVoice;
  calendarEventId?: string;
  birthDate?: string;
  addressCity?: string;
  addressDistrict?: string;
  addressFull?: string;
  nationalId?: string;
  purchaseProbabilityLevelId?: string;
  estimatedSaleRangeId?: string;
  designerGender?: MeizitoVisitGender;
  designerFirstName?: string;
  designerLastName?: string;
  designerNationalId?: string;
  designerClubMember?: boolean;
  designerPriorCollaboration?: boolean;
  /** بازدید مجدد */
  returnInterestNotes?: string;
  returnAgreements?: string;
  returnFollowUpNeeds?: string;
  authorId: string;
  authorName: string;
  createdAt: string;
};

export type MeizitoMockUserRole = 'member' | 'manager' | 'senior_manager';

export type MeizitoMockUser = {
  id: string;
  name: string;
  role: MeizitoMockUserRole;
  managerId?: string;
  mobile?: string;
  extension?: string;
  department?: string;
  jobTitle?: string;
};

export const MEIZITO_MOCK_USERS: MeizitoMockUser[] = [
  {
    id: 'user-director',
    name: 'دکتر نکسایی',
    role: 'senior_manager',
    mobile: '۰۹۱۲۱۰۰۰۰۰۰',
    extension: '۱۰۰',
    department: 'مدیریت',
    jobTitle: 'مدیرعامل',
  },
  {
    id: 'user-manager',
    name: 'امیرحسین',
    role: 'manager',
    managerId: 'user-director',
    mobile: '۰۹۱۲۱۰۰۱۰۰۱',
    extension: '۱۰۱',
    department: 'مدیریت',
    jobTitle: 'مدیر فروش',
  },
  {
    id: 'user-sara',
    name: 'سارا',
    role: 'member',
    managerId: 'user-manager',
    mobile: '۰۹۱۲۳۴۵۶۷۸۹',
    extension: '۲۰۲',
    department: 'فروش',
    jobTitle: 'مشاور',
  },
  {
    id: 'user-reza',
    name: 'رضا',
    role: 'member',
    managerId: 'user-manager',
    mobile: '۰۹۱۸۷۶۵۴۳۲۱',
    extension: '۲۰۳',
    department: 'فروش',
    jobTitle: 'مشاور',
  },
  {
    id: 'user-maryam',
    name: 'مریم',
    role: 'member',
    managerId: 'user-manager',
    mobile: '۰۹۳۵۱۱۱۲۲۳۳',
    extension: '۳۰۱',
    department: 'پشتیبانی',
    jobTitle: 'کارشناس',
  },
];

export const MEIZITO_CURRENT_USER_ID_KEY = 'nexa-meizito-current-user-id';

export type MeizitoReportsSection = 'daily' | 'visits' | 'analytics';

export function isMeizitoReportsSection(
  value: string | null | undefined
): value is MeizitoReportsSection {
  return value === 'daily' || value === 'visits' || value === 'analytics';
}

export type MeizitoNoteBoard = {
  id: string;
  name: string;
  color?: string;
  order: number;
};

export type MeizitoNote = {
  id: string;
  boardId: string;
  title: string;
  content: string;
  color: string;
  checklist: MeizitoChecklistItem[];
  ncAttachments?: NcFileRef[];
  archived: boolean;
  deletedAt: string | null;
  starred: boolean;
};

export type MeizitoTabId =
  | 'dashboard'
  | 'chat'
  | 'boards'
  | 'reports'
  | 'letters'
  | 'notes'
  | 'projects'
  | 'calendar'
  | 'comms'
  | 'phone'
  | 'starred'
  | 'monitoring'
  | 'boardInfo';

export const MEIZITO_PRIMARY_TABS: MeizitoTabId[] = [
  'dashboard',
  'boards',
  'reports',
  'letters',
  'notes',
  'projects',
  'calendar',
];

export const MEIZITO_SECONDARY_TABS: MeizitoTabId[] = ['comms', 'phone', 'starred', 'monitoring', 'boardInfo'];

/** همه تب‌های نوار میز کار — گفتگو در منوی اصلی (`/dashboard/chats`) */
export const MEIZITO_NAV_TABS: MeizitoTabId[] = [...MEIZITO_PRIMARY_TABS, ...MEIZITO_SECONDARY_TABS];

export const MEIZITO_MOBILE_NAV_TABS: MeizitoTabId[] = MEIZITO_NAV_TABS;

/** @deprecated از MEIZITO_MOBILE_NAV_TABS استفاده کنید */
export const MEIZITO_MOBILE_PRIMARY_TABS: MeizitoTabId[] = MEIZITO_MOBILE_NAV_TABS;

export const MEIZITO_ALL_TABS: MeizitoTabId[] = MEIZITO_NAV_TABS;

export const MEIZITO_TAB_LABELS: Record<MeizitoTabId, string> = {
  dashboard: 'داشبورد',
  chat: 'گفتگو',
  boards: 'میزهای کار',
  reports: 'گزارش',
  letters: 'نامه‌ها',
  notes: 'یادداشت‌ها',
  projects: 'پروژه‌ها',
  calendar: 'تقویم',
  comms: 'ارتباطات',
  phone: 'دفتر تلفن',
  starred: 'نشان‌دار',
  monitoring: 'مونیتورینگ',
  boardInfo: 'اطلاعات میز',
};

export function isMeizitoTabId(value: string | null | undefined): value is MeizitoTabId {
  return value != null && (MEIZITO_ALL_TABS as string[]).includes(value);
}

/** مرتب‌سازی لیست گفتگو: پین اول، بعد آخرین پیام */
export function sortMeizitoThreads(
  threads: MeizitoChatThread[],
  messages: MeizitoChatMessage[]
): MeizitoChatThread[] {
  const lastAt = (t: MeizitoChatThread) => {
    const lastId = t.messageIds[t.messageIds.length - 1];
    const msg = messages.find((m) => m.id === lastId);
    return msg?.createdAt ?? '';
  };
  return [...threads].sort((a, b) => {
    const pa = a.pinned ? 1 : 0;
    const pb = b.pinned ? 1 : 0;
    if (pa !== pb) return pb - pa;
    return lastAt(b).localeCompare(lastAt(a));
  });
}

export const MEIZITO_LAST_TAB_KEY = 'nexa-meizito-last-tab';
