'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, Check, Minus, ShieldCheck, MapPin } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { getProductDisplayPricing } from '@/lib/pricing';
import { displayName } from '@/components/ProductCard';
import { HandPlus, HandWhatsApp } from '@/components/home/HandIcons';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

const FALLBACK_IMG = '/products/matta-rice.png';

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  // Start from 1 each time a different product is opened.
  const [shownId, setShownId] = useState(product?.id);
  if (product?.id !== shownId) {
    setShownId(product?.id);
    setQty(1);
    setJustAdded(false);
  }

  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [product, onClose]);

  if (!product) return null;

  const pricing = getProductDisplayPricing(product);
  const isOutOfStock = product.stock <= 0;
  const maxQty = isOutOfStock ? 1 : Math.max(1, product.stock);
  const lowStock = !isOutOfStock && product.stock <= (product.lowStockThreshold || 5);
  const showBrand = product.brand && product.brand !== 'Kerala Superstore';
  const showSize = product.sizeWeight && product.sizeWeight !== 'Standard';
  const name = displayName(product.name);

  const handleAdd = () => {
    if (isOutOfStock) return;
    addToCart(product, qty);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      onClose();
    }, 900);
  };

  const askText = isOutOfStock
    ? `Hello Kerala Superstore! Is ${name}${showSize ? ` (${product.sizeWeight})` : ''} coming back in stock soon?`
    : `Hello Kerala Superstore! I have a question about ${name}${showSize ? ` (${product.sizeWeight})` : ''}.`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-label={name}>
      <div className="absolute inset-0 bg-[#1E2420]/55" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full sm:max-w-3xl max-h-[92vh] bg-shop-cream text-shop-ink rounded-t-[18px] sm:rounded-[14px] overflow-hidden flex flex-col md:flex-row shadow-[0_10px_40px_rgba(30,36,32,0.25)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-white border border-shop-line flex items-center justify-center cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image */}
        <div className="md:w-[46%] shrink-0 bg-white border-b md:border-b-0 md:border-r border-shop-line p-6 flex flex-col items-center justify-center gap-3 relative">
          {isOutOfStock ? (
            <span className="absolute top-3 left-3 bg-shop-ink text-white font-bold text-xs px-2 py-1 rounded">Out of stock</span>
          ) : pricing.hasDiscount ? (
            <span className="absolute top-4 left-4 offer-stamp">OFFER</span>
          ) : null}
          <div className="relative w-44 h-44 sm:w-64 sm:h-64">
            <Image
              src={product.imageUrl || FALLBACK_IMG}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 176px, 256px"
              className={`object-contain ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (target && target.src.indexOf(FALLBACK_IMG) === -1) target.src = FALLBACK_IMG;
              }}
            />
          </div>
          {product.origin && (
            <span className="flex items-center gap-1.5 text-xs text-shop-muted">
              <MapPin className="w-3.5 h-3.5 text-shop-green" />
              {product.origin}
            </span>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-3">
            {(showBrand || showSize) && (
              <span className="text-[13px] text-shop-muted pr-10">
                {[showBrand ? product.brand : null, showSize ? product.sizeWeight : null].filter(Boolean).join(' · ')}
              </span>
            )}
            <h2 className="text-xl sm:text-2xl font-extrabold leading-tight tracking-tight pr-10">{name}</h2>

            <div className="flex items-end gap-3 flex-wrap">
              <span className="price-tag text-[34px]" style={{ transform: 'rotate(-2deg)' }}>£{pricing.sellingPrice.toFixed(2)}</span>
              {pricing.hasDiscount && pricing.cutPrice && (
                <span className="text-sm text-shop-muted">
                  <span className="line-through">was £{pricing.cutPrice.toFixed(2)}</span>{' '}
                  <span className="font-bold text-shop-red">save £{pricing.savings.toFixed(2)}</span>
                </span>
              )}
            </div>

            {isOutOfStock ? (
              <span className="font-hand text-[22px] text-shop-red">sold out for now — ask us when it&apos;s back</span>
            ) : lowStock ? (
              <span className="font-hand text-[22px] text-shop-red">only {product.stock} left on the shelf</span>
            ) : (
              <span className="flex items-center gap-1.5 text-sm font-bold text-shop-green">
                <Check className="w-4 h-4" strokeWidth={3} /> In stock
              </span>
            )}

            {product.description && <p className="text-[15px] leading-relaxed text-[#2F3A34]">{product.description}</p>}

            {(product.ingredients || (product.allergens && product.allergens.length > 0)) && (
              <div className="p-3.5 rounded-[10px] bg-shop-paper border border-dashed border-shop-dash text-sm flex flex-col gap-2">
                {product.ingredients && (
                  <p>
                    <span className="font-bold">Ingredients: </span>
                    <span className="text-[#2F3A34]">{product.ingredients}</span>
                  </p>
                )}
                {product.allergens && product.allergens.length > 0 && (
                  <p className="flex items-start gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-shop-brown shrink-0 mt-0.5" />
                    <span>
                      <span className="font-bold">Allergens: </span>
                      {product.allergens.join(', ')}
                    </span>
                  </p>
                )}
                <p className="text-xs text-shop-muted">Always check the label on the pack before eating.</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 sm:p-5 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white border-t border-shop-line flex flex-col gap-2.5">
            {!isOutOfStock && (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center rounded-[10px] border border-shop-line bg-shop-paper shrink-0">
                  <button
                    type="button"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    disabled={qty <= 1}
                    className="w-11 h-12 flex items-center justify-center cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                    aria-label="One less"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="min-w-7 text-center font-bold tabular-nums" aria-live="polite">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(Math.min(maxQty, qty + 1))}
                    disabled={qty >= maxQty}
                    className="w-11 h-12 flex items-center justify-center cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                    aria-label="One more"
                  >
                    <HandPlus size={16} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleAdd}
                  className={`flex-1 h-12 rounded-[10px] font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                    justAdded ? 'bg-shop-green text-white' : 'bg-shop-yellow text-shop-ink'
                  }`}
                >
                  {justAdded ? (
                    <>
                      <Check className="w-5 h-5" strokeWidth={3} /> Added
                    </>
                  ) : (
                    <>Add to basket · £{(pricing.sellingPrice * qty).toFixed(2)}</>
                  )}
                </button>
              </div>
            )}
            <a
              href={`https://wa.me/447749132122?text=${encodeURIComponent(askText)}`}
              target="_blank"
              rel="noreferrer"
              className={`w-full h-12 rounded-[10px] font-bold flex items-center justify-center gap-2 ${
                isOutOfStock ? 'bg-shop-green text-white' : 'border-[1.5px] border-shop-green text-shop-green'
              }`}
            >
              <HandWhatsApp size={22} />
              {isOutOfStock ? 'Ask on WhatsApp when it’s back' : 'Ask us about this on WhatsApp'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
