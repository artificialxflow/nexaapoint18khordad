'use client';

import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { useMeizito } from '@/src/context/MeizitoContext';

export default function BoardInfoPanel() {
  const { boards, columns, cards, activeBoardId, updateBoard } = useMeizito();
  const board = boards.find((b) => b.id === activeBoardId);
  const [name, setName] = useState(board?.name ?? '');
  const [members, setMembers] = useState(board?.memberNames.join('، ') ?? '');

  useEffect(() => {
    setName(board?.name ?? '');
    setMembers(board?.memberNames.join('، ') ?? '');
  }, [board?.id, board?.name, board?.memberNames]);

  if (!board) return <p className="text-sm text-gray-500">بوردی انتخاب نشده.</p>;

  const colCount = columns.filter((c) => c.boardId === board.id).length;
  const cardCount = cards.filter((c) => c.boardId === board.id).length;

  return (
    <div className="space-y-6">
      <p className="text-xs text-gray-500">اطلاعات میز کار — نام، اعضا و آمار بورد</p>
      <div className="nexa-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Info className="text-nexa-accent" size={22} />
          <span className="font-black text-gray-900">ویرایش میز</span>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500">نام میز</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500">اعضا (با ویرگول)</label>
          <input
            value={members}
            onChange={(e) => setMembers(e.target.value)}
            className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm mt-1"
          />
        </div>
        <button
          type="button"
          onClick={() =>
            updateBoard(board.id, {
              name: name.trim(),
              memberNames: members.split(/[،,]/).map((s) => s.trim()).filter(Boolean),
            })
          }
          className="nexa-btn-primary px-4 py-2 text-sm font-bold"
        >
          ذخیره
        </button>
        <div className="pt-4 border-t border-nexa-border grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500">ستون‌ها</p>
            <p className="text-lg font-black font-fa-num">{colCount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">کارت‌ها</p>
            <p className="text-lg font-black font-fa-num">{cardCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
