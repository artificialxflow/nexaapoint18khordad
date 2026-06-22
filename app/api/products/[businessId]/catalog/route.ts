import { NextRequest } from 'next/server';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireProductsAccess } from '@/src/lib/products/access';
import { loadCatalogSnapshot } from '@/src/lib/products/server';

type RouteParams = { params: Promise<{ businessId: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    await requireProductsAccess(req, businessId);
    const snapshot = await loadCatalogSnapshot(businessId);
    return jsonOk(snapshot);
  } catch (err) {
    return handleAuthRouteError(err, 'products.catalog.snapshot');
  }
}
