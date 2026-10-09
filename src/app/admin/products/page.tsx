'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Sparkles, 
  Trash2, 
  ShieldCheck, 
  AlertTriangle,
  Flame,
  X,
  CheckCircle2,
  Camera,
  Upload,
  RefreshCw,
  Minus,
  Package,
  Layers,
  Check,
  Leaf,
  SlidersHorizontal,
  Eye,
  AlertCircle,
  Bell,
  MessageCircle,
  Phone,
  Mail
} from 'lucide-react';
import { INITIAL_PRODUCTS, CATEGORIES } from '@/lib/mock-data';
import { Product } from '@/types';
import { useStoreConfig } from '@/context/StoreConfigContext';
import AiImageStudioUpload from '@/components/admin/AiImageStudioUpload';

type FilterTab = 'all' | 'spices' | 'low-stock' | 'out-of-stock' | 'offers' | 'restock-leads';

export default function AdminProductsPage() {
  const { restockLeads, updateLeadStatus, deleteRestockLead } = useStoreConfig();
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [savedAlert, setSavedAlert] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

  // Offer modal state
  const [activeOfferProduct, setActiveOfferProduct] = useState<Product | null>(null);
  const [offerPriceInput, setOfferPriceInput] = useState<number>(0);
  const [isOfferActive, setIsOfferActive] = useState<boolean>(false);

  // Image Edit Modal state (with on-device AI Background Removal)
  const [activeImageEditProduct, setActiveImageEditProduct] = useState<Product | null>(null);
  const [studioSelectedImage, setStudioSelectedImage] = useState<string | null>(null);
  const [uploadedRawImage, setUploadedRawImage] = useState<string | null>(null);
  const [aiCleanPackshot, setAiCleanPackshot] = useState<string | null>(null);
  const [aiTransparentCutout, setAiTransparentCutout] = useState<string | null>(null);
  const [selectedImageOption, setSelectedImageOption] = useState<'ai-packshot' | 'ai-transparent' | 'original'>('ai-packshot');
  const [isProcessingBg, setIsProcessingBg] = useState<boolean>(false);
  const [bgProgressText, setBgProgressText] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load from server API and merge with localStorage if previously updated
  useEffect(() => {
    const loadAdminProducts = async () => {
      let serverProds: Product[] = [];
      try {
        const res = await fetch('/api/products?limit=250');
        if (res.ok) {
          const data = await res.json();
          if (data.products && Array.isArray(data.products)) {
            serverProds = data.products;
          }
        }
      } catch {
        // fallback
      }

      try {
        const saved = localStorage.getItem('kss_products');
        if (saved) {
          const localList: Product[] = JSON.parse(saved);
          if (localList.length > 0) {
            // Merge server and local
            const map = new Map<string, Product>();
            serverProds.forEach(p => map.set(p.id, p));
            localList.forEach(p => map.set(p.id, { ...(map.get(p.id) || {}), ...p }));
            setProducts(Array.from(map.values()));
            return;
          }
        }
      } catch {
        // fallback
      }

      if (serverProds.length > 0) {
        setProducts(serverProds);
      }
    };

    loadAdminProducts();
  }, []);

  const saveProducts = async (updated: Product[]) => {
    setProducts(updated);
    try {
      localStorage.setItem('kss_products', JSON.stringify(updated));
      window.dispatchEvent(new Event('kss_products_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch {
      // fallback
    }

    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {
      // background save fallback
    }
  };

  // Helper check for Kitchen Spices & Masalas
  const isKitchenSpice = (p: Product) => {
    const slug = (p.categorySlug || '').toLowerCase();
    const cat = (p.category || '').toLowerCase();
    const name = (p.name || '').toLowerCase();
    return (
      slug.includes('spice') || 
      slug.includes('masala') || 
      slug.includes('condiment') ||
      cat.includes('spice') || 
      cat.includes('masala') ||
      name.includes('masala') ||
      name.includes('pepper') ||
      name.includes('cardamom') ||
      name.includes('clove') ||
      name.includes('chilli') ||
      name.includes('turmeric')
    );
  };

  // Counts for quick stats
  const lowStockThreshold = 10;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold || lowStockThreshold)).length;
  const spicesCount = products.filter(isKitchenSpice).length;
  const offersCount = products.filter(p => Boolean(p.offerPrice)).length;
  const pendingLeadsCount = restockLeads.filter(l => l.status === 'pending').length;

  // Filter logic
  const filtered = products.filter((p) => {
    // Category dropdown filter
    if (catFilter && p.categorySlug !== catFilter) return false;

    // Tabs filter
    if (activeTab === 'spices' && !isKitchenSpice(p)) return false;
    if (activeTab === 'low-stock' && !(p.stock > 0 && p.stock <= (p.lowStockThreshold || lowStockThreshold))) return false;
    if (activeTab === 'out-of-stock' && p.stock !== 0) return false;
    if (activeTab === 'offers' && !p.offerPrice) return false;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) || 
        p.brand.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Handle Quick Stock Update
  const handleUpdateStock = (productId: string, newStock: number) => {
    const val = Math.max(0, newStock);
    const updated = products.map((p) => (p.id === productId ? { ...p, stock: val } : p));
    saveProducts(updated);
    const prod = products.find(p => p.id === productId);
    setSavedAlert({
      message: `Stock updated to ${val} for "${prod?.name || 'Product'}"`,
      type: val === 0 ? 'warning' : 'success'
    });
    setTimeout(() => setSavedAlert(null), 2500);
  };

  // Quick Restock button (+10 items)
  const handleQuickRestock = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    const newStock = prod.stock + 10;
    handleUpdateStock(productId, newStock);
  };

  // Handle Offer Save
  const handleOpenOfferModal = (prod: Product) => {
    setActiveOfferProduct(prod);
    setOfferPriceInput(prod.offerPrice ?? Number((prod.price * 0.85).toFixed(2)));
    setIsOfferActive(Boolean(prod.offerPrice));
  };

  const handleSaveOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOfferProduct) return;

    const updated = products.map((p) => {
      if (p.id === activeOfferProduct.id) {
        return {
          ...p,
          offerPrice: isOfferActive ? Number(offerPriceInput) : undefined,
          isOffer: isOfferActive,
        };
      }
      return p;
    });

    saveProducts(updated);
    setSavedAlert({
      message: `Special offer updated for "${activeOfferProduct.name}"!`,
      type: 'success'
    });
    setActiveOfferProduct(null);
    setTimeout(() => setSavedAlert(null), 3000);
  };

  // Handle Delete Product
  const handleDeleteProduct = (prod: Product) => {
    if (confirm(`Are you sure you want to delete "${prod.name}" from your store catalogue?`)) {
      const updated = products.filter(p => p.id !== prod.id);
      saveProducts(updated);
      setSavedAlert({
        message: `Product "${prod.name}" removed from inventory.`,
        type: 'warning'
      });
      setTimeout(() => setSavedAlert(null), 3000);
    }
  };

  // ==========================================
  // AI IMAGE EDIT & BACKGROUND REMOVAL PIPELINE
  // ==========================================
  const handleOpenImageEditModal = (prod: Product) => {
    setActiveImageEditProduct(prod);
    setStudioSelectedImage(prod.imageUrl);
  };

  const handleSaveProductImage = () => {
    if (!activeImageEditProduct) return;

    const finalImageUrl = studioSelectedImage || activeImageEditProduct.imageUrl;
    if (!finalImageUrl) return;

    const updated = products.map((p) => {
      if (p.id === activeImageEditProduct.id) {
        return {
          ...p,
          imageUrl: finalImageUrl
        };
      }
      return p;
    });

    saveProducts(updated);
    setSavedAlert({
      message: `✨ Product photo updated for "${activeImageEditProduct.name}"! Website storefront now showcases this new packshot.`,
      type: 'success'
    });
    setActiveImageEditProduct(null);
    setTimeout(() => setSavedAlert(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Products &amp; Stock Manager</h1>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black">
              {products.length} Items
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time UK stock tracking, Kitchen Spices catalogue, automated AI background removal packshots, and special offers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/ai-add"
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>AI Fast Add Studio</span>
          </Link>
        </div>
      </div>

      {/* Stock Alerts Notice Bar */}
      {(outOfStockCount > 0 || lowStockCount > 0) && (
        <div className="p-3.5 bg-amber-50/90 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5 text-amber-900 font-semibold">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              <strong>Inventory Alert:</strong> {outOfStockCount > 0 && <span className="text-rose-700 font-black">{outOfStockCount} item{outOfStockCount > 1 ? 's' : ''} Out of Stock</span>}
              {outOfStockCount > 0 && lowStockCount > 0 && ' and '}
              {lowStockCount > 0 && <span className="text-amber-800 font-black">{lowStockCount} item{lowStockCount > 1 ? 's' : ''} Running Low (&le;10)</span>}. Restock below to keep UK orders fulfilled.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {outOfStockCount > 0 && (
              <button
                onClick={() => setActiveTab('out-of-stock')}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
              >
                View Out of Stock ({outOfStockCount})
              </button>
            )}
            {lowStockCount > 0 && (
              <button
                onClick={() => setActiveTab('low-stock')}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
              >
                View Low Stock ({lowStockCount})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification Alert */}
      {savedAlert && (
        <div className={`p-3.5 rounded-2xl border flex items-center gap-2.5 text-xs font-bold shadow-xs animate-fadeIn ${
          savedAlert.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedAlert.message}</span>
        </div>
      )}

      {/* Metric Cards & Quick Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* All Products */}
        <button
          onClick={() => setActiveTab('all')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-slate-900 border-slate-900 text-white shadow-md'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-75">All Products</span>
            <Package className="w-4 h-4 opacity-75" />
          </div>
          <div className="text-xl font-black mt-1">{products.length}</div>
        </button>

        {/* Kitchen Spices */}
        <button
          onClick={() => setActiveTab('spices')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'spices'
              ? 'bg-gradient-to-br from-amber-800 to-amber-700 border-amber-800 text-white shadow-md'
              : 'bg-white border-slate-200 hover:border-amber-300 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Kitchen Spices</span>
            <Leaf className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black mt-1 text-amber-900">{spicesCount}</div>
        </button>

        {/* Low Stock Alert */}
        <button
          onClick={() => setActiveTab('low-stock')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'low-stock'
              ? 'bg-amber-600 border-amber-600 text-white shadow-md'
              : 'bg-white border-slate-200 hover:border-amber-300 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Low Stock (&le;10)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black mt-1 text-amber-600">{lowStockCount}</div>
        </button>

        {/* Out of Stock */}
        <button
          onClick={() => setActiveTab('out-of-stock')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'out-of-stock'
              ? 'bg-rose-700 border-rose-700 text-white shadow-md'
              : 'bg-white border-slate-200 hover:border-rose-300 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Out of Stock</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-black mt-1 text-rose-600">{outOfStockCount}</div>
        </button>

        {/* Special Offers */}
        <button
          onClick={() => setActiveTab('offers')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'offers'
              ? 'bg-gradient-to-br from-rose-600 to-amber-600 border-rose-600 text-white shadow-md'
              : 'bg-white border-slate-200 hover:border-rose-300 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Active Offers</span>
            <Flame className="w-4 h-4 text-rose-500 fill-current" />
          </div>
          <div className="text-xl font-black mt-1 text-rose-600">{offersCount}</div>
        </button>

        {/* Restock Leads */}
        <button
          onClick={() => setActiveTab('restock-leads')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'restock-leads'
              ? 'bg-gradient-to-br from-indigo-700 to-purple-800 border-indigo-700 text-white shadow-md'
              : 'bg-white border-slate-200 hover:border-indigo-300 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${activeTab === 'restock-leads' ? 'text-indigo-200' : 'text-indigo-600'}`}>
              Restock Leads
            </span>
            <Bell className={`w-4 h-4 ${activeTab === 'restock-leads' ? 'text-amber-300 animate-bounce' : 'text-indigo-500'}`} />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-xl font-black ${activeTab === 'restock-leads' ? 'text-white' : 'text-indigo-600'}`}>
              {pendingLeadsCount}
            </span>
            <span className={`text-[10px] font-medium ${activeTab === 'restock-leads' ? 'text-indigo-200' : 'text-slate-400'}`}>
              pending ({restockLeads.length})
            </span>
          </div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by name, brand, barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-600 transition-colors"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
          {/* Quick chip for Kitchen Spices */}
          <button
            onClick={() => setActiveTab(activeTab === 'spices' ? 'all' : 'spices')}
            className={`px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'spices'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Leaf className="w-3.5 h-3.5 text-amber-600" />
            <span>Kitchen Spices ({spicesCount})</span>
          </button>

          {/* Quick chip for Offers */}
          <button
            onClick={() => setActiveTab(activeTab === 'offers' ? 'all' : 'offers')}
            className={`px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'offers'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>Offers Only</span>
          </button>

          {/* Quick chip for Restock Leads */}
          <button
            onClick={() => setActiveTab(activeTab === 'restock-leads' ? 'all' : 'restock-leads')}
            className={`px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'restock-leads'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-indigo-600" />
            <span>Restock Leads ({pendingLeadsCount})</span>
          </button>

          {/* Category Dropdown */}
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            aria-label="Filter by category"
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-600 bg-white cursor-pointer"
          >
            <option value="">All Categories ({products.length})</option>
            {CATEGORIES.map((c) => {
              const count = products.filter(p => p.categorySlug === c.slug).length;
              return (
                <option key={c.id} value={c.slug}>
                  {c.name} ({count})
                </option>
              );
            })}
          </select>

          {(activeTab !== 'all' || catFilter || search) && (
            <button
              onClick={() => {
                setActiveTab('all');
                setCatFilter('');
                setSearch('');
              }}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Restock Leads Section OR Products Table */}
      {activeTab === 'restock-leads' ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    Customer Restock Leads (Waitlist Alerts)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Customers who asked for a WhatsApp alert when out-of-stock items return to Kerala Superstore Manchester.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {pendingLeadsCount} Pending Alerts • {restockLeads.length} Total
              </span>
              <button
                onClick={() => setActiveTab('all')}
                className="text-xs text-slate-700 hover:text-slate-900 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors cursor-pointer"
              >
                ← Back to Catalogue
              </button>
            </div>
          </div>

          {restockLeads.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-700">No Restock Requests Yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                When items run out of stock on your online storefront, customers can click &ldquo;🔔 Notify Me&rdquo; on the product card to leave their WhatsApp contact details.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {restockLeads.map((lead) => {
                const matchedProduct = products.find(p => p.id === lead.productId);
                const currentStock = matchedProduct ? matchedProduct.stock : 0;
                const isNowInStock = currentStock > 0;
                const cleanPhone = lead.customerPhone.replace(/[^0-9]/g, '');
                const waMessage = `Namaskaram ${lead.customerName}! Great news from Kerala Superstore Manchester - the item you were waiting for (${lead.productName}) is back in stock (${currentStock} units available)! You can order now on our store: https://keralasuperstore.co.uk or reply to this WhatsApp to reserve.`;
                const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;

                return (
                  <div
                    key={lead.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      lead.status === 'notified'
                        ? 'bg-slate-50/80 border-slate-200 opacity-80'
                        : isNowInStock
                        ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div>
                      {/* Product Header */}
                      <div className="flex items-start gap-3">
                        <div className="relative w-14 h-14 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 shadow-2xs">
                          <Image
                            src={lead.productImage || matchedProduct?.imageUrl || '/branding/kerala-superstore-round-logo.png'}
                            alt={lead.productName}
                            fill
                            unoptimized
                            className="object-contain p-1"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                              lead.status === 'notified'
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {lead.status === 'notified' ? 'Notified ✓' : 'Awaiting Stock ⏳'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(lead.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>

                          <h3 className="font-bold text-slate-900 text-xs mt-1 line-clamp-2" title={lead.productName}>
                            {lead.productName}
                          </h3>

                          {/* Stock status pill */}
                          <div className="mt-1.5">
                            {isNowInStock ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                IN STOCK NOW ({currentStock} units)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                                Still Out of Stock (0)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Customer Details */}
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs">
                        <div className="font-bold text-slate-800 flex items-center justify-between">
                          <span>👤 {lead.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-700">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{lead.customerPhone}</span>
                        </div>
                        {lead.customerEmail && (
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate">{lead.customerEmail}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          if (lead.status === 'pending') {
                            updateLeadStatus(lead.id, 'notified');
                          }
                        }}
                        className="flex-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp Alert</span>
                      </a>

                      <button
                        onClick={() => updateLeadStatus(lead.id, lead.status === 'pending' ? 'notified' : 'pending')}
                        title={lead.status === 'pending' ? 'Mark as Notified' : 'Revert to Pending'}
                        className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        {lead.status === 'pending' ? '✓' : '↺'}
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Delete restock request for ${lead.customerName}?`)) {
                            deleteRestockLead(lead.id);
                          }
                        }}
                        title="Delete lead request"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Products Table */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="p-4">Product Image &amp; Name</th>
                <th className="p-4">Category &amp; Brand</th>
                <th className="p-4">Pack Size</th>
                <th className="p-4">Price (£)</th>
                <th className="p-4">Special Offer</th>
                <th className="p-4">Live Stock (Quick Edit)</th>
                <th className="p-4">Allergens</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="font-bold text-slate-600 text-sm">No products found matching your filters</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting the search or category filters</p>
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => {
                  const isLow = prod.stock > 0 && prod.stock <= (prod.lowStockThreshold || lowStockThreshold);
                  const isOut = prod.stock === 0;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product Image & Name */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {/* Image with Camera edit overlay */}
                          <div className="relative group w-14 h-14 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 shadow-2xs">
                            <Image
                              src={prod.imageUrl}
                              alt={prod.name}
                              fill
                              unoptimized
                              className="object-contain p-1 group-hover:scale-105 transition-transform"
                            />
                            {/* Hover Edit Overlay */}
                            <button
                              onClick={() => handleOpenImageEditModal(prod)}
                              title="Change image with AI Background Removal"
                              className="absolute inset-0 bg-slate-900/70 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5 cursor-pointer"
                            >
                              <Camera className="w-4 h-4 text-amber-300" />
                              <span className="text-[9px] font-bold text-white">AI Edit</span>
                            </button>
                          </div>

                          <div>
                            <div className="font-bold text-slate-900 line-clamp-1 max-w-[240px]" title={prod.name}>
                              {prod.name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                              <span>Barcode: {prod.barcode || 'N/A'}</span>
                              {isKitchenSpice(prod) && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 font-bold text-[10px]">
                                  🌶️ Spice
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Brand */}
                      <td className="p-4">
                        <div className="font-bold text-emerald-800">{prod.brand}</div>
                        <div className="text-[11px] text-slate-500">{prod.category}</div>
                      </td>

                      {/* Pack Size */}
                      <td className="p-4 font-semibold text-slate-700">
                        {prod.sizeWeight}
                      </td>

                      {/* Price */}
                      <td className="p-4 font-black text-slate-900">
                        £{prod.price.toFixed(2)}
                      </td>

                      {/* Special Offer */}
                      <td className="p-4">
                        {prod.offerPrice ? (
                          <div className="inline-flex items-center gap-1 bg-gradient-to-r from-rose-500 to-amber-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow-2xs">
                            <Flame className="w-3 h-3 fill-white" />
                            <span>£{prod.offerPrice.toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Standard</span>
                        )}
                      </td>

                      {/* Live Stock & Quick Stepper */}
                      <td className="p-4">
                        <div className="space-y-1.5">
                          {/* Stock Status Badge */}
                          <div className="flex items-center gap-1.5">
                            {isOut ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md font-bold text-[10px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                                Out of Stock
                              </span>
                            ) : isLow ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md font-bold text-[10px]">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Low ({prod.stock})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-bold text-[10px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                In Stock
                              </span>
                            )}
                          </div>

                          {/* Quick Stepper & Direct Input */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleUpdateStock(prod.id, prod.stock - 1)}
                              disabled={prod.stock <= 0}
                              className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-slate-700 transition-colors cursor-pointer"
                              title="Decrease stock by 1"
                            >
                              <Minus className="w-3 h-3" />
                            </button>

                            <input
                              type="number"
                              min="0"
                              value={prod.stock}
                              onChange={(e) => handleUpdateStock(prod.id, parseInt(e.target.value) || 0)}
                              className={`w-14 px-1.5 py-1 text-center font-black rounded-lg border text-xs outline-none transition-colors ${
                                isOut 
                                  ? 'border-rose-300 text-rose-700 bg-rose-50/50' 
                                  : isLow 
                                  ? 'border-amber-300 text-amber-800 bg-amber-50/50' 
                                  : 'border-slate-200 text-slate-800 bg-white'
                              }`}
                            />

                            <button
                              onClick={() => handleUpdateStock(prod.id, prod.stock + 1)}
                              className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700 transition-colors cursor-pointer"
                              title="Increase stock by 1"
                            >
                              <Plus className="w-3 h-3" />
                            </button>

                            {isOut && (
                              <button
                                onClick={() => handleQuickRestock(prod.id)}
                                className="px-1.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md font-bold text-[10px] ml-1 transition-colors cursor-pointer"
                                title="Quick Restock +10"
                              >
                                +10
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Allergens (Natasha's Law UK) */}
                      <td className="p-4">
                        {prod.allergens && prod.allergens.length > 0 ? (
                          <span className="text-[11px] text-amber-900 bg-amber-50/90 border border-amber-200/50 px-2 py-0.5 rounded-lg flex items-center gap-1 w-max">
                            <ShieldCheck className="w-3 h-3 text-amber-600 shrink-0" />
                            <span className="truncate max-w-[130px] font-semibold">{prod.allergens[0]}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">None declared</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* AI Image Edit Button */}
                          <button
                            onClick={() => handleOpenImageEditModal(prod)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer"
                            title="Upload new image & remove background with AI"
                          >
                            <Camera className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="hidden sm:inline">AI Photo</span>
                          </button>

                          {/* Set Offer Button */}
                          <button
                            onClick={() => handleOpenOfferModal(prod)}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer"
                            title="Configure special offer discount"
                          >
                            <Flame className="w-3.5 h-3.5 text-rose-600" />
                            <span className="hidden sm:inline">{prod.offerPrice ? 'Edit Offer' : 'Offer'}</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteProduct(prod)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: AI PRODUCT IMAGE CHANGER & BACKGROUND REMOVER    */}
      {/* ========================================================= */}
      {activeImageEditProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs" 
            onClick={() => setActiveImageEditProduct(null)} 
          />
          <div className="relative bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl z-10 space-y-5 border border-slate-200 animate-fadeIn max-h-[92vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setActiveImageEditProduct(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-800 to-teal-600 text-white flex items-center justify-center text-xl shadow-md shrink-0">
                <Camera className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg text-slate-900">
                  Update Product Photo (AI Studio)
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {activeImageEditProduct.brand} • {activeImageEditProduct.name}
                </p>
              </div>
            </div>

            {/* AI Image Studio Upload Suite */}
            <div className="pt-1">
              <AiImageStudioUpload
                currentImageUrl={activeImageEditProduct.imageUrl}
                title="Product Studio Packshot Suite"
                subtitle="Upload any photo or packet flyer. Real-time AI will automatically isolate the product into a clean studio packshot."
                onImageChange={(newUrl) => {
                  setStudioSelectedImage(newUrl);
                }}
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveImageEditProduct(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveProductImage}
                disabled={!studioSelectedImage || studioSelectedImage === activeImageEditProduct.imageUrl}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save New Image to Store</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: SET SPECIAL OFFER DISCOUNT                       */}
      {/* ========================================================= */}
      {activeOfferProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" 
            onClick={() => setActiveOfferProduct(null)} 
          />
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl z-10 space-y-4 border border-slate-200 animate-fadeIn">
            <button
              onClick={() => setActiveOfferProduct(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white flex items-center justify-center text-xl shadow-md">
                🔥
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-slate-900">Set Special Offer Price</h3>
                <p className="text-xs text-slate-500 truncate max-w-[260px]">{activeOfferProduct.name}</p>
              </div>
            </div>

            <form onSubmit={handleSaveOffer} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
                <span className="text-slate-500">Regular Store Price:</span>
                <strong className="text-slate-900 text-sm">£{activeOfferProduct.price.toFixed(2)}</strong>
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={isOfferActive}
                  onChange={(e) => setIsOfferActive(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
                <span>Active Special Offer Discount</span>
              </label>

              {isOfferActive && (
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Special Offer Price (£) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={offerPriceInput}
                    onChange={(e) => setOfferPriceInput(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-black text-base text-rose-600 outline-none focus:border-rose-500"
                  />
                  <p className="text-[11px] text-slate-500">
                    Customer saves: <strong className="text-emerald-700">£{(activeOfferProduct.price - offerPriceInput).toFixed(2)} ({Math.round(((activeOfferProduct.price - offerPriceInput) / activeOfferProduct.price) * 100)}% OFF)</strong>
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveOfferProduct(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Save &amp; View on Website
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
