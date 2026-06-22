import { NextRequest } from 'next/server';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireProductsManagerAccess } from '@/src/lib/products/access';
import { updateCategorySchema } from '@/src/lib/products/schemas';
import { deleteCategory, updateCategory } from '@/src/lib/products/server';

type RouteParams = { params: Promise<{ businessId: string; categoryId: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId, categoryId } = await params;
    await requireProductsManagerAccess(req, businessId);
    const body = updateCategorySchema.parse(await req.json());
    const category = await updateCategory(businessId, categoryId, body);
    return jsonOk({ category });
  } catch (err) {
    return handleAuthRouteError(err, 'products.categories.update');
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId, categoryId } = await params;
    await requireProductsManagerAccess(req, businessId);
    await deleteCategory(businessId, categoryId);
    return jsonOk({ deleted: true });
  } catch (err) {
    return handleAuthRouteError(err, 'products.categories.delete');
  }
}
