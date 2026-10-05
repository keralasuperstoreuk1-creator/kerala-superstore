'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { 
  Flame, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Plus, 
  Check, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface TodayOffersMovingShowcaseProps {
  products: Product[];
  onSelectProduct?: (product: Product) => void;
  onViewAllDeals?: () => void;
}

export const TodayOffersMovingShowcase: React.FC<TodayOffersMovingShowcaseProps> = ({
  products,
  onSelectProduct,
  onViewAllDeals,
}) => {
  const { addToCart } = useCart();
  const [isPaused, setIsPaused] = useState(false);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Live countdown timer ticking down to midnight GMT
  const [timeLeft, setTimeLeft] = useState<{ hours: string; minutes: string; seconds: string }>({
    hours: '07',
    minutes: '42',
    seconds: '19',
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = Math.max(0, endOfDay.getTime() - now.getTime());

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({
        hours: h.toString().padStart(2, '0'),
        minutes: m.toString().padStart(2, '0'),
        seconds: s.toString().padStart(2, '0'),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAddToCart = (e: React.MouseEvent, prod: Product) => {
    e.stopPropagation();
    addToCart(prod, 1);
    setAddedProductId(prod.id);
    setTimeout(() => setAddedProductId(null), 1400);
  };

  const handleManualScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const shift = 320;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -shift : shift,
        behavior: 'smooth',
      });
    }
  };

  if (!products || products.length === 0) return null;

  // Duplicate items 3 times for a seamless continuous loop
  const displayItems = products.concat(products).concat(products);

  return (
    <section id="special-offers-section" className="w-full max-w-7xl mx-auto px-4 py-6">
      <div className="bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-emerald-500/10 border-2 border-amber-400/60 rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-xs">
        
        {/* Shimmer light bar across header */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full animate-shimmer pointer-events-none" />

        {/* Section Header with Controls & Countdown */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 relative z-10">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-amber-500 to-yellow-400 text-white flex items-center justify-center text-2xl shadow-lg animate-fire-glow shrink-0">
              🔥
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black bg-rose-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1 shadow-2xs">
                  <span>⚡</span> Live Flash Deals
                </span>
                <span className="text-xs text-amber-900 font-bold hidden sm:inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  <span>Instant UK Doorstep Savings</span>
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                Today&apos;s Special Offers &amp; Flash Deals
              </h2>
              <p className="text-xs text-slate-600">
                Fresh authentic Kerala staples at unbeatable direct wholesale prices • Auto-discounted in basket!
              </p>
            </div>
          </div>

          {/* Action Bar: Timer, Pause Toggle, Scroll Buttons, View All */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 self-start md:self-auto">
            {/* Live Countdown Clock */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xs">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Ends In:</span>
              <span className="text-amber-300 font-mono font-black" suppressHydrationWarning>
                {timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
              </span>
            </div>

            {/* Play/Pause Motion Toggle */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition-all flex items-center gap-1 cursor-pointer active:scale-95"
              title={isPaused ? 'Resume Auto-Glide' : 'Pause Gliding'}
            >
              {isPaused ? (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                  <span className="hidden sm:inline">Play</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                  <span className="hidden sm:inline">Pause</span>
                </>
              )}
            </button>

            {/* Manual Left/Right Scroll Chevrons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleManualScroll('left')}
                className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs flex items-center justify-center transition-all cursor-pointer active:scale-90"
                title="Scroll Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleManualScroll('right')}
                className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs flex items-center justify-center transition-all cursor-pointer active:scale-90"
                title="Scroll Right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* View All Button */}
            {onViewAllDeals && (
              <button
                onClick={onViewAllDeals}
                className="px-3 py-1.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <span>All {products.length} Offers</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* CONTINUOUS SMOOTH MOVING TRACK (Cheruthai Enganey Move Aii Pokunna Animation) */}
        <div 
          ref={scrollContainerRef}
          className="relative overflow-x-auto no-scrollbar scroll-smooth py-2"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            className={`flex items-stretch gap-4 ${
              isPaused ? 'pause-animation' : 'animate-offer-glide'
            }`}
          >
            {displayItems.map((prod, idx) => {
              const discountPercent = prod.offerPrice
                ? Math.round(((prod.price - prod.offerPrice) / prod.price) * 100)
                : 0;
              const savings = prod.offerPrice
                ? (prod.price - prod.offerPrice).toFixed(2)
                : '0.00';
              const isJustAdded = addedProductId === prod.id;

              return (
                <div
                  key={`${prod.id}-glide-${idx}`}
                  onClick={() => onSelectProduct && onSelectProduct(prod)}
                  className="w-[240px] sm:w-[260px] shrink-0 bg-white rounded-2xl border border-amber-200/80 shadow-md hover:shadow-xl hover:border-amber-400 transition-all duration-300 p-3 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
                >
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-1 mb-2 relative z-10">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-rose-600 to-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-xs animate-pulse">
                      <Flame className="w-3 h-3 fill-white" />
                      <span>{discountPercent}% OFF</span>
                    </span>

                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Save £{savings}
                    </span>
                  </div>

                  {/* Product Image Showcase */}
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-50 mb-2.5 border border-slate-100">
                    <Image
                      src={prod.imageUrl || '/categories/rice.jpg'}
                      alt={prod.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    
                    {/* Brand Pill over Image */}
                    <span className="absolute bottom-1.5 left-1.5 text-[9px] font-black text-slate-800 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-md shadow-2xs border border-slate-200">
                      {prod.brand}
                    </span>

                    {/* Weight badge */}
                    <span className="absolute bottom-1.5 right-1.5 text-[9px] font-bold text-white bg-slate-900/80 backdrop-blur-md px-1.5 py-0.5 rounded-md">
                      {prod.sizeWeight}
                    </span>
                  </div>

                  {/* Product Title & Details */}
                  <div className="space-y-1 mb-3">
                    <h3 className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-1 leading-snug">
                      {prod.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 line-clamp-1">
                      {prod.description}
                    </p>
                  </div>

                  {/* Natasha's Law tag */}
                  <div className="flex items-center gap-1 text-[9px] text-slate-400 font-medium mb-3">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Natasha&apos;s Law Compliant</span>
                  </div>

                  {/* Pricing Row & Instant Cart Add */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base sm:text-lg font-black text-rose-600">
                          £{prod.offerPrice ? prod.offerPrice.toFixed(2) : prod.price.toFixed(2)}
                        </span>
                        {prod.offerPrice && (
                          <span className="text-xs text-slate-400 line-through font-semibold">
                            £{prod.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] text-emerald-700 font-bold">
                        In Stock • UK Ready
                      </div>
                    </div>

                    {/* 1-Click Add Button */}
                    <button
                      onClick={(e) => handleAddToCart(e, prod)}
                      className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer active:scale-90 shadow-sm ${
                        isJustAdded
                          ? 'bg-emerald-600 text-white shadow-emerald-500/30'
                          : 'bg-amber-400 hover:bg-amber-300 text-slate-950 hover:shadow-md'
                      }`}
                      title="Add to Basket"
                    >
                      {isJustAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Added</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer helper note */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Hover or tap card to pause glide • Click &apos;Add&apos; to reserve stock</span>
          </span>
          <span className="text-amber-800 font-bold hidden sm:inline">
            Free UK Delivery on Qualifying Orders
          </span>
        </div>

      </div>
    </section>
  );
};
