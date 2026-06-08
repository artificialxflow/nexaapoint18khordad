'use client';

import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  BarChart3,
  Download,
  Users,
  MessageSquare,
  LayoutGrid,
  AlertCircle,
  FileText,
  MapPin,
  Plus,
} from 'lucide-react';
import { useCatalog } from '@/src/context/CatalogContext';
import { useMeizito } from '@/src/context/MeizitoContext';
import { useSettings } from '@/src/context/SettingsContext';
import {
  formatCompanionSummary,
  formatVisitorDisplayName,
} from '@/src/lib/meizito/visitHelpers';
import type { MeizitoDailyReport, MeizitoReportsSection } from '@/src/types/meizito';
import {
  MEIZITO_DAILY_REPORT_STATUS_LABELS,
  MEIZITO_PURCHASE_PROBABILITY_LABELS,
  MEIZITO_VISIT_GENDER_LABELS,
  MEIZITO_VISIT_RESULT_LABELS,
} from '@/src/types/meizito';
import DailyReportModal from '../components/DailyReportModal';
import FieldVisitModal from '../components/FieldVisitModal';

const PIE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#94a3b8'];

type Props = {
  section?: MeizitoReportsSection;
  onSectionChange?: (s: MeizitoReportsSection) => void;
};

export default function ReportsPanel({ section: sectionProp = 'daily', onSectionChange }: Props) {
  const [section, setSection] = useState<MeizitoReportsSection>(sectionProp);
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [visitModalOpen, setVisitModalOpen] = useState(false);

  React.useEffect(() => {
    setSection(sectionProp);
  }, [sectionProp]);

  const setSec = (s: MeizitoReportsSection) => {
    setSection(s);
    onSectionChange?.(s);
  };

  const { people } = useCatalog();
  const meizito = useMeizito();
  const {
    boards,
    columns,
    cards,
    messages,
    projects,
    activeBoardId,
    currentUserName,
    dailyReports,
    getDailyReportsForDate,
    getTeamMembersWithoutReportForDate,
    getFieldVisitsForDate,
    fieldVisitsAll,
    getMyDailyReportForDate,
    addFeedbackToReport,
    approveDailyReport,
    canReviewDailyReport,
  } = meizito;
  const { getVisitPriorityOptions, getPicklistLabel } = useSettings();
  const [consultantFilter, setConsultantFilter] = useState('');
  const [editVisit, setEditVisit] = useState<import('@/src/types/meizito').MeizitoFieldVisit | null>(
    null
  );
  const priorityLabelById = useMemo(() => {
    const m = new Map<string, string>();
    getVisitPriorityOptions().forEach((o) => m.set(o.id, o.label));
    return m;
  }, [getVisitPriorityOptions]);

  const reportsForDay = useMemo(
    () => getDailyReportsForDate(filterDate),
    [getDailyReportsForDate, filterDate, dailyReports]
  );
  const visitsForDay = useMemo(() => {
    let list = getFieldVisitsForDate(filterDate);
    if (consultantFilter.trim()) {
      const q = consultantFilter.trim();
      list = list.filter(
        (v) =>
          (v.salesConsultantName ?? v.authorName).includes(q) ||
          v.authorName.includes(q)
      );
    }
    return list;
  }, [getFieldVisitsForDate, filterDate, consultantFilter]);

  const visitKpiByCustomerType = useMemo(() => {
    const m = new Map<string, number>();
    fieldVisitsAll.forEach((v) => {
      const key = getPicklistLabel('customer-type', v.customerTypeId) || 'نامشخص';
      m.set(key, (m.get(key) ?? 0) + 1);
    });
    return [...m.entries()].map(([name, count]) => ({ name, count }));
  }, [fieldVisitsAll, getPicklistLabel]);

  const visitKpiByAcquaintance = useMemo(() => {
    const m = new Map<string, number>();
    fieldVisitsAll.forEach((v) => {
      const key = getPicklistLabel('acquaintance-source', v.acquaintanceSourceId) || 'نامشخص';
      m.set(key, (m.get(key) ?? 0) + 1);
    });
    return [...m.entries()].map(([name, count]) => ({ name, count }));
  }, [fieldVisitsAll, getPicklistLabel]);
  const missing = useMemo(
    () => getTeamMembersWithoutReportForDate(filterDate),
    [getTeamMembersWithoutReportForDate, filterDate]
  );
  const myReport = getMyDailyReportForDate(filterDate);
  const selectedReport = reportsForDay.find((r) => r.id === selectedReportId);

  const boardCols = useMemo(
    () =>
      columns
        .filter((c) => c.boardId === activeBoardId)
        .sort((a, b) => a.order - b.order),
    [columns, activeBoardId]
  );

  const boardCards = useMemo(
    () => cards.filter((c) => c.boardId === activeBoardId),
    [cards, activeBoardId]
  );

  const columnChartData = useMemo(
    () =>
      boardCols.map((col) => ({
        name: col.title.length > 12 ? `${col.title.slice(0, 10)}…` : col.title,
        fullName: col.title,
        count: col.cardIds.length,
      })),
    [boardCols]
  );

  const unassignedCount = useMemo(
    () => boardCards.filter((c) => !c.assignee.trim()).length,
    [boardCards]
  );

  const messagesLast7Days = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400000;
    return messages.filter((m) => new Date(m.createdAt).getTime() >= cutoff).length;
  }, [messages]);

  const projectRows = useMemo(
    () =>
      projects.map((p) => ({
        name: p.name,
        members: p.memberIds.length || p.members?.length || 0,
      })),
    [projects]
  );

  const assigneePie = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of boardCards) {
      const key = c.assignee.trim() || 'بدون مسئول';
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [boardCards]);

  const boardName = boards.find((b) => b.id === activeBoardId)?.name ?? '—';

  const exportAnalyticsCsv = () => {
    const lines = [
      'گزارش میز کار نکسا',
      `میز کار,${boardName}`,
      `تاریخ,${new Date().toISOString().slice(0, 10)}`,
      '',
      'ستون,تعداد کارت',
      ...columnChartData.map((r) => `${r.fullName},${r.count}`),
      '',
      `بدون مسئول,${unassignedCount}`,
      `پیام ۷ روز,${messagesLast7Days}`,
      '',
      'پروژه,اعضا',
      ...projectRows.map((p) => `${p.name},${p.members}`),
    ];
    downloadCsv(lines, `meizito-analytics-${activeBoardId}.csv`);
  };

  const exportVisitsCsv = () => {
    const lines = [
      'بازدیدهای حضوری',
      `تاریخ,${filterDate}`,
      '',
      'جنسیت,نام کامل,موبایل,نوع مشتری,نحوه آشنایی,مشاور فروش,تاریخ,ورود,خروج,آقا همراه,خانم همراه,جمع نفر,بازدیدکننده,دیزاینر,موضوعات مهم,توضیحات,علاقه,احتمال خرید,نتیجه,ثبت‌کننده,مدت(دقیقه),یادداشت',
      ...visitsForDay.map((v) => {
        const prob = v.purchaseProbability
          ? MEIZITO_PURCHASE_PROBABILITY_LABELS[v.purchaseProbability]
          : '';
        const tags = (v.priorityTags ?? [])
          .map((t) => priorityLabelById.get(t) ?? t)
          .join('؛ ');
        const gender =
          v.visitorGender && v.visitorGender !== 'unknown'
            ? MEIZITO_VISIT_GENDER_LABELS[v.visitorGender]
            : '';
        return [
          gender,
          formatVisitorDisplayName(v),
          v.customerMobile ?? '',
          getPicklistLabel('customer-type', v.customerTypeId),
          getPicklistLabel('acquaintance-source', v.acquaintanceSourceId),
          v.salesConsultantName ?? v.authorName,
          v.date,
          v.timeFrom ?? v.time ?? '',
          v.timeTo ?? '',
          v.maleCompanionCount ?? 0,
          v.femaleCompanionCount ?? 0,
          v.visitorCount ?? 1,
          v.visitedBy ?? '—',
          v.hasDesigner ? v.designerName : '—',
          v.hasDesigner ? v.designerMobile ?? '' : '',
          tags,
          v.description ?? v.notes ?? '',
          v.likedItems ?? '',
          prob,
          MEIZITO_VISIT_RESULT_LABELS[v.result],
          v.authorName,
          v.durationMinutes,
          v.notes ?? '',
        ]
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(',');
      }),
    ];
    downloadCsv(lines, `visits-${filterDate}.csv`);
  };

  const submitFeedback = () => {
    if (!selectedReportId || !feedbackText.trim()) return;
    addFeedbackToReport(selectedReportId, feedbackText);
    setFeedbackText('');
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BarChart3 size={28} className="text-nexa-accent shrink-0" />
          <div>
            <p className="text-sm font-bold text-gray-800">گزارش میز کار</p>
            <p className="text-xs text-gray-500">میز فعال: {boardName}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl w-fit overflow-x-auto no-scrollbar">
        {(
          [
            { id: 'daily' as const, label: 'گزارش روز', icon: FileText },
            { id: 'visits' as const, label: 'بازدید حضوری', icon: MapPin },
            { id: 'analytics' as const, label: 'آمار میز کار', icon: BarChart3 },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSec(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${
              section === tab.id ? 'bg-white text-nexa-accent shadow-sm' : 'text-gray-500'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {section === 'daily' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs text-gray-500">تاریخ</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-gray-50 rounded-xl px-3 py-2 text-sm font-fa-num"
            />
            <button
              type="button"
              onClick={() => setReportModalOpen(true)}
              className="nexa-btn-primary text-xs font-bold px-4 py-2 flex items-center gap-1"
            >
              <Plus size={14} />
              گزارش جدید
            </button>
          </div>

          {missing.length > 0 && (
            <div className="nexa-card p-3 bg-amber-50 border-amber-100 text-xs text-amber-900">
              {missing.length} نفر هنوز گزارش این روز را ثبت نکرده‌اند:{' '}
              {missing.map((u) => u.name).join('، ')}
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="nexa-card overflow-hidden">
              <div className="p-3 border-b border-nexa-border text-xs font-bold text-gray-500">
                لیست گزارش‌ها
              </div>
              {reportsForDay.length === 0 ? (
                <p className="p-6 text-sm text-gray-400 text-center">گزارشی برای این تاریخ نیست.</p>
              ) : (
                <ul>
                  {reportsForDay.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedReportId(r.id)}
                        className={`w-full text-right px-4 py-3 border-b border-nexa-border/50 hover:bg-gray-50 ${
                          selectedReportId === r.id ? 'bg-nexa-accent/5' : ''
                        }`}
                      >
                        <p className="text-sm font-bold text-gray-900">{r.title}</p>
                        <p className="text-[10px] text-gray-500">
                          {r.authorName} · {MEIZITO_DAILY_REPORT_STATUS_LABELS[r.status]}
                          {r.feedbackEntries?.length ? ' · فیدبک' : ''}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="nexa-card p-5 min-h-[200px]">
              {selectedReport ? (
                <ReportDetail
                  report={selectedReport}
                  canReview={canReviewDailyReport(selectedReport)}
                  feedbackText={feedbackText}
                  onFeedbackChange={setFeedbackText}
                  onSubmitFeedback={submitFeedback}
                  onApprove={() => approveDailyReport(selectedReport.id)}
                />
              ) : (
                <p className="text-sm text-gray-400">یک گزارش را برای مشاهده جزئیات انتخاب کنید.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {section === 'visits' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs text-gray-500">تاریخ</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-gray-50 rounded-xl px-3 py-2 text-sm font-fa-num"
            />
            <button
              type="button"
              onClick={() => setVisitModalOpen(true)}
              className="nexa-btn-primary text-xs font-bold px-4 py-2 flex items-center gap-1"
            >
              <Plus size={14} />
              ثبت بازدید
            </button>
            <input
              value={consultantFilter}
              onChange={(e) => setConsultantFilter(e.target.value)}
              placeholder="فیلتر مشاور فروش"
              className="bg-gray-50 rounded-xl px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={exportVisitsCsv}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-gray-100"
            >
              <Download size={14} className="inline ml-1" />
              CSV
            </button>
          </div>
          <div className="nexa-card overflow-x-auto">
            <table className="w-full text-right text-sm min-w-[1000px]">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-nexa-border">
                  <th className="px-3 py-3">جنسیت</th>
                  <th className="px-3 py-3">نام</th>
                  <th className="px-3 py-3">نوع مشتری</th>
                  <th className="px-3 py-3">آشنایی</th>
                  <th className="px-3 py-3">مشاور</th>
                  <th className="px-3 py-3">موبایل</th>
                  <th className="px-3 py-3">تاریخ</th>
                  <th className="px-3 py-3">زمان</th>
                  <th className="px-3 py-3">همراهان</th>
                  <th className="px-3 py-3">دیزاینر</th>
                  <th className="px-3 py-3">موضوعات</th>
                  <th className="px-3 py-3">علاقه</th>
                  <th className="px-3 py-3">احتمال</th>
                  <th className="px-3 py-3">نتیجه</th>
                </tr>
              </thead>
              <tbody>
                {visitsForDay.map((v) => (
                  <tr key={v.id} className="border-b border-nexa-border/40 align-top">
                    <td className="px-3 py-3 text-xs text-gray-500">
                      {v.visitorGender && v.visitorGender !== 'unknown'
                        ? MEIZITO_VISIT_GENDER_LABELS[v.visitorGender]
                        : '—'}
                    </td>
                    <td className="px-3 py-3 font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          setEditVisit(v);
                          setVisitModalOpen(true);
                        }}
                        className="hover:text-nexa-accent text-right"
                      >
                        {formatVisitorDisplayName(v)}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {getPicklistLabel('customer-type', v.customerTypeId)}
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {getPicklistLabel('acquaintance-source', v.acquaintanceSourceId)}
                    </td>
                    <td className="px-3 py-3 text-xs">{v.salesConsultantName ?? v.authorName}</td>
                    <td className="px-3 py-3 text-gray-500 font-fa-num text-xs">{v.customerMobile ?? '—'}</td>
                    <td className="px-3 py-3 font-fa-num text-xs text-gray-500">{v.date}</td>
                    <td className="px-3 py-3 text-gray-500 font-fa-num text-xs whitespace-nowrap">
                      {v.timeFrom && v.timeTo
                        ? `${v.timeFrom}–${v.timeTo}`
                        : v.timeFrom ?? v.time ?? '—'}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600">{formatCompanionSummary(v)}</td>
                    <td className="px-3 py-3 text-xs text-gray-600">
                      {v.hasDesigner ? (
                        <>
                          <p>{v.designerName}</p>
                          {v.designerMobile && (
                            <p className="font-fa-num text-gray-400">{v.designerMobile}</p>
                          )}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-3 text-[10px] text-gray-600 max-w-[120px]">
                      {(v.priorityTags ?? []).map((tag) => (
                        <span key={tag} className="inline-block bg-gray-100 px-1 rounded ml-1 mb-0.5">
                          {priorityLabelById.get(tag) ?? tag}
                        </span>
                      ))}
                      {!v.priorityTags?.length && '—'}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600 max-w-[140px]">
                      <p className="line-clamp-2">{v.likedItems || '—'}</p>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {v.purchaseProbability
                        ? MEIZITO_PURCHASE_PROBABILITY_LABELS[v.purchaseProbability]
                        : '—'}
                    </td>
                    <td className="px-3 py-3">{MEIZITO_VISIT_RESULT_LABELS[v.result]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visitsForDay.length === 0 && (
              <p className="p-6 text-center text-sm text-gray-400">بازدیدی ثبت نشده.</p>
            )}
          </div>
        </div>
      )}

      {section === 'analytics' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="nexa-card p-4">
              <p className="text-xs font-bold text-gray-700 mb-3">بازدید بر اساس نوع مشتری</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={visitKpiByCustomerType}>
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="nexa-card p-4">
              <p className="text-xs font-bold text-gray-700 mb-3">بازدید بر اساس نحوه آشنایی</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={visitKpiByAcquaintance}>
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 font-fa-num">
            کل بازدیدهای ثبت‌شده: {fieldVisitsAll.length}
          </p>
        <AnalyticsSection
          boardName={boardName}
          boardCards={boardCards}
          columnChartData={columnChartData}
          unassignedCount={unassignedCount}
          messagesLast7Days={messagesLast7Days}
          projectsCount={projects.length}
          assigneePie={assigneePie}
          projectRows={projectRows}
          currentUserName={currentUserName}
          peopleCount={people.length}
          onExport={exportAnalyticsCsv}
        />
        </div>
      )}

      <DailyReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        dateKey={filterDate}
        existing={myReport}
      />
      <FieldVisitModal
        open={visitModalOpen}
        onClose={() => {
          setVisitModalOpen(false);
          setEditVisit(null);
        }}
        dateKey={filterDate}
        editVisit={editVisit}
      />
    </div>
  );
}

function ReportDetail({
  report,
  canReview,
  feedbackText,
  onFeedbackChange,
  onSubmitFeedback,
  onApprove,
}: {
  report: MeizitoDailyReport;
  canReview: boolean;
  feedbackText: string;
  onFeedbackChange: (v: string) => void;
  onSubmitFeedback: () => void;
  onApprove: () => void;
}) {
  const feedbackOnly = (report.feedbackEntries ?? []).filter((e) => e.kind === 'feedback');

  return (
    <div className="space-y-3">
      <h4 className="font-black text-gray-900">{report.title}</h4>
      <p className="text-xs text-gray-500">
        {report.authorName} · {MEIZITO_DAILY_REPORT_STATUS_LABELS[report.status]}
      </p>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.body}</p>
      {report.managerApproved && (
        <p className="text-[10px] font-bold text-emerald-700">✓ گزارش تایید شده</p>
      )}
      {feedbackOnly.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-700">بازخوردها</p>
          {feedbackOnly.map((entry) => (
            <div
              key={entry.id}
              className={`p-3 rounded-xl border ${
                entry.roleLabel === 'مدیر بالاتر'
                  ? 'bg-blue-50 border-blue-100'
                  : 'bg-emerald-50 border-emerald-100'
              }`}
            >
              <p className="text-[10px] font-bold text-gray-700 mb-1">
                {entry.authorName} · {entry.roleLabel}
              </p>
              <p className="text-xs text-gray-700">{entry.text}</p>
            </div>
          ))}
        </div>
      )}
      {canReview && report.status === 'submitted' && !report.managerApproved && (
        <button
          type="button"
          onClick={onApprove}
          className="nexa-btn-primary text-xs font-bold px-4 py-2"
        >
          تایید گزارش
        </button>
      )}
      {canReview && report.status === 'submitted' && (
        <div className="space-y-2 pt-2 border-t border-nexa-border">
          <p className="text-xs font-bold text-gray-700">ثبت بازخورد</p>
          <textarea
            value={feedbackText}
            onChange={(e) => onFeedbackChange(e.target.value)}
            rows={3}
            className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm"
            placeholder="نظر مدیر..."
          />
          <button
            type="button"
            onClick={onSubmitFeedback}
            className="nexa-btn-primary text-xs font-bold px-4 py-2"
          >
            ثبت بازخورد
          </button>
        </div>
      )}
    </div>
  );
}

function AnalyticsSection({
  boardName,
  boardCards,
  columnChartData,
  unassignedCount,
  messagesLast7Days,
  projectsCount,
  assigneePie,
  projectRows,
  currentUserName,
  peopleCount,
  onExport,
}: {
  boardName: string;
  boardCards: { length: number };
  columnChartData: { name: string; fullName: string; count: number }[];
  unassignedCount: number;
  messagesLast7Days: number;
  projectsCount: number;
  assigneePie: { name: string; value: number }[];
  projectRows: { name: string; members: number }[];
  currentUserName: string;
  peopleCount: number;
  onExport: () => void;
}) {
  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onExport}
          className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"
        >
          <Download size={14} />
          خروجی CSV
        </button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<LayoutGrid size={18} />} label="کارت‌ها در بورد" value={boardCards.length} />
        <StatCard
          icon={<AlertCircle size={18} />}
          label="بدون مسئول"
          value={unassignedCount}
          accent="text-amber-600"
        />
        <StatCard icon={<MessageSquare size={18} />} label="پیام ۷ روز اخیر" value={messagesLast7Days} />
        <StatCard icon={<Users size={18} />} label="پروژه‌های فعال" value={projectsCount} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="nexa-card p-4">
          <p className="text-xs font-bold text-gray-600 mb-3">توزیع کارت در ستون‌ها — {boardName}</p>
          {columnChartData.length === 0 ? (
            <p className="text-xs text-gray-400 py-8 text-center">ستونی وجود ندارد</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={columnChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(v) => [Number(v ?? 0), 'کارت']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="nexa-card p-4">
          <p className="text-xs font-bold text-gray-600 mb-3">توزیع بر اساس مسئول</p>
          {assigneePie.length === 0 ? (
            <p className="text-xs text-gray-400 py-8 text-center">کارتی نیست</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={assigneePie}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={72}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {assigneePie.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [Number(v ?? 0), 'کارت']} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      <div className="nexa-card p-4">
        <p className="text-xs font-bold text-gray-600 mb-3">پروژه‌ها و تعداد اعضا</p>
        {projectRows.length === 0 ? (
          <p className="text-xs text-gray-400">پروژه‌ای ثبت نشده</p>
        ) : (
          <ul className="space-y-2">
            {projectRows.map((p) => (
              <li
                key={p.name}
                className="flex justify-between text-sm border-b border-gray-50 pb-2 last:border-0"
              >
                <span className="font-bold text-gray-800">{p.name}</span>
                <span className="text-gray-500 font-fa-num">{p.members} عضو</span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[10px] text-gray-400 mt-3">
          کاربر جاری: {currentUserName} — {peopleCount} شخص در کاتالوگ
        </p>
      </div>
    </>
  );
}

function downloadCsv(lines: string[], filename: string) {
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function StatCard({
  icon,
  label,
  value,
  accent = 'text-nexa-accent',
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="nexa-card p-4 flex items-center gap-3">
      <span className={accent}>{icon}</span>
      <div>
        <p className="text-[10px] text-gray-500">{label}</p>
        <p className={`text-xl font-black font-fa-num ${accent}`}>{value}</p>
      </div>
    </div>
  );
}
