'use client';

import React, { useState } from 'react';
import { 
  X, 
  MessageSquare, 
  Camera, 
  FileText, 
  Mic, 
  Send, 
  Plus, 
  Sparkles, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  ShieldCheck,
  ShoppingBag
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/WhatsAppButton';

interface WhatsAppOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialItems?: string;
}

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
  'Fresh Coconut (2 nos)'
];

export const WhatsAppOrderModal: React.FC<WhatsAppOrderModalProps> = ({
  isOpen,
  onClose,
  initialItems = ''
}) => {
  const [activeTab, setActiveTab] = useState<'type' | 'photo' | 'voice'>('type');
  const [typedList, setTypedList] = useState(initialItems);
  const [customerName, setCustomerName] = useState('');
  const [customerPostcode, setCustomerPostcode] = useState('');

  if (!isOpen) return null;

  const handleAddQuickItem = (item: string) => {
    setTypedList((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return `• ${item}`;
      return `${trimmed}\n• ${item}`;
    });
  };

  const handleSendTypedList = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanList = typedList.trim();
    if (!cleanList) return;

    let message = `🛒 *Kerala Superstore UK — Shopping List Order*\n\n`;
    if (customerName.trim()) {
      message += `👤 *Customer:* ${customerName.trim()}\n`;
    }
    if (customerPostcode.trim()) {
      message += `📍 *Postcode:* ${customerPostcode.trim().toUpperCase()}\n`;
    }
    message += `\n📋 *Shopping List:*\n${cleanList}\n\n`;
    message += `_Please let me know the total price and delivery schedule. Thank you!_`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/447749132122?text=${encoded}`, '_blank');
    onClose();
  };

  const handleSendPhotoPrompt = () => {
    const text = encodeURIComponent(
      `Hello Kerala Superstore Manchester! 📸 I want to place a grocery order. Sending a photo of my handwritten shopping list now. My Postcode is: ${customerPostcode.trim() || '[Please add postcode]'}`
    );
    window.open(`https://wa.me/447749132122?text=${text}`, '_blank');
    onClose();
  };

  const handleSendVoicePrompt = () => {
    const text = encodeURIComponent(
      `Hello Kerala Superstore Manchester! 🎙️ I would like to place an order by Voice Note / Direct message. Could you please assist me?`
    );
    window.open(`https://wa.me/447749132122?text=${text}`, '_blank');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-5 sm:p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/30 text-white transition-all"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white shadow-inner">
              <WhatsAppIcon className="w-7 h-7 text-white fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">WhatsApp Quick Order</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                  Easy Buy
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100 mt-0.5 font-medium">
                ലിസ്റ്റ് പേപ്പറിൽ എഴുതി ഫോട്ടോ അയക്കുകയോ, ഇവിടെ ടൈപ്പ് ചെയ്യുകയോ ചെയ്യാം!
              </p>
            </div>
          </div>

          {/* Quick Tabs */}
          <div className="grid grid-cols-3 gap-2 mt-5 p-1 bg-black/20 rounded-2xl backdrop-blur-md">
            <button
              type="button"
              onClick={() => setActiveTab('type')}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'type'
                  ? 'bg-white text-emerald-900 shadow-md scale-[1.02]'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>✍️ ടൈപ്പ് ചെയ്യുക</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('photo')}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'photo'
                  ? 'bg-white text-emerald-900 shadow-md scale-[1.02]'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>📸 ഫോട്ടോ അയക്കൂ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('voice')}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'voice'
                  ? 'bg-white text-emerald-900 shadow-md scale-[1.02]'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>🎙️ വോയ്‌സ് നോട്ട്</span>
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {activeTab === 'type' && (
            <form onSubmit={handleSendTypedList} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                    നിങ്ങളുടെ ഷോപ്പിംഗ് ലിസ്റ്റ് ഇവിടെ എഴുതുക / പേസ്റ്റ് ചെയ്യുക:
                  </label>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Malayalam & English OK
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={typedList}
                  onChange={(e) => setTypedList(e.target.value)}
                  placeholder={`ഉദാഹരണത്തിന്:\n1. Kerala Matta Rice 5kg - 1 bag\n2. KPL Coconut Oil 1L - 1 bottle\n3. Eastern Sambar Powder 200g\n4. Nirapara Puttu Podi 1kg\n5. Kerala Banana Chips 250g`}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans leading-relaxed resize-none"
                  required
                />
              </div>

              {/* Quick staple item pills */}
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  ക്ലിക്ക് ചെയ്ത് എളുപ്പത്തിൽ ആഡ് ചെയ്യാം (Quick Staples):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_QUICK_ITEMS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleAddQuickItem(item)}
                      className="px-2.5 py-1 text-xs rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-all flex items-center gap-1 font-medium"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{item}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer details for quick dispatch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    നിങ്ങളുടെ പേര് (Your Name):
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Thomas Mathew"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    UK പോസ്റ്റ്കോഡ് (Postcode):
                  </label>
                  <input
                    type="text"
                    value={customerPostcode}
                    onChange={(e) => setCustomerPostcode(e.target.value)}
                    placeholder="e.g. M14 5TP"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.99] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <WhatsAppIcon className="w-5 h-5 fill-current text-white" />
                <span>വാട്സാപ്പിൽ ഓർഡർ അയക്കൂ (Send to +44 7749 132122)</span>
                <Send className="w-4 h-4 ml-1" />
              </button>
            </form>
          )}

          {activeTab === 'photo' && (
            <div className="space-y-5 py-2">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex gap-3.5 items-start">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  <p className="font-bold text-slate-900 dark:text-white mb-1">
                    പേപ്പറിൽ എഴുതിയ ലിസ്റ്റിന്റെ ഫോട്ടോ എടുത്ത് അയക്കാം:
                  </p>
                  <p>
                    1. നിങ്ങളുടെ ഡയറിയിലോ പേപ്പറിലോ ആവശ്യമായ സാധനങ്ങൾ എഴുതുക.
                  </p>
                  <p>
                    2. താഴെയുള്ള ബട്ടൺ ക്ലിക്ക് ചെയ്യുമ്പോൾ വാട്സാപ്പ് ചാറ്റ് ഓപ്പണാകും.
                  </p>
                  <p>
                    3. ലിസ്റ്റിന്റെ ഫോട്ടോ എടുത്ത് സെൻഡ് ചെയ്യുക. ബാക്കി കാര്യങ്ങൾ ഞങ്ങളുടെ ടീം നോക്കിക്കോളും!
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  നിങ്ങളുടെ UK പോസ്റ്റ്കോഡ് (ഓപ്ഷണൽ):
                </label>
                <input
                  type="text"
                  value={customerPostcode}
                  onChange={(e) => setCustomerPostcode(e.target.value)}
                  placeholder="e.g. M14 5TP"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={handleSendPhotoPrompt}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.99] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Camera className="w-5 h-5" />
                <span>📸 Open WhatsApp to Send Photo</span>
              </button>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="space-y-5 py-2">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex gap-3.5 items-start">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Mic className="w-5 h-5" />
                </div>
                <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  <p className="font-bold text-slate-900 dark:text-white mb-1">
                    ടൈപ്പ് ചെയ്യാൻ ബുദ്ധിമുട്ടാണോ? വോയ്‌സ് നോട്ടായി പറയൂ!
                  </p>
                  <p>
                    വാട്സാപ്പിൽ നിങ്ങൾക്ക് മലയാളത്തിലോ ഇംഗ്ലീഷിലോ വോയ്‌സ് മെസ്സേജ് അയക്കാം. ഞങ്ങളുടെ സ്റ്റാഫ് സാധനങ്ങൾ റെഡിയാക്കി തുക അറിയിക്കും.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendVoicePrompt}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.99] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Mic className="w-5 h-5" />
                <span>🎙️ Send Voice Note on WhatsApp (+44 7749 132122)</span>
              </button>
            </div>
          )}

          {/* Trust Guarantees */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Same-Day Packing & Dispatch</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>UK Wide DPD Courier / Collect</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
