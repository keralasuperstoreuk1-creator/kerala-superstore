'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useStoreConfig } from '@/context/StoreConfigContext';

export const ThemeParticleEffect: React.FC = () => {
  const { config } = useStoreConfig();
  const theme = config.theme;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const particles = useMemo(() => {
    if (!mounted || theme === 'default') return [];
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 14 + 10,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 5,
      rotation: Math.random() * 360,
    }));
  }, [mounted, theme]);

  if (!mounted || theme === 'default') return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden="true">
      {theme === 'onam' &&
        particles.map((p) => (
          <div
            key={p.id}
            className="absolute -top-10 opacity-80 animate-onam-petal"
            style={{
              left: `${p.left}%`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              transform: `rotate(${p.rotation}deg)`,
            }}
          >
            {/* Golden Flower Petal SVG */}
            <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C8 7 5 12 12 22C19 12 16 7 12 2Z"
                fill={p.id % 2 === 0 ? '#f59e0b' : '#fbbf24'}
                opacity={0.85}
              />
            </svg>
          </div>
        ))}

      {theme === 'christmas' &&
        particles.map((p) => (
          <div
            key={p.id}
            className="absolute -top-10 text-white/90 animate-snow-fall"
            style={{
              left: `${p.left}%`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              fontSize: `${p.size}px`,
            }}
          >
            ❄
          </div>
        ))}
    </div>
  );
};
