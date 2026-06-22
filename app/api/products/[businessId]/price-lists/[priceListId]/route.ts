import { NextRequest } from 'next/server';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireProductsManagerAccess } from '@/src/lib/products/access';
import { updatePriceListSchema } from '@/src/lib/products/schemas';
import { deletePriceList, updatePriceList } from '@/src/lib/products/server';

type RouteParams = { params: Promise<{ businessId: string; priceListId: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId, priceListId } = await params;
    await requireProductsManagerAccess(req, businessId);
    const body = updatePriceListSchema.parse(await req.json());
    const priceList = await updatePriceList(businessId, priceListId, body);
    return jsonOk({ priceList });
  } catch (err) {
    return handleAuthRouteError(err, 'products.price-lists.update');
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId, priceListId } = await params;
    await requireProductsManagerAccess(req, businessId);
    await deletePriceList(businessId, priceListId);
    return jsonOk({ deleted: true });
  } catch (err) {
    return handleAuthRouteError(err, 'products.price-lists.delete');
  }
}
