/**
 * Products catalog smoke — stage 2.
 * Usage: npm run dev then npm run test:products
 */

import { PrismaClient } from '@prisma/client';

const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';
const BOOTSTRAP_USER = process.env.SMOKE_BOOTSTRAP_USER ?? 'artificialxflow';
const BOOTSTRAP_PASS = process.env.SMOKE_BOOTSTRAP_PASS ?? 'Ronak#123Ronak';
const TEST_PREFIX = 'test_products_';

const prisma = new PrismaClient();

type StepResult = { name: string; ok: boolean; detail?: string };
const results: StepResult[] = [];

function pass(name: string, detail?: string) {
  results.push({ name, ok: true, detail });
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name: string, detail?: string) {
  results.push({ name, ok: false, detail });
  console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
}

function parseCookie(setCookie: string | null): string {
  if (!setCookie) return '';
  return setCookie.split(';')[0] ?? '';
}

async function fetchJson(
  path: string,
  init: RequestInit & { cookie?: string } = {}
): Promise<{ res: Response; json: Record<string, unknown> }> {
  const headers = new Headers(init.headers);
  if (init.cookie) headers.set('Cookie', init.cookie);
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  let json: Record<string, unknown> = {};
  try {
    json = (await res.json()) as Record<string, unknown>;
  } catch {
    json = {};
  }
  return { res, json };
}

async function cleanup() {
  await prisma.business.deleteMany({ where: { name: { startsWith: TEST_PREFIX } } });
}

async function main() {
  console.log(`\n[products-smoke] base=${BASE}\n`);

  let cookie = '';
  let businessId = '';
  let priceListId = '';
  let categoryId = '';
  let productId = '';
  const productName = `${TEST_PREFIX}item_${Date.now()}`;

  try {
    await cleanup();

    const login = await fetchJson('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: BOOTSTRAP_USER, password: BOOTSTRAP_PASS }),
    });
    cookie = parseCookie(login.res.headers.get('set-cookie'));
    const loginData = login.json.data as { user?: { id: string } } | undefined;
    if (login.res.ok && cookie && loginData?.user?.id) pass('login bootstrap', loginData.user.id);
    else fail('login bootstrap', `status=${login.res.status}`);

    const createBiz = await fetchJson('/api/businesses', {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `${TEST_PREFIX}${Date.now()}` }),
    });
    const bizData = createBiz.json.data as { business?: { id: string } } | undefined;
    businessId = bizData?.business?.id ?? '';
    if (createBiz.res.ok && businessId) pass('POST /api/businesses', businessId);
    else fail('POST /api/businesses');

    const snapshot = await fetchJson(`/api/products/${businessId}/catalog`, { cookie });
    const snapData = snapshot.json.data as { products?: unknown[]; priceLists?: unknown[] } | undefined;
    if (snapshot.res.ok && Array.isArray(snapData?.products) && snapData.products.length === 0) {
      pass('GET catalog (empty)', '0 products');
    } else {
      fail('GET catalog (empty)', `status=${snapshot.res.status} count=${snapData?.products?.length ?? '?'}`);
    }

    const pl = await fetchJson(`/api/products/${businessId}/price-lists`, {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'لیست تست', tier: 'retail' }),
    });
    const plData = pl.json.data as { priceList?: { id: string } } | undefined;
    priceListId = plData?.priceList?.id ?? '';
    if (pl.res.ok && priceListId) pass('POST price-lists', priceListId);
    else fail('POST price-lists');

    const cat = await fetchJson(`/api/products/${businessId}/categories`, {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'دسته تست' }),
    });
    const catData = cat.json.data as { category?: { id: string } } | undefined;
    categoryId = catData?.category?.id ?? '';
    if (cat.res.ok && categoryId) pass('POST categories', categoryId);
    else fail('POST categories');

    const createProduct = await fetchJson(`/api/products/${businessId}/products`, {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: productName,
        code: 'QA_V12_CODE',
        type: 'goods',
        categoryIds: [categoryId],
        prices: { [priceListId]: 1250000 },
        purchasePrice: 900000,
        status: 'active',
      }),
    });
    const prodData = createProduct.json.data as {
      product?: { id: string; accountingCode: string; name: string };
    } | undefined;
    productId = prodData?.product?.id ?? '';
    if (createProduct.res.ok && productId && prodData?.product?.name === productName) {
      pass('POST products', `${prodData.product.accountingCode}`);
    } else {
      fail('POST products', `status=${createProduct.res.status}`);
    }

    const list = await fetchJson(`/api/products/${businessId}/products?q=${encodeURIComponent(TEST_PREFIX)}`, {
      cookie,
    });
    const listData = list.json.data as { products?: { id: string; name: string }[] } | undefined;
    if (list.res.ok && listData?.products?.some((p) => p.id === productId)) {
      pass('GET products search', `${listData.products.length} hit(s)`);
    } else {
      fail('GET products search');
    }

    const patch = await fetchJson(`/api/products/${businessId}/products/${productId}`, {
      method: 'PATCH',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `${productName}_updated` }),
    });
    const patchData = patch.json.data as { product?: { name: string } } | undefined;
    if (patch.res.ok && patchData?.product?.name === `${productName}_updated`) {
      pass('PATCH product');
    } else {
      fail('PATCH product');
    }

    const pricePatch = await fetchJson(`/api/products/${businessId}/prices`, {
      method: 'PATCH',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, prices: { [priceListId]: 1300000 } }),
    });
    const priceData = pricePatch.json.data as { product?: { prices?: Record<string, number> } } | undefined;
    if (pricePatch.res.ok && priceData?.product?.prices?.[priceListId] === 1300000) {
      pass('PATCH prices');
    } else {
      fail('PATCH prices');
    }

    const dbRow = await prisma.catalogProduct.findFirst({ where: { id: productId, businessId } });
    if (dbRow && dbRow.name === `${productName}_updated`) pass('DB CatalogProduct persisted');
    else fail('DB CatalogProduct persisted');

    const snapshot2 = await fetchJson(`/api/products/${businessId}/catalog`, { cookie });
    const snap2 = snapshot2.json.data as { products?: unknown[] } | undefined;
    if (snapshot2.res.ok && (snap2?.products?.length ?? 0) >= 1) {
      pass('GET catalog (with data)', `${snap2?.products?.length} product(s)`);
    } else {
      fail('GET catalog (with data)');
    }
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n[products-smoke] ${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error('[products-smoke] fatal', err);
  process.exit(1);
});
