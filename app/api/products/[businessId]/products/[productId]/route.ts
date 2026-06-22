import { NextRequest } from 'next/server';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireProductsManagerAccess } from '@/src/lib/products/access';
import { updateProductSchema } from '@/src/lib/products/schemas';
import { deleteProduct, updateProduct } from '@/src/lib/products/server';

type RouteParams = { params: Promise<{ businessId: string; productId: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId, productId } = await params;
    await requireProductsManagerAccess(req, businessId);
    const body = updateProductSchema.parse(await req.json());
    const product = await updateProduct(businessId, productId, body);
    return jsonOk({ product });
  } catch (err) {
    return handleAuthRouteError(err, 'products.products.update');
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId, productId } = await params;
    await requireProductsManagerAccess(req, businessId);
    await deleteProduct(businessId, productId);
    return jsonOk({ deleted: true });
  } catch (err) {
    return handleAuthRouteError(err, 'products.products.delete');
  }
}
