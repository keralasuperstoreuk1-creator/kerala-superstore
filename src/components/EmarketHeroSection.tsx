'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Wheat, 
  Flame, 
  Leaf, 
  Cookie, 
  Droplet, 
  CookingPot, 
  Snowflake, 
  Coffee,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  ShoppingBag
} from 'lucide-react';
import { CATEGORIES } from '@/lib/mock-data';
import { Category, HeroSlide, SpotlightPromoConfig } from '@/types';
import { DEFAULT_HERO_SLIDES, DEFAULT_SPOTLIGHT_PROMO } from '@/lib/hero-slides';

interface EmarketHeroSectionProps {
  onSelectCategory: (slug: string | null) => void;
  selectedCategory: string | null;
  onQuickShop: (category: Category) => void;
  onScrollToDeals: () => void;
}

const CUTOUT_MIGRATION_MAP: Record<string, string> = {
  '/branding/kerala-grocery-basket.jpg': '/branding/kerala-grocery-basket-cutout.png',
  '/branding/kerala-spices-pack.jpg': '/branding/kerala-spices-pack-cutout.png',
  '/specials/thalassery_chicken_biriyani.jpg': '/specials/thalassery_chicken_biriyani-cutout.png',
  '/branding/kerala-snacks-showcase.jpg': '/branding/kerala-snacks-showcase-cutout.png',
  '/branding/kerala-coconut-oil-promo.jpg': '/branding/kerala-coconut-oil-promo-cutout.png',
};

const migrateImageSrc = (src?: string | null): string => {
  if (!src) return '';
  return CUTOUT_MIGRATION_MAP[src] || src;
};

