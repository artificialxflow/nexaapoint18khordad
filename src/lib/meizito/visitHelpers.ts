import type { MeizitoFieldVisit, MeizitoVisitGender } from '@/src/types/meizito';
import { MEIZITO_VISIT_GENDER_LABELS } from '@/src/types/meizito';

export function buildCustomerName(parts: {
  visitorTitle?: string;
  visitorFirstName?: string;
  visitorLastName?: string;
  visitorGender?: MeizitoVisitGender;
}): string {
  const title = parts.visitorTitle?.trim();
  const first = parts.visitorFirstName?.trim();
  const last = parts.visitorLastName?.trim();
  const name = [title, first, last].filter(Boolean).join(' ').trim();
  if (name) return name;
  if (parts.visitorGender && parts.visitorGender !== 'unknown') {
    return MEIZITO_VISIT_GENDER_LABELS[parts.visitorGender];
  }
  return '—';
}

export function parseLegacyCustomerName(raw: string): {
  visitorGender: MeizitoVisitGender;
  visitorTitle?: string;
  visitorFirstName: string;
  visitorLastName: string;
} {
  let s = raw.trim();
  let visitorGender: MeizitoVisitGender = 'unknown';
  let visitorTitle: string | undefined;

  if (s.startsWith('خانم ')) {
    visitorGender = 'female';
    visitorTitle = 'خانم';
    s = s.slice(5).trim();
  } else if (s.startsWith('آقای ')) {
    visitorGender = 'male';
    visitorTitle = 'آقای';
    s = s.slice(5).trim();
  } else if (s.startsWith('آقا ')) {
    visitorGender = 'male';
    visitorTitle = 'آقا';
    s = s.slice(4).trim();
  } else if (s.startsWith('خانم')) {
    visitorGender = 'female';
    visitorTitle = 'خانم';
    s = s.replace(/^خانم\s*/, '').trim();
  }

  const bits = s.split(/\s+/).filter(Boolean);
  const visitorFirstName = bits[0] ?? '';
  const visitorLastName = bits.slice(1).join(' ');

  return { visitorGender, visitorTitle, visitorFirstName, visitorLastName };
}

export function formatVisitorDisplayName(v: MeizitoFieldVisit): string {
  if (v.visitorFirstName || v.visitorLastName) {
    return buildCustomerName({
      visitorTitle: v.visitorTitle,
      visitorFirstName: v.visitorFirstName,
      visitorLastName: v.visitorLastName,
      visitorGender: v.visitorGender,
    });
  }
  return v.customerName?.trim() || '—';
}

export function formatCompanionSummary(v: MeizitoFieldVisit): string {
  const male = v.maleCompanionCount ?? 0;
  const female = v.femaleCompanionCount ?? 0;
  if (male === 0 && female === 0) return '—';
  const parts: string[] = [];
  if (male > 0) parts.push(`${male} آقا`);
  if (female > 0) parts.push(`${female} خانم`);
  return parts.join(' · ');
}

export function totalVisitorCount(v: MeizitoFieldVisit): number {
  const male = v.maleCompanionCount ?? 0;
  const female = v.femaleCompanionCount ?? 0;
  return 1 + male + female;
}

const FA_WEEKDAYS = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];

export function formatVisitWeekday(dateKey: string): string {
  try {
    const d = new Date(`${dateKey}T12:00:00`);
    if (Number.isNaN(d.getTime())) return '';
    return FA_WEEKDAYS[d.getDay()] ?? '';
  } catch {
    return '';
  }
}

export function showEstimatedSaleRange(probabilityLevelId?: string): boolean {
  return probabilityLevelId === 'p100' || probabilityLevelId === 'p75' || probabilityLevelId === 'p50';
}
