'use client';

import React, { useMemo, useState } from 'react';
import { Banknote, BookOpen, Calendar, Landmark, Plus, RefreshCcw, Search, Wallet } from 'lucide-react';

type BankingMode =
  | 'overview'
  | 'banks'
  | 'cashboxes'
  | 'petty-cash'
  | 'transfer-create'
  | 'transfer-list'
  | 'checks-received'
  | 'checks-paid'
  | 'cash-report';

type BankTx = {
  id: string;
  date: string;
  title: string;
  amount: number;
  kind: 'in' | 'out';
  accountingDocNo: string;
};

type Bank = {
  id: string;
  name: string;
  branch?: string;
  accountNo: string;
  cardNo?: string;
  iban?: string;
  accountOwner?: string;
  posNo?: string;
  overdraft?: number;
  internetBankMobile?: string;
  paymentRefNo?: string;
  shaparakAcceptorNo?: string;
  description?: string;
  currency?: string;
  balance: number;
  tx: BankTx[];
};

type Cashbox = {
  id: string;
  name: string;
  currency: string;
  manager: string;
  overdraft?: number;
  paymentRefNo?: string;
  shaparakAcceptorNo?: string;
  description?: string;
  balance: number;
};

type PettyCash = {
  id: string;
  holder: string;
  project: string;
  currency?: string;
  overdraft?: number;
  description?: string;
  balance: number;
  lastExpense: string;
};

type Transfer = {
  id: string;
  date: string;
  from: string;
  to: string;
  amount: number;
  status: 'ثبت شده' | 'تایید شده';
};

type CheckItem = {
  id: string;
  bank: string;
  date: string;
  dueDate: string;
  amount: number;
  party: string;
  status: string;
};

const TABS: { id: BankingMode; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'داشبورد بانکداری', icon: <Landmark size={14} /> },
  { id: 'banks', label: 'بانک‌ها', icon: <Landmark size={14} /> },
  { id: 'cashboxes', label: 'صندوق‌ها', icon: <Wallet size={14} /> },
  { id: 'petty-cash', label: 'تنخواه گردان‌ها', icon: <Banknote size={14} /> },
  { id: 'transfer-create', label: 'انتقال', icon: <RefreshCcw size={14} /> },
  { id: 'transfer-list', label: 'لیست انتقال‌ها', icon: <BookOpen size={14} /> },
  { id: 'checks-received', label: 'لیست چک‌های دریافتی', icon: <BookOpen size={14} /> },
  { id: 'checks-paid', label: 'لیست چک‌های پرداختی', icon: <BookOpen size={14} /> },
  { id: 'cash-report', label: 'گزارش نقد و بانک', icon: <Calendar size={14} /> },
];

const fm = (n: number) => n.toLocaleString('fa-IR');
const dateKey = (value: string) => value.replace(/[^0-9]/g, '');

const toCsv = (rows: Array<Array<string | number>>) =>
  `\uFEFF${rows.map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')}`;

