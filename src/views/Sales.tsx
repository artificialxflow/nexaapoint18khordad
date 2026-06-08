import React, { useMemo, useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Barcode,
  Eye,
  FileDown,
  FileText,
  Image as ImageIcon,
  Percent,
  Plus,
  Printer,
  Search,
  Tag,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useCatalog } from '@/src/context/CatalogContext';
import { formatToman, getProductPriceForInvoice } from '@/src/lib/pricing';

type SalesTab =
  | 'new-sale'
  | 'return-sale'
  | 'sale-invoices'
  | 'income'
  | 'income-list'
  | 'income-types'
  | 'installment-contract'
  | 'installment-list'
  | 'discounted-items';

type InvoiceLine = {
  id: string;
  productId: string;
  qty: number;
  unitPrice: number;
  discountType: 'percent' | 'amount';
  discountValue: number;
  serial?: string;
};

type LedgerAdjustment = { id: string; title: string; amount: number };
type SaleInvoice = {
  id: string;
  customerId: string;
  date: string;
  status: 'draft' | 'confirmed';
  total: number;
  kind: 'sale' | 'return';
};

function csvDownload(filename: string, rows: string[][]) {
  const csv = '\uFEFF' + rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function newLine(): InvoiceLine {
  return {
    id: `${Date.now()}-${Math.random()}`,
    productId: '',
    qty: 1,
    unitPrice: 0,
    discountType: 'percent',
    discountValue: 0,
    serial: '',
  };
}

const salesTabs: Array<{ id: SalesTab; label: string }> = [
  { id: 'new-sale', label: 'فروش جدید' },
  { id: 'return-sale', label: 'برگشت از فروش' },
  { id: 'sale-invoices', label: 'لیست فاکتورهای فروش' },
  { id: 'income', label: 'درآمد' },
  { id: 'income-list', label: 'لیست درآمدها' },
  { id: 'income-types', label: 'انواع درآمد' },
  { id: 'installment-contract', label: 'قرارداد فروش اقساطی' },
  { id: 'installment-list', label: 'لیست اقساط' },
  { id: 'discounted-items', label: 'اقلام تخفیف‌دار' },
];

export default function Sales() {
  const { people, products, priceLists } = useCatalog();
  const customers = useMemo(() => people.filter((p) => p.roles.includes('customer')), [people]);
  const carriers = useMemo(() => people.filter((p) => p.roles.includes('supplier')), [people]);
  const sellers = useMemo(() => {
    const subs = people.filter((p) => p.roles.includes('subordinate'));
    return subs.length > 0 ? subs : people;
  }, [people]);
  const [activeTab, setActiveTab] = useState<SalesTab>('new-sale');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [incomeSearch, setIncomeSearch] = useState('');
  const [invoiceDateFrom, setInvoiceDateFrom] = useState('');
  const [invoiceDateTo, setInvoiceDateTo] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<'all' | 'draft' | 'confirmed'>('all');
  const [invoiceKindFilter, setInvoiceKindFilter] = useState<'all' | 'sale' | 'return'>('all');
  const [invoiceCustomerFilter, setInvoiceCustomerFilter] = useState('');
  const [personInvoiceFocus, setPersonInvoiceFocus] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [sellerPersonId, setSellerPersonId] = useState('');
  const [project, setProject] = useState('');
  const [globalDiscountType, setGlobalDiscountType] = useState<'percent' | 'amount'>('percent');
  const [globalDiscountValue, setGlobalDiscountValue] = useState(0);
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [description, setDescription] = useState('');
  const [transportCost, setTransportCost] = useState(0);
  const [carrierId, setCarrierId] = useState('');
  const [plusItems, setPlusItems] = useState<LedgerAdjustment[]>([]);
  const [minusItems, setMinusItems] = useState<LedgerAdjustment[]>([]);
  const [lines, setLines] = useState<InvoiceLine[]>([newLine()]);
  const [priceListId, setPriceListId] = useState('');
  const [productPickerLineId, setProductPickerLineId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [stockModalLine, setStockModalLine] = useState<string | null>(null);
  const [priceModalLine, setPriceModalLine] = useState<string | null>(null);
  const [invoiceHistory, setInvoiceHistory] = useState<string[]>([]);
  const [printTemplate, setPrintTemplate] = useState('قالب پیشفرض');
  const [invoices, setInvoices] = useState<SaleInvoice[]>([
    { id: 'SAL-1001', customerId: customers[0]?.id || '', date: '2026-04-26', status: 'confirmed', total: 23500000, kind: 'sale' },
    { id: 'SAL-1002', customerId: customers[1]?.id || '', date: '2026-04-27', status: 'draft', total: 9200000, kind: 'sale' },
  ]);
  const [incomeTypes, setIncomeTypes] = useState<string[]>(['فروش نقدی', 'سود سپرده', 'درآمد خدمات']);
  const [newIncomeType, setNewIncomeType] = useState('');
  const [incomeDraft, setIncomeDraft] = useState({ title: '', type: 'فروش نقدی', amount: 0, date: '2026-04-28' });
  const [incomeRows, setIncomeRows] = useState<Array<{ id: string; title: string; type: string; amount: number; date: string }>>([]);
  const [installmentDraft, setInstallmentDraft] = useState({ customerId: '', total: 0, downPayment: 0, months: 6 });
  const [installments, setInstallments] = useState<Array<{ id: string; customerId: string; total: number; paid: number; nextDate: string }>>([]);
  const [discountRows, setDiscountRows] = useState<Array<{ id: string; productId: string; mode: 'percent' | 'amount'; value: number; from: string; to: string }>>([]);

  const lineCalculated = useMemo(() => {
    const person = customers.find((c) => c.id === customerId);
    const listOverride = priceListId.trim() || undefined;
    return lines.map((line) => {
      const product = products.find((p) => p.id === line.productId);
      const smart = product
        ? getProductPriceForInvoice(product, person, priceLists, listOverride)
        : null;
      const base = line.unitPrice || smart?.amount || 0;
      const gross = base * line.qty;
      const discount =
        line.discountType === 'percent'
          ? Math.round((gross * line.discountValue) / 100)
          : line.discountValue;
      return {
        ...line,
        name: product?.name || '-',
        base,
        gross,
        discount,
        net: Math.max(0, gross - discount),
      };
    });
  }, [lines, customerId, priceListId, products, customers, priceLists]);

  const filteredPickerProducts = useMemo(() => {
    const q = productSearch.trim();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.includes(q) ||
        p.code.includes(q) ||
        (p.barcode ?? '').includes(q)
    );
  }, [products, productSearch]);

  const subtotal = lineCalculated.reduce((a, x) => a + x.net, 0);
  const globalDiscount =
    globalDiscountType === 'percent'
      ? Math.round((subtotal * globalDiscountValue) / 100)
      : globalDiscountValue;
  const taxAmount = taxEnabled ? Math.round((Math.max(0, subtotal - globalDiscount) * 10) / 100) : 0;
  const plusTotal = plusItems.reduce((a, x) => a + x.amount, 0);
  const minusTotal = minusItems.reduce((a, x) => a + x.amount, 0);
  const grandTotal = Math.max(0, subtotal - globalDiscount + taxAmount + plusTotal - minusTotal + transportCost);

  const filteredInvoices = invoices.filter((inv) => {
    const customer = customers.find((c) => c.id === inv.customerId)?.displayName || 'بدون شخص';
    const kindLabel = inv.kind === 'return' ? 'برگشت' : 'فروش';
    const q = invoiceSearch.trim();
    const textOk =
      !q ||
      inv.id.includes(q) ||
      customer.includes(q) ||
      inv.date.includes(q) ||
      kindLabel.includes(q);
    const statusOk = invoiceStatusFilter === 'all' ? true : inv.status === invoiceStatusFilter;
    const customerOk = !invoiceCustomerFilter || inv.customerId === invoiceCustomerFilter;
    const fromOk = !invoiceDateFrom || inv.date >= invoiceDateFrom;
    const toOk = !invoiceDateTo || inv.date <= invoiceDateTo;
    const kindOk = invoiceKindFilter === 'all' ? true : inv.kind === invoiceKindFilter;
    return textOk && statusOk && customerOk && fromOk && toOk && kindOk;
  });
  const focusedPersonInvoices = filteredInvoices.filter(
    (x) => !personInvoiceFocus || x.customerId === personInvoiceFocus
  );
  const filteredIncome = incomeRows.filter((x) => {
    const q = incomeSearch.trim();
    return !q || x.title.includes(q) || x.type.includes(q) || x.date.includes(q);
  });

  const updateLine = (id: string, patch: Partial<InvoiceLine>) =>
    setLines((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const resetLineUnitPrices = () =>
    setLines((prev) => prev.map((x) => ({ ...x, unitPrice: 0 })));

  const addAdjustment = (kind: 'plus' | 'minus') => {
    const row = { id: `${Date.now()}`, title: '', amount: 0 };
    if (kind === 'plus') setPlusItems((p) => [...p, row]);
    else setMinusItems((p) => [...p, row]);
  };

  const saveInvoice = (asReturn = false) => {
    const id = `${asReturn ? 'RET' : 'SAL'}-${1000 + invoices.length + 1}`;
    const kind: SaleInvoice['kind'] = asReturn ? 'return' : 'sale';
    setInvoices((prev) => [
      {
        id,
        customerId,
        date: new Date().toISOString().slice(0, 10),
        status: 'confirmed',
        total: grandTotal,
        kind,
      },
      ...prev,
    ]);
    setInvoiceHistory((h) => [
      `سند ${id} توسط کاربر فعلی در ${new Date().toLocaleString('fa-IR')} ثبت شد`,
      ...h,
    ]);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">فروش و درآمد</h1>
          <p className="text-xs text-gray-500">نسخه بازطراحی‌شده بر پایه تب‌های داخلی</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="nexa-input text-xs w-36" value={printTemplate} onChange={(e) => setPrintTemplate(e.target.value)}>
            <option>قالب پیشفرض</option>
            <option>برگه جمع آوری</option>
            <option>فاکتور فروش رسمی</option>
          </select>
          <button className="nexa-btn-ghost text-xs"><Printer size={14} /> چاپ</button>
          <button className="nexa-btn-ghost text-xs"><FileText size={14} /> PDF</button>
          <button
            className="nexa-btn-ghost text-xs"
            onClick={() =>
              csvDownload('sales-invoices.csv', [
                ['شناسه', 'نوع', 'تاریخ', 'مبلغ'],
                ...invoices.map((x) => [x.id, x.kind === 'return' ? 'برگشت' : 'فروش', x.date, String(x.total)]),
              ])
            }
          >
            <FileDown size={14} /> خروجی اکسل
          </button>
          <button className="nexa-btn-ghost text-xs"><Upload size={14} /> ورود اکسل</button>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl overflow-x-auto">
        {salesTabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 text-xs rounded-xl font-bold whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-nexa-accent' : 'text-gray-500'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {(activeTab === 'new-sale' || activeTab === 'return-sale') && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          <div className="xl:col-span-3 nexa-card p-4 space-y-4">
            <div className="grid md:grid-cols-4 gap-2">
              <div className="flex gap-1 items-stretch">
                <select
                  value={customerId}
                  onChange={(e) => {
                    setCustomerId(e.target.value);
                    resetLineUnitPrices();
                  }}
                  className="nexa-input flex-1 min-w-0"
                >
                  <option value="">انتخاب مشتری</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.displayName}
                    </option>
                  ))}
                </select>
                <a
                  href="/dashboard/people"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nexa-btn-ghost px-2 shrink-0 flex items-center"
                  title="مشتری جدید"
                >
                  <Plus size={16} />
                </a>
              </div>
              <select
                value={priceListId}
                onChange={(e) => {
                  setPriceListId(e.target.value);
                  resetLineUnitPrices();
                }}
                className="nexa-input"
              >
                <option value="">لیست قیمت (پیش‌فرض مشتری)</option>
                {priceLists.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
              <select
                value={sellerPersonId}
                onChange={(e) => setSellerPersonId(e.target.value)}
                className="nexa-input"
              >
                <option value="">فروشنده</option>
                {sellers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.displayName}
                  </option>
                ))}
              </select>
              <input value={project} onChange={(e) => setProject(e.target.value)} className="nexa-input" placeholder="پروژه" />
            </div>

            <div className="space-y-2">
              {lineCalculated.map((line) => {
                const rowProduct = products.find((p) => p.id === line.productId);
                return (
                <div key={line.id} className="grid md:grid-cols-12 gap-2 bg-gray-50 rounded-xl p-2 items-center">
                  <div className="md:col-span-3 flex items-center gap-1 min-w-0">
                    {rowProduct?.images?.main ? (
                      <img
                        src={rowProduct.images.main}
                        alt=""
                        className="w-9 h-9 rounded-lg object-cover border border-nexa-border shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-gray-200 border border-nexa-border shrink-0" />
                    )}
                    <button
                      type="button"
                      className="p-1.5 rounded-lg border border-nexa-border bg-white text-gray-600 shrink-0 hover:bg-gray-50"
                      title="انتخاب با تصویر"
                      onClick={() => {
                        setProductPickerLineId(line.id);
                        setProductSearch('');
                      }}
                    >
                      <ImageIcon size={16} />
                    </button>
                    <select
                      value={line.productId}
                      onChange={(e) =>
                        updateLine(line.id, { productId: e.target.value, unitPrice: 0 })
                      }
                      className="nexa-input flex-1 min-w-0"
                    >
                      <option value="">انتخاب کالا/خدمت</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input type="number" value={line.qty} onChange={(e) => updateLine(line.id, { qty: Number(e.target.value) || 1 })} className="nexa-input md:col-span-1" placeholder="تعداد" />
                  <input type="number" value={line.base} onChange={(e) => updateLine(line.id, { unitPrice: Number(e.target.value) || 0 })} className="nexa-input md:col-span-2" placeholder="فی واحد" />
                  <div className="md:col-span-2 flex gap-1">
                    <select value={line.discountType} onChange={(e) => updateLine(line.id, { discountType: e.target.value as 'percent' | 'amount' })} className="nexa-input">
                      <option value="percent">٪</option><option value="amount">ریالی</option>
                    </select>
                    <input type="number" value={line.discountValue} onChange={(e) => updateLine(line.id, { discountValue: Number(e.target.value) || 0 })} className="nexa-input" placeholder="تخفیف" />
                  </div>
                  <input value={line.serial || ''} onChange={(e) => updateLine(line.id, { serial: e.target.value })} className="nexa-input md:col-span-2" placeholder="شماره سریال" />
                  <div className="md:col-span-2 flex items-center justify-between px-2">
                    <span className="text-xs font-black">{formatToman(line.net)}</span>
                    <div className="flex items-center gap-1">
                      <button className="text-gray-500" onClick={() => setStockModalLine(line.id)} title="موجودی"><Eye size={14} /></button>
                      <button className="text-gray-500" onClick={() => setPriceModalLine(line.id)} title="قیمت"><Tag size={14} /></button>
                      <button className="text-rose-500" onClick={() => setLines((p) => p.filter((x) => x.id !== line.id))}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <button className="nexa-btn-ghost text-xs" onClick={() => setLines((p) => [...p, newLine()])}><Plus size={14} /> افزودن ردیف</button>
              <button className="nexa-btn-ghost text-xs" onClick={() => setLines((p) => [...p, ...Array.from({ length: 5 }).map(() => newLine())])}>افزودن 5 ردیف</button>
              <button className="nexa-btn-ghost text-xs"><Barcode size={14} /> بارکدخوان</button>
              <a
                href="/dashboard/products"
                target="_blank"
                rel="noopener noreferrer"
                className="nexa-btn-ghost text-xs inline-flex items-center gap-1"
              >
                <Plus size={14} /> کالا / خدمت جدید
              </a>
            </div>
          </div>

          <div className="nexa-card p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <select className="nexa-input" value={globalDiscountType} onChange={(e) => setGlobalDiscountType(e.target.value as 'percent' | 'amount')}>
                <option value="percent">تخفیف درصدی</option>
                <option value="amount">تخفیف ریالی</option>
              </select>
              <input className="nexa-input" type="number" value={globalDiscountValue} onChange={(e) => setGlobalDiscountValue(Number(e.target.value) || 0)} />
            </div>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={taxEnabled} onChange={(e) => setTaxEnabled(e.target.checked)} /> مالیات فعال</label>
            <input className="nexa-input" type="number" value={transportCost} onChange={(e) => setTransportCost(Number(e.target.value) || 0)} placeholder="هزینه حمل" />
            <select className="nexa-input" value={carrierId} onChange={(e) => setCarrierId(e.target.value)}>
              <option value="">حمل‌کننده</option>
              {carriers.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
            </select>
            <textarea className="nexa-input min-h-20" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="توضیحات فاکتور" />

            <div className="space-y-2 border-t pt-2">
              <div className="flex items-center justify-between text-xs font-bold"><span>اضافات</span><button onClick={() => addAdjustment('plus')} className="text-blue-600">+ آیتم</button></div>
              {plusItems.map((r) => (
                <div key={r.id} className="flex gap-1 items-center">
                  <input className="nexa-input flex-1" value={r.title} onChange={(e) => setPlusItems((p) => p.map((x) => x.id === r.id ? { ...x, title: e.target.value } : x))} placeholder="عنوان" />
                  <input className="nexa-input w-28" type="number" value={r.amount} onChange={(e) => setPlusItems((p) => p.map((x) => x.id === r.id ? { ...x, amount: Number(e.target.value) || 0 } : x))} />
                  <button type="button" className="text-rose-500 p-1" onClick={() => setPlusItems((p) => p.filter((x) => x.id !== r.id))} aria-label="حذف"><Trash2 size={14} /></button>
                </div>
              ))}
              <div className="flex items-center justify-between text-xs font-bold"><span>کسورات</span><button onClick={() => addAdjustment('minus')} className="text-blue-600">+ آیتم</button></div>
              {minusItems.map((r) => (
                <div key={r.id} className="flex gap-1 items-center">
                  <input className="nexa-input flex-1" value={r.title} onChange={(e) => setMinusItems((p) => p.map((x) => x.id === r.id ? { ...x, title: e.target.value } : x))} placeholder="عنوان" />
                  <input className="nexa-input w-28" type="number" value={r.amount} onChange={(e) => setMinusItems((p) => p.map((x) => x.id === r.id ? { ...x, amount: Number(e.target.value) || 0 } : x))} />
                  <button type="button" className="text-rose-500 p-1" onClick={() => setMinusItems((p) => p.filter((x) => x.id !== r.id))} aria-label="حذف"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-xl p-2 text-xs space-y-1">
              <div className="flex justify-between"><span>جمع جزء</span><span>{formatToman(subtotal)}</span></div>
              <div className="flex justify-between"><span>تخفیف کل</span><span>{formatToman(globalDiscount)}</span></div>
              <div className="flex justify-between"><span>مالیات</span><span>{formatToman(taxAmount)}</span></div>
              <div className="flex justify-between"><span>حمل و نقل</span><span>{formatToman(transportCost)}</span></div>
              <div className="flex justify-between font-black text-sm"><span>قابل پرداخت</span><span>{formatToman(grandTotal)}</span></div>
            </div>

            <button className="nexa-btn-primary w-full" onClick={() => saveInvoice(activeTab === 'return-sale')}>
              {activeTab === 'return-sale' ? <><ArrowUpCircle size={14} /> ثبت برگشت از فروش</> : <>ثبت فاکتور فروش</>}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'sale-invoices' && (
        <div className="nexa-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-black">لیست فاکتورهای فروش</h3>
            <div className="relative w-72">
              <Search className="absolute right-3 top-2.5 text-gray-400" size={14} />
              <input
                className="nexa-input pr-9"
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                placeholder="فیلتر شناسه، تاریخ، شخص، نوع"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-6 gap-2">
            <select className="nexa-input" value={invoiceCustomerFilter} onChange={(e) => setInvoiceCustomerFilter(e.target.value)}>
              <option value="">همه اشخاص</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
            </select>
            <select className="nexa-input" value={invoiceStatusFilter} onChange={(e) => setInvoiceStatusFilter(e.target.value as 'all' | 'draft' | 'confirmed')}>
              <option value="all">همه وضعیت‌ها</option>
              <option value="draft">پیش‌نویس</option>
              <option value="confirmed">تایید شده</option>
            </select>
            <select className="nexa-input" value={invoiceKindFilter} onChange={(e) => setInvoiceKindFilter(e.target.value as 'all' | 'sale' | 'return')}>
              <option value="all">همه انواع سند</option>
              <option value="sale">فروش</option>
              <option value="return">برگشت از فروش</option>
            </select>
            <input className="nexa-input" type="date" value={invoiceDateFrom} onChange={(e) => setInvoiceDateFrom(e.target.value)} />
            <input className="nexa-input" type="date" value={invoiceDateTo} onChange={(e) => setInvoiceDateTo(e.target.value)} />
            <button
              className="nexa-btn-ghost text-xs"
              onClick={() => {
                setInvoiceCustomerFilter('');
                setInvoiceStatusFilter('all');
                setInvoiceKindFilter('all');
                setInvoiceDateFrom('');
                setInvoiceDateTo('');
                setInvoiceSearch('');
              }}
            >
              پاک کردن فیلترها
            </button>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b">
                <th className="py-2 text-right">شناسه</th>
                <th className="text-right">نوع</th>
                <th className="text-right">شخص</th>
                <th className="text-right">تاریخ</th>
                <th className="text-right">وضعیت</th>
                <th className="text-right">مبلغ</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="border-b">
                  <td className="py-2 text-blue-700">{inv.id}</td>
                  <td>{inv.kind === 'return' ? 'برگشت از فروش' : 'فروش'}</td>
                  <td>{customers.find((c) => c.id === inv.customerId)?.displayName || 'بدون شخص'}</td>
                  <td>{inv.date}</td>
                  <td>{inv.status === 'confirmed' ? 'تایید شده' : 'پیش‌نویس'}</td>
                  <td className="font-fa-num">{formatToman(inv.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t pt-3 space-y-2">
            <h4 className="text-xs font-black">لیست فاکتورهای یک شخص</h4>
            <div className="grid md:grid-cols-2 gap-2">
              <select className="nexa-input" value={personInvoiceFocus} onChange={(e) => setPersonInvoiceFocus(e.target.value)}>
                <option value="">انتخاب شخص</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
              </select>
              <div className="text-xs text-gray-500 flex items-center">
                {personInvoiceFocus ? `تعداد فاکتورها: ${focusedPersonInvoices.length}` : 'برای دیدن فاکتورهای یک شخص، شخص را انتخاب کنید.'}
              </div>
            </div>
            {personInvoiceFocus && (
              <div className="rounded-xl border p-2 max-h-40 overflow-auto">
                {focusedPersonInvoices.map((inv) => (
                  <div key={inv.id} className="flex justify-between text-xs border-b py-1 gap-2">
                    <span className="text-blue-700 shrink-0">{inv.id}</span>
                    <span className="text-gray-500 shrink-0">{inv.kind === 'return' ? 'برگشت' : 'فروش'}</span>
                    <span>{inv.date}</span>
                    <span>{formatToman(inv.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'income' && (
        <div className="nexa-card p-4 grid md:grid-cols-4 gap-2">
          <input className="nexa-input" value={incomeDraft.title} onChange={(e) => setIncomeDraft((d) => ({ ...d, title: e.target.value }))} placeholder="عنوان درآمد" />
          <select className="nexa-input" value={incomeDraft.type} onChange={(e) => setIncomeDraft((d) => ({ ...d, type: e.target.value }))}>{incomeTypes.map((x) => <option key={x}>{x}</option>)}</select>
          <input className="nexa-input" type="number" value={incomeDraft.amount} onChange={(e) => setIncomeDraft((d) => ({ ...d, amount: Number(e.target.value) || 0 }))} placeholder="مبلغ" />
          <button className="nexa-btn-primary" onClick={() => setIncomeRows((p) => [{ id: `${Date.now()}`, ...incomeDraft }, ...p])}><ArrowDownCircle size={14} /> ثبت درآمد</button>
        </div>
      )}

      {activeTab === 'income-list' && (
        <div className="nexa-card p-4 space-y-2">
          <div className="relative w-72">
            <Search className="absolute right-3 top-2.5 text-gray-400" size={14} />
            <input
              className="nexa-input pr-9"
              value={incomeSearch}
              onChange={(e) => setIncomeSearch(e.target.value)}
              placeholder="فیلتر درآمد"
            />
          </div>
          {filteredIncome.map((x) => <div key={x.id} className="flex items-center justify-between border-b py-2 text-xs"><span>{x.title} - {x.type}</span><span className="font-fa-num text-emerald-600">{formatToman(x.amount)}</span></div>)}
        </div>
      )}

      {activeTab === 'income-types' && (
        <div className="nexa-card p-4 space-y-2">
          <div className="flex gap-2">
            <input
              className="nexa-input flex-1"
              value={newIncomeType}
              onChange={(e) => setNewIncomeType(e.target.value)}
              placeholder="نوع درآمد جدید"
            />
            <button
              type="button"
              className="nexa-btn-primary shrink-0"
              onClick={() => {
                const v = newIncomeType.trim();
                if (!v || incomeTypes.includes(v)) return;
                setIncomeTypes((p) => [...p, v]);
                setNewIncomeType('');
              }}
            >
              افزودن نوع
            </button>
          </div>
          {incomeTypes.map((x, i) => (
            <div key={x + i} className="flex items-center justify-between border-b py-2 text-xs">
              <span>{x}</span>
              <button type="button" className="text-rose-500" onClick={() => setIncomeTypes((p) => p.filter((y) => y !== x))}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'installment-contract' && (
        <div className="nexa-card p-4 grid md:grid-cols-5 gap-2">
          <select className="nexa-input" value={installmentDraft.customerId} onChange={(e) => setInstallmentDraft((d) => ({ ...d, customerId: e.target.value }))}><option value="">شخص</option>{customers.map((x) => <option key={x.id} value={x.id}>{x.displayName}</option>)}</select>
          <input className="nexa-input" type="number" value={installmentDraft.total} onChange={(e) => setInstallmentDraft((d) => ({ ...d, total: Number(e.target.value) || 0 }))} placeholder="مبلغ کل" />
          <input className="nexa-input" type="number" value={installmentDraft.downPayment} onChange={(e) => setInstallmentDraft((d) => ({ ...d, downPayment: Number(e.target.value) || 0 }))} placeholder="پیش پرداخت" />
          <input className="nexa-input" type="number" value={installmentDraft.months} onChange={(e) => setInstallmentDraft((d) => ({ ...d, months: Number(e.target.value) || 1 }))} placeholder="تعداد اقساط" />
          <button className="nexa-btn-primary" onClick={() => setInstallments((p) => [{ id: `INS-${Date.now()}`, customerId: installmentDraft.customerId, total: installmentDraft.total, paid: installmentDraft.downPayment, nextDate: new Date(Date.now() + 30 * 24 * 3600000).toISOString().slice(0, 10) }, ...p])}><Percent size={14} /> ثبت قرارداد</button>
        </div>
      )}

      {activeTab === 'installment-list' && (
        <div className="nexa-card p-4 space-y-2">
          {installments.map((x) => <div key={x.id} className="flex items-center justify-between border-b py-2 text-xs"><span>{x.id} - {customers.find((c) => c.id === x.customerId)?.displayName || 'بدون شخص'}</span><span>باقیمانده: {formatToman(Math.max(0, x.total - x.paid))}</span><span>{x.nextDate}</span></div>)}
        </div>
      )}

      {activeTab === 'discounted-items' && (
        <div className="nexa-card p-4 space-y-2">
          <button className="nexa-btn-ghost text-xs" onClick={() => setDiscountRows((p) => [...p, { id: `${Date.now()}`, productId: '', mode: 'percent', value: 0, from: '2026-04-28', to: '2026-05-10' }])}><Plus size={14} /> افزودن قلم تخفیف</button>
          {discountRows.map((row) => (
            <div key={row.id} className="grid md:grid-cols-6 gap-2 border rounded-xl p-2">
              <select className="nexa-input" value={row.productId} onChange={(e) => setDiscountRows((p) => p.map((x) => x.id === row.id ? { ...x, productId: e.target.value } : x))}><option value="">کالا/خدمت</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
              <select className="nexa-input" value={row.mode} onChange={(e) => setDiscountRows((p) => p.map((x) => x.id === row.id ? { ...x, mode: e.target.value as 'percent' | 'amount' } : x))}><option value="percent">درصد</option><option value="amount">ریالی</option></select>
              <input className="nexa-input" type="number" value={row.value} onChange={(e) => setDiscountRows((p) => p.map((x) => x.id === row.id ? { ...x, value: Number(e.target.value) || 0 } : x))} />
              <input className="nexa-input" type="date" value={row.from} onChange={(e) => setDiscountRows((p) => p.map((x) => x.id === row.id ? { ...x, from: e.target.value } : x))} />
              <input className="nexa-input" type="date" value={row.to} onChange={(e) => setDiscountRows((p) => p.map((x) => x.id === row.id ? { ...x, to: e.target.value } : x))} />
              <button className="text-rose-500 text-xs" onClick={() => setDiscountRows((p) => p.filter((x) => x.id !== row.id))}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {stockModalLine && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setStockModalLine(null)}>
          <div className="bg-white rounded-2xl p-4 w-[420px] space-y-2" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-black text-sm">موجودی کالا در انبارها</h4>
            <p className="text-xs">انبار مرکزی: 1 عدد</p>
            <p className="text-xs">انبار شعبه: 2 عدد</p>
            <button className="nexa-btn-ghost w-full" onClick={() => setStockModalLine(null)}>بستن</button>
          </div>
        </div>
      )}
      {priceModalLine && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setPriceModalLine(null)}>
          <div className="bg-white rounded-2xl p-4 w-[420px] space-y-2" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-black text-sm">جزئیات قیمت کالا</h4>
            <p className="text-xs">آخرین قیمت خرید: {formatToman(120000)}</p>
            <p className="text-xs">آخرین قیمت فروش: {formatToman(180000)}</p>
            <button className="nexa-btn-ghost w-full" onClick={() => setPriceModalLine(null)}>بستن</button>
          </div>
        </div>
      )}

      {productPickerLineId && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setProductPickerLineId(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-nexa-border flex items-center gap-2 shrink-0">
              <Search className="text-gray-400 shrink-0" size={18} />
              <input
                className="nexa-input flex-1"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="جستجو نام، کد، بارکد…"
                autoFocus
              />
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                onClick={() => setProductPickerLineId(null)}
                aria-label="بستن"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filteredPickerProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    updateLine(productPickerLineId, { productId: p.id, unitPrice: 0 });
                    setProductPickerLineId(null);
                  }}
                  className="border border-nexa-border rounded-xl p-2 text-right hover:bg-gray-50 transition-colors"
                >
                  {p.images?.main ? (
                    <img
                      src={p.images.main}
                      alt=""
                      className="w-full h-24 object-cover rounded-lg mb-2 bg-gray-100"
                    />
                  ) : (
                    <div className="w-full h-24 rounded-lg mb-2 bg-gray-100 flex items-center justify-center text-[10px] text-gray-500">
                      {p.type === 'goods' ? 'کالا' : 'خدمات'}
                    </div>
                  )}
                  <p className="text-xs font-bold text-gray-900 truncate">{p.name}</p>
                  <p className="text-[10px] text-gray-500 font-fa-num mt-0.5">{p.code}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'new-sale' || activeTab === 'return-sale' || activeTab === 'sale-invoices') && (
        <div className="nexa-card p-3">
          <h3 className="text-xs font-black mb-2">تاریخچه ویرایش فاکتور</h3>
          {invoiceHistory.length === 0 ? (
            <p className="text-xs text-gray-400">هنوز سابقه‌ای ثبت نشده است.</p>
          ) : (
            invoiceHistory.slice(0, 5).map((x, i) => (
              <p key={i} className="text-xs border-b py-1">
                {x}
              </p>
            ))
          )}
        </div>
      )}
    </div>
  );
}
