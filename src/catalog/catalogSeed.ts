import type {
  MoneyDocument,
  Person,
  PersonCategory,
  PersonGroup,
  PriceList,
  ShareholderRecord,
  VendorRecord,
} from '@/src/types/person';
import type { Product, ProductCategory } from '@/src/types/product';

const le = (id: string, title: string, at: string, detail?: string) => ({
  id,
  title,
  at,
  detail,
});

export const seedPriceLists: PriceList[] = [
  { id: 'pl-retail', name: 'لیست خرده‌فروشی', tier: 'retail' },
  { id: 'pl-wholesale', name: 'لیست عمده', tier: 'wholesale' },
  { id: 'pl-partner', name: 'لیست همکار / طراح', tier: 'partner' },
];

export const seedPersonCategories: PersonCategory[] = [
  { id: 'pc-tech', name: 'پرسنل فنی' },
  { id: 'pc-retail', name: 'مشتری تک‌فروشی' },
  { id: 'pc-marketing', name: 'بازاریاب' },
  { id: 'pc-marketing-sales', name: 'فروش میدانی', parentId: 'pc-marketing' },
];

export const seedPersonGroups: PersonGroup[] = [
  {
    id: 'pg-vip',
    name: 'مشتریان ویژه',
    levels: [
      { id: 'lvl-vip', label: 'مشتری VIP' },
      { id: 'lvl-designer', label: 'طراح دکوراسیون' },
      { id: 'lvl-realtor', label: 'مشاور املاک' },
    ],
  },
  {
    id: 'pg-partners',
    name: 'همکاران تجاری',
    levels: [
      { id: 'lvl-tier-a', label: 'سطح الف' },
      { id: 'lvl-tier-b', label: 'سطح ب' },
    ],
  },
];

