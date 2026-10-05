'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  ShoppingCart, 
  Check, 
  ShieldCheck,
  Star,
  Zap,
  Bell,
  X,
  CheckCircle2
} from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useStoreConfig } from '@/context/StoreConfigContext';

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

  const discountPercent = product.offerPrice 
    ? Math.round(((product.price - product.offerPrice) / product.price) * 100)
    : 0;

  return (
    <>
      <div 
        onClick={() => onOpenDetails && onOpenDetails(product)}
        className="group bg-white rounded-3xl border border-slate-200/90 hover:border-emerald-500/70 hover:shadow-2xl transition-all duration-300 flex flex-col overflow-hidden relative cursor-pointer transform hover:-translate-y-1"
      >
        {/* Badges Bar */}
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
          {isOutOfStock ? (
            <span className="bg-slate-900 text-white font-black text-[10px] px-2.5 py-1 rounded-full shadow-lg uppercase tracking-wider">
              Out of Stock
            </span>
          ) : discountPercent > 0 ? (
            <span className="bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 text-white font-black text-[10px] px-2.5 py-1 rounded-full shadow-lg uppercase tracking-wider flex items-center gap-1 animate-pulse border border-white/30">
              <span className="text-xs">🔥</span> Save {discountPercent}% • Deal
            </span>
          ) : product.isBestseller ? (
            <span className="bg-slate-900/90 backdrop-blur-md text-amber-300 font-bold text-[10px] px-2.5 py-0.5 rounded-full shadow-md uppercase tracking-wider flex items-center gap-1 border border-white/10">
              Bestseller
            </span>
          ) : (
            <span className="bg-emerald-900/80 backdrop-blur-md text-emerald-200 font-bold text-[10px] px-2 py-0.5 rounded-full">
              Kerala Authentic
            </span>
          )}

          {!isOutOfStock && product.stock <= (product.lowStockThreshold || 10) && (
            <span className="bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[9px] px-2 py-0.5 rounded-full shadow-2xs">
              Only {product.stock} left
            </span>
          )}
        </div>

        {/* Product Image Area with Studio Lighting */}
        <div className="relative w-full aspect-square bg-gradient-to-b from-slate-50 via-white to-slate-50 overflow-hidden flex items-center justify-center p-4">
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={360}
            height={360}
            className={`object-contain w-full h-full group-hover:scale-108 transition-transform duration-500 ${isOutOfStock ? 'grayscale-50 opacity-70' : ''}`}
            loading="lazy"
          />
          
          {/* Pack Size Pill */}
          <div className="absolute bottom-2.5 left-3">
            <span className="text-[10px] bg-slate-900/85 backdrop-blur-md text-white font-bold px-2 py-0.5 rounded-lg shadow-sm">
              {product.sizeWeight}
            </span>
          </div>
        </div>

        {/* Product Content Details */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-black text-emerald-800 uppercase tracking-wider text-[10px] bg-emerald-50 px-2 py-0.5 rounded-md">
                {product.brand}
              </span>
              <div className="flex items-center gap-1 text-slate-500 font-semibold text-[10px]">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>4.9</span>
              </div>
            </div>

            <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-2 leading-snug">
              {product.name}
            </h3>

            {/* Natasha's Law Allergen Indicator */}
            {product.allergens && product.allergens.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500 truncate" title={product.allergens.join(', ')}>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{product.allergens[0]}</span>
              </div>
            )}
          </div>

          {/* Pricing & Add / Notify Button */}
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base sm:text-lg font-black text-slate-900">
                  £{(product.offerPrice ?? product.price).toFixed(2)}
                </span>
                {product.offerPrice && (
                  <span className="text-xs text-slate-400 line-through font-medium">
                    £{product.price.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="text-[9px] text-emerald-700 font-semibold flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5" /> Express UK Dispatch
              </div>
            </div>

            {isOutOfStock ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNotifyModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-[11px] font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-all active:scale-95"
                title="Notify me when restocked"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Notify Me</span>
              </button>
            ) : (
              <button
                onClick={handleAdd}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer ${
                  added
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-800 hover:bg-emerald-700 text-white hover:shadow-lg'
                }`}
                title="Add to Basket"
              >
                {added ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Added</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </>
                )}
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
