'use client';

import React, { useEffect, useState } from 'react';
import { X, Camera, Mic } from 'lucide-react';
import { HandList, HandPlus, HandWhatsApp } from '@/components/home/HandIcons';

interface WhatsAppOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialItems?: string;
}

const WHATSAPP_NUMBER = '447749132122';
const WHATSAPP_DISPLAY = '+44 7749 132122';

const POPULAR_QUICK_ITEMS = [
  'Palakkadan Matta Rice 5kg',
  'KPL Shudhi Coconut Oil 1L',
  'Nirapara Puttu Podi 1kg',
  'Eastern Sambar Powder 200g',
  'Kerala Banana Chips 250g',
  'AVT Premium Tea 500g',
  'Eastern Meat Masala 100g',
  'Brahmins Idli Podi 1kg',
  'Kadumanga Pickle 400g',
  'Fresh Coconut (2 nos)',
];

type Tab = 'type' | 'photo' | 'voice';

const TABS: { id: Tab; label: string; ml: string; icon: React.ReactNode }[] = [
  { id: 'type', label: 'Type it', ml: 'ടൈപ്പ് ചെയ്യുക', icon: <HandList size={20} /> },
  { id: 'photo', label: 'Photo', ml: 'ഫോട്ടോ', icon: <Camera className="w-5 h-5" /> },
  { id: 'voice', label: 'Voice note', ml: 'വോയ്‌സ്', icon: <Mic className="w-5 h-5" /> },
];

const inputClass =
  'w-full h-11 px-3 rounded-[9px] border border-shop-line bg-white text-[15px] text-shop-ink placeholder:text-[#9AA19C] outline-none focus:border-shop-green focus:ring-2 focus:ring-shop-green/15';

