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
import { WhatsAppOrderModal } from '@/components/WhatsAppOrderModal';
import { HomeHero, ServiceStrip, DepartmentGrid, ProductRail, BrandStrip, HelloFromShop, WhatsAppBand } from '@/components/home/HomeSections';
import { CATEGORIES, BRANDS, INITIAL_PRODUCTS } from '@/lib/mock-data';
import { Product, Category } from '@/types';
import { useStoreConfig } from '@/context/StoreConfigContext';
import { useCart } from '@/context/CartContext';
import { matchProductToCategory, matchProductSearch } from '@/lib/product-matching';

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
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  // Sync products from /api/products (including live POS additions & stock) and localStorage
  useEffect(() => {
    const loadProducts = async () => {
      let serverProducts: Product[] = [];
      try {
        const res = await fetch('/api/products?limit=5000');
        if (res.ok) {
          const json = await res.json();
          if (json.products && Array.isArray(json.products) && json.products.length > 0) {
            serverProducts = json.products;
          }
        }
      } catch {
        // fallback
      }

      if (serverProducts.length > 0) {
        setProducts(serverProducts);
      } else {
        // Only fallback to localStorage or INITIAL_PRODUCTS if server query failed
        try {
          const saved = localStorage.getItem('kss_products');
          if (saved) {
            const localList: Product[] = JSON.parse(saved);
            if (localList.length > 0) {
              setProducts(localList);
              return;
            }
          }
        } catch {}
        setProducts(INITIAL_PRODUCTS);
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

  const handleSelectCategory = (slug: string | null) => {
    setSelectedCategory(slug);
    if (slug) {
      setTimeout(() => {
        const el = document.getElementById('catalog-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 60);
    }
  };

  // Filter products based on search, category, brand, offers, in-stock
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const hasSearch = Boolean(searchQuery.trim());
      // When searching, match across the entire store unless a specific brand/offer filter is set
      if (!hasSearch && selectedCategory && !matchProductToCategory(p, selectedCategory)) return false;
      if (selectedBrand && p.brand !== selectedBrand) return false;
      if (onlyOffers && !p.offerPrice && !p.isOffer) return false;
      if (onlyInStock && p.stock <= 0) return false;
      if (hasSearch && !matchProductSearch(p, searchQuery)) return false;
      return true;
    }).sort((a, b) => {
      // Prioritize In-Stock items first at top
      const aInStock = a.stock > 0 ? 1 : 0;
      const bInStock = b.stock > 0 ? 1 : 0;
      if (bInStock !== aInStock) {
        return bInStock - aInStock;
      }

      if (sortBy === 'price-asc') {
        return (Number(a.price) || 0) - (Number(b.price) || 0);
      }
      if (sortBy === 'price-desc') {
        return (Number(b.price) || 0) - (Number(a.price) || 0);
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
    return products.filter((p) => Boolean((p.offerPrice && p.offerPrice < p.price) || p.isOffer));
  }, [products]);

  // Progressive rendering for instantaneous 60fps load speeds (36 items per batch)
  const [visibleCount, setVisibleCount] = useState<number>(36);

  // Reset pagination batch when filters or searches change
  useEffect(() => {
    setVisibleCount(36);
  }, [selectedCategory, selectedBrand, searchQuery, onlyOffers, onlyInStock, sortBy]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  // Brand items count
  const availableBrandsWithCount = useMemo(() => {
    const list = selectedCategory
      ? products.filter((p) => matchProductToCategory(p, selectedCategory))
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

  // ---- Homepage rows (Option 7) ----
  const hasOwnPhoto = (p: Product) => (p.imageUrl || '').includes('/products/google/');
  // Homepage rows favour well-known brands so the first products customers see are familiar packs.
  const BRANDS_FIRST = new RegExp('(eastern|melam|nirapara|brahmins|double horse|ajmi|kitchen treasures|palat|pavizham|saras|tasty nibbles|loyal|haldiram|britannia|parle|medimix|dettol|vim|colgate|santoor|chandrika|kpl|milma|aashirvaad|tata|bru|horlicks)', 'i');
  const pickFrom = (slugs: string[], n = 6) =>
    products
      .filter((p) => slugs.includes(p.categorySlug) && p.stock > 0 && hasOwnPhoto(p))
      .sort((a, b) => Number(BRANDS_FIRST.test(b.name)) - Number(BRANDS_FIRST.test(a.name)))
      .slice(0, n);
  const STAPLE_IDS = [
    '305f1d4a-1584-4728-8f09-258adcb8b3da', // Aashirvaad atta 5kg
    '29196cbc-03c1-475f-a2cc-fc486a70dae3', // Double Horse matta 5kg
    'b03e219a-44af-4424-b0df-c475006b8d8c', // Milma ghee
    'afce7cad-51bb-499f-b97c-264c2dccbd66', // KPL coconut oil
  ];
  const staples = useMemo(() => {
    const byId = STAPLE_IDS.map((id) => products.find((p) => p.id === id && p.stock > 0)).filter(Boolean) as Product[];
    return byId.length >= 4 ? byId : [...byId, ...pickFrom(['rice-and-rice-products', 'oils-and-ghee'], 4 - byId.length)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);
  const categoryCounts = useMemo(() => {
    const m: Record<string, number> = {};
    products.forEach((p) => { m[p.categorySlug] = (m[p.categorySlug] || 0) + 1; });
    return m;
  }, [products]);
  const railBreakfast = useMemo(() => pickFrom(['breakfast-powders']), [products]); // eslint-disable-line react-hooks/exhaustive-deps
  const railMasala = useMemo(() => pickFrom(['masala-and-curry-powders']), [products]); // eslint-disable-line react-hooks/exhaustive-deps
  const railSnacks = useMemo(() => pickFrom(['crisps-and-snacks', 'biscuits-and-sweets']), [products]); // eslint-disable-line react-hooks/exhaustive-deps
  const railHome = useMemo(() => pickFrom(['personal-care', 'household-and-cleaning']), [products]); // eslint-disable-line react-hooks/exhaustive-deps
  const shopPhone = config.phone || '+44 7749 132122';

  // Theme dynamic gradients
  const heroGradient = 
    config.theme === 'onam'
      ? 'from-amber-950 via-amber-900 to-emerald-950'
      : config.theme === 'christmas'
      ? 'from-rose-950 via-slate-950 to-emerald-950'
      : 'from-emerald-950 via-slate-900 to-emerald-950';

  return (
    <div className="min-h-screen flex flex-col bg-shop-cream text-shop-ink">
      {/* Creative Luxury Opening Splash Animation with Transparent Badge */}
      <OpeningSplashAnimation />

      {/* Top Header */}
      <Header
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onSelectCategory={(slug) => { setSearchQuery(''); handleSelectCategory(slug); }}
        hasOffers={offerProducts.length > 0}
        selectedCategory={selectedCategory}
        onOpenPostcodeModal={() => setIsPostcodeModalOpen(true)}
        currentPostcode={customerPostcode || 'Manchester (M9 8DX) & UK'}
      />


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
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {displayedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onOpenDetails={(p) => setActiveProduct(p)}
                    />
                  ))}
                </div>

                {filteredProducts.length > visibleCount && (
                  <div className="pt-4 pb-2 text-center space-y-2">
                    <p className="text-xs text-slate-500 font-medium">
                      Showing <strong className="text-slate-800">{displayedProducts.length}</strong> of <strong className="text-slate-800">{filteredProducts.length}</strong> matching groceries
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => setVisibleCount((prev) => Math.min(prev + 36, filteredProducts.length))}
                        className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                      >
                        <span>Load More Results</span>
                        <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                      </button>
                      {filteredProducts.length > visibleCount + 36 && (
                        <button
                          onClick={() => setVisibleCount(filteredProducts.length)}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                        >
                          Show All ({filteredProducts.length})
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
        {/* Option 7 homepage: supermarket layout with a human touch */}
        {!searchQuery && (
          <>
            <HomeHero
              staples={staples}
              onShopStaples={() => handleSelectCategory('rice-and-rice-products')}
              onSelectCategory={(slug) => handleSelectCategory(slug)}
            />
            <ServiceStrip threshold={currentZone?.freeThreshold || 50} onWhatsApp={() => setIsWhatsAppOpen(true)} />
            <DepartmentGrid counts={categoryCounts} onSelect={(slug) => handleSelectCategory(slug)} />
            {offerProducts.length > 0 && (
              <ProductRail
                id="offers-section"
                title="This week's offers"
                note="while stocks last"
                noteColor="text-shop-red"
                products={offerProducts}
                onOpen={(p) => setActiveProduct(p)}
                onSeeAll={() => { setOnlyOffers(true); document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' }); }}
              />
            )}
            <ProductRail title="Kerala breakfast" note="puttu, appam, idiyappam" products={railBreakfast} onOpen={(p) => setActiveProduct(p)} onSeeAll={() => handleSelectCategory('breakfast-powders')} />
            <BrandStrip onPick={(b) => setSearchQuery(b)} />
            <ProductRail title="Masala & curry powders" note="for the Sunday curry" products={railMasala} onOpen={(p) => setActiveProduct(p)} onSeeAll={() => handleSelectCategory('masala-and-curry-powders')} />
            <ProductRail title="Tea-time snacks & sweets" note="with a hot chaya" products={railSnacks} onOpen={(p) => setActiveProduct(p)} onSeeAll={() => handleSelectCategory('crisps-and-snacks')} />
            <ProductRail title="Home & personal care" products={railHome} onOpen={(p) => setActiveProduct(p)} onSeeAll={() => handleSelectCategory('personal-care')} />
            <HelloFromShop products={staples} />
            <WhatsAppBand phone={shopPhone} onOpen={() => setIsWhatsAppOpen(true)} />
          </>
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
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {displayedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onOpenDetails={(p) => setActiveProduct(p)}
                      />
                    ))}
                  </div>

                  {filteredProducts.length > visibleCount && (
                    <div className="pt-6 pb-4 text-center space-y-2 border-t border-slate-100">
                      <p className="text-xs text-slate-500 font-medium">
                        Showing <strong className="text-slate-800 font-bold">{displayedProducts.length}</strong> of <strong className="text-slate-800 font-bold">{filteredProducts.length}</strong> groceries
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => setVisibleCount((prev) => Math.min(prev + 36, filteredProducts.length))}
                          className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                        >
                          <span>Load More Groceries</span>
                          <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                        </button>
                        {filteredProducts.length > visibleCount + 36 && (
                          <button
                            onClick={() => setVisibleCount(filteredProducts.length)}
                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                          >
                            View All ({filteredProducts.length})
                          </button>
                        )}
                      </div>
                    </div>
                  )}
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
      <WhatsAppOrderModal isOpen={isWhatsAppOpen} onClose={() => setIsWhatsAppOpen(false)} />

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
