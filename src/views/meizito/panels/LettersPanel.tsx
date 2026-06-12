'use client';

import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Cloud,
  Mail,
  Paperclip,
  Plus,
  Reply,
  Share2,
  X,
  Search,
} from 'lucide-react';
import PersonCombobox from '@/src/components/PersonCombobox';
import { NcFilePickerModal } from '@/src/components/nextcloud/NcFilePickerModal';
import { resolveNcPathForMeizitoLetterDrafts } from '@/src/lib/nextcloud/paths';
import { openNcFile } from '@/src/lib/nextcloud/uploadClient';
import { useMeizito } from '@/src/context/MeizitoContext';
import type { NcFileRef } from '@/src/types/nextcloud';
import type {
  MeizitoLetter,
  MeizitoLetterAttachment,
  MeizitoLetterCategory,
} from '@/src/types/meizito';
import {
  MEIZITO_APPROVAL_STATE_LABELS,
  MEIZITO_LETTER_CATEGORY_LABELS,
} from '@/src/types/meizito';
import ApprovalTimeline from '../components/ApprovalTimeline';
import ApprovalActionsBar from '../components/ApprovalActionsBar';

const CATEGORY_COLORS: Record<MeizitoLetterCategory, string> = {
  financial: 'bg-emerald-100 text-emerald-800',
  administrative: 'bg-blue-100 text-blue-800',
  hr: 'bg-purple-100 text-purple-800',
  operations: 'bg-amber-100 text-amber-800',
  other: 'bg-gray-100 text-gray-600',
};

type StatusFilter = 'open' | 'all' | 'closed' | 'pending_me';

const TEMPLATES = [
  { id: 't1', label: 'درخواست جلسه', body: 'با سلام،\nبدینوسیله درخواست جلسه در تاریخ ... را اعلام می‌کنم.' },
  { id: 't2', label: 'پیگیری', body: 'با سلام،\nجهت پیگیری موضوع ... اعلام می‌گردد.' },
];

