'use client';

import React from 'react';
import { Home, Grid, Flame, ShoppingBag, ArrowRight, Bell } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useSpecialsNotification } from '@/context/SpecialsNotificationContext';

interface MobileBottomNavProps {
  onOpenCategories: () => void;
  onOpenDeals: () => void;
  onGoHome: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenCategories,
  onOpenDeals,
  onGoHome,
}) => {
  const { totalItems, subtotal, setIsCartOpen } = useCart();
  const { unreadCount, setIsNotificationModalOpen } = useSpecialsNotification();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 pointer-events-none pb-[env(safe-area-inset-bottom)]">
      {/* Modern Fixed App Bottom Navigation Bar */}
      <nav className="pointer-events-auto bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl px-2 py-1.5 flex items-center justify-around">
        {/* Home */}
        <button
          onClick={onGoHome}
          className="flex flex-col items-center justify-center py-1 px-2.5 text-slate-600 hover:text-emerald-800 active:scale-90 transition-all cursor-pointer"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Home</span>
        </button>

        {/* Departments */}
        <button
          onClick={onOpenCategories}
          className="flex flex-col items-center justify-center py-1 px-2.5 text-slate-600 hover:text-emerald-800 active:scale-90 transition-all cursor-pointer"
        >
          <Grid className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Aisles</span>
        </button>

        {/* Flash Deals */}
        <button
          onClick={onOpenDeals}
          className="flex flex-col items-center justify-center py-1 px-2.5 text-rose-600 hover:text-rose-700 active:scale-90 transition-all cursor-pointer relative"
        >
          <Flame className="w-5 h-5 fill-rose-600 animate-bounce" />
          <span className="text-[10px] font-black mt-0.5">Deals</span>
        </button>

        {/* Specials & Alerts */}
        <button
          onClick={() => setIsNotificationModalOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2.5 text-amber-700 hover:text-amber-800 active:scale-90 transition-all cursor-pointer relative"
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold mt-0.5">Specials</span>
        </button>

        {/* Basket */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2.5 text-emerald-800 hover:text-emerald-700 active:scale-90 transition-all cursor-pointer relative"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-amber-400 text-slate-950 font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] font-black mt-0.5">
            {totalItems > 0 ? `£${subtotal.toFixed(0)}` : 'Basket'}
          </span>
        </button>
      </nav>

    </div>
  );
};
