'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSpecialsNotification } from '@/context/SpecialsNotificationContext';
import { useCart } from '@/context/CartContext';
import { DailySpecial, DailySpecialsThemeConfig } from '@/types';
import { DEFAULT_DAILY_SPECIALS_THEME } from '@/lib/daily-specials-theme';
import {
  Flame,
  Clock,
  Bell,
  Plus,
  Check,
  ChefHat,
  ShieldCheck,
  Sparkles,
  MapPin,
  ShoppingBag,
} from 'lucide-react';

export const DailyKitchenSpecialsShowcase: React.FC = () => {
  const { dailySpecials, setIsNotificationModalOpen, requestPushPermission } = useSpecialsNotification();
  const { addToCart } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);
  const [theme, setTheme] = useState<DailySpecialsThemeConfig>(DEFAULT_DAILY_SPECIALS_THEME);

  const loadTheme = () => {
    try {
      const savedTheme = localStorage.getItem('kss_daily_specials_theme');
      if (savedTheme) {
        setTheme({ ...DEFAULT_DAILY_SPECIALS_THEME, ...JSON.parse(savedTheme) });
      } else {
        setTheme(DEFAULT_DAILY_SPECIALS_THEME);
      }
    } catch {
      setTheme(DEFAULT_DAILY_SPECIALS_THEME);
    }
  };

  useEffect(() => {
    loadTheme();
    const handleUpdate = () => loadTheme();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('kss_daily_specials_theme_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('kss_daily_specials_theme_updated', handleUpdate);
    };
  }, []);

  if (!dailySpecials || dailySpecials.length === 0) return null;

  const handleAddSpecialToCart = (special: DailySpecial) => {
    const specialProduct = {
      id: special.id,
      name: special.title,
      slug: `special-${special.id}`,
      brand: 'Kerala Superstore Kitchen',
      category: 'Daily Hot Kitchen Specials',
      categorySlug: 'fresh-specials',
      sizeWeight: '1 Portion Box',
      price: special.price,
      stock: special.portionsRemaining,
      description: special.description,
      tags: ['Daily Special', 'Hot Kitchen', 'Biriyani', 'Fresh Batch'],
      imageUrl: special.imageUrl,
      status: 'published' as const,
      createdAt: special.createdAt,
    };

    addToCart(specialProduct, 1);
    setAddedId(special.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const isSecDark = theme.sectionTextColor === 'light';
  const isCardDark = theme.cardTextColor === 'light';

  const sectionBgStyle =
    theme.sectionBgType === 'gradient'
      ? {
          background: `radial-gradient(circle at 12% 0%, rgba(245, 158, 11, 0.16), transparent 42%), radial-gradient(circle at 92% 100%, rgba(16, 185, 129, 0.18), transparent 45%), linear-gradient(135deg, ${theme.sectionBgColor}, ${theme.sectionBgGradientEnd || '#022c22'})`,
          borderColor: `${theme.sectionBorderColor}66`,
        }
      : {
          backgroundColor: theme.sectionBgColor,
          borderColor: `${theme.sectionBorderColor}66`,
        };

  const getContrastTextColor = (hexColor: string) => {
    const lightHColors = ['#fbbf24', '#f59e0b', '#fde047', '#ffffff', '#f8fafc', '#fef08a', '#86efac'];
    return lightHColors.includes(hexColor.toLowerCase()) ? '#09090b' : '#ffffff';
  };

  const btnTextColor = getContrastTextColor(theme.accentButtonColor);

  return (
    <section id="daily-specials-section" className="w-full max-w-7xl mx-auto px-4 py-8 sm:py-10">
      <div
        style={sectionBgStyle}
        className={`rounded-[2rem] p-5 sm:p-8 lg:p-10 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.45)] relative overflow-hidden border transition-colors duration-500 ${
          isSecDark ? 'text-white' : 'text-slate-900'
        }`}
      >
        {/* Subtle top brass accent hairline */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-400/80 to-transparent pointer-events-none" />

        {/* Editorial Kitchen Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-7 sm:mb-9 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span
                style={{
                  backgroundColor: `${theme.badgeColor}1f`,
                  borderColor: `${theme.badgeColor}55`,
                  color: theme.badgeColor,
                }}
                className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-extrabold tracking-widest uppercase border backdrop-blur-sm"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <ChefHat className="w-3.5 h-3.5" />
                <span>Live Hot Kitchen • Manchester</span>
              </span>

              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold border ${
                  isSecDark
                    ? 'bg-white/5 border-white/10 text-amber-200'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Small-Batch Cooked Today</span>
              </span>
            </div>

            <div>
              <h2
                className={`text-2xl sm:text-4xl font-black tracking-tight leading-tight ${
                  isSecDark ? 'text-white' : 'text-slate-950'
                }`}
              >
                Today&apos;s Fresh{' '}
                <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                  Daily Specials
                </span>
              </h2>
              <p
                className={`text-xs sm:text-sm mt-2 leading-relaxed ${
                  isSecDark ? 'text-slate-300/90' : 'text-slate-600'
                }`}
              >
                Slow-dum Thalassery Biriyanis, flaky Malabar Porottas &amp; evening naadan snacks prepared fresh in-house. Limited daily portions — pre-order before the batch sells out.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => {
                requestPushPermission();
                setIsNotificationModalOpen(true);
              }}
              style={{
                backgroundColor: theme.accentButtonColor,
                color: btnTextColor,
              }}
              className="group px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 shadow-lg hover:shadow-amber-500/25 hover:-translate-y-0.5 cursor-pointer active:scale-95"
            >
              <Bell className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span>Get Daily Biriyani Alerts</span>
            </button>
          </div>
        </div>

        {/* Redesigned Culinary Platter Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 relative z-10">
          {dailySpecials.map((special, index) => {
            const isJustAdded = addedId === special.id;
            const remaining = Math.max(0, Number(special.portionsRemaining) || 0);
            const capacity = Math.max(remaining, 20);
            const pct = special.isSoldOut ? 0 : Math.min(100, Math.max(12, Math.round((remaining / capacity) * 100)));
            const isLowStock = !special.isSoldOut && remaining <= 8;

            return (
              <article
                key={special.id}
                style={{
                  backgroundColor: isCardDark ? 'rgba(15, 23, 42, 0.62)' : theme.cardBgColor,
                  borderColor: `${theme.cardBorderColor}88`,
                }}
                className="group rounded-3xl border overflow-hidden flex flex-col justify-between shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 backdrop-blur-md"
              >
                {/* Full-Bleed Food Photography Header */}
                <div className="relative w-full aspect-[16/11] overflow-hidden bg-slate-900">
                  <Image
                    src={special.imageUrl || '/specials/thalassery_chicken_biriyani.jpg'}
                    alt={special.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className={`object-cover group-hover:scale-108 transition-transform duration-700 ease-out ${
                      special.isSoldOut ? 'grayscale opacity-60' : ''
                    }`}
                  />

                  {/* Cinematic bottom gradient for crisp overlay legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-slate-950/30 pointer-events-none" />

                  {/* Top Row: Chef Badge + Price Tag */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-start justify-between gap-2">
                    <span
                      style={{
                        backgroundColor: theme.badgeColor,
                        color: getContrastTextColor(theme.badgeColor),
                      }}
                      className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg"
                    >
                      <Flame className="w-3 h-3" />
                      <span>{special.badge || (index === 0 ? "Chef's Signature" : "Today's Special")}</span>
                    </span>

                    <div className="bg-slate-950/85 backdrop-blur-md border border-amber-400/40 rounded-2xl px-3 py-1.5 text-right shadow-lg">
                      <span
                        style={{ color: theme.priceColor }}
                        className="text-base sm:text-lg font-black leading-none block"
                      >
                        £{special.price.toFixed(2)}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-300 block mt-0.5">
                        Fresh Box
                      </span>
                    </div>
                  </div>

                  {/* Bottom Overlay: Serving Time & Portion Status */}
                  <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-black/55 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15">
                      <Clock className="w-3 h-3 text-amber-300" />
                      <span>{special.availableTime}</span>
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-md border ${
                        special.isSoldOut
                          ? 'bg-slate-900/90 text-slate-300 border-slate-600'
                          : isLowStock
                          ? 'bg-rose-600/90 text-white border-rose-300/50 animate-pulse'
                          : 'bg-emerald-950/85 text-emerald-200 border-emerald-400/35'
                      }`}
                    >
                      <Flame className="w-3 h-3" />
                      <span>
                        {special.isSoldOut ? 'Sold Out Today' : `${remaining} left`}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                  <div className="space-y-2 text-left">
                    <h3
                      className={`font-black text-base sm:text-lg leading-snug tracking-tight transition-colors ${
                        isCardDark
                          ? 'text-white group-hover:text-amber-300'
                          : 'text-slate-900 group-hover:text-emerald-700'
                      }`}
                    >
                      {special.title}
                    </h3>

                    <p
                      className={`text-xs sm:text-[13px] line-clamp-2 leading-relaxed ${
                        isCardDark ? 'text-slate-300/90' : 'text-slate-600'
                      }`}
                    >
                      {special.description}
                    </p>
                  </div>

                  {/* Live Batch Availability Meter + CTA */}
                  <div className="space-y-3 pt-2 border-t border-white/10">
                    {!special.isSoldOut && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className={isCardDark ? 'text-slate-400' : 'text-slate-500'}>
                            Today&apos;s Kitchen Batch
                          </span>
                          <span className={isLowStock ? 'text-rose-400' : 'text-emerald-400'}>
                            {isLowStock ? 'Selling fast!' : 'Hot & Available'}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className={`h-full rounded-full transition-all duration-500 ${
                              isLowStock
                                ? 'bg-gradient-to-r from-rose-500 to-amber-400'
                                : 'bg-gradient-to-r from-emerald-400 to-amber-300'
                            }`}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => handleAddSpecialToCart(special)}
                      disabled={special.isSoldOut}
                      style={
                        special.isSoldOut
                          ? {}
                          : isJustAdded
                          ? { backgroundColor: '#10b981', color: '#ffffff' }
                          : { backgroundColor: theme.accentButtonColor, color: btnTextColor }
                      }
                      className={`w-full py-3 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] shadow-md ${
                        special.isSoldOut
                          ? 'bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
                          : isJustAdded
                          ? 'shadow-emerald-500/30'
                          : 'hover:brightness-110'
                      }`}
                    >
                      {special.isSoldOut ? (
                        <span>Sold Out for Today</span>
                      ) : isJustAdded ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Added to Basket</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          <span>Order Fresh Box • £{special.price.toFixed(2)}</span>
                          <Plus className="w-3.5 h-3.5 opacity-80" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Refined Bottom Kitchen Trust Bar */}
        <div
          className={`mt-7 pt-5 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs relative z-10 ${
            isSecDark ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-400/25 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-emerald-400" />
            </div>
            <span>
              Prepared fresh daily with authentic Kerala spices at{' '}
              <strong className={isSecDark ? 'text-white' : 'text-slate-900'}>
                Unit 2, 73 Old Market Street, Manchester
              </strong>
            </span>
          </div>

          <div className="flex items-center md:justify-end gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-400/25 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
            <span style={{ color: theme.priceColor }} className="font-bold">
              Same-day Manchester doorstep dispatch or hot counter collection
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
