'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { useMeizito } from '@/src/context/MeizitoContext';

export default function StarredPanel() {
  const { cards, notes, threads, toggleCardStar, toggleNoteStar, toggleThreadStar } = useMeizito();

  const sc = cards.filter((c) => c.starred);
  const sn = notes.filter((n) => n.starred);
  const st = threads.filter((t) => t.starred);

  return (
    <div className="space-y-6">
      <p className="text-xs text-gray-500">نشان‌دار — تصویر ۲۰</p>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="nexa-card p-4">
          <p className="text-xs font-black text-gray-700 mb-3 flex items-center gap-2">
            <Star size={14} className="text-amber-500" fill="currentColor" />
            کارت‌ها
          </p>
          <ul className="space-y-2 text-sm">
            {sc.map((c) => (
              <li key={c.id} className="flex justify-between gap-2">
                <span className="truncate">{c.title}</span>
                <button type="button" className="text-[10px] text-gray-500" onClick={() => toggleCardStar(c.id)}>
                  برداشتن
                </button>
              </li>
            ))}
            {sc.length === 0 && <li className="text-xs text-gray-400">—</li>}
          </ul>
        </div>
        <div className="nexa-card p-4">
          <p className="text-xs font-black text-gray-700 mb-3">یادداشت‌ها</p>
          <ul className="space-y-2 text-sm">
            {sn.map((n) => (
              <li key={n.id} className="flex justify-between gap-2">
                <span className="truncate">{n.title}</span>
                <button type="button" className="text-[10px] text-gray-500" onClick={() => toggleNoteStar(n.id)}>
                  برداشتن
                </button>
              </li>
            ))}
            {sn.length === 0 && <li className="text-xs text-gray-400">—</li>}
          </ul>
        </div>
        <div className="nexa-card p-4">
          <p className="text-xs font-black text-gray-700 mb-3">گفت‌وگو</p>
          <ul className="space-y-2 text-sm">
            {st.map((t) => (
              <li key={t.id} className="flex justify-between gap-2">
                <span className="truncate">{t.title}</span>
                <button type="button" className="text-[10px] text-gray-500" onClick={() => toggleThreadStar(t.id)}>
                  برداشتن
                </button>
              </li>
            ))}
            {st.length === 0 && <li className="text-xs text-gray-400">—</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
