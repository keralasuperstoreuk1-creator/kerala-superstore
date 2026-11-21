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
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                <Bell className="w-4 h-4 text-amber-500" />
                <span>Back in Stock Alert</span>
              </div>
              <button
                onClick={() => setShowNotifyModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {notifySuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-sm text-slate-900">Request Received!</h4>
                <p className="text-xs text-slate-500">
                  We will WhatsApp you as soon as this item arrives fresh in Manchester!
                </p>
              </div>
            ) : (
              <form onSubmit={handleNotifySubmit} className="space-y-3 text-xs">
                <div>
                  <span className="font-bold text-slate-900 block line-clamp-1">{product.name}</span>
                  <span className="text-[11px] text-slate-500">Enter your contact details to receive a free restock alert.</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Biju Kumar"
                    value={notifyName}
                    onChange={(e) => setNotifyName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">UK Phone / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="07700 900000"
                    value={notifyPhone}
                    onChange={(e) => setNotifyPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-sm transition-all cursor-pointer mt-1"
                >
                  Alert Me on WhatsApp When In Stock
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
