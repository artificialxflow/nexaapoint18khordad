'use client';

import React, { useState } from 'react';
import { LayoutTemplate, Plus, Save, Trash2 } from 'lucide-react';
import { useSettings } from '@/src/context/SettingsContext';
import type { FormBuilderElement, FormBuilderElementType, FormBuilderKind } from '@/src/types/settings';

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return String(Date.now());
}

const FORM_KINDS: { id: FormBuilderKind; label: string }[] = [
  { id: 'sales-invoice', label: 'فاکتور فروش' },
  { id: 'purchase-invoice', label: 'فاکتور خرید' },
  { id: 'receipt', label: 'رسید' },
  { id: 'payment', label: 'پرداخت' },
  { id: 'transfer', label: 'حواله' },
  { id: 'other', label: 'سایر' },
];

const PALETTE: { type: FormBuilderElementType; label: string }[] = [
  { type: 'header', label: 'سربرگ' },
  { type: 'seller-buyer', label: 'فروشنده/خریدار' },
  { type: 'lines-table', label: 'جدول اقلام' },
  { type: 'totals', label: 'جمع و مالیات' },
  { type: 'footer', label: 'پاورقی' },
  { type: 'serial', label: 'سریال' },
  { type: 'datetime', label: 'تاریخ و ساعت' },
  { type: 'logo', label: 'لوگو' },
  { type: 'signature', label: 'امضا' },
  { type: 'custom-text', label: 'متن آزاد' },
];

export default function FormBuilderSection() {
  const { formTemplates, saveFormTemplate, removeFormTemplate } = useSettings();
  const [sub, setSub] = useState<'design' | 'list'>('design');
  const [formKind, setFormKind] = useState<FormBuilderKind>('sales-invoice');
  const [templateName, setTemplateName] = useState('');
  const [elements, setElements] = useState<FormBuilderElement[]>([]);

  const addElement = (type: FormBuilderElementType) => {
    const label = PALETTE.find((p) => p.type === type)?.label || type;
    const n = elements.filter((e) => e.type === type).length;
    setElements((prev) => [
      ...prev,
      {
        id: newId(),
        type,
        label: n ? `${label} ${n + 1}` : label,
        x: 16 + (prev.length % 3) * 120,
        y: 16 + Math.floor(prev.length / 3) * 72,
        w: type === 'lines-table' ? 280 : 160,
        h: type === 'lines-table' ? 120 : 56,
      },
    ]);
  };

  const removeEl = (id: string) => setElements((prev) => prev.filter((e) => e.id !== id));

  const save = () => {
    if (!templateName.trim()) {
      saveFormTemplate(`قالب ${FORM_KINDS.find((k) => k.id === formKind)?.label || ''} — ${new Date().toLocaleDateString('fa-IR')}`, formKind, elements);
    } else {
      saveFormTemplate(templateName.trim(), formKind, elements);
    }
    setElements([]);
    setTemplateName('');
    setSub('list');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <LayoutTemplate className="text-nexa-accent" size={22} />
        <h2 className="text-lg font-black text-gray-900">فرم‌ساز</h2>
        <span className="text-xs text-gray-500 mr-auto">۱۲ تا ۱۵ — MVP چیدمان و ذخیره قالب</span>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setSub('design')}
            className={`px-4 py-2 rounded-xl text-xs font-bold ${
              sub === 'design' ? 'bg-white text-nexa-accent shadow-sm' : 'text-gray-500'
            }`}
          >
            نوع فرم و طراحی
          </button>
          <button
            type="button"
            onClick={() => setSub('list')}
            className={`px-4 py-2 rounded-xl text-xs font-bold ${
              sub === 'list' ? 'bg-white text-nexa-accent shadow-sm' : 'text-gray-500'
            }`}
          >
            قالب‌های ذخیره‌شده
          </button>
        </div>
      </div>

      {sub === 'design' ? (
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="nexa-card p-4 space-y-2">
              <p className="text-xs font-black text-gray-800">تعیین نوع فرم (۱۳)</p>
              <select
                value={formKind}
                onChange={(e) => setFormKind(e.target.value as FormBuilderKind)}
                className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm"
              >
                {FORM_KINDS.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="nexa-card p-4 space-y-2">
              <p className="text-xs font-black text-gray-800">عناصر فاکتور (۱۴)</p>
              <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                {PALETTE.map((p) => (
                  <button
                    key={p.type}
                    type="button"
                    onClick={() => addElement(p.type)}
                    className="flex items-center gap-2 text-right px-3 py-2 rounded-xl text-xs font-bold bg-gray-50 hover:bg-nexa-accent/10 text-gray-700"
                  >
                    <Plus size={14} className="text-nexa-accent shrink-0" />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="nexa-card p-4 space-y-2">
              <label className="text-xs font-bold text-gray-500">نام قالب (اختیاری)</label>
              <input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm"
                placeholder="مثال: فاکتور فروش لوگودار"
              />
              <button type="button" onClick={save} className="w-full nexa-btn-primary py-2.5 text-sm flex items-center justify-center gap-2">
                <Save size={16} />
                ذخیره قالب
              </button>
            </div>
          </div>
          <div className="lg:col-span-3 nexa-card p-4 min-h-[420px]">
            <p className="text-xs font-bold text-gray-500 mb-3">بوم طراحی — جایگاه نسبی المان‌ها (نسخه بعد: کشیدن و رها کردن)</p>
            <div className="relative min-h-[360px] bg-white border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden">
              {elements.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                  از ستون راست المان اضافه کنید
                </div>
              ) : (
                elements.map((el) => (
                  <div
                    key={el.id}
                    className="absolute border border-nexa-border bg-gray-50/90 rounded-xl px-2 py-1 flex items-center justify-between gap-2 shadow-sm"
                    style={{ left: el.x, top: el.y, width: el.w, height: el.h }}
                  >
                    <span className="text-[10px] font-bold text-gray-800 truncate">{el.label}</span>
                    <button
                      type="button"
                      onClick={() => removeEl(el.id)}
                      className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="nexa-card overflow-hidden">
          <div className="p-4 border-b border-nexa-border font-bold text-sm">لیست فاکتورهای طراحی‌شده (۱۵)</div>
          {formTemplates.length === 0 ? (
            <p className="p-8 text-sm text-gray-500 text-center">قالبی ذخیره نشده. از تب طراحی یک قالب بسازید.</p>
          ) : (
            <ul className="divide-y divide-nexa-border">
              {formTemplates.map((t) => (
                <li key={t.id} className="p-4 flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900">{t.name}</p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      نوع: {FORM_KINDS.find((k) => k.id === t.formKind)?.label} — {t.elements.length} المان —{' '}
                      {new Date(t.updatedAt).toLocaleString('fa-IR')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFormTemplate(t.id)}
                    className="text-xs font-bold text-rose-600 px-3 py-1.5 rounded-xl hover:bg-rose-50"
                  >
                    حذف
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
