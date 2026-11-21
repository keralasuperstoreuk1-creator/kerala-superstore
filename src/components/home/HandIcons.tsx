import React from 'react';

/**
 * Hand-drawn style line icons (slightly irregular strokes) used across the
 * storefront instead of uniform stock icons. All decorative: aria-hidden.
 */
type IconProps = { className?: string; size?: number; strokeWidth?: number };

const base = (size: number, strokeWidth: number, className?: string, viewBox = '0 0 24 24') => ({
  width: size,
  height: size,
  viewBox,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className,
  'aria-hidden': true,
});

export const HandSearch = ({ className, size = 22, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M10.5 3.8c3.6-.2 6.6 2.6 6.7 6.2.1 3.7-2.8 6.6-6.4 6.7-3.7.1-6.7-2.7-6.8-6.3-.1-3.5 2.9-6.4 6.5-6.6z" />
    <path d="M15.6 15.4c1.6 1.6 3.2 3.4 4.9 5.1" />
  </svg>
);

export const HandBasket = ({ className, size = 22, strokeWidth = 1.9 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M3.5 9.2c5.6-.4 11.4-.3 17 .1l-1.8 9.6c-.2.9-1 1.5-1.9 1.5H7.4c-.9 0-1.7-.6-1.9-1.5z" />
    <path d="M8 9c.3-2.9 1.9-5 4-5s3.8 2.1 4 5" />
  </svg>
);

export const HandUser = ({ className, size = 22, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M12.1 4.2c2.2 0 3.9 1.8 3.9 4s-1.8 4-4 4-3.9-1.9-3.9-4.1 1.8-3.9 4-3.9z" />
    <path d="M4.6 20.3c1.3-3.6 4.1-5.6 7.5-5.6s6.2 2.1 7.4 5.5" />
  </svg>
);

export const HandList = ({ className, size = 22, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M8.6 6.3c3.8-.2 7.6-.1 11.4.2M8.5 12.1c3.9-.1 7.7 0 11.5.2M8.7 17.9c3.8-.2 7.5-.1 11.2.1" />
    <path d="M4.3 6.2h.2M4.4 12h.2M4.3 17.8h.2" />
  </svg>
);

export const HandMenu = ({ className, size = 20, strokeWidth = 2 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M4 6.8c5.4-.3 10.7-.2 16 .2M4 12.1c5.3-.2 10.6-.1 16 .1M4.2 17.3c5.2-.2 10.5-.1 15.8.2" />
  </svg>
);

export const HandPlus = ({ className, size = 18, strokeWidth = 2.4 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M12.3 4.5c-.2 5-.1 10 .1 15" />
    <path d="M4.6 12.2c5-.3 9.9-.2 14.8.1" />
  </svg>
);

export const HandWhatsApp = ({ className, size = 22, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, strokeWidth, className, '0 0 32 32')}>
    <path d="M16.2 4.6c6.4.1 11.2 5.1 11.1 11.3-.1 6.2-5.3 11.1-11.6 11-1.9 0-3.6-.5-5.2-1.3l-5.7 1.7 1.9-5.3c-1.1-1.7-1.6-3.8-1.6-5.9.1-6.2 5-11.6 11.1-11.5z" />
    <path d="M12 12.8c.4 3.1 3.2 6.2 7 7.1" />
  </svg>
);

export const HandVan = ({ className, size = 34, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, strokeWidth, className, '0 0 32 32')}>
    <path d="M3.6 9.4c5-.3 10-.2 15 .1l.2 11.2c-5 .2-10 .2-15-.1z" />
    <path d="M18.8 13.2c2.4-.1 4.7 0 7 .2l2.6 3.9.1 3.6c-3.2.1-6.5.1-9.7-.1" />
    <path d="M9 23.2a2.1 2.1 0 1 0 .1 0M23.6 23.3a2.1 2.1 0 1 0 .1 0" />
  </svg>
);

export const HandShop = ({ className, size = 34, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, strokeWidth, className, '0 0 32 32')}>
    <path d="M6 13.8c3.4-3.3 6.8-6.2 10.2-8.9 3.4 2.7 6.7 5.6 9.9 8.8" />
    <path d="M8.2 12.4c-.2 4.6-.1 9.2.1 13.8h15.4c.2-4.6.2-9.2 0-13.7" />
    <path d="M13.3 26c0-2.4 0-4.8.1-7.2h5.2l.1 7.2" />
  </svg>
);

export const HandBag = ({ className, size = 34, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, strokeWidth, className, '0 0 32 32')}>
    <path d="M5.4 11.6c7-.3 14.1-.2 21.1.2l-2.2 13.1c-.2 1-1.1 1.7-2.1 1.7H9.8c-1 0-1.9-.7-2.1-1.7z" />
    <path d="M11 11.4c.3-3.9 2.4-6.6 5.1-6.6s4.8 2.7 5.1 6.5" />
    <path d="M11.9 17.6c1.2 1.8 2.6 3 4.2 3.4 1.5-.5 2.8-1.7 3.9-3.4" />
  </svg>
);

export const HandHome = ({ className, size = 24, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M3.6 11.3c2.7-2.5 5.5-4.8 8.5-7 3 2.1 5.9 4.4 8.4 6.9" />
    <path d="M5.6 10.2c-.2 3.3-.1 6.6.1 9.9h4.4v-5.4h3.9l.1 5.4h4.3c.2-3.3.3-6.6.1-9.8" />
  </svg>
);

export const HandTag = ({ className, size = 24, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M19.6 12.4c-2.6 2.7-5.2 5.3-7.9 7.8-2.7-2.6-5.4-5.3-7.9-8.1l.2-7.7c2.6-.2 5.2-.2 7.8 0z" />
    <path d="M8.3 8.2h.2" />
  </svg>
);
