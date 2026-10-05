export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName?: string;
  imageUrl?: string;
  itemCount?: number;
  varieties?: string[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  productCount?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  categorySlug: string;
  sizeWeight: string;
  price: number; // in GBP £
  offerPrice?: number; // discount price if any
  stock: number;
  lowStockThreshold?: number;
  barcode?: string;
  description: string;
  ingredients?: string;
  allergens?: string[]; // e.g. ["Mustard", "Wheat (Gluten)", "Sesame"]
  tags: string[];
  imageUrl: string;
  additionalImages?: string[];
  isFeatured?: boolean;
  isBestseller?: boolean;
  isOffer?: boolean;
  status: 'published' | 'draft' | 'archived';
  origin?: string; // e.g. "Product of Kerala, India"
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sizeWeight: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  imageUrl: string;
}

export type OrderStatus = 'new' | 'confirmed' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cash_on_delivery' | 'card_stripe';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postcode: string;
  deliveryMethod: 'standard' | 'click_and_collect';
  deliveryCharge: number;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  items: OrderItem[];
  notes?: string;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  postcode: string;
  freeDeliveryThreshold: number;
  standardDeliveryCharge: number;
  codEnabled: boolean;
  announcementText: string;
  deliveryZones?: DeliveryZone[];
  offerBanner?: OfferBannerConfig;
}

export interface DeliveryZone {
  id: string;
  name: string;
  postcodePrefixes: string[]; // e.g. ["M1", "M2", "M8", "M9"] or ["M", "SK", "WA"] or ["*"] for nationwide fallback
  charge: number; // e.g. 1.99
  freeThreshold: number; // e.g. 30.00
  estimatedTime: string; // e.g. "Same Day / Next Day"
  enabled: boolean;
}

export interface OfferBannerConfig {
  enabled: boolean;
  headline: string;
  subtext?: string;
  badgeText: string;
  animationType: 'marquee' | 'pulse' | 'glow';
  linkTarget?: string;
  text?: string;
  linkUrl?: string;
  linkText?: string;
}

export interface AIExtractedProduct {
  name: string;
  brand: string;
  category: string;
  sizeWeight: string;
  ingredients: string;
  allergens: string[];
  description: string;
  tags: string[];
  suggestedPrice: number;
  barcode?: string;
  origin?: string;
  seoTitle: string;
  seoDescription: string;
  slug: string;
  confidenceScore?: number;
}

export interface DailySpecial {
  id: string;
  title: string;
  description: string;
  price: number; // in GBP
  category: 'biriyani' | 'curry_bread' | 'snacks' | 'air_cargo';
  availableTime: string;
  portionsTotal: number;
  portionsRemaining: number;
  isSoldOut: boolean;
  imageUrl: string;
  badge?: string;
  createdAt: string;
}

export interface CustomerNotification {
  id: string;
  title: string;
  message: string;
  type: 'special_item' | 'deal' | 'cargo_arrival' | 'general';
  specialItemId?: string;
  link?: string;
  timestamp: string;
  isRead?: boolean;
}

export interface HeroSlide {
  id: string;
  badge: string;
  titleMain: string;
  titleHighlight: string;
  sub: string;
  desc: string;
  image: string;
  cta: string;
  categorySlug?: string | null;
  // Advanced branding & banner customizer properties
  bgColor?: string; // e.g. '#064e3b' (Deep Emerald), '#052e16', '#0f172a', '#ffffff', etc.
  textColor?: 'light' | 'dark'; // 'light' (white text) or 'dark' (slate text)
  accentColor?: string; // e.g. '#22c55e' (green button like reference), '#f97316' (orange), '#f59e0b' (gold)
  offerTag?: string; // e.g. "SALE UP TO 48% OFF"
  imageFit?: 'cover' | 'contain'; // 'cover' (platter fills right side) or 'contain'
  imageScale?: number; // scale percentage e.g. 50 to 200
  imageX?: number; // horizontal position offset in px
  imageY?: number; // vertical position offset in px
}

export interface SpotlightPromoConfig {
  enabled: boolean;
  ribbonText: string;
  subtitle: string;
  highlightText: string;
  title: string;
  description: string;
  buttonText: string;
  categorySlug?: string | null;
  image: string;
  imageScale?: number; // scale percentage e.g. 40 to 220
  imageX?: number; // horizontal offset in px
  imageY?: number; // vertical offset in px
  tagText?: string;
  badge?: string;
  desc?: string;
  priceHighlight?: string;
  cta?: string;
  bgColor?: string; // background color e.g. '#fffbeb' or '#064e3b'
  textColor?: 'light' | 'dark'; // text color mode
  accentColor?: string; // CTA button color
  ribbonColor?: string; // diagonal ribbon color
}

export interface DailySpecialsThemeConfig {
  sectionBgType: 'gradient' | 'solid';
  sectionBgColor: string; // Background color / Gradient Start (e.g. '#451a03', '#064e3b', '#0f172a', '#f8fafc')
  sectionBgGradientEnd?: string; // Gradient End (e.g. '#022c22', '#000000', '#1e293b')
  sectionTextColor: 'light' | 'dark';
  sectionBorderColor: string; // Outer container border
  cardBgColor: string; // Table/card background (e.g. 'rgba(255,255,255,0.10)', '#1e293b', '#ffffff')
  cardBorderColor: string; // Table/card border
  cardTextColor: 'light' | 'dark';
  accentButtonColor: string; // Pre-order CTA button color
  priceColor: string; // Price highlight color
  badgeColor: string; // Fire badge highlight color
}

export interface Coupon {
  id: string;
  code: string; // uppercase e.g. "ONAM10", "FIRSTORDER", "M9LOCAL"
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number; // e.g. 10 for 10% or 5 for £5
  minSpend?: number; // minimum order subtotal required (e.g. 30)
  maxDiscount?: number; // max cap for percentage discount (e.g. 15)
  expiresAt?: string;
  usageCount: number;
  maxUsage?: number;
  isActive: boolean;
  createdAt: string;
}

export interface BundleItem {
  name: string;
  quantity: string; // e.g. "1 kg", "500g", "2 Packets"
  originalPrice: number;
}

export interface ComboBundle {
  id: string;
  title: string;
  subtitle: string;
  badge: string; // e.g. "FESTIVAL SAVINGS", "WEEKLY COMBO", "BEST VALUE"
  description: string;
  items: BundleItem[];
  regularPrice: number;
  bundlePrice: number;
  savingsText?: string;
  imageUrl: string;
  isActive: boolean;
  isPopular?: boolean;
  createdAt: string;
}

export interface RestockLead {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  createdAt: string;
  status: 'pending' | 'notified';
}


