'use client';

import React, { useEffect, useState } from 'react';
import { X, Check } from 'lucide-react';
import { useStoreConfig } from '@/context/StoreConfigContext';
import { DeliveryZone } from '@/types';
import { HandVan } from '@/components/home/HandIcons';

interface PostcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePostcode: (postcode: string) => void;
  currentPostcode: string;
}

export const PostcodeModal: React.FC<PostcodeModalProps> = ({ isOpen, onClose, onSavePostcode, currentPostcode }) => {
  const { config, getDeliveryZoneForPostcode } = useStoreConfig();
  const [inputVal, setInputVal] = useState(currentPostcode || '');
  const [matchedZone, setMatchedZone] = useState<DeliveryZone | null>(null);

  // Reset each time the popup opens.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setInputVal(currentPostcode || '');
      setMatchedZone(null);
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Rates come from the zones set in Admin → Settings, so this list never goes stale.
  const zones = config.deliveryZones.filter((z) => z.enabled);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputVal.toUpperCase().trim();
    if (!clean) return;
    setMatchedZone(getDeliveryZoneForPostcode(clean) || null);
    onSavePostcode(clean);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-label="Check delivery to your postcode">
      <div className="absolute inset-0 bg-[#1E2420]/55" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full sm:max-w-md bg-shop-cream text-shop-ink rounded-t-[18px] sm:rounded-[14px] p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] flex flex-col gap-4 shadow-[0_10px_40px_rgba(30,36,32,0.25)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white border border-shop-line flex items-center justify-center cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pr-10">
          <HandVan size={40} className="text-shop-green shrink-0" />
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">Do we deliver to you?</h2>
            <p className="font-hand text-xl text-shop-brown leading-none">packed in Manchester, sent across the UK</p>
          </div>
        </div>

        <form onSubmit={handleCheck}>
          <label htmlFor="pc-input" className="block text-[13px] font-bold mb-1">Your postcode</label>
          <div className="flex gap-2">
            <input
              id="pc-input"
              type="text"
              autoComplete="postal-code"
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                setMatchedZone(null);
              }}
              placeholder="e.g. M9 8DX"
              className="flex-1 min-w-0 h-12 px-3.5 rounded-[10px] border border-shop-line bg-white uppercase font-bold text-base outline-none focus:border-shop-green focus:ring-2 focus:ring-shop-green/15"
              required
            />
            <button type="submit" className="h-12 px-5 rounded-[10px] bg-shop-yellow text-shop-ink font-extrabold cursor-pointer shrink-0">
              Check
            </button>
          </div>
        </form>

        {matchedZone && (
          <div className="p-4 rounded-[10px] bg-white border border-shop-green" aria-live="polite">
            <div className="flex items-center gap-2 font-extrabold text-shop-green">
              <Check className="w-5 h-5" strokeWidth={3} />
              Yes, we deliver to {inputVal.toUpperCase().trim()}
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-shop-muted text-xs">Area</dt>
                <dd className="font-bold">{matchedZone.name}</dd>
              </div>
              <div>
                <dt className="text-shop-muted text-xs">Delivery</dt>
                <dd className="font-bold">£{matchedZone.charge.toFixed(2)}</dd>
              </div>
              <div>
                <dt className="text-shop-muted text-xs">Free delivery</dt>
                <dd className="font-bold">over £{matchedZone.freeThreshold.toFixed(0)}</dd>
              </div>
              {matchedZone.estimatedTime && (
                <div>
                  <dt className="text-shop-muted text-xs">Usually arrives</dt>
                  <dd className="font-bold">{matchedZone.estimatedTime}</dd>
                </div>
              )}
            </dl>
            <button type="button" onClick={onClose} className="mt-4 w-full h-11 rounded-[10px] bg-shop-green text-white font-extrabold cursor-pointer">
              Carry on shopping
            </button>
          </div>
        )}

        {!matchedZone && zones.length > 0 && (
          <ul className="p-3.5 rounded-[10px] bg-shop-paper border border-dashed border-shop-dash text-sm flex flex-col gap-1.5">
            {zones.map((z) => (
              <li key={z.id} className="flex items-baseline justify-between gap-3">
                <span className="text-shop-muted">{z.name}</span>
                <span className="font-bold whitespace-nowrap">
                  £{z.charge.toFixed(2)} <span className="font-normal text-shop-muted">· free over £{z.freeThreshold.toFixed(0)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-shop-muted">Pay cash on delivery, or collect from Unit 2, 73 Old Market Street, Manchester M9 8DX.</p>
      </div>
    </div>
  );
};
