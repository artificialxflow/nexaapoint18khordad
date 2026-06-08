'use client';

import { AuthProvider } from '@/src/context/AuthContext';
import { BusinessProvider } from '@/src/context/BusinessContext';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BusinessProvider>{children}</BusinessProvider>
    </AuthProvider>
  );
}
