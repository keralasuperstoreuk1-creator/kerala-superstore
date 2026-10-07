'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Check, 
  SlidersHorizontal, 
  Truck, 
  Package, 
  Search,
  ArrowRight,
  ShieldAlert,
  ShoppingBag,
  Star,
  MapPin,
  Clock,
  Heart,
  ChevronRight,
  Flame,
  Zap,
  Grid,
  Leaf,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { ProductModal } from '@/components/ProductModal';
import { CartDrawer } from '@/components/CartDrawer';
import { PostcodeModal } from '@/components/PostcodeModal';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { CookieBanner } from '@/components/CookieBanner';
import { Footer } from '@/components/Footer';
import { SpecialOfferBanner } from '@/components/SpecialOfferBanner';
import { CategoryQuickShopModal } from '@/components/CategoryQuickShopModal';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { TodayOffersMovingShowcase } from '@/components/TodayOffersMovingShowcase';
import { OpeningSplashAnimation } from '@/components/OpeningSplashAnimation';
import { DailyKitchenSpecialsShowcase } from '@/components/DailyKitchenSpecialsShowcase';
import { AppDownloadSection } from '@/components/AppDownloadSection';
import { EmarketHeroSection } from '@/components/EmarketHeroSection';
import { FeaturedArchedCategories } from '@/components/FeaturedArchedCategories';
import { ComboBundlesShowcase } from '@/components/ComboBundlesShowcase';
import { CATEGORIES, BRANDS, INITIAL_PRODUCTS } from '@/lib/mock-data';
import { Product, Category } from '@/types';
import { useStoreConfig } from '@/context/StoreConfigContext';
import { useCart } from '@/context/CartContext';

