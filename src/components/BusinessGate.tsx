'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useBusiness } from '@/src/context/BusinessContext';

export default function BusinessGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { hasActiveBusiness, loading, activeBusinessId, businesses } = useBusiness();

  useEffect(() => {
    if (loading) return;
    if (!hasActiveBusiness) {
      router.replace('/businesses');
      return;
    }
    if (activeBusinessId && !businesses.some((b) => b.id === activeBusinessId)) {
      router.replace('/businesses');
    }
  }, [hasActiveBusiness, loading, activeBusinessId, businesses, router]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center gap-2 text-sm text-gray-500">
        <Loader2 size={18} className="animate-spin" />
        بارگذاری کسب‌وکار…
      </div>
    );
  }

  if (!hasActiveBusiness) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-sm text-gray-500">
        در حال انتقال به انتخاب کسب‌وکار…
      </div>
    );
  }

  return <>{children}</>;
}
