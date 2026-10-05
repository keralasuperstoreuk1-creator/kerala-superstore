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
  UtensilsCrossed, 
  Bell, 
  Plus, 
  Check, 
  ChefHat,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export const DailyKitchenSpecialsShowcase: React.FC = () => {
  const { dailySpecials, setIsNotificationModalOpen, requestPushPermission } = useSpecialsNotification();
  const { addToCart } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);
  const [theme, setTheme] = useState<DailySpecialsThemeConfig>(DEFAULT_DAILY_SPECIALS_THEME);

  // Load custom theme configuration from localStorage
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
      brand: "Kerala Superstore Kitchen",
      category: "Daily Hot Kitchen Specials",
      categorySlug: "fresh-specials",
      sizeWeight: "1 Portion Box",
      price: special.price,
      stock: special.portionsRemaining,
      description: special.description,
      tags: ["Daily Special", "Hot Kitchen", "Biriyani", "Fresh Batch"],
      imageUrl: special.imageUrl,
      status: 'published' as const,
      createdAt: special.createdAt,
    };

    addToCart(specialProduct, 1);
    setAddedId(special.id);
    setTimeout(() => setAddedId(null), 1400);
  };

  const isSecDark = theme.sectionTextColor === 'light';
  const isCardDark = theme.cardTextColor === 'light';

  // Section Background Style
  const sectionBgStyle = theme.sectionBgType === 'gradient'
    ? {
        background: `linear-gradient(135deg, ${theme.sectionBgColor}, ${theme.sectionBgGradientEnd || '#022c22'})`,
        borderColor: theme.sectionBorderColor,
      }
    : {
        backgroundColor: theme.sectionBgColor,
        borderColor: theme.sectionBorderColor,
      };

  // Helper for button text color contrast
  const getContrastTextColor = (hexColor: string) => {
    const lightHColors = ['#fbbf24', '#f59e0b', '#fde047', '#ffffff', '#f8fafc', '#fef08a', '#86efac'];
    return lightHColors.includes(hexColor.toLowerCase()) ? '#09090b' : '#ffffff';
  };

  const btnTextColor = getContrastTextColor(theme.accentButtonColor);

  return (
    <section id="daily-specials-section" className="w-full max-w-7xl mx-auto px-4 py-8">
      <div 
        style={sectionBgStyle}
        className={`rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden border-2 transition-colors duration-500 ${
          isSecDark ? 'text-white' : 'text-slate-900'
        }`}
      >
        {/* Ambient warm culinary light orbs */}
        {isSecDark && (
          <>
            <div 
              style={{ backgroundColor: theme.sectionBorderColor }}
              className="absolute top-0 right-10 w-80 h-80 opacity-15 rounded-full blur-3xl pointer-events-none animate-pulse" 
            />
            <div 
              style={{ backgroundColor: theme.priceColor }}
              className="absolute bottom-0 left-10 w-80 h-80 opacity-10 rounded-full blur-3xl pointer-events-none" 
            />
          </>
        )}

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 relative z-10">
          <div>
            <div 
              style={{ 
                backgroundColor: `${theme.badgeColor}22`,
                borderColor: `${theme.badgeColor}66`,
                color: theme.badgeColor
              }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase mb-2 border shadow-2xs"
            >
              <ChefHat className="w-4 h-4" />
              <span>Manchester Kitchen &amp; Fresh Counter</span>
            </div>
            <h2 className={`text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2 ${
              isSecDark ? 'text-white' : 'text-slate-950'
            }`}>
              <span>Today&apos;s Fresh Daily Specials</span>
              <span className="text-xl">🍲</span>
            </h2>
            <p className={`text-xs sm:text-sm mt-1 max-w-xl ${
              isSecDark ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Authentic slow-dum Biriyanis, hot Malabar Porottas &amp; tea snacks freshly prepared at our Manchester store. Limited portions daily!
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                requestPushPermission();
                setIsNotificationModalOpen(true);
              }}
              style={{ 
                backgroundColor: theme.accentButtonColor,
                color: btnTextColor
              }}
              className="px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md hover:brightness-110 cursor-pointer active:scale-95"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Get Biriyani Alerts</span>
            </button>
          </div>
        </div>

        {/* Specials Cards / Tables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 relative z-10">
          {dailySpecials.map((special) => {
            const isJustAdded = addedId === special.id;

            return (
              <div
                key={special.id}
                style={{ 
                  backgroundColor: theme.cardBgColor,
                  borderColor: theme.cardBorderColor
                }}
                className="backdrop-blur-md border-2 rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between group shadow-lg relative overflow-hidden hover:scale-[1.01]"
              >
                {/* Special Food Image Platter */}
                <div className="relative w-full aspect-4/3 rounded-xl overflow-hidden mb-3.5 bg-slate-900/50 border border-white/10 shadow-inner">
                  <Image
                    src={special.imageUrl || '/specials/thalassery_chicken_biriyani.jpg'}
                    alt={special.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Top Badge */}
                  <span 
                    style={{ 
                      backgroundColor: theme.badgeColor,
                      color: getContrastTextColor(theme.badgeColor)
                    }}
                    className="absolute top-2.5 left-2.5 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1"
                  >
                    <Flame className="w-3 h-3" />
                    <span>{special.badge || "Today's Special"}</span>
                  </span>

                  {/* Portions Remaining Indicator */}
                  <span className="absolute bottom-2.5 left-2.5 text-[10px] font-black bg-slate-950/85 backdrop-blur-md text-amber-300 px-2.5 py-1 rounded-lg border border-amber-400/30 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-rose-400 fill-rose-400 animate-pulse" />
                    <span>
                      {special.isSoldOut 
                        ? 'Sold Out for Today' 
                        : `Only ${special.portionsRemaining} portions left!`}
                    </span>
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4 text-left">
                  <div 
                    style={{ color: theme.priceColor }}
                    className="flex items-center gap-1.5 text-[11px] font-bold"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{special.availableTime}</span>
                  </div>

                  <h3 className={`font-black text-sm sm:text-base leading-snug transition-colors ${
                    isCardDark ? 'text-white group-hover:text-amber-300' : 'text-slate-900 group-hover:text-emerald-700'
                  }`}>
                    {special.title}
                  </h3>

                  <p className={`text-xs line-clamp-2 leading-relaxed ${
                    isCardDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {special.description}
                  </p>
                </div>

                {/* Pricing & Add to Basket Button */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3 mt-auto">
                  <div>
                    <span 
                      style={{ color: theme.priceColor }}
                      className="text-lg sm:text-xl font-black block"
                    >
                      £{special.price.toFixed(2)}
                    </span>
                    <span className={`text-[10px] block font-medium ${
                      isCardDark ? 'text-slate-300' : 'text-slate-500'
                    }`}>
                      Portion with Sides
                    </span>
                  </div>

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
                    className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-md ${
                      special.isSoldOut
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                        : isJustAdded
                        ? 'shadow-emerald-500/30'
                        : 'hover:brightness-110'
                    }`}
                  >
                    {special.isSoldOut ? (
                      <span>Sold Out</span>
                    ) : isJustAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Added to Cart</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Pre-Order Box</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {/* Bottom Trust Line */}
        <div className={`mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs ${
          isSecDark ? 'text-slate-400' : 'text-slate-600'
        }`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Prepared fresh daily with authentic Kerala spices at 4 Wallbrook Drive, Manchester</span>
          </div>
          <span 
            style={{ color: theme.priceColor }}
            className="font-bold"
          >
            ⚡ Same-day local Manchester doorstep dispatch or store counter collection
          </span>
        </div>

      </div>
    </section>
  );
};
