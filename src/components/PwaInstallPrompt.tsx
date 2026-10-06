'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Download, X, Smartphone } from 'lucide-react';
import { useAppDownload } from '@/context/AppDownloadContext';
import { AppleIcon, AndroidIcon } from '@/components/AppDownloadModal';

export const PwaInstallPrompt: React.FC = () => {
  const { installApp, isInstallable, isInstalled, isIOS } = useAppDownload();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('kss_pwa_dismissed')) {
      setIsDismissed(true);
    }
  }, []);

  const handleInstallClick = async () => {
    await installApp();
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('kss_pwa_dismissed', 'true');
    }
  };

  if (isDismissed || isInstalled) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white px-3 py-1.5 border-b border-white/10 flex items-center justify-between gap-2 text-xs">
      <div 
        onClick={handleInstallClick}
        className="flex items-center gap-2 min-w-0 cursor-pointer group"
      >
        <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 border border-amber-400/80 bg-emerald-900 shadow-xs group-hover:scale-105 transition-transform">
          <Image
            src="/branding/kerala-superstore-round-logo.png"
            alt="App Icon"
            fill
            className="object-contain"
          />
        </div>
        <div className="truncate flex items-center gap-1.5">
          <span className="font-black text-amber-300 group-hover:text-amber-200 transition-colors">
            Install Kerala Store App
          </span>
          <div className="hidden sm:flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full text-[10px] text-slate-200">
            <AndroidIcon className="w-3 h-3 text-emerald-400" />
            <AppleIcon className="w-3 h-3 text-white" />
            <span>Android &amp; iPhone</span>
          </div>
          <span className="text-slate-300 hidden md:inline text-[11px]">
            • Get instant alerts for fresh Dum Biriyani &amp; fast UK checkout
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleInstallClick}
          className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg font-black text-[11px] shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
        >
          <Download className="w-3 h-3" />
          <span>{isInstallable ? 'Add to Home Screen' : isIOS ? 'Add to Home' : 'Install App'}</span>
        </button>
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-1 cursor-pointer transition-colors"
          title="Dismiss"
          aria-label="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
