'use client';

import React, {
  createContext,
  useCallback,
  useEffect,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  seedPayments,
  seedPeople,
  seedPersonCategories,
  seedPersonGroups,
  seedPriceLists,
  seedProductCategories,
  seedProducts,
  seedReceipts,
  seedShareholders,
  seedVendors,
} from '@/src/catalog/catalogSeed';
import { normalizePhone } from '@/src/lib/pricing';
import type {
  MoneyDocument,
  Person,
  PersonBankAccount,
  PersonCategory,
  PersonEmail,
  PersonGroup,
  PersonGroupLevel,
  PersonRole,
  PriceList,
  ShareholderRecord,
  VendorRecord,
} from '@/src/types/person';
import type { Product, ProductCategory } from '@/src/types/product';

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return String(Date.now());
}

export interface DuplicateMatch {
  field: 'phone' | 'nationalId';
  person: Person;
}

interface CatalogContextValue {
  people: Person[];
  products: Product[];
  receipts: MoneyDocument[];
  payments: MoneyDocument[];
  shareholders: ShareholderRecord[];
  vendors: VendorRecord[];
  priceLists: PriceList[];
  personCategories: PersonCategory[];
  personGroups: PersonGroup[];
  upsertPersonGroup: (payload: { id?: string; name: string; levels: PersonGroupLevel[] }) => void;
  removePersonGroup: (id: string) => void;
  upsertPriceList: (payload: {
    id?: string;
    name: string;
    tier?: 'retail' | 'wholesale' | 'partner';
  }) => void;
  removePriceList: (id: string) => void;
  productCategories: ProductCategory[];
  replacePerson: (person: Person) => void;
  addPerson: (person: Person) => void;
  removePerson: (id: string) => void;
  addReceipt: (doc: MoneyDocument) => void;
  replaceReceipt: (doc: MoneyDocument) => void;
  removeReceipt: (id: string) => void;
  addPayment: (doc: MoneyDocument) => void;
  replacePayment: (doc: MoneyDocument) => void;
  removePayment: (id: string) => void;
  addShareholder: (row: ShareholderRecord) => void;
  replaceShareholder: (row: ShareholderRecord) => void;
  removeShareholder: (id: string) => void;
  addVendor: (row: VendorRecord) => void;
  replaceVendor: (row: VendorRecord) => void;
  removeVendor: (id: string) => void;
  addProduct: (product: Product) => void;
  replaceProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
  addPersonCategory: (name: string) => void;
  upsertPersonCategory: (payload: { id?: string; name: string; parentId?: string }) => void;
  removePersonCategory: (id: string) => void;
  reorderPersonCategories: (orderedIds: string[]) => void;
  upsertProductCategory: (payload: { id?: string; name: string; parentId?: string }) => void;
  removeProductCategory: (id: string) => void;
  reorderProductCategories: (orderedIds: string[]) => void;
  mergePeople: (sourceId: string, targetId: string) => void;
  generateAccountingCode: () => string;
  generateProductAccountingCode: () => string;
  listDuplicates: () => DuplicateMatch[];
  findDuplicate: (
    phone: string,
    nationalId: string | undefined,
    excludePersonId?: string
  ) => DuplicateMatch | null;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);
const STORAGE_KEY = 'nexa-catalog-v2';

type StoredCatalog = Partial<{
  people: Person[];
  products: Product[];
  receipts: MoneyDocument[];
  payments: MoneyDocument[];
  shareholders: ShareholderRecord[];
  vendors: VendorRecord[];
  personCategories: PersonCategory[];
  personGroups?: PersonGroup[];
  productCategories: ProductCategory[];
  priceLists?: PriceList[];
}>;

function readStoredCatalog(): StoredCatalog {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StoredCatalog;
  } catch {
    return {};
  }
}

function migrateEmailsFromStorage(raw: unknown): PersonEmail[] {
  if (!Array.isArray(raw)) {
    const id = newId();
    return [{ id, label: 'اصلی', address: '' }];
  }
  if (raw.length === 0) {
    const id = newId();
    return [{ id, label: 'اصلی', address: '' }];
  }
  const first = raw[0] as unknown;
  if (typeof first === 'string') {
    return (raw as string[]).map((address, i) => ({
      id: newId(),
      label: i === 0 ? 'اصلی' : 'فرعی',
      address: String(address ?? ''),
    }));
  }
  return (raw as PersonEmail[]).map((e) => ({
    id: e.id || newId(),
    label: e.label || 'ایمیل',
    address: e.address || '',
  }));
}

