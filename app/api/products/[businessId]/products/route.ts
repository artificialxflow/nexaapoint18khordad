import { NextRequest } from 'next/server';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireProductsAccess, requireProductsManagerAccess } from '@/src/lib/products/access';
import { createProductSchema, listProductsQuerySchema } from '@/src/lib/products/schemas';
import { createProduct, listProducts } from '@/src/lib/products/server';

type RouteParams = { params: Promise<{ businessId: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    await requireProductsAccess(req, businessId);
    const { searchParams } = new URL(req.url);
    const query = listProductsQuerySchema.parse({
      q: searchParams.get('q') ?? searchParams.get('search') ?? undefined,
      type: searchParams.get('type') ?? undefined,
      status: searchParams.get('status') ?? undefined,
    });
    const products = await listProducts(businessId, query);
    return jsonOk({ products });
  } catch (err) {
    return handleAuthRouteError(err, 'products.products.list');
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    await requireProductsManagerAccess(req, businessId);
    const body = createProductSchema.parse(await req.json());
    const product = await createProduct(businessId, body);
    return jsonOk({ product }, { status: 201 });
  } catch (err) {
    return handleAuthRouteError(err, 'products.products.create');
  }
}
