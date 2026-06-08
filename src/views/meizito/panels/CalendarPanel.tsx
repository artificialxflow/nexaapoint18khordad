'use client';

import React, { useMemo, useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Share2,
  X,
  RefreshCw,
} from 'lucide-react';
import { useCatalog } from '@/src/context/CatalogContext';
import { useMeizito } from '@/src/context/MeizitoContext';
import {
  buildMonthGrid,
  formatMonthYearFa,
  parseDateKey,
  toDateKey,
  WEEKDAY_LABELS_FA,
  CALENDAR_KIND_LABELS,
} from '@/src/lib/meizito/calendarGrid';
import type { MeizitoCalendarEvent, MeizitoCalendarKind, MeizitoTabId } from '@/src/types/meizito';
import { MEIZITO_TASKS_CALENDAR_ID } from '@/src/types/meizito';

const CALENDAR_COLORS = ['#f59e0b', '#10b981', '#6366f1', '#ef4444', '#8b5cf6', '#ec4899'];

type Props = { onGoTab: (id: MeizitoTabId) => void };

function isDerivedEvent(id: string) {
  return id.startsWith('derived-card-') || id.startsWith('sync-');
}

export default function CalendarPanel({ onGoTab }: Props) {
  const { people } = useCatalog();
  const {
    calendars,
    calendarEvents,
    activeCalendarId,
    setActiveCalendarId,
    addCalendar,
    updateCalendar,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    getCalendarEventsForDate,
    syncEventsFromCards,
    cards,
    currentUserName,
    getCardsDueOn,
    getOverdueCards,
  } = useMeizito();

  const today = useMemo(() => new Date(), []);
  const todayKey = toDateKey(today);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);

  const [showNewCalendar, setShowNewCalendar] = useState(false);
  const [newCalName, setNewCalName] = useState('');
  const [newCalKind, setNewCalKind] = useState<MeizitoCalendarKind>('custom');
  const [newCalColor, setNewCalColor] = useState(CALENDAR_COLORS[0]);

  const [showShare, setShowShare] = useState(false);
  const [shareIds, setShareIds] = useState<string[]>([]);

  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MeizitoCalendarEvent | null>(null);
  const [evtTitle, setEvtTitle] = useState('');
  const [evtDate, setEvtDate] = useState(todayKey);
  const [evtTime, setEvtTime] = useState('');
  const [evtNotes, setEvtNotes] = useState('');

  const activeCalendar = useMemo(
    () => calendars.find((c) => c.id === activeCalendarId) ?? calendars[0],
    [calendars, activeCalendarId]
  );

  const monthCells = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const selectedEvents = useMemo(
    () => getCalendarEventsForDate(activeCalendarId, selectedDateKey),
    [activeCalendarId, selectedDateKey, getCalendarEventsForDate, calendarEvents, cards]
  );

  const sidebarStats = useMemo(() => {
    const myToday = getCardsDueOn(todayKey).filter((c) => c.assignee === currentUserName).length;
    const overdue = getOverdueCards(todayKey).length;
    const others = cards.filter(
      (c) => c.assignee && c.assignee !== currentUserName && c.dueDate
    ).length;
    return { myToday, overdue, others };
  }, [cards, currentUserName, getCardsDueOn, getOverdueCards, todayKey]);

  const shiftMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDateKey(todayKey);
  };

  const openShare = () => {
    setShareIds(activeCalendar?.sharedWith ?? []);
    setShowShare(true);
  };

  const saveShare = () => {
    if (activeCalendar) updateCalendar(activeCalendar.id, { sharedWith: shareIds });
    setShowShare(false);
  };

  const openNewEvent = (dateKey?: string) => {
    setEditingEvent(null);
    setEvtTitle('');
    setEvtDate(dateKey ?? selectedDateKey);
    setEvtTime('');
    setEvtNotes('');
    setShowEventModal(true);
  };

  const openEditEvent = (evt: MeizitoCalendarEvent) => {
    if (isDerivedEvent(evt.id)) return;
    setEditingEvent(evt);
    setEvtTitle(evt.title);
    setEvtDate(evt.date);
    setEvtTime(evt.time ?? '');
    setEvtNotes(evt.notes ?? '');
    setShowEventModal(true);
  };

  const saveEvent = () => {
    const title = evtTitle.trim();
    if (!title) return;
    const payload = {
      calendarId: activeCalendarId,
      title,
      date: evtDate,
      time: evtTime.trim() || undefined,
      notes: evtNotes.trim() || undefined,
    };
    if (editingEvent) {
      updateCalendarEvent(editingEvent.id, payload);
    } else {
      addCalendarEvent(payload);
    }
    setShowEventModal(false);
  };

  const submitNewCalendar = () => {
    if (!newCalName.trim()) return;
    addCalendar(newCalName, newCalKind, newCalColor);
    setShowNewCalendar(false);
    setNewCalName('');
    setNewCalKind('custom');
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        تقویم میلادی با برچسب فارسی (fa-IR) — هفته از شنبه
      </p>

      <div className="flex flex-col lg:flex-row gap-4">
        <aside className="lg:w-44 shrink-0 space-y-2">
          <p className="text-[10px] font-bold text-gray-500">خلاصه وظایف</p>
          <div className="nexa-card p-3 space-y-2 text-xs">
            <p>
              <span className="font-bold text-nexa-accent">{sidebarStats.myToday}</span> کار من امروز
            </p>
            <p>
              <span className="font-bold text-rose-600">{sidebarStats.overdue}</span> معوق
            </p>
            <p>
              <span className="font-bold text-gray-600">{sidebarStats.others}</span> پیگیری از دیگران
            </p>
          </div>
          {activeCalendarId === MEIZITO_TASKS_CALENDAR_ID && (
            <button
              type="button"
              onClick={syncEventsFromCards}
              className="w-full text-[10px] font-bold flex items-center justify-center gap-1 py-2 rounded-xl bg-gray-100"
            >
              <RefreshCw size={12} />
              همگام‌سازی کارت‌ها
            </button>
          )}
        </aside>

        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {calendars.filter((cal) => cal.visible !== false).map((cal) => (
              <button
                key={cal.id}
                type="button"
                onClick={() => setActiveCalendarId(cal.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border ${
                  cal.id === activeCalendarId
                    ? 'bg-white shadow-sm border-gray-200'
                    : 'border-transparent bg-gray-50 text-gray-600'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: cal.color }}
                />
                {cal.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowNewCalendar(true)}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-gray-100"
            >
              <Plus size={14} />
              تقویم جدید
            </button>
            {activeCalendar && (
              <button
                type="button"
                onClick={() =>
                  updateCalendar(activeCalendar.id, { visible: activeCalendar.visible === false })
                }
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-gray-100"
              >
                {activeCalendar.visible === false ? 'نمایش تقویم' : 'مخفی کردن'}
              </button>
            )}
            <button
              type="button"
              onClick={openShare}
              disabled={!activeCalendar}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-gray-100 disabled:opacity-50"
            >
              <Share2 size={14} />
              اشتراک
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="p-2 rounded-xl bg-gray-100"
                aria-label="ماه قبل"
              >
                <ChevronRight size={18} />
              </button>
              <p className="text-sm font-black text-gray-900 min-w-[140px] text-center">
                {formatMonthYearFa(viewYear, viewMonth)}
              </p>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="p-2 rounded-xl bg-gray-100"
                aria-label="ماه بعد"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
            <button
              type="button"
              onClick={goToday}
              className="text-xs font-bold text-nexa-accent px-3 py-1.5 rounded-xl bg-nexa-accent/10"
            >
              امروز
            </button>
          </div>

          <div className="overflow-x-auto -mx-1 px-1">
            <div className="min-w-[320px]">
              <div className="grid grid-cols-7 gap-1 mb-1">
                {WEEKDAY_LABELS_FA.map((label) => (
                  <div key={label} className="text-center text-[10px] font-bold text-gray-500 py-1">
                    {label}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {monthCells.map((cell) => {
                  const events = getCalendarEventsForDate(activeCalendarId, cell.dateKey);
                  const isToday = cell.dateKey === todayKey;
                  const isSelected = cell.dateKey === selectedDateKey;
                  return (
                    <button
                      key={cell.dateKey}
                      type="button"
                      onClick={() => setSelectedDateKey(cell.dateKey)}
                      className={`min-h-[72px] sm:min-h-[88px] p-1 rounded-xl border text-right transition-colors ${
                        !cell.inMonth ? 'opacity-40 bg-gray-50/50' : 'bg-white'
                      } ${isSelected ? 'ring-2 ring-nexa-accent border-nexa-accent' : 'border-gray-100'} ${
                        isToday ? 'bg-nexa-accent/5' : ''
                      }`}
                    >
                      <span
                        className={`text-[10px] font-bold block mb-0.5 ${
                          isToday ? 'text-nexa-accent' : 'text-gray-700'
                        }`}
                      >
                        {new Intl.DateTimeFormat('fa-IR', { day: 'numeric' }).format(cell.date)}
                      </span>
                      <ul className="space-y-0.5">
                        {events.slice(0, 3).map((ev) => (
                          <li
                            key={ev.id}
                            className="text-[8px] sm:text-[9px] font-bold truncate rounded px-0.5 text-white"
                            style={{ backgroundColor: activeCalendar?.color ?? '#6366f1' }}
                          >
                            {ev.title}
                          </li>
                        ))}
                        {events.length > 3 && (
                          <li className="text-[8px] text-gray-400">+{events.length - 3}</li>
                        )}
                      </ul>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <aside className="lg:w-56 shrink-0">
          <div className="nexa-card p-4 space-y-3 sticky top-4">
            <p className="text-xs font-black text-gray-900 flex items-center gap-2">
              <Calendar size={14} />
              {new Intl.DateTimeFormat('fa-IR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                calendar: 'gregory',
              }).format(parseDateKey(selectedDateKey))}
            </p>
            <button
              type="button"
              onClick={() => openNewEvent(selectedDateKey)}
              className="w-full nexa-btn-primary py-2 text-xs font-bold"
            >
              + رویداد جدید
            </button>
            {selectedEvents.length === 0 ? (
              <p className="text-xs text-gray-400">رویدادی نیست.</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {selectedEvents.map((ev) => (
                  <li
                    key={ev.id}
                    className="text-xs border border-gray-100 rounded-xl p-2 space-y-1"
                  >
                    <p className="font-bold text-gray-900">{ev.title}</p>
                    {ev.time && <p className="text-[10px] text-gray-500">{ev.time}</p>}
                    {ev.sourceCardId && (
                      <button
                        type="button"
                        className="text-[10px] font-bold text-nexa-accent"
                        onClick={() => onGoTab('boards')}
                      >
                        مشاهده کارت
                      </button>
                    )}
                    {!isDerivedEvent(ev.id) && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-[10px] font-bold text-gray-600"
                          onClick={() => openEditEvent(ev)}
                        >
                          ویرایش
                        </button>
                        <button
                          type="button"
                          className="text-[10px] font-bold text-rose-600"
                          onClick={() => deleteCalendarEvent(ev.id)}
                        >
                          حذف
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      {showNewCalendar && (
        <Modal title="تقویم جدید" onClose={() => setShowNewCalendar(false)}>
          <input
            value={newCalName}
            onChange={(e) => setNewCalName(e.target.value)}
            placeholder="نام تقویم"
            className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm mb-3"
          />
          <select
            value={newCalKind}
            onChange={(e) => setNewCalKind(e.target.value as MeizitoCalendarKind)}
            className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm mb-3"
          >
            {(Object.keys(CALENDAR_KIND_LABELS) as MeizitoCalendarKind[]).map((k) => (
              <option key={k} value={k}>
                {CALENDAR_KIND_LABELS[k]}
              </option>
            ))}
          </select>
          <div className="flex gap-2 flex-wrap mb-4">
            {CALENDAR_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewCalColor(c)}
                className={`w-8 h-8 rounded-full border-2 ${
                  newCalColor === c ? 'border-gray-900' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button type="button" onClick={submitNewCalendar} className="nexa-btn-primary w-full py-2 text-sm font-bold">
            ایجاد
          </button>
        </Modal>
      )}

      {showShare && activeCalendar && (
        <Modal title={`اشتراک — ${activeCalendar.name}`} onClose={() => setShowShare(false)}>
          {people.length === 0 ? (
            <p className="text-sm text-gray-500">اشخاصی در سیستم ثبت نشده است.</p>
          ) : (
            <ul className="max-h-48 overflow-y-auto space-y-1 mb-4">
              {people.map((p) => (
                <label key={p.id} className="flex items-center gap-2 px-2 py-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shareIds.includes(p.id)}
                    onChange={() =>
                      setShareIds((prev) =>
                        prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id]
                      )
                    }
                  />
                  <span className="text-sm">{p.displayName}</span>
                </label>
              ))}
            </ul>
          )}
          <button type="button" onClick={saveShare} className="nexa-btn-primary w-full py-2 text-sm font-bold">
            ذخیره اشتراک
          </button>
        </Modal>
      )}

      {showEventModal && (
        <Modal
          title={editingEvent ? 'ویرایش رویداد' : 'رویداد جدید'}
          onClose={() => setShowEventModal(false)}
        >
          <input
            value={evtTitle}
            onChange={(e) => setEvtTitle(e.target.value)}
            placeholder="عنوان"
            className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm mb-2"
          />
          <input
            type="date"
            value={evtDate}
            onChange={(e) => setEvtDate(e.target.value)}
            className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm mb-2"
          />
          <input
            type="time"
            value={evtTime}
            onChange={(e) => setEvtTime(e.target.value)}
            placeholder="ساعت"
            className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm mb-2"
          />
          <textarea
            value={evtNotes}
            onChange={(e) => setEvtNotes(e.target.value)}
            rows={2}
            placeholder="یادداشت"
            className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm mb-3"
          />
          <button type="button" onClick={saveEvent} className="nexa-btn-primary w-full py-2 text-sm font-bold">
            ذخیره
          </button>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute left-3 top-3 p-1 text-gray-400 hover:text-gray-700"
          aria-label="بستن"
        >
          <X size={18} />
        </button>
        <p className="text-sm font-black text-gray-900 mb-4 pr-6">{title}</p>
        {children}
      </div>
    </div>
  );
}
