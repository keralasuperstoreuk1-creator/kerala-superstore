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
  QrCode,
  Copy,
  Check,
  ChevronRight,
  ArrowDown
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
    isIOS,
    isInAppBrowser
  } = useAppDownload();

  const [copied, setCopied] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [showAndroidManual, setShowAndroidManual] = useState(false);
  const [showIOSPointerBubble, setShowIOSPointerBubble] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://keralasuperstore.com';

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Direct install for Android
  const handleAndroidInstallClick = async () => {
    const success = await triggerInstall();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => {
        closeModal();
        setInstallSuccess(false);
      }, 1500);
    } else {
      setShowAndroidManual(true);
    }
  };

  // Direct guidance for iPhone (Safari)
  const handleIOSShareClick = async () => {
    closeModal();
    setShowIOSPointerBubble(true);

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Kerala Superstore',
          text: 'Authentic Kerala Groceries & Spices UK',
          url: window.location.href,
        });
      } catch {
        // Closed share dialog
      }
    }
  };

  return (
    <>
      {/* Floating iPhone Safari Pointer Bubble */}
      {showIOSPointerBubble && (
        <div className="fixed bottom-3 left-3 right-3 z-50 animate-bounce-subtle pointer-events-auto">
          <div className="bg-slate-950 text-white rounded-2xl p-4 shadow-2xl border-2 border-amber-400">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shrink-0">
                  ⎋
                </div>
                <div>
                  <div className="font-black text-sm text-amber-300">Tap Share at the Bottom of Safari</div>
                  <p className="text-xs text-slate-200 mt-0.5 leading-snug">
                    1. Tap the <strong>Share icon (⎋)</strong> below<br />
                    2. Scroll down &amp; tap <strong>&apos;Add to Home Screen (⊕)&apos;</strong><br />
                    3. Tap <strong>&apos;Add&apos;</strong> in top-right corner
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSPointerBubble(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center shrink-0 cursor-pointer"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-center mt-2 text-amber-400 text-xl font-black animate-bounce">
              ▼
            </div>
          </div>
        </div>
      )}

      {/* Main Download Modal */}
      {isOpen && (
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
                        Free
                      </span>
                    </div>
                    <p className="text-xs text-amber-200/90 font-medium mt-0.5">
                      Direct Home Screen App for iPhone &amp; Android
                    </p>
                  </div>
                </div>

                <button
                  type="button"
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
                  type="button"
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

                <button
                  type="button"
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
              </div>
            </div>

            {/* Scrollable Body Content */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">

              {/* In-App Browser Warning Alert */}
              {isInAppBrowser && (
                <div className="bg-amber-500/15 border-2 border-amber-500/40 rounded-2xl p-4 text-xs text-amber-950 flex items-start gap-3">
                  <span className="text-xl shrink-0">⚠️</span>
                  <div className="space-y-1">
                    <span className="font-black text-amber-900 block">
                      Opened inside WhatsApp or Instagram?
                    </span>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      To add this app to your Home Screen, tap the <strong>3 dots (⋮)</strong> or <strong>Share</strong> button at the top and select <strong>&apos;Open in Safari / Chrome&apos;</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 1: APPLE IOS (iPhone / iPad) */}
              {activeTab === 'ios' && (
                <div className="space-y-5 animate-fade-in">
                  {/* Direct Action Card for iPhone */}
                  <div className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border border-amber-400/30 shadow-md">
                    <div className="flex items-center gap-3 text-center sm:text-left">
                      <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                        <AppleIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-black text-white text-sm">Add to iPhone Home Screen</h4>
                        <p className="text-xs text-amber-300 font-medium mt-0.5">
                          2 Taps in Safari • No App Store download needed
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleIOSShareClick}
                      className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-xl font-black text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    >
                      <AppleIcon className="w-4 h-4" />
                      <span>📲 Add to Home Screen</span>
                    </button>
                  </div>

                  {/* 3 Step Visual Guide in Clean English */}
                  <div className="bg-slate-50 border-2 border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3.5">
                    <h5 className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center justify-between">
                      <span>How to Add to Home Screen in Safari:</span>
                      <span className="text-emerald-700 font-bold text-[10px]">3 Quick Steps</span>
                    </h5>

                    <div className="space-y-3">
                      {/* Step 1 */}
                      <div className="flex items-start gap-3.5 p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                        <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                          1
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-900">
                              Tap the Share button
                            </span>
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-bold text-[10px] border border-blue-200">
                              <Share2 className="w-3 h-3 text-blue-600" />
                              <span>Share (⎋)</span>
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Tap the yellow button above or tap the <strong>Share icon (⎋)</strong> at the bottom of Safari.
                          </p>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="flex items-start gap-3.5 p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                        <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                          2
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-900">
                              Select &apos;Add to Home Screen&apos;
                            </span>
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-bold text-[10px] border border-emerald-200">
                              <PlusSquare className="w-3 h-3 text-emerald-600" />
                              <span>⊕ Add to Home Screen</span>
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Scroll down the options list and tap <strong>&apos;Add to Home Screen&apos;</strong>.
                          </p>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="flex items-start gap-3.5 p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                        <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                          3
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-900">
                              Tap &apos;Add&apos; in the top-right corner
                            </span>
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md font-bold text-[10px] border border-amber-300">
                              <span>Add</span>
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Tap <strong>Add</strong> at the top right. The Kerala Superstore icon is now on your iPhone Home Screen!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Troubleshooting if option is not visible in Safari */}
                  <div className="bg-amber-500/10 border-2 border-amber-400/50 rounded-2xl p-4 text-xs text-slate-800 space-y-2">
                    <span className="font-black text-amber-950 flex items-center gap-1.5 text-xs">
                      <span>💡 Don&apos;t see &apos;Add to Home Screen&apos; in Safari?</span>
                    </span>
                    <ul className="space-y-1.5 text-[11px] text-slate-700 list-disc list-inside">
                      <li>
                        <strong>Scroll down in the Share sheet:</strong> In the Safari menu, scroll past the WhatsApp/Messages icons to find <strong>&apos;Add to Home Screen (⊕)&apos;</strong>.
                      </li>
                      <li>
                        <strong>Turn off Private Browsing:</strong> If Safari is in <em>Private tab</em> mode, Apple hides this option. Open a <strong>Normal Safari tab</strong>.
                      </li>
                      <li>
                        <strong>Opened from WhatsApp/Instagram?</strong> Tap the compass icon <strong>(🧭)</strong> in the bottom right corner to open in Safari first.
                      </li>
                    </ul>
                  </div>

                  {/* Notification note */}
                  <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-emerald-950">
                    <Bell className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Instant Fresh Stock &amp; Biriyani Alerts:</span>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        Launch the app from your Home Screen and tap &apos;Allow Notifications&apos; to receive alerts for weekend Thalassery Biriyani and special deals.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ANDROID (Samsung, Google Pixel, etc.) */}
              {activeTab === 'android' && (
                <div className="space-y-5 animate-fade-in">
                  {/* Direct Install Card */}
                  <div className="bg-emerald-50/90 border-2 border-emerald-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                    <div className="flex items-center gap-3 text-center sm:text-left">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Download className="w-6 h-6 text-amber-300" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                          <span>1-Click Install App</span>
                          <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded">Android</span>
                        </h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Install directly to your device • Under 1 MB • No Play Store delay
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAndroidInstallClick}
                      className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl font-black text-xs shadow-lg shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    >
                      <AndroidIcon className="w-4 h-4 text-emerald-200" />
                      <span>{installSuccess ? 'App Installed! ✓' : '📲 Install App / Add to Home'}</span>
                    </button>
                  </div>

                  {/* Android Manual Instruction Box if Prompt did not auto trigger */}
                  {showAndroidManual && (
                    <div className="p-4 bg-amber-500/15 border-2 border-amber-400 rounded-2xl text-xs text-amber-950 animate-fade-in space-y-2">
                      <div className="font-black text-amber-900 flex items-center gap-1.5 text-sm">
                        <span>👉 Direct 2-Step Install in Chrome:</span>
                      </div>
                      <p className="text-xs text-amber-900 leading-relaxed">
                        1. Tap the <strong>3 dots menu (⋮)</strong> at the top right of Google Chrome.<br />
                        2. Tap <strong>&apos;Install app&apos;</strong> or <strong>&apos;Add to Home screen&apos;</strong> to install immediately!
                      </p>
                    </div>
                  )}

                  {/* 3 Step Guide in Clean English */}
                  <div className="space-y-3">
                    <h5 className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center justify-between">
                      <span>Direct Chrome / Samsung Internet Instructions:</span>
                      <span className="text-emerald-700 font-bold text-[10px]">3 Simple Steps</span>
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="w-6 h-6 rounded-full bg-emerald-800 text-white font-black text-xs flex items-center justify-center">1</span>
                          <AndroidIcon className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="font-bold text-xs text-slate-900">Open in Chrome</div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          Visit this store in Google Chrome or Samsung Internet.
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="w-6 h-6 rounded-full bg-emerald-800 text-white font-black text-xs flex items-center justify-center">2</span>
                          <span className="font-black text-slate-700 text-sm">⋮</span>
                        </div>
                        <div className="font-bold text-xs text-slate-900">Tap 3 Dots (⋮)</div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          Tap the <strong>3 dots menu (⋮)</strong> at the top right of your browser.
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="w-6 h-6 rounded-full bg-emerald-800 text-white font-black text-xs flex items-center justify-center">3</span>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="font-bold text-xs text-slate-900">Tap &apos;Install app&apos;</div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          Tap <strong>&apos;Install app&apos;</strong> or <strong>&apos;Add to Home screen&apos;</strong> to install instantly.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Notification note */}
                  <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-amber-950">
                    <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Biriyani &amp; Kitchen Special Alerts:</span>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Tap &apos;Allow Notifications&apos; when prompted to receive alerts whenever special items and fresh stock arrive!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* QR Code Section for Desktop Users */}
              <div className="pt-3 border-t border-slate-200">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-16 h-16 bg-white p-1 rounded-xl border border-slate-300 shadow-xs shrink-0 flex items-center justify-center relative">
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
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-1">
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 font-bold text-xs text-slate-800">
                      <QrCode className="w-4 h-4 text-emerald-700" />
                      <span>Viewing on a computer or laptop?</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Scan this code with your iPhone or Android camera to open the store on mobile.
                    </p>
                    <div className="pt-1 flex items-center justify-center sm:justify-start">
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-white border border-slate-200 px-2.5 py-1 rounded-lg hover:border-emerald-600 transition-all cursor-pointer"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copied ? 'Link Copied!' : 'Copy Store Link'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 App Features */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
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
                  <div className="font-bold text-[11px] text-slate-800">Cash on Delivery</div>
                  <div className="text-[9px] text-slate-500">UK Nationwide</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-center">
                  <Smartphone className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                  <div className="font-bold text-[11px] text-slate-800">Lightweight</div>
                  <div className="text-[9px] text-slate-500">&lt; 1MB Size</div>
                </div>
              </div>

            </div>

            {/* Footer actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
              <span className="text-slate-500 text-[11px]">
                Kerala Superstore Manchester • Unit 2, 73 Old Market Street M9 8DX
              </span>
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
