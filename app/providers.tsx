'use client';

import { AuthProvider } from '@/src/context/AuthContext';
import { BusinessProvider } from '@/src/context/BusinessContext';
import MustChangePasswordGuard from '@/src/components/auth/MustChangePasswordGuard';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <MustChangePasswordGuard>
        <BusinessProvider>{children}</BusinessProvider>
      </MustChangePasswordGuard>
    </AuthProvider>
  );
}
