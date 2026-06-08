'use client';

import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowUpCircle, FileDown, Plus, Search, Trash2, Upload } from 'lucide-react';
import { useCatalog } from '@/src/context/CatalogContext';
import { formatToman } from '@/src/lib/pricing';

type PurchasingTab =
  | 'purchase-new'
  | 'purchase-return'
  | 'purchase-list'
  | 'purchase-return-list'
  | 'expense-new'
  | 'expense-list'
  | 'waste-new'
  | 'waste-list';

type PurchaseLine = {
  id: string;
  itemId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
};

type PurchaseDoc = {
  number: string;
  reference: string;
  date: string;
  dueDate: string;
  contactCode: string;
  contactTitle: string;
  project: string;
  freight: number;
  note: string;
  status: 'draft' | 'confirmed';
  invoiceItems: PurchaseLine[];
};

type ExpenseDoc = {
  id: string;
  dateTime: string;
  description: string;
  amount: number;
  type: 'expense';
  contactCode?: string;
  bankCode?: string;
  cashCode?: string;
  pettyCashCode?: string;
};

type WasteDoc = {
  id: string;
  date: string;
  itemTitle: string;
  quantity: number;
  reason: string;
};

const tabs: Array<{ id: PurchasingTab; label: string }> = [
  { id: 'purchase-new', label: 'خرید جدید' },
  { id: 'purchase-return', label: 'برگشت از خرید' },
  { id: 'purchase-list', label: 'فاکتورهای خرید' },
  { id: 'purchase-return-list', label: 'فاکتورهای برگشت از خرید' },
  { id: 'expense-new', label: 'هزینه' },
  { id: 'expense-list', label: 'لیست هزینه ها' },
  { id: 'waste-new', label: 'ضایعات' },
  { id: 'waste-list', label: 'لیست ضایعات' },
];

