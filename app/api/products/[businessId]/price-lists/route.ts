import { NextRequest } from 'next/server';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireProductsAccess, requireProductsManagerAccess } from '@/src/lib/products/access';
import { createPriceListSchema } from '@/src/lib/products/schemas';
import { createPriceList, loadCatalogSnapshot } from '@/src/lib/products/server';

type RouteParams = { params: Promise<{ businessId: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    await requireProductsAccess(req, businessId);
    const snapshot = await loadCatalogSnapshot(businessId);
    return jsonOk({ priceLists: snapshot.priceLists });
  } catch (err) {
    return handleAuthRouteError(err, 'products.price-lists.list');
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    await requireProductsManagerAccess(req, businessId);
    const body = createPriceListSchema.parse(await req.json());
    const priceList = await createPriceList(businessId, body);
    return jsonOk({ priceList }, { status: 201 });
  } catch (err) {
    return handleAuthRouteError(err, 'products.price-lists.create');
  }
}
