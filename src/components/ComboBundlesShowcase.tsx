'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Package, 
  Sparkles, 
  ShoppingBag, 
  Check, 
  ArrowRight,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { useStoreConfig } from '@/context/StoreConfigContext';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types';

export const ComboBundlesShowcase: React.FC = () => {
  const { bundles } = useStoreConfig();
  const { addToCart, setIsCartOpen } = useCart();
  const [addedBundleId, setAddedBundleId] = useState<string | null>(null);

  const activeBundles = bundles.filter((b) => b.isActive);
  if (activeBundles.length === 0) return null;

  const handleAddBundleToCart = (bundle: typeof activeBundles[0]) => {
    // Construct bundle as a composite product for the cart
    const bundleProduct: Product = {
      id: `prod-${bundle.id}`,
      name: bundle.title,
      slug: `bundle-${bundle.id}`,
      brand: 'Kerala Superstore Curated',
      category: 'Combo Grocery Kits',
      categorySlug: 'combos-and-kits',
      sizeWeight: `${bundle.items.length} Items Full Kit`,
      price: bundle.bundlePrice,
      stock: 50,
      description: bundle.description,
      imageUrl: bundle.imageUrl,
      tags: ['Combo', 'Feast Kit', 'Best Value'],
      status: 'published',
      createdAt: bundle.createdAt,
    };

    addToCart(bundleProduct, 1);
    setAddedBundleId(bundle.id);
    setTimeout(() => {
      setAddedBundleId(null);
      setIsCartOpen(true);
    }, 600);
  };

  return (
    <section className="py-8 bg-gradient-to-b from-amber-50/50 via-white to-emerald-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black mb-2 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Big Savings • Curated Grocery Kits</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              Pre-packed Kerala Feast &amp; Essentials Bundles
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Save time and money with handpicked traditional kits. Perfect for festival cooking, weekend snacks, and student homes.
            </p>
          </div>

          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
            1-Click Add to Basket
          </span>
        </div>

        {/* Bundles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {activeBundles.map((bundle) => {
            const isAdded = addedBundleId === bundle.id;

            return (
              <div
                key={bundle.id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Top Image Box */}
                  <div className="relative h-48 bg-gradient-to-br from-slate-50 to-amber-50/40 p-4 flex items-center justify-center overflow-hidden border-b border-slate-100">
                    <div className="relative w-full h-full transform group-hover:scale-105 transition-transform duration-300">
                      <Image
                        src={bundle.imageUrl}
                        alt={bundle.title}
                        fill
                        unoptimized
                        className="object-contain"
                      />
                    </div>

                    <div className="absolute top-3 left-3">
                      <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full shadow-xs uppercase tracking-wide">
                        {bundle.badge}
                      </span>
                    </div>

                    {bundle.savingsText && (
                      <div className="absolute bottom-3 right-3">
                        <span className="bg-rose-600 text-white font-black text-[11px] px-2.5 py-0.5 rounded-full shadow-md">
                          {bundle.savingsText}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3.5">
                    <div>
                      <h3 className="font-black text-base text-slate-900 group-hover:text-emerald-800 transition-colors leading-snug">
                        {bundle.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{bundle.subtitle}</p>
                    </div>

                    {/* Items checklist */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                      <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                        Included in this kit ({bundle.items.length} items):
                      </span>
                      <ul className="space-y-1 text-slate-600 text-[11px]">
                        {bundle.items.map((i, idx) => (
                          <li key={idx} className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              <strong className="text-slate-800">{i.name}</strong> ({i.quantity})
                            </span>
                            <span className="text-slate-400">£{i.originalPrice.toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Footer Price & 1-Click Action */}
                <div className="p-5 pt-0">
                  <div className="flex items-baseline justify-between mb-3 border-t border-slate-100 pt-3">
                    <div>
                      <span className="text-xs text-slate-400 line-through mr-2">
                        £{bundle.regularPrice.toFixed(2)}
                      </span>
                      <span className="text-2xl font-black text-emerald-800">
                        £{bundle.bundlePrice.toFixed(2)}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Special Combo Price
                    </span>
                  </div>

                  <button
                    onClick={() => handleAddBundleToCart(bundle)}
                    disabled={isAdded}
                    className={`w-full py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                      isAdded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-800 hover:bg-emerald-700 text-white hover:shadow-lg active:scale-95'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-amber-300" />
                        <span>Added to Basket!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4 text-amber-300" />
                        <span>Add Complete Kit to Basket</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
