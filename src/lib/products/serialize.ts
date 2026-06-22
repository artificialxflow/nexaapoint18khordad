import type {
  CatalogCategory as CatalogCategoryRow,
  CatalogPriceList as CatalogPriceListRow,
  CatalogProduct as CatalogProductRow,
} from '@prisma/client';
import type { PriceList } from '@/src/types/person';
import type { Product, ProductCategory } from '@/src/types/product';

function jsonArray(value: unknown): string[] {
  return Array.isArray(value) ? [...(value as string[])] : [];
}

function jsonRecord(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
  }
  return out;
}

function jsonObject<T extends Record<string, unknown>>(value: unknown, fallback: T): T {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
  return { ...fallback, ...(value as T) };
}

export type CatalogSnapshot = {
  products: Product[];
  productCategories: ProductCategory[];
  priceLists: PriceList[];
};

export function serializePriceListRow(row: CatalogPriceListRow): PriceList {
  return {
    id: row.id,
    name: row.name,
    ...(row.tier ? { tier: row.tier } : {}),
  };
}

export function serializeCategoryRow(row: CatalogCategoryRow): ProductCategory {
  return {
    id: row.id,
    name: row.name,
    ...(row.parentId ? { parentId: row.parentId } : {}),
  };
}

export function serializeProductRow(row: CatalogProductRow): Product {
  return {
    id: row.id,
    accountingCode: row.accountingCode,
    name: row.name,
    code: row.code,
    type: row.type,
    categoryIds: jsonArray(row.categoryIds),
    barcode: row.barcode ?? undefined,
    images: jsonObject(row.images, { gallery: [] }),
    salesDescription: row.salesDescription ?? undefined,
    purchaseDescription: row.purchaseDescription ?? undefined,
    prices: jsonRecord(row.prices),
    purchasePrice: row.purchasePrice,
    units: jsonObject(row.units, { main: 'عدد', hasSecondary: false }),
    inventory: jsonObject(row.inventory, {
      trackStock: false,
      reorderPoint: 0,
      minOrder: 0,
      leadTimeDays: 0,
    }),
    tax: jsonObject(row.tax, {
      hasSalesTax: false,
      salesTaxRate: 0,
      hasPurchaseTax: false,
      purchaseTaxRate: 0,
      taxType: '',
    }),
    status: row.status,
  };
}
