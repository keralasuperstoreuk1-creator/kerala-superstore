'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Tag, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  X, 
  Calendar, 
  Percent, 
  PoundSterling,
  AlertCircle,
  Copy,
  Check,
  Search,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { useStoreConfig } from '@/context/StoreConfigContext';
import { Coupon } from '@/types';

export default function AdminCouponsPage() {
  const { coupons, addCoupon, updateCoupon, deleteCoupon } = useStoreConfig();

  const [isAdding, setIsAdding] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 10,
    minSpend: 30.00,
    maxDiscount: 15.00,
    expiresAt: '',
    isActive: true,
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) return;

    addCoupon({
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minSpend: Number(form.minSpend) || 0,
      maxDiscount: form.discountType === 'percentage' ? Number(form.maxDiscount) : undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      isActive: form.isActive,
    });

    setIsAdding(false);
    setForm({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 10,
      minSpend: 30.00,
      maxDiscount: 15.00,
      expiresAt: '',
      isActive: true,
    });
    showToast('Promo coupon created successfully!');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;

    updateCoupon(editingCoupon.id, editingCoupon);
    setEditingCoupon(null);
    showToast('Coupon details updated!');
  };

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Promo Codes &amp; Discount Coupons
            </h1>
            <p className="text-xs text-slate-500">
              Create and manage promotional discount codes for checkout discounts across the UK.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Coupon</span>
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
          placeholder="Search active coupons by code or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 outline-none font-medium bg-transparent"
        />
      </div>

      {/* Add Coupon Modal Form */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Tag className="w-5 h-5 text-emerald-700" />
                <span>Create New Promo Code</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ONAM10, M9LOCAL"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase font-black text-sm outline-none focus:border-emerald-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Discount Type *</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="percentage">Percentage (%) Off</option>
                    <option value="fixed">Fixed (£ GBP) Off</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {form.discountType === 'percentage' ? 'Discount Percentage (%) *' : 'Discount Amount (£) *'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold outline-none focus:border-emerald-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Minimum Spend (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.minSpend}
                    onChange={(e) => setForm({ ...form, minSpend: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold outline-none focus:border-emerald-600 bg-white"
                  />
                </div>

                {form.discountType === 'percentage' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Max Cap Limit (£)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.maxDiscount}
                      onChange={(e) => setForm({ ...form, maxDiscount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold outline-none focus:border-emerald-600 bg-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium outline-none focus:border-emerald-600 bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Customer Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10% off for all Manchester local orders over £30"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium outline-none focus:border-emerald-600 bg-white"
                  />
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
                  Save &amp; Activate Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Coupon Modal */}
      {editingCoupon && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Edit2 className="w-5 h-5 text-emerald-700" />
                <span>Edit Coupon: {editingCoupon.code}</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingCoupon(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Code</label>
                  <input
                    type="text"
                    value={editingCoupon.code}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase font-black bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Discount Value</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingCoupon.discountValue}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, discountValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Spend (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingCoupon.minSpend || 0}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, minSpend: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={editingCoupon.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, isActive: e.target.value === 'active' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-white"
                  >
                    <option value="active">Active (Usable)</option>
                    <option value="inactive">Disabled</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={editingCoupon.description}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCoupon(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupons List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCoupons.map((coupon) => (
          <div
            key={coupon.id}
            className={`p-5 rounded-3xl border transition-all space-y-3 ${
              coupon.isActive
                ? 'bg-white border-slate-200 shadow-2xs hover:shadow-md'
                : 'bg-slate-50 border-slate-200/80 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-base text-slate-900 px-3 py-1 bg-amber-100/70 border border-amber-300 rounded-xl">
                    {coupon.code}
                  </span>
                  <button
                    onClick={() => handleCopy(coupon.code)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
                    title="Copy Code"
                  >
                    {copiedCode === coupon.code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  {coupon.isActive ? (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  ) : (
                    <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Disabled
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 font-medium pt-1">
                  {coupon.description}
                </p>
              </div>

              {/* Discount Badge */}
              <div className="text-right">
                <div className="text-lg font-black text-emerald-800">
                  {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `£${coupon.discountValue.toFixed(2)} OFF`}
                </div>
                {coupon.minSpend && (
                  <div className="text-[10px] text-slate-400 font-bold">
                    Min spend: £{coupon.minSpend.toFixed(2)}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom stats and action bar */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="text-[11px] text-slate-500">
                Used: <strong className="text-slate-800">{coupon.usageCount} times</strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateCoupon(coupon.id, { isActive: !coupon.isActive })}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                >
                  {coupon.isActive ? 'Disable' : 'Enable'}
                </button>

                <button
                  type="button"
                  onClick={() => setEditingCoupon(coupon)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                  title="Edit Coupon"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => deleteCoupon(coupon.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                  title="Delete Coupon"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
