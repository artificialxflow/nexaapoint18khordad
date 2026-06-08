'use client';

import React, { useMemo, useState } from 'react';
import { ClipboardList, Cloud, Paperclip, Plus, X } from 'lucide-react';
import { NcFilePickerModal } from '@/src/components/nextcloud/NcFilePickerModal';
import { NEXA_ROOT } from '@/src/lib/nextcloud/paths';
import { openNcFile } from '@/src/lib/nextcloud/uploadClient';
import { useMeizito } from '@/src/context/MeizitoContext';
import type { NcFileRef } from '@/src/types/nextcloud';
import type {
  MeizitoInternalRequest,
  MeizitoInternalRequestPriority,
  MeizitoLetterAttachment,
  MeizitoLetterCategory,
} from '@/src/types/meizito';
import {
  MEIZITO_APPROVAL_STATE_LABELS,
  MEIZITO_INTERNAL_REQUEST_PRIORITY_LABELS,
  MEIZITO_LETTER_CATEGORY_LABELS,
} from '@/src/types/meizito';
import ApprovalTimeline from '../components/ApprovalTimeline';
import ApprovalActionsBar from '../components/ApprovalActionsBar';
import {
  MAX_REFERRAL_TARGETS,
  formatReferredToDisplay,
  resolveReferralIds,
} from '@/src/lib/meizito/teamHierarchy';

type FilterId =
  | 'open'
  | 'pending_me'
  | 'approved'
  | 'rejected'
  | 'closed'
  | 'all';

const REQUEST_NC_PATH = `${NEXA_ROOT}/meizito/requests/`;

