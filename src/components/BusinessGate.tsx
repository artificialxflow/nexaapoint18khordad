'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBusiness } from '@/src/context/BusinessContext';

export default function BusinessGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { hasActiveBusiness } = useBusiness();

  useEffect(() => {
    if (!hasActiveBusiness) router.replace('/businesses');
  }, [hasActiveBusiness, router]);

  if (!hasActiveBusiness) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-sm text-gray-500">
        در حال انتقال به انتخاب کسب‌وکار…
      </div>
    );
  }

  return <>{children}</>;
}
