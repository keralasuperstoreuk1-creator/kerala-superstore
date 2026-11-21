'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useStoreConfig } from '@/context/StoreConfigContext';
import { CATEGORIES } from '@/lib/mock-data';
import { WhatsAppOrderModal } from '@/components/WhatsAppOrderModal';
import { HandBasket, HandMenu, HandSearch, HandWhatsApp } from '@/components/home/HandIcons';

interface HeaderProps {
  onSearch?: (query: string) => void;
  onSelectCategory?: (slug: string | null) => void;
  selectedCategory?: string | null;
  onOpenPostcodeModal?: () => void;
  currentPostcode?: string;
  searchQuery?: string;
  hasOffers?: boolean;
}

// Short labels for the department bar; the full list lives in CATEGORIES.
const NAV_SLUGS: { slug: string; label: string }[] = [
  { slug: 'rice-and-rice-products', label: 'Rice' },
  { slug: 'breakfast-powders', label: 'Breakfast & Flours' },
  { slug: 'masala-and-curry-powders', label: 'Masala' },
  { slug: 'spices-and-whole-condiments', label: 'Spices' },
  { slug: 'crisps-and-snacks', label: 'Snacks' },
  { slug: 'biscuits-and-sweets', label: 'Biscuits & Sweets' },
  { slug: 'traditional-pickles', label: 'Pickles' },
  { slug: 'frozen-delights', label: 'Frozen' },
  { slug: 'tea-coffee-and-drinks', label: 'Drinks' },
  { slug: 'household-and-cleaning', label: 'Household' },
];

