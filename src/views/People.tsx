'use client';

import React, { useMemo, useRef, useState } from 'react';
import { AlertTriangle, BookOpen, Building2, Download, Plus, Search, Trash2, User, UserCircle, Users2, Wallet } from 'lucide-react';
import { newId, useCatalog } from '@/src/context/CatalogContext';
import type {
  MoneyDocument,
  Person,
  PersonAddress,
  PersonCategory,
  PersonEmail,
  PersonGroup,
  PersonPhone,
  PersonRole,
  PersonTaxProfile,
} from '@/src/types/person';
import { isValidCardNumber, isValidIban, isValidIranNationalId, normalizePhone } from '@/src/lib/pricing';
import CategoryTreeManager from '@/src/components/CategoryTreeManager';
import Receipts from './Receipts';
import ReceiptList from './ReceiptList';
import Payments from './Payments';
import PaymentList from './PaymentList';
import Shareholders from './Shareholders';
import Vendors from './Vendors';

const ROLE_LABELS: Record<PersonRole, string> = {
  customer: 'مشتری',
  supplier: 'تامین کننده',
  shareholder: 'سهامدار',
  subordinate: 'زیرمجموعه',
};

const TAX_LABELS: Record<PersonTaxProfile, string> = {
  none: 'بدون مالیات',
  'vat-exempt': 'معاف از مالیات',
  'vat-included': 'مشمول مالیات و عوارض',
  'vat-zero': 'صفر',
  'final-consumer': 'مصرف کننده نهایی',
};

const LIST_TABS: { id: string; label: string; role?: PersonRole }[] = [
  { id: 'all', label: 'همه اشخاص' },
  { id: 'customer', label: 'مشتریان', role: 'customer' },
  { id: 'supplier', label: 'تامین کنندگان', role: 'supplier' },
  { id: 'shareholder', label: 'سهامداران', role: 'shareholder' },
  { id: 'subordinate', label: 'زیرمجموعه' },
];

const FORM_TABS = [
  { id: 'general', label: 'عمومی' },
  { id: 'address', label: 'اطلاعات آدرس' },
  { id: 'contact', label: 'تماس' },
  { id: 'bank', label: 'حساب بانکی' },
  { id: 'other', label: 'سایر' },
] as const;

function emptyPerson(accountingCode: string): Person {
  const primaryPhoneId = newId();
  const primaryEmailId = newId();
  return {
    id: '__new__',
    accountingCode,
    kind: 'natural',
    title: '',
    firstName: '',
    lastName: '',
    displayName: '',
    alias: '',
    nationalId: '',
    economicCode: '',
    registrationNo: '',
    branchCode: '',
    taxProfile: 'vat-included',
    roles: ['customer'],
    emails: [{ id: primaryEmailId, label: 'اصلی', address: '' }],
    primaryEmailId,
    defaultPriceListId: 'pl-retail',
    categoryIds: [],
    groupMemberships: [],
    phones: [{ id: primaryPhoneId, label: 'موبایل', number: '' }],
    primaryPhoneId,
    addresses: [],
    banks: [],
    importantDates: [],
    status: 'active',
    points: 0,
    ledger: {
      financial: [],
      marketing: [],
      activity: [],
      orders: [],
    },
  };
}

function cloneForDraft(p: Person): Person {
  const phones = p.phones.length ? p.phones.map((ph) => ({ ...ph })) : [{ id: newId(), label: 'موبایل', number: '' }];
  const emails =
    p.emails && p.emails.length > 0
      ? p.emails.map((e) => ({ ...e, id: e.id || newId(), label: e.label || 'ایمیل', address: e.address || '' }))
      : (() => {
          const id = newId();
          return [{ id, label: 'اصلی', address: '' }];
        })();
  const primaryEmailId =
    p.primaryEmailId && emails.some((e) => e.id === p.primaryEmailId)
      ? p.primaryEmailId
      : emails[0].id;
  const banksRaw = p.banks.map((b) => ({ ...b }));
  const banks =
    banksRaw.length === 0
      ? []
      : banksRaw.some((b) => b.isPrimary)
        ? (() => {
            const idx = banksRaw.findIndex((b) => b.isPrimary);
            return banksRaw.map((b, i) => ({ ...b, isPrimary: i === idx }));
          })()
        : banksRaw.map((b, i) => ({ ...b, isPrimary: i === 0 }));
  return {
    ...p,
    roles: [...p.roles],
    emails,
    primaryEmailId,
    categoryIds: [...p.categoryIds],
    groupMemberships: p.groupMemberships.map((m) => ({ ...m })),
    addresses: p.addresses.map((a) => ({ ...a })),
    phones,
    primaryPhoneId: p.primaryPhoneId || phones[0]?.id,
    banks,
    importantDates: p.importantDates.map((d) => ({ ...d })),
    ledger: {
      financial: p.ledger.financial.map((x) => ({ ...x })),
      marketing: p.ledger.marketing.map((x) => ({ ...x })),
      activity: p.ledger.activity.map((x) => ({ ...x })),
      orders: p.ledger.orders.map((x) => ({ ...x })),
    },
  };
}

