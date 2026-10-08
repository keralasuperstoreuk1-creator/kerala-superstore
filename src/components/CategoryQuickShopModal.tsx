'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { 
  X, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Check, 
  Flame, 
  ShieldCheck, 
  ArrowRight,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { Category, Product } from '@/types';
import { useCart } from '@/context/CartContext';

interface CategoryQuickShopModalProps {
  category: Category | null;
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onOpenProductDetails?: (product: Product) => void;
}

export const CategoryQuickShopModal: React.FC<CategoryQuickShopModalProps> = ({
  category,
  isOpen,
  onClose,
  products,
  onOpenProductDetails
}) => {
  const { cart, addToCart, updateQuantity, totalItems, subtotal, setIsCartOpen } = useCart();
  const [selectedVariety, setSelectedVariety] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  // Filter products belonging to this category with intelligent keyword mapping
  const categoryProducts = useMemo(() => {
    if (!category) return [];
    const cSlug = (category.slug || '').toLowerCase().trim();
    const cName = (category.name || '').toLowerCase().trim();
    
    return products.filter((p) => {
      const pSlug = (p.categorySlug || '').toLowerCase().trim();
      const pCat = (p.category || '').toLowerCase().trim();
      const pName = (p.name || '').toLowerCase().trim();

      // 1. Direct slug or category name match
      if (pSlug === cSlug || pCat === cName) return true;
      if (pSlug.includes(cSlug) || cSlug.includes(pSlug)) return true;
      if (pCat.includes(cName) || cName.includes(pCat)) return true;

      // 2. Intelligent department fallback matching
      if (cSlug.includes('rice') && (pName.includes('rice') || pName.includes('matta') || pName.includes('kaima') || pCat.includes('rice'))) return true;
      if (cSlug.includes('pulse') && (pName.includes('dal') || pName.includes('payar') || pName.includes('kadala') || pCat.includes('pulse') || pCat.includes('dal'))) return true;
      if (cSlug.includes('masala') && (pName.includes('masala') || pName.includes('powder') || pName.includes('sambar') || pName.includes('chilli') || pCat.includes('masala') || pCat.includes('spice'))) return true;
      if (cSlug.includes('snack') && (pName.includes('chips') || pName.includes('mixture') || pName.includes('upperi') || pCat.includes('snack') || pCat.includes('crisp'))) return true;
      if (cSlug.includes('oil') && (pName.includes('oil') || pName.includes('ghee') || pCat.includes('oil'))) return true;
      if (cSlug.includes('pickle') && (pName.includes('pickle') || pName.includes('achar') || pCat.includes('pickle'))) return true;
      if (cSlug.includes('frozen') && (pName.includes('frozen') || pName.includes('kappa') || pName.includes('parotta') || pName.includes('fish') || pCat.includes('frozen'))) return true;
      if (cSlug.includes('kitchen') && (pName.includes('uruli') || pName.includes('maker') || pName.includes('chatti') || pCat.includes('kitchen'))) return true;
      if (cSlug.includes('breakfast') && (pName.includes('podi') || pName.includes('puttu') || pName.includes('appam') || pName.includes('rava') || pCat.includes('breakfast') || pCat.includes('powder'))) return true;
      if (cSlug.includes('spice') && (pName.includes('pepper') || pName.includes('cardamom') || pName.includes('clove') || pCat.includes('spice') || pCat.includes('condiment'))) return true;

      return false;
    });
  }, [category, products]);

  // Available brands in this category
  const brandCounts = useMemo(() => {
    const map: Record<string, number> = {};
    categoryProducts.forEach((p) => {
      map[p.brand] = (map[p.brand] || 0) + 1;
    });
    return Object.entries(map).map(([brand, count]) => ({ brand, count }));
  }, [categoryProducts]);

  // Filtered by selected variety and selected brand, sorted with IN STOCK items first
  const filteredList = useMemo(() => {
    const list = categoryProducts.filter((p) => {
      if (selectedBrand && p.brand !== selectedBrand) return false;
      if (selectedVariety && selectedVariety !== 'All') {
        const q = selectedVariety.toLowerCase();
        const words = q.split(/[\s/()]+/).filter(w => w.length > 2);
        if (words.length > 0) {
          const match = words.some(w => 
            p.name.toLowerCase().includes(w) || 
            (p.description || '').toLowerCase().includes(w) || 
            (p.tags || []).some(t => t.toLowerCase().includes(w))
          );
          if (!match) return false;
        }
      }
      return true;
    });

    // In Stock items appear FIRST at the top!
    return list.sort((a, b) => {
      const aInStock = a.stock > 0 ? 1 : 0;
      const bInStock = b.stock > 0 ? 1 : 0;
      if (bInStock !== aInStock) return bInStock - aInStock;
      return (b.isOffer ? 1 : 0) - (a.isOffer ? 1 : 0);
    });
  }, [categoryProducts, selectedBrand, selectedVariety]);

  const getCartQuantity = (productId: string): number => {
    const item = cart.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  const handleCheckoutClick = () => {
    onClose();
    setIsCartOpen(true);
  };

  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Dark backdrop blur */}
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal / Mobile Slide-Up Bottom Sheet */}
      <div className="relative w-full max-w-4xl bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] z-10 overflow-hidden animate-fadeIn">
        
        {/* Mobile touch drag indicator handle */}
        <div className="sm:hidden w-full pt-3 pb-1 flex justify-center bg-white">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Modal Header with Photographic Category Presentation */}
        <div className="relative bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          {/* Subtle glow */}
          <div className="absolute top-0 right-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3.5 relative z-10">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shrink-0 border-2 border-white/20 shadow-md">
              <Image
                src={category.imageUrl || '/categories/rice.jpg'}
                alt={category.name}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                  Department Varieties
                </span>
                <span className="text-xs text-slate-300 font-semibold hidden sm:inline">
                  {categoryProducts.length} Items Available
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight mt-0.5">
                {category.name}
              </h2>
              <p className="text-xs text-slate-300 line-clamp-1 font-medium mt-0.5 max-w-xl">
                {category.description}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors cursor-pointer shrink-0 ml-2"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Section: Varieties & Brands Bar */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200/90 space-y-3 shrink-0">
          
          {/* 1. Sub-varieties pills (e.g. Vadi Matta, Unda Matta, Kaima Biriyani) */}
          {category.varieties && category.varieties.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <span>Select Variety / Type:</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar touch-pan-x">
                <button
                  onClick={() => setSelectedVariety(null)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95 ${
                    selectedVariety === null
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  All Varieties ({categoryProducts.length})
                </button>
                {category.varieties.map((v) => (
                  <button
                    key={v}
                    onClick={() => setSelectedVariety(selectedVariety === v ? null : v)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95 ${
                      selectedVariety === v
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Brand selector chips */}
          {brandCounts.length > 1 && (
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Filter by Brand:
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar touch-pan-x">
                <button
                  onClick={() => setSelectedBrand(null)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer active:scale-95 ${
                    selectedBrand === null
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  All Brands
                </button>
                {brandCounts.map(({ brand, count }) => (
                  <button
                    key={brand}
                    onClick={() => setSelectedBrand(selectedBrand === brand ? null : brand)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer active:scale-95 ${
                      selectedBrand === brand
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{brand}</span>
                    <span className="ml-1 text-[10px] opacity-75">({count})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Scrollable Products Variety Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 overscroll-contain">
          {filteredList.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="font-bold text-slate-700 text-sm">No products found for this selection</p>
              <button
                onClick={() => {
                  setSelectedVariety(null);
                  setSelectedBrand(null);
                }}
                className="text-xs text-emerald-800 font-bold underline"
              >
                Reset Variety &amp; Brand Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {filteredList.map((prod) => {
                const qty = getCartQuantity(prod.id);
                const discount = prod.offerPrice 
                  ? Math.round(((prod.price - prod.offerPrice) / prod.price) * 100)
                  : 0;

                return (
                  <div
                    key={prod.id}
                    onClick={() => onOpenProductDetails && onOpenProductDetails(prod)}
                    className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-lg transition-all p-3 flex flex-col justify-between group cursor-pointer relative"
                  >
                    {/* Offer badge */}
                    {discount > 0 && (
                      <span className="absolute top-2 left-2 z-10 bg-gradient-to-r from-rose-600 to-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs uppercase flex items-center gap-0.5">
                        <Flame className="w-2.5 h-2.5 fill-white" />
                        <span>-{discount}%</span>
                      </span>
                    )}

                    {/* Image Area */}
                    <div className="relative w-full aspect-square rounded-xl bg-slate-50 overflow-hidden mb-2 p-2 flex items-center justify-center">
                      <Image
                        src={prod.imageUrl || '/products/matta-rice.png'}
                        alt={prod.name}
                        fill
                        className="object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target) target.src = '/products/matta-rice.png';
                        }}
                      />
                      <span className="absolute bottom-1 right-1 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        {prod.sizeWeight}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">
                        {prod.brand}
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-tight">
                        {prod.name}
                      </h4>
                    </div>

                    {/* Price and Add Stepper */}
                    <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                      <div>
                        <div className="font-black text-sm text-slate-900">
                          £{(prod.offerPrice ?? prod.price).toFixed(2)}
                        </div>
                        {prod.offerPrice && (
                          <div className="text-[10px] text-slate-400 line-through">
                            £{prod.price.toFixed(2)}
                          </div>
                        )}
                      </div>

                      {/* Stepper or Add Button */}
                      <div onClick={(e) => e.stopPropagation()}>
                        {qty > 0 ? (
                          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 rounded-xl px-2 py-1 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => updateQuantity(prod.id, qty - 1)}
                              className="w-5 h-5 flex items-center justify-center text-emerald-800 hover:bg-emerald-200 rounded-md font-black text-xs active:scale-90"
                              title="Decrease"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-black text-xs text-emerald-950 px-1 min-w-[14px] text-center">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => addToCart(prod, 1)}
                              className="w-5 h-5 flex items-center justify-center bg-emerald-800 text-white rounded-md font-black text-xs hover:bg-emerald-700 active:scale-90"
                              title="Increase"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addToCart(prod, 1)}
                            className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1 active:scale-95 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sticky Bottom Action & Basket Preview Bar (Vital for Mobile UX) */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200/90 shadow-lg flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Your Basket</div>
              <div className="font-black text-xs sm:text-sm text-slate-900">
                {totalItems === 0 ? 'Empty' : `${totalItems} items • £${subtotal.toFixed(2)}`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="hidden sm:inline-block px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Back to Catalog
            </button>
            <button
              onClick={handleCheckoutClick}
              disabled={totalItems === 0}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                totalItems > 0
                  ? 'bg-emerald-800 hover:bg-emerald-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>View Basket &amp; Checkout</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
