'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { NexaBusiness } from '@/src/types/business';
import { NEXA_ACTIVE_BUSINESS_ID_KEY, NEXA_BUSINESSES_STORAGE_KEY } from '@/src/types/business';
import { useAuthOptional } from '@/src/context/AuthContext';

function readActiveId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(NEXA_ACTIVE_BUSINESS_ID_KEY);
}

export type BusinessContextValue = {
  businesses: NexaBusiness[];
  activeBusinessId: string | null;
  activeBusiness: NexaBusiness | null;
  loading: boolean;
  error: string | null;
  refreshBusinesses: () => Promise<void>;
  setActiveBusinessId: (id: string) => void;
  addBusiness: (input: { name: string }) => Promise<string>;
  updateBusiness: (id: string, patch: Partial<Omit<NexaBusiness, 'id' | 'createdAt'>>) => Promise<void>;
  removeBusiness: (id: string) => Promise<void>;
  getDefaultBusiness: () => NexaBusiness | undefined;
  hasActiveBusiness: boolean;
};

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthOptional();
  const [businesses, setBusinesses] = useState<NexaBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeBusinessId, setActiveBusinessIdState] = useState<string | null>(() => readActiveId());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(NEXA_BUSINESSES_STORAGE_KEY);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (activeBusinessId) {
      window.localStorage.setItem(NEXA_ACTIVE_BUSINESS_ID_KEY, activeBusinessId);
    } else {
      window.localStorage.removeItem(NEXA_ACTIVE_BUSINESS_ID_KEY);
    }
  }, [activeBusinessId]);

  const refreshBusinesses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/businesses', { credentials: 'include' });
      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error?.message ?? 'بارگذاری کسب‌وکارها ناموفق بود.');
      }
      const list = (json.data?.businesses ?? []) as NexaBusiness[];
      setBusinesses(list);
      setActiveBusinessIdState((current) => {
        if (current && list.some((b) => b.id === current)) return current;
        return list[0]?.id ?? null;
      });
    } catch (e) {
      setBusinesses([]);
      setError(e instanceof Error ? e.message : 'خطای نامشخص');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!auth || auth.loading) return;
    if (!auth.user) {
      setBusinesses([]);
      setActiveBusinessIdState(null);
      setLoading(false);
      return;
    }
    void refreshBusinesses();
  }, [auth?.user, auth?.loading, refreshBusinesses]);

  const activeBusiness = useMemo(
    () => businesses.find((b) => b.id === activeBusinessId) ?? null,
    [businesses, activeBusinessId]
  );

  const setActiveBusinessId = useCallback((id: string) => {
    setActiveBusinessIdState(id);
  }, []);

  const addBusiness = useCallback(async (input: { name: string }) => {
    const res = await fetch('/api/businesses', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: input.name }),
    });
    const json = await res.json();
    if (!json.ok) {
      throw new Error(json.error?.message ?? 'ایجاد کسب‌وکار ناموفق بود.');
    }
    const business = json.data.business as NexaBusiness;
    await refreshBusinesses();
    return business.id;
  }, [refreshBusinesses]);

  const updateBusiness = useCallback(
    async (id: string, patch: Partial<Omit<NexaBusiness, 'id' | 'createdAt'>>) => {
      const res = await fetch(`/api/businesses/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error?.message ?? 'به‌روزرسانی ناموفق بود.');
      }
      await refreshBusinesses();
    },
    [refreshBusinesses]
  );

  const removeBusiness = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/businesses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error?.message ?? 'حذف ناموفق بود.');
      }
      setActiveBusinessIdState((current) => (current === id ? null : current));
      await refreshBusinesses();
    },
    [refreshBusinesses]
  );

  const getDefaultBusiness = useCallback(
    () => businesses.find((b) => !b.isArchived) ?? businesses[0],
    [businesses]
  );

  const value = useMemo<BusinessContextValue>(
    () => ({
      businesses: businesses.filter((b) => !b.isArchived),
      activeBusinessId,
      activeBusiness,
      loading,
      error,
      refreshBusinesses,
      setActiveBusinessId,
      addBusiness,
      updateBusiness,
      removeBusiness,
      getDefaultBusiness,
      hasActiveBusiness: !!activeBusinessId && !!activeBusiness,
    }),
    [
      businesses,
      activeBusinessId,
      activeBusiness,
      loading,
      error,
      refreshBusinesses,
      setActiveBusinessId,
      addBusiness,
      updateBusiness,
      removeBusiness,
      getDefaultBusiness,
    ]
  );

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error('useBusiness must be used within BusinessProvider');
  return ctx;
}
