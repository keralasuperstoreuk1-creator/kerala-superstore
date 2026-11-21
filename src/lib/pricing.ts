import { Product } from '@/types';

export interface DisplayPricing {
  sellingPrice: number;
  cutPrice?: number;
  discountPercent: number;
  hasDiscount: boolean;
  savings: number;
}

/**
 * Display pricing that matches what the basket charges (offerPrice ?? price).
 * A struck-through "was" price is shown ONLY when the product has a genuine
 * offer price below its normal price — never an invented reference price
 * (UK DMCC Act 2024 / CMA pricing rules).
 */
export function getProductDisplayPricing(product: Product): DisplayPricing {
  const price = Number(product.price) || 0;
  const offer = product.offerPrice != null ? Number(product.offerPrice) : undefined;

  if (price > 0 && offer !== undefined && offer > 0 && offer < price) {
    const savings = Math.round((price - offer) * 100) / 100;
    return {
      sellingPrice: offer,
      cutPrice: price,
      discountPercent: Math.round((savings / price) * 100),
      hasDiscount: true,
      savings,
    };
  }

  return { sellingPrice: price, cutPrice: undefined, discountPercent: 0, hasDiscount: false, savings: 0 };
}
