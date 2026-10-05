'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface OpeningSplashAnimationProps {
  onComplete?: () => void;
}

export const OpeningSplashAnimation: React.FC<OpeningSplashAnimationProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  useEffect(() => {
    // Only show once per browser session/day so user is never annoyed on reloads
    try {
      const hasSeen = localStorage.getItem('kss_splash_seen_v5');
      if (hasSeen) {
        setIsVisible(false);
        return;
      }
    } catch {
      // fallback
    }

    // Ultra-fast micro-splash (250ms display, then 180ms smooth fadeout)
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        setIsVisible(false);
        try {
          localStorage.setItem('kss_splash_seen_v5', 'true');
        } catch {}
        if (onComplete) onComplete();
      }, 180);
    }, 250);

    return () => clearTimeout(timer);
  }, [onComplete]);

  // Global replay trigger (for user testing via footer button)
  useEffect(() => {
    const handleReplay = () => {
      setIsFadingOut(false);
      setIsVisible(true);
      setTimeout(() => {
        setIsFadingOut(true);
        setTimeout(() => {
          setIsVisible(false);
        }, 180);
      }, 350);
    };

    (window as any).replayStoreIntro = handleReplay;
    return () => {
      delete (window as any).replayStoreIntro;
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      onClick={() => {
        setIsFadingOut(true);
        setTimeout(() => {
          setIsVisible(false);
          try {
            localStorage.setItem('kss_splash_seen_v5', 'true');
          } catch {}
          if (onComplete) onComplete();
        }, 100);
      }}
      className={`fixed inset-0 z-99999 flex items-center justify-center cursor-pointer transition-all duration-200 ease-out ${
        isFadingOut
          ? 'opacity-0 scale-105 pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'radial-gradient(circle at center, #064e3b 0%, #022c22 65%, #01140f 100%)',
      }}
    >
      {/* Soft light aura */}
      <div className="absolute w-72 h-72 rounded-full bg-emerald-400/15 blur-2xl pointer-events-none" />

      {/* Pure Logo Only - Instant Reveal */}
      <div className="relative z-10 flex items-center justify-center">
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]">
          <Image
            src="/branding/kerala-superstore-round-logo.png"
            alt="Kerala Superstore"
            fill
            priority
            className="object-contain select-none"
          />
        </div>
      </div>
    </div>
  );
};
