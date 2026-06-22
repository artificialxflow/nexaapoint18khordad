import { NextRequest } from 'next/server';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireProductsAccess, requireProductsManagerAccess } from '@/src/lib/products/access';
import { createCategorySchema } from '@/src/lib/products/schemas';
import { createCategory, loadCatalogSnapshot } from '@/src/lib/products/server';

type RouteParams = { params: Promise<{ businessId: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    await requireProductsAccess(req, businessId);
    const snapshot = await loadCatalogSnapshot(businessId);
    return jsonOk({ categories: snapshot.productCategories });
  } catch (err) {
    return handleAuthRouteError(err, 'products.categories.list');
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    await requireProductsManagerAccess(req, businessId);
    const body = createCategorySchema.parse(await req.json());
    const category = await createCategory(businessId, body);
    return jsonOk({ category }, { status: 201 });
  } catch (err) {
    return handleAuthRouteError(err, 'products.categories.create');
  }
}
