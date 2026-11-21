'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { useSpecialsNotification } from '@/context/SpecialsNotificationContext';
import { HandBasket, HandHome, HandMenu, HandWhatsApp } from '@/components/home/HandIcons';

interface MobileBottomNavProps {
  onOpenCategories: () => void;
  onGoHome: () => void;
  onWhatsApp: () => void;
  /** Kept for older callers; the menu no longer has a Deals tab. */
  onOpenDeals?: () => void;
}

const Bell = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6.2 16.6c.6-1.3.8-2.6.8-4.1 0-2.9 2.2-5.4 5-5.4s5 2.4 5.1 5.3c0 1.5.2 2.9.9 4.2-4 .3-7.9.3-11.8 0z" />
    <path d="M10.2 19.2c.4.8 1 1.2 1.8 1.2s1.4-.4 1.8-1.2M12 4.3v1.2" />
  </svg>
);

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenCategories, onGoHome, onWhatsApp }) => {
  const { totalItems, subtotal, setIsCartOpen } = useCart();
  const { unreadCount, setIsNotificationModalOpen } = useSpecialsNotification();

  const item = 'flex flex-col items-center justify-center gap-0.5 min-h-[56px] text-[11px] cursor-pointer';

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)] bg-shop-paper border-t border-shop-line">
      <nav aria-label="Main" className="grid grid-cols-5">
        <button type="button" onClick={onGoHome} className={`${item} font-extrabold text-shop-green`}>
          <HandHome />
          Home
        </button>

        <button type="button" onClick={onOpenCategories} className={`${item} text-[#4F5853]`}>
          <HandMenu size={24} strokeWidth={1.8} />
          Departments
        </button>

        <button type="button" onClick={onWhatsApp} className={`${item} text-[#4F5853]`}>
          <HandWhatsApp size={24} className="text-shop-green" />
          WhatsApp
        </button>

        <button type="button" onClick={() => setIsNotificationModalOpen(true)} className={`${item} text-[#4F5853]`}>
          <span className="relative">
            <Bell />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-shop-red text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </span>
          Specials
        </button>

        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          aria-label={`Basket, ${totalItems} items, £${subtotal.toFixed(2)}`}
          className={`${item} font-extrabold text-shop-ink`}
        >
          <span className="relative flex items-center justify-center min-w-[52px] h-7 px-2 rounded-full bg-shop-yellow">
            {totalItems > 0 ? `£${subtotal.toFixed(2)}` : <HandBasket size={20} />}
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-shop-green text-white text-[10px] font-bold flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </span>
          Basket
        </button>
      </nav>
    </div>
  );
};
