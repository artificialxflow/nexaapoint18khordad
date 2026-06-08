/** نقش‌های تجاری روی یک پروفایل واحد (چندگانه) */
export type PersonRole = 'customer' | 'supplier' | 'shareholder' | 'subordinate';

export type PersonKind = 'natural' | 'legal';
export type PersonTaxProfile =
  | 'none'
  | 'vat-exempt'
  | 'vat-included'
  | 'vat-zero'
  | 'final-consumer';

export interface PersonAddress {
  id: string;
  label?: string;
  text: string;
  isPrimary: boolean;
  lat?: number;
  lng?: number;
}

export interface PersonPhone {
  id: string;
  label: string;
  number: string;
}

export interface PersonEmail {
  id: string;
  label: string;
  address: string;
}

export interface PersonBankAccount {
  id: string;
  bankName: string;
  accountTitle: string;
  iban: string;
  cardNumber?: string;
  accountNumber?: string;
  /** فقط یک حساب باید true باشد */
  isPrimary?: boolean;
}

export interface PersonImportantDate {
  id: string;
  title: string;
  /** نمایش شمسی یا متنی — فعلاً رشته آزاد */
  date: string;
}

export interface PersonGroupLevel {
  id: string;
  label: string;
}

export interface PersonGroup {
  id: string;
  name: string;
  levels: PersonGroupLevel[];
}

export interface PersonGroupMembership {
  groupId: string;
  levelId: string;
}

export interface PersonLedgerEvent {
  id: string;
  title: string;
  detail?: string;
  at: string;
}

export interface MoneyDocumentLine {
  id: string;
  personId?: string;
  amount: number;
  note?: string;
}

export interface MoneyDocumentAttachment {
  id: string;
  name: string;
  mimeType?: string;
  /** local fallback when Nextcloud is off */
  dataUrl?: string;
  ncRef?: import('@/src/types/nextcloud').NcFileRef;
  createdAt: string;
}

export interface MoneyDocumentHistory {
  id: string;
  action: string;
  at: string;
  by?: string;
}

export interface MoneyDocument {
  id: string;
  number: string;
  date: string;
  project?: string;
  currency: string;
  description?: string;
  lines: MoneyDocumentLine[];
  notes?: string[];
  attachments?: MoneyDocumentAttachment[];
  history?: MoneyDocumentHistory[];
}

export interface ShareholderRecord {
  id: string;
  personId: string;
  percent: number;
}

export interface VendorRecord {
  id: string;
  personId: string;
  sellPercent: number;
  refundPercent: number;
  expenseAccount: string;
  active: boolean;
}

export interface Person {
  id: string;
  accountingCode: string;
  kind: PersonKind;
  title?: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  legalName?: string;
  alias: string;
  nationalId?: string;
  economicCode?: string;
  registrationNo?: string;
  branchCode?: string;
  taxProfile: PersonTaxProfile;
  roles: PersonRole[];
  emails: PersonEmail[];
  primaryEmailId?: string;
  defaultPriceListId?: string;
  referrerName?: string;
  companyName?: string;
  designerName?: string;
  primaryPhoneId?: string;
  /** سلسله‌مراتب: زیرمجموعهٔ چه شخصی (mock) */
  parentPersonId?: string;
  categoryIds: string[];
  groupMemberships: PersonGroupMembership[];
  addresses: PersonAddress[];
  phones: PersonPhone[];
  banks: PersonBankAccount[];
  importantDates: PersonImportantDate[];
  status: 'active' | 'inactive';
  points: number;
  ledger: {
    financial: PersonLedgerEvent[];
    marketing: PersonLedgerEvent[];
    activity: PersonLedgerEvent[];
    orders: PersonLedgerEvent[];
  };
}

export interface PersonCategory {
  id: string;
  name: string;
  parentId?: string;
}

export interface PriceList {
  id: string;
  name: string;
  /** اختیاری — برای لیست‌های سفارشی؛ seedها مقدار دارند */
  tier?: 'retail' | 'wholesale' | 'partner';
}
