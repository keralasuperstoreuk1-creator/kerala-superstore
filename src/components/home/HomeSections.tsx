'use client';

import React from 'react';
import Image from 'next/image';
import { Product } from '@/types';
import { CATEGORIES } from '@/lib/mock-data';
import { ProductCard } from '@/components/ProductCard';
import { getProductDisplayPricing } from '@/lib/pricing';
import { HandBag, HandShop, HandVan, HandWhatsApp } from './HandIcons';

const TILTS = ['-3deg', '2deg', '-1.5deg', '3deg', '-2deg', '1.5deg'];

/* ---------------- Hero ---------------- */

export function HomeHero({
  staples,
  onShopStaples,
  onSelectCategory,
}: {
  staples: Product[];
  onShopStaples: () => void;
  onSelectCategory: (slug: string) => void;
}) {
  return (
    <section className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-4 sm:pt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 rounded-[14px] bg-shop-green text-white p-6 sm:p-10 flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
        <div className="flex-1 min-w-0 flex flex-col gap-3 sm:gap-4">
          <span className="font-hand text-2xl sm:text-[28px] text-shop-yellow -rotate-2 self-start">the monthly shop, sorted</span>
          <h1 className="text-[28px] sm:text-[44px] font-extrabold leading-[1.06] tracking-tight">
            All your Kerala staples, packed by hand in one order.
          </h1>
          <p className="text-[15px] sm:text-[17px] leading-relaxed text-[#CFE3D6] max-w-xl">
            Rice, atta, ghee and coconut oil from the brands you grew up with — sent anywhere in the UK.
          </p>
          <button
            type="button"
            onClick={onShopStaples}
            className="self-start mt-1 h-12 px-6 rounded-[10px] bg-shop-yellow text-shop-ink font-extrabold cursor-pointer"
          >
            Shop staples
          </button>
        </div>
        {staples.length > 0 && (
          <div className="grid grid-cols-4 md:grid-cols-2 gap-2.5 md:gap-3.5 md:w-[380px] shrink-0 pb-3">
            {staples.slice(0, 4).map((p, i) => (
              <div key={p.id} className="relative bg-white rounded-[10px] p-1.5 md:p-2.5 pb-3 md:pb-5">
                <div className="relative w-full aspect-square">
                  <Image src={p.imageUrl} alt={p.name} fill sizes="(max-width: 768px) 25vw, 180px" className="object-contain" />
                </div>
                <span
                  className="price-tag absolute -bottom-2.5 left-1/2 -translate-x-1/2 md:left-auto md:right-2.5 md:translate-x-0 text-lg md:text-[26px] whitespace-nowrap"
                  style={{ transform: `${i % 2 ? '' : ''} rotate(${TILTS[i]})` }}
                >
                  £{getProductDisplayPricing(p).sellingPrice.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-2 gap-4">
        <button
          type="button"
          onClick={() => onSelectCategory('crisps-and-snacks')}
          className="text-left flex items-center gap-3 p-5 rounded-[14px] bg-shop-yellow text-shop-ink cursor-pointer"
        >
          <span className="flex-1 min-w-0 flex flex-col gap-1.5">
            <span className="font-hand text-[23px] font-bold text-[#6B3E0C]">4 o&apos;clock chaya time</span>
            <span className="text-[21px] sm:text-[23px] font-extrabold leading-tight tracking-tight">Chips, mixture &amp; tea-time snacks</span>
            <span className="text-sm font-bold underline">Shop snacks</span>
          </span>
          <span className="relative w-24 h-24 sm:w-[110px] sm:h-[110px] bg-white rounded-[10px] rotate-3 shrink-0">
            <Image src="/categories/snacks.jpg" alt="" fill sizes="110px" className="object-cover rounded-[10px]" />
          </span>
        </button>
        <button
          type="button"
          onClick={() => onSelectCategory('ready-to-eat')}
          className="text-left flex items-center gap-3 p-5 rounded-[14px] bg-white border border-shop-line text-shop-ink cursor-pointer"
        >
          <span className="flex-1 min-w-0 flex flex-col gap-1.5">
            <span className="font-hand text-[23px] font-bold text-shop-red">no cooking tonight?</span>
            <span className="text-[21px] sm:text-[23px] font-extrabold leading-tight tracking-tight">Ready-to-eat curries, porotta &amp; snacks</span>
            <span className="text-sm font-bold text-shop-green underline">Shop ready to eat</span>
          </span>
          <span className="relative w-24 h-24 sm:w-[110px] sm:h-[110px] -rotate-3 shrink-0">
            <Image src="/categories/frozen.jpg" alt="" fill sizes="110px" className="object-cover rounded-[10px]" />
          </span>
        </button>
      </div>
    </section>
  );
}

/* ---------------- Service strip ---------------- */

export function ServiceStrip({ threshold, onWhatsApp }: { threshold: number; onWhatsApp: () => void }) {
  const items = [
    { icon: <HandVan />, title: `Free delivery over £${threshold}`, text: 'Packed and sent across the UK' },
    { icon: <HandShop />, title: 'Click & collect', text: 'Unit 2, 73 Old Market Street, M9 8DX' },
    { icon: <HandBag />, title: 'Packed by our own team', text: 'Every order checked by hand' },
  ];
  return (
    <section className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-shop-paper border border-dashed border-shop-dash rounded-xl">
        {items.map((it) => (
          <div key={it.title} className="flex items-center gap-3 p-3 sm:p-4">
            <span className="text-shop-green shrink-0">{it.icon}</span>
            <span className="flex flex-col leading-snug min-w-0">
              <span className="font-bold text-[13px] sm:text-[15px]">{it.title}</span>
              <span className="text-xs sm:text-[13px] text-shop-muted">{it.text}</span>
            </span>
          </div>
        ))}
        <button type="button" onClick={onWhatsApp} className="flex items-center gap-3 p-3 sm:p-4 text-left cursor-pointer">
          <span className="text-shop-green shrink-0"><HandWhatsApp size={34} /></span>
          <span className="flex flex-col leading-snug min-w-0">
            <span className="font-bold text-[13px] sm:text-[15px]">Order on WhatsApp</span>
            <span className="text-xs sm:text-[13px] text-shop-muted">Send your list, we pack it</span>
          </span>
        </button>
      </div>
    </section>
  );
}

/* ---------------- Departments ---------------- */

export function DepartmentGrid({ counts, onSelect }: { counts: Record<string, number>; onSelect: (slug: string) => void }) {
  return (
    <section id="departments-section" className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-8 scroll-mt-28">
      <div className="flex items-baseline gap-3 mb-4">
        <h2 className="text-xl sm:text-[26px] font-extrabold tracking-tight">Shop by department</h2>
        <span className="font-hand text-xl sm:text-[23px] text-shop-brown">{CATEGORIES.length} aisles, just like the shop</span>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-3">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.slug)}
            className="flex flex-col items-center gap-2 px-1 py-2.5 sm:py-3 rounded-[10px] sm:bg-white sm:border sm:border-shop-line text-shop-ink cursor-pointer hover:border-shop-green"
          >
            <span className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-[3px] border-white sm:border-shop-cream bg-white shadow-[0_0_0_1px_#E8DFCB]">
              <Image src={c.imageUrl || '/categories/rice.jpg'} alt="" fill sizes="80px" className="object-cover" />
            </span>
            <span className="text-xs sm:text-[13px] font-bold text-center leading-tight">{c.name}</span>
            {counts[c.slug] ? <span className="text-[11px] text-shop-muted -mt-1">{counts[c.slug]} items</span> : null}
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Product rail ---------------- */

export function ProductRail({
  id,
  title,
  note,
  noteColor = 'text-shop-brown',
  products,
  onOpen,
  onSeeAll,
}: {
  id?: string;
  title: string;
  note?: string;
  noteColor?: string;
  products: Product[];
  onOpen: (p: Product) => void;
  onSeeAll?: () => void;
}) {
  if (products.length === 0) return null;
  return (
    <section id={id} className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-7 scroll-mt-28">
      <div className="p-4 sm:p-5 rounded-[14px] bg-white border border-shop-line">
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-baseline gap-x-3 min-w-0">
            <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight">{title}</h2>
            {note && <span className={`font-hand text-lg sm:text-[22px] ${noteColor}`}>{note}</span>}
          </div>
          {onSeeAll && (
            <button type="button" onClick={onSeeAll} className="shrink-0 text-sm font-bold text-shop-green cursor-pointer">
              See all
            </button>
          )}
        </div>
        <div className="flex lg:grid lg:grid-cols-6 gap-3 overflow-x-auto snap-x pb-1 -mx-1 px-1">
          {products.slice(0, 6).map((p) => (
            <div key={p.id} className="w-[46%] sm:w-[30%] lg:w-auto shrink-0 snap-start">
              <ProductCard product={p} onOpenDetails={onOpen} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Brands ---------------- */

const BRAND_CHIPS = [
  { name: 'Nirapara', color: '#B3261E' }, { name: 'Eastern', color: '#B4410C' }, { name: 'Brahmins', color: '#166534' },
  { name: 'Double Horse', color: '#1E40AF' }, { name: 'Melam', color: '#9F1239' }, { name: 'Ajmi', color: '#0F766E' },
  { name: 'KPL', color: '#8A5A06' }, { name: 'Palat', color: '#7C2D12' }, { name: 'Loyal', color: '#B91C1C' }, { name: 'Haldiram', color: '#BE123C' },
];

export function BrandStrip({ onPick }: { onPick: (brand: string) => void }) {
  return (
    <section className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-7">
      <div className="flex flex-wrap items-center gap-2.5 p-4 sm:p-5 rounded-xl bg-shop-paper border border-dashed border-shop-dash">
        <span className="font-hand text-2xl sm:text-[26px] font-bold text-shop-green mr-2">brands from home</span>
        {BRAND_CHIPS.map((b) => (
          <button
            key={b.name}
            type="button"
            onClick={() => onPick(b.name)}
            className="px-3.5 py-2 rounded-lg border border-shop-line bg-white font-extrabold text-sm sm:text-[15px] cursor-pointer hover:border-current"
            style={{ color: b.color }}
          >
            {b.name}
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Hello from the shop + WhatsApp ---------------- */

// Until a real photo of the team is added, show a small shelf of real products.
export function HelloFromShop({ products }: { products: Product[] }) {
  return (
    <section className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-9 flex flex-col md:flex-row gap-6 md:gap-8 md:items-center">
      <div className="w-full md:w-[360px] shrink-0 grid grid-cols-2 gap-2.5 p-3 rounded-[10px] bg-white border border-shop-line -rotate-1">
        {products.slice(0, 4).map((p, i) => (
          <div key={p.id} className="relative aspect-square rounded-md bg-shop-paper" style={{ transform: `rotate(${TILTS[(i + 2) % TILTS.length]})` }}>
            <Image src={p.imageUrl} alt={p.name} fill sizes="170px" className="object-contain p-2" />
          </div>
        ))}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-2.5">
        <h2 className="text-2xl sm:text-[28px] font-extrabold tracking-tight">Hello from the shop</h2>
        <p className="font-hand text-2xl sm:text-[28px] leading-snug text-[#2F3A34]">
          &ldquo;We started this shop so families here could cook the way Amma did. Can&apos;t find something from home? Tell us — we&apos;ll do our best to bring it in.&rdquo;
        </p>
        <span className="font-hand text-xl sm:text-[25px] font-bold text-shop-brown">— the Kerala Superstore family, Old Market Street</span>
      </div>
    </section>
  );
}

export function WhatsAppBand({ phone, onOpen }: { phone: string; onOpen: () => void }) {
  return (
    <section className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-8 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-7 rounded-[14px] bg-[#FFE9BE]">
        <div className="flex flex-col gap-1">
          <span className="text-xl sm:text-[25px] font-extrabold text-[#2A1A05] tracking-tight">Send your shopping list on WhatsApp</span>
          <span className="text-sm sm:text-[15px] text-[#5A4220]">We&apos;ll pack it and message you when it&apos;s ready · {phone}</span>
        </div>
        <button type="button" onClick={onOpen} className="self-start sm:self-auto h-12 px-6 rounded-[10px] bg-shop-green text-white font-extrabold cursor-pointer">
          Open WhatsApp
        </button>
      </div>
    </section>
  );
}
