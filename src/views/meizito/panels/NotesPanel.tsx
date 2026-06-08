'use client';

import React, { useMemo, useState } from 'react';
import { Cloud, LayoutGrid, Plus, StickyNote, Trash2, Archive, Paperclip } from 'lucide-react';
import { NcFilePickerModal } from '@/src/components/nextcloud/NcFilePickerModal';
import { NEXA_ROOT } from '@/src/lib/nextcloud/paths';
import { openNcFile } from '@/src/lib/nextcloud/uploadClient';
import { useMeizito } from '@/src/context/MeizitoContext';
import type { NcFileRef } from '@/src/types/nextcloud';

const NOTES_NC_PATH = `${NEXA_ROOT}/meizito/notes/`;

const COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff', '#f5f5f4'];

type ListMode = 'active' | 'archived' | 'deleted';

function newChecklistId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return String(Date.now());
}

export default function NotesPanel() {
  const {
    notes,
    noteBoards,
    activeNoteBoardId,
    setActiveNoteBoardId,
    addNoteBoard,
    addNote,
    updateNote,
    toggleNoteStar,
    archiveNote,
  } = useMeizito();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [listMode, setListMode] = useState<ListMode>('active');
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [pendingNc, setPendingNc] = useState<NcFileRef[]>([]);
  const [ncPickerOpen, setNcPickerOpen] = useState(false);

  const activeBoard = useMemo(
    () => noteBoards.find((b) => b.id === activeNoteBoardId) ?? noteBoards[0],
    [noteBoards, activeNoteBoardId]
  );

  const boardNotes = useMemo(() => {
    const bid = activeBoard?.id ?? activeNoteBoardId;
    return notes.filter((n) => n.boardId === bid);
  }, [notes, activeBoard, activeNoteBoardId]);

  const visible = useMemo(() => {
    if (listMode === 'deleted') return boardNotes.filter((n) => n.deletedAt);
    if (listMode === 'archived') return boardNotes.filter((n) => n.archived && !n.deletedAt);
    return boardNotes.filter((n) => !n.deletedAt && !n.archived);
  }, [boardNotes, listMode]);

  const otherBoards = useMemo(
    () => noteBoards.filter((b) => b.id !== activeBoard?.id),
    [noteBoards, activeBoard]
  );

  const createBoard = () => {
    const name = newBoardName.trim();
    if (!name) return;
    addNoteBoard(name);
    setNewBoardName('');
    setShowNewBoard(false);
  };

  const moveToBoard = (noteId: string, targetBoardId: string) => {
    updateNote(noteId, { boardId: targetBoardId });
  };

  return (
    <div className="space-y-6">
      <p className="text-xs text-gray-500">یادداشت‌ها — بوردهای یادداشت</p>

      <div className="flex flex-wrap items-center gap-2">
        {noteBoards
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setActiveNoteBoardId(b.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                b.id === activeNoteBoardId
                  ? 'bg-white border-nexa-accent text-nexa-accent shadow-sm'
                  : 'bg-gray-50 border-transparent text-gray-600'
              }`}
            >
              <span
                className="w-3 h-3 rounded-full shrink-0 border border-black/10"
                style={{ backgroundColor: b.color ?? '#e5e7eb' }}
              />
              {b.name}
            </button>
          ))}
        <button
          type="button"
          onClick={() => setShowNewBoard((v) => !v)}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-700"
        >
          <LayoutGrid size={14} />
          بورد جدید
        </button>
      </div>

      {showNewBoard && (
        <div className="flex flex-wrap gap-2 items-center">
          <input
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            placeholder="نام بورد"
            className="bg-gray-50 rounded-xl px-3 py-2 text-sm flex-1 min-w-[140px]"
            onKeyDown={(e) => e.key === 'Enter' && createBoard()}
          />
          <button type="button" onClick={createBoard} className="nexa-btn-primary py-2 px-4 text-xs font-bold">
            ایجاد
          </button>
        </div>
      )}

      {activeBoard && (
        <div
          className="rounded-2xl px-4 py-3 border border-nexa-border flex items-center gap-3"
          style={{ backgroundColor: `${activeBoard.color ?? '#f3f4f6'}55` }}
        >
          <StickyNote size={18} className="text-gray-600" />
          <div>
            <p className="text-sm font-black text-gray-900">{activeBoard.name}</p>
            <p className="text-[10px] text-gray-500">
              {boardNotes.filter((n) => !n.deletedAt && !n.archived).length} یادداشت فعال
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {(
          [
            ['active', 'فعال'],
            ['archived', 'آرشیو'],
            ['deleted', 'حذف‌شده'],
          ] as const
        ).map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            onClick={() => setListMode(mode)}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl ${
              listMode === mode ? 'bg-nexa-accent text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {listMode === 'active' && (
        <div className="nexa-card p-5 space-y-3">
          <p className="text-sm font-black flex items-center gap-2">
            <Plus size={16} />
            یادداشت جدید
            {activeBoard && (
              <span className="text-[10px] font-normal text-gray-500">→ {activeBoard.name}</span>
            )}
          </p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان"
            className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm"
            placeholder="متن"
          />
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-gray-900' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          {pendingNc.length > 0 && (
            <p className="text-[10px] text-gray-500 flex flex-wrap gap-2">
              {pendingNc.map((ref) => (
                <span key={ref.path} className="flex items-center gap-1">
                  <Paperclip size={10} />
                  {ref.name}
                </span>
              ))}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setNcPickerOpen(true)}
              className="text-xs font-bold bg-gray-100 px-3 py-1.5 rounded-xl flex items-center gap-1"
            >
              <Cloud size={12} />
              پیوست تصویر/فایل
            </button>
            <button
              type="button"
              onClick={() => {
                addNote(
                  title || 'بدون عنوان',
                  content,
                  color,
                  activeNoteBoardId,
                  pendingNc.length ? pendingNc : undefined
                );
                setTitle('');
                setContent('');
                setPendingNc([]);
              }}
              className="nexa-btn-primary py-2 px-4 text-sm font-bold"
            >
              ذخیره
            </button>
          </div>
        </div>
      )}

      {visible.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">
          {listMode === 'active'
            ? 'یادداشتی در این بورد نیست.'
            : listMode === 'archived'
              ? 'آرشیو این بورد خالی است.'
              : 'یادداشت حذف‌شده‌ای نیست.'}
        </p>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {visible.map((n) => (
          <div
            key={n.id}
            className="rounded-2xl p-4 border border-nexa-border shadow-sm"
            style={{ backgroundColor: n.color }}
          >
            <div className="flex justify-between items-start gap-2">
              <StickyNote size={18} className="text-gray-600 shrink-0" />
              <button type="button" onClick={() => toggleNoteStar(n.id)} className="text-amber-600 text-xs font-bold">
                {n.starred ? '★' : '☆'}
              </button>
            </div>
            <p className="font-bold text-sm text-gray-900 mt-2">{n.title}</p>
            <p className="text-xs text-gray-700 mt-1 line-clamp-4">{n.content}</p>
            {(n.ncAttachments?.length ?? 0) > 0 && (
              <p className="text-[10px] mt-1 flex flex-wrap gap-2">
                {n.ncAttachments!.map((ref) => (
                  <button
                    key={ref.path}
                    type="button"
                    className="text-nexa-accent font-bold underline flex items-center gap-0.5"
                    onClick={() => openNcFile(ref)}
                  >
                    <Paperclip size={10} />
                    {ref.name}
                  </button>
                ))}
              </p>
            )}
            <ul className="mt-2 space-y-1">
              {n.checklist.map((item) => (
                <li key={item.id} className="flex items-center gap-2 text-[10px]">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() =>
                      updateNote(n.id, {
                        checklist: n.checklist.map((x) =>
                          x.id === item.id ? { ...x, done: !x.done } : x
                        ),
                      })
                    }
                  />
                  {item.title}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                className="text-[10px] font-bold text-nexa-accent"
                onClick={() => {
                  const t = prompt('آیتم چک‌لیست');
                  if (!t) return;
                  updateNote(n.id, {
                    checklist: [...n.checklist, { id: newChecklistId(), title: t, done: false }],
                  });
                }}
              >
                + چک
              </button>
              {listMode === 'active' && (
                <>
                  <button
                    type="button"
                    className="text-[10px] font-bold flex items-center gap-1"
                    onClick={() => archiveNote(n.id, true)}
                  >
                    <Archive size={12} /> آرشیو
                  </button>
                  <button
                    type="button"
                    className="text-[10px] font-bold text-rose-600 flex items-center gap-1"
                    onClick={() => updateNote(n.id, { deletedAt: new Date().toISOString() })}
                  >
                    <Trash2 size={12} /> حذف
                  </button>
                </>
              )}
              {listMode === 'archived' && (
                <button
                  type="button"
                  className="text-[10px] font-bold text-gray-600"
                  onClick={() => archiveNote(n.id, false)}
                >
                  بازگردانی
                </button>
              )}
              {listMode === 'deleted' && (
                <button
                  type="button"
                  className="text-[10px] font-bold text-gray-600"
                  onClick={() => updateNote(n.id, { deletedAt: null })}
                >
                  بازیابی
                </button>
              )}
              {otherBoards.length > 0 && listMode === 'active' && (
                <select
                  className="text-[10px] font-bold bg-white/80 rounded-lg px-1 py-0.5 border border-black/10"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) moveToBoard(n.id, e.target.value);
                  }}
                >
                  <option value="">انتقال به بورد</option>
                  {otherBoards.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        ))}
      </div>

      <NcFilePickerModal
        open={ncPickerOpen}
        onClose={() => setNcPickerOpen(false)}
        onSelect={(ref) => setPendingNc((prev) => [...prev, ref])}
        initialPath={NOTES_NC_PATH}
      />
    </div>
  );
}

