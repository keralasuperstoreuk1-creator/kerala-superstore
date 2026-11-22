'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { X, Minus, Check } from 'lucide-react';
import { Category, Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { matchProductToCategory, matchProductToVariety } from '@/lib/product-matching';
import { getProductDisplayPricing } from '@/lib/pricing';
import { displayName } from '@/components/ProductCard';
import { HandBasket, HandPlus } from '@/components/home/HandIcons';

interface CategoryQuickShopModalProps {
  category: Category | null;
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onOpenProductDetails?: (product: Product) => void;
}

const FALLBACK_IMG = '/products/matta-rice.png';
const TAG_TILTS = ['-3deg', '2deg', '-1.5deg', '2.5deg', '-2deg'];

const chipClass = (active: boolean) =>
  `h-9 px-3.5 rounded-full text-[13px] font-bold whitespace-nowrap shrink-0 cursor-pointer border transition-colors ${
    active ? 'bg-shop-green border-shop-green text-white' : 'bg-white border-shop-line text-shop-ink hover:border-shop-green'
  }`;

export const CategoryQuickShopModal: React.FC<CategoryQuickShopModalProps> = ({
  category,
  isOpen,
  onClose,
  products,
  onOpenProductDetails,
}) => {
  const { cart, addToCart, updateQuantity, totalItems, subtotal, setIsCartOpen } = useCart();
  const [selectedVariety, setSelectedVariety] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  // Fresh filters each time another department is opened.
  const [shownCategoryId, setShownCategoryId] = useState(category?.id);
  if (category?.id !== shownCategoryId) {
    setShownCategoryId(category?.id);
    setSelectedVariety(null);
    setSelectedBrand(null);
  }

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const categoryProducts = useMemo(() => {
    if (!category) return [];
    const cSlug = (category.slug || '').toLowerCase().trim();
    const cName = (category.name || '').toLowerCase().trim();
    return products.filter((p) => matchProductToCategory(p, cSlug) || matchProductToCategory(p, cName));
  }, [category, products]);

  const varietyProducts = useMemo(() => {
    if (!selectedVariety || selectedVariety === 'All' || selectedVariety === 'All Varieties') return categoryProducts;
    return categoryProducts.filter((p) => matchProductToVariety(p, selectedVariety));
  }, [categoryProducts, selectedVariety]);

  const brandCounts = useMemo(() => {
    const map: Record<string, number> = {};
    varietyProducts.forEach((p) => {
      const b = p.brand || 'Kerala Superstore';
      map[b] = (map[b] || 0) + 1;
    });
    return Object.entries(map)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count);
  }, [varietyProducts]);

  const handleSelectVariety = (v: string | null) => {
    setSelectedVariety(v);
    setSelectedBrand(null);
  };

  // In-stock first, then offers.
  const filteredList = useMemo(() => {
    const list = varietyProducts.filter((p) => !selectedBrand || (p.brand || 'Kerala Superstore') === selectedBrand);
    return [...list].sort((a, b) => {
      const aIn = a.stock > 0 ? 1 : 0;
      const bIn = b.stock > 0 ? 1 : 0;
      if (bIn !== aIn) return bIn - aIn;
      return (b.isOffer ? 1 : 0) - (a.isOffer ? 1 : 0);
    });
  }, [varietyProducts, selectedBrand]);

  const getCartQuantity = (productId: string): number => cart.find((i) => i.product.id === productId)?.quantity ?? 0;

  const handleCheckoutClick = () => {
    onClose();
    setIsCartOpen(true);
  };

  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-label={category.name}>
      <div className="absolute inset-0 bg-[#1E2420]/55" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-5xl bg-shop-cream text-shop-ink rounded-t-[18px] sm:rounded-[14px] flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden shadow-[0_10px_40px_rgba(30,36,32,0.25)]">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 bg-shop-green text-white shrink-0">
          <span className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-[3px] border-white/90 bg-white shrink-0">
            <Image src={category.imageUrl || '/categories/rice.jpg'} alt="" fill sizes="56px" className="object-cover" />
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight truncate">{category.name}</h2>
            <span className="font-hand text-lg sm:text-xl text-shop-yellow leading-none">
              {categoryProducts.length} {categoryProducts.length === 1 ? 'item' : 'items'} on this aisle
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-[9px] flex items-center justify-center hover:bg-white/10 cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        {((category.varieties && category.varieties.length > 0) || brandCounts.length > 1) && (
          <div className="px-4 sm:px-5 py-3 bg-shop-paper border-b border-dashed border-shop-dash flex flex-col gap-2.5 shrink-0">
            {category.varieties && category.varieties.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1" aria-label="Type">
                <button type="button" onClick={() => handleSelectVariety(null)} className={chipClass(selectedVariety === null)}>
                  All ({categoryProducts.length})
                </button>
                {category.varieties.map((v) => {
                  const count = categoryProducts.filter((p) => matchProductToVariety(p, v)).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleSelectVariety(selectedVariety === v ? null : v)}
                      className={chipClass(selectedVariety === v)}
                    >
                      {v} <span className="font-semibold opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>
            )}
            {brandCounts.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1" aria-label="Brand">
                <span className="font-hand text-xl text-shop-brown shrink-0 mr-1">brand</span>
                <button type="button" onClick={() => setSelectedBrand(null)} className={chipClass(selectedBrand === null)}>
                  Any
                </button>
                {brandCounts.map(({ brand, count }) => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => setSelectedBrand(selectedBrand === brand ? null : brand)}
                    className={chipClass(selectedBrand === brand)}
                  >
                    {brand} <span className="font-semibold opacity-70">({count})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Products */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 overscroll-contain">
          {filteredList.length === 0 ? (
            <div className="py-14 flex flex-col items-center text-center gap-2">
              <p className="font-hand text-[26px] text-shop-brown">nothing on this shelf yet</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedVariety(null);
                  setSelectedBrand(null);
                }}
                className="text-sm font-bold text-shop-green underline cursor-pointer"
              >
                Show everything in {category.name}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {filteredList.map((prod) => {
                const qty = getCartQuantity(prod.id);
                const { sellingPrice, cutPrice, hasDiscount } = getProductDisplayPricing(prod);
                const isOutOfStock = prod.stock <= 0;
                const atLimit = !isOutOfStock && qty >= prod.stock;
                const showBrand = prod.brand && prod.brand !== 'Kerala Superstore';
                const showSize = prod.sizeWeight && prod.sizeWeight !== 'Standard';
                const tilt = TAG_TILTS[(prod.id || prod.name).length % TAG_TILTS.length];

                return (
                  <div
                    key={prod.id}
                    onClick={() => onOpenProductDetails && onOpenProductDetails(prod)}
                    className="bg-white rounded-[10px] border border-shop-line hover:border-shop-green transition-colors flex flex-col overflow-hidden relative cursor-pointer"
                  >
                    <div className="absolute top-2.5 left-2 z-10 pointer-events-none">
                      {isOutOfStock ? (
                        <span className="bg-shop-ink text-white font-bold text-[10px] px-2 py-0.5 rounded">Out of stock</span>
                      ) : hasDiscount ? (
                        <span className="offer-stamp">OFFER</span>
                      ) : null}
                    </div>

                    <div className="relative w-full aspect-square p-3">
                      <Image
                        src={prod.imageUrl || FALLBACK_IMG}
                        alt={prod.name}
                        fill
                        sizes="(max-width: 640px) 45vw, 220px"
                        className={`object-contain p-3 ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          if (target && target.src.indexOf(FALLBACK_IMG) === -1) target.src = FALLBACK_IMG;
                        }}
                      />
                    </div>

                    <div className="px-3 pb-3 flex-1 flex flex-col gap-1">
                      {(showBrand || showSize) && (
                        <span className="text-[11px] sm:text-xs text-shop-muted truncate">
                          {[showBrand ? prod.brand : null, showSize ? prod.sizeWeight : null].filter(Boolean).join(' · ')}
                        </span>
                      )}
                      <h3 className="text-[13px] sm:text-sm font-semibold leading-snug line-clamp-2 min-h-[2.5em]">{displayName(prod.name)}</h3>

                      <div className="mt-auto pt-2 flex items-end justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col items-start">
                          <span className="price-tag text-[22px] sm:text-[25px]" style={{ transform: `rotate(${tilt})` }}>
                            £{sellingPrice.toFixed(2)}
                          </span>
                          {hasDiscount && cutPrice && <span className="text-[11px] text-shop-muted line-through mt-1">was £{cutPrice.toFixed(2)}</span>}
                        </div>

                        {isOutOfStock ? null : qty > 0 ? (
                          <div className="flex items-center rounded-[9px] bg-shop-green text-white shrink-0">
                            <button
                              type="button"
                              onClick={() => updateQuantity(prod.id, qty - 1)}
                              className="w-9 h-10 flex items-center justify-center cursor-pointer"
                              aria-label={`One less ${prod.name}`}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="min-w-5 text-center text-sm font-bold tabular-nums">{qty}</span>
                            <button
                              type="button"
                              onClick={() => addToCart(prod, 1)}
                              disabled={atLimit}
                              className="w-9 h-10 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              aria-label={`One more ${prod.name}`}
                            >
                              <HandPlus size={16} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addToCart(prod, 1)}
                            className="w-11 h-11 rounded-[9px] bg-shop-yellow text-shop-ink flex items-center justify-center shrink-0 cursor-pointer"
                            aria-label={`Add ${prod.name} to basket`}
                          >
                            <HandPlus />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Basket bar */}
        <div className="px-4 sm:px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white border-t border-shop-line flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative text-shop-green shrink-0">
              <HandBasket size={28} />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-5 h-5 px-1 rounded-full bg-shop-yellow text-shop-ink text-[11px] font-extrabold flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </span>
            <span className="text-sm leading-tight min-w-0">
              {totalItems === 0 ? (
                <span className="text-shop-muted">Basket is empty</span>
              ) : (
                <>
                  <span className="block text-shop-muted text-xs">Basket</span>
                  <span className="font-extrabold tabular-nums">£{subtotal.toFixed(2)}</span>
                </>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="hidden sm:flex h-11 px-4 items-center rounded-[10px] border border-shop-line font-bold text-sm cursor-pointer">
              Keep shopping
            </button>
            <button
              type="button"
              onClick={handleCheckoutClick}
              disabled={totalItems === 0}
              className="h-11 px-5 rounded-[10px] bg-shop-yellow text-shop-ink font-extrabold text-sm flex items-center gap-1.5 cursor-pointer disabled:bg-shop-line disabled:text-shop-muted disabled:cursor-not-allowed"
            >
              {totalItems > 0 && <Check className="w-4 h-4" strokeWidth={3} />}
              View basket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
