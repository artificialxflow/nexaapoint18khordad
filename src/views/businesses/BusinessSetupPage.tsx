'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Logo from '@/src/components/Logo';
import { useBusiness } from '@/src/context/BusinessContext';

export default function BusinessSetupPage() {
  const router = useRouter();
  const { addBusiness, setActiveBusinessId } = useBusiness();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const id = await addBusiness({ name: name.trim() });
      setActiveBusinessId(id);
      router.push('/dashboard/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطای نامشخص');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-nexa-bg flex flex-col" dir="rtl">
      <header className="bg-white border-b border-nexa-border px-6 py-4">
        <div className="max-w-lg mx-auto">
          <Logo />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg space-y-8">
          <h1 className="text-2xl font-black text-gray-900">راه‌اندازی کسب‌وکار جدید</h1>

          <div className="nexa-card p-6 md:p-8 space-y-5">
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2">
                نام کسب‌وکار را وارد کنید
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: فروشگاه مرکزی نکسا"
                className="w-full bg-gray-50 border border-nexa-border rounded-xl px-4 py-3 text-sm"
                autoFocus
                disabled={loading}
              />
            </div>

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}

            <div className="p-4 bg-gray-50 rounded-xl border border-nexa-border">
              <p className="text-xs font-bold text-gray-600 mb-1">زبان پیش‌فرض کسب‌وکار</p>
              <p className="text-sm font-black text-gray-900">فارسی</p>
              <p className="text-[10px] text-gray-500 mt-1">
                در این نسخه همه کسب‌وکارها با رابط کاربری فارسی مدیریت می‌شوند.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push('/businesses')}
                disabled={loading}
                className="flex-1 bg-white border border-nexa-border rounded-xl py-3 text-sm font-bold text-gray-600"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={!name.trim() || loading}
                className="flex-1 nexa-btn-primary py-3 text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? 'در حال ثبت…' : 'بعدی'}
              </button>
            </div>
          </div>
        </div>
      </main>

      <button
        type="button"
        onClick={() => router.back()}
        className="fixed bottom-6 left-6 text-xs font-bold text-nexa-accent flex items-center gap-1"
      >
        <ArrowLeft size={14} />
        بازگشت
      </button>
    </div>
  );
}
