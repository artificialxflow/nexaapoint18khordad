import type { Person, PriceList } from '@/src/types/person';
import type { Product } from '@/src/types/product';

/** نرمال‌سازی برای مقایسهٔ شماره موبایل */
export function normalizePhone(input: string): string {
  const d = input.replace(/\s/g, '').replace(/[\u06F0-\u06F9]/g, (c) =>
    String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))
  );
  const ascii = d.replace(/[۰-۹]/g, (c) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)));
  let x = ascii.replace(/[^0-9]/g, '');
  if (x.startsWith('98')) x = '0' + x.slice(2);
  if (x.length === 10 && !x.startsWith('0')) x = '0' + x;
  return x;
}

export function formatToman(n: number): string {
  return n.toLocaleString('fa-IR');
}

export function isValidIranNationalId(input: string): boolean {
  const normalized = input.replace(/[^\d۰-۹]/g, '').replace(/[۰-۹]/g, (c) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)));
  if (!/^\d{10}$/.test(normalized)) return false;
  if (/^(\d)\1{9}$/.test(normalized)) return false;
  const check = Number(normalized[9]);
  const sum = normalized
    .slice(0, 9)
    .split('')
    .reduce((acc, d, i) => acc + Number(d) * (10 - i), 0);
  const rem = sum % 11;
  return (rem < 2 && check === rem) || (rem >= 2 && check === 11 - rem);
}

export function isValidIban(input: string): boolean {
  const raw = input.trim().toUpperCase().replace(/\s/g, '');
  if (!/^IR\d{24}$/.test(raw)) return false;
  const rearranged = `${raw.slice(4)}${raw.slice(0, 4)}`;
  const expanded = rearranged.replace(/[A-Z]/g, (ch) => String(ch.charCodeAt(0) - 55));
  let remainder = 0;
  for (const digit of expanded) remainder = (remainder * 10 + Number(digit)) % 97;
  return remainder === 1;
}

export function isValidCardNumber(input: string): boolean {
  const digits = input.replace(/[^\d۰-۹]/g, '').replace(/[۰-۹]/g, (c) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)));
  if (!/^\d{16}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    let n = Number(digits[i]);
    if (i % 2 === 0) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

/**
 * انتخاب قیمت نمایشی برای یک کالا و شخص بر اساس لیست قیمت پیش‌فرض شخص.
 */
export function getPriceForPerson(
  product: Product,
  person: Person | null | undefined,
  priceLists: PriceList[]
): { priceListId: string; amount: number; label: string } {
  const firstId = priceLists[0]?.id ?? '';
  const preferredId = person?.defaultPriceListId;
  const pl =
    (preferredId ? priceLists.find((p) => p.id === preferredId) : undefined) ?? priceLists[0];
  const priceListId = pl?.id ?? firstId;
  const amount = priceListId ? product.prices[priceListId] ?? 0 : 0;
  return { priceListId, amount, label: pl?.name ?? priceLists[0]?.name ?? 'قیمت' };
}

/**
 * قیمت ردیف فاکتور: اگر لیست قیمت روی فاکتور انتخاب شده باشد همان ستون کالا؛ وگرنه پیش‌فرض شخص.
 */
export function getProductPriceForInvoice(
  product: Product,
  person: Person | null | undefined,
  priceLists: PriceList[],
  invoicePriceListId?: string
): { priceListId: string; amount: number; label: string } {
  if (invoicePriceListId && priceLists.some((p) => p.id === invoicePriceListId)) {
    const pl = priceLists.find((p) => p.id === invoicePriceListId)!;
    return {
      priceListId: invoicePriceListId,
      amount: product.prices[invoicePriceListId] ?? 0,
      label: pl.name,
    };
  }
  return getPriceForPerson(product, person, priceLists);
}
