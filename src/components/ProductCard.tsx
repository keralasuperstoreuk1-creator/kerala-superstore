'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Check, ShieldCheck, Bell, X, CheckCircle2 } from 'lucide-react';
import { HandPlus } from '@/components/home/HandIcons';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useStoreConfig } from '@/context/StoreConfigContext';
import { getProductDisplayPricing } from '@/lib/pricing';

const TAG_TILTS = ['-3deg', '2deg', '-1.5deg', '2.5deg', '-2deg'];

/** POS names are ALL CAPS ("MATTA RICE NILA 5KG"); show them as "Matta Rice Nila 5kg". */
export function displayName(name: string): string {
  if (!name || name !== name.toUpperCase()) return name;
  return name
    .toLowerCase()
    .split(/(\s+)/)
    .map((w) => (/\d/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join('');
}

interface ProductCardProps {
  product: Product;
  onOpenDetails?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenDetails }) => {
  const { addToCart } = useCart();
  const { addRestockLead } = useStoreConfig();
  const [added, setAdded] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyName, setNotifyName] = useState('');
  const [notifyPhone, setNotifyPhone] = useState('');
  const [notifySuccess, setNotifySuccess] = useState(false);

  const isOutOfStock = product.stock <= 0;
  const { sellingPrice, cutPrice, hasDiscount } = getProductDisplayPricing(product);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) {
      setShowNotifyModal(true);
      return;
    }
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!notifyPhone.trim()) return;

    addRestockLead({
      productId: product.id,
      productName: product.name,
      productImage: product.imageUrl,
      customerName: notifyName.trim() || 'Customer',
      customerPhone: notifyPhone.trim(),
    });

    setNotifySuccess(true);
    setTimeout(() => {
      setNotifySuccess(false);
      setShowNotifyModal(false);
      setNotifyName('');
      setNotifyPhone('');
    }, 2000);
  };

  const [imgSrc, setImgSrc] = useState(product.imageUrl || '/products/matta-rice.png');

  useEffect(() => {
    setImgSrc(product.imageUrl || '/products/matta-rice.png');
  }, [product.imageUrl]);

  const tilt = TAG_TILTS[(product.id || product.name).length % TAG_TILTS.length];
  const showBrand = product.brand && product.brand !== 'Kerala Superstore';
  const showSize = product.sizeWeight && product.sizeWeight !== 'Standard';
  const lowStock = !isOutOfStock && product.stock <= (product.lowStockThreshold || 5);

  return (
    <>
      <div
        onClick={() => onOpenDetails && onOpenDetails(product)}
        className="group h-full bg-white rounded-[10px] border border-shop-line hover:border-shop-green transition-colors flex flex-col overflow-hidden relative cursor-pointer"
      >
        <div className="absolute top-2.5 left-2 z-10 pointer-events-none flex flex-col items-start gap-1">
          {isOutOfStock ? (
            <span className="bg-shop-ink text-white font-bold text-[10px] px-2 py-0.5 rounded">Out of stock</span>
          ) : hasDiscount ? (
            <span className="offer-stamp">OFFER</span>
          ) : null}
        </div>

        <div className="relative w-full aspect-square flex items-center justify-center p-3">
          <Image
            src={imgSrc}
            alt={product.name}
            width={320}
            height={320}
            className={`object-contain w-full h-full ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
            onError={(e) => {
              setImgSrc('/products/matta-rice.png');
              const target = e.currentTarget as HTMLImageElement;
              if (target && target.src.indexOf('/products/matta-rice.png') === -1) {
                target.src = '/products/matta-rice.png';
              }
            }}
          />
          {lowStock && (
            <span className="absolute bottom-1.5 right-2 font-hand text-[17px] font-bold text-shop-red -rotate-3">only {product.stock} left</span>
          )}
        </div>

        <div className="px-3 pb-3 flex-1 flex flex-col gap-1">
          {(showBrand || showSize) && (
            <span className="text-[11px] sm:text-xs text-shop-muted truncate">
              {[showBrand ? product.brand : null, showSize ? product.sizeWeight : null].filter(Boolean).join(' · ')}
            </span>
          )}
          <h3 className="text-[13px] sm:text-sm font-semibold leading-snug text-shop-ink line-clamp-2 min-h-[2.5em]">
            {displayName(product.name)}
          </h3>
          {product.allergens && product.allergens.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-shop-muted truncate" title={product.allergens.join(', ')}>
              <ShieldCheck className="w-3 h-3 text-shop-green shrink-0" />
              <span className="truncate">{product.allergens[0]}</span>
            </span>
          )}

          <div className="mt-auto pt-2 flex items-end justify-between gap-2">
            <div className="flex flex-col items-start">
              <span className="price-tag text-[24px] sm:text-[27px]" style={{ transform: `rotate(${tilt})` }}>
                £{sellingPrice.toFixed(2)}
              </span>
              {hasDiscount && cutPrice && (
                <span className="text-[11px] text-shop-muted line-through mt-1">was £{cutPrice.toFixed(2)}</span>
              )}
            </div>

            {isOutOfStock ? (
              <button
                onClick={(e) => { e.stopPropagation(); setShowNotifyModal(true); }}
                className="h-11 px-2.5 rounded-[9px] border-[1.5px] border-shop-brown text-shop-brown text-[12px] font-bold flex items-center gap-1 cursor-pointer"
                title="Tell me when it's back"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Notify</span>
              </button>
            ) : (
              <button
                onClick={handleAdd}
                aria-label={added ? `${product.name} added` : `Add ${product.name} to basket`}
                className={`w-11 h-11 rounded-[9px] flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                  added ? 'bg-shop-green text-white' : 'bg-shop-yellow text-shop-ink'
                }`}
              >
                {added ? <Check className="w-4 h-4" /> : <HandPlus />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Out of Stock "Notify Me" Modal */}
      {showNotifyModal && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Tell me when it's back"
        >
          <div className="absolute inset-0 bg-[#1E2420]/55" onClick={() => setShowNotifyModal(false)} aria-hidden="true" />
          <div className="relative z-10 w-full sm:max-w-sm bg-shop-cream text-shop-ink rounded-t-[18px] sm:rounded-[14px] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] flex flex-col gap-4 shadow-[0_10px_40px_rgba(30,36,32,0.25)]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <Bell className="w-5 h-5 text-shop-brown shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <h2 className="font-extrabold text-lg leading-tight">Tell me when it&apos;s back</h2>
                  <p className="text-sm text-shop-muted line-clamp-1">{displayName(product.name)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNotifyModal(false)}
                className="w-10 h-10 -mt-1 -mr-1 rounded-full bg-white border border-shop-line flex items-center justify-center cursor-pointer shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {notifySuccess ? (
              <div className="py-4 flex flex-col items-center text-center gap-2">
                <CheckCircle2 className="w-12 h-12 text-shop-green" />
                <p className="font-hand text-2xl text-shop-brown">got it, thank you!</p>
                <p className="text-sm text-shop-muted">We&apos;ll message you on WhatsApp when it&apos;s back on the shelf.</p>
              </div>
            ) : (
              <form onSubmit={handleNotifySubmit} className="flex flex-col gap-3">
                <div>
                  <label htmlFor={`notify-name-${product.id}`} className="block text-[13px] font-bold mb-1">Your name</label>
                  <input
                    id={`notify-name-${product.id}`}
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="e.g. Biju Kumar"
                    value={notifyName}
                    onChange={(e) => setNotifyName(e.target.value)}
                    className="w-full h-11 px-3 rounded-[9px] border border-shop-line bg-white text-[15px] outline-none focus:border-shop-green focus:ring-2 focus:ring-shop-green/15"
                  />
                </div>
                <div>
                  <label htmlFor={`notify-phone-${product.id}`} className="block text-[13px] font-bold mb-1">WhatsApp number</label>
                  <input
                    id={`notify-phone-${product.id}`}
                    type="tel"
                    required
                    autoComplete="tel"
                    placeholder="07700 900000"
                    value={notifyPhone}
                    onChange={(e) => setNotifyPhone(e.target.value)}
                    className="w-full h-11 px-3 rounded-[9px] border border-shop-line bg-white text-[15px] outline-none focus:border-shop-green focus:ring-2 focus:ring-shop-green/15"
                  />
                </div>
                <button type="submit" className="w-full h-12 mt-1 rounded-[10px] bg-shop-yellow text-shop-ink font-extrabold cursor-pointer">
                  Message me when it&apos;s back
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
