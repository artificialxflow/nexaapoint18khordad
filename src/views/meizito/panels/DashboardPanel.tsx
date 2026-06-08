'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarCheck,
  CalendarClock,
  AlertCircle,
  Users,
  MessageSquare,
  ChevronLeft,
  LayoutGrid,
  FileText,
  MapPin,
  Bell,
} from 'lucide-react';
import { useMeizito } from '@/src/context/MeizitoContext';
import { useSettings } from '@/src/context/SettingsContext';
import {
  formatCompanionSummary,
  formatVisitorDisplayName,
} from '@/src/lib/meizito/visitHelpers';
import type { MeizitoTabId, MeizitoCard } from '@/src/types/meizito';
import {
  MEIZITO_DAILY_REPORT_STATUS_LABELS,
  MEIZITO_PURCHASE_PROBABILITY_LABELS,
  MEIZITO_VISIT_GENDER_LABELS,
  MEIZITO_VISIT_RESULT_LABELS,
} from '@/src/types/meizito';
import DailyReportModal from '../components/DailyReportModal';
import FieldVisitModal from '../components/FieldVisitModal';

type Props = { onGoTab: (id: MeizitoTabId) => void };

function TaskList({
  items,
  emptyText,
  showAssignee = false,
}: {
  items: MeizitoCard[];
  emptyText: string;
  showAssignee?: boolean;
}) {
  if (items.length === 0) {
    return <p className="text-xs text-gray-400 py-2">{emptyText}</p>;
  }
  return (
    <ul className="space-y-2 mt-2">
      {items.slice(0, 5).map((c) => (
        <li
          key={c.id}
          className="flex items-start justify-between gap-2 text-xs border-b border-nexa-border/50 pb-2 last:border-0 last:pb-0"
        >
          <span className="font-medium text-gray-800 line-clamp-2">{c.title}</span>
          {showAssignee && c.assignee ? (
            <span className="text-[10px] text-gray-500 shrink-0">{c.assignee}</span>
          ) : c.dueTime ? (
            <span className="text-[10px] text-gray-400 shrink-0 font-fa-num">{c.dueTime}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function visitTimeLabel(v: { timeFrom?: string; timeTo?: string; time?: string }) {
  if (v.timeFrom && v.timeTo) return `${v.timeFrom}–${v.timeTo}`;
  return v.timeFrom ?? v.time ?? '—';
}

export default function DashboardPanel({ onGoTab }: Props) {
  const router = useRouter();
  const { getVisitPriorityOptions, getPicklistLabel } = useSettings();
  const priorityLabelById = useMemo(() => {
    const m = new Map<string, string>();
    getVisitPriorityOptions().forEach((o) => m.set(o.id, o.label));
    return m;
  }, [getVisitPriorityOptions]);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [visitModalOpen, setVisitModalOpen] = useState(false);

  const {
    boards,
    activeBoardId,
    messages,
    currentUserName,
    getCardsDueOn,
    getOverdueCards,
    getCardsAssignedToOthers,
    getMyDailyReportForDate,
    getDailyReportsForDate,
    getTeamMembersWithoutReportForDate,
    getFieldVisitsForDate,
  } = useMeizito();

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const yesterdayKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const boardName = boards.find((b) => b.id === activeBoardId)?.name ?? '—';
  const todayCards = useMemo(() => getCardsDueOn(todayKey), [getCardsDueOn, todayKey]);
  const yesterdayCards = useMemo(() => getCardsDueOn(yesterdayKey), [getCardsDueOn, yesterdayKey]);
  const overdueCards = useMemo(() => getOverdueCards(todayKey), [getOverdueCards, todayKey]);
  const othersCards = useMemo(() => getCardsAssignedToOthers(), [getCardsAssignedToOthers]);
  const todayMsgs = useMemo(
    () => messages.filter((m) => m.createdAt.slice(0, 10) === todayKey).length,
    [messages, todayKey]
  );
  const myReport = useMemo(
    () => getMyDailyReportForDate(todayKey),
    [getMyDailyReportForDate, todayKey]
  );
  const teamReportsToday = useMemo(
    () => getDailyReportsForDate(todayKey),
    [getDailyReportsForDate, todayKey]
  );
  const missingReporters = useMemo(
    () => getTeamMembersWithoutReportForDate(todayKey),
    [getTeamMembersWithoutReportForDate, todayKey]
  );
  const todayVisits = useMemo(
    () => getFieldVisitsForDate(todayKey),
    [getFieldVisitsForDate, todayKey]
  );

  const myTodayCards = useMemo(
    () => todayCards.filter((c) => c.assignee === currentUserName),
    [todayCards, currentUserName]
  );

  const goReportsDaily = () => {
    router.replace('/dashboard/tasks?tab=reports&section=daily', { scroll: false });
    onGoTab('reports');
  };

  const reportStatusLabel = !myReport
    ? 'ثبت نشده'
    : (myReport.feedbackEntries?.some((e) => e.kind === 'feedback') ?? false)
      ? 'فیدبک دریافت شد'
      : MEIZITO_DAILY_REPORT_STATUS_LABELS[myReport.status];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <p className="text-xs text-gray-500">
          داشبورد شخصی میز کار — <span className="font-bold text-gray-700">{boardName}</span>
        </p>
        <p className="text-[10px] text-gray-400">
          کاربر: <span className="font-medium text-gray-600">{currentUserName}</span>
        </p>
      </div>

      {!myReport || myReport.status !== 'submitted' ? (
        <div className="nexa-card p-4 border-amber-200 bg-amber-50/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-amber-600 shrink-0" />
            <p className="text-xs font-bold text-amber-900">هنوز گزارش عملکرد امروز را ثبت نکرده‌اید.</p>
          </div>
          <button
            type="button"
            onClick={() => setReportModalOpen(true)}
            className="text-xs font-bold px-4 py-2 bg-amber-600 text-white rounded-xl"
          >
            ثبت الان
          </button>
        </div>
      ) : null}

      {missingReporters.length > 0 && (
        <p className="text-[10px] text-gray-500 font-fa-num px-1">
          {missingReporters.length} نفر از تیم هنوز گزارش امروز ندارند:{' '}
          {missingReporters.map((u) => u.name).join('، ')}
        </p>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="nexa-card p-5">
          <FileText className="text-nexa-accent mb-2" size={22} />
          <p className="text-sm font-black text-gray-900">گزارش امروز من</p>
          <p className="text-lg font-black text-nexa-accent mt-1">{reportStatusLabel}</p>
          {myReport?.feedbackEntries?.filter((e) => e.kind === 'feedback').slice(-1)[0] && (
            <p className="text-[10px] text-gray-600 mt-2 line-clamp-2">
              {myReport.feedbackEntries.filter((e) => e.kind === 'feedback').slice(-1)[0]?.text}
            </p>
          )}
          <button
            type="button"
            onClick={() => setReportModalOpen(true)}
            className="mt-3 text-[10px] font-bold text-nexa-accent hover:underline"
          >
            {myReport ? 'ویرایش گزارش' : 'ثبت گزارش'}
          </button>
        </div>

        <div className="nexa-card p-5">
          <MapPin className="text-emerald-600 mb-2" size={22} />
          <p className="text-sm font-black text-gray-900">بازدیدهای امروز</p>
          <p className="text-2xl font-black font-fa-num text-emerald-600 mt-2">{todayVisits.length}</p>
          {todayVisits.length > 0 && (
            <p className="text-[10px] text-gray-500 mt-1 font-fa-num">
              {todayVisits.reduce((s, v) => s + (v.visitorCount ?? 1), 0)} نفر مهمان
            </p>
          )}
          <button
            type="button"
            onClick={() => setVisitModalOpen(true)}
            className="mt-2 text-[10px] font-bold text-nexa-accent"
          >
            + ثبت بازدید
          </button>
        </div>

        <button
          type="button"
          onClick={() => onGoTab('boards')}
          className="nexa-card p-5 text-right hover:border-nexa-accent/40 transition-colors"
        >
          <CalendarCheck className="text-nexa-accent mb-2" size={22} />
          <p className="text-sm font-black text-gray-900">کارهای امروز</p>
          <p className="text-2xl font-black font-fa-num text-nexa-accent mt-2">{todayCards.length}</p>
          <p className="text-[10px] text-gray-500 mt-1 font-fa-num">{myTodayCards.length} مورد به نام شما</p>
        </button>

        <button
          type="button"
          onClick={() => router.push('/dashboard/chats')}
          className="nexa-card p-5 text-right hover:border-emerald-500/40 transition-colors"
        >
          <MessageSquare className="text-emerald-600 mb-2" size={22} />
          <p className="text-sm font-black text-gray-900">فعالیت چت امروز</p>
          <p className="text-2xl font-black font-fa-num text-emerald-600 mt-2">{todayMsgs}</p>
          <p className="text-[10px] text-gray-500 mt-1">رفتن به گفتگوها</p>
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="nexa-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-900">گزارش‌های امروز تیم</span>
            <button
              type="button"
              onClick={goReportsDaily}
              className="text-[10px] font-bold text-nexa-accent flex items-center gap-0.5"
            >
              همه
              <ChevronLeft size={12} />
            </button>
          </div>
          {teamReportsToday.length === 0 ? (
            <p className="text-xs text-gray-400">گزارشی ثبت نشده.</p>
          ) : (
            <ul className="space-y-2">
              {teamReportsToday.slice(0, 5).map((r) => (
                <li key={r.id} className="text-xs border-b border-nexa-border/40 pb-2">
                  <span className="font-bold text-gray-800">{r.authorName}</span>
                  <span className="text-gray-500"> — {r.title}</span>
                  {(r.feedbackEntries?.length ?? 0) > 0 && (
                    <span className="text-[10px] text-emerald-600 block mt-0.5">✓ فیدبک</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="nexa-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-900">بازدیدهای امروز</span>
            <button
              type="button"
              onClick={() => {
                router.replace('/dashboard/tasks?tab=reports&section=visits', { scroll: false });
                onGoTab('reports');
              }}
              className="text-[10px] font-bold text-nexa-accent flex items-center gap-0.5"
            >
              همه
              <ChevronLeft size={12} />
            </button>
          </div>
          {todayVisits.length === 0 ? (
            <p className="text-xs text-gray-400">بازدیدی ثبت نشده.</p>
          ) : (
            <ul className="space-y-2">
              {todayVisits.slice(0, 5).map((v) => (
                <li key={v.id} className="text-xs border-b border-nexa-border/40 pb-2 last:border-0">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium text-gray-800">{formatVisitorDisplayName(v)}</span>
                    <span className="text-[10px] text-gray-500 shrink-0 font-fa-num">
                      {visitTimeLabel(v)}
                    </span>
                  </div>
                  {v.visitorGender && v.visitorGender !== 'unknown' && (
                    <p className="text-[10px] text-gray-400">
                      {MEIZITO_VISIT_GENDER_LABELS[v.visitorGender]}
                    </p>
                  )}
                  {v.customerMobile && (
                    <p className="text-[10px] text-gray-500 font-fa-num">{v.customerMobile}</p>
                  )}
                  {formatCompanionSummary(v) !== '—' && (
                    <p className="text-[10px] text-gray-500">{formatCompanionSummary(v)}</p>
                  )}
                  {v.acquaintanceSourceId && (
                    <p className="text-[10px] text-nexa-accent">
                      آشنایی: {getPicklistLabel('acquaintance-source', v.acquaintanceSourceId)}
                    </p>
                  )}
                  {v.description && (
                    <p className="text-[10px] text-gray-500 line-clamp-2">{v.description}</p>
                  )}
                  <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">
                    {MEIZITO_VISIT_RESULT_LABELS[v.result]}
                    {v.purchaseProbability
                      ? ` · ${MEIZITO_PURCHASE_PROBABILITY_LABELS[v.purchaseProbability]}`
                      : ''}
                    {v.hasDesigner && v.designerName ? ` · دیزاینر: ${v.designerName}` : ''}
                  </p>
                  {v.priorityTags && v.priorityTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {v.priorityTags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                        >
                          {priorityLabelById.get(tag) ?? tag}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="nexa-card p-5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <CalendarCheck size={18} className="text-nexa-accent" />
              <span className="text-sm font-bold text-gray-900">کارهای امروز</span>
              <span className="text-[10px] font-fa-num text-gray-400">({todayKey})</span>
            </div>
            <button
              type="button"
              onClick={() => onGoTab('boards')}
              className="text-[10px] font-bold text-nexa-accent flex items-center gap-0.5 hover:underline"
            >
              مشاهده همه
              <ChevronLeft size={12} />
            </button>
          </div>
          <TaskList items={todayCards} emptyText="وظیفه‌ای برای امروز ثبت نشده." showAssignee />
        </div>

        <div className="nexa-card p-5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <CalendarClock size={18} className="text-amber-600" />
              <span className="text-sm font-bold text-gray-900">کارهای دیروز</span>
              <span className="text-[10px] font-fa-num text-gray-400">({yesterdayKey})</span>
            </div>
            <button
              type="button"
              onClick={() => onGoTab('boards')}
              className="text-[10px] font-bold text-nexa-accent flex items-center gap-0.5 hover:underline"
            >
              میزهای کار
              <ChevronLeft size={12} />
            </button>
          </div>
          <TaskList items={yesterdayCards} emptyText="موردی برای دیروز نیست." showAssignee />
        </div>

        <div className="nexa-card p-5 border-amber-200/60">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={18} className="text-rose-500" />
            <span className="text-sm font-bold text-gray-900">معوق</span>
            <span className="text-[10px] font-fa-num text-rose-500">({overdueCards.length})</span>
          </div>
          <TaskList items={overdueCards} emptyText="کار معوقی ندارید." showAssignee />
        </div>

        <button
          type="button"
          onClick={() => onGoTab('boards')}
          className="nexa-card p-5 text-right hover:border-indigo-400/40 transition-colors w-full"
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-indigo-600" />
              <span className="text-sm font-bold text-gray-900">پیگیری از دیگران</span>
              <span className="text-[10px] font-fa-num text-indigo-600">({othersCards.length})</span>
            </div>
            <LayoutGrid size={16} className="text-gray-400" />
          </div>
          <TaskList items={othersCards} emptyText="وظیفه‌ای به دیگران ارجاع نشده." showAssignee />
        </button>
      </div>

      <DailyReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        dateKey={todayKey}
        existing={myReport}
      />
      <FieldVisitModal open={visitModalOpen} onClose={() => setVisitModalOpen(false)} dateKey={todayKey} />
    </div>
  );
}