export default function People() {
  const {
    people,
    receipts,
    payments,
    priceLists,
    personCategories,
    personGroups,
    upsertPersonGroup,
    removePersonGroup,
    replacePerson,
    addPerson,
    findDuplicate,
    listDuplicates,
    mergePeople,
    upsertPersonCategory,
    removePersonCategory,
    reorderPersonCategories,
    generateAccountingCode,
  } = useCatalog();

  const [peopleMode, setPeopleMode] = useState<'list' | 'receipts' | 'receipt-list' | 'payments' | 'payment-list' | 'shareholders' | 'vendors'>('list');
  const [viewMode, setViewMode] = useState<'list' | 'form' | 'card'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [listTab, setListTab] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [formTab, setFormTab] = useState<(typeof FORM_TABS)[number]['id']>('general');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Person>(() => emptyPerson(generateAccountingCode()));
  const [error, setError] = useState('');
  const [categoryDraft, setCategoryDraft] = useState({ id: '', name: '', parentId: '' });
  const [mergeState, setMergeState] = useState({ sourceId: '', targetId: '' });
  const [cardPersonId, setCardPersonId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isNew = !selectedId || draft.id === '__new__';

  const duplicates = useMemo(() => listDuplicates(), [listDuplicates]);

  const filteredPeople = useMemo(() => {
    const tab = LIST_TABS.find((t) => t.id === listTab);
    const q = searchQuery.trim();
    return people.filter((person) => {
      const roleOk = !tab?.role || person.roles.includes(tab.role);
      const catOk = !categoryFilter || person.categoryIds.includes(categoryFilter);
      const searchOk =
        !q ||
        person.displayName.includes(q) ||
        person.alias.includes(q) ||
        person.accountingCode.includes(q) ||
        person.phones.some((ph) => ph.number.includes(q)) ||
        person.emails.some((em) => em.address.includes(q)) ||
        (person.nationalId && person.nationalId.includes(q));
      return roleOk && catOk && searchOk;
    });
  }, [people, listTab, searchQuery, categoryFilter]);

  const nameSuggestions = useMemo(() => {
    const q = draft.displayName.trim();
    if (q.length < 1) return [];
    const set = new Set<string>();
    people.forEach((p) => {
      if (p.displayName.includes(q)) set.add(p.displayName);
      if (p.alias.includes(q)) set.add(p.alias);
    });
    return [...set].slice(0, 8);
  }, [draft.displayName, people]);

  const openNew = () => {
    setSelectedId(null);
    setDraft(emptyPerson(generateAccountingCode()));
    setError('');
    setFormTab('general');
    setViewMode('form');
  };

  const openPerson = (id: string) => {
    const person = people.find((x) => x.id === id);
    if (!person) return;
    setSelectedId(id);
    setDraft(cloneForDraft(person));
    setError('');
    setFormTab('general');
    setViewMode('form');
  };

  const openCard = (id: string) => {
    setCardPersonId(id);
    setViewMode('card');
  };

  const toggleRole = (role: PersonRole) => {
    const has = draft.roles.includes(role);
    const next = has ? draft.roles.filter((r) => r !== role) : [...draft.roles, role];
    if (next.length === 0) return;
    setDraft({ ...draft, roles: next });
  };

  const resetForm = () => {
    setViewMode('list');
    setSelectedId(null);
    setCardPersonId(null);
    setDraft(emptyPerson(generateAccountingCode()));
    setError('');
  };

  const saveDraft = () => {
    setError('');
    const computedDisplayName = draft.displayName.trim() || [draft.firstName, draft.lastName].filter(Boolean).join(' ').trim();
    if (!computedDisplayName) {
      setError('نام شخص اجباری است.');
      return;
    }
    const nid = (draft.nationalId || '').trim();
    const normalizedPhones = draft.phones
      .map((ph) => normalizePhone(ph.number))
      .filter((x) => x.length > 0);
    const hasInvalidPhone = draft.phones.some((ph) => ph.number.trim() && normalizePhone(ph.number).length < 10);
    if (hasInvalidPhone) {
      setError('شماره موبایل/تلفن معتبر نیست.');
      return;
    }
    if (nid && !/^[0-9۰-۹]+$/.test(nid)) {
      setError('کد ملی باید فقط عدد باشد.');
      return;
    }
    if (nid && !isValidIranNationalId(nid)) {
      setError('کد ملی معتبر نیست.');
      return;
    }
    if (normalizedPhones.length !== new Set(normalizedPhones).size) {
      setError('شماره تکراری در همین شخص ثبت شده است.');
      return;
    }
    for (const bank of draft.banks) {
      if (bank.iban && !isValidIban(bank.iban)) {
        setError(`شماره شبا برای حساب "${bank.bankName || bank.accountTitle || 'بدون نام'}" معتبر نیست.`);
        return;
      }
      if (bank.cardNumber && !isValidCardNumber(bank.cardNumber)) {
        setError(`شماره کارت برای حساب "${bank.bankName || bank.accountTitle || 'بدون نام'}" معتبر نیست.`);
        return;
      }
    }
    const dupByPhone = draft.phones
      .map((ph) => findDuplicate(ph.number, undefined, isNew ? undefined : draft.id))
      .find(Boolean);
    const dupByNational = findDuplicate('', nid, isNew ? undefined : draft.id);
    const dup = dupByPhone || dupByNational;
    if (dup) {
      setError(`رکورد تکراری بر اساس ${dup.field === 'phone' ? 'شماره' : 'کد ملی'} یافت شد.`);
      return;
    }
    const groupMemberships = draft.groupMemberships.filter((m) => m.groupId && m.levelId);
    let emails = draft.emails.map((e) => ({ ...e }));
    if (!emails.length) {
      const id = newId();
      emails = [{ id, label: 'اصلی', address: '' }];
    }
    const primaryEmailId =
      draft.primaryEmailId && emails.some((e) => e.id === draft.primaryEmailId)
        ? draft.primaryEmailId
        : emails[0].id;
    let banks = draft.banks.map((b) => ({ ...b }));
    if (banks.length > 0) {
      if (!banks.some((b) => b.isPrimary)) {
        banks = banks.map((b, i) => ({ ...b, isPrimary: i === 0 }));
      } else {
        const idx = banks.findIndex((b) => b.isPrimary);
        banks = banks.map((b, i) => ({ ...b, isPrimary: i === idx }));
      }
    }
    const payload: Person = {
      ...draft,
      displayName: computedDisplayName,
      groupMemberships,
      emails,
      primaryEmailId,
      banks,
    };
    if (isNew) {
      addPerson({ ...payload, id: newId(), accountingCode: generateAccountingCode() });
    } else {
      replacePerson(payload);
    }
    resetForm();
  };

  const exportCsv = () => {
    const rows = filteredPeople.map((person) => [
      person.accountingCode,
      person.displayName,
      person.alias,
      person.nationalId || '',
      person.phones[0]?.number || '',
      person.roles.map((r) => ROLE_LABELS[r]).join(' | '),
    ]);
    const header = ['کد حسابداری', 'نام', 'نام مستعار', 'کد ملی', 'موبایل', 'نقش'];
    const csv = [header, ...rows]
      .map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'people-export.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const parseCsvLine = (line: string) => {
    const cols: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i += 1;
        continue;
      }
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === ',' && !inQuotes) {
        cols.push(cur);
        cur = '';
        continue;
      }
      cur += ch;
    }
    cols.push(cur);
    return cols.map((x) => x.trim());
  };

  const importCsv = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    const raw = await file.text();
    const lines = raw.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return;
    let imported = 0;
    for (const line of lines.slice(1)) {
      const [accountingCode, displayName, alias, nationalId, mobile] = parseCsvLine(line);
      if (!accountingCode || !displayName) continue;
      const duplicate = people.find((x) => x.accountingCode === accountingCode);
      if (duplicate) continue;
      addPerson({
        ...emptyPerson(accountingCode),
        id: newId(),
        accountingCode,
        displayName,
        alias: alias || displayName,
        nationalId: nationalId || '',
        phones: [{ id: newId(), label: 'موبایل', number: mobile || '' }],
      });
      imported += 1;
    }
    setError(imported > 0 ? `${imported} رکورد از CSV وارد شد.` : 'ورودی معتبری برای واردسازی پیدا نشد.');
    ev.target.value = '';
  };

  const submitCategory = () => {
    if (!categoryDraft.name.trim()) return;
    upsertPersonCategory({
      id: categoryDraft.id || undefined,
      name: categoryDraft.name,
      parentId: categoryDraft.parentId || undefined,
    });
    setCategoryDraft({ id: '', name: '', parentId: '' });
  };

  const categoryName = (id: string) => personCategories.find((x) => x.id === id)?.name || '—';

  const PEOPLE_SUB_NAV = [
    { mode: 'list' as const, label: 'اشخاص', icon: <User size={14} /> },
    { mode: 'receipts' as const, label: 'دریافت', icon: <Wallet size={14} /> },
    { mode: 'receipt-list' as const, label: 'لیست دریافت‌ها', icon: <BookOpen size={14} /> },
    { mode: 'payments' as const, label: 'پرداخت', icon: <Wallet size={14} /> },
    { mode: 'payment-list' as const, label: 'لیست پرداخت‌ها', icon: <BookOpen size={14} /> },
    { mode: 'shareholders' as const, label: 'سهامداران', icon: <Users2 size={14} /> },
    { mode: 'vendors' as const, label: 'فروشندگان', icon: <UserCircle size={14} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">اشخاص</h1>
          <p className="text-sm text-gray-500 mt-1">مدیریت مشتریان، تامین‌کنندگان، سهامداران، دریافت و پرداخت</p>
        </div>
        {peopleMode === 'list' && viewMode === 'list' && (
          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" accept=".csv" onChange={importCsv} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white border border-nexa-border rounded-xl px-3 py-2 text-xs font-bold"
            >
              ورود CSV
            </button>
            <button type="button" onClick={exportCsv} className="bg-white border border-nexa-border rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-2">
              <Download size={14} />
              خروجی CSV
            </button>
            <button type="button" onClick={openNew} className="nexa-btn-primary flex items-center justify-center gap-2 py-3 md:py-2">
              <Plus size={18} />
              افزودن شخص جدید
            </button>
          </div>
        )}
      </div>

      {/* Sub-navigation — hidden when editing or viewing person card */}
      {viewMode !== 'form' && viewMode !== 'card' && (
        <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl overflow-x-auto no-scrollbar">
          {PEOPLE_SUB_NAV.map((item) => (
            <button
              key={item.mode}
              onClick={() => setPeopleMode(item.mode)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                peopleMode === item.mode
                  ? 'bg-white text-nexa-accent shadow-sm'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Sub-component routing */}
      {peopleMode === 'receipts' ? (
        <Receipts />
      ) : peopleMode === 'receipt-list' ? (
        <ReceiptList />
      ) : peopleMode === 'payments' ? (
        <Payments />
      ) : peopleMode === 'payment-list' ? (
        <PaymentList />
      ) : peopleMode === 'shareholders' ? (
        <Shareholders />
      ) : peopleMode === 'vendors' ? (
        <Vendors />
      ) : (

      <div className="min-h-[620px]">
        {viewMode === 'list' ? (
          <div className="nexa-card overflow-hidden min-h-[620px]">
            <div className="p-4 border-b border-nexa-border space-y-3">
              {duplicates.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center gap-2">
                  <AlertTriangle size={14} />
                  {duplicates.length} رکورد مشکوک به تکراری شناسایی شد.
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {LIST_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setListTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${listTab === tab.id ? 'bg-nexa-accent text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="grid md:grid-cols-3 gap-2">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجو نام/موبایل/کد حسابداری"
                    className="w-full bg-gray-50 rounded-xl pr-9 pl-3 py-2 text-sm"
                  />
                </div>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bg-gray-50 rounded-xl px-3 py-2 text-sm">
                  <option value="">همه دسته بندی ها</option>
                  {personCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.parentId ? `${categoryName(cat.parentId)} / ${cat.name}` : cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overflow-auto max-h-[520px]">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-xs text-gray-500 bg-gray-50/60 border-b border-nexa-border">
                    <th className="px-3 py-2">کد حسابداری</th>
                    <th className="px-3 py-2">نام</th>
                    <th className="px-3 py-2">دسته بندی</th>
                    <th className="px-3 py-2">موبایل</th>
                    <th className="px-3 py-2">نوع مالیات</th>
                    <th className="px-3 py-2">نقش</th>
                    <th className="px-3 py-2">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexa-border">
                  {filteredPeople.map((person) => (
                    <tr key={person.id} onClick={() => openPerson(person.id)} className="text-sm hover:bg-gray-50 cursor-pointer">
                      <td className="px-3 py-2 font-fa-num">{person.accountingCode}</td>
                      <td className="px-3 py-2 text-blue-700 font-bold">{person.displayName}</td>
                      <td className="px-3 py-2">{person.categoryIds.map(categoryName).join('، ') || '—'}</td>
                      <td className="px-3 py-2 font-fa-num">{person.phones[0]?.number || '—'}</td>
                      <td className="px-3 py-2">{TAX_LABELS[person.taxProfile]}</td>
                      <td className="px-3 py-2">{person.roles.map((r) => ROLE_LABELS[r]).join('، ')}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openPerson(person.id);
                            }}
                            className="bg-white border border-nexa-border rounded-lg px-2 py-1 text-[11px]"
                          >
                            ویرایش
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openCard(person.id);
                            }}
                            className="bg-gray-900 text-white rounded-lg px-2 py-1 text-[11px]"
                          >
                            کارت حساب
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-nexa-border space-y-3">
              <PersonGroupsPanel
                personGroups={personGroups}
                people={people}
                upsertPersonGroup={upsertPersonGroup}
                removePersonGroup={removePersonGroup}
              />
              <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                <p className="text-xs font-black text-gray-700 flex items-center gap-2"><Users2 size={14} /> ادغام اشخاص</p>
                <div className="grid grid-cols-2 gap-2">
                  <select value={mergeState.sourceId} onChange={(e) => setMergeState((x) => ({ ...x, sourceId: e.target.value }))} className="bg-white rounded-lg px-2 py-2 text-xs">
                    <option value="">شخص مبدا</option>
                    {people.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
                  </select>
                  <select value={mergeState.targetId} onChange={(e) => setMergeState((x) => ({ ...x, targetId: e.target.value }))} className="bg-white rounded-lg px-2 py-2 text-xs">
                    <option value="">شخص مقصد</option>
                    {people.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    mergePeople(mergeState.sourceId, mergeState.targetId);
                    setMergeState({ sourceId: '', targetId: '' });
                  }}
                  className="bg-gray-900 text-white rounded-lg px-3 py-2 text-xs font-bold"
                >
                  ادغام رکوردها
                </button>
              </div>

              <CategoryManager
                categories={personCategories}
                usedCategoryIds={new Set(people.flatMap((p) => p.categoryIds))}
                draft={categoryDraft}
                setDraft={setCategoryDraft}
                onSave={submitCategory}
                onDelete={removePersonCategory}
                onReorder={reorderPersonCategories}
                onMove={(id, parentId) => {
                  const row = personCategories.find((x) => x.id === id);
                  if (!row) return;
                  upsertPersonCategory({
                    id: row.id,
                    name: row.name,
                    parentId,
                  });
                }}
              />
              </div>
            </div>
          </div>
        ) : viewMode === 'card' ? (
          <PersonLedgerCard
            person={people.find((x) => x.id === cardPersonId) || null}
            receipts={receipts}
            payments={payments}
            onBack={resetForm}
          />
        ) : (
          <div className="nexa-card overflow-hidden min-h-[620px] flex flex-col">
            <div className="p-4 border-b border-nexa-border flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
                <User size={28} />
              </div>
              <div>
                <p className="font-black text-gray-900">{isNew ? 'شخص جدید' : 'ویرایش شخص'}</p>
                <p className="text-xs text-gray-500">کد حسابداری: <span className="font-fa-num">{draft.accountingCode}</span></p>
              </div>
              <div className="mr-auto">
                <button type="button" onClick={resetForm} className="bg-gray-100 text-gray-700 rounded-xl px-4 py-2 text-xs font-bold">
                  بازگشت به لیست
                </button>
              </div>
            </div>
            <div className="flex gap-1 p-2 bg-gray-50 border-b border-nexa-border overflow-x-auto no-scrollbar">
              {FORM_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFormTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${formTab === tab.id ? 'bg-white text-nexa-accent shadow-sm' : 'text-gray-400'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="p-5 space-y-5 flex-1 overflow-y-auto">
              {error && <p className="text-xs text-rose-600 font-bold">{error}</p>}
              {formTab === 'general' && (
                <GeneralTab
                  draft={draft}
                  setDraft={setDraft}
                  nameSuggestions={nameSuggestions}
                  priceLists={priceLists}
                  personGroups={personGroups}
                  toggleRole={toggleRole}
                />
              )}
              {formTab === 'address' && <AddressTab draft={draft} setDraft={setDraft} />}
              {formTab === 'contact' && <ContactTab draft={draft} setDraft={setDraft} />}
              {formTab === 'bank' && <BankTab draft={draft} setDraft={setDraft} />}
              {formTab === 'other' && <OtherTab draft={draft} setDraft={setDraft} personCategories={personCategories} />}
            </div>
            <div className="p-5 border-t border-nexa-border bg-gray-50 flex gap-3">
              <button type="button" onClick={saveDraft} className="nexa-btn-primary px-5 py-2 text-sm">ثبت اطلاعات</button>
              <button type="button" onClick={resetForm} className="bg-white border border-nexa-border rounded-xl px-5 py-2 text-sm">انصراف</button>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}

function PersonGroupsPanel({
  personGroups,
  people,
  upsertPersonGroup,
  removePersonGroup,
}: {
  personGroups: PersonGroup[];
  people: Person[];
  upsertPersonGroup: (payload: { id?: string; name: string; levels: PersonGroup['levels'] }) => void;
  removePersonGroup: (id: string) => void;
}) {
  const membershipCount = (gid: string) =>
    people.reduce((n, p) => n + p.groupMemberships.filter((m) => m.groupId === gid).length, 0);

  return (
    <div className="bg-gray-50 rounded-xl p-3 space-y-3 border border-nexa-border">
      <p className="text-xs font-black text-gray-700">مدیریت گروه‌های سازمانی</p>
      <div className="space-y-2">
        {personGroups.map((g) => (
          <div key={g.id} className="bg-white border border-nexa-border rounded-lg p-3 space-y-2">
            <div className="flex flex-wrap gap-2 items-center">
              <input
                value={g.name}
                onChange={(e) => upsertPersonGroup({ id: g.id, name: e.target.value, levels: g.levels })}
                className="flex-1 min-w-[120px] bg-gray-50 rounded-lg px-2 py-2 text-xs font-bold"
                placeholder="نام گروه"
              />
              <button
                type="button"
                onClick={() => {
                  const n = membershipCount(g.id);
                  if (n > 0 && !window.confirm(`این گروه در ${n} عضویت استفاده شده است. حذف شود؟`)) return;
                  removePersonGroup(g.id);
                }}
                className="text-xs text-rose-600 font-bold px-2 shrink-0"
              >
                حذف گروه
              </button>
            </div>
            <p className="text-[10px] text-gray-400">سطح‌ها</p>
            <div className="space-y-1">
              {g.levels.map((lvl) => (
                <div key={lvl.id} className="flex gap-2 items-center">
                  <input
                    value={lvl.label}
                    onChange={(e) =>
                      upsertPersonGroup({
                        id: g.id,
                        name: g.name,
                        levels: g.levels.map((l) => (l.id === lvl.id ? { ...l, label: e.target.value } : l)),
                      })
                    }
                    className="flex-1 bg-gray-50 rounded-lg px-2 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    disabled={g.levels.length <= 1}
                    onClick={() =>
                      upsertPersonGroup({
                        id: g.id,
                        name: g.name,
                        levels: g.levels.filter((l) => l.id !== lvl.id),
                      })
                    }
                    className="text-rose-500 disabled:opacity-30 p-1 shrink-0"
                    aria-label="حذف سطح"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                upsertPersonGroup({
                  id: g.id,
                  name: g.name,
                  levels: [...g.levels, { id: newId(), label: `سطح ${g.levels.length + 1}` }],
                })
              }
              className="text-[11px] font-bold text-nexa-accent"
            >
              + افزودن سطح
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          upsertPersonGroup({
            name: 'گروه جدید',
            levels: [{ id: newId(), label: 'سطح ۱' }],
          })
        }
        className="w-full bg-white border border-dashed border-nexa-border rounded-lg py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
      >
        + گروه جدید
      </button>
    </div>
  );
}

function GeneralTab({
  draft,
  setDraft,
  nameSuggestions,
  priceLists,
  personGroups,
  toggleRole,
}: {
  draft: Person;
  setDraft: (p: Person) => void;
  nameSuggestions: string[];
  priceLists: { id: string; name: string }[];
  personGroups: PersonGroup[];
  toggleRole: (r: PersonRole) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-4 gap-2">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500">کد حسابداری</label>
          <input value={draft.accountingCode} disabled className="w-full bg-gray-100 rounded-2xl py-3 px-4 text-sm font-fa-num" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500">کد اقتصادی</label>
          <input value={draft.economicCode || ''} onChange={(e) => setDraft({ ...draft, economicCode: e.target.value })} className="w-full bg-gray-50 rounded-2xl py-3 px-4 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500">شماره ثبت</label>
          <input value={draft.registrationNo || ''} onChange={(e) => setDraft({ ...draft, registrationNo: e.target.value })} className="w-full bg-gray-50 rounded-2xl py-3 px-4 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500">کد شعبه</label>
          <input value={draft.branchCode || ''} onChange={(e) => setDraft({ ...draft, branchCode: e.target.value })} className="w-full bg-gray-50 rounded-2xl py-3 px-4 text-sm" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <label className="text-xs font-bold text-gray-500 col-span-2">نوع شخصیت</label>
        <button
          type="button"
          onClick={() => setDraft({ ...draft, kind: 'natural' })}
          className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold border ${
            draft.kind === 'natural'
              ? 'border-nexa-accent bg-nexa-accent/5 text-nexa-accent'
              : 'border-nexa-border text-gray-500'
          }`}
        >
          <User size={16} />
          حقیقی
        </button>
        <button
          type="button"
          onClick={() => setDraft({ ...draft, kind: 'legal' })}
          className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold border ${
            draft.kind === 'legal'
              ? 'border-nexa-accent bg-nexa-accent/5 text-nexa-accent'
              : 'border-nexa-border text-gray-500'
          }`}
        >
          <Building2 size={16} />
          حقوقی
        </button>
      </div>

      <div className="space-y-2 relative">
        <label className="text-xs font-bold text-gray-500">نام نمایشی / شرکت</label>
        <input
          type="text"
          value={draft.displayName}
          onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
          className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm"
        />
        {draft.displayName.trim().length >= 1 && nameSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-nexa-border rounded-2xl shadow-lg p-2 space-y-1">
            <p className="text-[10px] font-bold text-gray-400 px-2">پیشنهاد از داده‌های قبلی</p>
            {nameSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setDraft({ ...draft, displayName: s })}
                className="w-full text-right px-3 py-2 rounded-xl text-xs hover:bg-gray-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-4 gap-2">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500">عنوان</label>
          <input
            value={draft.title || ''}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            className="w-full bg-gray-50 rounded-2xl py-3 px-4 text-sm"
            placeholder="مثال: آقای / خانم"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500">نام</label>
          <input
            value={draft.firstName || ''}
            onChange={(e) => setDraft({ ...draft, firstName: e.target.value })}
            className="w-full bg-gray-50 rounded-2xl py-3 px-4 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500">نام خانوادگی</label>
          <input
            value={draft.lastName || ''}
            onChange={(e) => setDraft({ ...draft, lastName: e.target.value })}
            className="w-full bg-gray-50 rounded-2xl py-3 px-4 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500">شرکت</label>
          <input
            value={draft.companyName || ''}
            onChange={(e) => setDraft({ ...draft, companyName: e.target.value })}
            className="w-full bg-gray-50 rounded-2xl py-3 px-4 text-sm"
          />
        </div>
      </div>

      {draft.kind === 'legal' && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500">نام تجاری / برند</label>
          <input
            type="text"
            value={draft.legalName || ''}
            onChange={(e) => setDraft({ ...draft, legalName: e.target.value })}
            className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm"
          />
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500">نام مستعار / خطاب</label>
        <input
          type="text"
          value={draft.alias}
          onChange={(e) => setDraft({ ...draft, alias: e.target.value })}
          className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm"
          placeholder="مثلاً جناب آقای …"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500">کد ملی / شناسه ملی</label>
        <input
          type="text"
          value={draft.nationalId || ''}
          onChange={(e) => setDraft({ ...draft, nationalId: e.target.value })}
          className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm font-fa-num"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500">نام معرف</label>
          <input
            value={draft.referrerName || ''}
            onChange={(e) => setDraft({ ...draft, referrerName: e.target.value })}
            className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm"
            placeholder="مثال: احمد رضایی"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500">نام کامل</label>
          <input
            value={[draft.title, draft.firstName, draft.lastName].filter(Boolean).join(' ')}
            readOnly
            className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm"
            placeholder="ترکیب عنوان + نام + نام خانوادگی"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500">نام دیزاینر</label>
          <input
            value={draft.designerName || ''}
            onChange={(e) => setDraft({ ...draft, designerName: e.target.value })}
            className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm"
            placeholder="مثال: مهندس ..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500">عضویت در گروه‌ها</label>
        {draft.groupMemberships.map((m, idx) => {
          const grp = personGroups.find((g) => g.id === m.groupId);
          const levels = grp?.levels || [];
          return (
            <div key={idx} className="flex flex-col md:flex-row gap-2 md:items-end">
              <select
                value={m.groupId}
                onChange={(e) => {
                  const gid = e.target.value;
                  const g = personGroups.find((x) => x.id === gid);
                  const levelId = g?.levels.some((l) => l.id === m.levelId) ? m.levelId : g?.levels[0]?.id || '';
                  const next = draft.groupMemberships.map((row, i) =>
                    i === idx ? { groupId: gid, levelId } : row
                  );
                  setDraft({ ...draft, groupMemberships: next });
                }}
                className="flex-1 bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm"
              >
                <option value="">انتخاب گروه</option>
                {personGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <select
                value={m.levelId}
                disabled={!m.groupId}
                onChange={(e) => {
                  const next = draft.groupMemberships.map((row, i) =>
                    i === idx ? { ...row, levelId: e.target.value } : row
                  );
                  setDraft({ ...draft, groupMemberships: next });
                }}
                className="flex-1 bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm disabled:opacity-50"
              >
                <option value="">انتخاب سطح</option>
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  setDraft({
                    ...draft,
                    groupMemberships: draft.groupMemberships.filter((_, i) => i !== idx),
                  })
                }
                className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold shrink-0"
              >
                حذف
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() =>
            setDraft({
              ...draft,
              groupMemberships: [...draft.groupMemberships, { groupId: '', levelId: '' }],
            })
          }
          className="text-xs font-bold text-nexa-accent"
        >
          + افزودن عضویت
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500">لیست قیمت پیش‌فرض</label>
        <select
          value={draft.defaultPriceListId || ''}
          onChange={(e) => setDraft({ ...draft, defaultPriceListId: e.target.value || undefined })}
          className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm"
        >
          {priceLists.map((pl) => (
            <option key={pl.id} value={pl.id}>
              {pl.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500">نوع مالیات</label>
        <select
          value={draft.taxProfile}
          onChange={(e) => setDraft({ ...draft, taxProfile: e.target.value as PersonTaxProfile })}
          className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm"
        >
          {Object.entries(TAX_LABELS).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500">اعتبار مالی</label>
        <input
          type="number"
          value={draft.points}
          onChange={(e) => setDraft({ ...draft, points: Number(e.target.value) || 0 })}
          className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm font-fa-num"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500">نقش‌ها (چندگانه)</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ROLE_LABELS) as PersonRole[]).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => toggleRole(role)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                draft.roles.includes(role)
                  ? 'border-nexa-accent bg-nexa-accent text-white'
                  : 'border-nexa-border text-gray-500 hover:bg-gray-50'
              }`}
            >
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PersonLedgerCard({
  person,
  receipts,
  payments,
  onBack,
}: {
  person: Person | null;
  receipts: MoneyDocument[];
  payments: MoneyDocument[];
  onBack: () => void;
}) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [tab, setTab] = useState<'financial' | 'activity'>('financial');

  const rows = useMemo(() => {
    if (!person) return [] as Array<{ type: 'receipt' | 'payment'; date: string; number: string; project?: string; amount: number; note?: string }>;
    const passDate = (date: string) => (!fromDate || date >= fromDate) && (!toDate || date <= toDate);
    const passProject = (project?: string) => !projectFilter || (project || '').includes(projectFilter);
    const rec = receipts.flatMap((doc) =>
      doc.lines
        .filter((line) => line.personId === person.id && passDate(doc.date) && passProject(doc.project))
        .map((line) => ({
          type: 'receipt' as const,
          date: doc.date,
          number: doc.number,
          project: doc.project,
          amount: line.amount,
          note: line.note || doc.description,
        }))
    );
    const pay = payments.flatMap((doc) =>
      doc.lines
        .filter((line) => line.personId === person.id && passDate(doc.date) && passProject(doc.project))
        .map((line) => ({
          type: 'payment' as const,
          date: doc.date,
          number: doc.number,
          project: doc.project,
          amount: line.amount,
          note: line.note || doc.description,
        }))
    );
    return [...rec, ...pay].sort((a, b) => b.date.localeCompare(a.date));
  }, [person, receipts, payments, fromDate, toDate, projectFilter]);

  const totals = useMemo(() => {
    const receiptTotal = rows.filter((x) => x.type === 'receipt').reduce((acc, x) => acc + x.amount, 0);
    const paymentTotal = rows.filter((x) => x.type === 'payment').reduce((acc, x) => acc + x.amount, 0);
    return { receiptTotal, paymentTotal, balance: receiptTotal - paymentTotal };
  }, [rows]);

  if (!person) {
    return (
      <div className="nexa-card min-h-[620px] flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-500">شخص انتخاب نشده است.</p>
          <button type="button" onClick={onBack} className="bg-gray-900 text-white rounded-xl px-4 py-2 text-xs">بازگشت</button>
        </div>
      </div>
    );
  }

  return (
    <div className="nexa-card overflow-hidden min-h-[620px] flex flex-col">
      <div className="p-4 border-b border-nexa-border flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
          <User size={24} />
        </div>
        <div>
          <p className="font-black text-gray-900">{person.displayName}</p>
          <p className="text-xs text-gray-500">کد حسابداری: <span className="font-fa-num">{person.accountingCode}</span></p>
        </div>
        <div className="mr-auto flex gap-2">
          <button type="button" onClick={() => setTab('financial')} className={`px-3 py-2 rounded-xl text-xs ${tab === 'financial' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>مالی</button>
          <button type="button" onClick={() => setTab('activity')} className={`px-3 py-2 rounded-xl text-xs ${tab === 'activity' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>فعالیت</button>
          <button type="button" onClick={onBack} className="bg-gray-100 text-gray-700 rounded-xl px-4 py-2 text-xs font-bold">بازگشت</button>
        </div>
      </div>

      <div className="p-4 grid md:grid-cols-3 gap-3 border-b border-nexa-border bg-gray-50">
        <div className="bg-white rounded-xl p-3">
          <p className="text-xs text-gray-500">جمع دریافت</p>
          <p className="font-fa-num text-emerald-700 font-black">{totals.receiptTotal.toLocaleString('fa-IR')} ریال</p>
        </div>
        <div className="bg-white rounded-xl p-3">
          <p className="text-xs text-gray-500">جمع پرداخت</p>
          <p className="font-fa-num text-rose-700 font-black">{totals.paymentTotal.toLocaleString('fa-IR')} ریال</p>
        </div>
        <div className="bg-white rounded-xl p-3">
          <p className="text-xs text-gray-500">مانده</p>
          <p className={`font-fa-num font-black ${totals.balance >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>{totals.balance.toLocaleString('fa-IR')} ریال</p>
        </div>
      </div>

      {tab === 'financial' ? (
        <>
          <div className="p-4 grid md:grid-cols-3 gap-2 border-b border-nexa-border">
            <input value={fromDate} onChange={(e) => setFromDate(e.target.value)} placeholder="از تاریخ (مثال 1405/01/01)" className="bg-gray-50 rounded-xl px-3 py-2 text-xs font-fa-num" />
            <input value={toDate} onChange={(e) => setToDate(e.target.value)} placeholder="تا تاریخ" className="bg-gray-50 rounded-xl px-3 py-2 text-xs font-fa-num" />
            <input value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} placeholder="فیلتر پروژه" className="bg-gray-50 rounded-xl px-3 py-2 text-xs" />
          </div>
          <div className="overflow-auto flex-1">
            <table className="w-full text-right">
              <thead>
                <tr className="text-xs text-gray-500 bg-gray-50/60 border-b border-nexa-border">
                  <th className="px-3 py-2">نوع</th>
                  <th className="px-3 py-2">شماره سند</th>
                  <th className="px-3 py-2">تاریخ</th>
                  <th className="px-3 py-2">پروژه</th>
                  <th className="px-3 py-2">شرح</th>
                  <th className="px-3 py-2">مبلغ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nexa-border">
                {rows.map((row, idx) => (
                  <tr key={`${row.number}-${idx}`} className="text-sm">
                    <td className="px-3 py-2">{row.type === 'receipt' ? 'دریافت' : 'پرداخت'}</td>
                    <td className="px-3 py-2 font-fa-num">{row.number}</td>
                    <td className="px-3 py-2 font-fa-num">{row.date}</td>
                    <td className="px-3 py-2">{row.project || '—'}</td>
                    <td className="px-3 py-2">{row.note || '—'}</td>
                    <td className={`px-3 py-2 font-fa-num font-bold ${row.type === 'receipt' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {row.amount.toLocaleString('fa-IR')} ریال
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="p-4 space-y-3">
          <p className="text-sm font-black text-gray-800">تاریخچه فعالیت</p>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-bold text-gray-700 mb-2">رویدادهای مالی</p>
              <ul className="space-y-1 text-xs text-gray-600">
                {person.ledger.financial.map((item) => (
                  <li key={item.id}>• {item.at} - {item.title}</li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-bold text-gray-700 mb-2">رویدادهای عملیاتی</p>
              <ul className="space-y-1 text-xs text-gray-600">
                {[...person.ledger.activity, ...person.ledger.orders].map((item) => (
                  <li key={item.id}>• {item.at} - {item.title}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryManager({
  categories,
  usedCategoryIds,
  draft,
  setDraft,
  onSave,
  onDelete,
  onReorder,
  onMove,
}: {
  categories: PersonCategory[];
  usedCategoryIds: Set<string>;
  draft: { id: string; name: string; parentId: string };
  setDraft: (x: { id: string; name: string; parentId: string }) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  onMove: (id: string, parentId?: string) => void;
}) {
  return (
    <CategoryTreeManager
      title="مدیریت دسته بندی"
      categories={categories}
      usedCategoryIds={usedCategoryIds}
      draft={draft}
      setDraft={setDraft}
      onSave={onSave}
      onDelete={onDelete}
      onMove={onMove}
      onReorder={onReorder}
    />
  );
}

function AddressTab({
  draft,
  setDraft,
}: {
  draft: Person;
  setDraft: (p: Person) => void;
}) {
  const setPrimaryAddress = (id: string) => {
    setDraft({
      ...draft,
      addresses: draft.addresses.map((a) => ({
        ...a,
        isPrimary: a.id === id,
      })),
    });
  };

  const addAddress = () => {
    const id = newId();
    const isFirst = draft.addresses.length === 0;
    setDraft({
      ...draft,
      addresses: [
        ...draft.addresses.map((a) => ({ ...a, isPrimary: isFirst ? false : a.isPrimary })),
        {
          id,
          label: 'آدرس',
          text: '',
          isPrimary: isFirst,
        },
      ],
    });
  };

  const patchAddress = (id: string, patch: Partial<PersonAddress>) => {
    setDraft({
      ...draft,
      addresses: draft.addresses.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    });
  };

  const fillMyLocation = (addressId: string) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      window.alert('مرورگر از موقعیت‌یابی پشتیبانی نمی‌کند.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        patchAddress(addressId, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => window.alert('دسترسی به موقعیت رد شد یا خطا رخ داد.')
    );
  };

  const mapHref = (lat?: number, lng?: number) =>
    lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng)
      ? `https://www.google.com/maps?q=${lat},${lng}`
      : null;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" onClick={addAddress} className="text-xs font-bold text-nexa-accent">
          + افزودن آدرس
        </button>
      </div>
      {draft.addresses.map((a) => {
        const href = mapHref(a.lat, a.lng);
        return (
          <div key={a.id} className="p-4 border border-nexa-border rounded-2xl space-y-2">
            <div className="flex gap-2">
              <input
                value={a.label || ''}
                onChange={(e) => patchAddress(a.id, { label: e.target.value })}
                placeholder="عنوان"
                className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-xs"
              />
              <label className="text-xs flex items-center gap-2 shrink-0">
                <input
                  type="radio"
                  checked={a.isPrimary}
                  onChange={() => setPrimaryAddress(a.id)}
                  name="primary-address"
                />
                اصلی
              </label>
            </div>
            <textarea
              value={a.text}
              onChange={(e) => patchAddress(a.id, { text: e.target.value })}
              className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm min-h-16"
              placeholder="آدرس"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 items-end">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500">عرض جغرافیایی</label>
                <input
                  type="number"
                  step="any"
                  value={a.lat ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    patchAddress(a.id, { lat: v === '' ? undefined : Number(v) });
                  }}
                  className="w-full bg-gray-50 rounded-xl px-3 py-2 text-xs font-fa-num"
                  placeholder="lat"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500">طول جغرافیایی</label>
                <input
                  type="number"
                  step="any"
                  value={a.lng ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    patchAddress(a.id, { lng: v === '' ? undefined : Number(v) });
                  }}
                  className="w-full bg-gray-50 rounded-xl px-3 py-2 text-xs font-fa-num"
                  placeholder="lng"
                />
              </div>
              <button
                type="button"
                onClick={() => fillMyLocation(a.id)}
                className="text-[11px] font-bold text-nexa-accent bg-white border border-nexa-border rounded-xl py-2 px-2"
              >
                موقعیت من
              </button>
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-blue-600 text-center py-2"
                >
                  باز کردن در نقشه
                </a>
              ) : (
                <span className="text-[10px] text-gray-400 self-center">مختصات را وارد کنید</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ContactTab({
  draft,
  setDraft,
}: {
  draft: Person;
  setDraft: (p: Person) => void;
}) {
  const patchPhone = (id: string, patch: Partial<PersonPhone>) => {
    setDraft({
      ...draft,
      phones: draft.phones.map((ph) => (ph.id === id ? { ...ph, ...patch } : ph)),
    });
  };

  const patchEmail = (id: string, patch: Partial<PersonEmail>) => {
    setDraft({
      ...draft,
      emails: draft.emails.map((em) => (em.id === id ? { ...em, ...patch } : em)),
    });
  };

  const addPhone = () => {
    const id = newId();
    setDraft({
      ...draft,
      phones: [...draft.phones, { id, label: 'تلفن', number: '' }],
      primaryPhoneId: draft.primaryPhoneId || id,
    });
  };

  const addEmail = () => {
    const id = newId();
    setDraft({
      ...draft,
      emails: [...draft.emails, { id, label: 'ایمیل', address: '' }],
      primaryEmailId: draft.primaryEmailId || id,
    });
  };

  const removeEmail = (id: string) => {
    const next = draft.emails.filter((e) => e.id !== id);
    if (!next.length) {
      const nid = newId();
      setDraft({
        ...draft,
        emails: [{ id: nid, label: 'اصلی', address: '' }],
        primaryEmailId: nid,
      });
      return;
    }
    const primaryEmailId =
      draft.primaryEmailId === id
        ? next[0].id
        : draft.primaryEmailId && next.some((e) => e.id === draft.primaryEmailId)
          ? draft.primaryEmailId
          : next[0].id;
    setDraft({ ...draft, emails: next, primaryEmailId });
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-black text-gray-800">ایمیل</h3>
          <button type="button" onClick={addEmail} className="text-xs font-bold text-nexa-accent">
            + ایمیل
          </button>
        </div>
        <div className="space-y-2">
          {draft.emails.map((em) => (
            <div key={em.id} className="flex flex-col md:flex-row gap-2">
              <input
                className="md:w-28 bg-gray-50 rounded-xl py-2 px-3 text-xs"
                value={em.label}
                onChange={(e) => patchEmail(em.id, { label: e.target.value })}
                placeholder="عنوان"
              />
              <input
                type="email"
                className="flex-1 bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm"
                value={em.address}
                onChange={(e) => patchEmail(em.id, { address: e.target.value })}
                placeholder="email@example.com"
              />
              <label className="text-[11px] flex items-center gap-1 px-2 shrink-0">
                <input
                  type="radio"
                  name="primary-email"
                  checked={draft.primaryEmailId === em.id}
                  onChange={() => setDraft({ ...draft, primaryEmailId: em.id })}
                />
                اصلی
              </label>
              {draft.emails.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEmail(em.id)}
                  className="px-3 rounded-xl text-rose-600 hover:bg-rose-50 shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-black text-gray-800">تلفن‌ها</h3>
          <button type="button" onClick={addPhone} className="text-xs font-bold text-nexa-accent">
            + شماره
          </button>
        </div>
        <div className="space-y-2">
          {draft.phones.map((ph) => (
            <div key={ph.id} className="flex flex-col md:flex-row gap-2">
              <input
                className="md:w-28 bg-gray-50 rounded-xl py-2 px-3 text-xs"
                value={ph.label}
                onChange={(e) => patchPhone(ph.id, { label: e.target.value })}
                placeholder="عنوان"
              />
              <input
                className="flex-1 bg-gray-50 rounded-xl py-2 px-3 text-xs font-fa-num"
                value={ph.number}
                onChange={(e) => patchPhone(ph.id, { number: e.target.value })}
                placeholder="شماره"
              />
              <label className="text-[11px] flex items-center gap-1 px-2">
                <input
                  type="radio"
                  name="primary-phone"
                  checked={draft.primaryPhoneId === ph.id}
                  onChange={() => setDraft({ ...draft, primaryPhoneId: ph.id })}
                />
                اصلی
              </label>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

function BankTab({
  draft,
  setDraft,
}: {
  draft: Person;
  setDraft: (p: Person) => void;
}) {
  const setBankPrimary = (id: string) => {
    setDraft({
      ...draft,
      banks: draft.banks.map((b) => ({ ...b, isPrimary: b.id === id })),
    });
  };

  const removeBank = (id: string) => {
    const rest = draft.banks.filter((x) => x.id !== id);
    const removed = draft.banks.find((x) => x.id === id);
    if (!rest.length) {
      setDraft({ ...draft, banks: [] });
      return;
    }
    if (removed?.isPrimary) {
      setDraft({
        ...draft,
        banks: rest.map((b, i) => ({ ...b, isPrimary: i === 0 })),
      });
    } else {
      setDraft({ ...draft, banks: rest });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            const id = newId();
            const isFirst = draft.banks.length === 0;
            setDraft({
              ...draft,
              banks: [
                ...draft.banks.map((b) => ({ ...b, isPrimary: isFirst ? false : b.isPrimary })),
                {
                  id,
                  bankName: '',
                  accountTitle: '',
                  iban: '',
                  cardNumber: '',
                  accountNumber: '',
                  isPrimary: isFirst,
                },
              ],
            });
          }}
          className="text-xs text-nexa-accent font-bold"
        >
          + حساب بانکی
        </button>
      </div>
      {draft.banks.map((bank) => (
        <div key={bank.id} className="grid md:grid-cols-12 gap-2">
          <input
            value={bank.bankName}
            onChange={(e) =>
              setDraft({
                ...draft,
                banks: draft.banks.map((x) =>
                  x.id === bank.id ? { ...x, bankName: e.target.value } : x
                ),
              })
            }
            placeholder="نام بانک"
            className="md:col-span-3 bg-gray-50 rounded-xl px-3 py-2 text-sm"
          />
          <input
            value={bank.accountTitle}
            onChange={(e) =>
              setDraft({
                ...draft,
                banks: draft.banks.map((x) =>
                  x.id === bank.id ? { ...x, accountTitle: e.target.value } : x
                ),
              })
            }
            placeholder="صاحب/عنوان حساب"
            className="md:col-span-3 bg-gray-50 rounded-xl px-3 py-2 text-sm"
          />
          <input
            value={bank.iban}
            onChange={(e) =>
              setDraft({
                ...draft,
                banks: draft.banks.map((x) =>
                  x.id === bank.id ? { ...x, iban: e.target.value } : x
                ),
              })
            }
            placeholder="شماره شبا"
            className="md:col-span-3 bg-gray-50 rounded-xl px-3 py-2 text-sm font-fa-num"
          />
          <input
            value={bank.cardNumber || ''}
            onChange={(e) =>
              setDraft({
                ...draft,
                banks: draft.banks.map((x) =>
                  x.id === bank.id ? { ...x, cardNumber: e.target.value } : x
                ),
              })
            }
            placeholder="شماره کارت"
            className="md:col-span-2 bg-gray-50 rounded-xl px-3 py-2 text-sm font-fa-num"
          />
          <input
            value={bank.accountNumber || ''}
            onChange={(e) =>
              setDraft({
                ...draft,
                banks: draft.banks.map((x) =>
                  x.id === bank.id ? { ...x, accountNumber: e.target.value } : x
                ),
              })
            }
            placeholder="شماره حساب"
            className="md:col-span-1 bg-gray-50 rounded-xl px-3 py-2 text-sm font-fa-num"
          />
          <label className="md:col-span-12 flex items-center gap-2 text-[11px] px-1">
            <input
              type="radio"
              name="primary-bank"
              checked={!!bank.isPrimary}
              onChange={() => setBankPrimary(bank.id)}
            />
            حساب اصلی
          </label>
          <button
            type="button"
            onClick={() => removeBank(bank.id)}
            className="md:col-span-12 md:justify-self-end p-2 text-rose-600 rounded-xl hover:bg-rose-50"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

function OtherTab({
  draft,
  setDraft,
  personCategories,
}: {
  draft: Person;
  setDraft: (p: Person) => void;
  personCategories: { id: string; name: string }[];
}) {
  const [newEvent, setNewEvent] = useState('');
  const toggleCategory = (id: string) => {
    const exists = draft.categoryIds.includes(id);
    setDraft({
      ...draft,
      categoryIds: exists
        ? draft.categoryIds.filter((x) => x !== id)
        : [...draft.categoryIds, id],
    });
  };
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-black text-gray-800 mb-3">دسته‌بندی</h3>
        <div className="flex flex-wrap gap-2">
          {personCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggleCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                draft.categoryIds.includes(cat.id)
                  ? 'border-nexa-accent bg-nexa-accent/10 text-nexa-accent'
                  : 'border-nexa-border text-gray-500'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
          <h3 className="text-sm font-black text-gray-800">تاریخ‌های مهم</h3>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() =>
                setDraft({
                  ...draft,
                  importantDates: [...draft.importantDates, { id: newId(), title: 'تاریخ تولد', date: '' }],
                })
              }
              className="px-2 py-1 rounded-lg bg-gray-100 text-[11px]"
            >
              + تولد
            </button>
            <button
              type="button"
              onClick={() =>
                setDraft({
                  ...draft,
                  importantDates: [...draft.importantDates, { id: newId(), title: 'تاریخ ازدواج', date: '' }],
                })
              }
              className="px-2 py-1 rounded-lg bg-gray-100 text-[11px]"
            >
              + ازدواج
            </button>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input
              value={newEvent}
              onChange={(e) => setNewEvent(e.target.value)}
              placeholder="عنوان رویداد"
              className="bg-gray-50 rounded-xl px-3 py-2 text-xs flex-1 md:w-44"
            />
            <button
              type="button"
              onClick={() => {
                if (!newEvent.trim()) return;
                setDraft({
                  ...draft,
                  importantDates: [
                    ...draft.importantDates,
                    { id: newId(), title: newEvent.trim(), date: '' },
                  ],
                });
                setNewEvent('');
              }}
              className="px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold"
            >
              افزودن
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {draft.importantDates.map((event) => (
            <div key={event.id} className="grid md:grid-cols-12 gap-2">
              <input
                value={event.title}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    importantDates: draft.importantDates.map((x) =>
                      x.id === event.id ? { ...x, title: e.target.value } : x
                    ),
                  })
                }
                className="md:col-span-6 bg-gray-50 rounded-xl px-3 py-2 text-xs"
              />
              <input
                value={event.date}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    importantDates: draft.importantDates.map((x) =>
                      x.id === event.id ? { ...x, date: e.target.value } : x
                    ),
                  })
                }
                placeholder="تاریخ"
                className="md:col-span-5 bg-gray-50 rounded-xl px-3 py-2 text-xs font-fa-num"
              />
              <button
                type="button"
                onClick={() =>
                  setDraft({
                    ...draft,
                    importantDates: draft.importantDates.filter((x) => x.id !== event.id),
                  })
                }
                className="md:col-span-1 p-2 text-rose-600 rounded-xl hover:bg-rose-50"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {draft.importantDates.length === 0 && (
            <p className="text-xs text-gray-400">رویدادی ثبت نشده است.</p>
          )}
        </div>
      </div>
    </div>
  );
}
