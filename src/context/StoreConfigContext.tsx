'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { DeliveryZone, OfferBannerConfig, Coupon, ComboBundle, RestockLead } from '@/types';
import { INITIAL_COUPONS, INITIAL_BUNDLES, INITIAL_RESTOCK_LEADS } from '@/lib/mock-data';

export type SiteTheme = 'default' | 'onam' | 'christmas';
export type LogoSize = 'compact' | 'normal' | 'prominent';
export type LogoStyle = 'circle' | 'glow' | 'minimal';

export interface StoreConfig {
  theme: SiteTheme;
  logoSize: LogoSize;
  logoStyle: LogoStyle;
  showStoreTitle: boolean;
  announcement: string;
  freeDeliveryThreshold: number;
  standardDeliveryCharge: number;
  phone: string;
  whatsapp: string;
  address: string;
  postcode: string;
  deliveryZones: DeliveryZone[];
  offerBanner: OfferBannerConfig;
}

export const DEFAULT_DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: 'zone-1',
    name: 'Local Manchester (M1 - M9, M8, M9)',
    postcodePrefixes: ['M1', 'M2', 'M3', 'M4', 'M8', 'M9', 'M11', 'M12', 'M13', 'M14', 'M15', 'M25'],
    charge: 1.99,
    freeThreshold: 30.00,
    estimatedTime: 'Same Day / Next Day Delivery',
    enabled: true,
  },
  {
    id: 'zone-2',
    name: 'Greater Manchester & Cheshire (SK, WA, BL, OL, WN, M)',
    postcodePrefixes: ['M', 'SK', 'WA', 'WN', 'BL', 'OL', 'CW'],
    charge: 3.49,
    freeThreshold: 45.00,
    estimatedTime: 'Next Day UK Express',
    enabled: true,
  },
  {
    id: 'zone-3',
    name: 'London & West Midlands (E, EC, N, NW, SE, SW, W, WC, B, CV)',
    postcodePrefixes: ['E', 'EC', 'N', 'NW', 'SE', 'SW', 'W', 'WC', 'CR', 'BR', 'HA', 'UB', 'B', 'CV', 'LE'],
    charge: 4.49,
    freeThreshold: 50.00,
    estimatedTime: '1 - 2 Business Days',
    enabled: true,
  },
  {
    id: 'zone-4',
    name: 'UK Mainland Nationwide',
    postcodePrefixes: ['*'],
    charge: 4.99,
    freeThreshold: 50.00,
    estimatedTime: '2 - 3 Business Days',
    enabled: true,
  },
  {
    id: 'zone-5',
    name: 'Scottish Highlands & Islands (IV, HS, KW, ZE)',
    postcodePrefixes: ['IV', 'HS', 'KW', 'ZE', 'BT'],
    charge: 7.99,
    freeThreshold: 75.00,
    estimatedTime: '3 - 4 Business Days',
    enabled: true,
  },
];

export const DEFAULT_OFFER_BANNER: OfferBannerConfig = {
  enabled: true,
  headline: '🔥 SPECIAL OFFER: Up to 25% OFF on Kerala Spices, Snacks & Pickles! Free Manchester Delivery over £30!',
  subtext: 'Special prices applied automatically at checkout • Fresh stock direct from Kerala',
  badgeText: 'FLASH DEAL',
  animationType: 'marquee',
};

const DEFAULT_CONFIG: StoreConfig = {
  theme: 'default',
  logoSize: 'normal',
  logoStyle: 'circle',
  showStoreTitle: true,
  announcement: 'Free UK Delivery on orders over £50 | 4 Wallbrook Drive, Manchester M9 8PX | Customer Parking at Rear',
  freeDeliveryThreshold: 50.0,
  standardDeliveryCharge: 3.99,
  phone: '+44 7749 132122',
  whatsapp: '+44 7749 132122',
  address: '4 Wallbrook Drive, Manchester',
  postcode: 'M9 8PX',
  deliveryZones: DEFAULT_DELIVERY_ZONES,
  offerBanner: DEFAULT_OFFER_BANNER,
};

export interface CouponValidationResult {
  isValid: boolean;
  coupon?: Coupon;
  discountAmount: number;
  message: string;
}

interface StoreConfigContextType {
  config: StoreConfig;
  updateConfig: (newConfig: Partial<StoreConfig>) => void;
  setTheme: (theme: SiteTheme) => void;
  getDeliveryZoneForPostcode: (postcode: string) => DeliveryZone;
  addDeliveryZone: (zone: Omit<DeliveryZone, 'id'>) => void;
  updateDeliveryZone: (id: string, updated: Partial<DeliveryZone>) => void;
  deleteDeliveryZone: (id: string) => void;
  updateOfferBanner: (newOffer: Partial<OfferBannerConfig>) => void;

