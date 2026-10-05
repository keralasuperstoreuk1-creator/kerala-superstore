import { DailySpecialsThemeConfig } from '@/types';

export const DEFAULT_DAILY_SPECIALS_THEME: DailySpecialsThemeConfig = {
  sectionBgType: 'gradient',
  sectionBgColor: '#451a03', // Amber 950
  sectionBgGradientEnd: '#022c22', // Emerald 950
  sectionTextColor: 'light',
  sectionBorderColor: '#f59e0b',
  cardBgColor: 'rgba(255, 255, 255, 0.10)',
  cardBorderColor: 'rgba(255, 255, 255, 0.15)',
  cardTextColor: 'light',
  accentButtonColor: '#fbbf24',
  priceColor: '#fbbf24',
  badgeColor: '#fbbf24',
};

export interface ThemePresetOption {
  id: string;
  name: string;
  badge: string;
  previewBg: string;
  config: DailySpecialsThemeConfig;
}

export const DAILY_SPECIALS_THEME_PRESETS: ThemePresetOption[] = [
  {
    id: 'malabar-amber-slate',
    name: '🔥 Malabar Amber & Slate (Default)',
    badge: 'Classic',
    previewBg: 'linear-gradient(135deg, #451a03, #0f172a, #022c22)',
    config: {
      sectionBgType: 'gradient',
      sectionBgColor: '#451a03',
      sectionBgGradientEnd: '#022c22',
      sectionTextColor: 'light',
      sectionBorderColor: '#f59e0b',
      cardBgColor: 'rgba(255, 255, 255, 0.10)',
      cardBorderColor: 'rgba(255, 255, 255, 0.15)',
      cardTextColor: 'light',
      accentButtonColor: '#fbbf24',
      priceColor: '#fbbf24',
      badgeColor: '#fbbf24',
    },
  },
  {
    id: 'royal-kerala-emerald',
    name: '🌲 Royal Kerala Emerald Green',
    badge: 'Organic',
    previewBg: 'linear-gradient(135deg, #064e3b, #052e16, #022c22)',
    config: {
      sectionBgType: 'gradient',
      sectionBgColor: '#064e3b',
      sectionBgGradientEnd: '#022c22',
      sectionTextColor: 'light',
      sectionBorderColor: '#22c55e',
      cardBgColor: 'rgba(6, 78, 59, 0.50)',
      cardBorderColor: 'rgba(34, 197, 94, 0.35)',
      cardTextColor: 'light',
      accentButtonColor: '#22c55e',
      priceColor: '#4ade80',
      badgeColor: '#22c55e',
    },
  },
  {
    id: 'midnight-slate-kitchen',
    name: '☕ Midnight Slate & Neon Blue',
    badge: 'Modern',
    previewBg: 'linear-gradient(135deg, #0f172a, #1e1b4b, #0f172a)',
    config: {
      sectionBgType: 'gradient',
      sectionBgColor: '#0f172a',
      sectionBgGradientEnd: '#1e1b4b',
      sectionTextColor: 'light',
      sectionBorderColor: '#38bdf8',
      cardBgColor: 'rgba(30, 41, 59, 0.70)',
      cardBorderColor: 'rgba(56, 189, 248, 0.25)',
      cardTextColor: 'light',
      accentButtonColor: '#f97316',
      priceColor: '#38bdf8',
      badgeColor: '#f97316',
    },
  },
  {
    id: 'roasted-saffron-terracotta',
    name: '☀️ Roasted Saffron & Terracotta',
    badge: 'Traditional',
    previewBg: 'linear-gradient(135deg, #7c2d12, #451a03, #290e02)',
    config: {
      sectionBgType: 'gradient',
      sectionBgColor: '#7c2d12',
      sectionBgGradientEnd: '#451a03',
      sectionTextColor: 'light',
      sectionBorderColor: '#f97316',
      cardBgColor: 'rgba(124, 45, 18, 0.40)',
      cardBorderColor: 'rgba(249, 115, 22, 0.35)',
      cardTextColor: 'light',
      accentButtonColor: '#f59e0b',
      priceColor: '#fde047',
      badgeColor: '#f97316',
    },
  },
  {
    id: 'clean-light-cream',
    name: '⚪ Clean Modern Ivory / Light',
    badge: 'Clean & Bright',
    previewBg: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
    config: {
      sectionBgType: 'solid',
      sectionBgColor: '#f8fafc',
      sectionBgGradientEnd: '#f1f5f9',
      sectionTextColor: 'dark',
      sectionBorderColor: '#cbd5e1',
      cardBgColor: '#ffffff',
      cardBorderColor: '#e2e8f0',
      cardTextColor: 'dark',
      accentButtonColor: '#059669',
      priceColor: '#059669',
      badgeColor: '#f97316',
    },
  },
  {
    id: 'sleek-obsidian-noir',
    name: '🖤 Sleek Obsidian Noir & Ruby',
    badge: 'Premium Dark',
    previewBg: 'linear-gradient(135deg, #09090b, #18181b, #000000)',
    config: {
      sectionBgType: 'solid',
      sectionBgColor: '#09090b',
      sectionBgGradientEnd: '#18181b',
      sectionTextColor: 'light',
      sectionBorderColor: '#3f3f46',
      cardBgColor: '#18181b',
      cardBorderColor: '#27272a',
      cardTextColor: 'light',
      accentButtonColor: '#e11d48',
      priceColor: '#fb7185',
      badgeColor: '#e11d48',
    },
  },
];
