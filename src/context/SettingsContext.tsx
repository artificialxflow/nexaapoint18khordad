'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  BusinessProfile,
  ExchangeRateRow,
  FiscalYearSettings,
  FormBuilderElement,
  FormBuilderKind,
  FormTemplate,
  NotificationRule,
  SettingsPicklist,
  SettingsPicklistItem,
  SettingsPicklistKind,
  SettingsProject,
} from '@/src/types/settings';
import { MEIZITO_VISIT_PRIORITY_TAG_LABELS } from '@/src/types/meizito';
import { SETTINGS_PICKLIST_KINDS } from '@/src/types/settings';

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return String(Date.now());
}

const STORAGE_KEY = 'nexa-settings-v1';

type StoredSettings = Partial<{
  projects: SettingsProject[];
  business: BusinessProfile;
  fiscalYear: FiscalYearSettings;
  exchangeRates: ExchangeRateRow[];
  formTemplates: FormTemplate[];
  notificationRules: NotificationRule[];
  picklists: SettingsPicklist[];
  draftFormKind: FormBuilderKind;
  draftFormName: string;
  draftElements: FormBuilderElement[];
}>;

const defaultBusiness = (): BusinessProfile => ({
  legalName: '',
  tradeName: '',
  nationalId: '',
  economicCode: '',
  regNo: '',
  phone: '',
  fax: '',
  address: '',
  postalCode: '',
  city: '',
  website: '',
  email: '',
});

const defaultFiscal = (): FiscalYearSettings => ({
  label: 'سال مالی ۱۴۰۴',
  startDate: '1404/01/01',
  endDate: '1404/12/29',
});

function readStored(): StoredSettings {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StoredSettings;
  } catch {
    return {};
  }
}

const seedProjects: SettingsProject[] = [
  { id: 'p1', name: 'پروژه A', isDefault: true, active: true, businessId: 'biz-demo' },
  { id: 'p2', name: 'پروژه B', isDefault: false, active: true, businessId: 'biz-demo' },
];

const seedRates: ExchangeRateRow[] = [
  { id: 'rate-seed-usd', fromCurrency: 'USD', toCurrency: 'IRR', rate: 42000, effectiveDate: '1404/08/01' },
  { id: 'rate-seed-eur', fromCurrency: 'EUR', toCurrency: 'IRR', rate: 45500, effectiveDate: '1404/08/01' },
];

const seedNotifications: NotificationRule[] = [
  {
    id: 'n1',
    title: 'سررسید چک',
    description: 'یادآوری قبل از سررسید چک‌های دریافتی و پرداختی',
    enabled: true,
    channel: 'in-app',
  },
  {
    id: 'n2',
    title: 'اقساط فروش',
    description: 'اطلاع‌رسانی سررسید اقساط قراردادهای فروش اقساطی',
    enabled: true,
    channel: 'sms',
  },
  {
    id: 'n3',
    title: 'اعتبار اسناد',
    description: 'هشدار نزدیک شدن به پایان اعتبار فاکتور یا قرارداد',
    enabled: false,
    channel: 'email',
  },
  {
    id: 'n4',
    title: 'یادآوری گزارش روز',
    description: 'یادآوری ثبت گزارش عملکرد روزانه در میز کار (فقط داخل برنامه)',
    enabled: true,
    channel: 'in-app',
  },
];

function itemsFromPairs(pairs: [string, string][]): SettingsPicklistItem[] {
  return pairs.map(([id, label], order) => ({ id, label, active: true, order }));
}

