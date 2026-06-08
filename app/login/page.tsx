'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, Phone, ShieldCheck } from 'lucide-react';
import Logo from '@/src/components/Logo';

type Step = 'mobile' | 'code';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/businesses';

  const [step, setStep] = useState<Step>('mobile');
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const sendCode = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mobile }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message ?? 'ارسال کد ناموفق بود');
        return;
      }
      setStep('code');
      setResendIn(data.resendAfterSeconds ?? 60);
    } catch {
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  }, [mobile]);

  const verify = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mobile, code }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message ?? 'ورود ناموفق بود');
        return;
      }
      router.replace(nextPath);
      router.refresh();
    } catch {
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  }, [mobile, code, nextPath, router]);

  return (
    <div className="min-h-screen bg-nexa-bg flex flex-col" dir="rtl">
      <header className="bg-white border-b border-nexa-border px-6 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Logo />
          <button
            type="button"
            onClick={() => router.push('/')}
            className="text-xs font-bold text-gray-500 hover:text-nexa-accent"
          >
            بازگشت
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md nexa-card p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-nexa-accent/10 flex items-center justify-center text-nexa-accent">
              <ShieldCheck size={28} />
            </div>
            <h1 className="text-2xl font-black text-gray-900">ورود به NEXA</h1>
            <p className="text-sm text-gray-500">
              {step === 'mobile'
                ? 'شماره موبایل خود را وارد کنید'
                : 'کد تأیید ارسال‌شده را وارد کنید'}
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700 font-medium">
              {error}
            </div>
          )}

          {step === 'mobile' ? (
            <div className="space-y-4">
              <label className="block space-y-2">
                <span className="text-xs font-bold text-gray-600">شماره موبایل</span>
                <div className="relative">
                  <Phone
                    size={18}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="tel"
                    inputMode="tel"
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full bg-gray-50 border border-nexa-border rounded-xl py-3 pr-11 pl-4 text-sm font-fa-num focus:ring-2 focus:ring-nexa-accent/20"
                    dir="ltr"
                  />
                </div>
              </label>
              <button
                type="button"
                disabled={loading || !mobile.trim()}
                onClick={() => void sendCode()}
                className="w-full nexa-btn-primary py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                ارسال کد تأیید
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 text-center font-fa-num" dir="ltr">
                {mobile}
              </p>
              <label className="block space-y-2">
                <span className="text-xs font-bold text-gray-600">کد ۶ رقمی</span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••••"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-gray-50 border border-nexa-border rounded-xl py-3 px-4 text-center text-lg tracking-[0.4em] font-fa-num focus:ring-2 focus:ring-nexa-accent/20"
                  dir="ltr"
                />
              </label>
              <button
                type="button"
                disabled={loading || code.length < 6}
                onClick={() => void verify()}
                className="w-full nexa-btn-primary py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowLeft size={18} />}
                ورود
              </button>
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep('mobile');
                    setCode('');
                    setError(null);
                  }}
                  className="font-bold text-gray-500 hover:text-nexa-accent"
                >
                  تغییر شماره
                </button>
                <button
                  type="button"
                  disabled={loading || resendIn > 0}
                  onClick={() => void sendCode()}
                  className="font-bold text-nexa-accent disabled:text-gray-400"
                >
                  {resendIn > 0 ? `ارسال مجدد (${resendIn})` : 'ارسال مجدد'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
          در حال بارگذاری…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
