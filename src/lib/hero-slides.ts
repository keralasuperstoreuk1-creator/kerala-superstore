import { HeroSlide } from '@/types';

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-spices',
    badge: '🌿 100% Authentic Plantation Spices',
    titleMain: 'Kerala Authentic',
    titleHighlight: 'Spices & Masalas',
    sub: 'Wayanad & Idukki',
    desc: 'Tellicherry black pepper, bold green cardamom, whole cloves, star anise & fragrant cinnamon direct from Kerala estates.',
    image: '/branding/kerala-spices-pack-cutout.png',
    cta: 'Explore Spices',
    categorySlug: 'spices-and-whole-condiments',
    bgColor: '#064e3b', // Rich Kerala Emerald Green
    textColor: 'light',
    accentColor: '#f59e0b', // Spice Gold Accent
    offerTag: 'FRESH 2026 ESTATE BATCH',
    imageFit: 'contain',
  },
  {
    id: 'slide-vegetables',
    badge: '🌱 Farm Fresh Direct Import',
    titleMain: 'Kerala Fresh',
    titleHighlight: 'Vegetables & Kappa',
    sub: 'Nadan Produce',
    desc: 'Fresh Nendran plantains, tapioca roots (kappa), drumsticks (muringakka), chena, pavakka & fresh coconuts flown in weekly.',
    image: '/branding/kerala-fresh-vegetables-cutout.png',
    cta: 'Shop Fresh Veggies',
    categorySlug: 'fresh-fruits-and-vegetables',
    bgColor: '#022c22', // Forest Deep Emerald
    textColor: 'light',
    accentColor: '#22c55e', // Vibrant Harvest Green
    offerTag: 'WEEKLY AIR SHIPMENT',
    imageFit: 'contain',
  },
  {
    id: 'slide-fishes',
    badge: '🐟 Coastal Fresh Catch',
    titleMain: 'Fresh Fishes &',
    titleHighlight: 'Seafood Catch',
    sub: 'Kerala Special',
    desc: 'Authentic Karimeen (Pearl Spot), King Fish (Neymeen), Mathi (Sardines), Ayala (Mackerel) & succulent Tiger Prawns on fresh ice.',
    image: '/branding/kerala-fresh-seafood-cutout.png',
    cta: 'Order Fresh Seafood',
    categorySlug: 'frozen-fish-and-meat',
    bgColor: '#082f49', // Deep Ocean Slate Blue
    textColor: 'light',
    accentColor: '#38bdf8', // Sea Cyan Accent
    offerTag: 'CLEANED & READY TO COOK',
    imageFit: 'contain',
  },
  {
    id: 'slide-meats',
    badge: '🥩 100% Halal Fresh Cuts',
    titleMain: 'Fresh Meats &',
    titleHighlight: 'Nadan Beef Cuts',
    sub: 'Tender & Fresh',
    desc: 'Premium Kerala-cut Beef for Nadan Roast, tender Goat Mutton with bone, and farm-fresh succulent Chicken.',
    image: '/branding/kerala-fresh-meats-cutout.png',
    cta: 'Shop Fresh Meats',
    categorySlug: 'frozen-fish-and-meat',
    bgColor: '#450a0a', // Rich Crimson Maroon
    textColor: 'light',
    accentColor: '#fb7185', // Warm Rose Accent
    offerTag: 'DAILY FRESH CUTS',
    imageFit: 'contain',
  },
  {
    id: 'slide-palaharangal',
    badge: '☕ Chaya Kada Evening Snacks',
    titleMain: 'Nalumani',
    titleHighlight: 'Palaharangal',
    sub: 'Hot & Crispy',
    desc: 'Fresh Pazham Pori (Banana Fritters), Unniyappam, Neyyappam, crunchy Parippu Vada, Sukhiyan & crispy Nendran Banana Chips.',
    image: '/branding/kerala-nalumani-snacks-cutout.png',
    cta: 'Explore Snacks',
    categorySlug: 'crisps-and-snacks',
    bgColor: '#1e1b4b', // Deep Royal Navy
    textColor: 'light',
    accentColor: '#fbbf24', // Golden Banana Yellow
    offerTag: 'FRIED IN COCONUT OIL',
    imageFit: 'contain',
  },
  {
    id: 'slide-biriyani',
    badge: '🔥 Dum Pukht Kitchen Specials',
    titleMain: 'Special Malabar',
    titleHighlight: 'Thalassery Biriyani',
    sub: 'Pure Cow Ghee',
    desc: 'Authentic Thalassery Jeerakasala Kaima rice Dum Biriyani with tender spiced chicken, fried cashews, raisins & boiled egg.',
    image: '/branding/kerala-thalassery-biriyani-cutout.png',
    cta: 'Order Biriyani Special',
    categorySlug: null,
    bgColor: '#18181b', // Luxe Obsidian Dark
    textColor: 'light',
    accentColor: '#eab308', // Regal Gold Accent
    offerTag: 'WEEKEND SPECIAL FEAST',
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
