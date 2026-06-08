'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Plus,
  LogIn,
  Trash2,
  Shield,
  Clock,
  Database,
  Info,
} from 'lucide-react';
import Logo from '@/src/components/Logo';
import { useBusiness } from '@/src/context/BusinessContext';
import {
  NEXA_BUSINESS_PLAN_LABELS,
  NEXA_BUSINESS_ROLE_LABELS,
  NEXA_DEMO_USER_NAME,
} from '@/src/types/business';

function formatExpiry(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fa-IR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function BusinessListPage() {
  const router = useRouter();
  const { businesses, setActiveBusinessId, removeBusiness } = useBusiness();

  const enter = (id: string) => {
    setActiveBusinessId(id);
    router.push('/dashboard/dashboard');
  };

  const handleDelete = (id: string, name: string) => {
    if (id === 'biz-demo') {
      alert('کسب‌وکار دمو قابل حذف نیست.');
      return;
    }
    if (window.confirm(`حذف «${name}»؟`)) removeBusiness(id);
  };

  return (
    <div className="min-h-screen bg-nexa-bg" dir="rtl">
      <header className="bg-white border-b border-nexa-border px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <Logo />
          <button
            type="button"
            onClick={() => router.push('/businesses/new')}
            className="nexa-btn-primary text-sm font-bold px-5 py-2.5 flex items-center gap-2"
          >
            <Plus size={18} />
            راه‌اندازی کسب‌وکار جدید
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <div>
          <p className="text-sm text-gray-500">سلام، {NEXA_DEMO_USER_NAME}</p>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 mt-1">
            لیست کسب‌وکارهای شما
          </h1>
        </div>

        {businesses.length === 0 ? (
          <div className="nexa-card p-12 text-center space-y-4">
            <Building2 size={48} className="mx-auto text-gray-300" />
            <p className="text-gray-500">هنوز کسب‌وکاری ثبت نکرده‌اید.</p>
            <button
              type="button"
              onClick={() => router.push('/businesses/new')}
              className="nexa-btn-primary px-6 py-3 text-sm font-bold inline-flex items-center gap-2"
            >
              <Plus size={18} />
              اولین کسب‌وکار را بسازید
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {businesses.map((b) => (
              <div
                key={b.id}
                className="nexa-card p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0">
                    <Building2 size={28} className="text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-black text-gray-900 truncate">{b.name}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Chip icon={<Shield size={12} />} label={`سطح دسترسی: ${NEXA_BUSINESS_ROLE_LABELS[b.role]}`} />
                      <Chip icon={<Info size={12} />} label={`اشتراک: ${NEXA_BUSINESS_PLAN_LABELS[b.plan]}`} />
                      <Chip icon={<Clock size={12} />} label={`انقضا: ${formatExpiry(b.expiresAt)}`} />
                      <Chip icon={<Database size={12} />} label={`اعتبار: ${b.creditLabel ?? '—'}`} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 md:mr-auto">
                  <button
                    type="button"
                    onClick={() => handleDelete(b.id, b.name)}
                    className="p-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50"
                    aria-label="حذف"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => enter(b.id)}
                    className="nexa-btn-primary px-5 py-2.5 text-sm font-bold flex items-center gap-2"
                  >
                    <LogIn size={18} />
                    ورود
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded-lg">
      {icon}
      {label}
    </span>
  );
}
