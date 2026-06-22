import { z } from 'zod';

const productTypeSchema = z.enum(['goods', 'services']);
const productStatusSchema = z.enum(['active', 'inactive']);
const priceListTierSchema = z.enum(['retail', 'wholesale', 'partner']);

const productUnitsSchema = z.object({
  main: z.string().default('عدد'),
  hasSecondary: z.boolean().default(false),
  secondary: z.string().optional(),
  conversionFactor: z.number().optional(),
});

const productInventorySchema = z.object({
  trackStock: z.boolean().default(false),
  reorderPoint: z.number().default(0),
  minOrder: z.number().default(0),
  leadTimeDays: z.number().default(0),
});

const productTaxSchema = z.object({
  hasSalesTax: z.boolean().default(false),
  salesTaxRate: z.number().default(0),
  hasPurchaseTax: z.boolean().default(false),
  purchaseTaxRate: z.number().default(0),
  taxType: z.string().default(''),
  taxCode: z.string().optional(),
  taxUnit: z.string().optional(),
});

const productImagesSchema = z.object({
  main: z.string().optional(),
  gallery: z.array(z.string()).default([]),
});

export const createPriceListSchema = z.object({
  name: z.string().trim().min(1).max(120),
  tier: priceListTierSchema.optional(),
});

export const updatePriceListSchema = createPriceListSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  parentId: z.string().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const reorderCategoriesSchema = z.object({
  orderedIds: z.array(z.string()).min(1),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(200),
  code: z.string().trim().max(80).optional(),
  type: productTypeSchema.default('goods'),
  categoryIds: z.array(z.string()).default([]),
  barcode: z.string().trim().max(80).optional(),
  images: productImagesSchema.optional(),
  salesDescription: z.string().optional(),
  purchaseDescription: z.string().optional(),
  prices: z.record(z.number()).default({}),
  purchasePrice: z.number().int().min(0).default(0),
  units: productUnitsSchema.optional(),
  inventory: productInventorySchema.optional(),
  tax: productTaxSchema.optional(),
  status: productStatusSchema.default('active'),
});

export const updateProductSchema = createProductSchema.partial();

export const bulkUpdatePricesSchema = z.object({
  productId: z.string(),
  prices: z.record(z.number()),
});

export const listProductsQuerySchema = z.object({
  q: z.string().optional(),
  type: productTypeSchema.optional(),
  status: productStatusSchema.optional(),
});
