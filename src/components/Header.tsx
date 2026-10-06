'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Search, 
  ShoppingCart, 
  MapPin, 
  Phone, 
  Menu, 
  X,
  ChevronDown,
  Bell
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useStoreConfig } from '@/context/StoreConfigContext';
import { useSpecialsNotification } from '@/context/SpecialsNotificationContext';
import { useAppDownload } from '@/context/AppDownloadContext';
import { CATEGORIES } from '@/lib/mock-data';
import { LuxuryStoreLogo } from '@/components/LuxuryStoreLogo';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';
import { AppleIcon, AndroidIcon } from '@/components/AppDownloadModal';

interface HeaderProps {
  onSearch?: (query: string) => void;
  onSelectCategory?: (slug: string | null) => void;
  selectedCategory?: string | null;
  onOpenPostcodeModal?: () => void;
  currentPostcode?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onSearch,
  onSelectCategory,
  selectedCategory,
  onOpenPostcodeModal,
  currentPostcode = 'Manchester (M9 8PX) & Nationwide'
}) => {
  const { totalItems, setIsCartOpen } = useCart();
  const { config } = useStoreConfig();
  const { unreadCount, setIsNotificationModalOpen } = useSpecialsNotification();
  const { openModal } = useAppDownload();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (onSearch) onSearch(val);
  };

  // Determine theme announcement bar styling
  const announcementBg = 
    config.theme === 'onam' 
      ? 'bg-amber-900 border-b border-amber-700 text-amber-100'
      : config.theme === 'christmas'
      ? 'bg-rose-950 border-b border-rose-800 text-rose-100'
      : 'bg-emerald-950 text-emerald-100';

  const announcementBadge = 
    config.theme === 'onam' 
      ? { text: '🌼 ONAM SPECIAL', bg: 'bg-amber-400 text-amber-950' }
      : config.theme === 'christmas'
      ? { text: '🎄 FESTIVE SPECIAL', bg: 'bg-rose-500 text-white' }
      : { text: 'UK DELIVERY', bg: 'bg-amber-400 text-emerald-950' };

  const announcementMsg =
    config.theme === 'onam'
      ? 'Happy Onam! Authentic Kerala Sadya Rice, Banana Chips & Spices Delivered Across the UK'
      : config.theme === 'christmas'
      ? 'Merry Christmas & Happy New Year! Festive Kerala Plum Cake, Delicacies & Spices Delivered Across the UK'
      : config.announcement;

  // Logo size classes
  const logoDimensions = 
    config.logoSize === 'compact' 
      ? 'w-10 h-10' 
      : config.logoSize === 'prominent' 
      ? 'w-16 h-16' 
      : 'w-12 h-12';

  const logoStyleClasses =
    config.logoStyle === 'glow'
      ? 'ring-4 ring-amber-400/40 shadow-lg shadow-emerald-900/30'
      : config.logoStyle === 'minimal'
      ? 'shadow-none'
      : 'shadow-xs border-2 border-emerald-600/40';

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-xs">
      {/* Mobile App Install Prompt Strip */}
      <PwaInstallPrompt />

      {/* Top Announcement Bar (NO Admin link, completely discreet) */}
      <div className={`${announcementBg} text-xs py-2 px-4 transition-colors duration-500`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className={`inline-block ${announcementBadge.bg} font-black px-2 py-0.5 rounded-full text-[10px]`}>
              {announcementBadge.text}
            </span>
            <p className="font-medium text-xs">
              {announcementMsg}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <a 
              href={`https://wa.me/447749132122?text=${encodeURIComponent("Hello Kerala Superstore Manchester! I would like to enquire about grocery delivery.")}`} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-1.5 text-emerald-200 hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>Hotline: +44 7749 132122</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Customer Luxury Emblem with Admin Adjustable Sizing */}
          <Link href="/" className="shrink-0 flex items-center gap-2 sm:gap-3 group max-w-[55%] sm:max-w-none">
            <LuxuryStoreLogo size={config.logoSize} />
            {config.showStoreTitle && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1">
                  <span className={`font-black text-lg sm:text-xl tracking-tight leading-none ${
                    config.theme === 'christmas' ? 'text-rose-700' : 'text-emerald-800'
                  }`}>
                    Kerala
                  </span>
                  <span className="font-black text-lg sm:text-xl text-slate-900 tracking-wider leading-none truncate">
                    SUPERSTORE
                  </span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow-2xs">
                    UK
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-slate-500 font-semibold mt-0.5 truncate">
                  <span className="text-emerald-800 font-bold shrink-0">Manchester</span>
                  <span>•</span>
                  <span className="text-slate-500 truncate">M9 8PX</span>
                </div>
              </div>
            )}
          </Link>

          {/* Postcode & Delivery Location Selector (Desktop) */}
          <button
            onClick={onOpenPostcodeModal}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-600 bg-slate-50 hover:bg-emerald-50/50 transition-all text-left text-xs shrink-0"
          >
            <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Deliver To</div>
              <div className="font-bold text-slate-800 truncate max-w-[120px]">{currentPostcode}</div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Desktop Search Bar (Hidden on Mobile, rendered below on Mobile) */}
          <div className="hidden md:flex flex-1 max-w-xl relative">
            <div className="relative flex items-center w-full">
              <input
                type="text"
                placeholder="Search Palakkadan Matta Rice, Sambar Masala, Banana Chips..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-20 py-2.5 rounded-full border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none text-xs sm:text-sm transition-all shadow-xs bg-slate-50/50 focus:bg-white"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <button className={`absolute right-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white transition-all ${
                config.theme === 'christmas'
                  ? 'bg-rose-700 hover:bg-rose-800'
                  : config.theme === 'onam'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-800 hover:bg-emerald-700'
              }`}>
                Search
              </button>
            </div>
          </div>

          {/* Action Buttons: App Download, Specials Bell, Cart, Mobile Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Official App Download Button (Tablet/Desktop) */}
            <button
              onClick={() => openModal()}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-400/50 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-amber-500/10 hover:border-amber-500 hover:bg-amber-50 text-slate-800 transition-all text-xs font-bold shadow-2xs group cursor-pointer active:scale-95"
              title="Download Kerala Superstore App (Android & iPhone)"
            >
              <div className="flex items-center -space-x-1">
                <AndroidIcon className="w-3.5 h-3.5 text-emerald-700" />
                <AppleIcon className="w-3.5 h-3.5 text-slate-800" />
              </div>
              <span className="font-extrabold text-slate-900 group-hover:text-emerald-950">App</span>
              <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                Free
              </span>
            </button>

            {/* Daily Specials & Biriyani Alerts Notification Bell */}
            <button
              onClick={() => setIsNotificationModalOpen(true)}
              className="relative p-2 sm:p-2.5 rounded-xl border border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/50 transition-all text-slate-700 cursor-pointer group active:scale-95"
              title="Store Alerts & Kitchen Specials"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-800 group-hover:text-amber-600 transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-black text-[9px] sm:text-[10px] w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className={`flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-xs transition-all cursor-pointer relative text-white active:scale-95 ${
                config.theme === 'christmas'
                  ? 'bg-rose-700 hover:bg-rose-800'
                  : config.theme === 'onam'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-800 hover:bg-emerald-700'
              }`}
            >
              <div className="relative">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 font-black text-[10px] sm:text-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-xs">
                    {totalItems}
                  </span>
                )}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-[10px] text-emerald-200 font-semibold uppercase leading-tight">My Basket</div>
                <div className="text-xs font-bold leading-tight">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </div>
              </div>
            </button>

            {/* Mobile hamburger menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dedicated Full-Width App-Style Search Bar */}
        <div className="block md:hidden pt-2 pb-0.5">
          <div className="relative flex items-center w-full">
            <input
              type="text"
              placeholder="Search Matta Rice, Masalas, Snacks, Kappa..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-18 py-2 rounded-full border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none text-xs transition-all shadow-xs bg-slate-50/70 focus:bg-white"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
            <button className={`absolute right-1 px-3 py-1 rounded-full text-[11px] font-bold text-white transition-all ${
              config.theme === 'christmas'
                ? 'bg-rose-700 hover:bg-rose-800'
                : config.theme === 'onam'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-emerald-800 hover:bg-emerald-700'
            }`}>
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Category Scrollbar (NO Malayalam, Clean English) */}
      <nav className="border-t border-slate-100 bg-white shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
          <button
            onClick={() => onSelectCategory && onSelectCategory(null)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full font-bold transition-all ${
              selectedCategory === null
                ? config.theme === 'christmas'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : config.theme === 'onam'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
          >
            All Groceries
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory && onSelectCategory(cat.slug)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full font-semibold transition-all ${
                selectedCategory === cat.slug
                  ? config.theme === 'christmas'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : config.theme === 'onam'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile Drawer (No admin links, purely customer navigation) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white p-4 space-y-4 shadow-xl">
          <button
            onClick={() => {
              if (onOpenPostcodeModal) onOpenPostcodeModal();
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 text-xs font-semibold text-emerald-800 w-full p-2.5 rounded-xl bg-emerald-50"
          >
            <MapPin className="w-4 h-4" />
            <span>Deliver to: {currentPostcode}</span>
          </button>

          {/* Mobile Download App Banner in Menu */}
          <button
            onClick={() => {
              openModal();
              setMobileMenuOpen(false);
            }}
            className="w-full p-3 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white flex items-center justify-between text-left shadow-lg border border-amber-400/30 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex items-center -space-x-1">
                <AndroidIcon className="w-4 h-4 text-emerald-400" />
                <AppleIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-black text-xs text-amber-300">Download Mobile App</div>
                <div className="text-[10px] text-slate-300">Free for Android &amp; iPhone</div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px]">
              INSTALL
            </span>
          </button>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Shop Categories</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    if (onSelectCategory) onSelectCategory(c.slug);
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 px-3 rounded-lg hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-medium"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
