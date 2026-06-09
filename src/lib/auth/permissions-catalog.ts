export type PermissionDef = {
  key: string;
  labelFa: string;
  module: string;
  sortOrder: number;
};

export const PERMISSION_CATALOG: PermissionDef[] = [
  { key: 'sales:read', labelFa: 'مشاهده فروش', module: 'فروش', sortOrder: 10 },
  { key: 'sales:write', labelFa: 'ثبت و ویرایش فاکتور', module: 'فروش', sortOrder: 11 },
  { key: 'crm:read', labelFa: 'مشاهده CRM', module: 'فروش', sortOrder: 12 },
  { key: 'finance:read', labelFa: 'مشاهده مالی', module: 'مالی', sortOrder: 20 },
  { key: 'finance:write', labelFa: 'مدیریت تراکنش‌ها', module: 'مالی', sortOrder: 21 },
  { key: 'inventory:read', labelFa: 'مشاهده انبار', module: 'انبار', sortOrder: 30 },
  { key: 'inventory:write', labelFa: 'مدیریت موجودی', module: 'انبار', sortOrder: 31 },
  { key: 'reports:read', labelFa: 'مشاهده گزارشات', module: 'گزارشات', sortOrder: 40 },
  { key: 'users:read', labelFa: 'مشاهده کاربران', module: 'سیستم', sortOrder: 50 },
  { key: 'users:write', labelFa: 'مدیریت کاربران', module: 'سیستم', sortOrder: 51 },
  { key: 'invites:read', labelFa: 'مشاهده دعوت‌ها', module: 'سیستم', sortOrder: 52 },
  { key: 'invites:write', labelFa: 'مدیریت دعوت‌ها', module: 'سیستم', sortOrder: 53 },
  { key: 'settings:all', labelFa: 'تنظیمات کامل', module: 'سیستم', sortOrder: 54 },
];

export const ACCESS_LEVEL_PRESETS = [
  { id: 'full' as const, label: 'دسترسی کامل', desc: 'مشابه مدیر سیستم (۰۹)' },
  { id: 'sales_only' as const, label: 'تمرکز فروش', desc: 'فروش و CRM' },
  { id: 'finance_only' as const, label: 'تمرکز مالی', desc: 'مالی و گزارش' },
  { id: 'custom' as const, label: 'سفارشی', desc: 'ترکیب نقش و محدودیت (۰۷–۱۱)' },
];

export function permissionsForPreset(preset: string): Record<string, boolean> {
  switch (preset) {
    case 'full':
      return Object.fromEntries(PERMISSION_CATALOG.map((p) => [p.key, true]));
    case 'sales_only':
      return { 'sales:read': true, 'sales:write': true, 'crm:read': true, 'reports:read': true };
    case 'finance_only':
      return { 'finance:read': true, 'finance:write': true, 'reports:read': true };
    default:
      return {};
  }
}
