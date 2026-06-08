'use client';

import React, { useMemo, useState } from 'react';
import { Copy, Phone, Search, Users } from 'lucide-react';
import Link from 'next/link';
import { useMeizito } from '@/src/context/MeizitoContext';
import type { TeamDirectoryFilter } from '@/src/lib/meizito/approval';

export default function PhoneDirectoryPanel() {
  const { listTeamDirectory } = useMeizito();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<TeamDirectoryFilter>('all');

  const departments = useMemo(() => {
    const set = new Set<string>();
    listTeamDirectory('all').forEach((u) => {
      if (u.department) set.add(u.department);
    });
    return [...set];
  }, [listTeamDirectory]);

  const list = useMemo(
    () => listTeamDirectory(filter, search),
    [listTeamDirectory, filter, search]
  );

  const copyNumber = (num: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(num.replace(/\D/g, ''));
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <Phone className="text-nexa-accent" size={22} />
        <div>
          <h3 className="text-sm font-black text-gray-900">دفتر تلفن</h3>
          <p className="text-[10px] text-gray-500">پرسنل داخلی — تماس سریع</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو نام، واحد، موبایل…"
          className="w-full bg-gray-50 rounded-xl py-2 pr-9 pl-3 text-xs"
        />
      </div>

      <div className="flex flex-wrap gap-1">
        {(['all', 'managers', ...departments] as TeamDirectoryFilter[]).map((f) => (
          <button
            key={String(f)}
            type="button"
            onClick={() => setFilter(f)}
            className={`text-[9px] font-bold px-2 py-1 rounded-lg border ${
              filter === f ? 'bg-nexa-accent text-white border-nexa-accent' : 'bg-white border-nexa-border'
            }`}
          >
            {f === 'all' ? 'همه' : f === 'managers' ? 'مدیران' : f}
          </button>
        ))}
      </div>

      <ul className="space-y-2 max-h-[360px] overflow-y-auto">
        {list.map((u) => (
          <li key={u.id} className="nexa-card p-3 flex gap-3 items-start">
            <div className="w-9 h-9 rounded-full bg-nexa-accent/10 flex items-center justify-center shrink-0">
              <Users size={16} className="text-nexa-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">
                {u.name}
                {u.role === 'senior_manager' && (
                  <span className="text-[9px] mr-1 text-blue-600">(مدیر بالاتر)</span>
                )}
                {u.role === 'manager' && (
                  <span className="text-[9px] mr-1 text-amber-600">(مدیر)</span>
                )}
              </p>
              <p className="text-[10px] text-gray-500">
                {[u.jobTitle, u.department].filter(Boolean).join(' · ') || '—'}
              </p>
              {u.mobile && (
                <p className="text-xs text-gray-700 font-fa-num mt-1">{u.mobile}</p>
              )}
              {u.extension && (
                <p className="text-[10px] text-gray-400 font-fa-num">داخلی: {u.extension}</p>
              )}
              <div className="flex gap-2 mt-2">
                {u.mobile && (
                  <>
                    <a
                      href={`tel:${u.mobile.replace(/[^\d+]/g, '')}`}
                      className="text-[10px] font-bold text-nexa-accent flex items-center gap-0.5"
                    >
                      <Phone size={10} />
                      تماس
                    </a>
                    <button
                      type="button"
                      onClick={() => copyNumber(u.mobile!)}
                      className="text-[10px] font-bold text-gray-500 flex items-center gap-0.5"
                    >
                      <Copy size={10} />
                      کپی
                    </button>
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
        {list.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6">موردی یافت نشد.</p>
        )}
      </ul>

      <Link
        href="/dashboard/people"
        className="block text-center text-[10px] font-bold text-nexa-accent hover:underline"
      >
        مخاطبین CRM (اشخاص) →
      </Link>
    </div>
  );
}
