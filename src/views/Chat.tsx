'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** @deprecated از منوی اصلی حذف شد — گفتگو داخل میز کار است. */
export default function Chat() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/chats');
  }, [router]);

  return (
    <div className="nexa-card p-8 text-center text-sm text-gray-500">
      در حال انتقال به گفتگوی میز کار…
    </div>
  );
}
