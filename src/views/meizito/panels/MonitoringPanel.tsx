'use client';

import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { useMeizito } from '@/src/context/MeizitoContext';

export default function MonitoringPanel() {
  const { cards, columns, activeBoardId, boards } = useMeizito();

  const stats = useMemo(() => {
    const bc = cards.filter((c) => c.boardId === activeBoardId);
    const cols = columns.filter((c) => c.boardId === activeBoardId).sort((a, b) => a.order - b.order);
    return cols.map((col) => ({
      title: col.title,
      count: col.cardIds.length,
      open: col.cardIds.filter((id) => {
        const card = bc.find((x) => x.id === id);
        return card && col.title !== 'انجام شده';
      }).length,
    }));
  }, [cards, columns, activeBoardId]);

  const total = cards.filter((c) => c.boardId === activeBoardId).length;

  return (
    <div className="space-y-6">
      <p className="text-xs text-gray-500">مونیتورینگ میز کار — آمار ساده بورد فعال</p>
      <div className="nexa-card p-6 flex items-center gap-3">
        <BarChart3 className="text-nexa-accent" size={28} />
        <div>
          <p className="text-sm font-black text-gray-900">
            بورد: {boards.find((b) => b.id === activeBoardId)?.name}
          </p>
          <p className="text-2xl font-black font-fa-num text-nexa-accent mt-1">{total} وظیفه</p>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.title} className="nexa-card p-4">
            <p className="text-xs font-bold text-gray-500">{s.title}</p>
            <p className="text-xl font-black font-fa-num text-gray-900 mt-2">{s.count}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
