'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, LogIn, User } from 'lucide-react';
import Logo from '@/src/components/Logo';
import { useAuth } from '@/src/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const next = searchParams.get('next') || '/businesses';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? 'ورود ناموفق بود.');
        return;
      }

      await refresh();
      router.replace(next);
    } catch {
      setError('خطا در ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-nexa-border shadow-xl p-8">
        <div className="flex flex-col items-center mb-8">
          <Logo />
          <h1 className="mt-6 text-xl font-black text-gray-900">ورود به NEXA</h1>
          <p className="text-sm text-gray-500 mt-2">نام کاربری و رمز عبور خود را وارد کنید</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">نام کاربری</label>
            <div className="relative">
              <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-50 rounded-2xl py-3 pr-11 pl-4 text-sm border border-transparent focus:border-nexa-accent/30 focus:ring-2 focus:ring-nexa-accent/20 outline-none"
                placeholder="username"
                dir="ltr"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">رمز عبور</label>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 rounded-2xl py-3 pr-11 pl-4 text-sm border border-transparent focus:border-nexa-accent/30 focus:ring-2 focus:ring-nexa-accent/20 outline-none"
                placeholder="••••••••"
                dir="ltr"
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-nexa-accent text-white rounded-2xl py-3 font-bold text-sm hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            <LogIn size={18} />
            {loading ? 'در حال ورود…' : 'ورود'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          فراموشی رمز؟ با مدیر سیستم تماس بگیرید.
        </p>
      </div>
    </div>
  );
}
