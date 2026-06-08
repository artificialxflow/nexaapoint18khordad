'use client';

import { BusinessProvider } from '@/src/context/BusinessContext';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <BusinessProvider>{children}</BusinessProvider>;
}