function mergeEmailDedupe(a: PersonEmail[], b: PersonEmail[]): PersonEmail[] {
  const map = new Map<string, PersonEmail>();
  [...a, ...b].forEach((e) => {
    const k = (e.address || '').trim().toLowerCase();
    if (!k) return;
    if (!map.has(k)) map.set(k, { ...e, id: e.id || newId() });
  });
  return [...map.values()];
}

function normalizeBanks(banks: PersonBankAccount[]): PersonBankAccount[] {
  if (!banks.length) return [];
  const mapped = banks.map((b) => ({
    id: b.id || newId(),
    bankName: (b as { bankName?: string; title?: string }).bankName || (b as { title?: string }).title || '',
    accountTitle: b.accountTitle || '',
    iban: b.iban || '',
    cardNumber: b.cardNumber || '',
    accountNumber: b.accountNumber || '',
    isPrimary: !!b.isPrimary,
  }));
  const priIdx = mapped.findIndex((x) => x.isPrimary);
  if (priIdx === -1) return mapped.map((b, i) => ({ ...b, isPrimary: i === 0 }));
  return mapped.map((b, i) => ({ ...b, isPrimary: i === priIdx }));
}

function ensureEmailsAndPrimary(
  emails: PersonEmail[],
  preferredPrimaryId?: string
): { emails: PersonEmail[]; primaryEmailId: string } {
  const list = emails.length ? emails : [{ id: newId(), label: 'اصلی', address: '' }];
  const pid =
    preferredPrimaryId && list.some((e) => e.id === preferredPrimaryId)
      ? preferredPrimaryId
      : list[0].id;
  return { emails: list, primaryEmailId: pid };
}

function cloneProduct(p: Product): Product {
  return {
    ...p,
    categoryIds: [...p.categoryIds],
    prices: { ...p.prices },
    units: { ...p.units },
    inventory: { ...p.inventory },
    tax: { ...p.tax },
    images: { ...p.images, gallery: [...p.images.gallery] },
  };
}

function ensureProductPrices(p: Product, listIds: string[]): Product {
  const prices = { ...p.prices };
  listIds.forEach((id) => {
    if (!(id in prices)) prices[id] = 0;
  });
  return { ...p, prices };
}

function isDescendantCategory<T extends { id: string; parentId?: string }>(
  list: T[],
  targetId: string,
  maybeAncestorId: string
): boolean {
  const map = new Map(list.map((x) => [x.id, x]));
  let cur = map.get(targetId);
  while (cur?.parentId) {
    if (cur.parentId === maybeAncestorId) return true;
    cur = map.get(cur.parentId);
  }
  return false;
}

