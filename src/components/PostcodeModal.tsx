'use client';

import React, { useState } from 'react';
import { X, MapPin, CheckCircle2, Truck, Clock } from 'lucide-react';
import { useStoreConfig } from '@/context/StoreConfigContext';

interface PostcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePostcode: (postcode: string) => void;
  currentPostcode: string;
}

export const PostcodeModal: React.FC<PostcodeModalProps> = ({
  isOpen,
  onClose,
  onSavePostcode,
  currentPostcode
}) => {
  const { getDeliveryZoneForPostcode } = useStoreConfig();
  const [inputVal, setInputVal] = useState(currentPostcode || 'M9 8PX');
  const [matchedZone, setMatchedZone] = useState<any>(null);

  if (!isOpen) return null;

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    const cleanPostcode = inputVal.toUpperCase().trim();
    const zone = getDeliveryZoneForPostcode(cleanPostcode);
    setMatchedZone(zone);
    setTimeout(() => {
      onSavePostcode(cleanPostcode);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl z-10 space-y-4 border border-slate-100 animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base text-slate-900">Check UK Delivery Rates</h3>
            <p className="text-xs text-slate-500">Area-based pricing for Manchester, Greater Manchester &amp; UK Nationwide</p>
          </div>
        </div>

        <form onSubmit={handleCheck} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Enter your UK Postcode:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value);
                  setMatchedZone(null);
                }}
                placeholder="e.g. M9 8PX, SK4 1AB, or SW1A 1AA"
                className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl uppercase font-bold text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                required
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                Check
              </button>
            </div>
          </div>

          {matchedZone && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-xs text-emerald-950 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Delivery Available to {inputVal.toUpperCase()}!</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="bg-white p-2 rounded-xl border border-emerald-100">
                  <span className="text-slate-500 block">Matched Area:</span>
                  <strong className="text-slate-900 truncate block">{matchedZone.name}</strong>
                </div>
                <div className="bg-white p-2 rounded-xl border border-emerald-100">
                  <span className="text-slate-500 block">Standard Fee:</span>
                  <strong className="text-emerald-800 block">£{matchedZone.charge.toFixed(2)}</strong>
                </div>
                <div className="bg-white p-2 rounded-xl border border-emerald-100">
                  <span className="text-slate-500 block">Free Delivery:</span>
                  <strong className="text-amber-800 block">Orders over £{matchedZone.freeThreshold.toFixed(0)}</strong>
                </div>
                <div className="bg-white p-2 rounded-xl border border-emerald-100">
                  <span className="text-slate-500 block">Estimated Time:</span>
                  <strong className="text-slate-800 block">{matchedZone.estimatedTime}</strong>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Quick Area Samples */}
        <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
          <div className="flex items-center justify-between">
            <span>📍 Manchester Local (M1 - M9):</span>
            <span className="font-bold text-slate-800">£1.99 (Free over £30)</span>
          </div>
          <div className="flex items-center justify-between">
            <span>📍 Greater Manchester (SK, WA, BL):</span>
            <span className="font-bold text-slate-800">£3.49 (Free over £45)</span>
          </div>
          <div className="flex items-center justify-between">
            <span>📍 UK Mainland Nationwide:</span>
            <span className="font-bold text-slate-800">£4.99 (Free over £50)</span>
          </div>
        </div>

        <div className="pt-1 flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <span className="flex items-center gap-1 font-semibold text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Cash on Delivery Available
          </span>
          <span className="text-[10px] text-slate-400">4 Wallbrook Dr, Manchester</span>
        </div>
      </div>
    </div>
  );
};
