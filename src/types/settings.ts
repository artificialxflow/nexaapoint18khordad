export type SettingsProject = {
  id: string;
  name: string;
  isDefault: boolean;
  active: boolean;
  /** کسب‌وکار tenant — فیلتر لیست پروژه‌های تنظیمات */
  businessId?: string;
};

export type BusinessProfile = {
  legalName: string;
  tradeName: string;
  nationalId: string;
  economicCode: string;
  regNo: string;
  phone: string;
  fax: string;
  address: string;
  postalCode: string;
  city: string;
  website: string;
  email: string;
};

export type FiscalYearSettings = {
  label: string;
  startDate: string;
  endDate: string;
};

export type ExchangeRateRow = {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  effectiveDate: string;
};

export type FormBuilderKind =
  | 'sales-invoice'
  | 'purchase-invoice'
  | 'receipt'
  | 'payment'
  | 'transfer'
  | 'other';

export type FormBuilderElementType =
  | 'header'
  | 'seller-buyer'
  | 'lines-table'
  | 'totals'
  | 'footer'
  | 'serial'
  | 'datetime'
  | 'logo'
  | 'signature'
  | 'custom-text';

export type FormBuilderElement = {
  id: string;
  type: FormBuilderElementType;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type FormTemplate = {
  id: string;
  name: string;
  formKind: FormBuilderKind;
  elements: FormBuilderElement[];
  updatedAt: string;
};

export type NotificationRule = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  channel: 'in-app' | 'sms' | 'email';
};

export type AccessLevelPreset = 'full' | 'sales-only' | 'finance-only' | 'custom';

export type BankAccessExample = {
  bankId: string;
  bankName: string;
  allowed: boolean;
};

/** فهرست گزینه‌های قابل تنظیم (تیپ) — مصرف در فرم‌های میز کار و … */
export type SettingsPicklistKind =
  | 'visit-priorities'
  | 'customer-type'
  | 'acquaintance-source'
  | 'contact-method'
  | 'group-membership'
  | 'product-interest-groups'
  | 'purchase-probability-levels'
  | 'estimated-sale-ranges';

export const SETTINGS_PICKLIST_KINDS: SettingsPicklistKind[] = [
  'visit-priorities',
  'customer-type',
  'acquaintance-source',
  'contact-method',
  'group-membership',
  'product-interest-groups',
  'purchase-probability-levels',
  'estimated-sale-ranges',
];

export const SETTINGS_PICKLIST_KIND_LABELS: Record<SettingsPicklistKind, string> = {
  'visit-priorities': 'موضوعات مهم بازدید حضوری',
  'customer-type': 'نوع مشتری',
  'acquaintance-source': 'نحوه آشنایی',
  'contact-method': 'روش ارتباط / مراجعه',
  'group-membership': 'عضویت در گروه',
  'product-interest-groups': 'گروه کالاهای مورد نیاز',
  'purchase-probability-levels': 'احتمال خرید (درصد)',
  'estimated-sale-ranges': 'مبلغ فروش احتمالی',
};

export type SettingsPicklistItem = {
  id: string;
  label: string;
  active: boolean;
  order: number;
  /** محدود به tenant — خالی = سراسری */
  businessId?: string;
};

export type SettingsPicklist = {
  kind: SettingsPicklistKind;
  items: SettingsPicklistItem[];
};
