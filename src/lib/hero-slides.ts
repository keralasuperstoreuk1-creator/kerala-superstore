import { HeroSlide } from '@/types';

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    badge: '100% Genuine Direct Import',
    titleMain: 'Fresh & Healthy',
    titleHighlight: 'Kerala Food',
    sub: 'Organic',
    desc: 'Authentic Palakkadan Matta rice, stone-ground curries, pure coconut oil & fresh groceries delivered UK-wide.',
    image: '/branding/kerala-grocery-basket-cutout.png',
    cta: 'Shop now',
    categorySlug: 'rice-and-rice-products',
    bgColor: '#064e3b', // Rich Kerala Emerald Green (like user reference image)
    textColor: 'light',
    accentColor: '#22c55e', // Vibrant Green button
    offerTag: 'SALE UP TO 40% OFF',
    imageFit: 'contain',
  },
  {
    id: 'slide-2',
    badge: 'Harvest 2026 Direct From Estates',
    titleMain: 'Fresh &',
    titleHighlight: 'Aromatic Spices',
    sub: 'Wayanad',
    desc: 'Tellicherry black pepper, bold green cardamom, whole cloves & fragrant cinnamon direct from Kerala plantations.',
    image: '/branding/kerala-spices-pack-cutout.png',
    cta: 'Explore Spices',
    categorySlug: 'spices-and-whole-condiments',
    bgColor: '#052e16', // Forest Deep Green
    textColor: 'light',
    accentColor: '#f97316', // Warm Coral Accent
    offerTag: 'FRESH ESTATE BATCH',
    imageFit: 'contain',
  },
  {
    id: 'slide-3',
    badge: 'Weekend Dum Biriyani Kitchen',
    titleMain: 'Malabar Hot',
    titleHighlight: 'Dum Biriyani',
    sub: 'Special',
    desc: 'Authentic Thalassery Kaima rice Dum Biriyani cooked in pure cow ghee. Pre-order now for hot Manchester delivery.',
    image: '/specials/thalassery_chicken_biriyani-cutout.png',
    cta: 'Order Specials',
    categorySlug: null,
    bgColor: '#022c22', // Royal Kerala Deep Green
    textColor: 'light',
    accentColor: '#eab308', // Warm Gold Accent
    offerTag: 'COOKED FRESH TODAY',
    imageFit: 'contain',
  },
  {
    id: 'slide-4',
    badge: 'Fried In 100% Pure Coconut Oil',
    titleMain: 'Crispy Nadan',
    titleHighlight: 'Banana Chips',
    sub: 'Tea Time',
    desc: 'Authentic thin-sliced Kerala Nendran plantains fried crisp in cold-pressed coconut oil. Unbeatable crunch!',
    image: '/branding/kerala-snacks-showcase-cutout.png',
    cta: 'Shop Snacks',
    categorySlug: 'crisps-and-snacks',
    bgColor: '#0f172a', // Midnight Slate
    textColor: 'light',
    accentColor: '#22c55e',
    offerTag: 'HOT CRISPY BATCH',
    imageFit: 'contain',
  },
];

export const DEFAULT_SPOTLIGHT_PROMO = {
  enabled: true,
  ribbonText: 'Special Offer',
  subtitle: 'Cold Pressed Pure',
  highlightText: '25% OFF',
  title: 'Coconut Oil',
  description: 'Pure roasted & filtered Kerala coconut oil for authentic curries.',
  buttonText: 'SHOP NOW',
  categorySlug: 'oils-and-ghee',
  image: '/branding/kerala-coconut-oil-promo-cutout.png',
  imageScale: 100,
  imageX: 0,
  imageY: 0,
  badge: 'HOT DEAL',
  tagText: 'WEEKLY COMBO',
  desc: 'Pure roasted & filtered Kerala coconut oil for authentic curries.',
  priceHighlight: '£12.99',
  cta: 'GET DEAL',
};