function seedForKind(kind: SettingsPicklistKind): SettingsPicklistItem[] {
  switch (kind) {
    case 'visit-priorities':
      return Object.entries(MEIZITO_VISIT_PRIORITY_TAG_LABELS).map(([id, label], order) => ({
        id,
        label,
        active: true,
        order,
      }));
    case 'customer-type':
      return itemsFromPairs([
        ['loyal', 'وفادار'],
        ['new', 'جدید'],
        ['return', 'بازدید مجدد'],
      ]);
    case 'acquaintance-source':
      return itemsFromPairs([
        ['loyal-customer', 'وفادار (مشتری قبلی)'],
        ['referral', 'معرفی دوستان'],
        ['instagram', 'اینستاگرام'],
        ['billboard', 'بیلبورد'],
        ['website', 'وب‌سایت'],
        ['sms', 'پیامک'],
        ['in-person', 'حضوری'],
      ]);
    case 'contact-method':
      return itemsFromPairs([
        ['showroom', 'حضور در مجموعه'],
        ['phone', 'تماس تلفنی'],
        ['social', 'شبکه اجتماعی'],
        ['podium', 'پودیوم / ایونت'],
      ]);
    case 'group-membership':
      return itemsFromPairs([
        ['vip', 'مشتریان ویژه'],
        ['regular', 'مشتریان'],
        ['designers', 'دیزاینرها'],
        ['builders', 'سازندگان'],
        ['realtors', 'مشاوران املاک'],
        ['ambassadors', 'سفیران برند'],
      ]);
    case 'product-interest-groups':
      return itemsFromPairs([
        ['neoclassic', 'مبلمان نئوکلاسیک'],
        ['modern', 'مبلمان مدرن'],
        ['dining', 'سرویس غذاخوری'],
        ['bedroom', 'سرویس خواب'],
        ['lighting', 'روشنایی'],
        ['accessory', 'اکسسوری'],
        ['console', 'میز پذیرایی / TV / کنسول'],
        ['interior', 'دکوراسیون داخلی'],
      ]);
    case 'purchase-probability-levels':
      return itemsFromPairs([
        ['p100', '۱۰۰٪ — حتماً خرید می‌کنند'],
        ['p75', '۷۵٪ — احتمال زیاد'],
        ['p50', '۵۰٪ — احتمالاً'],
        ['p25', '۲۵٪ — امیدوارم'],
        ['p0', '۰٪ — در آینده'],
        ['browse', 'فقط گشتن'],
      ]);
    case 'estimated-sale-ranges':
      return itemsFromPairs([
        ['lt100', 'کمتر از ۱۰۰ میلیون'],
        ['100-200', '۱۰۰ تا ۲۰۰ میلیون'],
        ['200-500', '۲۰۰ تا ۵۰۰ میلیون'],
        ['500-700', '۵۰۰ تا ۷۰۰ میلیون'],
        ['700-1000', '۷۰۰ میلیون تا ۱ میلیارد'],
        ['1000-1500', '۱ تا ۱٫۵ میلیارد'],
        ['1500-2000', '۱٫۵ تا ۲ میلیارد'],
        ['gt2000', 'بالای ۲ میلیارد'],
      ]);
    default:
      return [];
  }
}

function defaultPicklists(): SettingsPicklist[] {
  return SETTINGS_PICKLIST_KINDS.map((kind) => ({
    kind,
    items: seedForKind(kind),
  }));
}

function normalizePicklists(raw: SettingsPicklist[] | undefined): SettingsPicklist[] {
  const defaults = defaultPicklists();
  if (!raw?.length) return defaults;
  return defaults.map((def) => {
    const found = raw.find((p) => p.kind === def.kind);
    if (found?.items?.length) {
      return {
        kind: def.kind,
        items: [...found.items].sort((a, b) => a.order - b.order),
      };
    }
    return def;
  });
}

export interface SettingsContextValue {
  projects: SettingsProject[];
  upsertProject: (p: Omit<SettingsProject, 'id'> & { id?: string }) => void;
  removeProject: (id: string) => void;
  setDefaultProject: (id: string) => void;

  business: BusinessProfile;
  setBusiness: (p: Partial<BusinessProfile>) => void;

  fiscalYear: FiscalYearSettings;
  setFiscalYear: (p: Partial<FiscalYearSettings>) => void;

  exchangeRates: ExchangeRateRow[];
  upsertExchangeRate: (row: Omit<ExchangeRateRow, 'id'> & { id?: string }) => void;
  removeExchangeRate: (id: string) => void;

  formTemplates: FormTemplate[];
  saveFormTemplate: (name: string, formKind: FormBuilderKind, elements: FormBuilderElement[]) => void;
  removeFormTemplate: (id: string) => void;

  notificationRules: NotificationRule[];
  setNotificationRule: (id: string, patch: Partial<NotificationRule>) => void;

  picklists: SettingsPicklist[];
  getPicklist: (kind: SettingsPicklistKind, businessId?: string | null) => SettingsPicklistItem[];
  upsertPicklistItem: (
    kind: SettingsPicklistKind,
    item: Partial<SettingsPicklistItem> & { label?: string }
  ) => void;
  removePicklistItem: (kind: SettingsPicklistKind, id: string) => void;
  getVisitPriorityOptions: () => { id: string; label: string }[];
  getPicklistOptions: (kind: SettingsPicklistKind) => { id: string; label: string }[];
  getCustomerTypeOptions: () => { id: string; label: string }[];
  getAcquaintanceOptions: () => { id: string; label: string }[];
  getContactMethodOptions: () => { id: string; label: string }[];
  getGroupMembershipOptions: () => { id: string; label: string }[];
  getProductInterestOptions: () => { id: string; label: string }[];
  getPurchaseProbabilityLevelOptions: () => { id: string; label: string }[];
  getEstimatedSaleRangeOptions: () => { id: string; label: string }[];
  getPicklistLabel: (kind: SettingsPicklistKind, id: string | undefined) => string;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const stored = useMemo(() => readStored(), []);

