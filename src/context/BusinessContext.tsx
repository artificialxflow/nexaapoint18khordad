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
import {
  NEXA_ACTIVE_BUSINESS_ID_KEY,
  NEXA_BUSINESSES_STORAGE_KEY,
} from '@/src/types/business';

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return String(Date.now());
}

function defaultExpiryIso(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return d.toISOString();
}

function seedBusinesses(): NexaBusiness[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'biz-demo',
      name: 'شرکت دمو',
      role: 'owner',
      plan: 'trial',
      expiresAt: defaultExpiryIso(),
      creditLabel: 'نامحدود',
      createdAt: now,
    },
  ];
}

function readActiveId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(NEXA_ACTIVE_BUSINESS_ID_KEY);
}

export type BusinessContextValue = {
  businesses: NexaBusiness[];
  activeBusinessId: string | null;
  activeBusiness: NexaBusiness | null;
  setActiveBusinessId: (id: string) => void;
  addBusiness: (input: Omit<NexaBusiness, 'id' | 'createdAt'>) => string;
  updateBusiness: (id: string, patch: Partial<Omit<NexaBusiness, 'id' | 'createdAt'>>) => void;
  removeBusiness: (id: string) => void;
  getDefaultBusiness: () => NexaBusiness | undefined;
  hasActiveBusiness: boolean;
};

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [businesses, setBusinesses] = useState<NexaBusiness[]>(() => {
    if (typeof window === 'undefined') return seedBusinesses();
    try {
      const raw = window.localStorage.getItem(NEXA_BUSINESSES_STORAGE_KEY);
      if (!raw) return seedBusinesses();
      const parsed = JSON.parse(raw) as NexaBusiness[];
      return parsed.length ? parsed : seedBusinesses();
    } catch {
      return seedBusinesses();
    }
  });

  const [activeBusinessId, setActiveBusinessIdState] = useState<string | null>(() =>
    readActiveId()
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(NEXA_BUSINESSES_STORAGE_KEY, JSON.stringify(businesses));
  }, [businesses]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (activeBusinessId) {
      window.localStorage.setItem(NEXA_ACTIVE_BUSINESS_ID_KEY, activeBusinessId);
    } else {
      window.localStorage.removeItem(NEXA_ACTIVE_BUSINESS_ID_KEY);
    }
  }, [activeBusinessId]);

  const activeBusiness = useMemo(
    () => businesses.find((b) => b.id === activeBusinessId) ?? null,
    [businesses, activeBusinessId]
  );

  const setActiveBusinessId = useCallback((id: string) => {
    setActiveBusinessIdState(id);
  }, []);

  const addBusiness = useCallback((input: Omit<NexaBusiness, 'id' | 'createdAt'>) => {
    const id = newId();
    const business: NexaBusiness = {
      ...input,
      id,
      createdAt: new Date().toISOString(),
      creditLabel: input.creditLabel ?? 'نامحدود',
      plan: input.plan ?? 'trial',
      role: input.role ?? 'owner',
      expiresAt: input.expiresAt ?? defaultExpiryIso(),
    };
    setBusinesses((prev) => [...prev, business]);
    return id;
  }, []);

  const updateBusiness = useCallback(
    (id: string, patch: Partial<Omit<NexaBusiness, 'id' | 'createdAt'>>) => {
      setBusinesses((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    },
    []
  );

  const removeBusiness = useCallback((id: string) => {
    setBusinesses((prev) => prev.filter((b) => b.id !== id));
    setActiveBusinessIdState((current) => (current === id ? null : current));
  }, []);

  const getDefaultBusiness = useCallback(
    () => businesses.find((b) => !b.isArchived) ?? businesses[0],
    [businesses]
  );

  const value = useMemo<BusinessContextValue>(
    () => ({
      businesses: businesses.filter((b) => !b.isArchived),
      activeBusinessId,
      activeBusiness,
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
