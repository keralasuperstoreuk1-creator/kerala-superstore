'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Download, 
  X, 
  Share2, 
  PlusSquare, 
  ArrowDown, 
  ExternalLink, 
  Smartphone,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useAppDownload } from '@/context/AppDownloadContext';
import { useStoreConfig } from '@/context/StoreConfigContext';
import { AppleIcon, AndroidIcon } from '@/components/AppDownloadModal';

export const MobileSmartInstallBar: React.FC = () => {
  const { 
    isInstalled, 
    isIOS, 
    isAndroid, 
    isInAppBrowser,
    isInstallable, 
    installApp, 
    openModal 
  } = useAppDownload();
  const { config } = useStoreConfig();

  const [isDismissed, setIsDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && sessionStorage.getItem('kss_mobile_dock_dismissed')) {
      setIsDismissed(true);
    }
  }, []);

  if (!mounted) return null;
  // If app download module is turned off in admin, or already installed, or dismissed
  if (!(config.modules?.showAppDownload ?? true) || isInstalled || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('kss_mobile_dock_dismissed', 'true');
    }
  };

  return (
    <div className="lg:hidden fixed bottom-[58px] left-0 right-0 z-30 px-2.5 pb-1 pointer-events-auto animate-fadeIn">
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-950 text-white rounded-2xl p-3 shadow-2xl border border-amber-400/40 ring-1 ring-black/20">
        {/* Subtle moving shimmer highlight */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_4s_infinite] pointer-events-none" />

        <div className="relative flex items-center justify-between gap-2.5">
          {/* Left: App Logo & Description */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-10 h-10 rounded-2xl overflow-hidden border-2 border-amber-400 bg-emerald-900 shrink-0 shadow-md">
              <Image
                src="/branding/kerala-superstore-round-logo.png"
                alt="Kerala Super Store App"
                fill
                className="object-contain p-0.5"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-black text-xs text-white leading-tight">
                  {isIOS 
                    ? 'Kerala Super Store iPhone App' 
                    : isAndroid 
                    ? 'Kerala Super Store Android App' 
                    : 'Kerala Super Store App'}
                </span>
                <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded-full uppercase">
                  Free
                </span>
              </div>
              <p className="text-[10px] text-amber-200/90 font-medium truncate mt-0.5">
                {isIOS 
                  ? 'Add to Home Screen in 2 taps'
                  : '1-Click Install • Instant Food Alerts'}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isIOS ? (
              <button
                type="button"
                onClick={() => openModal('ios')}
                className="px-3 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <AppleIcon className="w-3.5 h-3.5" />
                <span>Add to Home</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => installApp()}
                className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-300" />
                <span>Install App</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDismiss}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Close"
              aria-label="Dismiss app install banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* In-app Browser Warning Notice (e.g. WhatsApp, Instagram) */}
        {isInAppBrowser && (
          <div className="mt-2.5 pt-2 border-t border-white/10 text-[10px] text-amber-300 flex items-center gap-1.5 leading-snug">
            <span>⚠️</span>
            <span>
              Opened in WhatsApp/Instagram? Tap <strong>⋮</strong> or <strong>Share</strong> and choose <strong>&apos;Open in Safari / Chrome&apos;</strong> to add to Home Screen!
            </span>
          </div>
        )}

        {/* iPhone Quick Micro-Guidance Bar */}
        {isIOS && !isInAppBrowser && (
          <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300 font-medium">
            <span className="flex items-center gap-1">
              <span>Tap</span>
              <span className="px-1 py-0.2 bg-white/15 rounded text-white font-bold">Share ⎋</span>
              <span>at bottom ➔</span>
              <span className="text-amber-300 font-bold">Add to Home Screen ⊕</span>
            </span>
            <button
              onClick={() => openModal('ios')}
              className="text-amber-400 font-bold hover:underline shrink-0 ml-1 cursor-pointer"
            >
              See Guide
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
