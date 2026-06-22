import { NextRequest } from 'next/server';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireProductsManagerAccess } from '@/src/lib/products/access';
import { bulkUpdatePricesSchema } from '@/src/lib/products/schemas';
import { bulkUpdateProductPrices } from '@/src/lib/products/server';

type RouteParams = { params: Promise<{ businessId: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    await requireProductsManagerAccess(req, businessId);
    const body = bulkUpdatePricesSchema.parse(await req.json());
    const product = await bulkUpdateProductPrices(businessId, body);
    return jsonOk({ product });
  } catch (err) {
    return handleAuthRouteError(err, 'products.prices.update');
  }
}
