export function defaultBusinessExpiry(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return d;
}

export const DEFAULT_CREDIT_LABEL = 'نامحدود';

export const DEFAULT_FISCAL_YEAR = {
  label: 'سال مالی جاری',
  startDate: '1404/01/01',
  endDate: '1404/12/29',
};
