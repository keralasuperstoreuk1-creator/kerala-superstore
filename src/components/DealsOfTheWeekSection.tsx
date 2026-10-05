'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { Check, ShoppingBag, ArrowRight } from 'lucide-react';

interface DealsOfTheWeekSectionProps {
  dealProducts: Product[];
  onOpenProductDetails: (product: Product) => void;
  onViewAllDeals: () => void;
}

export const DealsOfTheWeekSection: React.FC<DealsOfTheWeekSectionProps> = ({
  dealProducts,
  onOpenProductDetails,
  onViewAllDeals,
}) => {
  const { addToCart } = useCart();
  const [addedIds, setAddedIds] = useState<{ [key: string]: boolean }>({});

  // Countdown timer state: 3 days, 18 hours, 45 mins, 20 secs
  const [timeLeft, setTimeLeft] = useState({
    days: 3,
    hours: 18,
    minutes: 45,
    seconds: 22,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addToCart(product, 1);
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  const displayProducts = dealProducts.slice(0, 2);

  return (
    <section className="max-w-7xl mx-auto px-4 py-8 sm:py-12 border-t border-slate-100">
      <div className="bg-gradient-to-r from-emerald-50/40 via-white to-orange-50/30 rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Title, Subtitle, Countdown Timer, View All Button */}
          <div className="lg:col-span-4 space-y-5 text-center lg:text-left">
            <span className="text-sm font-serif italic text-[#5ea813] font-bold tracking-wide">
              Deals Of The Day
            </span>

            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Grab The Best Offer of This Week!
            </h3>

            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Hurry up! Offers end in:
              </span>

              {/* Countdown Timer Boxes (Matching EMarket reference green boxes) */}
              <div className="flex items-center justify-center lg:justify-start gap-2 pt-1">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-[#5ea813] text-white flex items-center justify-center text-lg font-black shadow-xs">
                    {String(timeLeft.days).padStart(2, '0')}
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold mt-1 uppercase">Days</span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-[#5ea813] text-white flex items-center justify-center text-lg font-black shadow-xs">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold mt-1 uppercase">Hrs</span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-[#5ea813] text-white flex items-center justify-center text-lg font-black shadow-xs">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold mt-1 uppercase">Mins</span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-[#5ea813] text-white flex items-center justify-center text-lg font-black shadow-xs animate-pulse">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold mt-1 uppercase">Secs</span>
                </div>
              </div>
            </div>

            {/* Orange View All CTA Button */}
            <div className="pt-2">
              <button
                onClick={onViewAllDeals}
                className="px-6 py-3 rounded-xl bg-[#f97316] hover:bg-[#ea580c] text-white font-black text-xs uppercase tracking-wider shadow-md shadow-orange-500/20 transition-all flex items-center justify-center lg:justify-start gap-2 cursor-pointer active:scale-95 mx-auto lg:mx-0"
              >
                <span>VIEW ALL</span>
                <span className="text-sm">▷</span>
              </button>
            </div>
          </div>

          {/* Right Column: 2 Featured Deal Cards */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {displayProducts.map((product) => {
              const hasDiscount = product.offerPrice && product.offerPrice < product.price;
              const isAdded = addedIds[product.id];
              return (
                <div
                  key={product.id}
                  onClick={() => onOpenProductDetails(product)}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group relative"
                >
                  {/* Top discount chip */}
                  {hasDiscount && (
                    <div className="absolute top-3 left-3 bg-[#f97316] text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                      SAVE {Math.round(((product.price - (product.offerPrice || 0)) / product.price) * 100)}%
                    </div>
                  )}

                  {/* Circular Product Image Container (Like EMarket Reference) */}
                  <div className="w-full aspect-square rounded-2xl bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden mb-4">
                    <div className="relative w-40 h-40 group-hover:scale-105 transition-transform duration-300">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="text-center space-y-1 mb-4">
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                      {product.brand}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-[#5ea813] transition-colors line-clamp-1">
                      {product.name}
                    </h4>

                    {/* Price with strikethrough original */}
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <span className="text-base font-black text-[#f97316]">
                        £{(product.offerPrice ?? product.price).toFixed(2)}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-slate-400 line-through font-semibold">
                          £{product.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Light Grey "ADD TO CART" Button */}
                  <button
                    onClick={(e) => handleAddToCart(e, product)}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                      isAdded
                        ? 'bg-[#5ea813] text-white'
                        : 'bg-slate-100 hover:bg-[#5ea813] text-slate-700 hover:text-white'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>ADDED</span>
                      </>
                    ) : (
                      <span>ADD TO CART</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
};
