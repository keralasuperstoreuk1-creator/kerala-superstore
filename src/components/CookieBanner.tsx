'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';

export const CookieBanner: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('kss_cookie_consent');
      if (!consent) {
        setShow(true);
      }
    } catch {
      // Fallback
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem('kss_cookie_consent', 'accepted');
    } catch {
      // Fallback
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-6 sm:max-w-md bg-white border border-slate-200 rounded-2xl p-4 shadow-2xl z-50 text-xs text-slate-700 space-y-3">
      <div className="flex items-start gap-2.5">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-bold text-slate-900">UK Privacy &amp; Cookie Consent</h4>
          <p className="mt-1 text-slate-500 leading-relaxed text-[11px]">
            We use cookies to give you the best shopping experience for your authentic Kerala groceries and to ensure secure checkout.
          </p>
        </div>
        <button onClick={() => setShow(false)} className="text-slate-400 hover:text-slate-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={accept}
          className="flex-1 py-2 px-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-xs"
        >
          Accept All Cookies
        </button>
        <button
          onClick={() => setShow(false)}
          className="py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-medium text-xs transition-all"
        >
          Essential Only
        </button>
      </div>
    </div>
  );
};
