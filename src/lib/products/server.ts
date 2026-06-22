import type { Prisma } from '@prisma/client';
import { prisma } from '@/src/lib/db/prisma';
import type { Product } from '@/src/types/product';
import {
  serializeCategoryRow,
  serializePriceListRow,
  serializeProductRow,
  type CatalogSnapshot,
} from '@/src/lib/products/serialize';
import type {
  bulkUpdatePricesSchema,
  createCategorySchema,
  createPriceListSchema,
  createProductSchema,
  reorderCategoriesSchema,
  updateCategorySchema,
  updatePriceListSchema,
  updateProductSchema,
} from '@/src/lib/products/schemas';
import type { z } from 'zod';

async function getProductOrThrow(businessId: string, productId: string) {
  const row = await prisma.catalogProduct.findFirst({ where: { id: productId, businessId } });
  if (!row) throw new Error('NOT_FOUND');
  return row;
}

async function getCategoryOrThrow(businessId: string, categoryId: string) {
  const row = await prisma.catalogCategory.findFirst({ where: { id: categoryId, businessId } });
  if (!row) throw new Error('NOT_FOUND');
  return row;
}

async function getPriceListOrThrow(businessId: string, priceListId: string) {
  const row = await prisma.catalogPriceList.findFirst({ where: { id: priceListId, businessId } });
  if (!row) throw new Error('NOT_FOUND');
  return row;
}

async function nextAccountingCode(businessId: string): Promise<string> {
  const last = await prisma.catalogProduct.findFirst({
    where: { businessId },
    orderBy: { accountingCode: 'desc' },
    select: { accountingCode: true },
  });
  const n = Number.parseInt(last?.accountingCode ?? '40000', 10);
  return String(Number.isFinite(n) ? n + 1 : 40001);
}

export async function loadCatalogSnapshot(businessId: string): Promise<CatalogSnapshot> {
  const [priceLists, categories, products] = await Promise.all([
    prisma.catalogPriceList.findMany({ where: { businessId }, orderBy: { sortOrder: 'asc' } }),
    prisma.catalogCategory.findMany({ where: { businessId }, orderBy: { sortOrder: 'asc' } }),
    prisma.catalogProduct.findMany({
      where: { businessId },
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    }),
  ]);

  return {
    priceLists: priceLists.map(serializePriceListRow),
    productCategories: categories.map(serializeCategoryRow),
    products: products.map(serializeProductRow),
  };
}

export async function listProducts(
  businessId: string,
  opts: { q?: string; type?: 'goods' | 'services'; status?: 'active' | 'inactive' }
) {
  const where: Prisma.CatalogProductWhereInput = { businessId };
  if (opts.type) where.type = opts.type;
  if (opts.status) where.status = opts.status;
  const q = opts.q?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { code: { contains: q, mode: 'insensitive' } },
      { barcode: { contains: q, mode: 'insensitive' } },
      { accountingCode: { contains: q, mode: 'insensitive' } },
    ];
  }
  const rows = await prisma.catalogProduct.findMany({
    where,
    orderBy: [{ status: 'asc' }, { name: 'asc' }],
  });
  return rows.map(serializeProductRow);
}

export async function createPriceList(
  businessId: string,
  input: z.infer<typeof createPriceListSchema>
) {
  const count = await prisma.catalogPriceList.count({ where: { businessId } });
  const row = await prisma.catalogPriceList.create({
    data: {
      businessId,
      name: input.name.trim(),
      tier: input.tier ?? null,
      sortOrder: count,
    },
  });
  return serializePriceListRow(row);
}

export async function updatePriceList(
  businessId: string,
  priceListId: string,
  input: z.infer<typeof updatePriceListSchema>
) {
  await getPriceListOrThrow(businessId, priceListId);
  const row = await prisma.catalogPriceList.update({
    where: { id: priceListId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.tier !== undefined ? { tier: input.tier ?? null } : {}),
    },
  });
  return serializePriceListRow(row);
}

export async function deletePriceList(businessId: string, priceListId: string) {
  await getPriceListOrThrow(businessId, priceListId);
  await prisma.catalogPriceList.delete({ where: { id: priceListId } });
}

export async function createCategory(
  businessId: string,
  input: z.infer<typeof createCategorySchema>
) {
  if (input.parentId) await getCategoryOrThrow(businessId, input.parentId);
  const count = await prisma.catalogCategory.count({ where: { businessId } });
  const row = await prisma.catalogCategory.create({
    data: {
      businessId,
      name: input.name.trim(),
      parentId: input.parentId ?? null,
      sortOrder: count,
    },
  });
  return serializeCategoryRow(row);
}

