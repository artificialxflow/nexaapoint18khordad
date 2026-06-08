'use client';

import React, { useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  ClipboardList,
  Mail,
  MessageSquare,
  Phone,
} from 'lucide-react';
import Link from 'next/link';
import { useMeizito } from '@/src/context/MeizitoContext';
import type { MeizitoTabId } from '@/src/types/meizito';
import PhoneDirectoryPanel from './PhoneDirectoryPanel';

type Props = {
  onGoTab: (id: MeizitoTabId) => void;
};

export default function CommsHubPanel({ onGoTab }: Props) {
  const {
    letters,
    internalRequests,
    currentUserId,
    getPendingApprovalCounts,
    getCalendarEventsForDate,
    activeCalendarId,
  } = useMeizito();

  const todayKey = new Date().toISOString().slice(0, 10);
  const pending = getPendingApprovalCounts(currentUserId);
  const openLetters = useMemo(
    () => letters.filter((l) => l.status === 'open' && l.box !== 'archive').length,
    [letters]
  );
  const pendingRequests = useMemo(
    () =>
      internalRequests.filter((r) => r.approvalState === 'pending' && r.status === 'open').length,
    [internalRequests]
  );
  const todayEvents = getCalendarEventsForDate(activeCalendarId, todayKey);

  const shortcuts = [
    {
      label: 'گفتگوها',
      href: '/dashboard/chats',
      icon: MessageSquare,
      badge: 0,
    },
    {
      label: 'نامه‌ها',
      action: () => onGoTab('letters'),
      icon: Mail,
      badge: openLetters,
    },
    {
      label: 'درخواست‌ها',
      href: '/dashboard/work-requests',
      icon: ClipboardList,
      badge: pendingRequests,
    },
    {
      label: 'گزارش بازدید',
      action: () => onGoTab('reports'),
      icon: BarChart3,
      badge: 0,
    },
    {
      label: 'تقویم کامل',
      action: () => onGoTab('calendar'),
      icon: Calendar,
      badge: todayEvents.length,
    },
  ];

  return (
    <div className="space-y-8" dir="rtl">
      <div>
        <h2 className="text-lg font-black text-gray-900">مرکز ارتباطات</h2>
        <p className="text-xs text-gray-500 mt-1">
          میانبر به گفتگو، نامه، درخواست، تقویم و دفتر تلفن
        </p>
      </div>

      {(pending.letters > 0 || pending.requests > 0) && (
        <div className="nexa-card p-4 bg-amber-50 border-amber-100">
          <p className="text-xs font-bold text-amber-900">منتظر تایید شما</p>
          <p className="text-[10px] text-amber-800 mt-1">
            {pending.requests > 0 && `${pending.requests} درخواست`}
            {pending.requests > 0 && pending.letters > 0 && ' · '}
            {pending.letters > 0 && `${pending.letters} نامه`}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {shortcuts.map((s) => {
          const Icon = s.icon;
          const inner = (
            <>
              <Icon size={22} className="text-nexa-accent mb-2" />
              <span className="text-xs font-bold text-gray-900">{s.label}</span>
              {s.badge > 0 && (
                <span className="absolute top-2 left-2 text-[9px] font-fa-num bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full">
                  {s.badge}
                </span>
              )}
            </>
          );
          const className =
            'nexa-card p-4 relative flex flex-col items-center text-center hover:border-nexa-accent/40 transition-colors';
          if (s.href) {
            return (
              <Link key={s.label} href={s.href} className={className}>
                {inner}
              </Link>
            );
          }
          return (
            <button key={s.label} type="button" onClick={s.action} className={className}>
              {inner}
            </button>
          );
        })}
        <div className="nexa-card p-4 flex flex-col items-center text-center opacity-90">
          <Phone size={22} className="text-nexa-accent mb-2" />
          <span className="text-xs font-bold text-gray-900">دفتر تلفن</span>
          <span className="text-[9px] text-gray-400 mt-1">پایین صفحه</span>
        </div>
      </div>

      {todayEvents.length > 0 && (
        <div className="nexa-card p-4">
          <p className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1">
            <Calendar size={14} />
            رویدادهای امروز
          </p>
          <ul className="space-y-1">
            {todayEvents.slice(0, 4).map((e) => (
              <li key={e.id} className="text-[10px] text-gray-600 font-fa-num">
                {e.time ? `${e.time} · ` : ''}
                {e.title}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => onGoTab('calendar')}
            className="text-[10px] font-bold text-nexa-accent mt-2 hover:underline"
          >
            تقویم کامل
          </button>
        </div>
      )}

      <PhoneDirectoryPanel />
    </div>
  );
}
