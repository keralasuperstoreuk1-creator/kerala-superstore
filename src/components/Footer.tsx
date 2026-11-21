'use client';

import React from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { CATEGORIES, INITIAL_SETTINGS } from '@/lib/mock-data';
import { useAppDownload } from '@/context/AppDownloadContext';
import { AppleIcon, AndroidIcon } from '@/components/AppDownloadModal';
import { HandBag, HandShop, HandVan, HandWhatsApp } from '@/components/home/HandIcons';

export const Footer: React.FC = () => {
  const { openModal, installApp, isInstallable } = useAppDownload();
  const phone = INITIAL_SETTINGS.phone || '+44 7749 132122';
  const telHref = `tel:${phone.replace(/\s+/g, '')}`;
  const waHref = `https://wa.me/${phone.replace(/[^\d]/g, '')}`;

  const pillars = [
    { icon: <HandVan />, title: 'UK-wide delivery', text: 'Packed by hand and sent across the UK.' },
    { icon: <HandShop />, title: 'Click & collect', text: 'Pick up from our shop on Old Market Street.' },
    { icon: <HandBag />, title: INITIAL_SETTINGS.codEnabled ? 'Cash on delivery' : 'Secure checkout', text: INITIAL_SETTINGS.codEnabled ? 'Pay the courier when your order arrives.' : 'Pay safely online.' },
    { icon: <HandWhatsApp size={34} />, title: 'Order on WhatsApp', text: 'Send us your list and we’ll pack it.' },
  ];

  return (
    <footer className="bg-shop-paper text-shop-ink border-t border-dashed border-shop-dash pt-10 pb-28 lg:pb-12">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pb-8 border-b border-shop-line">
          {pillars.map((p) => (
            <div key={p.title} className="flex items-start gap-3">
              <span className="text-shop-green shrink-0">{p.icon}</span>
              <span className="flex flex-col">
                <span className="font-bold text-[15px]">{p.title}</span>
                <span className="text-[13px] text-shop-muted mt-0.5">{p.text}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Kerala Superstore" width={48} height={48} loading="lazy" decoding="async" className="w-12 h-12 object-contain" />
              <div className="leading-tight">
                <div className="font-extrabold text-xl text-shop-green">Kerala Superstore</div>
                <div className="font-hand text-lg text-shop-brown">your Kerala shop in Manchester</div>
              </div>
            </div>
            <p className="text-sm text-shop-muted leading-relaxed max-w-sm">
              Kerala rice, spices, pickles, snacks and frozen favourites — from our shop in Manchester to kitchens across the UK.
            </p>
            <ul className="space-y-1.5 text-sm">
              <li>Unit 2, 73 Old Market Street, Manchester M9 8DX</li>
              <li className="text-shop-muted">Customer parking at the rear</li>
              <li><a href={telHref} className="font-semibold text-shop-green hover:underline">{phone}</a> · <a href={waHref} target="_blank" rel="noopener noreferrer" className="font-semibold text-shop-green hover:underline">WhatsApp</a></li>
              <li><a href={`mailto:${INITIAL_SETTINGS.email}`} className="text-shop-green hover:underline">{INITIAL_SETTINGS.email}</a></li>
            </ul>
          </div>

          <div>
            <h5 className="font-extrabold text-sm mb-3">Departments</h5>
            <ul className="space-y-1.5 text-sm text-shop-muted">
              {CATEGORIES.slice(0, 8).map((c) => (
                <li key={c.id}><a href={`/?category=${c.slug}`} className="hover:text-shop-green">{c.name}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="font-extrabold text-sm mb-3">More aisles</h5>
            <ul className="space-y-1.5 text-sm text-shop-muted">
              {CATEGORIES.slice(8, 16).map((c) => (
                <li key={c.id}><a href={`/?category=${c.slug}`} className="hover:text-shop-green">{c.name}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="font-extrabold text-sm mb-3">Help</h5>
            <ul className="space-y-1.5 text-sm text-shop-muted">
              <li>Delivery areas &amp; rates</li>
              <li>Allergen information — ask us before you buy</li>
              <li>Refunds &amp; returns</li>
              <li>Privacy policy (UK GDPR)</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-[14px] bg-white border border-shop-line">
          <div>
            <div className="font-extrabold text-[17px]">Shop faster with our app</div>
            <div className="text-sm text-shop-muted">Reorder your usual list and hear about kitchen specials first.</div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => openModal('ios')} className="h-11 px-4 rounded-[10px] border-[1.5px] border-shop-ink text-sm font-bold flex items-center gap-2 cursor-pointer">
              <AppleIcon className="w-4 h-4" /> iPhone
            </button>
            <button type="button" onClick={() => (isInstallable ? installApp() : openModal('android'))} className="h-11 px-4 rounded-[10px] bg-shop-green text-white text-sm font-bold flex items-center gap-2 cursor-pointer">
              <AndroidIcon className="w-4 h-4" /> Android
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-shop-line flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-shop-muted">
          <span className="flex items-center gap-2">
            &copy; {new Date().getFullYear()} Kerala Superstore Ltd, Manchester
            <Link href="/admin" title="Staff access" aria-label="Staff access" className="text-[#C9C2B2] hover:text-shop-muted p-1">
              <Lock className="w-3 h-3" />
            </Link>
          </span>
          <span className="font-hand text-lg text-shop-brown">thank you for shopping with us</span>
        </div>
      </div>
    </footer>
  );
};
