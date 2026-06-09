'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';

export default function MustChangePasswordGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || !user) return;
    if (user.mustChangePassword && pathname !== '/change-password') {
      router.replace('/change-password');
    }
  }, [user, loading, pathname, router]);

  return <>{children}</>;
}
