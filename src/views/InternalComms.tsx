'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';

/** @deprecated — مکاتبه در میز کار (نامه‌ها / درخواست‌ها / ارتباطات) */
export default function InternalComms() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/tasks?tab=comms');
  }, [router]);

  return (
    <div className="nexa-card p-12 text-center space-y-4" dir="rtl">
      <MessageSquare className="mx-auto text-nexa-accent" size={40} />
      <h2 className="text-lg font-black text-gray-900">ارتباطات داخلی منتقل شد</h2>
      <p className="text-sm text-gray-500 max-w-md mx-auto">
        نامه‌ها، درخواست‌ها، گفتگوها و دفتر تلفن اکنون از منوی میز کار و «ارتباطات» در دسترس
        هستند.
      </p>
      <button
        type="button"
        onClick={() => router.push('/dashboard/tasks?tab=comms')}
        className="nexa-btn-primary text-sm font-bold px-6 py-2"
      >
        رفتن به مرکز ارتباطات
      </button>
    </div>
  );
}