  const [projects, setProjects] = useState<SettingsProject[]>(() => stored.projects ?? seedProjects);
  const [business, setBusinessState] = useState<BusinessProfile>(() => ({
    ...defaultBusiness(),
    ...stored.business,
  }));
  const [fiscalYear, setFiscalYearState] = useState<FiscalYearSettings>(() => ({
    ...defaultFiscal(),
    ...stored.fiscalYear,
  }));
  const [exchangeRates, setExchangeRates] = useState<ExchangeRateRow[]>(
    () => stored.exchangeRates ?? seedRates
  );
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>(() => stored.formTemplates ?? []);
  const [notificationRules, setNotificationRules] = useState<NotificationRule[]>(
    () => stored.notificationRules ?? seedNotifications
  );
  const [picklists, setPicklists] = useState<SettingsPicklist[]>(() =>
    normalizePicklists(stored.picklists)
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload: StoredSettings = {
      projects,
      business,
      fiscalYear,
      exchangeRates,
      formTemplates,
      notificationRules,
      picklists,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    projects,
    business,
    fiscalYear,
    exchangeRates,
    formTemplates,
    notificationRules,
    picklists,
  ]);

  const upsertProject = useCallback((p: Omit<SettingsProject, 'id'> & { id?: string }) => {
    setProjects((prev) => {
      const id = p.id ?? newId();
      const row: SettingsProject = {
        id,
        name: p.name,
        isDefault: p.isDefault,
        active: p.active,
        businessId: p.businessId,
      };
      const others = prev.filter((x) => x.id !== id);
      const cleared = row.isDefault ? others.map((x) => ({ ...x, isDefault: false })) : others;
      return [row, ...cleared];
    });
  }, []);

  const removeProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const setDefaultProject = useCallback((id: string) => {
    setProjects((prev) =>
      prev.map((x) => ({
        ...x,
        isDefault: x.id === id,
      }))
    );
  }, []);

  const setBusiness = useCallback((patch: Partial<BusinessProfile>) => {
    setBusinessState((s) => ({ ...s, ...patch }));
  }, []);

  const setFiscalYear = useCallback((patch: Partial<FiscalYearSettings>) => {
    setFiscalYearState((s) => ({ ...s, ...patch }));
  }, []);

  const upsertExchangeRate = useCallback(
    (row: Omit<ExchangeRateRow, 'id'> & { id?: string }) => {
      setExchangeRates((prev) => {
        const id = row.id ?? newId();
        const nextRow: ExchangeRateRow = {
          id,
          fromCurrency: row.fromCurrency,
          toCurrency: row.toCurrency,
          rate: row.rate,
          effectiveDate: row.effectiveDate,
        };
        const i = prev.findIndex((x) => x.id === id);
        if (i === -1) return [nextRow, ...prev];
        const cp = [...prev];
        cp[i] = nextRow;
        return cp;
      });
    },
    []
  );

