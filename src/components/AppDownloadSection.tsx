'use client';

import React from 'react';
import Image from 'next/image';
import { 
  Download, 
  Smartphone, 
  Bell, 
  Zap, 
  ShieldCheck, 
  Truck, 
  QrCode, 
  Star,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { useAppDownload } from '@/context/AppDownloadContext';
import { AppleIcon, AndroidIcon } from '@/components/AppDownloadModal';

export const AppDownloadSection: React.FC = () => {
  const { openModal, triggerInstall, isInstallable } = useAppDownload();

  return (
    <section className="relative overflow-hidden my-12 rounded-3xl mx-4 sm:mx-6 max-w-7xl lg:mx-auto">
      {/* Background with Dark Emerald & Deep Gold gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-950 to-emerald-950 border border-emerald-500/30 rounded-3xl" />
      
      {/* Glow Orbs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative px-6 py-12 sm:px-12 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        
        {/* Left Column: Headline, Highlights, App Store Badges */}
        <div className="lg:col-span-7 space-y-6 text-white text-center lg:text-left">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold">
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span>OFFICIAL MOBILE APPLICATION</span>
            <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.2 rounded-full">
              FREE
            </span>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Get the <span className="text-amber-400">Kerala Superstore</span> App
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
              Download directly to your Android or iPhone without App Store fees. Enjoy instant kitchen alerts when hot Biriyani drops, live order tracking, and 1-tap re-orders.
            </p>
          </div>

          {/* Key Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
            <div className="flex items-start gap-2.5 bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-xs">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">Daily Kitchen Specials</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Instant alerts for Thalassery Biriyani &amp; fresh snacks</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">UK-Wide Delivery &amp; COD</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Manchester local &amp; nationwide courier dispatch</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-xs">
              <div className="w-8 h-8 rounded-xl bg-blue-400/20 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">Fast 1-Tap Checkout</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Under 1MB app size, loads in 1 second</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-xs">
              <div className="w-8 h-8 rounded-xl bg-rose-400/20 border border-rose-400/40 flex items-center justify-center text-rose-300 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">100% Genuine Brands</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Nirapara, Eastern, Brahmins &amp; Double Horse</p>
              </div>
            </div>
          </div>

          {/* Store Download Buttons (Apple & Android) */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
            
            {/* Apple iOS Button */}
            <button
              onClick={() => openModal('ios')}
              className="w-full sm:w-auto px-5 py-3.5 bg-white/10 hover:bg-white/20 border border-white/25 rounded-2xl text-left flex items-center gap-3.5 transition-all active:scale-95 group cursor-pointer shadow-lg"
            >
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <AppleIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-[10px] text-slate-300 font-medium uppercase tracking-wider">
                  Download on
                </div>
                <div className="text-sm font-black text-white flex items-center gap-1">
                  <span>Apple iPhone / iPad</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>

            {/* Android Button */}
            <button
              onClick={() => openModal('android')}
              className="w-full sm:w-auto px-5 py-3.5 bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 border border-emerald-400/30 rounded-2xl text-left flex items-center gap-3.5 transition-all active:scale-95 group cursor-pointer shadow-lg shadow-emerald-950/50"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-900/60 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform">
                <AndroidIcon className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <div className="text-[10px] text-emerald-200 font-medium uppercase tracking-wider">
                  Download for
                </div>
                <div className="text-sm font-black text-white flex items-center gap-1">
                  <span>Android Devices</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>

          </div>

          <div className="flex items-center justify-center lg:justify-start gap-4 text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> No App Store account required
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Instant installation
            </span>
          </div>

        </div>

        {/* Right Column: Realistic 3D Mobile App Mockup Preview */}
        <div className="lg:col-span-5 flex justify-center relative">
          
          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl" />

          {/* Smartphone Frame */}
          <div className="relative w-[280px] sm:w-[310px] bg-slate-900 rounded-[42px] p-3 shadow-2xl border-4 border-slate-700 ring-1 ring-white/20 select-none">
            
            {/* Dynamic Island / Notch */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-30 flex items-center justify-end pr-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* Inner Phone Screen */}
            <div className="bg-[#fcfcfb] rounded-[34px] overflow-hidden border border-slate-800 text-slate-900 flex flex-col h-[520px] relative">
              
              {/* Status bar */}
              <div className="h-9 bg-emerald-950 px-6 pt-2 flex items-center justify-between text-[11px] text-white/80 font-bold shrink-0">
                <span>9:41</span>
                <div className="flex items-center gap-1 text-[10px]">
                  <span>5G</span>
                  <span>100%</span>
                </div>
              </div>

              {/* App Header */}
              <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 px-4 py-3 flex items-center justify-between text-white shrink-0 border-b border-amber-400/20">
                <div className="flex items-center gap-2">
                  <div className="relative w-7 h-7 rounded-full overflow-hidden border border-amber-400">
                    <Image
                      src="/branding/kerala-superstore-round-logo.png"
                      alt="KSS"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <div className="font-black text-xs text-amber-400 leading-tight">Kerala Superstore</div>
                    <div className="text-[8px] text-slate-300">Manchester Hub M9 8PX</div>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                  <Bell className="w-3 h-3 text-amber-300" />
                </div>
              </div>

              {/* Animated Push Notification Banner in Mockup */}
              <div className="p-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🔥</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-black uppercase tracking-wider leading-tight">Kitchen Alert</div>
                    <div className="text-[10px] font-bold truncate">Weekend Dum Biriyani Ready! Tap to order.</div>
                  </div>
                </div>
              </div>

              {/* App Content Preview */}
              <div className="p-3 space-y-2.5 overflow-hidden flex-1 bg-slate-50">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div className="text-[11px] font-bold text-slate-800">Today&apos;s Kerala Offers</div>
                  <span className="text-[9px] bg-rose-600 text-white font-bold px-1.5 py-0.5 rounded-full">
                    SAVE UP TO 30%
                  </span>
                </div>

                {/* Mini Product Cards */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                    <div className="h-16 bg-emerald-50 rounded-lg flex items-center justify-center text-xs font-bold text-emerald-800">
                      🌾 Matta Rice 5kg
                    </div>
                    <div className="text-[10px] font-bold text-slate-900 truncate">Palakkadan Matta</div>
                    <div className="text-[11px] font-black text-emerald-800">£12.99</div>
                  </div>

                  <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                    <div className="h-16 bg-amber-50 rounded-lg flex items-center justify-center text-xs font-bold text-amber-800">
                      🍌 Banana Chips
                    </div>
                    <div className="text-[10px] font-bold text-slate-900 truncate">Pure Coconut Oil</div>
                    <div className="text-[11px] font-black text-emerald-800">£3.49</div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white p-2.5 rounded-xl shadow-xs text-center space-y-0.5">
                  <div className="text-[10px] font-black text-amber-300">Free Next-Day UK Delivery</div>
                  <div className="text-[8px] text-emerald-200">On grocery orders over £50</div>
                </div>
              </div>

              {/* Mockup Bottom Navigation */}
              <div className="h-10 bg-white border-t border-slate-200 px-4 flex items-center justify-around text-slate-400 shrink-0">
                <div className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[9px] font-bold">
                  🏠
                </div>
                <div className="text-[11px]">🛒</div>
                <div className="text-[11px]">🔔</div>
                <div className="text-[11px]">👤</div>
              </div>

            </div>

            {/* Floating Trust Badge */}
            <div className="absolute -bottom-4 -left-4 bg-slate-950 border border-amber-400/50 text-white px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-2">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400" />
                ))}
              </div>
              <span className="text-[11px] font-black text-white">4.9 / 5</span>
              <span className="text-[9px] text-slate-400 hidden sm:inline">Manchester Rated</span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