export const seedPeople: Person[] = [
  {
    id: '1',
    accountingCode: '10001',
    kind: 'natural',
    displayName: 'امیرحسین نکسایی',
    alias: 'آقای نکسایی',
    nationalId: '0012345678',
    taxProfile: 'vat-included',
    roles: ['shareholder', 'customer'],
    emails: [{ id: 'e-1', label: 'اصلی', address: 'admin@nexa.ir' }],
    primaryEmailId: 'e-1',
    defaultPriceListId: 'pl-retail',
    parentPersonId: undefined,
    categoryIds: ['pc-tech'],
    groupMemberships: [{ groupId: 'pg-partners', levelId: 'lvl-tier-a' }],
    phones: [
      { id: 'p1', label: 'موبایل', number: '۰۹۱۲۳۴۵۶۷۸۹' },
      { id: 'p2', label: 'دفتر مرکزی', number: '۰۲۱۸۸۸۸۸۸۸۸' },
    ],
    addresses: [
      {
        id: 'a1',
        label: 'دفتر',
        text: 'تهران، میدان ونک، خیابان ملاصدرا',
        isPrimary: true,
        lat: 35.7742,
        lng: 51.4184,
      },
    ],
    banks: [
      {
        id: 'b1',
        bankName: 'بانک ملت',
        accountTitle: 'امیرحسین نکسایی',
        iban: 'IR۱۲۳۴۵۶۷۸۹۰۱۲۳۴۵۶۷۸۹۰۱۲۳۴۵۶۷۸۹۰',
        cardNumber: '۶۰۳۷۹۹۱۲۳۴۵۶۷۸۹۰',
        accountNumber: '۱۴۵۸۹۶۳۲',
        isPrimary: true,
      },
    ],
    importantDates: [{ id: 'd1', title: 'تولد', date: '۱۳۶۵/۰۳/۱۲' }],
    status: 'active',
    points: 1200,
    ledger: {
      financial: [
        le('l1', 'واریز اولیه سهام', '۱۴۰۴/۱۱/۲۰', '۵۰,۰۰۰,۰۰۰ تومان'),
        le('l2', 'فاکتور فروش INV-4001', '۱۴۰۴/۱۱/۱۸'),
      ],
      marketing: [le('m1', 'عضویت در کمپین پاییز', '۱۴۰۴/۱۰/۰۱')],
      activity: [le('ac1', 'تماس پیگیری سفارش', '۱۴۰۴/۱۱/۲۵')],
      orders: [le('o1', 'سفارش SO-۱۰۲ در حال تولید', '۱۴۰۴/۱۱/۲۹')],
    },
  },
  {
    id: '2',
    accountingCode: '10002',
    kind: 'legal',
    displayName: 'شرکت پارچه علوی',
    legalName: 'علوی نساجی',
    alias: 'تامین پارچه',
    nationalId: '۱۰۱۰۲۳۴۵۶۷',
    taxProfile: 'vat-included',
    roles: ['supplier'],
    emails: [{ id: 'e-2', label: 'اصلی', address: 'alavi@textile.com' }],
    primaryEmailId: 'e-2',
    defaultPriceListId: 'pl-wholesale',
    categoryIds: [],
    groupMemberships: [],
    phones: [{ id: 'p1', label: 'موبایل نماینده', number: '۰۹۱۸۷۶۵۴۳۲۱' }],
    addresses: [
      {
        id: 'a1',
        label: 'کارخانه',
        text: 'اصفهان، شهرک صنعتی رازی',
        isPrimary: true,
        lat: 32.6546,
        lng: 51.668,
      },
    ],
    banks: [],
    importantDates: [],
    status: 'active',
    points: 850,
    ledger: {
      financial: [le('l1', 'پرداخت فاکتور خرید', '۱۴۰۴/۱۱/۱۰')],
      marketing: [],
      activity: [le('ac1', 'تحویل بار پارچه ترک', '۱۴۰۴/۱۱/۲۸')],
      orders: [],
    },
  },
  {
    id: '3',
    accountingCode: '10003',
    kind: 'natural',
    displayName: 'سارا احمدی',
    alias: 'خانم احمدی',
    nationalId: '۰۰۷۶۵۴۳۲۱۰',
    taxProfile: 'final-consumer',
    roles: ['customer'],
    emails: [{ id: 'e-3', label: 'اصلی', address: 'sara@gmail.com' }],
    primaryEmailId: 'e-3',
    defaultPriceListId: 'pl-partner',
    categoryIds: ['pc-retail'],
    groupMemberships: [{ groupId: 'pg-vip', levelId: 'lvl-designer' }],
    phones: [{ id: 'p1', label: 'موبایل', number: '۰۹۳۵۱۱۱۲۲۳۳' }],
    addresses: [
      {
        id: 'a1',
        text: 'کرج، گلشهر، فاز ۳',
        isPrimary: true,
      },
    ],
    banks: [
      {
        id: 'b1',
        bankName: 'بانک صادرات',
        accountTitle: 'سارا احمدی',
        iban: 'IR۹۸۷۶۵۴۳۲۱۰۹۸۷۶۵۴۳۲۱۰۹۸۷۶۵۴۳۲',
        cardNumber: '۶۰۳۷۶۹۹۹۹۹۸۸۸۷۷۷',
        accountNumber: '۳۵۷۹۱۱',
        isPrimary: true,
      },
    ],
    importantDates: [{ id: 'd1', title: 'سالگرد ازدواج', date: '۱۳۹۶/۰۶/۱۵' }],
    status: 'active',
    points: 2400,
    ledger: {
      financial: [le('l1', 'تسویه اقساط INS-101', '۱۴۰۴/۱۱/۱۵')],
      marketing: [le('m1', 'ارسال پیامک تخفیف VIP', '۱۴۰۴/۱۱/۰۱')],
      activity: [le('ac1', 'بازدید از شوروم', '۱۴۰۴/۱۰/۲۰')],
      orders: [le('o1', 'سفارش مبل آوا — تحویل فردا', '۱۴۰۴/۱۱/۳۰')],
    },
  },
  {
    id: '4',
    accountingCode: '10004',
    kind: 'natural',
    displayName: 'مهندس کریمی',
    alias: 'کریمی دیزاین',
    nationalId: '۰۰۹۹۸۷۶۵۴۳',
    taxProfile: 'vat-exempt',
    roles: ['subordinate', 'customer'],
    emails: [{ id: 'e-4', label: 'اصلی', address: 'karimi@design.ir' }],
    primaryEmailId: 'e-4',
    defaultPriceListId: 'pl-partner',
    parentPersonId: '1',
    categoryIds: ['pc-marketing'],
    groupMemberships: [{ groupId: 'pg-vip', levelId: 'lvl-designer' }],
    phones: [{ id: 'p1', label: 'موبایل', number: '۰۹۱۲۹۹۹۸۸۷۷' }],
    addresses: [],
    banks: [],
    importantDates: [],
    status: 'inactive',
    points: 450,
    ledger: {
      financial: [],
      marketing: [],
      activity: [le('ac1', 'ارجاع طرح به واحد تولید', '۱۴۰۴/۰۹/۱۰')],
      orders: [],
    },
  },
  {
    id: '5',
    accountingCode: '10005',
    kind: 'natural',
    displayName: 'جواد مرادی',
    alias: 'آقای مرادی',
    nationalId: '۰۰۱۱۲۲۳۳۴۴۵',
    taxProfile: 'none',
    roles: ['shareholder'],
    emails: [{ id: 'e-5', label: 'اصلی', address: 'moradi@nexa.ir' }],
    primaryEmailId: 'e-5',
    defaultPriceListId: 'pl-retail',
    categoryIds: [],
    groupMemberships: [],
    phones: [{ id: 'p1', label: 'موبایل', number: '۰۹۱۲۱۱۱۰۰۹۹' }],
    addresses: [],
    banks: [],
    importantDates: [],
    status: 'active',
    points: 5000,
    ledger: {
      financial: [le('l1', 'سود سهام فصل', '۱۴۰۴/۱۱/۰۱')],
      marketing: [],
      activity: [],
      orders: [],
    },
  },
];