export async function updateCategory(
  businessId: string,
  categoryId: string,
  input: z.infer<typeof updateCategorySchema>
) {
  await getCategoryOrThrow(businessId, categoryId);
  if (input.parentId) await getCategoryOrThrow(businessId, input.parentId);
  const row = await prisma.catalogCategory.update({
    where: { id: categoryId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.parentId !== undefined ? { parentId: input.parentId ?? null } : {}),
    },
  });
  return serializeCategoryRow(row);
}

export async function deleteCategory(businessId: string, categoryId: string) {
  await getCategoryOrThrow(businessId, categoryId);
  await prisma.catalogCategory.updateMany({
    where: { businessId, parentId: categoryId },
    data: { parentId: null },
  });
  await prisma.catalogCategory.delete({ where: { id: categoryId } });
}

export async function reorderCategories(
  businessId: string,
  input: z.infer<typeof reorderCategoriesSchema>
) {
  await prisma.$transaction(
    input.orderedIds.map((id, sortOrder) =>
      prisma.catalogCategory.updateMany({
        where: { id, businessId },
        data: { sortOrder },
      })
    )
  );
  const rows = await prisma.catalogCategory.findMany({
    where: { businessId },
    orderBy: { sortOrder: 'asc' },
  });
  return rows.map(serializeCategoryRow);
}

export async function createProduct(
  businessId: string,
  input: z.infer<typeof createProductSchema>
): Promise<Product> {
  const accountingCode = await nextAccountingCode(businessId);
  const row = await prisma.catalogProduct.create({
    data: {
      businessId,
      accountingCode,
      name: input.name.trim(),
      code: input.code?.trim() ?? '',
      type: input.type,
      categoryIds: input.categoryIds,
      barcode: input.barcode?.trim() || null,
      images: input.images ?? { gallery: [] },
      salesDescription: input.salesDescription ?? null,
      purchaseDescription: input.purchaseDescription ?? null,
      prices: input.prices,
      purchasePrice: input.purchasePrice,
      units: input.units ?? { main: 'عدد', hasSecondary: false },
      inventory: input.inventory ?? {
        trackStock: false,
        reorderPoint: 0,
        minOrder: 0,
        leadTimeDays: 0,
      },
      tax: input.tax ?? {
        hasSalesTax: false,
        salesTaxRate: 0,
        hasPurchaseTax: false,
        purchaseTaxRate: 0,
        taxType: '',
      },
      status: input.status,
    },
  });
  return serializeProductRow(row);
}

export async function updateProduct(
  businessId: string,
  productId: string,
  input: z.infer<typeof updateProductSchema>
): Promise<Product> {
  await getProductOrThrow(businessId, productId);
  const row = await prisma.catalogProduct.update({
    where: { id: productId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.code !== undefined ? { code: input.code.trim() } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.categoryIds !== undefined ? { categoryIds: input.categoryIds } : {}),
      ...(input.barcode !== undefined ? { barcode: input.barcode?.trim() || null } : {}),
      ...(input.images !== undefined ? { images: input.images } : {}),
      ...(input.salesDescription !== undefined ? { salesDescription: input.salesDescription ?? null } : {}),
      ...(input.purchaseDescription !== undefined
        ? { purchaseDescription: input.purchaseDescription ?? null }
        : {}),
      ...(input.prices !== undefined ? { prices: input.prices } : {}),
      ...(input.purchasePrice !== undefined ? { purchasePrice: input.purchasePrice } : {}),
      ...(input.units !== undefined ? { units: input.units } : {}),
      ...(input.inventory !== undefined ? { inventory: input.inventory } : {}),
      ...(input.tax !== undefined ? { tax: input.tax } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
  });
  return serializeProductRow(row);
}

export async function deleteProduct(businessId: string, productId: string) {
  await getProductOrThrow(businessId, productId);
  await prisma.catalogProduct.delete({ where: { id: productId } });
}

export async function bulkUpdateProductPrices(
  businessId: string,
  input: z.infer<typeof bulkUpdatePricesSchema>
): Promise<Product> {
  const row = await getProductOrThrow(businessId, input.productId);
  const merged = {
    ...(typeof row.prices === 'object' && row.prices && !Array.isArray(row.prices)
      ? (row.prices as Record<string, number>)
      : {}),
    ...input.prices,
  };
  const updated = await prisma.catalogProduct.update({
    where: { id: input.productId },
    data: { prices: merged },
  });
  return serializeProductRow(updated);
}