  const removeExchangeRate = useCallback((id: string) => {
    setExchangeRates((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const saveFormTemplate = useCallback(
    (name: string, formKind: FormBuilderKind, elements: FormBuilderElement[]) => {
      const id = newId();
      const t: FormTemplate = {
        id,
        name: name.trim() || 'بدون عنوان',
        formKind,
        elements: elements.map((e) => ({ ...e })),
        updatedAt: new Date().toISOString(),
      };
      setFormTemplates((prev) => [t, ...prev]);
    },
    []
  );

  const removeFormTemplate = useCallback((id: string) => {
    setFormTemplates((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const setNotificationRule = useCallback((id: string, patch: Partial<NotificationRule>) => {
    setNotificationRules((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }, []);

  const getPicklist = useCallback(
    (kind: SettingsPicklistKind, businessId?: string | null) => {
      const list = picklists.find((p) => p.kind === kind);
      let items = [...(list?.items ?? [])];
      if (businessId) {
        const scoped = items.filter((i) => !i.businessId || i.businessId === businessId);
        if (scoped.length) items = scoped;
      }
      return items.sort((a, b) => a.order - b.order);
    },
    [picklists]
  );

  const upsertPicklistItem = useCallback(
    (kind: SettingsPicklistKind, item: Partial<SettingsPicklistItem> & { label?: string }) => {
      setPicklists((prev) => {
        const list = prev.find((p) => p.kind === kind) ?? { kind, items: [] };
        const items = [...list.items];
        const id = item.id ?? newId();
        const i = items.findIndex((x) => x.id === id);
        const maxOrder = items.reduce((m, x) => Math.max(m, x.order), -1);
        const row: SettingsPicklistItem = {
          id,
          label: item.label ?? items[i]?.label ?? 'گزینه جدید',
          active: item.active ?? items[i]?.active ?? true,
          order: item.order ?? items[i]?.order ?? maxOrder + 1,
        };
        if (i === -1) items.push(row);
        else items[i] = { ...items[i], ...row };
        items.sort((a, b) => a.order - b.order);
        const others = prev.filter((p) => p.kind !== kind);
        return [...others, { kind, items }];
      });
    },
    []
  );

  const removePicklistItem = useCallback((kind: SettingsPicklistKind, id: string) => {
    setPicklists((prev) =>
      prev.map((p) =>
        p.kind === kind ? { ...p, items: p.items.filter((x) => x.id !== id) } : p
      )
    );
  }, []);

  const getPicklistOptions = useCallback(
    (kind: SettingsPicklistKind) =>
      getPicklist(kind)
        .filter((x) => x.active)
        .map((x) => ({ id: x.id, label: x.label })),
    [getPicklist]
  );

  const getVisitPriorityOptions = useCallback(
    () => getPicklistOptions('visit-priorities'),
    [getPicklistOptions]
  );

  const getCustomerTypeOptions = useCallback(
    () => getPicklistOptions('customer-type'),
    [getPicklistOptions]
  );

  const getAcquaintanceOptions = useCallback(
    () => getPicklistOptions('acquaintance-source'),
    [getPicklistOptions]
  );

  const getContactMethodOptions = useCallback(
    () => getPicklistOptions('contact-method'),
    [getPicklistOptions]
  );

  const getGroupMembershipOptions = useCallback(
    () => getPicklistOptions('group-membership'),
    [getPicklistOptions]
  );

  const getProductInterestOptions = useCallback(
    () => getPicklistOptions('product-interest-groups'),
    [getPicklistOptions]
  );

  const getPurchaseProbabilityLevelOptions = useCallback(
    () => getPicklistOptions('purchase-probability-levels'),
    [getPicklistOptions]
  );

  const getEstimatedSaleRangeOptions = useCallback(
    () => getPicklistOptions('estimated-sale-ranges'),
    [getPicklistOptions]
  );

  const getPicklistLabel = useCallback(
    (kind: SettingsPicklistKind, id: string | undefined) => {
      if (!id) return '—';
      return getPicklist(kind).find((x) => x.id === id)?.label ?? id;
    },
    [getPicklist]
  );

  const value = useMemo<SettingsContextValue>(
    () => ({
      projects,
      upsertProject,
      removeProject,
      setDefaultProject,
      business,
      setBusiness,
      fiscalYear,
      setFiscalYear,
      exchangeRates,
      upsertExchangeRate,
      removeExchangeRate,
      formTemplates,
      saveFormTemplate,
      removeFormTemplate,
      notificationRules,
      setNotificationRule,
      picklists,
      getPicklist,
      upsertPicklistItem,
      removePicklistItem,
      getVisitPriorityOptions,
      getPicklistOptions,
      getCustomerTypeOptions,
      getAcquaintanceOptions,
      getContactMethodOptions,
      getGroupMembershipOptions,
      getProductInterestOptions,
      getPurchaseProbabilityLevelOptions,
      getEstimatedSaleRangeOptions,
      getPicklistLabel,
    }),
    [
      projects,
      upsertProject,
      removeProject,
      setDefaultProject,
      business,
      setBusiness,
      fiscalYear,
      setFiscalYear,
      exchangeRates,
      upsertExchangeRate,
      removeExchangeRate,
      formTemplates,
      saveFormTemplate,
      removeFormTemplate,
      notificationRules,
      setNotificationRule,
      picklists,
      getPicklist,
      upsertPicklistItem,
      removePicklistItem,
      getVisitPriorityOptions,
      getPicklistOptions,
      getCustomerTypeOptions,
      getAcquaintanceOptions,
      getContactMethodOptions,
      getGroupMembershipOptions,
      getProductInterestOptions,
      getPurchaseProbabilityLevelOptions,
      getEstimatedSaleRangeOptions,
      getPicklistLabel,
    ]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
