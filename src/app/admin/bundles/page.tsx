'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Package, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  X, 
  Camera, 
  Sparkles, 
  ShoppingBag, 
  Check, 
  Search, 
  RotateCcw,
  Eye,
  Tag
} from 'lucide-react';
import { useStoreConfig } from '@/context/StoreConfigContext';
import { ComboBundle, BundleItem } from '@/types';
import AiImageStudioUpload from '@/components/admin/AiImageStudioUpload';

export default function AdminBundlesPage() {
  const { bundles, addBundle, updateBundle, deleteBundle } = useStoreConfig();

  const [isAdding, setIsAdding] = useState(false);
  const [editingBundle, setEditingBundle] = useState<ComboBundle | null>(null);
  const [photoEditBundle, setPhotoEditBundle] = useState<{ id: string; title: string; imageUrl: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // New Bundle Form State
  const [form, setForm] = useState<{
    title: string;
    subtitle: string;
    badge: string;
    description: string;
    bundlePrice: number;
    imageUrl: string;
    isActive: boolean;
    isPopular: boolean;
    items: BundleItem[];
  }>({
    title: '',
    subtitle: '',
    badge: '🌟 Special Value Combo',
    description: '',
    bundlePrice: 24.99,
    imageUrl: '/branding/kerala-grocery-basket.jpg',
    isActive: true,
    isPopular: false,
    items: [
      { name: 'Palakkadan Matta Rice', quantity: '5 kg', originalPrice: 10.99 },
      { name: 'Pure Coconut Oil', quantity: '1 Litre', originalPrice: 5.49 },
      { name: 'Kerala Banana Chips', quantity: '500g', originalPrice: 4.99 },
    ],
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleAddItemToForm = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: '1 Pack', originalPrice: 3.99 }],
    }));
  };

  const handleRemoveItemFromForm = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const handleItemChange = (idx: number, field: keyof BundleItem, val: string | number) => {
    setForm((prev) => {
      const copy = [...prev.items];
      copy[idx] = { ...copy[idx], [field]: val };
      return { ...prev, items: copy };
    });
  };

  const calculateRegularPrice = (items: BundleItem[]) => {
    return items.reduce((sum, item) => sum + (Number(item.originalPrice) || 0), 0);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || form.items.length === 0) return;

    const regularTotal = calculateRegularPrice(form.items);
    const savings = regularTotal - form.bundlePrice;
    const savingsText = savings > 0 ? `Save £${savings.toFixed(2)} (${Math.round((savings / regularTotal) * 100)}% OFF)` : undefined;

    addBundle({
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      badge: form.badge.trim() || 'VALUE COMBO',
      description: form.description.trim(),
      items: form.items.filter((i) => i.name.trim()),
      regularPrice: Number(regularTotal.toFixed(2)),
      bundlePrice: Number(form.bundlePrice),
      savingsText,
      imageUrl: form.imageUrl,
      isActive: form.isActive,
      isPopular: form.isPopular,
    });

    setIsAdding(false);
    showToast('Combo bundle kit created successfully!');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBundle) return;

    const regularTotal = calculateRegularPrice(editingBundle.items);
    const savings = regularTotal - editingBundle.bundlePrice;
    const savingsText = savings > 0 ? `Save £${savings.toFixed(2)} (${Math.round((savings / regularTotal) * 100)}% OFF)` : undefined;

    updateBundle(editingBundle.id, {
      ...editingBundle,
      regularPrice: Number(regularTotal.toFixed(2)),
      savingsText,
    });
    setEditingBundle(null);
    showToast('Bundle kit updated successfully!');
  };

  const filteredBundles = bundles.filter(
    (b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Pre-packed Combo Bundles &amp; Grocery Kits
            </h1>
            <p className="text-xs text-slate-500">
              Create high-value kits (Onam Sadya, Student Starter, Tea-Time Snacks) to increase average order basket size.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Combo Kit</span>
        </button>
      </div>

      {/* Global Toast */}
      {toastMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2.5 text-xs font-bold shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 text-xs">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search combo bundles by title or items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 outline-none font-medium bg-transparent"
        />
      </div>

      {/* Create Modal Form */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Package className="w-5 h-5 text-emerald-700" />
                <span>Create New Pre-packed Grocery Kit</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kit Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Onam &amp; Vishu Mahasadya Feast Kit"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. 🌾 Bestseller Festival Kit"
                    value={form.badge}
                    onChange={(e) => setForm({ ...form, badge: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Subtitle</label>
                  <input
                    type="text"
                    placeholder="e.g. Complete authentic 24-dish Sadhya essentials in one curated box"
                    value={form.subtitle}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bundle Offer Price (£) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.bundlePrice}
                    onChange={(e) => setForm({ ...form, bundlePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black text-emerald-800 bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <AiImageStudioUpload
                    currentImageUrl={form.imageUrl}
                    onImageChange={(newUrl) => setForm({ ...form, imageUrl: newUrl })}
                    title="Combo Kit Photo (AI Studio)"
                    subtitle="Auto-run AI background removal with Studio Packshot (#FFF) or Cutout (PNG)"
                    compact
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Details about items included and preparation tips"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium bg-white"
                  />
                </div>
              </div>

              {/* Items in this kit */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">Items Included in this Combo Kit</span>
                    <span className="text-[11px] text-slate-500">
                      Regular Value Total: <strong>£{calculateRegularPrice(form.items).toFixed(2)}</strong> (Customer saves £{(calculateRegularPrice(form.items) - form.bundlePrice).toFixed(2)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItemToForm}
                    className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                      <input
                        type="text"
                        placeholder="Item name (e.g. Matta Rice)"
                        value={item.name}
                        onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium"
                      />
                      <input
                        type="text"
                        placeholder="Qty / Weight (e.g. 5kg)"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-24 px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="£ Price"
                        value={item.originalPrice}
                        onChange={(e) => handleItemChange(idx, 'originalPrice', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold"
                      />
                      {form.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemFromForm(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Publish Combo Kit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bundles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBundles.map((bundle) => (
          <div
            key={bundle.id}
            className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              {/* Image Preview & Badge */}
              <div className="relative h-44 w-full bg-slate-100 border-b border-slate-100 flex items-center justify-center p-3">
                <div className="relative w-full h-full">
                  <Image
                    src={bundle.imageUrl}
                    alt={bundle.title}
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>

                <div className="absolute top-3 left-3">
                  <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full shadow-xs">
                    {bundle.badge}
                  </span>
                </div>

                {bundle.savingsText && (
                  <div className="absolute bottom-3 right-3">
                    <span className="bg-rose-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-xs">
                      {bundle.savingsText}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 space-y-3 text-xs">
                <div>
                  <h3 className="font-black text-sm text-slate-900 leading-tight">
                    {bundle.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{bundle.subtitle}</p>
                </div>

                {/* Items checklist */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-[11px]">
                  <span className="font-bold text-slate-700 block">Contains ({bundle.items.length} items):</span>
                  <div className="space-y-1">
                    {bundle.items.slice(0, 4).map((i, idx) => (
                      <div key={idx} className="flex justify-between text-slate-600">
                        <span>• {i.name} ({i.quantity})</span>
                        <span className="text-slate-400">£{i.originalPrice.toFixed(2)}</span>
                      </div>
                    ))}
                    {bundle.items.length > 4 && (
                      <div className="text-[10px] font-bold text-emerald-700">
                        + {bundle.items.length - 4} more items...
                      </div>
                    )}
                  </div>
                </div>

                {/* Price info */}
                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-[11px] text-slate-400 line-through mr-1.5">
                      £{bundle.regularPrice.toFixed(2)}
                    </span>
                    <span className="text-lg font-black text-emerald-800">
                      £{bundle.bundlePrice.toFixed(2)}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    bundle.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {bundle.isActive ? 'Live on Store' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateBundle(bundle.id, { isActive: !bundle.isActive })}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 hover:bg-white text-slate-700 cursor-pointer"
                >
                  {bundle.isActive ? 'Disable' : 'Enable'}
                </button>

                <button
                  type="button"
                  onClick={() => setPhotoEditBundle({ id: bundle.id, title: bundle.title, imageUrl: bundle.imageUrl })}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-amber-200 hover:border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Update Photo with AI Studio"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>AI Photo</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => deleteBundle(bundle.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                title="Delete Bundle"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* UPDATE COMBO KIT PHOTO MODAL */}
      {photoEditBundle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900">
                    Update Combo Kit Photo
                  </h3>
                  <p className="text-xs text-slate-500">{photoEditBundle.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPhotoEditBundle(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <AiImageStudioUpload
              currentImageUrl={photoEditBundle.imageUrl}
              onImageChange={(newUrl) => {
                setPhotoEditBundle((prev) => prev ? { ...prev, imageUrl: newUrl } : null);
              }}
              title="Kit Visual (AI Studio)"
              subtitle="Auto-run AI background removal with Studio Packshot (#FFF) or Cutout (PNG)"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPhotoEditBundle(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  updateBundle(photoEditBundle.id, { imageUrl: photoEditBundle.imageUrl });
                  setToastMsg(`Updated photo for "${photoEditBundle.title}"`);
                  setPhotoEditBundle(null);
                }}
                className="px-5 py-2 text-xs font-black text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Save Kit Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