export const WhatsAppOrderModal: React.FC<WhatsAppOrderModalProps> = ({ isOpen, onClose, initialItems = '' }) => {
  const [activeTab, setActiveTab] = useState<Tab>('type');
  const [typedList, setTypedList] = useState(initialItems);
  const [customerName, setCustomerName] = useState('');
  const [customerPostcode, setCustomerPostcode] = useState('');

  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen && initialItems) setTypedList(initialItems);
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

  const openWhatsApp = (text: string) => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
    onClose();
  };

  const handleAddQuickItem = (item: string) => {
    setTypedList((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}\n• ${item}` : `• ${item}`;
    });
  };

  const postcodeLine = customerPostcode.trim() ? `Postcode: ${customerPostcode.trim().toUpperCase()}\n` : '';

  const handleSendTypedList = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanList = typedList.trim();
    if (!cleanList) return;
    const nameLine = customerName.trim() ? `Name: ${customerName.trim()}\n` : '';
    openWhatsApp(
      `Hello Kerala Superstore! Here is my shopping list:\n\n${cleanList}\n\n${nameLine}${postcodeLine}\nPlease let me know the total and delivery time. Thank you!`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-label="Order on WhatsApp">
      <div className="absolute inset-0 bg-[#1E2420]/55" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full sm:max-w-xl bg-shop-cream text-shop-ink rounded-t-[18px] sm:rounded-[14px] overflow-hidden flex flex-col max-h-[92vh] shadow-[0_10px_40px_rgba(30,36,32,0.25)]">
        {/* Header */}
        <div className="bg-shop-green text-white px-5 pt-5 pb-4 shrink-0">
          <div className="flex items-start gap-3">
            <HandWhatsApp size={38} className="text-shop-yellow shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Order on WhatsApp</h2>
              <p className="font-ml text-[13px] text-[#CFE3D6] mt-0.5 leading-relaxed">
                ലിസ്റ്റ് ടൈപ്പ് ചെയ്യാം, ഫോട്ടോ അയക്കാം, അല്ലെങ്കിൽ വോയ്‌സ് നോട്ട് ആയി പറയാം.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 -mt-1 -mr-1 rounded-[9px] flex items-center justify-center hover:bg-white/10 cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mt-4 p-1 rounded-[11px] bg-shop-green-dark" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={activeTab === t.id}
                onClick={() => setActiveTab(t.id)}
                className={`h-12 rounded-[9px] flex flex-col items-center justify-center leading-tight cursor-pointer transition-colors ${
                  activeTab === t.id ? 'bg-shop-cream text-shop-ink' : 'text-white/85 hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-1.5 text-sm font-bold">
                  {t.icon}
                  {t.label}
                </span>
                <span className="font-ml text-[10px] opacity-75">{t.ml}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4">
          {activeTab === 'type' && (
            <form onSubmit={handleSendTypedList} className="flex flex-col gap-4">
              <div>
                <label htmlFor="wa-list" className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-[13px] font-bold">Your shopping list</span>
                  <span className="font-hand text-lg text-shop-brown">Malayalam or English</span>
                </label>
                <textarea
                  id="wa-list"
                  rows={5}
                  value={typedList}
                  onChange={(e) => setTypedList(e.target.value)}
                  placeholder={'e.g.\nMatta rice 5kg × 1\nCoconut oil 1L × 2\nSambar powder 200g'}
                  className={`${inputClass} h-auto py-3 leading-relaxed resize-none`}
                  required
                />
              </div>

              <div>
                <p className="font-hand text-xl text-shop-green mb-1.5">tap to add the usuals</p>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_QUICK_ITEMS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleAddQuickItem(item)}
                      className="h-9 pl-2 pr-3 rounded-full border border-shop-line bg-white text-[13px] font-semibold flex items-center gap-1 cursor-pointer hover:border-shop-green"
                    >
                      <HandPlus size={14} className="text-shop-green" />
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="wa-name" className="block text-[13px] font-bold mb-1">
                    Your name <span className="font-normal text-shop-muted">(optional)</span>
                  </label>
                  <input id="wa-name" type="text" autoComplete="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g. Thomas Mathew" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="wa-postcode" className="block text-[13px] font-bold mb-1">
                    Postcode <span className="font-normal text-shop-muted">(optional)</span>
                  </label>
                  <input id="wa-postcode" type="text" autoComplete="postal-code" value={customerPostcode} onChange={(e) => setCustomerPostcode(e.target.value)} placeholder="e.g. M9 8DX" className={`${inputClass} uppercase`} />
                </div>
              </div>

              <button
                type="submit"
                disabled={!typedList.trim()}
                className="w-full h-12 rounded-[10px] bg-shop-green text-white font-extrabold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HandWhatsApp size={22} />
                Send list on WhatsApp
              </button>
            </form>
          )}

          {activeTab === 'photo' && (
            <>
              <ol className="p-4 rounded-[10px] bg-[#FFE9BE] text-[#2A1A05] text-sm flex flex-col gap-2 list-none">
                {[
                  ['Write your list on paper', 'പേപ്പറിൽ ലിസ്റ്റ് എഴുതുക'],
                  ['Tap the button below to open WhatsApp', 'താഴെയുള്ള ബട്ടൺ അമർത്തുക'],
                  ['Send us a photo of the list — we do the rest', 'ലിസ്റ്റിന്റെ ഫോട്ടോ അയക്കുക'],
                ].map(([en, ml], i) => (
                  <li key={en} className="flex gap-3">
                    <span className="font-hand text-2xl font-bold leading-none text-shop-brown w-4 shrink-0">{i + 1}</span>
                    <span>
                      <span className="font-bold block">{en}</span>
                      <span className="font-ml text-xs text-[#5A4220]">{ml}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <div>
                <label htmlFor="wa-postcode-photo" className="block text-[13px] font-bold mb-1">
                  Postcode <span className="font-normal text-shop-muted">(optional)</span>
                </label>
                <input id="wa-postcode-photo" type="text" autoComplete="postal-code" value={customerPostcode} onChange={(e) => setCustomerPostcode(e.target.value)} placeholder="e.g. M9 8DX" className={`${inputClass} uppercase`} />
              </div>
              <button
                type="button"
                onClick={() => openWhatsApp(`Hello Kerala Superstore! I'd like to order. I'm sending a photo of my shopping list now.\n${postcodeLine}`.trim())}
                className="w-full h-12 rounded-[10px] bg-shop-green text-white font-extrabold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Camera className="w-5 h-5" />
                Open WhatsApp to send the photo
              </button>
            </>
          )}

          {activeTab === 'voice' && (
            <>
              <div className="p-4 rounded-[10px] bg-shop-paper border border-dashed border-shop-dash text-sm">
                <p className="font-bold">Easier to just say it? Send a voice note.</p>
                <p className="font-ml text-[13px] text-shop-muted mt-1 leading-relaxed">
                  മലയാളത്തിലോ ഇംഗ്ലീഷിലോ വോയ്‌സ് മെസ്സേജ് അയക്കാം. ഞങ്ങൾ സാധനങ്ങൾ റെഡിയാക്കി തുക അറിയിക്കും.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openWhatsApp(`Hello Kerala Superstore! I'd like to order by voice note.`)}
                className="w-full h-12 rounded-[10px] bg-shop-green text-white font-extrabold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mic className="w-5 h-5" />
                Open WhatsApp for a voice note
              </button>
            </>
          )}

          <p className="text-xs text-shop-muted text-center">
            Goes to our shop WhatsApp, {WHATSAPP_DISPLAY}. We&apos;ll reply with the total.
          </p>
        </div>
      </div>
    </div>
  );
};