const downloadCsv = (filename: string, rows: Array<Array<string | number>>) => {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export default function Banking() {
  const [mode, setMode] = useState<BankingMode>('overview');
  const [query, setQuery] = useState('');
  const [rangeFrom, setRangeFrom] = useState('1405-01-01');
  const [rangeTo, setRangeTo] = useState('1405-12-29');
  const [activeDoc, setActiveDoc] = useState<BankTx | null>(null);

  const [banks, setBanks] = useState<Bank[]>([
    {
      id: 'b1',
      name: 'بانک ملت - شعبه مرکزی',
      branch: 'مرکزی',
      accountNo: '5874-9632-1458',
      cardNo: '6037991234567890',
      iban: 'IR820540102680020817909002',
      accountOwner: 'شرکت نِکسا',
      posNo: 'POS-1002',
      overdraft: 0,
      internetBankMobile: '09121234567',
      paymentRefNo: 'PR-77822',
      shaparakAcceptorNo: 'AC-992211',
      description: 'حساب اصلی عملیات',
      currency: 'IRR',
      balance: 1250000000,
      tx: [
        { id: 'bt1', date: '1405/01/22', title: 'واریز فروش', amount: 350000000, kind: 'in', accountingDocNo: 'DOC-1192' },
        { id: 'bt2', date: '1405/01/24', title: 'پرداخت اجاره', amount: 85000000, kind: 'out', accountingDocNo: 'DOC-1198' },
      ],
    },
    {
      id: 'b2',
      name: 'بانک سامان - شعبه جردن',
      branch: 'جردن',
      accountNo: '6219-8610-4578',
      currency: 'IRR',
      balance: 780000000,
      tx: [{ id: 'bt3', date: '1405/01/25', title: 'پرداخت خرید مواد', amount: 125000000, kind: 'out', accountingDocNo: 'DOC-1201' }],
    },
  ]);
  const [selectedBankId, setSelectedBankId] = useState('b1');
  const [newBank, setNewBank] = useState({
    name: '',
    branch: '',
    accountNo: '',
    cardNo: '',
    iban: '',
    accountOwner: '',
    posNo: '',
    overdraft: '',
    currency: 'IRR',
    description: '',
    internetBankMobile: '',
    paymentRefNo: '',
    shaparakAcceptorNo: '',
  });

  const [cashboxes, setCashboxes] = useState<Cashbox[]>([
    { id: 'c1', name: 'صندوق مرکزی', currency: 'IRR', manager: 'احمدی', balance: 47000000 },
    { id: 'c2', name: 'صندوق نمایشگاه', currency: 'USD', manager: 'مرادی', balance: 1800 },
  ]);
  const [newCashbox, setNewCashbox] = useState({
    name: '',
    currency: 'IRR',
    manager: '',
    overdraft: '',
    paymentRefNo: '',
    shaparakAcceptorNo: '',
    description: '',
  });

  const [pettyCash, setPettyCash] = useState<PettyCash[]>([
    { id: 'p1', holder: 'ظریفی', project: 'پروژه دلژین', balance: 12000000, lastExpense: '1405/01/20' },
    { id: 'p2', holder: 'احسانی', project: 'پروژه انبار مک', balance: 8500000, lastExpense: '1405/01/25' },
  ]);
  const [newPettyCash, setNewPettyCash] = useState({
    holder: '',
    project: '',
    currency: 'IRR',
    overdraft: '',
    description: '',
  });

  const [transfers, setTransfers] = useState<Transfer[]>([
    { id: 'tr1', date: '1405/01/10', from: 'بانک ملت - شعبه مرکزی', to: 'صندوق مرکزی', amount: 55000000, status: 'تایید شده' },
    { id: 'tr2', date: '1405/01/19', from: 'بانک سامان - شعبه جردن', to: 'ظریفی (تنخواه)', amount: 15000000, status: 'ثبت شده' },
  ]);
  const [newTransfer, setNewTransfer] = useState({ from: '', to: '', amount: '' });

  const [checksReceived] = useState<CheckItem[]>([
    { id: 'cr1', bank: 'ملی', date: '1405/01/18', dueDate: '1405/02/10', amount: 43000000, party: 'شرکت آوا', status: 'در جریان' },
    { id: 'cr2', bank: 'صادرات', date: '1405/01/20', dueDate: '1405/02/15', amount: 91000000, party: 'فروشگاه رستا', status: 'وصول شده' },
  ]);
  const [checksPaid] = useState<CheckItem[]>([
    { id: 'cp1', bank: 'ملت', date: '1405/01/21', dueDate: '1405/02/12', amount: 38000000, party: 'تامین قطعات البرز', status: 'پاس شده' },
    { id: 'cp2', bank: 'سامان', date: '1405/01/27', dueDate: '1405/02/20', amount: 127000000, party: 'اجاره انبار مرکزی', status: 'در انتظار' },
  ]);

  const selectedBank = banks.find((b) => b.id === selectedBankId) ?? banks[0];
  const bankTxRows = (selectedBank?.tx ?? []).filter((row) => {
    const key = dateKey(row.date);
    const fromKey = dateKey(rangeFrom);
    const toKey = dateKey(rangeTo);
    if (fromKey && key < fromKey) return false;
    if (toKey && key > toKey) return false;
    return true;
  });

  const filteredTransfers = useMemo(
    () => transfers.filter((x) => `${x.id} ${x.from} ${x.to}`.toLowerCase().includes(query.toLowerCase())),
    [transfers, query],
  );

  const addBank = () => {
    if (!newBank.name.trim() || !newBank.accountNo.trim()) return;
    setBanks((prev) => [
      {
        id: `b${prev.length + 1}`,
        name: newBank.name.trim(),
        branch: newBank.branch.trim(),
        accountNo: newBank.accountNo.trim(),
        cardNo: newBank.cardNo.trim(),
        iban: newBank.iban.trim(),
        accountOwner: newBank.accountOwner.trim(),
        posNo: newBank.posNo.trim(),
        overdraft: Number(newBank.overdraft) || 0,
        currency: newBank.currency,
        description: newBank.description.trim(),
        internetBankMobile: newBank.internetBankMobile.trim(),
        paymentRefNo: newBank.paymentRefNo.trim(),
        shaparakAcceptorNo: newBank.shaparakAcceptorNo.trim(),
        balance: 0,
        tx: [],
      },
      ...prev,
    ]);
    setNewBank({
      name: '',
      branch: '',
      accountNo: '',
      cardNo: '',
      iban: '',
      accountOwner: '',
      posNo: '',
      overdraft: '',
      currency: 'IRR',
      description: '',
      internetBankMobile: '',
      paymentRefNo: '',
      shaparakAcceptorNo: '',
    });
  };

  const addCashbox = () => {
    if (!newCashbox.name.trim() || !newCashbox.manager.trim()) return;
    setCashboxes((prev) => [
      {
        id: `c${prev.length + 1}`,
        name: newCashbox.name.trim(),
        currency: newCashbox.currency,
        manager: newCashbox.manager.trim(),
        overdraft: Number(newCashbox.overdraft) || 0,
        paymentRefNo: newCashbox.paymentRefNo.trim(),
        shaparakAcceptorNo: newCashbox.shaparakAcceptorNo.trim(),
        description: newCashbox.description.trim(),
        balance: 0,
      },
      ...prev,
    ]);
    setNewCashbox({ name: '', currency: 'IRR', manager: '', overdraft: '', paymentRefNo: '', shaparakAcceptorNo: '', description: '' });
  };

  const addPettyCash = () => {
    if (!newPettyCash.holder.trim() || !newPettyCash.project.trim()) return;
    setPettyCash((prev) => [
      {
        id: `p${prev.length + 1}`,
        holder: newPettyCash.holder.trim(),
        project: newPettyCash.project.trim(),
        currency: newPettyCash.currency,
        overdraft: Number(newPettyCash.overdraft) || 0,
        description: newPettyCash.description.trim(),
        balance: 0,
        lastExpense: '-',
      },
      ...prev,
    ]);
    setNewPettyCash({ holder: '', project: '', currency: 'IRR', overdraft: '', description: '' });
  };

  const addTransfer = () => {
    if (!newTransfer.from || !newTransfer.to || !newTransfer.amount) return;
    setTransfers((prev) => [
      {
        id: `tr${prev.length + 1}`,
        date: '1405/02/01',
        from: newTransfer.from,
        to: newTransfer.to,
        amount: Number(newTransfer.amount),
        status: 'ثبت شده',
      },
      ...prev,
    ]);
    setMode('transfer-list');
    setNewTransfer({ from: '', to: '', amount: '' });
  };

  const sources = [
    ...banks.map((x) => x.name),
    ...cashboxes.map((x) => x.name),
    ...pettyCash.map((x) => `${x.holder} (تنخواه)`),
  ];

  const exportBankTx = () => {
    if (!selectedBank) return;
    const rows: Array<Array<string | number>> = [
      ['بانک', selectedBank.name],
      ['از تاریخ', rangeFrom],
      ['تا تاریخ', rangeTo],
      [],
      ['تاریخ', 'شرح', 'مبلغ', 'نوع', 'سند حسابداری'],
      ...bankTxRows.map((row) => [row.date, row.title, row.amount, row.kind === 'in' ? 'دریافت' : 'پرداخت', row.accountingDocNo]),
    ];
    downloadCsv(`bank-transactions-${selectedBank.id}.csv`, rows);
  };

  const exportTransfers = () => {
    const rows: Array<Array<string | number>> = [
      ['کد', 'تاریخ', 'مبدا', 'مقصد', 'مبلغ', 'وضعیت'],
      ...filteredTransfers.map((x) => [x.id, x.date, x.from, x.to, x.amount, x.status]),
    ];
    downloadCsv('transfers.csv', rows);
  };

  const exportChecks = (kind: 'received' | 'paid') => {
    const list = kind === 'received' ? checksReceived : checksPaid;
    const rows: Array<Array<string | number>> = [
      ['کد', 'بانک', 'تاریخ', 'سررسید', 'طرف حساب', 'مبلغ', 'وضعیت'],
      ...list.map((x) => [x.id, x.bank, x.date, x.dueDate, x.party, x.amount, x.status]),
    ];
    downloadCsv(kind === 'received' ? 'checks-received.csv' : 'checks-paid.csv', rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">بانکداری</h1>
          <p className="text-sm text-gray-500 mt-1">مدیریت بانک، صندوق، تنخواه، انتقال و چک‌ها</p>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl overflow-x-auto no-scrollbar">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              mode === item.id ? 'bg-white text-nexa-accent shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {mode === 'overview' && (
        <div className="grid md:grid-cols-4 gap-3">
          <div className="nexa-card p-4">
            <p className="text-xs text-gray-500">موجودی بانک‌ها</p>
            <p className="text-lg font-black text-gray-900 mt-2">{fm(banks.reduce((s, b) => s + b.balance, 0))}</p>
          </div>
          <div className="nexa-card p-4">
            <p className="text-xs text-gray-500">موجودی صندوق‌ها</p>
            <p className="text-lg font-black text-gray-900 mt-2">{fm(cashboxes.reduce((s, b) => s + b.balance, 0))}</p>
          </div>
          <div className="nexa-card p-4">
            <p className="text-xs text-gray-500">مانده تنخواه‌ها</p>
            <p className="text-lg font-black text-gray-900 mt-2">{fm(pettyCash.reduce((s, b) => s + b.balance, 0))}</p>
          </div>
          <div className="nexa-card p-4">
            <p className="text-xs text-gray-500">تعداد انتقال‌ها</p>
            <p className="text-lg font-black text-gray-900 mt-2">{fm(transfers.length)}</p>
          </div>
        </div>
      )}

      {mode === 'banks' && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="nexa-card p-4 space-y-3">
            <h3 className="text-sm font-black text-gray-900">بانک جدید</h3>
            <input value={newBank.name} onChange={(e) => setNewBank((x) => ({ ...x, name: e.target.value }))} placeholder="نام بانک و شعبه" className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input value={newBank.branch} onChange={(e) => setNewBank((x) => ({ ...x, branch: e.target.value }))} placeholder="شعبه" className="bg-gray-50 rounded-xl px-3 py-2 text-sm" />
              <input value={newBank.accountNo} onChange={(e) => setNewBank((x) => ({ ...x, accountNo: e.target.value }))} placeholder="شماره حساب" className="bg-gray-50 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input value={newBank.cardNo} onChange={(e) => setNewBank((x) => ({ ...x, cardNo: e.target.value }))} placeholder="شماره کارت" className="bg-gray-50 rounded-xl px-3 py-2 text-sm font-fa-num" />
              <input value={newBank.iban} onChange={(e) => setNewBank((x) => ({ ...x, iban: e.target.value }))} placeholder="شماره شبا" className="bg-gray-50 rounded-xl px-3 py-2 text-sm font-fa-num" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input value={newBank.accountOwner} onChange={(e) => setNewBank((x) => ({ ...x, accountOwner: e.target.value }))} placeholder="نام صاحب حساب" className="bg-gray-50 rounded-xl px-3 py-2 text-sm" />
              <input value={newBank.posNo} onChange={(e) => setNewBank((x) => ({ ...x, posNo: e.target.value }))} placeholder="شماره POS" className="bg-gray-50 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input value={newBank.overdraft} onChange={(e) => setNewBank((x) => ({ ...x, overdraft: e.target.value }))} placeholder="بیش‌برداشت" className="bg-gray-50 rounded-xl px-3 py-2 text-sm font-fa-num" />
              <select value={newBank.currency} onChange={(e) => setNewBank((x) => ({ ...x, currency: e.target.value }))} className="bg-gray-50 rounded-xl px-3 py-2 text-sm">
                <option value="IRR">IRR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="TRY">TRY</option>
                <option value="CNY">CNY</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input value={newBank.internetBankMobile} onChange={(e) => setNewBank((x) => ({ ...x, internetBankMobile: e.target.value }))} placeholder="موبایل اینترنت بانک" className="bg-gray-50 rounded-xl px-3 py-2 text-sm font-fa-num" />
              <input value={newBank.paymentRefNo} onChange={(e) => setNewBank((x) => ({ ...x, paymentRefNo: e.target.value }))} placeholder="شماره مرجع پرداخت" className="bg-gray-50 rounded-xl px-3 py-2 text-sm" />
            </div>
            <input value={newBank.shaparakAcceptorNo} onChange={(e) => setNewBank((x) => ({ ...x, shaparakAcceptorNo: e.target.value }))} placeholder="شماره پذیرنده شاپرک" className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm" />
            <textarea value={newBank.description} onChange={(e) => setNewBank((x) => ({ ...x, description: e.target.value }))} placeholder="توضیحات" className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm min-h-16" />
            <button type="button" onClick={addBank} className="nexa-btn-primary w-full flex items-center justify-center gap-2 py-2">
              <Plus size={14} />
              افزودن بانک
            </button>
          </div>

          <div className="nexa-card p-4 lg:col-span-2 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-black text-gray-900">لیست بانک‌ها</h3>
              <select value={selectedBankId} onChange={(e) => setSelectedBankId(e.target.value)} className="mr-auto bg-gray-50 rounded-xl px-3 py-2 text-xs">
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-nexa-border">
                    <th className="py-2">بانک</th>
                    <th className="py-2">شماره حساب</th>
                    <th className="py-2">موجودی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexa-border">
                  {banks.map((b) => (
                    <tr key={b.id}>
                      <td className="py-2">{b.name}</td>
                      <td className="py-2 font-fa-num">{b.accountNo}</td>
                      <td className="py-2 font-fa-num">{fm(b.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-nexa-border pt-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-black text-gray-700">گردش حساب بانک</h4>
                <button type="button" onClick={exportBankTx} className="text-xs font-bold text-nexa-accent">
                  خروجی CSV
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-2">
                <input type="date" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} className="bg-gray-50 rounded-xl px-3 py-2 text-xs font-fa-num" />
                <input type="date" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} className="bg-gray-50 rounded-xl px-3 py-2 text-xs font-fa-num" />
              </div>
              <div className="overflow-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="text-gray-500 border-b border-nexa-border">
                      <th className="py-2">تاریخ</th>
                      <th className="py-2">شرح</th>
                      <th className="py-2">مبلغ</th>
                      <th className="py-2">نوع</th>
                      <th className="py-2">سند حسابداری</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexa-border">
                    {bankTxRows.map((row) => (
                      <tr key={row.id}>
                        <td className="py-2 font-fa-num">{row.date}</td>
                        <td className="py-2">{row.title}</td>
                        <td className="py-2 font-fa-num">{fm(row.amount)}</td>
                        <td className="py-2">{row.kind === 'in' ? 'دریافت' : 'پرداخت'}</td>
                        <td className="py-2">
                          <button type="button" onClick={() => setActiveDoc(row)} className="text-nexa-accent font-bold hover:underline">
                            {row.accountingDocNo}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === 'cashboxes' && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="nexa-card p-4 space-y-3">
            <h3 className="text-sm font-black text-gray-900">صندوق جدید</h3>
            <input value={newCashbox.name} onChange={(e) => setNewCashbox((x) => ({ ...x, name: e.target.value }))} placeholder="نام صندوق" className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm" />
            <select value={newCashbox.currency} onChange={(e) => setNewCashbox((x) => ({ ...x, currency: e.target.value }))} className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm">
              <option value="IRR">IRR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="TRY">TRY</option>
              <option value="CNY">CNY</option>
            </select>
            <input value={newCashbox.manager} onChange={(e) => setNewCashbox((x) => ({ ...x, manager: e.target.value }))} placeholder="مسئول صندوق" className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm" />
            <input value={newCashbox.overdraft} onChange={(e) => setNewCashbox((x) => ({ ...x, overdraft: e.target.value }))} placeholder="بیش‌برداشت" className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm font-fa-num" />
            <div className="grid grid-cols-2 gap-2">
              <input value={newCashbox.paymentRefNo} onChange={(e) => setNewCashbox((x) => ({ ...x, paymentRefNo: e.target.value }))} placeholder="مرجع پرداخت" className="bg-gray-50 rounded-xl px-3 py-2 text-sm" />
              <input value={newCashbox.shaparakAcceptorNo} onChange={(e) => setNewCashbox((x) => ({ ...x, shaparakAcceptorNo: e.target.value }))} placeholder="پذیرنده شاپرک" className="bg-gray-50 rounded-xl px-3 py-2 text-sm" />
            </div>
            <textarea value={newCashbox.description} onChange={(e) => setNewCashbox((x) => ({ ...x, description: e.target.value }))} placeholder="توضیحات" className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm min-h-14" />
            <button type="button" onClick={addCashbox} className="nexa-btn-primary w-full py-2">ثبت صندوق</button>
          </div>
          <div className="nexa-card p-4 lg:col-span-2">
            <h3 className="text-sm font-black text-gray-900 mb-3">لیست صندوق‌ها</h3>
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-nexa-border">
                  <th className="py-2">نام</th>
                  <th className="py-2">ارز</th>
                  <th className="py-2">مسئول</th>
                  <th className="py-2">بیش‌برداشت</th>
                  <th className="py-2">موجودی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nexa-border">
                {cashboxes.map((box) => (
                  <tr key={box.id}>
                    <td className="py-2">{box.name}</td>
                    <td className="py-2 font-bold">{box.currency}</td>
                    <td className="py-2">{box.manager}</td>
                    <td className="py-2 font-fa-num">{fm(box.overdraft || 0)}</td>
                    <td className="py-2 font-fa-num">{fm(box.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {mode === 'petty-cash' && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="nexa-card p-4 space-y-3">
            <h3 className="text-sm font-black text-gray-900">تنخواه جدید</h3>
            <input value={newPettyCash.holder} onChange={(e) => setNewPettyCash((x) => ({ ...x, holder: e.target.value }))} placeholder="نام تنخواه‌گردان" className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm" />
            <input value={newPettyCash.project} onChange={(e) => setNewPettyCash((x) => ({ ...x, project: e.target.value }))} placeholder="پروژه" className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <select value={newPettyCash.currency} onChange={(e) => setNewPettyCash((x) => ({ ...x, currency: e.target.value }))} className="bg-gray-50 rounded-xl px-3 py-2 text-sm">
                <option value="IRR">IRR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="TRY">TRY</option>
                <option value="CNY">CNY</option>
              </select>
              <input value={newPettyCash.overdraft} onChange={(e) => setNewPettyCash((x) => ({ ...x, overdraft: e.target.value }))} placeholder="بیش‌برداشت" className="bg-gray-50 rounded-xl px-3 py-2 text-sm font-fa-num" />
            </div>
            <textarea value={newPettyCash.description} onChange={(e) => setNewPettyCash((x) => ({ ...x, description: e.target.value }))} placeholder="توضیحات" className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm min-h-14" />
            <button type="button" onClick={addPettyCash} className="nexa-btn-primary w-full py-2">ثبت تنخواه</button>
          </div>
          <div className="nexa-card p-4 lg:col-span-2">
            <h3 className="text-sm font-black text-gray-900 mb-3">لیست و گردش تنخواه‌گردان‌ها</h3>
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-nexa-border">
                  <th className="py-2">تنخواه‌گردان</th>
                  <th className="py-2">پروژه</th>
                  <th className="py-2">ارز</th>
                  <th className="py-2">بیش‌برداشت</th>
                  <th className="py-2">مانده</th>
                  <th className="py-2">آخرین هزینه</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nexa-border">
                {pettyCash.map((x) => (
                  <tr key={x.id}>
                    <td className="py-2">{x.holder}</td>
                    <td className="py-2">{x.project}</td>
                    <td className="py-2">{x.currency || 'IRR'}</td>
                    <td className="py-2 font-fa-num">{fm(x.overdraft || 0)}</td>
                    <td className="py-2 font-fa-num">{fm(x.balance)}</td>
                    <td className="py-2 font-fa-num">{x.lastExpense}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {mode === 'transfer-create' && (
        <div className="nexa-card p-5 max-w-3xl space-y-3">
          <h3 className="text-sm font-black text-gray-900">ثبت انتقال وجه</h3>
          <div className="grid md:grid-cols-3 gap-2">
            <select value={newTransfer.from} onChange={(e) => setNewTransfer((x) => ({ ...x, from: e.target.value }))} className="bg-gray-50 rounded-xl px-3 py-2 text-sm">
              <option value="">مبدا</option>
              {sources.map((x) => <option key={`f-${x}`}>{x}</option>)}
            </select>
            <select value={newTransfer.to} onChange={(e) => setNewTransfer((x) => ({ ...x, to: e.target.value }))} className="bg-gray-50 rounded-xl px-3 py-2 text-sm">
              <option value="">مقصد</option>
              {sources.map((x) => <option key={`t-${x}`}>{x}</option>)}
            </select>
            <input value={newTransfer.amount} onChange={(e) => setNewTransfer((x) => ({ ...x, amount: e.target.value }))} placeholder="مبلغ" className="bg-gray-50 rounded-xl px-3 py-2 text-sm font-fa-num" />
          </div>
          <button type="button" onClick={addTransfer} className="nexa-btn-primary px-4 py-2">ثبت انتقال</button>
        </div>
      )}

      {mode === 'transfer-list' && (
        <div className="nexa-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="relative max-w-sm w-full">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجو انتقال" className="w-full bg-gray-50 rounded-xl pr-8 pl-3 py-2 text-sm" />
            </div>
            <button type="button" onClick={exportTransfers} className="text-xs font-bold text-nexa-accent whitespace-nowrap">
              خروجی CSV
            </button>
          </div>
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-nexa-border">
                <th className="py-2">کد</th>
                <th className="py-2">تاریخ</th>
                <th className="py-2">مبدا</th>
                <th className="py-2">مقصد</th>
                <th className="py-2">مبلغ</th>
                <th className="py-2">وضعیت</th>
                <th className="py-2">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nexa-border">
              {filteredTransfers.map((x) => (
                <tr key={x.id}>
                  <td className="py-2 font-fa-num">{x.id}</td>
                  <td className="py-2 font-fa-num">{x.date}</td>
                  <td className="py-2">{x.from}</td>
                  <td className="py-2">{x.to}</td>
                  <td className="py-2 font-fa-num">{fm(x.amount)}</td>
                  <td className="py-2">{x.status}</td>
                  <td className="py-2">
                    <button type="button" className="text-xs text-nexa-accent">مشاهده</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(mode === 'checks-received' || mode === 'checks-paid') && (
        <div className="nexa-card p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-black text-gray-900">{mode === 'checks-received' ? 'لیست چک‌های دریافتی' : 'لیست چک‌های پرداختی'}</h3>
            <button
              type="button"
              onClick={() => exportChecks(mode === 'checks-received' ? 'received' : 'paid')}
              className="text-xs font-bold text-nexa-accent"
            >
              خروجی CSV
            </button>
          </div>
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-nexa-border">
                <th className="py-2">کد</th>
                <th className="py-2">بانک</th>
                <th className="py-2">تاریخ</th>
                <th className="py-2">سررسید</th>
                <th className="py-2">طرف حساب</th>
                <th className="py-2">مبلغ</th>
                <th className="py-2">وضعیت</th>
                <th className="py-2">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nexa-border">
              {(mode === 'checks-received' ? checksReceived : checksPaid).map((x) => (
                <tr key={x.id}>
                  <td className="py-2 font-fa-num">{x.id}</td>
                  <td className="py-2">{x.bank}</td>
                  <td className="py-2 font-fa-num">{x.date}</td>
                  <td className="py-2 font-fa-num">{x.dueDate}</td>
                  <td className="py-2">{x.party}</td>
                  <td className="py-2 font-fa-num">{fm(x.amount)}</td>
                  <td className="py-2">{x.status}</td>
                  <td className="py-2">
                    <button type="button" className="text-xs text-nexa-accent">مشاهده</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mode === 'cash-report' && (
        <div className="grid md:grid-cols-2 gap-3">
          <div className="nexa-card p-4">
            <h3 className="text-sm font-black text-gray-900 mb-2">خلاصه جریان نقد</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between"><span>دریافت‌ها</span><span className="font-fa-num">{fm(210000000)}</span></li>
              <li className="flex justify-between"><span>پرداخت‌ها</span><span className="font-fa-num">{fm(146000000)}</span></li>
              <li className="flex justify-between font-black"><span>خالص</span><span className="font-fa-num">{fm(64000000)}</span></li>
            </ul>
          </div>
          <div className="nexa-card p-4">
            <h3 className="text-sm font-black text-gray-900 mb-2">بازه گزارش</h3>
            <p className="text-sm text-gray-600">از {rangeFrom} تا {rangeTo}</p>
            <p className="text-xs text-gray-500 mt-2">این تب برای انسجام UX اضافه شده تا نمای خلاصه‌ای از وضعیت نقد و بانک داشته باشید.</p>
          </div>
        </div>
      )}

      {activeDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-gray-900">جزئیات سند حسابداری</h4>
              <button type="button" onClick={() => setActiveDoc(null)} className="text-xs text-gray-500">
                بستن
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <p className="text-gray-500">شماره سند</p>
              <p className="font-bold">{activeDoc.accountingDocNo}</p>
              <p className="text-gray-500">تاریخ</p>
              <p className="font-fa-num">{activeDoc.date}</p>
              <p className="text-gray-500">شرح</p>
              <p>{activeDoc.title}</p>
              <p className="text-gray-500">مبلغ</p>
              <p className="font-fa-num">{fm(activeDoc.amount)}</p>
              <p className="text-gray-500">نوع</p>
              <p>{activeDoc.kind === 'in' ? 'دریافت' : 'پرداخت'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
