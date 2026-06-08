'use client';

import React, { useState } from 'react';
import { Building2, CalendarRange } from 'lucide-react';
import { useSettings } from '@/src/context/SettingsContext';

export default function BusinessFiscalSection() {
  const { business, setBusiness, fiscalYear, setFiscalYear } = useSettings();
  const [bizTab, setBizTab] = useState<'general' | 'contact'>('general');

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="text-nexa-accent" size={22} />
          <h2 className="text-lg font-black text-gray-900">اطلاعات کسب‌وکار</h2>
          <span className="text-xs text-gray-500">اسکرین‌های ۰۳ و ۰۴</span>
        </div>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl w-fit mb-4">
          <button
            type="button"
            onClick={() => setBizTab('general')}
            className={`px-4 py-2 rounded-xl text-xs font-bold ${
              bizTab === 'general' ? 'bg-white text-nexa-accent shadow-sm' : 'text-gray-500'
            }`}
          >
            عمومی و ثبت
          </button>
          <button
            type="button"
            onClick={() => setBizTab('contact')}
            className={`px-4 py-2 rounded-xl text-xs font-bold ${
              bizTab === 'contact' ? 'bg-white text-nexa-accent shadow-sm' : 'text-gray-500'
            }`}
          >
            تماس و نشانی
          </button>
        </div>
        <div className="nexa-card p-6 grid md:grid-cols-2 gap-4">
          {bizTab === 'general' ? (
            <>
              <Field label="نام حقوقی" value={business.legalName} onChange={(v) => setBusiness({ legalName: v })} />
              <Field label="نام تجاری" value={business.tradeName} onChange={(v) => setBusiness({ tradeName: v })} />
              <Field label="شناسه ملی" value={business.nationalId} onChange={(v) => setBusiness({ nationalId: v })} />
              <Field label="کد اقتصادی" value={business.economicCode} onChange={(v) => setBusiness({ economicCode: v })} />
              <Field label="شماره ثبت" value={business.regNo} onChange={(v) => setBusiness({ regNo: v })} />
            </>
          ) : (
            <>
              <Field label="تلفن" value={business.phone} onChange={(v) => setBusiness({ phone: v })} />
              <Field label="فکس" value={business.fax} onChange={(v) => setBusiness({ fax: v })} />
              <Field label="ایمیل" value={business.email} onChange={(v) => setBusiness({ email: v })} className="md:col-span-2" />
              <Field label="وب‌سایت" value={business.website} onChange={(v) => setBusiness({ website: v })} className="md:col-span-2" />
              <Field label="شهر" value={business.city} onChange={(v) => setBusiness({ city: v })} />
              <Field label="کد پستی" value={business.postalCode} onChange={(v) => setBusiness({ postalCode: v })} />
              <Field
                label="آدرس"
                value={business.address}
                onChange={(v) => setBusiness({ address: v })}
                className="md:col-span-2"
                multiline
              />
            </>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <CalendarRange className="text-nexa-accent" size={22} />
          <h2 className="text-lg font-black text-gray-900">تنظیم سال مالی</h2>
          <span className="text-xs text-gray-500">۰۵</span>
        </div>
        <div className="nexa-card p-6 grid md:grid-cols-3 gap-4">
          <Field label="عنوان سال مالی" value={fiscalYear.label} onChange={(v) => setFiscalYear({ label: v })} />
          <Field label="تاریخ شروع" value={fiscalYear.startDate} onChange={(v) => setFiscalYear({ startDate: v })} />
          <Field label="تاریخ پایان" value={fiscalYear.endDate} onChange={(v) => setFiscalYear({ endDate: v })} />
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  className = '',
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
  multiline?: boolean;
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="text-xs font-bold text-gray-500">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm resize-none"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm"
        />
      )}
    </div>
  );
}
