'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Settings, 
  Truck, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Palette, 
  Sliders,
  Plus,
  Trash2,
  Search,
  Check,
  Store,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Clock,
  KeyRound,
  User,
  Eye,
  EyeOff,
  RotateCcw,
  Lock,
  Boxes,
  Tag,
  Bell,
  Flame,
  Layers,
  Grid,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { useStoreConfig, SiteTheme, LogoSize, LogoStyle, StoreModules } from '@/context/StoreConfigContext';
import { DeliveryZone } from '@/types';
import { 
  getAdminCredentials, 
  saveAdminCredentials, 
  DEFAULT_ADMIN_USERNAME, 
  DEFAULT_ADMIN_PASSWORD 
} from '@/lib/admin-auth';

type SettingsTab = 'modules' | 'store' | 'delivery' | 'branding' | 'security';

interface FeatureModuleDef {
  key: keyof StoreModules;
  title: string;
  malayalamHint: string;
  desc: string;
  icon: any;
  color: string;
  adminLink?: string;
  adminLinkText?: string;
}

const FEATURE_MODULES: FeatureModuleDef[] = [
  {
    key: 'showComboBundles',
    title: 'Combo Bundles & Family Kits',
    malayalamHint: 'കോംബോ ബണ്ടിലുകൾ',
    desc: 'Showcase curated Onam, Bachelors & Kerala snack feast kits on storefront',
    icon: Boxes,
    color: 'from-amber-500 to-orange-600',
    adminLink: '/admin/bundles',
    adminLinkText: 'Edit Bundles',
  },
  {
    key: 'showPromoCoupons',
    title: 'Promo Coupons & Discount Codes',
    malayalamHint: 'കൂപ്പൺ കോഡുകൾ',
    desc: 'Coupon discount input in cart drawer and checkout discounts',
    icon: Tag,
    color: 'from-emerald-600 to-teal-700',
    adminLink: '/admin/coupons',
    adminLinkText: 'Edit Coupons',
  },
  {
    key: 'showKitchenSpecials',
    title: 'Kitchen Specials & Alerts Bell',
    malayalamHint: 'കിച്ചൻ സ്പെഷ്യലുകൾ & അലേർട്ട്',
    desc: 'Daily cooked Thalassery Dum Biriyani drops + notification bell in top bar',
    icon: Bell,
    color: 'from-rose-500 to-pink-600',
    adminLink: '/admin/specials',
    adminLinkText: 'Edit Specials',
  },
  {
    key: 'showHeroSlider',
    title: 'Storefront Hero Slider & Big Banners',
    malayalamHint: 'ഹീറോ സ്ലൈഡറും ബാനറുകളും',
    desc: 'Top animated carousel banner slides & spotlight promo card on homepage',
    icon: Sliders,
    color: 'from-blue-600 to-indigo-700',
    adminLink: '/admin/banners',
    adminLinkText: 'Edit Slides',
  },
  {
    key: 'showMovingOffers',
    title: 'Flash Deals Moving Showcase',
    malayalamHint: 'ഫ്ലാഷ് ഡീൽസ് മൂവിങ് ബാർ',
    desc: 'Smooth continuous moving marquee row displaying live discounted groceries',
    icon: Flame,
    color: 'from-red-500 to-amber-600',
  },
  {
    key: 'showFeaturedCategories',
    title: 'Top 6 Circular Category Bubbles',
    malayalamHint: 'റൗണ്ട് കാറ്റഗറി ബട്ടണുകൾ',
    desc: 'Circular photographic category badges (Rice, Spices, Snacks, Coconut Oil, etc.)',
    icon: Layers,
    color: 'from-teal-600 to-emerald-700',
    adminLink: '/admin/banners',
    adminLinkText: 'Edit Category Photos',
  },
  {
    key: 'showCuratedDepartments',
    title: 'Explore by Department Grid',
    malayalamHint: 'കാറ്റഗറി ഡിപ്പാർട്മെന്റുകൾ',
    desc: 'Full 10-department grid with quick-shop popups and variety picker',
    icon: Grid,
    color: 'from-purple-600 to-indigo-700',
  },
  {
    key: 'showBrandMarquee',
    title: 'Authentic Kerala Brands Ticker',
    malayalamHint: 'ബ്രാൻഡ് ലോഗോ സ്ക്രോളർ',
    desc: 'Infinite marquee ticker featuring Nirapara, Eastern, Brahmins, Double Horse, etc.',
    icon: CheckCircle2,
    color: 'from-cyan-600 to-blue-700',
  },
  {
    key: 'showAppDownload',
    title: 'Mobile App Download Showcase & Header',
    malayalamHint: 'മൊബൈൽ ആപ്പ് ഡൗൺലോഡ്',
    desc: '1-Click App installation section at bottom and top header download button',
    icon: Smartphone,
    color: 'from-emerald-700 to-slate-900',
  },
  {
    key: 'showOfferMarquee',
    title: 'Top Special Offer Marquee Bar',
    malayalamHint: 'മുകളിലെ ഓഫർ അനൗൺസ്മെന്റ്',
    desc: 'Top animated ticker strip announcing free Manchester delivery & flash sales',
    icon: Sparkles,
    color: 'from-amber-600 to-rose-600',
  },
];