export const Header: React.FC<HeaderProps> = ({
  onSearch,
  onSelectCategory,
  selectedCategory,
  onOpenPostcodeModal,
  currentPostcode = 'M9 8DX',
  searchQuery: searchQueryProp = '',
  hasOffers = false,
}) => {
  const { totalItems, subtotal, setIsCartOpen, freeDeliveryThreshold } = useCart();
  const { config } = useStoreConfig();
  const [searchQuery, setSearchQuery] = useState(searchQueryProp);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  React.useEffect(() => {
    setSearchQuery(searchQueryProp);
  }, [searchQueryProp]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const el = document.getElementById('search-results-section') || document.getElementById('catalog-section');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const selectCategory = (slug: string | null) => {
    onSelectCategory?.(slug);
    setMenuOpen(false);
  };

  const threshold = freeDeliveryThreshold || 50;
  const phone = config.phone || '+44 7749 132122';

  return (
    <header className="sticky top-0 z-40 w-full bg-shop-paper">
      {/* Info bar */}
      <div className="bg-shop-green text-[#E4EFE7] text-xs sm:text-[13px]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-5 min-w-0">
            <span className="whitespace-nowrap">Free delivery over <strong className="text-white">£{threshold}</strong></span>
            <button
              type="button"
              onClick={onOpenPostcodeModal}
              className="hidden md:inline whitespace-nowrap hover:underline cursor-pointer"
            >
              Deliver to <strong className="text-white">{currentPostcode}</strong>
            </button>
            <span className="hidden lg:inline whitespace-nowrap">Click &amp; collect · Unit 2, 73 Old Market Street, M9 8DX</span>
          </div>
          <span className="hidden sm:inline whitespace-nowrap">Call or WhatsApp <strong className="text-white">{phone}</strong></span>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-shop-line">
        <div className="max-w-[1320px] mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex flex-wrap items-center gap-x-2 gap-y-2.5 sm:gap-5">
          <button
            type="button"
            aria-label="Open departments menu"
            onClick={() => setMenuOpen(true)}
            className="lg:hidden w-11 h-11 -ml-2 flex items-center justify-center text-shop-ink cursor-pointer"
          >
            <HandMenu size={24} />
          </button>

          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 text-shop-ink min-w-0">
            <Image src="/logo.png" alt="Kerala Superstore logo" width={52} height={52} className="w-10 h-10 sm:w-[52px] sm:h-[52px] object-contain shrink-0" priority />
            <span className="flex flex-col leading-none min-w-0">
              <span className="text-[17px] sm:text-[23px] font-extrabold tracking-tight text-shop-green whitespace-nowrap">Kerala Superstore</span>
              <span className="font-hand text-[14px] sm:text-[19px] text-shop-brown whitespace-nowrap">your Kerala shop in Manchester</span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-1 sm:gap-2 lg:order-3">
            <button
              type="button"
              aria-label="Order on WhatsApp"
              onClick={() => setIsWhatsAppModalOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 text-shop-ink cursor-pointer"
            >
              <HandWhatsApp size={24} className="text-shop-green" />
              <span className="flex flex-col leading-tight text-left">
                <span className="text-xs text-shop-muted">Send your list</span>
                <span className="text-sm font-bold">WhatsApp</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              aria-label={`Basket, ${totalItems} items, £${subtotal.toFixed(2)}`}
              className="relative flex items-center gap-2.5 h-11 sm:h-12 px-2.5 sm:px-4 rounded-[10px] bg-shop-yellow text-shop-ink cursor-pointer shrink-0"
            >
              <HandBasket size={24} />
              {totalItems > 0 && (
                <span className="sm:hidden absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-shop-green text-white text-[11px] font-bold flex items-center justify-center">{totalItems}</span>
              )}
              <span className="hidden sm:flex flex-col leading-tight text-left">
                <span className="text-[11px] sm:text-xs font-semibold">{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
                <span className="text-sm sm:text-[15px] font-extrabold">£{subtotal.toFixed(2)}</span>
              </span>
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="w-full lg:w-auto lg:flex-1 lg:order-2" role="search">
            <label className="flex items-center gap-2.5 h-12 border-[1.5px] border-[#2F3A34] rounded-[10px] bg-white pl-3.5 pr-1.5">
              <HandSearch className="text-[#2F3A34] shrink-0" />
              <span className="sr-only">Search products</span>
              <input
                type="search"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search 3,700+ products — matta rice, Eastern, achar…"
                className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[15px] text-shop-ink placeholder:text-[#7A827E]"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => { setSearchQuery(''); onSearch?.(''); }}
                  className="w-8 h-8 flex items-center justify-center text-shop-muted cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button type="submit" className="h-9 px-4 rounded-[7px] bg-shop-green text-white font-bold text-sm cursor-pointer">
                Search
              </button>
            </label>
          </form>
        </div>
      </div>

      {/* Department bar (desktop) */}
      <nav aria-label="Departments" className="hidden lg:block border-b border-dashed border-shop-dash bg-shop-paper">
        <div className="max-w-[1320px] mx-auto px-6 flex items-center gap-0.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex items-center gap-2 py-3 pr-4 mr-1.5 font-extrabold text-sm text-shop-green whitespace-nowrap cursor-pointer"
          >
            <HandMenu />
            All departments
          </button>
          {NAV_SLUGS.map((n) => (
            <button
              key={n.slug}
              type="button"
              onClick={() => selectCategory(n.slug)}
              className={`py-3 px-2.5 font-semibold text-sm whitespace-nowrap cursor-pointer ${
                selectedCategory === n.slug ? 'text-shop-green underline decoration-2 underline-offset-[6px]' : 'text-[#2F3A34] hover:text-shop-green'
              }`}
            >
              {n.label}
            </button>
          ))}
          {hasOffers && (
          <button
            type="button"
            onClick={() => document.getElementById('offers-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="ml-auto offer-stamp text-[13px] whitespace-nowrap cursor-pointer"
            style={{ transform: 'rotate(-2deg)' }}
          >
            This week&apos;s offers
          </button>
          )}
        </div>
      </nav>

      {/* All departments drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="All departments">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/40 cursor-default" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[86%] max-w-sm bg-shop-paper shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-shop-line">
              <span className="font-extrabold text-lg text-shop-green">All departments</span>
              <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} className="w-11 h-11 flex items-center justify-center cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="px-5 pt-3 font-hand text-xl text-shop-brown">23 aisles, just like the shop</p>
            <ul className="p-3">
              <li>
                <button type="button" onClick={() => selectCategory(null)} className="w-full text-left px-3 py-3 rounded-lg font-semibold text-shop-ink hover:bg-white cursor-pointer">
                  All groceries
                </button>
              </li>
              {CATEGORIES.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => selectCategory(c.slug)}
                    className={`w-full text-left px-3 py-3 rounded-lg font-semibold hover:bg-white cursor-pointer ${selectedCategory === c.slug ? 'text-shop-green bg-white' : 'text-shop-ink'}`}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
            <div className="m-4 p-4 rounded-xl bg-white border border-shop-line space-y-2 text-sm">
              <button type="button" onClick={() => { setMenuOpen(false); onOpenPostcodeModal?.(); }} className="font-semibold text-shop-green cursor-pointer">
                Deliver to {currentPostcode} · change
              </button>
              <button type="button" onClick={() => { setMenuOpen(false); setIsWhatsAppModalOpen(true); }} className="flex items-center gap-2 font-semibold text-shop-ink cursor-pointer">
                <HandWhatsApp size={20} className="text-shop-green" /> Send your list on WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      <WhatsAppOrderModal isOpen={isWhatsAppModalOpen} onClose={() => setIsWhatsAppModalOpen(false)} />
    </header>
  );
};
