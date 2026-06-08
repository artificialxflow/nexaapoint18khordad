export type ProductType = 'goods' | 'services';

export interface ProductCategory {
  id: string;
  name: string;
  parentId?: string;
}

export interface ProductUnits {
  main: string;
  hasSecondary: boolean;
  secondary?: string;
  conversionFactor?: number;
}

export interface ProductInventory {
  trackStock: boolean;
  reorderPoint: number;
  minOrder: number;
  leadTimeDays: number;
}

export interface ProductTax {
  hasSalesTax: boolean;
  salesTaxRate: number;
  hasPurchaseTax: boolean;
  purchaseTaxRate: number;
  taxType: string;
  taxCode?: string;
  taxUnit?: string;
}

export interface ProductImages {
  main?: string;
  gallery: string[];
}

export interface Product {
  id: string;
  /** کد حسابداری یکتا، auto-generated، غیرقابل ویرایش پس از ثبت */
  accountingCode: string;
  name: string;
  code: string;
  type: ProductType;
  categoryIds: string[];
  barcode?: string;
  images: ProductImages;
  salesDescription?: string;
  purchaseDescription?: string;
  /** priceListId → مبلغ به تومان (قیمت‌های فروش) */
  prices: Record<string, number>;
  /** قیمت خرید به تومان */
  purchasePrice: number;
  units: ProductUnits;
  inventory: ProductInventory;
  tax: ProductTax;
  status: 'active' | 'inactive';
}