export default function AdminSettingsPage() {
  const { 
    config, 
    updateConfig, 
    toggleModule,
    addDeliveryZone, 
    updateDeliveryZone, 
    deleteDeliveryZone,
    getDeliveryZoneForPostcode
  } = useStoreConfig();

  const [activeTab, setActiveTab] = useState<SettingsTab>('modules');
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  // Form local state for delivery & store
  const [theme, setSelectedTheme] = useState<SiteTheme>(config.theme);
  const [logoSize, setLogoSize] = useState<LogoSize>(config.logoSize);
  const [logoStyle, setLogoStyle] = useState<LogoStyle>(config.logoStyle);
  const [showStoreTitle, setShowStoreTitle] = useState<boolean>(config.showStoreTitle);

  const [storeDetails, setStoreDetails] = useState({
    address: config.address,
    postcode: config.postcode,
    phone: config.phone,
    whatsapp: config.whatsapp,
    announcement: config.announcement,
  });

  // Admin Security & Credentials State
  const [adminUser, setAdminUser] = useState(DEFAULT_ADMIN_USERNAME);
  const [adminPass, setAdminPass] = useState(DEFAULT_ADMIN_PASSWORD);
  const [confirmPass, setConfirmPass] = useState(DEFAULT_ADMIN_PASSWORD);
  const [showSecurityPass, setShowSecurityPass] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);

  useEffect(() => {
    const creds = getAdminCredentials();
    if (creds.username) setAdminUser(creds.username);
    if (creds.password) {
      setAdminPass(creds.password);
      setConfirmPass(creds.password);
    }
  }, []);

  // Delivery Zones
  const [isAddingZone, setIsAddingZone] = useState(false);
  const [newZone, setNewZone] = useState({
    name: '',
    postcodePrefixes: '',
    charge: 3.99,
    freeThreshold: 45.00,
    estimatedTime: '1 - 2 Business Days',
    enabled: true,
  });

  const [testPostcode, setTestPostcode] = useState('M9 8DX');
  const [testResult, setTestResult] = useState<DeliveryZone | null>(null);

  const showSuccess = (msg: string) => {
    setSavedSuccess(msg);
    setTimeout(() => setSavedSuccess(null), 3500);
  };

  const handleTestPostcode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPostcode.trim()) return;
    const match = getDeliveryZoneForPostcode(testPostcode);
    setTestResult(match);
  };

  const handleAddZoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZone.name.trim() || !newZone.postcodePrefixes.trim()) return;

    const prefixes = newZone.postcodePrefixes
      .split(',')
      .map((p) => p.trim().toUpperCase())
      .filter(Boolean);

    addDeliveryZone({
      name: newZone.name.trim(),
      postcodePrefixes: prefixes,
      charge: Number(newZone.charge),
      freeThreshold: Number(newZone.freeThreshold),
      estimatedTime: newZone.estimatedTime.trim(),
      enabled: newZone.enabled,
    });

    setIsAddingZone(false);
    setNewZone({
      name: '',
      postcodePrefixes: '',
      charge: 3.99,
      freeThreshold: 45.00,
      estimatedTime: '1 - 2 Business Days',
      enabled: true,
    });
    showSuccess('Delivery zone added successfully!');
  };

  const handleSaveStoreConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      theme,
      logoSize,
      logoStyle,
      showStoreTitle,
      ...storeDetails,
    });
    showSuccess('Store details, branding & festive themes saved!');
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError(null);

    if (!adminUser.trim()) {
      setSecurityError('Username cannot be empty.');
      return;
    }

    if (!adminPass.trim() || adminPass.length < 5) {
      setSecurityError('Password must be at least 5 characters long.');
      return;
    }

    if (adminPass !== confirmPass) {
      setSecurityError('Passwords do not match. Please re-enter.');
      return;
    }

    const saved = saveAdminCredentials(adminUser.trim(), adminPass.trim());
    if (saved) {
      showSuccess('Admin username and password updated successfully!');
    } else {
      setSecurityError('Failed to save credentials.');
    }
  };

  const handleResetDefaultCredentials = () => {
    setAdminUser(DEFAULT_ADMIN_USERNAME);
    setAdminPass(DEFAULT_ADMIN_PASSWORD);
    setConfirmPass(DEFAULT_ADMIN_PASSWORD);
    saveAdminCredentials(DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_PASSWORD);
    showSuccess(`Reset to default: ${DEFAULT_ADMIN_USERNAME} / ${DEFAULT_ADMIN_PASSWORD}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Store &amp; Admin Settings
              </h1>
              <p className="text-xs text-slate-500">
                Manchester Physical Store Address, UK Delivery Rates, Festive Themes &amp; Admin Password.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/banners"
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs shadow-sm transition-all flex items-center gap-2"
          >
            <Sliders className="w-4 h-4" />
            <span>Storefront &amp; Banner Customizer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Direct Callout Card for Separate Storefront Customizer */}
      <div className="p-4 bg-gradient-to-r from-amber-50 via-emerald-50 to-amber-50 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="font-black text-slate-900">
              Want to customize your homepage banners, promotional slides or category photos?
            </div>
            <div className="text-[11px] text-slate-600">
              We moved <strong>Storefront &amp; Banner Customizer</strong> to its own dedicated section in the sidebar menu!
            </div>
          </div>
        </div>
        <Link
          href="/admin/banners"
          className="shrink-0 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <span>Open Customizer</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Global Toast Notification */}
      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2.5 text-xs font-bold shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{savedSuccess}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs text-xs font-bold">
        <button
          onClick={() => setActiveTab('modules')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'modules'
              ? 'bg-emerald-900 text-white shadow-sm ring-2 ring-emerald-500/50'
              : 'text-emerald-900 bg-emerald-50 hover:bg-emerald-100'
          }`}
        >
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span>⚡ Website Features (Show / Hide)</span>
        </button>

        <button
          onClick={() => setActiveTab('store')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'store'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Store className="w-4 h-4 text-emerald-400" />
          <span>1. Store Address &amp; Contact</span>
        </button>

        <button
          onClick={() => setActiveTab('delivery')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'delivery'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-4 h-4 text-cyan-400" />
          <span>2. UK Delivery Zones</span>
        </button>

        <button
          onClick={() => setActiveTab('branding')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'branding'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Palette className="w-4 h-4 text-amber-400" />
          <span>3. Festive Themes</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'security'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <KeyRound className="w-4 h-4 text-rose-400" />
          <span>4. Admin Security &amp; Password</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 0: STOREFRONT FEATURE SWITCHES (ENABLE / DISABLE)     */}
      {/* ========================================================= */}
      {activeTab === 'modules' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Storefront Feature Switches &amp; Live Visibility
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                  Adminil ninnum ee options ellam on/off cheyyam. Off cheythal live website-il ninnum aa section poorname aayum disappear aakum. On cheythal udan thanne live website-il thirichu varum.
                </p>
              </div>

              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Cloudflare R2 Live Synced</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FEATURE_MODULES.map((mod) => {
                const IconComponent = mod.icon;
                const isEnabled = config.modules ? (config.modules[mod.key] ?? true) : true;

                return (
                  <div
                    key={mod.key}
                    className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-4 ${
                      isEnabled
                        ? 'bg-white border-emerald-200/80 shadow-xs hover:border-emerald-300'
                        : 'bg-slate-50/70 border-slate-200 opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${mod.color} text-white flex items-center justify-center font-bold shadow-xs shrink-0`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-black text-sm text-slate-900 leading-tight">
                              {mod.title}
                            </h3>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                              {mod.malayalamHint}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-snug">
                            {mod.desc}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100/80 mt-auto">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black ${
                          isEnabled
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`} />
                          <span>{isEnabled ? 'Live on Website' : 'Hidden from Website'}</span>
                        </span>

                        {mod.adminLink && (
                          <Link
                            href={mod.adminLink}
                            className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 hover:underline flex items-center gap-0.5"
                          >
                            <span>{mod.adminLinkText}</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>

                      {/* Interactive Toggle Switch Button */}
                      <button
                        type="button"
                        onClick={() => {
                          toggleModule(mod.key);
                          showSuccess(`${mod.title} is now ${!isEnabled ? 'VISIBLE' : 'HIDDEN'} on the live website!`);
                        }}
                        className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                        }`}
                        role="switch"
                        aria-checked={isEnabled}
                        title={`Click to ${isEnabled ? 'Hide' : 'Show'} on website`}
                      >
                        <span className="sr-only">Toggle {mod.title}</span>
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            isEnabled ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: STORE ADDRESS & CONTACT DETAILS                    */}
      {/* ========================================================= */}
      {activeTab === 'store' && (
        <form onSubmit={handleSaveStoreConfig} className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 pb-3 border-b border-slate-100">
              <Store className="w-5 h-5 text-emerald-700" />
              <span>Physical Store Address &amp; Customer Contact</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Manchester Address</label>
                <input
                  type="text"
                  value={storeDetails.address}
                  onChange={(e) => setStoreDetails({ ...storeDetails, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Postcode</label>
                <input
                  type="text"
                  value={storeDetails.postcode}
                  onChange={(e) => setStoreDetails({ ...storeDetails, postcode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold uppercase outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">WhatsApp Customer Support</label>
                <input
                  type="text"
                  value={storeDetails.whatsapp}
                  onChange={(e) => setStoreDetails({ ...storeDetails, whatsapp: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={storeDetails.phone}
                  onChange={(e) => setStoreDetails({ ...storeDetails, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Top Announcement Marquee</label>
                <input
                  type="text"
                  value={storeDetails.announcement}
                  onChange={(e) => setStoreDetails({ ...storeDetails, announcement: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Save Store Address &amp; Contact
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* TAB 2: UK DELIVERY ZONES & POSTCODES                      */}
      {/* ========================================================= */}
      {activeTab === 'delivery' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <Truck className="w-5 h-5 text-emerald-700" />
                <span>Area-Based UK Delivery &amp; Postcode Rates</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Configure delivery rates for Local Manchester, Greater Manchester, London, and UK Mainland.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingZone(true)}
              className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Delivery Area</span>
            </button>
          </div>

          {/* Zones List */}
          <div className="space-y-3">
            {config.deliveryZones.map((zone) => (
              <div
                key={zone.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white transition-all text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{zone.name}</h4>
                      {zone.enabled ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Disabled
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-[11px] mt-1">
                      Postcode Prefixes: <strong className="text-slate-700">{zone.postcodePrefixes.join(', ')}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-black text-slate-900 text-sm">
                        £{zone.charge.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-semibold">
                        Free over £{zone.freeThreshold.toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                      <button
                        type="button"
                        onClick={() => updateDeliveryZone(zone.id, { enabled: !zone.enabled })}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                      >
                        {zone.enabled ? 'Disable' : 'Enable'}
                      </button>
                      {config.deliveryZones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => deleteDeliveryZone(zone.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                          title="Delete Zone"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Estimated Time: <strong>{zone.estimatedTime}</strong></span>
                </div>
              </div>
            ))}
          </div>

          {/* Add Zone Form */}
          {isAddingZone && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-xs text-emerald-950">Add New Area Delivery Zone</h4>
                <button
                  type="button"
                  onClick={() => setIsAddingZone(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Area Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Birmingham & West Midlands"
                    value={newZone.name}
                    onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Postcode Prefixes (comma separated) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B, CV, WS, WV or M1, M2"
                    value={newZone.postcodePrefixes}
                    onChange={(e) => setNewZone({ ...newZone, postcodePrefixes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Delivery Charge (£) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newZone.charge}
                    onChange={(e) => setNewZone({ ...newZone, charge: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Free Delivery Threshold (£) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newZone.freeThreshold}
                    onChange={(e) => setNewZone({ ...newZone, freeThreshold: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Estimated Delivery Time *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1 - 2 Business Days or Same Day"
                    value={newZone.estimatedTime}
                    onChange={(e) => setNewZone({ ...newZone, estimatedTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddZoneSubmit}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Save Delivery Zone
              </button>
            </div>
          )}

          {/* Live Postcode Tester */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Search className="w-4 h-4 text-emerald-700" />
              <span>Test UK Postcode Matching</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={testPostcode}
                onChange={(e) => {
                  setTestPostcode(e.target.value);
                  setTestResult(null);
                }}
                placeholder="Enter UK Postcode (e.g. M9 8DX or SW1A 1AA)"
                className="px-3 py-2 border border-slate-300 rounded-xl uppercase font-bold text-xs bg-white outline-none focus:border-emerald-600 flex-1 max-w-xs"
              />
              <button
                type="button"
                onClick={handleTestPostcode}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer transition-colors"
              >
                Test Match
              </button>
            </div>

            {testResult && (
              <div className="p-3 bg-white border border-emerald-200 rounded-xl space-y-1 text-[11px] animate-fadeIn">
                <div className="font-bold text-emerald-800">Matched Zone: {testResult.name}</div>
                <div className="text-slate-600">
                  Standard Delivery: <strong>£{testResult.charge.toFixed(2)}</strong> (Free over £{testResult.freeThreshold})
                </div>
                <div className="text-slate-500">Estimated Delivery: {testResult.estimatedTime}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: FESTIVE THEMES & BRANDING                          */}
      {/* ========================================================= */}
      {activeTab === 'branding' && (
        <form onSubmit={handleSaveStoreConfig} className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <Palette className="w-5 h-5 text-amber-500" />
                <span>Festive Themes &amp; Particle Animations</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div
                onClick={() => setSelectedTheme('default')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  theme === 'default'
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-md ring-2 ring-emerald-600/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">🌿</span>
                  {theme === 'default' && (
                    <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <h4 className="font-black text-xs text-slate-900">Emerald Classic</h4>
                <p className="text-[11px] text-slate-500 mt-1">Lush Kerala emerald &amp; spice gold.</p>
              </div>

              <div
                onClick={() => setSelectedTheme('onam')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  theme === 'onam'
                    ? 'border-amber-500 bg-amber-50/80 shadow-md ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">🌼</span>
                  {theme === 'onam' && (
                    <span className="bg-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <h4 className="font-black text-xs text-slate-900">Onam Special</h4>
                <p className="text-[11px] text-slate-500 mt-1">Gold with falling flower petals animation!</p>
              </div>

              <div
                onClick={() => setSelectedTheme('christmas')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  theme === 'christmas'
                    ? 'border-rose-600 bg-rose-50/80 shadow-md ring-2 ring-rose-600/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">❄️</span>
                  {theme === 'christmas' && (
                    <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <h4 className="font-black text-xs text-slate-900">Christmas &amp; New Year</h4>
                <p className="text-[11px] text-slate-500 mt-1">Holiday crimson with falling snowflakes animation!</p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Save Theme Preference
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* TAB 4: ADMIN SECURITY & CREDENTIALS                       */}
      {/* ========================================================= */}
      {activeTab === 'security' && (
        <form onSubmit={handleSaveCredentials} className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <KeyRound className="w-5 h-5 text-rose-600" />
                <span>Admin Login Security &amp; Password Manager</span>
              </div>

              <button
                type="button"
                onClick={handleResetDefaultCredentials}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default</span>
              </button>
            </div>

            {/* Error banner */}
            {securityError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold">
                {securityError}
              </div>
            )}

            {/* Quick Summary Banner */}
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-emerald-950">Current Default Credentials</div>
                <div className="text-emerald-800 mt-0.5">
                  Username: <strong className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-300">{adminUser}</strong> &nbsp;|&nbsp; 
                  Password: <strong className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-300">{showSecurityPass ? adminPass : '••••••••••••'}</strong>
                </div>
                <p className="text-[11px] text-emerald-700 mt-1">
                  You can change your username and password below. Your session will remain protected across all devices.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Admin Username or Email *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={adminUser}
                    onChange={(e) => setAdminUser(e.target.value)}
                    placeholder="e.g. admin"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  New Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showSecurityPass ? 'text' : 'password'}
                    required
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecurityPass(!showSecurityPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showSecurityPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Check className="w-4 h-4" />
                  </div>
                  <input
                    type={showSecurityPass ? 'text' : 'password'}
                    required
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">
                Default: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">admin / kerala2026@admin</code>
              </span>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>Save Admin Credentials</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
