'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Truck, 
  Heart,
  Lock,
  Download,
  ArrowRight
} from 'lucide-react';
import { CATEGORIES, INITIAL_SETTINGS } from '@/lib/mock-data';
import { useAppDownload } from '@/context/AppDownloadContext';
import { AppleIcon, AndroidIcon } from '@/components/AppDownloadModal';

export const Footer: React.FC = () => {
  const { openModal, installApp, isInstallable } = useAppDownload();
  return (
    <footer className="bg-slate-950 text-slate-300 pt-14 pb-28 sm:pb-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 space-y-12">
        {/* Top Trust Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-12 border-b border-slate-800/80">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-900/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0 shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Next-Day UK Delivery</h4>
              <p className="text-xs text-slate-400 mt-1">Dispatched fresh across Manchester, London, Birmingham &amp; UK nationwide.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-900/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Natasha&apos;s Law Compliant</h4>
              <p className="text-xs text-slate-400 mt-1">Clear allergen declarations on all traditional grocery items and whole spices.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-900/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0 shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Cash on Delivery</h4>
              <p className="text-xs text-slate-400 mt-1">Inspect your items first and pay directly in cash to your courier.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-900/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">100% Genuine Brands</h4>
              <p className="text-xs text-slate-400 mt-1">Directly imported: Nirapara, Eastern, Double Horse, Brahmins, Bravo &amp; Grandmas.</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Column 1: Store Intro */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-emerald-500/50 shrink-0 bg-transparent">
                <Image
                  src="/branding/kerala-superstore-round-logo.png"
                  alt="Kerala Superstore"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <div className="font-black text-xl text-white">Kerala <span className="text-amber-400">SUPERSTORE</span></div>
                <div className="text-[11px] text-slate-400 font-semibold">Manchester • United Kingdom</div>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Kerala Superstore brings authentic Kerala rice varieties, traditional spices, pickles, snacks, and frozen delicacies right to your doorstep across the UK.
            </p>
            <div className="space-y-2 text-xs text-slate-400 pt-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Unit 2, 73 Old Market Street, Manchester, M9 8DX</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full ml-6">
                  🅿️ Customer Parking at rear available
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href="tel:+447749132122" className="hover:text-amber-300">Hotline: +44 7749 132122</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href="mailto:info@keralasuperstores.com" className="hover:text-amber-300">info@keralasuperstores.com</a>
              </div>
            </div>
          </div>

          {/* Column 2: Popular Categories */}
          <div>
            <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Top Categories</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              {CATEGORIES.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <Link href={`/?category=${cat.slug}`} className="hover:text-amber-400 transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: More Categories */}
          <div>
            <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Groceries &amp; Cookware</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              {CATEGORIES.slice(5, 10).map((cat) => (
                <li key={cat.id}>
                  <Link href={`/?category=${cat.slug}`} className="hover:text-amber-400 transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Customer Services & Legal (Secret Admin: NO visible text!) */}
          <div>
            <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Customer Care</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><span className="hover:text-white cursor-pointer">UK Delivery Areas &amp; Rates</span></li>
              <li><span className="hover:text-white cursor-pointer">Natasha&apos;s Law Allergen Info</span></li>
              <li><span className="hover:text-white cursor-pointer">Cash on Delivery Terms</span></li>
              <li><span className="hover:text-white cursor-pointer">UK Privacy Policy (GDPR)</span></li>
              <li><span className="hover:text-white cursor-pointer">Refunds &amp; Returns Policy</span></li>
            </ul>
          </div>
        </div>

        {/* Mobile App Download Callout in Footer */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 p-6 sm:p-8 rounded-3xl border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400 bg-emerald-900 shadow-md shrink-0 mx-auto md:mx-0">
              <Image
                src="/branding/kerala-superstore-round-logo.png"
                alt="Kerala Superstore App"
                fill
                className="object-contain p-1"
              />
            </div>
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h4 className="font-black text-white text-base">Download Kerala Superstore App</h4>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  FREE
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-md">
                Get real-time push alerts when hot Thalassery Biriyani arrives, plus 1-tap fast UK grocery checkout.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            <button
              onClick={() => openModal('ios')}
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <AppleIcon className="w-4 h-4 text-white" />
              <span>Apple iOS</span>
            </button>

            <button
              onClick={() => (isInstallable ? installApp() : openModal('android'))}
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-md shadow-emerald-950"
            >
              <AndroidIcon className="w-4 h-4 text-emerald-300" />
              <span>Android App</span>
            </button>
          </div>
        </div>

        {/* Bottom Bar with Discreet Admin Access */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>&copy; 2026 Kerala Superstore Manchester Ltd. All rights reserved.</span>
            {/* Secret Admin Access Icon */}
            <Link 
              href="/admin" 
              className="text-slate-700 hover:text-slate-500 p-0.5 rounded transition-colors"
              title="Staff Access"
            >
              <Lock className="w-2.5 h-2.5" />
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => (window as any).replayStoreIntro?.()}
              className="text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
              title="Experience the opening splash animation again"
            >
              <span>Replay Intro</span>
            </button>
            <span>•</span>
            <span>Delivering authentic flavours across the UK</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