export const EmarketHeroSection: React.FC<EmarketHeroSectionProps> = ({
  onSelectCategory,
  selectedCategory,
  onQuickShop,
  onScrollToDeals,
}) => {
  const [slides, setSlides] = useState<HeroSlide[]>(DEFAULT_HERO_SLIDES);
  const [spotlightPromo, setSpotlightPromo] = useState<SpotlightPromoConfig>(DEFAULT_SPOTLIGHT_PROMO);
  const [categoriesList, setCategoriesList] = useState<Category[]>(CATEGORIES);
  const [activeSlide, setActiveSlide] = useState(0);

  // Sync custom slides, promo card & categories from localStorage & Cloudflare R2 Cloud
  const loadCustomData = () => {
    try {
      const saved = localStorage.getItem('kss_hero_slides');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 1) {
          const migrated = parsed.map((s: HeroSlide) => ({
            ...s,
            image: migrateImageSrc(s.image),
          }));
          setSlides(migrated);
        } else {
          setSlides(DEFAULT_HERO_SLIDES);
        }
      } else {
        setSlides(DEFAULT_HERO_SLIDES);
      }
    } catch {
      setSlides(DEFAULT_HERO_SLIDES);
    }

    try {
      const savedPromo = localStorage.getItem('kss_spotlight_promo');
      if (savedPromo) {
        const parsed = JSON.parse(savedPromo);
        const migrated = {
          ...parsed,
          image: migrateImageSrc(parsed.image),
        };
        setSpotlightPromo(migrated);
      } else {
        setSpotlightPromo(DEFAULT_SPOTLIGHT_PROMO);
      }
    } catch {
      setSpotlightPromo(DEFAULT_SPOTLIGHT_PROMO);
    }

    try {
      const savedCats = localStorage.getItem('kss_categories');
      if (savedCats) {
        const parsedCats = JSON.parse(savedCats);
        if (Array.isArray(parsedCats) && parsedCats.length > 0) {
          setCategoriesList(parsedCats);
        }
      }
    } catch {}
  };

  // Fetch live global configuration from Cloudflare R2 Cloud
  const fetchCloudConfig = async () => {
    try {
      const res = await fetch('/api/store/config');
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.heroSlides) && data.heroSlides.length > 0) {
          const migrated = data.heroSlides.map((s: HeroSlide) => ({
            ...s,
            image: migrateImageSrc(s.image),
          }));
          setSlides(migrated);
          try { localStorage.setItem('kss_hero_slides', JSON.stringify(migrated)); } catch {}
        }
        if (data.spotlightPromo) {
          const migratedPromo = {
            ...data.spotlightPromo,
            image: migrateImageSrc(data.spotlightPromo.image),
          };
          setSpotlightPromo(migratedPromo);
          try { localStorage.setItem('kss_spotlight_promo', JSON.stringify(migratedPromo)); } catch {}
        }
      }
    } catch (e) {
      console.warn('Could not fetch cloud config, using local cache:', e);
    }
  };

  useEffect(() => {
    // 1. Load immediately from local cache for 0ms initial render
    loadCustomData();

    // 2. Fetch live latest from Cloudflare R2 cloud (syncs across all computers & devices)
    fetchCloudConfig();

    const handleUpdate = () => loadCustomData();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('kss_hero_slides_updated', handleUpdate);
    window.addEventListener('kss_spotlight_promo_updated', handleUpdate);
    window.addEventListener('kss_categories_updated', handleUpdate);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('kss_hero_slides_updated', handleUpdate);
      window.removeEventListener('kss_spotlight_promo_updated', handleUpdate);
      window.removeEventListener('kss_categories_updated', handleUpdate);
    };
  }, []);


  // Auto slide every 6 seconds
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  // Category Icon helper
  const getCategoryIcon = (slug: string) => {
    if (slug.includes('rice')) return <Wheat className="w-4 h-4 text-amber-600" />;
    if (slug.includes('masala')) return <Flame className="w-4 h-4 text-rose-600" />;
    if (slug.includes('spices')) return <Leaf className="w-4 h-4 text-emerald-600" />;
    if (slug.includes('snacks')) return <Cookie className="w-4 h-4 text-amber-600" />;
    if (slug.includes('oils')) return <Droplet className="w-4 h-4 text-cyan-600" />;
    if (slug.includes('pickles')) return <CookingPot className="w-4 h-4 text-red-600" />;
    if (slug.includes('frozen')) return <Snowflake className="w-4 h-4 text-blue-600" />;
    return <Coffee className="w-4 h-4 text-yellow-600" />;
  };

  const currentSlide = slides[activeSlide] || slides[0] || DEFAULT_HERO_SLIDES[0];
  const isExternalImg = currentSlide.image.startsWith('http') || currentSlide.image.startsWith('data:');

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* COLUMN 1: Vertical "Shop by Categories" Sidebar (Desktop) */}
        <div className="hidden lg:flex lg:col-span-3 flex-col bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Header */}
          <div className="bg-[#5ea813] text-white px-4 py-3 flex items-center justify-between font-black text-xs uppercase tracking-wider">
            <span>SHOP BY CATEGORIES</span>
            <span className="text-white/80 text-xs font-mono">☰</span>
          </div>

          {/* Category List */}
          <div className="flex-1 divide-y divide-slate-100 flex flex-col justify-between py-1">
            {categoriesList.slice(0, 8).map((cat) => {
              const isSelected = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.slug)}
                  className={`w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-left transition-colors cursor-pointer group ${
                    isSelected 
                      ? 'bg-emerald-50 text-emerald-800 font-bold' 
                      : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="shrink-0">{getCategoryIcon(cat.slug)}</span>
                    <span className="truncate">{cat.name}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              );
            })}
          </div>

          {/* Bottom All View */}
          <button
            onClick={() => onSelectCategory(null)}
            className="p-3 text-center text-xs font-bold text-emerald-700 bg-slate-50 hover:bg-emerald-50 border-t border-slate-100 transition-colors cursor-pointer"
          >
            View All Categories ({categoriesList.length}) →
          </button>
        </div>

        {/* COLUMN 2: Center Main E-Market Banner Slider */}
        {(() => {
          const bgCol = currentSlide.bgColor || '#064e3b';
          const isDark = currentSlide.textColor === 'light' || (!currentSlide.textColor && bgCol !== '#ffffff');
          const btnColor = currentSlide.accentColor || (isDark ? '#22c55e' : '#f97316');

          return (
            <div 
              style={{ backgroundColor: bgCol }}
              className={`lg:col-span-6 rounded-3xl border border-slate-200/40 shadow-md overflow-hidden p-5 sm:p-7 flex flex-col justify-between relative min-h-[380px] sm:min-h-[440px] group transition-colors duration-500`}
            >
              {/* Subtle background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent pointer-events-none" />

              {/* Top Seal Badge (100% Natural) - Neatly pinned to top right */}
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 pointer-events-none">
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-dashed p-0.5 sm:p-1 backdrop-blur-xs shadow-2xs flex items-center justify-center text-center ${
                  isDark ? 'border-emerald-300/80 bg-emerald-950/60 text-emerald-300' : 'border-[#5ea813] bg-white/90 text-[#5ea813]'
                }`}>
                  <div className={`w-full h-full rounded-full flex flex-col items-center justify-center ${
                    isDark ? 'bg-emerald-400/10' : 'bg-[#5ea813]/10'
                  }`}>
                    <span className="text-[9px] sm:text-[10px] font-black leading-none uppercase">100%</span>
                    <span className="text-[7px] sm:text-[8px] font-extrabold tracking-widest leading-none mt-0.5">NATURAL</span>
                  </div>
                </div>
              </div>

              {/* Top Category Badge */}
              <div className="relative z-10 pr-16 sm:pr-20">
                <span className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  isDark 
                    ? 'text-emerald-300 bg-emerald-900/60 border border-emerald-400/30' 
                    : 'text-[#5ea813] bg-emerald-50 border border-emerald-200/60'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDark ? 'bg-emerald-400' : 'bg-[#5ea813]'}`} />
                  {currentSlide.badge}
                </span>
              </div>

              {/* 2-Column Split: Content on Left, Crisp Product Photo on Right */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center my-auto py-2 relative z-10">
                
                {/* Left Content Column (Headline, Offer Tag, Desc, CTA) */}
                <div className="sm:col-span-7 space-y-3 text-left">
                  <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-[1.12] ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {currentSlide.titleMain} <span className={isDark ? 'text-amber-400' : 'text-[#f97316]'}>{currentSlide.sub}</span> <br />
                    <span className={isDark ? 'text-white' : 'text-slate-950'}>{currentSlide.titleHighlight}</span>
                  </h2>

                  {/* Offer Tagline (e.g. SALE UP TO 48% OFF) */}
                  {currentSlide.offerTag && (
                    <div className="flex items-center gap-2 pt-0.5">
                      <div className={`border-l-2 pl-2 text-xs font-black uppercase tracking-wider ${
                        isDark ? 'border-amber-400 text-amber-300' : 'border-[#f97316] text-[#f97316]'
                      }`}>
                        {currentSlide.offerTag}
                      </div>
                    </div>
                  )}

                  <p className={`text-xs sm:text-[13px] leading-relaxed max-w-xs line-clamp-2 ${
                    isDark ? 'text-emerald-100/80' : 'text-slate-500'
                  }`}>
                    {currentSlide.desc}
                  </p>

                  {/* Modern Pill CTA Button (e.g. "Shop now →") */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        if (currentSlide.categorySlug) {
                          const cat = categoriesList.find((c) => c.slug === currentSlide.categorySlug) || CATEGORIES.find((c) => c.slug === currentSlide.categorySlug);
                          if (cat) onQuickShop(cat);
                        } else {
                          onScrollToDeals();
                        }
                      }}
                      style={{ backgroundColor: btnColor }}
                      className="px-6 py-2.5 sm:py-3 rounded-full text-white font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer active:scale-95 hover:shadow-xl"
                    >
                      <span>{currentSlide.cta || 'Shop now'}</span>
                      <span className="text-sm font-bold">→</span>
                    </button>
                  </div>
                </div>

                {/* Right Image Showcase Column (Clean Platter like Reference) */}
                <div className="sm:col-span-5 relative flex items-center justify-center sm:justify-end">
                  {(() => {
                    const scaleVal = (currentSlide.imageScale || 100) / 100;
                    const posX = currentSlide.imageX || 0;
                    const posY = currentSlide.imageY || 0;
                    return (
                      <div 
                        style={{ transform: `translate(${posX}px, ${posY}px) scale(${scaleVal})` }}
                        className="relative w-full h-48 sm:h-56 lg:h-64 flex items-center justify-center sm:justify-end transition-transform duration-300"
                      >
                        <Image
                          key={currentSlide.id}
                          src={currentSlide.image}
                          alt={currentSlide.titleHighlight || "Kerala Superstore Slide"}
                          fill
                          className="object-contain sm:object-right-center transition-all duration-300"
                          priority
                          unoptimized={isExternalImg}
                        />
                      </div>
                    );
                  })()}
                </div>

              </div>

              {/* Side arrow controls on hover */}
              {slides.length > 1 && (
                <>
                  <button
                    onClick={handlePrevSlide}
                    className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full shadow-md items-center justify-center hidden group-hover:flex z-20 cursor-pointer active:scale-90 transition-all ${
                      isDark ? 'bg-slate-900/80 hover:bg-slate-900 text-white' : 'bg-white/90 hover:bg-white text-slate-700'
                    }`}
                    title="Previous Slide"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextSlide}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full shadow-md items-center justify-center hidden group-hover:flex z-20 cursor-pointer active:scale-90 transition-all ${
                      isDark ? 'bg-slate-900/80 hover:bg-slate-900 text-white' : 'bg-white/90 hover:bg-white text-slate-700'
                    }`}
                    title="Next Slide"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Slider Pagination Dots (Numbers / Pills) */}
              <div className="flex items-center justify-center gap-2 pt-2 relative z-10">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveSlide(i)}
                    className={`w-6 h-6 rounded-full text-[11px] font-black transition-all flex items-center justify-center cursor-pointer ${
                      activeSlide === i
                        ? isDark ? 'bg-white text-slate-900 shadow-md scale-110' : 'bg-slate-900 text-white shadow-md scale-110'
                        : isDark ? 'bg-white/20 text-white/80 hover:bg-white/30' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

            </div>
          );
        })()}

        {/* COLUMN 3: Right Promotional Card (Spotlight Promo) */}
        {spotlightPromo.enabled && (() => {
          const promoBg = spotlightPromo.bgColor || 'gradient-amber';
          const isCustomBg = promoBg !== 'gradient-amber' && promoBg !== '#fffbeb';
          const isDark = spotlightPromo.textColor === 'light' || (!spotlightPromo.textColor && isCustomBg && promoBg !== '#ffffff');
          const btnColor = spotlightPromo.accentColor || '#5ea813';
          const ribbonBg = spotlightPromo.ribbonColor || '#f97316';
          const bgStyle = promoBg === 'gradient-amber' 
            ? {} 
            : { backgroundColor: promoBg };
          const bgClass = promoBg === 'gradient-amber' 
            ? 'bg-gradient-to-br from-amber-50/80 via-white to-amber-50/50' 
            : '';

          return (
            <div 
              style={bgStyle}
              className={`lg:col-span-3 ${bgClass} rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden p-6 flex flex-col justify-between relative min-h-[380px] sm:min-h-[440px] transition-colors duration-300`}
            >
              {/* Diagonal Corner Ribbon (Like EMarket Reference) */}
              <div 
                style={{ backgroundColor: ribbonBg }}
                className="absolute top-4 -right-10 text-white text-[9px] font-black uppercase tracking-wider py-1 px-10 rotate-45 shadow-sm"
              >
                {spotlightPromo.ribbonText || 'Special Offer'}
              </div>

              {/* Content */}
              <div className="space-y-1 relative z-10 text-left">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-amber-300' : 'text-slate-500'}`}>
                  {spotlightPromo.subtitle}
                </span>
                <div className={`text-xl sm:text-2xl font-black leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <span className={isDark ? 'text-amber-400' : 'text-[#f97316]'}>{spotlightPromo.highlightText}</span> <br />
                  <span className={isDark ? 'text-white' : 'text-slate-900'}>{spotlightPromo.title}</span>
                </div>
                <p className={`text-[11px] leading-tight pt-1 ${isDark ? 'text-emerald-100/80' : 'text-slate-500'}`}>
                  {spotlightPromo.description}
                </p>

                {/* Green Shop Now Button */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      const targetSlug = spotlightPromo.categorySlug || 'oils-and-ghee';
                      const targetCat = categoriesList.find((c) => c.slug === targetSlug) || CATEGORIES.find((c) => c.slug === targetSlug);
                      if (targetCat) onQuickShop(targetCat);
                      else onScrollToDeals();
                    }}
                    style={{ backgroundColor: btnColor }}
                    className="px-5 py-2.5 rounded-xl text-white font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>{spotlightPromo.buttonText || 'SHOP NOW'}</span>
                    <span className="text-sm">▷</span>
                  </button>
                </div>
              </div>

              {/* Spotlight Promo Product Image */}
              <div className="relative w-full aspect-square max-h-56 mt-3 flex items-center justify-center overflow-hidden">
                <div 
                  className="relative w-44 h-44 sm:w-48 sm:h-48 transition-transform duration-200"
                  style={{
                    transform: `translate(${spotlightPromo.imageX || 0}px, ${spotlightPromo.imageY || 0}px) scale(${(spotlightPromo.imageScale || 100) / 100})`,
                  }}
                >
                  <Image
                    src={spotlightPromo.image}
                    alt={spotlightPromo.title || "Special Promo"}
                    fill
                    className="object-contain"
                    priority
                    unoptimized={spotlightPromo.image.startsWith('data:') || spotlightPromo.image.startsWith('http')}
                  />
                </div>
              </div>

            </div>
          );
        })()}


      </div>
    </div>
  );
};
