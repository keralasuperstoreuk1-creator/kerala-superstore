'use client';

import React from 'react';
import Link from 'next/link';
import { Flame, ArrowRight, Zap, Clock } from 'lucide-react';
import { useStoreConfig } from '@/context/StoreConfigContext';

interface SpecialOfferBannerProps {
  onScrollToOffers?: () => void;
}

export const SpecialOfferBanner: React.FC<SpecialOfferBannerProps> = ({ onScrollToOffers }) => {
  const { config } = useStoreConfig();
  const offer = config.offerBanner;

  if (!offer || !offer.enabled) return null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 text-white shadow-md z-20 border-y border-amber-400/30">
      {/* Subtle moving shimmer background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full animate-[shimmer_3s_infinite] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        
        {/* Left: Animated Badge & Headline */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-slate-950 font-black text-[11px] shadow-sm animate-pulse uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 text-rose-600 fill-rose-600 animate-bounce" />
            <span>{offer.badgeText || 'SPECIAL OFFER'}</span>
          </span>

          <span className="font-bold text-xs sm:text-sm text-white drop-shadow-xs tracking-tight">
            {offer.headline}
          </span>
        </div>

        {/* Right: Action button to jump to offers */}
        <div className="flex items-center gap-3 shrink-0">
          {offer.subtext && (
            <span className="hidden md:inline text-[11px] text-amber-100 font-medium">
              {offer.subtext}
            </span>
          )}

          <button
            onClick={onScrollToOffers}
            className="px-3.5 py-1 bg-white hover:bg-amber-50 text-slate-900 rounded-full font-black text-xs transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <span>View Deals</span>
            <ArrowRight className="w-3.5 h-3.5 text-rose-600" />
          </button>
        </div>

      </div>
    </div>
  );
};
