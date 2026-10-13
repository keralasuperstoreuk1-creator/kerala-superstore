import { Product } from '@/types';

export interface DisplayPricing {
  sellingPrice: number;
  cutPrice?: number;
  discountPercent: number;
  hasDiscount: boolean;
  savings: number;
}

/**
 * Computes display pricing for products:
 * - sellingPrice: Exactly the physical POS price (£)
 * - cutPrice: A struck-through Was/RRP price that is 5% to 9% higher than the POS price
 * - discountPercent: The percentage saved (5% to 9%)
 * - hasDiscount: True when cutPrice > sellingPrice
 * - savings: The difference in £ between cutPrice and sellingPrice
 */
export function getProductDisplayPricing(product: Product): DisplayPricing {
  const sellingPrice = Number(product.price) || 0;
  if (sellingPrice <= 0) {
    return {
      sellingPrice: 0,
      cutPrice: undefined,
      discountPercent: 0,
      hasDiscount: false,
      savings: 0,
    };
  }

  // Deterministic seed based on product id and name (stable 5% - 9% markup)
  const seedString = (product.id || '') + (product.name || '');
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash * 31 + seedString.charCodeAt(i)) % 1000;
  }
  // Generates 5%, 6%, 7%, 8%, or 9%
  const markupPercent = 5 + (Math.abs(hash) % 5);

  // Calculate cutPrice (Was / RRP) 5-9% higher
  let cutPrice = Math.round(sellingPrice * (1 + markupPercent / 100) * 100) / 100;

  // Guarantee cut price is visibly higher (at least +£0.15)
  if (cutPrice <= sellingPrice + 0.10) {
    cutPrice = Math.round((sellingPrice + 0.20) * 100) / 100;
  }

  const discountPercent = Math.round(((cutPrice - sellingPrice) / cutPrice) * 100);
  const savings = Math.max(0, Math.round((cutPrice - sellingPrice) * 100) / 100);

  return {
    sellingPrice,
    cutPrice,
    discountPercent: Math.max(discountPercent, markupPercent),
    hasDiscount: cutPrice > sellingPrice,
    savings,
  };
}
