'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Star, GripVertical, Search, Paperclip, Cloud } from 'lucide-react';
import { NcFilePickerModal } from '@/src/components/nextcloud/NcFilePickerModal';
import { resolveNcPathForMeizitoCard } from '@/src/lib/nextcloud/paths';
import { openNcFile } from '@/src/lib/nextcloud/uploadClient';
import { useMeizito } from '@/src/context/MeizitoContext';
import type { MeizitoCard } from '@/src/types/meizito';
import type { NcFileRef } from '@/src/types/nextcloud';

function newLocalId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return String(Date.now());
}

export default function BoardsPanel() {
  const {
    boards,
    columns,
    cards,
    activeBoardId,
    setActiveBoardId,
    addBoard,
    addCard,
    moveCard,
    updateCard,
    copyCardForAssignees,
    toggleCardStar,
    addColumn,
    searchCards,
    activeBusinessId,
  } = useMeizito();

  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCol, setNewTaskCol] = useState('');
  const [newTaskSaving, setNewTaskSaving] = useState(false);
  const [newTaskError, setNewTaskError] = useState('');
  const [detail, setDetail] = useState<MeizitoCard | null>(null);
  const [copyNames, setCopyNames] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [labelFilter, setLabelFilter] = useState('');
  const [ncPickerOpen, setNcPickerOpen] = useState(false);

  const boardCols = useMemo(() => {
    return columns
      .filter((c) => c.boardId === activeBoardId)
      .sort((a, b) => a.order - b.order);
  }, [columns, activeBoardId]);

  const board = boards.find((b) => b.id === activeBoardId);

  const visibleCardIds = useMemo(() => {
    const matched = searchCards(activeBoardId, searchQuery, labelFilter || undefined);
    return new Set(matched.map((c) => c.id));
  }, [searchCards, activeBoardId, searchQuery, labelFilter]);

  const hasActiveFilter = searchQuery.trim() !== '' || labelFilter !== '';

  useEffect(() => {
    if (!detail) return;
    const fresh = cards.find((c) => c.id === detail.id);
    if (fresh) setDetail(fresh);
  }, [cards, detail?.id]);

  const openNewTask = () => {
    const first = boardCols[0];
    setNewTaskCol(first?.id ?? '');
    setNewTaskError('');
    setNewTaskOpen(true);
  };

  const submitNewTask = async () => {
    const title = newTaskTitle.trim();
    if (!title) {
      setNewTaskError('عنوان وظیفه را وارد کنید.');
      return;
    }
    if (!activeBoardId) {
      setNewTaskError('ابتدا یک میز کار انتخاب کنید.');
      return;
    }

    setNewTaskSaving(true);
    setNewTaskError('');

    try {
      let targetColumnId = newTaskCol || boardCols[0]?.id || '';
      if (!targetColumnId) {
        const createdColumnId = await addColumn(activeBoardId, 'انجام نشده');
        targetColumnId = createdColumnId || '';
      }
      if (!targetColumnId) throw new Error('ستون پیش‌فرض ساخته نشد.');

      await addCard(activeBoardId, targetColumnId, title);
      setNewTaskTitle('');
      setNewTaskCol('');
      setNewTaskOpen(false);
    } catch (err) {
      setNewTaskError(err instanceof Error ? err.message : 'ثبت وظیفه ناموفق بود.');
    } finally {
      setNewTaskSaving(false);
    }
  };

  const toggleLabelOnDetail = (labelId: string) => {
    if (!detail) return;
    const has = detail.labelIds.includes(labelId);
    const labelIds = has
      ? detail.labelIds.filter((id) => id !== labelId)
      : [...detail.labelIds, labelId];
    updateCard(detail.id, { labelIds });
  };

  const addFileAttachment = (file: File) => {
    if (!detail) return;
    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    updateCard(detail.id, {
      attachments: [
        ...detail.attachments,
        { id: newLocalId(), name: file.name, size: `${sizeKb} KB` },
      ],
    });
  };

  const addNcAttachment = (ref: NcFileRef) => {
    if (!detail) return;
    const sizeKb = ref.size ? Math.max(1, Math.round(ref.size / 1024)) : 0;
    updateCard(detail.id, {
      attachments: [
        ...detail.attachments,
        {
          id: newLocalId(),
          name: ref.name,
          size: sizeKb ? `${sizeKb} KB` : '—',
          ncRef: ref,
        },
      ],
    });
  };

  const memberSummary =
    board && board.memberNames.length > 0
      ? board.memberNames.slice(0, 4).join('، ') + (board.memberNames.length > 4 ? '…' : '')
      : '—';

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-gray-500">میز کار:</span>
            <select
              value={activeBoardId}
              onChange={(e) => setActiveBoardId(e.target.value)}
              className="bg-gray-50 rounded-xl px-3 py-2 text-sm font-bold min-w-[160px]"
            >
              {boards.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                const n = prompt('نام میز کار جدید');
                if (n?.trim()) addBoard(n.trim());
              }}
              className="text-xs font-bold text-nexa-accent px-2"
            >
              + میز جدید
            </button>
            <button
              type="button"
              onClick={() => {
                const t = prompt('عنوان ستون');
                if (t?.trim() && activeBoardId) addColumn(activeBoardId, t.trim());
              }}
              className="text-xs font-bold text-gray-600 px-2"
            >
              + ستون
            </button>
          </div>
          <button
            type="button"
            onClick={openNewTask}
            className="nexa-btn-primary flex items-center gap-2 text-sm py-2 px-4"
          >
            <Plus size={16} />
            وظیفه جدید
          </button>
        </div>

        {board && (
          <p className="text-[10px] text-gray-500">
            اعضا: <span className="font-medium text-gray-700">{memberSummary}</span>
          </p>
        )}

        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو: عنوان، ارجاع، دسته…"
              className="w-full bg-gray-50 rounded-xl py-2 pr-10 pl-3 text-sm"
            />
          </div>
          {board && board.labelPalette.length > 0 && (
            <select
              value={labelFilter}
              onChange={(e) => setLabelFilter(e.target.value)}
              className="bg-gray-50 rounded-xl px-3 py-2 text-xs font-bold"
            >
              <option value="">همه برچسب‌ها</option>
              {board.labelPalette.map((lb) => (
                <option key={lb.id} value={lb.id}>
                  {lb.name}
                </option>
              ))}
            </select>
          )}
          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setLabelFilter('');
              }}
              className="text-[10px] font-bold text-gray-500 hover:text-nexa-accent"
            >
              پاک کردن فیلتر
            </button>
          )}
        </div>
      </div>

      {hasActiveFilter && visibleCardIds.size === 0 && (
        <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-4 py-3">
          کارتی با این فیلتر پیدا نشد.
        </p>
      )}

      <div className="min-w-0 -mx-2 px-2 flex gap-4 overflow-x-auto pb-2 min-h-[420px] custom-scrollbar">
        {boardCols.map((col) => (
          <div
            key={col.id}
            className="shrink-0 w-72 nexa-card p-3 bg-gray-50/80 flex flex-col"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const cardId = e.dataTransfer.getData('text/meizito-card');
              if (cardId) moveCard(cardId, col.id, col.cardIds.length);
            }}
          >
            <p className="text-xs font-black text-gray-700 mb-3 px-1 flex justify-between">
              <span>{col.title}</span>
              <span className="text-gray-400 font-fa-num">
                {col.cardIds.filter((id) => visibleCardIds.has(id)).length}
              </span>
            </p>
            <div className="space-y-2 flex-1">
              {col.cardIds.map((cid) => {
                if (!visibleCardIds.has(cid)) return null;
                const card = cards.find((c) => c.id === cid);
                if (!card) return null;
                return (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/meizito-card', card.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    className="bg-white rounded-xl p-3 border border-nexa-border shadow-sm cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical size={14} className="text-gray-300 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => setDetail(card)}
                          className="text-sm font-bold text-gray-900 text-right w-full"
                        >
                          {card.title}
                        </button>
                        {card.assignee && (
                          <p className="text-[10px] text-gray-500 mt-1">ارجاع: {card.assignee}</p>
                        )}
                        {card.dueDate && (
                          <p className="text-[10px] text-gray-400 mt-0.5 font-fa-num">
                            سررسید: {card.dueDate}
                            {card.dueTime ? ` — ${card.dueTime}` : ''}
                          </p>
                        )}
                        {card.category && (
                          <p className="text-[10px] text-gray-400">{card.category}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {card.labelIds.map((lid) => {
                            const lb = board?.labelPalette.find((l) => l.id === lid);
                            return lb ? (
                              <span
                                key={lid}
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white"
                                style={{ backgroundColor: lb.color }}
                              >
                                {lb.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleCardStar(card.id)}
                        className={card.starred ? 'text-amber-500' : 'text-gray-300'}
                      >
                        <Star size={16} fill={card.starred ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {newTaskOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl border border-nexa-border">
            <p className="font-black text-gray-900 mb-4">ایجاد وظیفه جدید</p>
            <input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="عنوان"
              className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm mb-3"
            />
            <select
              value={newTaskCol}
              onChange={(e) => setNewTaskCol(e.target.value)}
              className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm mb-4"
            >
              {boardCols.length === 0 && <option value="">ستون پیش‌فرض ساخته می‌شود</option>}
              {boardCols.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            {newTaskError && <p className="text-xs font-bold text-red-600 mb-3">{newTaskError}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={submitNewTask}
                disabled={newTaskSaving}
                className="flex-1 nexa-btn-primary py-2 text-sm font-bold disabled:opacity-60"
              >
                {newTaskSaving ? 'در حال ثبت…' : 'ثبت'}
              </button>
              <button
                type="button"
                onClick={() => setNewTaskOpen(false)}
                disabled={newTaskSaving}
                className="flex-1 bg-gray-100 rounded-xl py-2 text-sm font-bold"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-nexa-border shadow-xl">
            <p className="font-black text-lg text-gray-900 mb-4">{detail.title}</p>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs font-bold text-gray-500">توضیح</label>
                <textarea
                  value={detail.description}
                  onChange={(e) => updateCard(detail.id, { description: e.target.value })}
                  className="w-full bg-gray-50 rounded-xl px-3 py-2 mt-1 text-sm"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">دسته</label>
                <input
                  value={detail.category}
                  onChange={(e) => updateCard(detail.id, { category: e.target.value })}
                  className="w-full bg-gray-50 rounded-xl px-3 py-2 mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">برچسب</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {board?.labelPalette.map((lb) => (
                    <button
                      key={lb.id}
                      type="button"
                      onClick={() => toggleLabelOnDetail(lb.id)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                        detail.labelIds.includes(lb.id)
                          ? 'text-white border-transparent'
                          : 'text-gray-600 border-nexa-border bg-white'
                      }`}
                      style={
                        detail.labelIds.includes(lb.id) ? { backgroundColor: lb.color } : undefined
                      }
                    >
                      {lb.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">ارجاع</label>
                <input
                  value={detail.assignee}
                  onChange={(e) => updateCard(detail.id, { assignee: e.target.value })}
                  className="w-full bg-gray-50 rounded-xl px-3 py-2 mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-500">سررسید</label>
                  <input
                    type="date"
                    value={detail.dueDate}
                    onChange={(e) => updateCard(detail.id, { dueDate: e.target.value })}
                    className="w-full bg-gray-50 rounded-xl px-3 py-2 mt-1 font-fa-num"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">ساعت</label>
                  <input
                    type="time"
                    value={detail.dueTime}
                    onChange={(e) => updateCard(detail.id, { dueTime: e.target.value })}
                    className="w-full bg-gray-50 rounded-xl px-3 py-2 mt-1 font-fa-num"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-500">تکرار</label>
                  <select
                    value={detail.recurrence}
                    onChange={(e) =>
                      updateCard(detail.id, { recurrence: e.target.value as MeizitoCard['recurrence'] })
                    }
                    className="w-full bg-gray-50 rounded-xl px-3 py-2 mt-1 text-sm"
                  >
                    <option value="none">بدون تکرار</option>
                    <option value="daily">روزانه</option>
                    <option value="weekly">هفتگی</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">پیوست‌ها</label>
                {detail.attachments.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {detail.attachments.map((att) => (
                      <li key={att.id} className="text-xs text-gray-600 flex items-center gap-2 flex-wrap">
                        <Paperclip size={12} />
                        {att.ncRef ? (
                          <button
                            type="button"
                            className="text-nexa-accent font-bold hover:underline"
                            onClick={() => openNcFile(att.ncRef!)}
                          >
                            {att.name}
                          </button>
                        ) : (
                          <span>{att.name}</span>
                        )}
                        <span className="text-gray-400 font-fa-num">({att.size})</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  <label className="nexa-btn-ghost text-xs py-1.5 px-3 cursor-pointer inline-flex items-center gap-1">
                    <Paperclip size={14} />
                    افزودن فایل
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) addFileAttachment(f);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setNcPickerOpen(true)}
                    className="text-xs font-bold text-gray-500 border border-dashed border-gray-300 rounded-xl px-3 py-1.5 inline-flex items-center gap-1 hover:border-nexa-accent hover:text-nexa-accent"
                  >
                    <Cloud size={14} />
                    Nextcloud
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">چک‌لیست</label>
                <ul className="mt-2 space-y-2">
                  {detail.checklist.map((item) => (
                    <li key={item.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() =>
                          updateCard(detail.id, {
                            checklist: detail.checklist.map((x) =>
                              x.id === item.id ? { ...x, done: !x.done } : x
                            ),
                          })
                        }
                      />
                      <span className="text-xs">{item.title}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="mt-2 text-xs font-bold text-nexa-accent"
                  onClick={() => {
                    const t = prompt('آیتم چک‌لیست');
                    if (!t) return;
                    updateCard(detail.id, {
                      checklist: [...detail.checklist, { id: newLocalId(), title: t, done: false }],
                    });
                  }}
                >
                  + آیتم
                </button>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">کپی برای چند نفر (با ویرگول)</label>
                <input
                  value={copyNames}
                  onChange={(e) => setCopyNames(e.target.value)}
                  className="w-full bg-gray-50 rounded-xl px-3 py-2 mt-1"
                  placeholder="علی، مریم"
                />
                <button
                  type="button"
                  onClick={() => {
                    const parts = copyNames.split(/[،,]/).map((s) => s.trim()).filter(Boolean);
                    copyCardForAssignees(detail.id, parts);
                    setCopyNames('');
                  }}
                  className="mt-2 text-xs font-bold bg-gray-900 text-white rounded-lg px-3 py-1.5"
                >
                  کپی وظیفه
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDetail(null)}
              className="mt-6 w-full bg-gray-100 rounded-xl py-2 text-sm font-bold"
            >
              بستن
            </button>
          </div>
        </div>
      )}

      {detail && (
        <NcFilePickerModal
          open={ncPickerOpen}
          onClose={() => setNcPickerOpen(false)}
          onSelect={addNcAttachment}
          initialPath={resolveNcPathForMeizitoCard(activeBusinessId, detail.boardId, detail.id)}
        />
      )}
    </div>
  );
}
