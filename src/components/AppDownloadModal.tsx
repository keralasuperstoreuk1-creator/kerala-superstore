'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  X, 
  Download, 
  Share2, 
  PlusSquare, 
  Smartphone, 
  Bell, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  ExternalLink,
  QrCode,
  Copy,
  Check
} from 'lucide-react';
import { useAppDownload } from '@/context/AppDownloadContext';

// Official Apple SVG Icon
export const AppleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.87-.92.04-2.03.62-2.69 1.37-.58.65-1.09 1.73-.96 2.76 1.03.08 2.11-.51 2.73-1.26z" />
  </svg>
);

// Official Android SVG Icon
export const AndroidIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0007 0-.552.4482-1.0006.9993-1.0006.5521 0 1.0007.4486 1.0007 1.0006 0 .5521-.4486 1.0007-1.0007 1.0007m-11.046 0c-.5521 0-1.0007-.4486-1.0007-1.0007 0-.552.4486-1.0006 1.0007-1.0006.5511 0 .9993.4486.9993 1.0006 0 .5521-.4482 1.0007-.9993 1.0007m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4116 13.8533 8.081 12 8.081c-1.8532 0-3.5901.3306-5.1368.8687L4.8409 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396" />
  </svg>
);

export const AppDownloadModal: React.FC = () => {
  const { 
    isOpen, 
    closeModal, 
    activeTab, 
    openModal, 
    triggerInstall, 
    isInstallable,
    isIOS 
  } = useAppDownload();

  const [copied, setCopied] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://keralasuperstore.co.uk';

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleInstallClick = async () => {
    const success = await triggerInstall();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => {
        closeModal();
        setInstallSuccess(false);
      }, 1500);
    } else {
      // If prompt didn't pop, explain clearly
      alert("To install directly on Android:\n1. Tap the 3 dots (⋮) in your Chrome browser.\n2. Tap 'Install app' or 'Add to Home screen'.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="relative bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white p-5 sm:p-6 shrink-0 border-b border-amber-400/20">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden border-2 border-amber-400/80 shadow-lg bg-emerald-900 shrink-0">
                <Image
                  src="/branding/kerala-superstore-round-logo.png"
                  alt="Kerala Superstore App"
                  fill
                  className="object-contain p-1"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg text-white">Kerala Superstore App</span>
                  <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Official
                  </span>
                </div>
                <p className="text-xs text-amber-200/90 font-medium mt-0.5">
                  Manchester Hub • Free Direct App for Android &amp; iPhone
                </p>
              </div>
            </div>

            <button
              onClick={closeModal}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* OS Switcher Tabs */}
          <div className="mt-5 grid grid-cols-2 gap-2 bg-slate-800/80 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => openModal('android')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                activeTab === 'android'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <AndroidIcon className="w-4 h-4 text-emerald-300" />
              <span>Android (Samsung / etc.)</span>
            </button>

            <button
              onClick={() => openModal('ios')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                activeTab === 'ios'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <AppleIcon className="w-4 h-4 text-white" />
              <span>Apple (iPhone / iPad)</span>
            </button>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* TAB 1: ANDROID INSTRUCTIONS & 1-CLICK INSTALL */}
          {activeTab === 'android' && (
            <div className="space-y-5 animate-fade-in">
              {/* Instant Install Card */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">Instant 1-Click Install</h4>
                    <p className="text-xs text-slate-600">Zero App Store delay • Fast &amp; lightweight (Under 1 MB)</p>
                  </div>
                </div>

                <button
                  onClick={handleInstallClick}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-800/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <AndroidIcon className="w-4 h-4 text-emerald-200" />
                  <span>{installSuccess ? 'App Installed! ✓' : 'Install on Android Phone'}</span>
                </button>
              </div>

              {/* Step-by-Step Guide for Android */}
              <div>
                <h5 className="font-black text-xs uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <span>How to install on any Android phone (Chrome / Edge / Brave):</span>
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-full bg-emerald-800 text-white font-black text-xs flex items-center justify-center">1</span>
                      <AndroidIcon className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="font-bold text-xs text-slate-900">Open in Chrome</div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Open this store website in Google Chrome on your Android mobile.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-full bg-emerald-800 text-white font-black text-xs flex items-center justify-center">2</span>
                      <span className="font-black text-slate-400 text-xs">⋮</span>
                    </div>
                    <div className="font-bold text-xs text-slate-900">Tap 3-Dots Menu</div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Tap the <strong>3 dots (⋮)</strong> in Chrome and tap <strong>&apos;Install app&apos;</strong> or <strong>&apos;Add to Home Screen&apos;</strong>.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-full bg-emerald-800 text-white font-black text-xs flex items-center justify-center">3</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="font-bold text-xs text-slate-900">Confirm &amp; Enjoy</div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Tap <strong>Install</strong>. Kerala Superstore will appear as a full standalone app on your home screen!
                    </p>
                  </div>
                </div>
              </div>

              {/* Push Notification Tip */}
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-amber-950">
                <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Hot Biriyani &amp; Daily Specials Alerts:</span>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    When prompted, tap <strong>&apos;Allow Notifications&apos;</strong> so our Manchester kitchen can alert you the instant weekend Dum Biriyani or fresh fish arrives!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: APPLE IOS INSTRUCTIONS */}
          {activeTab === 'ios' && (
            <div className="space-y-5 animate-fade-in">
              {/* Highlight Banner */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <AppleIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-sm">Official iOS Web App (PWA)</h4>
                    <p className="text-xs text-slate-300">Works seamlessly on iPhone 11 to iPhone 16 Pro &amp; iPads</p>
                  </div>
                </div>
                <span className="hidden sm:inline-block px-3 py-1 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full uppercase">
                  Safari Ready
                </span>
              </div>

              {/* 4-Step iOS Visual Guide */}
              <div>
                <h5 className="font-black text-xs uppercase tracking-wider text-slate-500 mb-3">
                  Follow these 3 quick steps in Safari on your iPhone:
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">1</span>
                      <Share2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="font-bold text-xs text-slate-900">1. Tap Share (⎋)</div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      In Safari, tap the <strong>Share</strong> button (the square with an arrow pointing up at the bottom).
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">2</span>
                      <PlusSquare className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="font-bold text-xs text-slate-900">2. Add to Home Screen</div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Scroll down in the share sheet and tap <strong>&apos;Add to Home Screen&apos; (+)</strong>.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">3</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="font-bold text-xs text-slate-900">3. Tap &apos;Add&apos; in Top-Right</div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Tap <strong>Add</strong>. The Kerala Superstore app icon is now on your iPhone home screen!
                    </p>
                  </div>
                </div>
              </div>

              {/* iOS Push Notification Tip */}
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-emerald-950">
                <Bell className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">iOS Push Alerts (iOS 16.4+):</span>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Once added to your home screen, open the Kerala Superstore app icon and allow notifications to receive daily kitchen specials!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* QR Code Section for Desktop Users */}
          <div className="pt-4 border-t border-slate-200">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
              {/* QR Code Illustration */}
              <div className="w-20 h-20 bg-white p-1.5 rounded-xl border border-slate-300 shadow-xs shrink-0 flex items-center justify-center relative">
                {/* SVG QR Code representation */}
                <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900 fill-current">
                  <path d="M0,0 h30 v30 h-30 z M5,5 v20 h20 v-20 z M10,10 h10 v10 h-10 z" />
                  <path d="M70,0 h30 v30 h-30 z M75,5 v20 h20 v-20 z M80,10 h10 v10 h-10 z" />
                  <path d="M0,70 h30 v30 h-30 z M5,75 v20 h20 v-20 z M10,80 h10 v10 h-10 z" />
                  <rect x="35" y="5" width="10" height="20" />
                  <rect x="50" y="10" width="15" height="10" />
                  <rect x="5" y="35" width="20" height="10" />
                  <rect x="10" y="50" width="10" height="15" />
                  <rect x="35" y="35" width="30" height="30" rx="5" className="text-emerald-700 fill-current" />
                  <rect x="70" y="35" width="10" height="25" />
                  <rect x="85" y="50" width="10" height="15" />
                  <rect x="35" y="70" width="25" height="10" />
                  <rect x="45" y="85" width="20" height="10" />
                  <rect x="70" y="75" width="25" height="20" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-6 h-6 rounded-full bg-white shadow-xs flex items-center justify-center p-0.5">
                    <div className="w-full h-full rounded-full bg-emerald-800 flex items-center justify-center text-[7px] font-black text-amber-300">
                      KSS
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 font-bold text-xs text-slate-800">
                  <QrCode className="w-4 h-4 text-emerald-700" />
                  <span>Viewing on a computer or laptop?</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Point your iPhone or Android camera at this QR code to open the store link on your mobile and install in seconds.
                </p>
                
                {/* Copy website URL button */}
                <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-white border border-slate-200 px-2.5 py-1 rounded-lg hover:border-emerald-600 transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Link Copied!' : 'Copy Mobile Store URL'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Core App Advantages */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-center">
              <Zap className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <div className="font-bold text-[11px] text-slate-800">Ultra Fast</div>
              <div className="text-[9px] text-slate-500">Opens in 1 sec</div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-center">
              <Bell className="w-4 h-4 text-rose-500 mx-auto mb-1" />
              <div className="font-bold text-[11px] text-slate-800">Kitchen Alerts</div>
              <div className="text-[9px] text-slate-500">Hot Biriyani drops</div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <div className="font-bold text-[11px] text-slate-800">COD Available</div>
              <div className="text-[9px] text-slate-500">Pay on delivery</div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-center">
              <Smartphone className="w-4 h-4 text-blue-500 mx-auto mb-1" />
              <div className="font-bold text-[11px] text-slate-800">Zero Storage</div>
              <div className="text-[9px] text-slate-500">&lt; 1MB Size</div>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 text-[11px]">
            Kerala Superstore Manchester • 4 Wallbrook Drive M9 8PX
          </span>
          <button
            onClick={closeModal}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
