'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Truck, 
  ShieldCheck, 
  ArrowRight,
  ArrowLeft,
  Clock,
  Tag,
  Check,
  CheckCircle2
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useStoreConfig } from '@/context/StoreConfigContext';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    deliveryCharge,
    totalAmount,
    freeDeliveryThreshold,
    amountNeededForFreeDelivery
  } = useCart();

  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    postcode: '',
    notes: ''
  });

  const { config, validateCoupon } = useStoreConfig();
  const [placedOrderNumber, setPlacedOrderNumber] = useState('');
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number; message: string } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotalAmount = Math.max(0, subtotal - discountAmount + deliveryCharge);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    const res = validateCoupon(couponCodeInput, subtotal);
    if (res.isValid && res.coupon) {
      setAppliedCoupon({
        code: res.coupon.code,
        discountAmount: res.discountAmount,
        message: res.message,
      });
      setCouponCodeInput('');
    } else {
      setCouponError(res.message);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  // Close cart on Escape key press
  useEffect(() => {
    if (!isCartOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCartOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  const freeDeliveryProgress = Math.min(100, (subtotal / freeDeliveryThreshold) * 100);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const newOrderNum = `KSS-UK-${Math.floor(1000 + Math.random() * 9000)}`;
    setPlacedOrderNumber(newOrderNum);
    setCheckoutStep('success');
    clearCart();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop - Tap outside to close */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={() => setIsCartOpen(false)}
        aria-label="Close cart backdrop"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header with prominent Back & Close buttons */}
          <div className="p-3.5 sm:p-4 border-b border-emerald-900 flex items-center justify-between bg-emerald-950 text-white sticky top-0 z-20 shadow-md">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => {
                  if (checkoutStep === 'checkout') {
                    setCheckoutStep('cart');
                  } else {
                    setIsCartOpen(false);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 text-white font-black text-xs transition-all cursor-pointer shrink-0"
                aria-label="Go Back"
              >
                <ArrowLeft className="w-4 h-4 text-amber-300" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2 min-w-0">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                <h2 className="font-bold text-sm sm:text-base truncate">
                  {checkoutStep === 'cart' && 'Your Basket'}
                  {checkoutStep === 'checkout' && 'Cash on Delivery'}
                  {checkoutStep === 'success' && 'Order Placed!'}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsCartOpen(false);
                if (checkoutStep === 'success') setCheckoutStep('cart');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
              aria-label="Close basket"
              title="Close basket"
            >
              <span className="hidden sm:inline">Close</span>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Free Delivery Bar */}
          {checkoutStep !== 'success' && (
            <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-100 text-xs">
              <div className="flex items-center justify-between font-semibold text-emerald-900 mb-1">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-emerald-700" />
                  {amountNeededForFreeDelivery > 0 ? (
                    <>Add <strong className="text-amber-700">£{amountNeededForFreeDelivery.toFixed(2)}</strong> for FREE UK Delivery</>
                  ) : (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                      Congratulations! You unlocked FREE UK Delivery
                    </span>
                  )}
                </span>
                <span className="text-slate-500 font-bold">{freeDeliveryProgress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-emerald-200/80 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${freeDeliveryProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {checkoutStep === 'cart' && (
              <>
                {cart.length === 0 ? (
                  <div className="text-center py-16 space-y-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <p className="text-slate-500 font-medium">Your basket is currently empty.</p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="px-5 py-2 bg-emerald-800 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-all"
                    >
                      Browse Kerala Groceries
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => {
                      const itemPrice = item.product.offerPrice ?? item.product.price;
                      return (
                        <div
                          key={item.product.id}
                          className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition-all"
                        >
                          <div className="relative w-16 h-16 rounded-lg bg-white overflow-hidden border border-slate-200 shrink-0">
                            <Image
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              fill
                              className="object-contain p-1"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-xs text-slate-900 truncate">
                              {item.product.name}
                            </h4>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {item.product.sizeWeight} • {item.product.brand}
                            </div>
                            <div className="text-xs font-bold text-emerald-800 mt-1">
                              £{itemPrice.toFixed(2)}
                            </div>
                          </div>
                          
                          {/* Quantity Controls */}
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden">
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                className="p-1 hover:bg-slate-100 text-slate-600 transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-2 text-xs font-bold text-slate-800">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                className="p-1 hover:bg-slate-100 text-slate-600 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-slate-400 hover:text-red-500 text-[11px] transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Checkout Form */}
            {checkoutStep === 'checkout' && (
              <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-3 text-xs">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs">
                  <div className="font-bold flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-700" />
                    <span>Payment: Cash on Delivery (COD)</span>
                  </div>
                  <p className="mt-1 text-[11px] text-amber-800">
                    Pay in cash directly to our delivery courier when your fresh Kerala groceries arrive at your UK doorstep.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Thomas Mathew"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">UK Phone *</label>
                    <input
                      required
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="07700 900000"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email *</label>
                    <input
                      required
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="thomas@example.com"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Street Address *</label>
                  <input
                    required
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="House number, Street name"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">City / Town *</label>
                    <input
                      required
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="e.g. Croydon / London"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">UK Postcode *</label>
                    <input
                      required
                      name="postcode"
                      value={formData.postcode}
                      onChange={handleInputChange}
                      placeholder="e.g. CR0 1XX"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg uppercase focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Delivery Notes (Optional)</label>
                  <textarea
                    rows={2}
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="e.g. Leave with neighbour or ring flat 4B buzzer"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                  />
                </div>
              </form>
            )}

            {/* Success Step */}
            {checkoutStep === 'success' && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Thank You, {formData.name || 'Customer'}!</h3>
                  <p className="text-xs text-slate-600 mt-1">Your order has been received and is being prepared.</p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Order Reference:</span>
                    <span className="font-bold text-emerald-800">{placedOrderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Delivery To:</span>
                    <span className="font-medium text-slate-800 truncate max-w-[200px]">{formData.address}, {formData.postcode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment:</span>
                    <span className="font-bold text-amber-700">Cash on Delivery</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                    <span>Total Amount to Pay:</span>
                    <span className="text-emerald-800 text-sm">£{totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <a
                    href={`https://wa.me/447749132122?text=${encodeURIComponent(`Hello Kerala Superstore Manchester! I just placed order ${placedOrderNumber} for £${totalAmount.toFixed(2)} to ${formData.postcode}. Please confirm delivery dispatch.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <span>Confirm Order via WhatsApp</span>
                  </a>
                  <button
                    onClick={() => {
                      setCheckoutStep('cart');
                      setIsCartOpen(false);
                    }}
                    className="w-full py-2.5 px-4 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-all"
                  >
                    Back to Store
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Totals & Action */}
          {cart.length > 0 && checkoutStep !== 'success' && (
            <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
              {/* Promo Code Input / Applied Badge */}
              {(config.modules?.showPromoCoupons ?? true) && (
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2 rounded-lg text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                        <Tag className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Coupon &quot;{appliedCoupon.code}&quot; Applied (-£{appliedCoupon.discountAmount.toFixed(2)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="space-y-1">
                      <div className="flex gap-1.5">
                        <div className="relative flex-1">
                          <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Promo code (e.g. M9LOCAL, FIRSTORDER)"
                            value={couponCodeInput}
                            onChange={(e) => {
                              setCouponCodeInput(e.target.value.toUpperCase());
                              setCouponError(null);
                            }}
                            className="w-full pl-8 pr-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono uppercase font-bold outline-none focus:border-emerald-600"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                          Apply
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-[10px] text-rose-600 font-bold px-1">{couponError}</p>
                      )}
                    </form>
                  )}
                </div>
              )}

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">£{subtotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-£{appliedCoupon.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <span>UK Delivery Charge</span>
                    {deliveryCharge === 0 && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                        FREE
                      </span>
                    )}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {deliveryCharge === 0 ? '£0.00' : `£${deliveryCharge.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-slate-900">
                  <span>Total Amount</span>
                  <span className="text-emerald-800 text-base">£{finalTotalAmount.toFixed(2)}</span>
                </div>
              </div>

              {checkoutStep === 'cart' ? (
                <div className="space-y-2">
                  <button
                    onClick={() => setCheckoutStep('checkout')}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer active:scale-98"
                  >
                    <span>Proceed to UK Cash on Delivery Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="w-full py-2.5 px-4 text-center text-xs font-bold text-slate-700 hover:text-emerald-900 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-all cursor-pointer"
                  >
                    ← Continue Shopping (Back to Store)
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('cart')}
                    className="w-1/3 py-2.5 px-3 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold text-xs transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    form="checkout-form"
                    className="w-2/3 py-2.5 px-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    Confirm &amp; Place Order (£{finalTotalAmount.toFixed(2)})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