export const seedReceipts: MoneyDocument[] = [
  {
    id: 'rc-1',
    number: '1001',
    date: '1405/01/16',
    project: 'پروژه A',
    currency: 'IRR',
    description: 'دریافت بابت فاکتور فروش 1004',
    lines: [{ id: 'rcl-1', personId: '1', amount: 286000000, note: 'واریز کارت' }],
    notes: ['دریافت بابت تسویه اولیه'],
    history: [{ id: 'rh-1', action: 'ایجاد سند دریافت', at: '1405/01/16 09:10', by: 'سیستم' }],
  },
  {
    id: 'rc-2',
    number: '1002',
    date: '1405/01/19',
    project: 'پروژه B',
    currency: 'IRR',
    description: 'دریافت چک',
    lines: [{ id: 'rcl-2', personId: '3', amount: 147900000, note: 'چک 30 روزه' }],
    notes: ['چک 30 روزه ثبت شد'],
    history: [{ id: 'rh-2', action: 'ثبت دریافت چک', at: '1405/01/19 12:40', by: 'سیستم' }],
  },
];

export const seedPayments: MoneyDocument[] = [
  {
    id: 'pm-1',
    number: '1010',
    date: '1405/01/17',
    project: 'پروژه A',
    currency: 'IRR',
    description: 'پرداخت به تامین کننده',
    lines: [{ id: 'pml-1', personId: '2', amount: 270000000, note: 'خرید پارچه' }],
    notes: ['پرداخت اصلی خرید پارچه'],
    history: [{ id: 'ph-1', action: 'ایجاد سند پرداخت', at: '1405/01/17 11:00', by: 'سیستم' }],
  },
  {
    id: 'pm-2',
    number: '1011',
    date: '1405/01/20',
    project: 'پروژه C',
    currency: 'IRR',
    description: 'پرداخت هزینه خدمات',
    lines: [{ id: 'pml-2', personId: '4', amount: 86000000, note: 'هزینه مشاوره' }],
    notes: ['هزینه خدمات پروژه C'],
    history: [{ id: 'ph-2', action: 'ثبت پرداخت هزینه خدمات', at: '1405/01/20 14:22', by: 'سیستم' }],
  },
];