export default function RequestsPanel() {
  const {
    internalRequests,
    addInternalRequest,
    closeInternalRequest,
    reopenInternalRequest,
    recordApprovalAction,
    currentUserId,
    currentUserName,
    mockUsers,
  } = useMeizito();

  const [filter, setFilter] = useState<FilterId>('open');
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [referredToUserIds, setReferredToUserIds] = useState<string[]>([]);
  const [priority, setPriority] = useState<MeizitoInternalRequestPriority>('medium');
  const [category, setCategory] = useState<MeizitoLetterCategory>('other');
  const [attachments, setAttachments] = useState<MeizitoLetterAttachment[]>([]);
  const [ncPickerOpen, setNcPickerOpen] = useState(false);

  const selected = useMemo(
    () => internalRequests.find((r) => r.id === selectedId),
    [internalRequests, selectedId]
  );

  const list = useMemo(() => {
    const sorted = [...internalRequests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return sorted.filter((r) => {
      if (filter === 'all') return true;
      if (filter === 'closed') return r.status === 'closed';
      if (filter === 'open') return r.status === 'open' && r.approvalState !== 'rejected';
      if (filter === 'pending_me')
        return r.approvalState === 'pending' && r.currentAssigneeId === currentUserId;
      if (filter === 'approved') return r.approvalState === 'approved';
      if (filter === 'rejected') return r.approvalState === 'rejected';
      return true;
    });
  }, [internalRequests, filter, currentUserId]);

  const addNcAttachment = (ref: NcFileRef) => {
    setAttachments((prev) => [...prev, { name: ref.name, ncRef: ref }]);
    setNcPickerOpen(false);
  };

  const toggleReferral = (userId: string) => {
    setReferredToUserIds((prev) => {
      if (prev.includes(userId)) return prev.filter((id) => id !== userId);
      if (prev.length >= MAX_REFERRAL_TARGETS) return prev;
      return [...prev, userId];
    });
  };

  const submit = () => {
    if (!subject.trim()) return;
    const referral = resolveReferralIds(referredToUserIds, mockUsers);
    const id = addInternalRequest(
      {
        subject: subject.trim(),
        body: body.trim(),
        referredTo: referral.referredTo,
        referredToUserIds: referral.referredToUserIds,
        ccUserIds: referral.ccUserIds,
        authorId: currentUserId,
        authorName: currentUserName,
        attachments,
        priority,
        category,
      },
      { submitForApproval: true }
    );
    setSubject('');
    setBody('');
    setReferredToUserIds([]);
    setAttachments([]);
    setShowForm(false);
    setSelectedId(id);
  };

  const renderDetail = (r: MeizitoInternalRequest) => (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {r.priority && (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100">
            {MEIZITO_INTERNAL_REQUEST_PRIORITY_LABELS[r.priority]}
          </span>
        )}
        {r.category && (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
            {MEIZITO_LETTER_CATEGORY_LABELS[r.category]}
          </span>
        )}
        {r.approvalState && (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800">
            {MEIZITO_APPROVAL_STATE_LABELS[r.approvalState]}
          </span>
        )}
      </div>
      {r.body && <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.body}</p>}
      {(r.ccUserIds?.length ?? 0) > 0 && (
        <p className="text-[10px] text-gray-500">
          رونوشت:{' '}
          {r.ccUserIds!
            .map((id) => mockUsers.find((u) => u.id === id)?.name ?? id)
            .join('، ')}
        </p>
      )}
      {(r.attachments?.length ?? 0) > 0 && (
        <ul className="text-[10px] space-y-1">
          {r.attachments!.map((a, i) => (
            <li key={i}>
              <Paperclip size={10} className="inline ml-1" />
              {a.ncRef ? (
                <button
                  type="button"
                  className="text-nexa-accent font-bold hover:underline"
                  onClick={() => openNcFile(a.ncRef!)}
                >
                  {a.name}
                </button>
              ) : (
                a.name
              )}
            </li>
          ))}
        </ul>
      )}
      <ApprovalTimeline steps={r.approvalSteps ?? []} approvalState={r.approvalState} />
      <ApprovalActionsBar
        approvalState={r.approvalState}
        currentAssigneeId={r.currentAssigneeId}
        currentUserId={currentUserId}
        authorId={r.authorId}
        mockUsers={mockUsers}
        onAction={(payload) => recordApprovalAction('request', r.id, payload)}
      />
      <div className="flex flex-wrap gap-2 pt-2">
        {r.status === 'open' ? (
          <button
            type="button"
            onClick={() => closeInternalRequest(r.id)}
            className="text-[10px] font-bold text-nexa-accent hover:underline"
          >
            بستن درخواست
          </button>
        ) : (
          <button
            type="button"
            onClick={() => reopenInternalRequest(r.id)}
            className="text-[10px] font-bold text-gray-500 hover:underline"
          >
            بازگشایی
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="text-nexa-accent" size={26} />
          <div>
            <h2 className="text-lg font-black text-gray-900">درخواست‌های داخلی</h2>
            <p className="text-xs text-gray-500">درخواست‌های اداری داخلی — مثل پرینتر و هماهنگی · توضیحات · پیوست · گردش تایید</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="nexa-btn-primary text-xs font-bold flex items-center gap-1 px-4 py-2"
        >
          <Plus size={14} />
          درخواست جدید
        </button>
      </div>

      <div className="flex flex-wrap gap-1">
        {(
          [
            ['open', 'باز'],
            ['pending_me', 'منتظر من'],
            ['approved', 'تایید شده'],
            ['rejected', 'رد شده'],
            ['closed', 'بسته'],
            ['all', 'همه'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border ${
              filter === id ? 'bg-nexa-accent text-white' : 'bg-white border-nexa-border'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="nexa-card p-5 space-y-3 border-nexa-accent/30">
          <div className="flex justify-between items-center">
            <p className="text-sm font-bold">درخواست جدید</p>
            <button type="button" onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
              <X size={16} />
            </button>
          </div>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="موضوع (مثلاً: درخواست کامپیوتر)"
            className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm font-bold"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="توضیحات کامل…"
            className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as MeizitoInternalRequestPriority)}
              className="bg-gray-50 rounded-xl px-3 py-2 text-xs font-bold"
            >
              {(Object.keys(MEIZITO_INTERNAL_REQUEST_PRIORITY_LABELS) as MeizitoInternalRequestPriority[]).map(
                (p) => (
                  <option key={p} value={p}>
                    {MEIZITO_INTERNAL_REQUEST_PRIORITY_LABELS[p]}
                  </option>
                )
              )}
            </select>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as MeizitoLetterCategory)}
              className="bg-gray-50 rounded-xl px-3 py-2 text-xs font-bold"
            >
              {(Object.keys(MEIZITO_LETTER_CATEGORY_LABELS) as MeizitoLetterCategory[]).map((c) => (
                <option key={c} value={c}>
                  {MEIZITO_LETTER_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-gray-500">ارجاع به (حداکثر {MAX_REFERRAL_TARGETS} نفر، اختیاری)</p>
            <ul className="space-y-1 max-h-32 overflow-y-auto border border-nexa-border/50 rounded-xl p-2">
              {mockUsers.map((u) => (
                <li key={u.id}>
                  <label className="flex items-center gap-2 text-xs cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={referredToUserIds.includes(u.id)}
                      onChange={() => toggleReferral(u.id)}
                      className="rounded border-gray-300"
                    />
                    <span className="font-bold">{u.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={() => setNcPickerOpen(true)}
            className="text-xs font-bold text-nexa-accent flex items-center gap-1"
          >
            <Cloud size={14} />
            پیوست Nextcloud
          </button>
          {attachments.length > 0 && (
            <ul className="text-[10px] space-y-1">
              {attachments.map((a, i) => (
                <li key={i} className="flex justify-between">
                  <span>{a.name}</span>
                  <button type="button" onClick={() => setAttachments((p) => p.filter((_, j) => j !== i))}>
                    <X size={12} className="text-rose-500" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button type="button" onClick={submit} className="w-full nexa-btn-primary py-2 text-sm font-bold">
            ثبت و ارسال برای تایید
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <ul className="space-y-2">
          {list.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => setSelectedId(r.id)}
                className={`w-full text-right nexa-card p-4 transition-colors ${
                  selectedId === r.id ? 'ring-2 ring-nexa-accent/40' : ''
                } ${r.status === 'closed' ? 'opacity-70' : ''}`}
              >
                <div className="flex flex-wrap justify-between gap-2 mb-1">
                  <p className="font-bold text-sm text-gray-900">{r.subject}</p>
                  {r.approvalState && (
                    <span className="text-[9px] font-bold text-amber-700">
                      {MEIZITO_APPROVAL_STATE_LABELS[r.approvalState]}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400">
                  {r.authorName}
                  {formatReferredToDisplay(r.referredTo) ? ` → ${formatReferredToDisplay(r.referredTo)}` : ''}
                </p>
              </button>
            </li>
          ))}
          {list.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">درخواستی نیست.</p>
          )}
        </ul>
        <div className="nexa-card p-5 min-h-[200px]">
          {selected ? (
            <>
              <h3 className="font-black text-gray-900 mb-3">{selected.subject}</h3>
              {renderDetail(selected)}
            </>
          ) : (
            <p className="text-sm text-gray-400 text-center py-12">یک درخواست را انتخاب کنید.</p>
          )}
        </div>
      </div>

      <NcFilePickerModal
        open={ncPickerOpen}
        initialPath={REQUEST_NC_PATH}
        onClose={() => setNcPickerOpen(false)}
        onSelect={addNcAttachment}
      />
    </div>
  );
}