function newLine(): PurchaseLine {
  return {
    id: `${Date.now()}-${Math.random()}`,
    itemId: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    tax: 0,
  };
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = '\uFEFF' + rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PurchasingReset() {
  const { people, products } = useCatalog();
  const suppliers = useMemo(() => people.filter((x) => x.roles.includes('supplier')), [people]);
  const [activeTab, setActiveTab] = useState<PurchasingTab>('purchase-new');
  const [search, setSearch] = useState('');
  const [doc, setDoc] = useState<PurchaseDoc>({
    number: '',
    reference: '',
    date: new Date().toISOString().slice(0, 10),
    dueDate: new Date().toISOString().slice(0, 10),
    contactCode: '',
    contactTitle: '',
    project: '',
    freight: 0,
    note: '',
    status: 'draft',
    invoiceItems: [newLine()],
  });
  const [purchaseInvoices, setPurchaseInvoices] = useState<Array<PurchaseDoc & { id: string; kind: 'purchase' | 'return' }>>([]);
  const [expenseDraft, setExpenseDraft] = useState<ExpenseDoc>({
    id: '',
    dateTime: new Date().toISOString().slice(0, 10),
    description: '',
    amount: 0,
    type: 'expense',
  });
  const [expenses, setExpenses] = useState<ExpenseDoc[]>([]);
  const [wasteDraft, setWasteDraft] = useState<WasteDoc>({
    id: '',
    date: new Date().toISOString().slice(0, 10),
    itemTitle: '',
    quantity: 1,
    reason: '',
  });
  const [wastes, setWastes] = useState<WasteDoc[]>([]);

  const updateLine = (id: string, patch: Partial<PurchaseLine>) => {
    setDoc((prev) => ({
      ...prev,
      invoiceItems: prev.invoiceItems.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
  };

  const lineTotals = doc.invoiceItems.map((x) => {
    const gross = x.quantity * x.unitPrice;
    const net = Math.max(0, gross - x.discount + x.tax);
    return { ...x, gross, net };
  });
  const docTotal = lineTotals.reduce((a, b) => a + b.net, 0) + doc.freight;

  const savePurchase = (kind: 'purchase' | 'return') => {
    const id = `${kind === 'purchase' ? 'BUY' : 'RET'}-${1000 + purchaseInvoices.length + 1}`;
    setPurchaseInvoices((prev) => [{ ...doc, id, kind }, ...prev]);
  };

  const filteredPurchase = purchaseInvoices.filter((x) => {
    const byKind =
      activeTab === 'purchase-list'
        ? x.kind === 'purchase'
        : activeTab === 'purchase-return-list'
          ? x.kind === 'return'
          : true;
    const q = search.trim();
    const bySearch =
      !q ||
      x.id.includes(q) ||
      x.number.includes(q) ||
      x.contactTitle.includes(q) ||
      x.project.includes(q) ||
      x.reference.includes(q);
    return byKind && bySearch;
  });

  const filteredExpense = expenses.filter(
    (x) => !search || x.description.includes(search) || x.id.includes(search) || x.dateTime.includes(search)
  );
  const filteredWaste = wastes.filter(
    (x) => !search || x.itemTitle.includes(search) || x.id.includes(search) || x.reason.includes(search)
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">خرید و هزینه</h1>
          <p className="text-xs text-gray-500">نسخه تب‌محور جدید (API-ready naming)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="nexa-btn-ghost text-xs"
            onClick={() =>
              downloadCsv(
                'purchase-invoices.csv',
                [['id', 'number', 'kind', 'date', 'contactTitle', 'project', 'total']].concat(
                  purchaseInvoices.map((x) => [
                    x.id,
                    x.number,
                    x.kind,
                    x.date,
                    x.contactTitle,
                    x.project,
                    String(x.invoiceItems.reduce((a, i) => a + i.quantity * i.unitPrice, 0) + x.freight),
                  ])
                )
              )
            }
          >
            <FileDown size={14} />
            خروجی اکسل
          </button>
          <button className="nexa-btn-ghost text-xs">
            <Upload size={14} />
            ورود اکسل
          </button>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs rounded-xl font-bold whitespace-nowrap ${
              activeTab === tab.id ? 'bg-white text-nexa-accent' : 'text-gray-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {(activeTab === 'purchase-new' || activeTab === 'purchase-return') && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          <div className="xl:col-span-3 nexa-card p-4 space-y-3">
            <div className="grid md:grid-cols-3 gap-2">
              <input className="nexa-input" placeholder="number" value={doc.number} onChange={(e) => setDoc((d) => ({ ...d, number: e.target.value }))} />
              <input className="nexa-input" placeholder="reference" value={doc.reference} onChange={(e) => setDoc((d) => ({ ...d, reference: e.target.value }))} />
              <select className="nexa-input" value={doc.contactCode} onChange={(e) => setDoc((d) => ({ ...d, contactCode: e.target.value, contactTitle: suppliers.find((s) => s.accountingCode === e.target.value)?.displayName || '' }))}>
                <option value="">contactCode (تامین‌کننده)</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.accountingCode}>
                    {s.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid md:grid-cols-4 gap-2">
              <input type="date" className="nexa-input" value={doc.date} onChange={(e) => setDoc((d) => ({ ...d, date: e.target.value }))} />
              <input type="date" className="nexa-input" value={doc.dueDate} onChange={(e) => setDoc((d) => ({ ...d, dueDate: e.target.value }))} />
              <input className="nexa-input" placeholder="project" value={doc.project} onChange={(e) => setDoc((d) => ({ ...d, project: e.target.value }))} />
              <input type="number" className="nexa-input" placeholder="freight" value={doc.freight} onChange={(e) => setDoc((d) => ({ ...d, freight: Number(e.target.value) || 0 }))} />
            </div>

            {lineTotals.map((line) => (
              <div key={line.id} className="grid md:grid-cols-12 gap-2 bg-gray-50 rounded-xl p-2">
                <select className="nexa-input md:col-span-3" value={line.itemId} onChange={(e) => updateLine(line.id, { itemId: e.target.value })}>
                  <option value="">itemCode (کالا/خدمت)</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.code || p.accountingCode}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <input className="nexa-input md:col-span-2" placeholder="description" value={line.description} onChange={(e) => updateLine(line.id, { description: e.target.value })} />
                <input className="nexa-input md:col-span-1" type="number" placeholder="qty" value={line.quantity} onChange={(e) => updateLine(line.id, { quantity: Number(e.target.value) || 1 })} />
                <input className="nexa-input md:col-span-2" type="number" placeholder="unitPrice" value={line.unitPrice} onChange={(e) => updateLine(line.id, { unitPrice: Number(e.target.value) || 0 })} />
                <input className="nexa-input md:col-span-1" type="number" placeholder="discount" value={line.discount} onChange={(e) => updateLine(line.id, { discount: Number(e.target.value) || 0 })} />
                <input className="nexa-input md:col-span-1" type="number" placeholder="tax" value={line.tax} onChange={(e) => updateLine(line.id, { tax: Number(e.target.value) || 0 })} />
                <div className="md:col-span-2 flex items-center justify-between px-2">
                  <span className="text-xs font-black">{formatToman(line.net)}</span>
                  <button className="text-rose-500" onClick={() => setDoc((d) => ({ ...d, invoiceItems: d.invoiceItems.filter((x) => x.id !== line.id) }))}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}

            <div className="flex gap-2">
              <button className="nexa-btn-ghost text-xs" onClick={() => setDoc((d) => ({ ...d, invoiceItems: [...d.invoiceItems, newLine()] }))}>
                <Plus size={14} />
                افزودن ردیف
              </button>
              <button className="nexa-btn-ghost text-xs" onClick={() => setDoc((d) => ({ ...d, invoiceItems: [...d.invoiceItems, ...Array.from({ length: 3 }).map(() => newLine())] }))}>
                افزودن از فلش انتهای ردیف
              </button>
            </div>
          </div>

          <div className="nexa-card p-4 space-y-2">
            <select className="nexa-input" value={doc.status} onChange={(e) => setDoc((d) => ({ ...d, status: e.target.value as 'draft' | 'confirmed' }))}>
              <option value="draft">draft</option>
              <option value="confirmed">confirmed</option>
            </select>
            <textarea className="nexa-input min-h-24" placeholder="note" value={doc.note} onChange={(e) => setDoc((d) => ({ ...d, note: e.target.value }))} />
            <div className="bg-gray-50 rounded-xl p-2 text-xs flex items-center justify-between">
              <span>جمع کل</span>
              <span className="font-black">{formatToman(docTotal)}</span>
            </div>
            <button className="nexa-btn-primary w-full" onClick={() => savePurchase(activeTab === 'purchase-new' ? 'purchase' : 'return')}>
              {activeTab === 'purchase-new' ? 'ثبت خرید جدید' : <><ArrowUpCircle size={14} /> ثبت برگشت از خرید</>}
            </button>
          </div>
        </div>
      )}

      {(activeTab === 'purchase-list' || activeTab === 'purchase-return-list') && (
        <div className="nexa-card p-4 space-y-3">
          <div className="relative w-72">
            <Search className="absolute right-3 top-2.5 text-gray-400" size={14} />
            <input className="nexa-input pr-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجو فاکتور" />
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b">
                <th className="py-2 text-right">id</th>
                <th className="text-right">number</th>
                <th className="text-right">date</th>
                <th className="text-right">contactTitle</th>
                <th className="text-right">project</th>
                <th className="text-right">status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchase.map((x) => (
                <tr key={x.id} className="border-b">
                  <td className="py-2 text-blue-700">{x.id}</td>
                  <td>{x.number || '-'}</td>
                  <td>{x.date}</td>
                  <td>{x.contactTitle || '-'}</td>
                  <td>{x.project || '-'}</td>
                  <td>{x.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'expense-new' && (
        <div className="nexa-card p-4 grid md:grid-cols-6 gap-2">
          <input className="nexa-input" type="date" value={expenseDraft.dateTime} onChange={(e) => setExpenseDraft((d) => ({ ...d, dateTime: e.target.value }))} />
          <input className="nexa-input md:col-span-2" placeholder="description" value={expenseDraft.description} onChange={(e) => setExpenseDraft((d) => ({ ...d, description: e.target.value }))} />
          <input className="nexa-input" type="number" placeholder="amount" value={expenseDraft.amount} onChange={(e) => setExpenseDraft((d) => ({ ...d, amount: Number(e.target.value) || 0 }))} />
          <input className="nexa-input" placeholder="contactCode" value={expenseDraft.contactCode || ''} onChange={(e) => setExpenseDraft((d) => ({ ...d, contactCode: e.target.value }))} />
          <button className="nexa-btn-primary" onClick={() => setExpenses((p) => [{ ...expenseDraft, id: `EXP-${1000 + p.length + 1}` }, ...p])}>ثبت هزینه</button>
        </div>
      )}

      {activeTab === 'expense-list' && (
        <div className="nexa-card p-4 space-y-2">
          <div className="relative w-72">
            <Search className="absolute right-3 top-2.5 text-gray-400" size={14} />
            <input className="nexa-input pr-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجو هزینه" />
          </div>
          {filteredExpense.map((x) => (
            <div key={x.id} className="flex items-center justify-between border-b py-2 text-xs">
              <span>{x.id}</span>
              <span>{x.description}</span>
              <span>{x.dateTime}</span>
              <span className="font-fa-num text-rose-600">{formatToman(x.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'waste-new' && (
        <div className="nexa-card p-4 grid md:grid-cols-5 gap-2">
          <input className="nexa-input" type="date" value={wasteDraft.date} onChange={(e) => setWasteDraft((d) => ({ ...d, date: e.target.value }))} />
          <input className="nexa-input" placeholder="شرح کالا" value={wasteDraft.itemTitle} onChange={(e) => setWasteDraft((d) => ({ ...d, itemTitle: e.target.value }))} />
          <input className="nexa-input" type="number" placeholder="تعداد" value={wasteDraft.quantity} onChange={(e) => setWasteDraft((d) => ({ ...d, quantity: Number(e.target.value) || 1 }))} />
          <input className="nexa-input" placeholder="علت ضایعات" value={wasteDraft.reason} onChange={(e) => setWasteDraft((d) => ({ ...d, reason: e.target.value }))} />
          <button className="nexa-btn-primary" onClick={() => setWastes((p) => [{ ...wasteDraft, id: `WST-${1000 + p.length + 1}` }, ...p])}>
            <AlertTriangle size={14} />
            ثبت ضایعات
          </button>
        </div>
      )}

      {activeTab === 'waste-list' && (
        <div className="nexa-card p-4 space-y-2">
          {filteredWaste.map((x) => (
            <div key={x.id} className="flex items-center justify-between border-b py-2 text-xs">
              <span>{x.id}</span>
              <span>{x.itemTitle}</span>
              <span>{x.reason}</span>
              <span>{x.quantity}</span>
              <span>{x.date}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

