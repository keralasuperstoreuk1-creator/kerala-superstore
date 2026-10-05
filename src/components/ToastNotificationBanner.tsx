'use client';

import React, { useEffect } from 'react';
import { useSpecialsNotification } from '@/context/SpecialsNotificationContext';
import { Bell, X, ArrowRight } from 'lucide-react';

export const ToastNotificationBanner: React.FC = () => {
  const { activeToast, dismissToast, setIsNotificationModalOpen } = useSpecialsNotification();

  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        dismissToast();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [activeToast, dismissToast]);

  if (!activeToast) return null;

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 z-9999 max-w-md animate-in slide-in-from-top-4 duration-300">
      <div 
        onClick={() => {
          setIsNotificationModalOpen(true);
          dismissToast();
        }}
        className="bg-slate-950/95 backdrop-blur-md text-white border-2 border-amber-400/80 p-4 rounded-2xl shadow-2xl flex items-start gap-3 cursor-pointer group hover:border-amber-300 transition-all ring-4 ring-amber-400/20"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 text-white flex items-center justify-center text-xl shrink-0 shadow-md animate-bounce">
          🍲
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span>Special Kitchen Alert</span>
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismissToast();
              }}
              className="text-slate-400 hover:text-white p-1 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <h4 className="font-black text-xs text-white leading-tight">
            {activeToast.title}
          </h4>

          <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
            {activeToast.message}
          </p>

          <div className="pt-1 flex items-center gap-1 text-[10px] font-bold text-amber-300 group-hover:text-amber-200">
            <span>Tap to View Details &amp; Pre-Order</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};
