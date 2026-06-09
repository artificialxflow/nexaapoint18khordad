'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock } from 'lucide-react';
import Logo from '@/src/components/Logo';
import { useAuth } from '@/src/context/AuthContext';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
    if (!loading && user && !user.mustChangePassword) router.replace('/businesses');
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (next.length < 8) {
      setError('رمز جدید باید حداقل ۸ کاراکتر باشد.');
      return;
    }
    if (next !== confirm) {
      setError('رمز جدید و تکرار آن یکسان نیست.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? 'خطا');
        return;
      }
      await refresh();
      router.replace('/businesses');
    } catch {
      setError('خطا در ارتباط با سرور.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">در حال بارگذاری…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-nexa-border shadow-xl p-8">
        <div className="flex flex-col items-center mb-6">
          <Logo />
          <h1 className="mt-4 text-xl font-black">تغییر رمز عبور</h1>
          <p className="text-sm text-gray-500 mt-2">برای ادامه، رمز جدید خود را تنظیم کنید.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {(['current', 'next', 'confirm'] as const).map((field, i) => (
            <div key={field}>
              <label className="block text-xs font-bold text-gray-600 mb-2">
                {field === 'current' ? 'رمز فعلی' : field === 'next' ? 'رمز جدید' : 'تکرار رمز جدید'}
              </label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={show ? 'text' : 'password'}
                  dir="ltr"
                  value={field === 'current' ? current : field === 'next' ? next : confirm}
                  onChange={(e) => {
                    if (field === 'current') setCurrent(e.target.value);
                    else if (field === 'next') setNext(e.target.value);
                    else setConfirm(e.target.value);
                  }}
                  className="w-full bg-gray-50 rounded-2xl py-3 pr-11 pl-10 text-sm outline-none focus:ring-2 focus:ring-nexa-accent/20"
                  required
                />
                {i === 0 && (
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>
            </div>
          ))}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-2xl px-4 py-3">{error}</div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-nexa-accent text-white rounded-2xl py-3 font-bold text-sm disabled:opacity-60"
          >
            {submitting ? 'در حال ذخیره…' : 'ذخیره و ادامه'}
          </button>
        </form>
      </div>
    </div>
  );
}