function splitList(value: string): string[] {
  return value
    .split(/[،,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatQuote(letter: MeizitoLetter): string {
  return `\n\n---\nنامه قبلی (${letter.referredFrom || 'فرستنده'}):\n${letter.body}`;
}

function buildReplyPrefill(source: MeizitoLetter) {
  const subject = source.subject.startsWith('Re:') ? source.subject : `Re: ${source.subject}`;
  return {
    subject,
    body: formatQuote(source),
    replyToLetterId: source.id,
    threadId: source.threadId,
  };
}

type LetterFormState = {
  subject: string;
  to: string;
  body: string;
  labels: string;
  category: MeizitoLetterCategory;
  referredTo: string;
  referredFrom: string;
  replyToLetterId: string;
  threadId: string;
  attachments: MeizitoLetterAttachment[];
};

const emptyForm = (referredFrom = ''): LetterFormState => ({
  subject: '',
  to: '',
  body: '',
  labels: '',
  category: 'other',
  referredTo: '',
  referredFrom,
  replyToLetterId: '',
  threadId: '',
  attachments: [],
});

export default function LettersPanel() {
  const {
    letters,
    addLetter,
    replyToLetter,
    getLetterThread,
    updateLetterBox,
    closeLetter,
    reopenLetter,
    currentUserName,
    currentUserId,
    mockUsers,
    submitForApproval,
    recordApprovalAction,
    activeBusinessId,
  } = useMeizito();
  const [box, setBox] = useState<MeizitoLetter['box']>('inbox');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  const [categoryFilter, setCategoryFilter] = useState<MeizitoLetterCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [labelFilter, setLabelFilter] = useState<string | null>(null);
  const [form, setForm] = useState<LetterFormState>(() => emptyForm(currentUserName));
  const [collapsedThreads, setCollapsedThreads] = useState<Record<string, boolean>>({});
  const [ncPickerOpen, setNcPickerOpen] = useState(false);

  const allLabels = useMemo(() => {
    const set = new Set<string>();
    for (const l of letters) {
      for (const lb of l.labels) if (lb.trim()) set.add(lb.trim());
    }
    return [...set];
  }, [letters]);

  const list = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return letters.filter((l) => {
      if (l.box !== box) return false;
      if (statusFilter === 'open' && l.status !== 'open') return false;
      if (statusFilter === 'closed' && l.status !== 'closed') return false;
      if (
        statusFilter === 'pending_me' &&
        !(l.approvalState === 'pending' && l.currentAssigneeId === currentUserId)
      )
        return false;
      if (categoryFilter !== 'all' && l.category !== categoryFilter) return false;
      if (labelFilter && !l.labels.includes(labelFilter)) return false;
      if (q && !l.subject.toLowerCase().includes(q) && !l.body.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [letters, box, statusFilter, categoryFilter, labelFilter, searchQuery, currentUserId]);

  const recentForReply = useMemo(
    () =>
      [...letters]
        .filter((l) => l.box === 'inbox' || l.box === 'outbox')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 20),
    [letters]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, MeizitoLetter[]>();
    for (const l of list) {
      const key = l.threadId || l.id;
      const arr = map.get(key) ?? [];
      arr.push(l);
      map.set(key, arr);
    }
    return [...map.entries()]
      .map(([threadId, items]) => ({
        threadId,
        items: items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      }))
      .sort((a, b) => b.items[0].createdAt.localeCompare(a.items[0].createdAt));
  }, [list]);

  const setField = <K extends keyof LetterFormState>(key: K, value: LetterFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => setForm(emptyForm(currentUserName));

  const startReply = (letter: MeizitoLetter) => {
    const pre = buildReplyPrefill(letter);
    setForm({
      ...emptyForm(currentUserName),
      subject: pre.subject,
      body: pre.body,
      replyToLetterId: pre.replyToLetterId,
      threadId: pre.threadId,
      to: letter.referredFrom || letter.to.join('، '),
      referredFrom: currentUserName,
    });
    document.getElementById('meizito-letter-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const startRefer = (letter: MeizitoLetter) => {
    setForm({
      ...emptyForm(currentUserName),
      subject: letter.subject,
      body: letter.body,
      referredTo: letter.referredTo.join('، ') || letter.to.join('، '),
      referredFrom: currentUserName,
      labels: letter.labels.join('، '),
    });
    document.getElementById('meizito-letter-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const onReplySelect = (letterId: string) => {
    if (!letterId) {
      setField('replyToLetterId', '');
      setField('threadId', '');
      return;
    }
    const source = letters.find((l) => l.id === letterId);
    if (!source) return;
    const pre = buildReplyPrefill(source);
    setForm((prev) => ({
      ...prev,
      replyToLetterId: pre.replyToLetterId,
      threadId: pre.threadId,
      subject: pre.subject,
      body: prev.body.trim() ? prev.body : pre.body,
    }));
  };

  const addNcAttachment = (ref: NcFileRef) => {
    const sizeKb = ref.size ? Math.max(1, Math.round(ref.size / 1024)) : 0;
    setForm((prev) => ({
      ...prev,
      attachments: [
        ...prev.attachments,
        { name: ref.name, size: sizeKb ? `${sizeKb} KB` : undefined, ncRef: ref },
      ],
    }));
  };

  const removeFormAttachment = (index: number) => {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const submitLetter = () => {
    const payload = {
      subject: form.subject || 'بدون موضوع',
      body: form.body,
      to: splitList(form.to),
      labels: splitList(form.labels),
      category: form.category,
      status: 'open' as const,
      box: 'outbox' as const,
      referredTo: splitList(form.referredTo),
      referredFrom: form.referredFrom,
      attachments: form.attachments,
      createdAt: new Date().toISOString(),
    };

    let letterId: string;
    if (form.replyToLetterId) {
      replyToLetter(form.replyToLetterId, payload);
      letterId = form.threadId || form.replyToLetterId;
    } else {
      letterId = addLetter({
        ...payload,
        ...(form.threadId ? { threadId: form.threadId } : {}),
      });
    }
    submitForApproval('letter', letterId);
    resetForm();
  };

  const toggleThread = (threadId: string) => {
    setCollapsedThreads((prev) => ({ ...prev, [threadId]: !prev[threadId] }));
  };

  return (
    <div className="space-y-6">
      <p className="text-xs text-gray-500">نامه‌نگاری — ارجاع، پاسخ و زنجیره مکاتبه</p>
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl w-fit">
          {(['inbox', 'outbox', 'archive'] as const).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBox(b)}
              className={`px-4 py-2 rounded-xl text-xs font-bold ${
                box === b ? 'bg-white text-nexa-accent shadow-sm' : 'text-gray-500'
              }`}
            >
              {b === 'inbox' ? 'ورودی' : b === 'outbox' ? 'خروجی' : 'آرشیو'}
            </button>
          ))}
        </div>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl w-fit">
          {(
            [
              { id: 'open' as const, label: 'باز' },
              { id: 'pending_me' as const, label: 'منتظر من' },
              { id: 'all' as const, label: 'همه' },
              { id: 'closed' as const, label: 'پایان‌یافته' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-2 rounded-xl text-[10px] font-bold ${
                statusFilter === f.id ? 'bg-white text-nexa-accent shadow-sm' : 'text-gray-500'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={categoryFilter}
          onChange={(e) =>
            setCategoryFilter(e.target.value as MeizitoLetterCategory | 'all')
          }
          className="bg-gray-50 rounded-xl px-3 py-2 text-xs font-bold"
        >
          <option value="all">همه دسته‌ها</option>
          {(Object.keys(MEIZITO_LETTER_CATEGORY_LABELS) as MeizitoLetterCategory[]).map((c) => (
            <option key={c} value={c}>
              {MEIZITO_LETTER_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو موضوع یا متن..."
            className="w-full bg-gray-50 rounded-xl py-2 pr-9 pl-3 text-xs"
          />
        </div>
      </div>
      {allLabels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {allLabels.map((lb) => (
            <button
              key={lb}
              type="button"
              onClick={() => setLabelFilter(labelFilter === lb ? null : lb)}
              className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                labelFilter === lb ? 'bg-nexa-accent text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {lb}
            </button>
          ))}
        </div>
      )}

      <div id="meizito-letter-form" className="nexa-card p-5 space-y-3">
        <p className="text-sm font-black text-gray-900 flex items-center gap-2">
          <Plus size={16} />
          نامه جدید
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          <input
            value={form.subject}
            onChange={(e) => setField('subject', e.target.value)}
            placeholder="موضوع"
            className="bg-gray-50 rounded-xl px-3 py-2 text-sm"
          />
          <PersonCombobox
            value={form.to}
            onChange={(name) => setField('to', name)}
            placeholder="گیرندگان (انتخاب یا تایپ، ویرگول)"
            className="md:col-span-1"
          />
          <select
            value={form.category}
            onChange={(e) => setField('category', e.target.value as MeizitoLetterCategory)}
            className="bg-gray-50 rounded-xl px-3 py-2 text-sm"
          >
            {(Object.keys(MEIZITO_LETTER_CATEGORY_LABELS) as MeizitoLetterCategory[]).map((c) => (
              <option key={c} value={c}>
                {MEIZITO_LETTER_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <input
            value={form.referredTo}
            onChange={(e) => setField('referredTo', e.target.value)}
            placeholder="ارجاع به (ویرگول)"
            className="bg-gray-50 rounded-xl px-3 py-2 text-sm"
          />
          <input
            value={form.referredFrom}
            onChange={(e) => setField('referredFrom', e.target.value)}
            placeholder="ارجاع از"
            className="bg-gray-50 rounded-xl px-3 py-2 text-sm"
          />
        </div>
        <select
          value={form.replyToLetterId}
          onChange={(e) => onReplySelect(e.target.value)}
          className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm"
        >
          <option value="">پاسخ به — انتخاب نامه</option>
          {recentForReply.map((l) => (
            <option key={l.id} value={l.id}>
              {l.subject} ({l.box === 'inbox' ? 'ورودی' : 'خروجی'})
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setField('body', t.body)}
              className="text-[10px] font-bold bg-gray-100 px-2 py-1 rounded-lg"
            >
              {t.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setNcPickerOpen(true)}
            className="text-[10px] font-bold bg-gray-100 px-2 py-1 rounded-lg flex items-center gap-1"
          >
            <Cloud size={12} />
            پیوست Nextcloud
          </button>
        </div>
        {form.attachments.length > 0 && (
          <ul className="text-[10px] text-gray-500 space-y-1">
            {form.attachments.map((a, i) => (
              <li key={`${a.name}-${i}`} className="flex items-center gap-2">
                <Paperclip size={10} />
                {a.ncRef ? (
                  <button
                    type="button"
                    className="text-nexa-accent font-bold hover:underline"
                    onClick={() => openNcFile(a.ncRef!)}
                  >
                    {a.name}
                  </button>
                ) : (
                  <span>{a.name}</span>
                )}
                <button type="button" onClick={() => removeFormAttachment(i)} aria-label="حذف">
                  <X size={12} className="text-rose-500" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <textarea
          value={form.body}
          onChange={(e) => setField('body', e.target.value)}
          rows={4}
          className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm"
          placeholder="متن نامه"
        />
        <input
          value={form.labels}
          onChange={(e) => setField('labels', e.target.value)}
          placeholder="برچسب‌ها (ویرگول)"
          className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={submitLetter}
          className="nexa-btn-primary py-2 px-4 text-sm font-bold"
        >
          ارسال به خروجی
        </button>
      </div>

      <div className="space-y-3">
        {grouped.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">
            {box === 'inbox' ? 'صندوق ورودی خالی است.' : box === 'outbox' ? 'نامه‌ای در خروجی نیست.' : 'آرشیو خالی است.'}
          </p>
        )}
        {grouped.map(({ threadId, items }) => {
          const collapsed = collapsedThreads[threadId] ?? false;
          const threadAll = getLetterThread(threadId);
          const showThreadBadge = threadAll.length > 1;

          return (
            <div key={threadId} className="space-y-2">
              {showThreadBadge && (
                <button
                  type="button"
                  onClick={() => toggleThread(threadId)}
                  className="flex items-center gap-2 text-[10px] font-bold text-gray-500 w-full"
                >
                  {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                  زنجیره ({threadAll.length} نامه)
                </button>
              )}
              {(collapsed ? [] : items).map((l) => (
                <div key={l.id} className="nexa-card p-4 flex gap-3 items-start">
                  <Mail className="text-gray-400 shrink-0" size={20} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-sm text-gray-900">{l.subject}</p>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[l.category]}`}
                      >
                        {MEIZITO_LETTER_CATEGORY_LABELS[l.category]}
                      </span>
                      {l.approvalState && l.approvalState !== 'approved' && (
                        <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                          {MEIZITO_APPROVAL_STATE_LABELS[l.approvalState]}
                        </span>
                      )}
                      {l.status === 'closed' && (
                        <span className="text-[9px] font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                          بسته
                        </span>
                      )}
                      {l.replyToLetterId && (
                        <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          پاسخ
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{l.body}</p>
                    <p className="text-[10px] text-gray-400 mt-1">به: {l.to.join('، ') || '—'}</p>
                    {l.referredTo.length > 0 && (
                      <p className="text-[10px] text-amber-700 mt-0.5">
                        ارجاع به: {l.referredTo.join('، ')}
                      </p>
                    )}
                    {l.referredFrom && (
                      <p className="text-[10px] text-gray-400">ارجاع از: {l.referredFrom}</p>
                    )}
                    {l.attachments.length > 0 && (
                      <p className="text-[10px] text-gray-500 flex flex-wrap items-center gap-2 mt-1">
                        <Paperclip size={10} />
                        {l.attachments.map((a, i) =>
                          a.ncRef ? (
                            <button
                              key={i}
                              type="button"
                              className="text-nexa-accent font-bold hover:underline"
                              onClick={() => openNcFile(a.ncRef!)}
                            >
                              {a.name}
                            </button>
                          ) : (
                            <span key={i}>{a.name}</span>
                          )
                        )}
                      </p>
                    )}
                    {(l.approvalSteps?.length ?? 0) > 0 && (
                      <div className="mt-3 border-t border-nexa-border pt-2">
                        <ApprovalTimeline
                          steps={l.approvalSteps ?? []}
                          approvalState={l.approvalState}
                        />
                        <ApprovalActionsBar
                          approvalState={l.approvalState}
                          currentAssigneeId={l.currentAssigneeId}
                          currentUserId={currentUserId}
                          authorId={l.referredFrom === currentUserName ? currentUserId : ''}
                          mockUsers={mockUsers}
                          onAction={(payload) => recordApprovalAction('letter', l.id, payload)}
                        />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => startReply(l)}
                        className="text-[10px] font-bold text-nexa-accent flex items-center gap-1"
                      >
                        <Reply size={10} />
                        پاسخ
                      </button>
                      <button
                        type="button"
                        onClick={() => startRefer(l)}
                        className="text-[10px] font-bold text-gray-600 flex items-center gap-1"
                      >
                        <Share2 size={10} />
                        ارجاع
                      </button>
                      {l.status === 'open' ? (
                        <button
                          type="button"
                          onClick={() => closeLetter(l.id)}
                          className="text-[10px] font-bold text-gray-600"
                        >
                          پایان مکاتبه
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => reopenLetter(l.id)}
                          className="text-[10px] font-bold text-nexa-accent"
                        >
                          بازگشایی
                        </button>
                      )}
                      {box !== 'archive' && l.status === 'open' && (
                        <button
                          type="button"
                          onClick={() => updateLetterBox(l.id, 'archive')}
                          className="text-[10px] font-bold text-gray-600"
                        >
                          آرشیو
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <NcFilePickerModal
        open={ncPickerOpen}
        onClose={() => setNcPickerOpen(false)}
        onSelect={addNcAttachment}
        initialPath={resolveNcPathForMeizitoLetterDrafts(activeBusinessId)}
      />
    </div>
  );
}