export default function HomePage() {
  const { config } = useStoreConfig();
  const { customerPostcode, setCustomerPostcode, currentZone } = useCart();
  
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [onlyOffers, setOnlyOffers] = useState<boolean>(false);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');
  
  // Modals
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [isPostcodeModalOpen, setIsPostcodeModalOpen] = useState(false);
  const [quickShopCategory, setQuickShopCategory] = useState<Category | null>(null);

  // Sync products from localStorage if admin added or updated them
  useEffect(() => {
    const loadProducts = () => {
      try {
        const saved = localStorage.getItem('kss_products');
        if (saved) {
          setProducts(JSON.parse(saved));
        }
      } catch {
        // fallback
      }
    };

    loadProducts();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'kss_products') {
        loadProducts();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('kss_products_updated', loadProducts);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('kss_products_updated', loadProducts);
    };
  }, []);

  // Filter products based on search, category, brand, offers, in-stock
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const hasSearch = Boolean(searchQuery.trim());
      // When searching, match across the entire store unless a specific brand/offer filter is set
      if (!hasSearch && selectedCategory && p.categorySlug !== selectedCategory) return false;
      if (selectedBrand && p.brand !== selectedBrand) return false;
      if (onlyOffers && !p.offerPrice) return false;
      if (onlyInStock && p.stock <= 0) return false;
      if (hasSearch) {
        const q = searchQuery.toLowerCase().trim();
        // Combined searchable profile: name, brand, category, weight/size, description, and tags
        const searchableText = `${p.name} ${p.brand} ${p.category} ${p.categorySlug} ${p.sizeWeight || ''} ${p.description || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
        // Multi-term search: every typed word must match somewhere in the product's attributes
        const terms = q.split(/\s+/).filter(Boolean);
        const matchesAllTerms = terms.every((term) => searchableText.includes(term));
        if (!matchesAllTerms) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') {
        const pA = a.offerPrice ?? a.price;
        const pB = b.offerPrice ?? b.price;
        return pA - pB;
      }
      if (sortBy === 'price-desc') {
        const pA = a.offerPrice ?? a.price;
        const pB = b.offerPrice ?? b.price;
        return pB - pA;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      // 'featured'
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    });
  }, [products, selectedCategory, selectedBrand, onlyOffers, onlyInStock, searchQuery, sortBy]);

  // Products on offer
  const offerProducts = useMemo(() => {
    return products.filter((p) => Boolean(p.offerPrice && p.offerPrice < p.price));
  }, [products]);

  // Brand items count
  const availableBrandsWithCount = useMemo(() => {
    const list = selectedCategory
      ? products.filter((p) => p.categorySlug === selectedCategory)
      : products;
    
    const countMap: Record<string, number> = {};
    list.forEach((p) => {
      countMap[p.brand] = (countMap[p.brand] || 0) + 1;
    });

    return Object.entries(countMap).map(([brand, count]) => ({
      brand,
      count
    }));
  }, [products, selectedCategory]);

  const scrollToOffers = () => {
    const el = document.getElementById('special-offers-section') || document.getElementById('catalog-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToDepartments = () => {
    const el = document.getElementById('departments-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Theme dynamic gradients
  const heroGradient = 
    config.theme === 'onam'
      ? 'from-amber-950 via-amber-900 to-emerald-950'
      : config.theme === 'christmas'
      ? 'from-rose-950 via-slate-950 to-emerald-950'
      : 'from-emerald-950 via-slate-900 to-emerald-950';

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf8]">
      {/* Creative Luxury Opening Splash Animation with Transparent Badge */}
      <OpeningSplashAnimation />

      {/* Top Header */}
      <Header
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onSelectCategory={(slug) => {
          setSelectedCategory(slug);
          if (slug) {
            const matched = CATEGORIES.find((c) => c.slug === slug);
            if (matched) setQuickShopCategory(matched);
          }
        }}
        selectedCategory={selectedCategory}
        onOpenPostcodeModal={() => setIsPostcodeModalOpen(true)}
        currentPostcode={customerPostcode || 'Manchester (M9 8PX) & UK'}
      />

      {/* Animated Special Offer Marquee Banner */}
      <SpecialOfferBanner onScrollToOffers={scrollToOffers} />

      <main className="flex-1 pb-4 lg:pb-6">
        {/* Instant Dedicated Search Results Section (Renders immediately at top when search is active) */}
        {searchQuery.trim() && (
          <section id="search-results-section" className="max-w-7xl mx-auto px-4 py-6 scroll-mt-24">
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-500/30 shadow-md mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  <Search className="w-4 h-4 text-emerald-700" />
                  <span>Search Inventory</span>
                </div>
                <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                  Search results for &ldquo;{searchQuery}&rdquo;
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Found <strong className="text-emerald-800 font-bold">{filteredProducts.length}</strong> matching Kerala groceries across all departments
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto justify-between sm:justify-end">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 font-semibold hidden sm:inline">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-800 text-xs outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="featured">Featured</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="name">Name (A-Z)</option>
                  </select>
                </div>

                <button
                  onClick={() => setSearchQuery('')}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <span>Clear Search</span>
                  <span className="text-sm leading-none">&times;</span>
                </button>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
                  <Package className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base sm:text-lg">No products found for &ldquo;{searchQuery}&rdquo;</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    We couldn&apos;t find an exact match. Try checking the spelling or tap a popular Kerala grocery staple below:
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto pt-2">
                  {['Matta Rice', 'Eastern Masala', 'Nirapara', 'Banana Chips', 'Sambar Masala', 'Pickle', 'Tapioca (Kappa)', 'Coconut Oil'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSearchQuery(tag)}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 rounded-full text-xs font-semibold text-slate-700 transition-all cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory(null);
                      setSelectedBrand(null);
                    }}
                    className="px-5 py-2.5 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    View All Groceries
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onOpenDetails={(p) => setActiveProduct(p)}
                  />
                ))}
              </div>
            )}
          </section>
        )}
        {/* EMARKET Supermarket Layout: 3-Column Banner, Arched Categories, and Deals of the Week */}
        {!selectedCategory && !searchQuery && (
          <>
            {(config.modules?.showHeroSlider ?? true) && (
              <EmarketHeroSection
                onSelectCategory={(slug) => setSelectedCategory(slug)}
                selectedCategory={selectedCategory}
                onQuickShop={(cat) => setQuickShopCategory(cat)}
                onScrollToDeals={scrollToOffers}
              />
            )}

            {(config.modules?.showFeaturedCategories ?? true) && (
              <FeaturedArchedCategories
                onSelectCategory={(slug) => setSelectedCategory(slug)}
                selectedCategory={selectedCategory}
              />
            )}
          </>
        )}

        {/* TODAY'S FLASH DEALS CONTINUOUS SMOOTH MOVING SHOWCASE (Moved High Up to the Top) */}
        {(config.modules?.showMovingOffers ?? true) && !selectedCategory && !searchQuery && offerProducts.length > 0 && (
          <TodayOffersMovingShowcase
            products={offerProducts}
            onSelectProduct={(p) => setActiveProduct(p)}
            onViewAllDeals={() => {
              setOnlyOffers(true);
              const el = document.getElementById('catalog-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        )}

        {/* TODAY'S FRESH KITCHEN & DAILY SPECIALS (Biriyanis, Porottas & Tea Snacks) */}
        {(config.modules?.showKitchenSpecials ?? true) && !selectedCategory && !searchQuery && (
          <DailyKitchenSpecialsShowcase />
        )}

        {/* CREATIVE INFINITE BRAND LOGO MARQUEE TICKER */}
        {(config.modules?.showBrandMarquee ?? true) && !selectedCategory && !searchQuery && (
          <div className="bg-white border-b border-slate-200 py-3 overflow-hidden shadow-2xs">
            <div className="max-w-7xl mx-auto px-4 mb-2 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                Authentic Kerala Brands Stocked Direct:
              </span>
              <span className="text-emerald-800 font-bold text-[10px]">
                100% Genuine Packaging
              </span>
            </div>
            <div className="flex overflow-hidden">
              <div className="animate-marquee-brands flex items-center gap-6 text-xs font-bold text-slate-700 whitespace-nowrap">
                {BRANDS.concat(BRANDS).map((b, i) => (
                  <button
                    key={`${b.id}-${i}`}
                    onClick={() => setSelectedBrand(b.name)}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200/80 transition-all cursor-pointer shrink-0"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>{b.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({b.productCount}+ items)</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}



        {/* Luxury 2026 Category Showcase with REAL PHOTOGRAPHIC IMAGES */}
        {(config.modules?.showCuratedDepartments ?? true) && !searchQuery && (
          <section id="departments-section" className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-widest mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span>Curated Departments</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Explore by Category</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tap any category to open varieties, brands &amp; quick-add options (like dresses &amp; fashion collections!)
                </p>
              </div>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full transition-all self-start sm:self-auto cursor-pointer"
                >
                  Clear Filter • View All Departments
                </button>
              )}
            </div>

            {/* 10 Luxury Category Cards - CLICK OPENS QUICK-SHOP POPUP WITH VARIETIES */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.slug;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setQuickShopCategory(cat);
                      setSelectedCategory(cat.slug);
                    }}
                    className={`p-3 rounded-3xl border text-left transition-all duration-300 flex flex-col justify-between group cursor-pointer relative overflow-hidden active:scale-98 ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/90 shadow-xl ring-2 ring-emerald-600/30 -translate-y-1'
                        : 'border-slate-200/90 hover:border-emerald-400/80 bg-white hover:shadow-xl hover:-translate-y-1'
                    }`}
                  >
                    {/* Real Photographic Food Thumbnail */}
                    <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden mb-2.5 bg-slate-100 shadow-2xs border border-slate-100">
                      <Image
                        src={cat.imageUrl || `/categories/rice.jpg`}
                        alt={cat.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                      
                      <span className="absolute bottom-2 left-2 text-[9px] font-black text-white bg-slate-950/75 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20">
                        {cat.itemCount} items
                      </span>

                      {/* Quick Shop Hint Pill on Card */}
                      <span className="absolute top-2 right-2 text-[9px] font-bold text-amber-300 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-amber-300/30 flex items-center gap-0.5 opacity-90 group-hover:opacity-100">
                        <span>Varieties</span>
                        <ChevronRight className="w-2.5 h-2.5" />
                      </span>
                    </div>

                    <div>
                      <h3 className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-emerald-900 leading-snug line-clamp-1">
                        {cat.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 font-medium">
                        {cat.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Curated Pre-packed Kerala Combo Bundles & Feast Kits */}
        {(config.modules?.showComboBundles ?? true) && !searchQuery && (
          <ComboBundlesShowcase />
        )}

        {/* Main Catalog with Filters & Sidebar (Shown in standard view) */}
        {!searchQuery && (
          <section id="catalog-section" className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Sidebar Filters */}
            <aside className="lg:w-64 shrink-0 space-y-5">
              <div className="bg-white p-4.5 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                    <SlidersHorizontal className="w-4 h-4 text-emerald-700" />
                    <span>Filter Groceries</span>
                  </div>
                  {(selectedCategory || selectedBrand || onlyOffers || onlyInStock) && (
                    <button
                      onClick={() => {
                        setSelectedCategory(null);
                        setSelectedBrand(null);
                        setOnlyOffers(false);
                        setOnlyInStock(false);
                      }}
                      className="text-[11px] font-semibold text-emerald-800 hover:underline cursor-pointer"
                    >
                      Reset All
                    </button>
                  )}
                </div>

                {/* Quick Toggle Filters */}
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900 font-medium">
                    <input
                      type="checkbox"
                      checked={onlyOffers}
                      onChange={(e) => setOnlyOffers(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span className="flex items-center gap-1">
                      <span>🔥 Special Offers Only</span>
                      <span className="text-[10px] bg-rose-50 text-rose-700 px-1.5 rounded-full font-bold">
                        {offerProducts.length}
                      </span>
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900 font-medium">
                    <input
                      type="checkbox"
                      checked={onlyInStock}
                      onChange={(e) => setOnlyInStock(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600"
                    />
                    <span>In Stock Only</span>
                  </label>
                </div>

                {/* Brands Filter */}
                <div className="pt-3 border-t border-slate-100">
                  <h4 className="font-bold text-xs text-slate-900 mb-2.5 flex items-center justify-between">
                    <span>Authentic Brands</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {availableBrandsWithCount.length} available
                    </span>
                  </h4>
                  <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                    <button
                      onClick={() => setSelectedBrand(null)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                        selectedBrand === null
                          ? 'bg-emerald-50 text-emerald-900 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>All Brands</span>
                      <span className="text-[10px] text-slate-400">{products.length}</span>
                    </button>
                    {availableBrandsWithCount.map(({ brand, count }) => (
                      <button
                        key={brand}
                        onClick={() => setSelectedBrand(selectedBrand === brand ? null : brand)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                          selectedBrand === brand
                            ? 'bg-emerald-50 text-emerald-900 font-bold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{brand}</span>
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-500 font-medium">
                          {count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Natasha's Law Allergen Notice */}
                <div className="pt-3 border-t border-slate-100 bg-amber-50/70 p-3 rounded-2xl border border-amber-200/60 text-[11px] text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                    <span>Natasha&apos;s Law Allergen Info</span>
                  </div>
                  <p className="text-slate-600 leading-snug">
                    All packaged products clearly declare ingredients and major allergens for your peace of mind.
                  </p>
                </div>
              </div>
            </aside>

            {/* Product Grid Area */}
            <div className="flex-1 space-y-4">
              {/* Header Bar */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {selectedCategory
                      ? CATEGORIES.find((c) => c.slug === selectedCategory)?.name
                      : 'All Groceries'}
                    {selectedBrand && ` — ${selectedBrand}`}
                    {onlyOffers && ` (Special Offers)`}
                  </h3>
                  <div className="text-xs text-slate-500">
                    Showing <strong className="text-slate-800">{filteredProducts.length}</strong> items
                    {searchQuery && ` for "${searchQuery}"`}
                  </div>
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium">Sort By:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    aria-label="Sort products by"
                    className="px-3.5 py-1.5 border border-slate-200 rounded-xl bg-white font-bold text-slate-800 outline-none focus:border-emerald-600 shadow-2xs cursor-pointer"
                  >
                    <option value="featured">Featured / Best Sellers</option>
                    <option value="price-asc">Price: Low to High (£)</option>
                    <option value="price-desc">Price: High to Low (£)</option>
                    <option value="name">Product Name (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Products Grid */}
              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
                  <Package className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-800 text-base">No products found</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Try adjusting your category or brand filter, or searching for another Kerala grocery staple.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      setSelectedBrand(null);
                      setSearchQuery('');
                      setOnlyOffers(false);
                      setOnlyInStock(false);
                    }}
                    className="px-5 py-2 bg-emerald-800 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-all cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onOpenDetails={(p) => setActiveProduct(p)}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>
        </section>
        )}

        {/* Official Kerala Superstore Mobile App Showcase Section */}
        {(config.modules?.showAppDownload ?? true) && (
          <AppDownloadSection />
        )}
      </main>

      {/* Global Modals & Drawers */}
      <CategoryQuickShopModal
        category={quickShopCategory}
        isOpen={quickShopCategory !== null}
        onClose={() => setQuickShopCategory(null)}
        products={products}
        onOpenProductDetails={(p) => setActiveProduct(p)}
      />

      <ProductModal
        product={activeProduct}
        onClose={() => setActiveProduct(null)}
      />

      <CartDrawer />

      <PostcodeModal
        isOpen={isPostcodeModalOpen}
        onClose={() => setIsPostcodeModalOpen(false)}
        onSavePostcode={setCustomerPostcode}
        currentPostcode={customerPostcode}
      />

      <WhatsAppButton />
      <CookieBanner />
      <Footer />

      {/* Mobile-First Sticky Bottom Navigation & Cart Preview */}
      <MobileBottomNav
        onOpenCategories={scrollToDepartments}
        onOpenDeals={scrollToOffers}
        onGoHome={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setSelectedCategory(null);
          setSelectedBrand(null);
          setSearchQuery('');
          setOnlyOffers(false);
        }}
      />
    </div>
  );
}