  // 1. Coupons & Promo Codes
  coupons: Coupon[];
  addCoupon: (coupon: Omit<Coupon, 'id' | 'createdAt' | 'usageCount'>) => void;
  updateCoupon: (id: string, updated: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;
  validateCoupon: (code: string, subtotal: number) => CouponValidationResult;

  // 2. Combo Bundles
  bundles: ComboBundle[];
  addBundle: (bundle: Omit<ComboBundle, 'id' | 'createdAt'>) => void;
  updateBundle: (id: string, updated: Partial<ComboBundle>) => void;
  deleteBundle: (id: string) => void;

  // 3. Restock Notification Leads
  restockLeads: RestockLead[];
  addRestockLead: (lead: Omit<RestockLead, 'id' | 'createdAt' | 'status'>) => void;
  updateLeadStatus: (id: string, status: 'pending' | 'notified') => void;
  deleteRestockLead: (id: string) => void;
}

const StoreConfigContext = createContext<StoreConfigContextType | undefined>(undefined);

export const StoreConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<StoreConfig>(DEFAULT_CONFIG);
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [bundles, setBundles] = useState<ComboBundle[]>(INITIAL_BUNDLES);
  const [restockLeads, setRestockLeads] = useState<RestockLead[]>(INITIAL_RESTOCK_LEADS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('kss_store_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        setConfig((prev) => ({
          ...prev,
          ...parsed,
          deliveryZones: parsed.deliveryZones && parsed.deliveryZones.length > 0
            ? parsed.deliveryZones
            : DEFAULT_DELIVERY_ZONES,
          offerBanner: parsed.offerBanner ? { ...DEFAULT_OFFER_BANNER, ...parsed.offerBanner } : DEFAULT_OFFER_BANNER,
        }));
      }
    } catch {}

    try {
      const savedCoupons = localStorage.getItem('kss_coupons');
      if (savedCoupons) {
        const parsed = JSON.parse(savedCoupons);
        if (Array.isArray(parsed) && parsed.length > 0) setCoupons(parsed);
      }
    } catch {}

    try {
      const savedBundles = localStorage.getItem('kss_combo_bundles');
      if (savedBundles) {
        const parsed = JSON.parse(savedBundles);
        if (Array.isArray(parsed) && parsed.length > 0) setBundles(parsed);
      }
    } catch {}

    try {
      const savedLeads = localStorage.getItem('kss_restock_leads');
      if (savedLeads) {
        const parsed = JSON.parse(savedLeads);
        if (Array.isArray(parsed)) setRestockLeads(parsed);
      }
    } catch {}
  }, []);

  const updateConfig = (newConfig: Partial<StoreConfig>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      try {
        localStorage.setItem('kss_store_config', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const setTheme = (theme: SiteTheme) => {
    updateConfig({ theme });
  };

  const getDeliveryZoneForPostcode = (rawPostcode: string): DeliveryZone => {
    if (!rawPostcode || !rawPostcode.trim()) {
      return config.deliveryZones.find((z) => z.enabled && z.postcodePrefixes.includes('*')) || config.deliveryZones[0];
    }

    const clean = rawPostcode.trim().toUpperCase().replace(/\s+/g, '');
    const activeZones = config.deliveryZones.filter((z) => z.enabled);

    for (const zone of activeZones) {
      if (zone.postcodePrefixes.includes('*')) continue;
      for (const prefix of zone.postcodePrefixes) {
        const pClean = prefix.trim().toUpperCase().replace(/\s+/g, '');
        if (clean.startsWith(pClean)) {
          return zone;
        }
      }
    }

    return (
      activeZones.find((z) => z.postcodePrefixes.includes('*')) ||
      activeZones[0] ||
      DEFAULT_DELIVERY_ZONES[3]
    );
  };

  const addDeliveryZone = (newZoneData: Omit<DeliveryZone, 'id'>) => {
    const newZone: DeliveryZone = {
      ...newZoneData,
      id: `zone-${Date.now()}`,
    };
    const updated = [...config.deliveryZones, newZone];
    updateConfig({ deliveryZones: updated });
  };

  const updateDeliveryZone = (id: string, updated: Partial<DeliveryZone>) => {
    const newZones = config.deliveryZones.map((z) =>
      z.id === id ? { ...z, ...updated } : z
    );
    updateConfig({ deliveryZones: newZones });
  };

  const deleteDeliveryZone = (id: string) => {
    const newZones = config.deliveryZones.filter((z) => z.id !== id);
    updateConfig({ deliveryZones: newZones });
  };

  const updateOfferBanner = (newOffer: Partial<OfferBannerConfig>) => {
    updateConfig({
      offerBanner: { ...config.offerBanner, ...newOffer },
    });
  };

  // ----------------------------------------------------
  // 1. COUPON CODE METHODS
  // ----------------------------------------------------
  const addCoupon = (couponData: Omit<Coupon, 'id' | 'createdAt' | 'usageCount'>) => {
    const newCoupon: Coupon = {
      ...couponData,
      id: `coup-${Date.now()}`,
      code: couponData.code.trim().toUpperCase(),
      usageCount: 0,
      createdAt: new Date().toISOString(),
    };
    setCoupons((prev) => {
      const updated = [newCoupon, ...prev];
      localStorage.setItem('kss_coupons', JSON.stringify(updated));
      return updated;
    });
  };

  const updateCoupon = (id: string, updated: Partial<Coupon>) => {
    setCoupons((prev) => {
      const next = prev.map((c) =>
        c.id === id ? { ...c, ...updated, ...(updated.code ? { code: updated.code.trim().toUpperCase() } : {}) } : c
      );
      localStorage.setItem('kss_coupons', JSON.stringify(next));
      return next;
    });
  };

  const deleteCoupon = (id: string) => {
    setCoupons((prev) => {
      const next = prev.filter((c) => c.id !== id);
      localStorage.setItem('kss_coupons', JSON.stringify(next));
      return next;
    });
  };

  const validateCoupon = (rawCode: string, subtotal: number): CouponValidationResult => {
    if (!rawCode || !rawCode.trim()) {
      return { isValid: false, discountAmount: 0, message: 'Please enter a coupon code' };
    }

    const clean = rawCode.trim().toUpperCase();
    const found = coupons.find((c) => c.code.toUpperCase() === clean);

    if (!found) {
      return { isValid: false, discountAmount: 0, message: `Coupon "${clean}" not found` };
    }

    if (!found.isActive) {
      return { isValid: false, discountAmount: 0, message: `Coupon "${clean}" is currently inactive` };
    }

    if (found.expiresAt && new Date(found.expiresAt) < new Date()) {
      return { isValid: false, discountAmount: 0, message: `Coupon "${clean}" has expired` };
    }

    if (found.minSpend && subtotal < found.minSpend) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `Min order £${found.minSpend.toFixed(2)} required for "${clean}" (Current: £${subtotal.toFixed(2)})`,
      };
    }

    let discount = 0;
    if (found.discountType === 'percentage') {
      discount = (subtotal * found.discountValue) / 100;
      if (found.maxDiscount && discount > found.maxDiscount) {
        discount = found.maxDiscount;
      }
    } else {
      discount = found.discountValue;
    }

    // Cap discount at subtotal
    if (discount > subtotal) discount = subtotal;

    return {
      isValid: true,
      coupon: found,
      discountAmount: Number(discount.toFixed(2)),
      message: `🎉 Coupon "${found.code}" applied! You save £${discount.toFixed(2)}`,
    };
  };

  // ----------------------------------------------------
  // 2. COMBO BUNDLE METHODS
  // ----------------------------------------------------
  const addBundle = (bundleData: Omit<ComboBundle, 'id' | 'createdAt'>) => {
    const newBundle: ComboBundle = {
      ...bundleData,
      id: `bundle-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setBundles((prev) => {
      const next = [newBundle, ...prev];
      localStorage.setItem('kss_combo_bundles', JSON.stringify(next));
      return next;
    });
  };

  const updateBundle = (id: string, updated: Partial<ComboBundle>) => {
    setBundles((prev) => {
      const next = prev.map((b) => (b.id === id ? { ...b, ...updated } : b));
      localStorage.setItem('kss_combo_bundles', JSON.stringify(next));
      return next;
    });
  };

  const deleteBundle = (id: string) => {
    setBundles((prev) => {
      const next = prev.filter((b) => b.id !== id);
      localStorage.setItem('kss_combo_bundles', JSON.stringify(next));
      return next;
    });
  };

  // ----------------------------------------------------
  // 3. RESTOCK LEADS METHODS
  // ----------------------------------------------------
  const addRestockLead = (leadData: Omit<RestockLead, 'id' | 'createdAt' | 'status'>) => {
    const newLead: RestockLead = {
      ...leadData,
      id: `lead-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setRestockLeads((prev) => {
      const next = [newLead, ...prev];
      localStorage.setItem('kss_restock_leads', JSON.stringify(next));
      return next;
    });
  };

  const updateLeadStatus = (id: string, status: 'pending' | 'notified') => {
    setRestockLeads((prev) => {
      const next = prev.map((l) => (l.id === id ? { ...l, status } : l));
      localStorage.setItem('kss_restock_leads', JSON.stringify(next));
      return next;
    });
  };

  const deleteRestockLead = (id: string) => {
    setRestockLeads((prev) => {
      const next = prev.filter((l) => l.id !== id);
      localStorage.setItem('kss_restock_leads', JSON.stringify(next));
      return next;
    });
  };

  return (
    <StoreConfigContext.Provider
      value={{
        config,
        updateConfig,
        setTheme,
        getDeliveryZoneForPostcode,
        addDeliveryZone,
        updateDeliveryZone,
        deleteDeliveryZone,
        updateOfferBanner,

        // Coupons
        coupons,
        addCoupon,
        updateCoupon,
        deleteCoupon,
        validateCoupon,

        // Bundles
        bundles,
        addBundle,
        updateBundle,
        deleteBundle,

        // Restock Leads
        restockLeads,
        addRestockLead,
        updateLeadStatus,
        deleteRestockLead,
      }}
    >
      {children}
    </StoreConfigContext.Provider>
  );
};

export const useStoreConfig = () => {
  const context = useContext(StoreConfigContext);
  if (!context) {
    throw new Error('useStoreConfig must be used within StoreConfigProvider');
  }
  return context;
};