export const seedShareholders: ShareholderRecord[] = [
  { id: 'sh-1', personId: '1', percent: 50 },
  { id: 'sh-2', personId: '5', percent: 50 },
];

export const seedVendors: VendorRecord[] = [
  {
    id: 'vd-1',
    personId: '4',
    sellPercent: 15,
    refundPercent: 15,
    expenseAccount: 'هزینه بازاریابی و پورسانت',
    active: true,
  },
  {
    id: 'vd-2',
    personId: '3',
    sellPercent: 5,
    refundPercent: 5,
    expenseAccount: 'هزینه بازاریابی و پورسانت',
    active: true,
  },
];

export const seedProductCategories: ProductCategory[] = [
  { id: 'pcat-furniture', name: 'مبلمان' },
  { id: 'pcat-dining', name: 'نهارخوری', parentId: 'pcat-furniture' },
  { id: 'pcat-bedroom', name: 'سرویس خواب', parentId: 'pcat-furniture' },
  { id: 'pcat-accessories', name: 'اکسسوری' },
  { id: 'pcat-services', name: 'خدمات' },
  { id: 'pcat-services-tech', name: 'خدمات فنی', parentId: 'pcat-services' },
  { id: 'pcat-services-design', name: 'خدمات طراحی', parentId: 'pcat-services' },
];

function mkProduct(
  id: string,
  accountingCode: string,
  name: string,
  code: string,
  type: 'goods' | 'services',
  categoryIds: string[],
  retail: number,
  purchasePrice: number,
  barcode?: string,
  stock = 0,
): Product {
  return {
    id,
    accountingCode,
    name,
    code,
    type,
    categoryIds,
    barcode,
    images: { gallery: [] },
    prices: {
      'pl-retail': retail,
      'pl-wholesale': Math.round(retail * 0.85),
      'pl-partner': Math.round(retail * 0.72),
    },
    purchasePrice,
    units: { main: type === 'services' ? 'بار' : 'عدد', hasSecondary: false },
    inventory: {
      trackStock: type === 'goods',
      reorderPoint: type === 'goods' ? Math.max(1, Math.floor(stock * 0.3)) : 0,
      minOrder: 1,
      leadTimeDays: type === 'goods' ? 14 : 0,
    },
    tax: {
      hasSalesTax: true,
      salesTaxRate: 10,
      hasPurchaseTax: type === 'goods',
      purchaseTaxRate: 10,
      taxType: '۱۲- سایر کالاها',
    },
    status: 'active',
  };
}

export const seedProducts: Product[] = [
  mkProduct('1', '20001', 'مبلمان نئوکلاسیک مدل آوا', 'FUR-101', 'goods', ['pcat-furniture'], 45_000_000, 32_000_000, '6279500000001', 12),
  mkProduct('2', '20002', 'سرویس نهارخوری ۸ نفره', 'DIN-202', 'goods', ['pcat-dining'], 32_000_000, 22_000_000, '6279500000002', 5),
  mkProduct('3', '20003', 'کنسول مدرن طرح ترک', 'ACC-303', 'goods', ['pcat-accessories'], 18_500_000, 12_000_000, undefined, 8),
  mkProduct('4', '20004', 'تخت خواب دونفره کویین', 'BED-404', 'goods', ['pcat-bedroom'], 28_000_000, 19_000_000, '6279500000004', 3),
  mkProduct('5', '20005', 'خدمات نصب و راه‌اندازی', 'SRV-001', 'services', ['pcat-services-tech'], 1_500_000, 0),
  mkProduct('6', '20006', 'مشاوره دیزاین داخلی', 'SRV-002', 'services', ['pcat-services-design'], 5_000_000, 0),
];
