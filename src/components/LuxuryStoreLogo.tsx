'use client';

import React from 'react';
import Image from 'next/image';

interface LuxuryStoreLogoProps {
  className?: string;
  size?: 'compact' | 'normal' | 'prominent';
}

export const LuxuryStoreLogo: React.FC<LuxuryStoreLogoProps> = ({
  className = '',
  size = 'normal'
}) => {
  // Enhanced sizes - prominent & bold as requested by user
  // Compact (mobile header): 52px
  // Normal (standard desktop header): 68px
  // Prominent (flagship large): 86px
  const dim = size === 'compact' ? 52 : size === 'prominent' ? 86 : 68;

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center group ${className}`}
      style={{ width: dim, height: dim }}
    >
      {/* Outer ambient golden/emerald luxury glow ring */}
      <div className="absolute -inset-1.5 bg-gradient-to-tr from-amber-400/35 via-emerald-500/25 to-amber-300/35 rounded-full blur-xs opacity-75 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 animate-pulse pointer-events-none" />

      {/* Authentic Kerala Superstore Round Badge (Clean transparent background) */}
      <div className="relative w-full h-full transition-transform duration-500 group-hover:scale-105 group-hover:rotate-2 drop-shadow-md">
        <Image
          src="/branding/kerala-superstore-round-logo.png"
          alt="Kerala Superstore Manchester"
          width={dim}
          height={dim}
          priority
          className="w-full h-full object-contain select-none"
        />
        {/* Subtle hover sheen reflection */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-full" />
      </div>
    </div>
  );
};
