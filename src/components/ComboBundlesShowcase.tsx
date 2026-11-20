'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Package,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  Tag,
  Gift,
  Check,
} from 'lucide-react';
import { useStoreConfig } from '@/context/StoreConfigContext';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types';

const REAL_BUNDLE_IMAGES: Record<string, string> = {
  'bundle-1': '/bundles/onam-sadhya-feast-kit.jpg',
  'bundle-2': '/bundles/malabar-tea-snack-combo.jpg',
  'bundle-3': '/bundles/malayali-student-starter-kit.jpg',
};

function resolveBundleImage(bundleId: string, imageUrl?: string): string {
  const url = (imageUrl || '').trim();
  const isLegacyGeneric =
    !url ||
    url.includes('/branding/kerala-grocery-basket') ||
    url.includes('/categories/snacks');
  if (isLegacyGeneric && REAL_BUNDLE_IMAGES[bundleId]) {
    return REAL_BUNDLE_IMAGES[bundleId];
  }
  return url || REAL_BUNDLE_IMAGES[bundleId] || '/bundles/onam-sadhya-feast-kit.jpg';
}

export const ComboBundlesShowcase: React.FC = () => {
  const { bundles } = useStoreConfig();
  const { addToCart, setIsCartOpen } = useCart();
  const [addedBundleId, setAddedBundleId] = useState<string | null>(null);

  const activeBundles = bundles.filter((b) => b.isActive);
  if (activeBundles.length === 0) return null;

  const handleAddBundleToCart = (bundle: (typeof activeBundles)[0]) => {
    const resolvedImage = resolveBundleImage(bundle.id, bundle.imageUrl);
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
      imageUrl: resolvedImage,
      tags: ['Combo', 'Feast Kit', 'Best Value'],
      status: 'published',
      createdAt: bundle.createdAt,
    };

    addToCart(bundleProduct, 1);
    setAddedBundleId(bundle.id);
    setTimeout(() => {
      setAddedBundleId(null);
      setIsCartOpen(true);
    }, 650);
  };

  return (
    <section
      id="combo-bundles-section"
      className="py-10 sm:py-14 bg-gradient-to-b from-[#faf7f0] via-white to-emerald-50/35 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Editorial Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-amber-200/70 pb-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950 text-amber-300 text-[11px] font-extrabold tracking-widest uppercase shadow-sm">
              <Gift className="w-3.5 h-3.5 text-amber-400" />
              <span>Big Savings • Curated Kerala Grocery Kits</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight leading-tight">
              Pre-packed Kerala{' '}
              <span className="text-emerald-800">Feast &amp; Essentials</span> Bundles
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Handpicked authentic Kerala grocery kits packed fresh at our Manchester store. Save up to 23% on festival feasts, 4 PM chaya snacks, and student kitchen starters.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 bg-emerald-100/80 px-3.5 py-1.5 rounded-full border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>1-Click Complete Kit</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-950 bg-amber-100/90 px-3.5 py-1.5 rounded-full border border-amber-200">
              <Package className="w-3.5 h-3.5 text-amber-700" />
              <span>UK-Wide Next-Day Packing</span>
            </span>
          </div>
        </div>

        {/* Redesigned Photorealistic Bundles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7">
          {activeBundles.map((bundle) => {
            const isAdded = addedBundleId === bundle.id;
            const resolvedImage = resolveBundleImage(bundle.id, bundle.imageUrl);
            const savingsAmount = Math.max(0, bundle.regularPrice - bundle.bundlePrice);

            return (
              <article
                key={bundle.id}
                className="group bg-white rounded-[1.75rem] border border-slate-200/90 hover:border-emerald-400/70 overflow-hidden shadow-[0_10px_30px_-12px_rgba(15,23,42,0.12)] hover:shadow-[0_22px_50px_-14px_rgba(6,78,59,0.22)] transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  {/* Full-Bleed Real Photography Banner */}
                  <div className="relative w-full aspect-[16/10] bg-slate-900 overflow-hidden">
                    <Image
                      src={resolvedImage}
                      alt={bundle.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                    />

                    {/* Subtle dark gradient vignette for crisp badge readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/15 to-slate-950/25 pointer-events-none" />

                    {/* Top Row: Curated Badge & Item Count */}
                    <div className="absolute top-3.5 left-3.5 right-3.5 flex items-start justify-between gap-2">
                      <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
                        {bundle.badge}
                      </span>
                      <span className="bg-slate-950/75 backdrop-blur-md text-white font-bold text-[10px] px-2.5 py-1 rounded-full border border-white/15">
                        {bundle.items.length} Items Box
                      </span>
                    </div>

                    {/* Bottom Row: Savings Ribbon & Price Pill */}
                    <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between gap-2">
                      {bundle.savingsText ? (
                        <span className="inline-flex items-center gap-1 bg-rose-600 text-white font-black text-[11px] px-3 py-1 rounded-full shadow-lg border border-rose-300/40">
                          <Tag className="w-3 h-3" />
                          <span>{bundle.savingsText}</span>
                        </span>
                      ) : (
                        <span />
                      )}

                      <div className="bg-white/95 backdrop-blur-md rounded-2xl px-3 py-1.5 text-right shadow-lg border border-amber-200/70">
                        <span className="text-[10px] text-slate-400 line-through font-bold block leading-none">
                          £{bundle.regularPrice.toFixed(2)}
                        </span>
                        <span className="text-lg font-black text-emerald-900 leading-tight block">
                          £{bundle.bundlePrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 sm:p-6 space-y-4">
                    <div>
                      <h3 className="font-black text-lg text-slate-950 group-hover:text-emerald-800 transition-colors leading-snug tracking-tight">
                        {bundle.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {bundle.subtitle}
                      </p>
                    </div>

                    {/* Curated Items Checklist */}
                    <div className="p-3.5 bg-[#fafaf7] rounded-2xl border border-slate-200/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-800 text-[10px] uppercase tracking-wider">
                          Inside This Kit ({bundle.items.length} Essentials)
                        </span>
                        {savingsAmount > 0 && (
                          <span className="text-[10px] font-extrabold text-emerald-700">
                            You save £{savingsAmount.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <ul className="space-y-1.5 text-[11.5px]">
                        {bundle.items.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex items-center justify-between gap-2 pb-1 border-b border-slate-200/50 last:border-b-0 last:pb-0"
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </span>
                              <span className="truncate text-slate-800 font-semibold">
                                {item.name}{' '}
                                <span className="text-slate-500 font-normal">({item.quantity})</span>
                              </span>
                            </span>
                            <span className="text-slate-400 font-medium shrink-0">
                              £{item.originalPrice.toFixed(2)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Footer CTA */}
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                  <button
                    onClick={() => handleAddBundleToCart(bundle)}
                    disabled={isAdded}
                    className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-[13px] tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                      isAdded
                        ? 'bg-emerald-600 text-white shadow-emerald-500/30'
                        : 'bg-emerald-900 hover:bg-emerald-800 text-white hover:shadow-lg active:scale-[0.98]'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-amber-300" />
                        <span>Added Complete Kit to Basket!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4 text-amber-300" />
                        <span>Add Complete Kit • £{bundle.bundlePrice.toFixed(2)}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