function reorderByIds<T extends { id: string }>(list: T[], orderedIds: string[]): T[] {
  if (!orderedIds.length) return list;
  const map = new Map(list.map((x) => [x.id, x]));
  const next: T[] = [];
  orderedIds.forEach((id) => {
    const row = map.get(id);
    if (row) {
      next.push(row);
      map.delete(id);
    }
  });
  map.forEach((row) => next.push(row));
  return next;
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const stored = useMemo(() => readStoredCatalog(), []);
  const catalogInit = useMemo(() => {
    const priceLists = (stored.priceLists ?? seedPriceLists).map((x) => ({ ...x }));
    const listIds = priceLists.map((x) => x.id);
    const people = (stored.people ?? seedPeople).map((p) => normalizePerson(p, listIds));
    const products = (stored.products ?? seedProducts).map((p) =>
      ensureProductPrices(cloneProduct(p), listIds)
    );
    return { priceLists, people, products };
  }, [stored]);

  const [priceLists, setPriceLists] = useState<PriceList[]>(() => catalogInit.priceLists);
  const [people, setPeople] = useState<Person[]>(() => catalogInit.people);
  const [products, setProducts] = useState<Product[]>(() => catalogInit.products);
  const [receipts, setReceipts] = useState<MoneyDocument[]>(() =>
    (stored.receipts ?? seedReceipts).map(cloneMoneyDoc)
  );
  const [payments, setPayments] = useState<MoneyDocument[]>(() =>
    (stored.payments ?? seedPayments).map(cloneMoneyDoc)
  );
  const [shareholders, setShareholders] = useState<ShareholderRecord[]>(() =>
    (stored.shareholders ?? seedShareholders).map((x) => ({ ...x }))
  );
  const [vendors, setVendors] = useState<VendorRecord[]>(() =>
    (stored.vendors ?? seedVendors).map((x) => ({ ...x }))
  );
  const [personCategories, setPersonCategories] = useState<PersonCategory[]>(
    () => (stored.personCategories ?? seedPersonCategories).map((x) => ({ ...x }))
  );
  const [productCategories, setProductCategories] = useState<ProductCategory[]>(
    () => (stored.productCategories ?? seedProductCategories).map((x) => ({ ...x }))
  );
  const [personGroups, setPersonGroups] = useState<PersonGroup[]>(() => {
    const g = stored.personGroups ?? seedPersonGroups;
    return g.map((x) => ({ ...x, levels: x.levels.map((l) => ({ ...l })) }));
  });

  const upsertPersonGroup = useCallback((payload: { id?: string; name: string; levels: PersonGroupLevel[] }) => {
    setPersonGroups((prev) => {
      const id = payload.id?.trim() || newId();
      const name = payload.name.trim() || 'گروه';
      const levels =
        payload.levels.length > 0
          ? payload.levels.map((l) => ({ ...l, id: l.id?.trim() || newId() }))
          : [{ id: newId(), label: 'سطح ۱' }];
      const row: PersonGroup = { id, name, levels };
      const idx = prev.findIndex((x) => x.id === id);
      if (idx === -1) return [...prev, row];
      const next = [...prev];
      next[idx] = row;
      return next;
    });
  }, []);

  const removePersonGroup = useCallback((id: string) => {
    setPersonGroups((prev) => prev.filter((g) => g.id !== id));
    setPeople((prev) =>
      prev.map((person) => ({
        ...person,
        groupMemberships: person.groupMemberships.filter((m) => m.groupId !== id),
      }))
    );
  }, []);

  const upsertPriceList = useCallback(
    (payload: { id?: string; name: string; tier?: PriceList['tier'] }) => {
      setPriceLists((prev) => {
        const id = payload.id?.trim() || newId();
        const name = payload.name.trim() || 'لیست قیمت';
        const idx = prev.findIndex((x) => x.id === id);
        const existing = idx >= 0 ? prev[idx] : undefined;
        const row: PriceList = {
          id,
          name,
          tier: payload.tier !== undefined ? payload.tier : existing?.tier,
        };
        const next = idx === -1 ? [...prev, row] : prev.map((x, i) => (i === idx ? row : x));
        const ids = next.map((x) => x.id);
        setProducts((prods) => prods.map((p) => ensureProductPrices(p, ids)));
        return next;
      });
    },
    []
  );

  const removePriceList = useCallback((id: string) => {
    setPriceLists((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((x) => x.id !== id);
      const fallback = next[0]?.id;
      setProducts((prods) =>
        prods.map((p) => {
          const prices = { ...p.prices };
          delete prices[id];
          return ensureProductPrices({ ...p, prices }, next.map((x) => x.id));
        })
      );
      setPeople((ps) =>
        ps.map((person) =>
          person.defaultPriceListId === id ? { ...person, defaultPriceListId: fallback } : person
        )
      );
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload: StoredCatalog = {
      people,
      products,
      receipts,
      payments,
      shareholders,
      vendors,
      personCategories,
      personGroups,
      priceLists,
      productCategories,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [people, products, receipts, payments, shareholders, vendors, personCategories, personGroups, priceLists, productCategories]);

  const findDuplicate = useCallback(
    (phone: string, nationalId: string | undefined, excludePersonId?: string) => {
      const nPhone = normalizePhone(phone);
      if (nPhone.length >= 10) {
        const byPhone = people.find((p) => {
          if (p.id === excludePersonId) return false;
          return p.phones.some((ph) => normalizePhone(ph.number) === nPhone);
        });
        if (byPhone) return { field: 'phone' as const, person: byPhone };
      }
      const nid = (nationalId || '').replace(/\s/g, '');
      if (nid.length >= 8) {
        const byN = people.find((p) => {
          if (p.id === excludePersonId) return false;
          return (p.nationalId || '').replace(/\s/g, '') === nid;
        });
        if (byN) return { field: 'nationalId' as const, person: byN };
      }
      return null;
    },
    [people]
  );

  const listDuplicates = useCallback(() => {
    const seenPhones = new Map<string, Person>();
    const seenNationalIds = new Map<string, Person>();
    const matches: DuplicateMatch[] = [];
    people.forEach((person) => {
      person.phones.forEach((phone) => {
        const normalized = normalizePhone(phone.number);
        if (normalized.length < 10) return;
        const existing = seenPhones.get(normalized);
        if (existing && existing.id !== person.id) {
          matches.push({ field: 'phone', person });
        } else {
          seenPhones.set(normalized, person);
        }
      });
      const nid = (person.nationalId || '').replace(/\s/g, '');
      if (nid.length >= 8) {
        const existing = seenNationalIds.get(nid);
        if (existing && existing.id !== person.id) {
          matches.push({ field: 'nationalId', person });
        } else {
          seenNationalIds.set(nid, person);
        }
      }
    });
    return matches;
  }, [people]);

  const priceListIds = useMemo(() => priceLists.map((x) => x.id), [priceLists]);

  const replacePerson = useCallback(
    (person: Person) => {
      setPeople((prev) => {
        const i = prev.findIndex((p) => p.id === person.id);
        if (i === -1) return [normalizePerson(person, priceListIds), ...prev];
        const next = [...prev];
        next[i] = normalizePerson(person, priceListIds);
        return next;
      });
    },
    [priceListIds]
  );

  const addPerson = useCallback(
    (person: Person) => {
      setPeople((prev) => [normalizePerson(person, priceListIds), ...prev]);
    },
    [priceListIds]
  );

  const removePerson = useCallback((id: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addReceipt = useCallback((doc: MoneyDocument) => {
    setReceipts((prev) => [cloneMoneyDoc(doc), ...prev]);
  }, []);

  const replaceReceipt = useCallback((doc: MoneyDocument) => {
    setReceipts((prev) => {
      const i = prev.findIndex((x) => x.id === doc.id);
      if (i === -1) return [cloneMoneyDoc(doc), ...prev];
      const next = [...prev];
      next[i] = cloneMoneyDoc(doc);
      return next;
    });
  }, []);

  const removeReceipt = useCallback((id: string) => {
    setReceipts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const addPayment = useCallback((doc: MoneyDocument) => {
    setPayments((prev) => [cloneMoneyDoc(doc), ...prev]);
  }, []);

  const replacePayment = useCallback((doc: MoneyDocument) => {
    setPayments((prev) => {
      const i = prev.findIndex((x) => x.id === doc.id);
      if (i === -1) return [cloneMoneyDoc(doc), ...prev];
      const next = [...prev];
      next[i] = cloneMoneyDoc(doc);
      return next;
    });
  }, []);

  const removePayment = useCallback((id: string) => {
    setPayments((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const addShareholder = useCallback((row: ShareholderRecord) => {
    setShareholders((prev) => [{ ...row }, ...prev]);
  }, []);

  const replaceShareholder = useCallback((row: ShareholderRecord) => {
    setShareholders((prev) => {
      const i = prev.findIndex((x) => x.id === row.id);
      if (i === -1) return [{ ...row }, ...prev];
      const next = [...prev];
      next[i] = { ...row };
      return next;
    });
  }, []);

  const removeShareholder = useCallback((id: string) => {
    setShareholders((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const addVendor = useCallback((row: VendorRecord) => {
    setVendors((prev) => [{ ...row }, ...prev]);
  }, []);

  const replaceVendor = useCallback((row: VendorRecord) => {
    setVendors((prev) => {
      const i = prev.findIndex((x) => x.id === row.id);
      if (i === -1) return [{ ...row }, ...prev];
      const next = [...prev];
      next[i] = { ...row };
      return next;
    });
  }, []);

  const removeVendor = useCallback((id: string) => {
    setVendors((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const addProduct = useCallback(
    (product: Product) => {
      setProducts((prev) => [
        ensureProductPrices(cloneProduct(product), priceListIds),
        ...prev,
      ]);
    },
    [priceListIds]
  );

  const replaceProduct = useCallback(
    (product: Product) => {
      setProducts((prev) => {
        const i = prev.findIndex((p) => p.id === product.id);
        const row = ensureProductPrices(cloneProduct(product), priceListIds);
        if (i === -1) return [row, ...prev];
        const next = [...prev];
        next[i] = row;
        return next;
      });
    },
    [priceListIds]
  );

  const removeProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addPersonCategory = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setPersonCategories((prev) => [...prev, { id: newId(), name: trimmed }]);
  }, []);

  const upsertPersonCategory = useCallback(
    (payload: { id?: string; name: string; parentId?: string }) => {
      const name = payload.name.trim();
      if (!name) return;
      setPersonCategories((prev) => {
        const parentId = payload.parentId || undefined;
        if (!payload.id) {
          const canUseParent = parentId && prev.some((x) => x.id === parentId);
          return [...prev, { id: newId(), name, parentId: canUseParent ? parentId : undefined }];
        }
        const canUseParent =
          parentId &&
          parentId !== payload.id &&
          prev.some((x) => x.id === parentId) &&
          !isDescendantCategory(prev, parentId, payload.id);
        return prev.map((row) => (row.id === payload.id ? { ...row, name, parentId: canUseParent ? parentId : undefined } : row));
      });
    },
    []
  );

  const removePersonCategory = useCallback((id: string) => {
    setPersonCategories((prev) =>
      prev
        .filter((c) => c.id !== id)
        .map((c) => (c.parentId === id ? { ...c, parentId: undefined } : c))
    );
    setPeople((prev) =>
      prev.map((p) => ({
        ...p,
        categoryIds: p.categoryIds.filter((cid) => cid !== id),
      }))
    );
  }, []);

  const reorderPersonCategories = useCallback((orderedIds: string[]) => {
    setPersonCategories((prev) => reorderByIds(prev, orderedIds));
  }, []);

  const upsertProductCategory = useCallback(
    (payload: { id?: string; name: string; parentId?: string }) => {
      const name = payload.name.trim();
      if (!name) return;
      setProductCategories((prev) => {
        const parentId = payload.parentId || undefined;
        if (!payload.id) {
          const canUseParent = parentId && prev.some((x) => x.id === parentId);
          return [...prev, { id: newId(), name, parentId: canUseParent ? parentId : undefined }];
        }
        const canUseParent =
          parentId &&
          parentId !== payload.id &&
          prev.some((x) => x.id === parentId) &&
          !isDescendantCategory(prev, parentId, payload.id);
        return prev.map((row) => (row.id === payload.id ? { ...row, name, parentId: canUseParent ? parentId : undefined } : row));
      });
    },
    []
  );

  const removeProductCategory = useCallback((id: string) => {
    setProductCategories((prev) =>
      prev
        .filter((c) => c.id !== id)
        .map((c) => (c.parentId === id ? { ...c, parentId: undefined } : c))
    );
    setProducts((prev) =>
      prev.map((p) => ({
        ...p,
        categoryIds: p.categoryIds.filter((cid) => cid !== id),
      }))
    );
  }, []);

  const reorderProductCategories = useCallback((orderedIds: string[]) => {
    setProductCategories((prev) => reorderByIds(prev, orderedIds));
  }, []);

  const generateAccountingCode = useCallback(() => {
    const max = people.reduce((acc, person) => {
      const n = Number(person.accountingCode);
      return Number.isFinite(n) ? Math.max(acc, n) : acc;
    }, 10000);
    return String(max + 1);
  }, [people]);

  const generateProductAccountingCode = useCallback(() => {
    const max = products.reduce((acc, product) => {
      const n = Number(product.accountingCode);
      return Number.isFinite(n) ? Math.max(acc, n) : acc;
    }, 20000);
    return String(max + 1);
  }, [products]);

  const mergePeople = useCallback((sourceId: string, targetId: string) => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    setPeople((prev) => {
      const source = prev.find((p) => p.id === sourceId);
      const target = prev.find((p) => p.id === targetId);
      if (!source || !target) return prev;
      const mergedEmails = mergeEmailDedupe(target.emails, source.emails);
      const emailsFinal =
        mergedEmails.length > 0
          ? mergedEmails
          : [{ id: newId(), label: 'اصلی', address: '' }];
      const primaryEmailId =
        target.primaryEmailId && emailsFinal.some((e) => e.id === target.primaryEmailId)
          ? target.primaryEmailId
          : emailsFinal[0].id;
      const mergedGroupMs = [...target.groupMemberships];
      source.groupMemberships.forEach((m) => {
        if (!mergedGroupMs.some((x) => x.groupId === m.groupId && x.levelId === m.levelId)) {
          mergedGroupMs.push({ ...m });
        }
      });
      const mergedBanksRaw = [
        ...target.banks,
        ...source.banks.filter(
          (b) =>
            !target.banks.some(
              (x) =>
                (x.iban && b.iban && x.iban === b.iban) ||
                (x.cardNumber && b.cardNumber && x.cardNumber === b.cardNumber) ||
                (x.accountNumber && b.accountNumber && x.accountNumber === b.accountNumber)
            )
        ),
      ];
      const merged: Person = {
        ...target,
        roles: Array.from(new Set([...target.roles, ...source.roles])),
        categoryIds: Array.from(new Set([...target.categoryIds, ...source.categoryIds])),
        emails: emailsFinal,
        primaryEmailId,
        groupMemberships: mergedGroupMs,
        phones: [...target.phones, ...source.phones.filter((ph) => !target.phones.some((x) => x.number === ph.number))],
        addresses: [...target.addresses, ...source.addresses.filter((a) => !target.addresses.some((x) => x.text === a.text))],
        banks: normalizeBanks(mergedBanksRaw),
        importantDates: [...target.importantDates, ...source.importantDates],
        ledger: {
          financial: [...target.ledger.financial, ...source.ledger.financial],
          marketing: [...target.ledger.marketing, ...source.ledger.marketing],
          activity: [...target.ledger.activity, ...source.ledger.activity],
          orders: [...target.ledger.orders, ...source.ledger.orders],
        },
      };
      return prev
        .filter((p) => p.id !== sourceId)
        .map((p) => (p.id === targetId ? normalizePerson(merged, priceListIds) : p));
    });
    setReceipts((prev) =>
      prev.map((doc) => ({
        ...doc,
        lines: doc.lines.map((line) => (line.personId === sourceId ? { ...line, personId: targetId } : line)),
      }))
    );
    setPayments((prev) =>
      prev.map((doc) => ({
        ...doc,
        lines: doc.lines.map((line) => (line.personId === sourceId ? { ...line, personId: targetId } : line)),
      }))
    );
    setShareholders((prev) =>
      prev
        .map((x) => (x.personId === sourceId ? { ...x, personId: targetId } : x))
        .filter((row, idx, arr) => arr.findIndex((x) => x.personId === row.personId) === idx)
    );
    setVendors((prev) =>
      prev
        .map((x) => (x.personId === sourceId ? { ...x, personId: targetId } : x))
        .filter((row, idx, arr) => arr.findIndex((x) => x.personId === row.personId) === idx)
    );
  }, [priceListIds]);

  const value = useMemo<CatalogContextValue>(
    () => ({
      people,
      products,
      receipts,
      payments,
      shareholders,
      vendors,
      priceLists,
      personCategories,
      personGroups,
      upsertPersonGroup,
      removePersonGroup,
      upsertPriceList,
      removePriceList,
      productCategories,
      replacePerson,
      addPerson,
      removePerson,
      addReceipt,
      replaceReceipt,
      removeReceipt,
      addPayment,
      replacePayment,
      removePayment,
      addShareholder,
      replaceShareholder,
      removeShareholder,
      addVendor,
      replaceVendor,
      removeVendor,
      addProduct,
      replaceProduct,
      removeProduct,
      addPersonCategory,
      upsertPersonCategory,
      removePersonCategory,
      reorderPersonCategories,
      upsertProductCategory,
      removeProductCategory,
      reorderProductCategories,
      mergePeople,
      generateAccountingCode,
      generateProductAccountingCode,
      listDuplicates,
      findDuplicate,
    }),
    [
      people,
      products,
      receipts,
      payments,
      shareholders,
      vendors,
      priceLists,
      personCategories,
      personGroups,
      upsertPersonGroup,
      removePersonGroup,
      upsertPriceList,
      removePriceList,
      productCategories,
      replacePerson,
      addPerson,
      removePerson,
      addReceipt,
      replaceReceipt,
      removeReceipt,
      addPayment,
      replacePayment,
      removePayment,
      addShareholder,
      replaceShareholder,
      removeShareholder,
      addVendor,
      replaceVendor,
      removeVendor,
      addProduct,
      replaceProduct,
      removeProduct,
      addPersonCategory,
      upsertPersonCategory,
      removePersonCategory,
      reorderPersonCategories,
      upsertProductCategory,
      removeProductCategory,
      reorderProductCategories,
      mergePeople,
      generateAccountingCode,
      generateProductAccountingCode,
      listDuplicates,
      findDuplicate,
    ]
  );

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

function normalizePerson(p: Person, validPriceListIds?: string[]): Person {
  const roles: PersonRole[] =
    Array.isArray(p.roles) && p.roles.length ? p.roles : ['customer'];
  const phones = Array.isArray(p.phones) && p.phones.length ? p.phones : [{ id: newId(), label: 'موبایل', number: '' }];
  const emailsMigrated = migrateEmailsFromStorage((p as { emails?: unknown }).emails);
  const { emails, primaryEmailId } = ensureEmailsAndPrimary(emailsMigrated, p.primaryEmailId);
  const banksNorm = normalizeBanks((p.banks || []) as PersonBankAccount[]);
  let defaultPriceListId = p.defaultPriceListId;
  if (validPriceListIds !== undefined) {
    if (validPriceListIds.length === 0) {
      defaultPriceListId = undefined;
    } else {
      const set = new Set(validPriceListIds);
      if (!defaultPriceListId || !set.has(defaultPriceListId)) {
        defaultPriceListId = validPriceListIds[0];
      }
    }
  }
  return {
    ...p,
    title: p.title || '',
    firstName: p.firstName || '',
    lastName: p.lastName || '',
    accountingCode: p.accountingCode || String(Math.max(10001, Number(p.id) + 10000 || 10001)),
    taxProfile: p.taxProfile || 'vat-included',
    roles: [...roles],
    emails: emails.map((e) => ({ ...e })),
    primaryEmailId,
    defaultPriceListId,
    categoryIds: [...(p.categoryIds || [])],
    groupMemberships: (p.groupMemberships || []).map((m) => ({ ...m })),
    addresses: (p.addresses || []).map((a) => ({ ...a })),
    phones: phones.map((ph) => ({ ...ph })),
    primaryPhoneId: p.primaryPhoneId || phones[0]?.id,
    banks: banksNorm,
    importantDates: (p.importantDates || []).map((d) => ({ ...d })),
    ledger: {
      financial: (p.ledger?.financial || []).map((x) => ({ ...x })),
      marketing: (p.ledger?.marketing || []).map((x) => ({ ...x })),
      activity: (p.ledger?.activity || []).map((x) => ({ ...x })),
      orders: (p.ledger?.orders || []).map((x) => ({ ...x })),
    },
  };
}

function cloneMoneyDoc(doc: MoneyDocument): MoneyDocument {
  return {
    ...doc,
    lines: doc.lines.map((line) => ({ ...line })),
    notes: [...(doc.notes || [])],
    attachments: (doc.attachments || []).map((att) => ({ ...att })),
    history: (doc.history || []).map((event) => ({ ...event })),
  };
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error('useCatalog must be used within CatalogProvider');
  }
  return ctx;
}

export { newId };
