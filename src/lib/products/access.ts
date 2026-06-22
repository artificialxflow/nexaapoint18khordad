import type { NextRequest } from 'next/server';
import {
  assertCanManageBusiness,
  requireBusinessAccess,
  type BusinessAccess,
} from '@/src/lib/business/access';

export type ProductsAccess = BusinessAccess;

export async function requireProductsAccess(
  req: NextRequest,
  businessId: string
): Promise<ProductsAccess> {
  return requireBusinessAccess(req, businessId);
}

export async function requireProductsManagerAccess(
  req: NextRequest,
  businessId: string
): Promise<ProductsAccess> {
  const access = await requireProductsAccess(req, businessId);
  assertCanManageBusiness(access.memberRole);
  return access;
}

export { assertCanManageBusiness, assertOwner } from '@/src/lib/business/access';
