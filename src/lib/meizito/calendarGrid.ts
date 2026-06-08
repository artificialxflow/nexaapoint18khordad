import type { MeizitoCalendarKind } from '@/src/types/meizito';

/** تقویم میلادی با برچسب‌های fa-IR (بدون وابستگی jalaali) */

export const WEEKDAY_LABELS_FA = [
  'شنبه',
  'یک‌شنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
] as const;

export type MonthCell = {
  date: Date;
  dateKey: string;
  inMonth: boolean;
};

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, day] = key.split('-').map(Number);
  return new Date(y, m - 1, day);
}

export function buildMonthGrid(viewYear: number, viewMonth: number): MonthCell[] {
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startOffset = (firstOfMonth.getDay() + 1) % 7;
  const startDate = new Date(viewYear, viewMonth, 1 - startOffset);
  const cells: MonthCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    cells.push({
      date: d,
      dateKey: toDateKey(d),
      inMonth: d.getMonth() === viewMonth,
    });
  }
  return cells;
}

export function formatMonthYearFa(year: number, month: number): string {
  const d = new Date(year, month, 1);
  return new Intl.DateTimeFormat('fa-IR', {
    month: 'long',
    year: 'numeric',
    calendar: 'gregory',
  }).format(d);
}

export const CALENDAR_KIND_LABELS: Record<MeizitoCalendarKind, string> = {
  customer_followup: 'پیگیری مشتری',
  service: 'خدمت‌رسانی',
  general: 'عمومی / وظایف',
  custom: 'سفارشی',
};
