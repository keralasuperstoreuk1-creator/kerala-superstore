'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Trash2, Minus, ArrowLeft, Check } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useStoreConfig } from '@/context/StoreConfigContext';
import { displayName } from '@/components/ProductCard';
import { HandBasket, HandPlus, HandTag, HandVan, HandWhatsApp } from '@/components/home/HandIcons';

const WHATSAPP_NUMBER = '447749132122';
const SHOP_ADDRESS = 'Unit 2, 73 Old Market Street, Manchester M9 8DX';

const inputClass =
  'w-full h-11 px-3 rounded-[9px] border border-shop-line bg-white text-[15px] text-shop-ink placeholder:text-[#9AA19C] outline-none focus:border-shop-green focus:ring-2 focus:ring-shop-green/15';
const labelClass = 'block text-[13px] font-bold text-shop-ink mb-1';

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
    freeDeliveryThreshold,
    amountNeededForFreeDelivery,
  } = useCart();

  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    postcode: '',
    notes: '',
  });

  const { config, validateCoupon } = useStoreConfig();
  const [placedOrder, setPlacedOrder] = useState<{ number: string; total: number } | null>(null);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number; message: string } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotalAmount = Math.max(0, subtotal - discountAmount + deliveryCharge);
  const itemCount = cart.reduce((n, it) => n + it.quantity, 0);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    const res = validateCoupon(couponCodeInput, subtotal);
    if (res.isValid && res.coupon) {
      setAppliedCoupon({ code: res.coupon.code, discountAmount: res.discountAmount, message: res.message });
      setCouponCodeInput('');
    } else {
      setCouponError(res.message);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const closeDrawer = () => {
    setIsCartOpen(false);
    if (checkoutStep === 'success') setCheckoutStep('cart');
  };

  // Close on Escape
  useEffect(() => {
    if (!isCartOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCartOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  const freeDeliveryProgress = freeDeliveryThreshold > 0 ? Math.min(100, (subtotal / freeDeliveryThreshold) * 100) : 100;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const newOrderNum = `KSS-UK-${Math.floor(1000 + Math.random() * 9000)}`;
    // Keep the total before the basket is cleared, so the receipt shows what is owed.
    setPlacedOrder({ number: newOrderNum, total: finalTotalAmount });

    try {
      const newOrder = {
        id: `ord-${Date.now()}`,
        orderNumber: newOrderNum,
        customerName: formData.name,
        customerPhone: formData.phone,
        customerEmail: formData.email || '',
        addressLine1: formData.address,
        city: formData.city || 'Manchester',
        postcode: formData.postcode,
        items: cart.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          sizeWeight: item.product.sizeWeight,
          unitPrice: item.product.offerPrice ?? item.product.price,
          quantity: item.quantity,
          totalPrice: (item.product.offerPrice ?? item.product.price) * item.quantity,
        })),
        subtotal,
        deliveryFee: deliveryCharge,
        discountAmount,
        total: finalTotalAmount,
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        orderStatus: 'new',
        notes: formData.notes,
        createdAt: new Date().toISOString(),
      };

      const existingRaw = localStorage.getItem('kss_orders');
      const existingList = existingRaw ? JSON.parse(existingRaw) : [];
      localStorage.setItem('kss_orders', JSON.stringify([newOrder, ...existingList]));
      window.dispatchEvent(new Event('kss_orders_updated'));
    } catch (err) {
      console.error('Failed to save order:', err);
    }

    setCheckoutStep('success');
    clearCart();
    setAppliedCoupon(null);
  };

  const sendBasketToWhatsApp = () => {
    const itemsText = cart
      .map((it) => `• ${displayName(it.product.name)} × ${it.quantity} — £${((it.product.offerPrice ?? it.product.price) * it.quantity).toFixed(2)}`)
      .join('\n');
    const msg = `Hello Kerala Superstore! I'd like to order:\n\n${itemsText}\n\nTotal: £${finalTotalAmount.toFixed(2)}\n\nPlease let me know the delivery time. Thank you!`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const title =
    checkoutStep === 'cart' ? 'Your basket' : checkoutStep === 'checkout' ? 'Your details' : 'Order placed';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-[#1E2420]/55 cursor-pointer" onClick={() => setIsCartOpen(false)} aria-hidden="true" />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-shop-cream text-shop-ink flex flex-col shadow-[-8px_0_30px_rgba(30,36,32,0.18)]">
          {/* Header */}
          <div className="px-4 h-16 flex items-center justify-between gap-2 bg-shop-green text-white shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {checkoutStep === 'checkout' ? (
                <button
                  type="button"
                  onClick={() => setCheckoutStep('cart')}
                  className="w-10 h-10 -ml-1 rounded-[9px] flex items-center justify-center hover:bg-white/10 cursor-pointer shrink-0"
                  aria-label="Back to basket"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : (
                <HandBasket size={26} className="text-shop-yellow shrink-0" />
              )}
              <h2 className="font-extrabold text-lg truncate">{title}</h2>
              {checkoutStep === 'cart' && itemCount > 0 && (
                <span className="font-hand text-xl text-shop-yellow whitespace-nowrap">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={closeDrawer}
              className="w-10 h-10 rounded-[9px] flex items-center justify-center hover:bg-white/10 cursor-pointer shrink-0"
              aria-label="Close basket"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free delivery progress */}
          {checkoutStep !== 'success' && cart.length > 0 && (
            <div className="px-4 py-3 bg-shop-paper border-b border-dashed border-shop-dash shrink-0">
              <div className="flex items-center gap-2.5 text-[13px]">
                <HandVan size={28} className="text-shop-green shrink-0" />
                <span className="flex-1 min-w-0 leading-snug">
                  {amountNeededForFreeDelivery > 0 ? (
                    <>
                      Add <strong>£{amountNeededForFreeDelivery.toFixed(2)}</strong> more for free UK delivery
                    </>
                  ) : (
                    <strong className="text-shop-green">Free UK delivery on this order</strong>
                  )}
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-shop-line overflow-hidden">
                <div className="h-full rounded-full bg-shop-green transition-all duration-500" style={{ width: `${freeDeliveryProgress}%` }} />
              </div>
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {checkoutStep === 'cart' &&
              (cart.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center gap-3">
                  <span className="w-20 h-20 rounded-full bg-white border border-shop-line flex items-center justify-center text-shop-muted">
                    <HandBasket size={38} />
                  </span>
                  <p className="font-hand text-[26px] text-shop-brown leading-tight">your basket is empty</p>
                  <p className="text-sm text-shop-muted">Add a few things from the shelves and they&apos;ll show up here.</p>
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="mt-2 h-12 px-6 rounded-[10px] bg-shop-yellow text-shop-ink font-extrabold cursor-pointer"
                  >
                    Start shopping
                  </button>
                </div>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {cart.map((item) => {
                    const itemPrice = item.product.offerPrice ?? item.product.price;
                    const showBrand = item.product.brand && item.product.brand !== 'Kerala Superstore';
                    const showSize = item.product.sizeWeight && item.product.sizeWeight !== 'Standard';
                    const meta = [showBrand ? item.product.brand : null, showSize ? item.product.sizeWeight : null].filter(Boolean).join(' · ');
                    const atStockLimit = item.product.stock > 0 && item.quantity >= item.product.stock;
                    return (
                      <li key={item.product.id} className="flex gap-3 p-2.5 rounded-[10px] bg-white border border-shop-line">
                        <div className="relative w-[72px] h-[72px] rounded-lg bg-shop-paper shrink-0">
                          <Image
                            src={item.product.imageUrl || '/products/matta-rice.png'}
                            alt={item.product.name}
                            fill
                            sizes="72px"
                            className="object-contain p-1.5"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              if (target && target.src.indexOf('/products/matta-rice.png') === -1) target.src = '/products/matta-rice.png';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col">
                          <div className="flex items-start gap-2">
                            <h3 className="flex-1 min-w-0 text-sm font-semibold leading-snug line-clamp-2">{displayName(item.product.name)}</h3>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.product.id)}
                              className="w-8 h-8 -mt-1 -mr-1 rounded-lg flex items-center justify-center text-shop-muted hover:text-shop-red hover:bg-[#FFF6F4] cursor-pointer shrink-0"
                              aria-label={`Remove ${item.product.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {meta && <span className="text-xs text-shop-muted truncate">{meta}</span>}
                          <div className="mt-auto pt-1.5 flex items-center justify-between gap-2">
                            <div className="flex items-center rounded-[9px] border border-shop-line bg-shop-paper">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                className="w-9 h-9 flex items-center justify-center text-shop-ink cursor-pointer"
                                aria-label="One less"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="min-w-6 text-center text-sm font-bold tabular-nums" aria-live="polite">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                disabled={atStockLimit}
                                className="w-9 h-9 flex items-center justify-center text-shop-ink cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                                aria-label="One more"
                              >
                                <HandPlus size={16} />
                              </button>
                            </div>
                            <div className="text-right leading-tight">
                              <div className="text-[15px] font-extrabold tabular-nums">£{(itemPrice * item.quantity).toFixed(2)}</div>
                              {item.quantity > 1 && <div className="text-[11px] text-shop-muted tabular-nums">£{itemPrice.toFixed(2)} each</div>}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ))}

            {checkoutStep === 'checkout' && (
              <form id="checkout-form" onSubmit={handlePlaceOrder} className="flex flex-col gap-3.5">
                <div className="p-3.5 rounded-[10px] bg-[#FFE9BE] text-[#2A1A05]">
                  <div className="font-extrabold text-[15px]">Pay cash on delivery</div>
                  <p className="mt-0.5 text-[13px] text-[#5A4220] leading-snug">
                    Nothing to pay now. Pay our driver when your order arrives. Packed at {SHOP_ADDRESS}.
                  </p>
                </div>

                <div>
                  <label htmlFor="co-name" className={labelClass}>Full name</label>
                  <input id="co-name" required name="name" autoComplete="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Thomas Mathew" className={inputClass} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label htmlFor="co-phone" className={labelClass}>Phone</label>
                    <input id="co-phone" required type="tel" name="phone" autoComplete="tel" value={formData.phone} onChange={handleInputChange} placeholder="07700 900000" className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="co-email" className={labelClass}>Email</label>
                    <input id="co-email" required type="email" name="email" autoComplete="email" value={formData.email} onChange={handleInputChange} placeholder="you@example.com" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label htmlFor="co-address" className={labelClass}>Street address</label>
                  <input id="co-address" required name="address" autoComplete="street-address" value={formData.address} onChange={handleInputChange} placeholder="House number and street" className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label htmlFor="co-city" className={labelClass}>Town / city</label>
                    <input id="co-city" required name="city" autoComplete="address-level2" value={formData.city} onChange={handleInputChange} placeholder="e.g. Manchester" className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="co-postcode" className={labelClass}>Postcode</label>
                    <input id="co-postcode" required name="postcode" autoComplete="postal-code" value={formData.postcode} onChange={handleInputChange} placeholder="e.g. M9 8DX" className={`${inputClass} uppercase`} />
                  </div>
                </div>
                <div>
                  <label htmlFor="co-notes" className={labelClass}>
                    Delivery notes <span className="font-normal text-shop-muted">(optional)</span>
                  </label>
                  <textarea
                    id="co-notes"
                    rows={2}
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="e.g. Leave with the neighbour at no. 12"
                    className={`${inputClass} h-auto py-2.5`}
                  />
                </div>
              </form>
            )}

            {checkoutStep === 'success' && placedOrder && (
              <div className="py-6 flex flex-col items-center text-center gap-3">
                <span className="w-16 h-16 rounded-full bg-shop-green text-white flex items-center justify-center">
                  <Check className="w-8 h-8" strokeWidth={3} />
                </span>
                <h3 className="text-2xl font-extrabold tracking-tight">Thank you, {formData.name.split(' ')[0] || 'friend'}!</h3>
                <p className="font-hand text-2xl text-shop-brown -mt-1">we&apos;re packing your order now</p>

                <div className="w-full mt-2 p-4 rounded-[10px] bg-white border border-dashed border-shop-dash text-left text-sm flex flex-col gap-2">
                  <div className="flex justify-between gap-3">
                    <span className="text-shop-muted">Order number</span>
                    <span className="font-bold">{placedOrder.number}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-shop-muted shrink-0">Delivering to</span>
                    <span className="font-medium text-right truncate">{formData.address}, {formData.postcode.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-shop-muted">Payment</span>
                    <span className="font-medium">Cash on delivery</span>
                  </div>
                  <div className="flex justify-between items-baseline gap-3 pt-2 border-t border-shop-line">
                    <span className="font-bold">To pay on delivery</span>
                    <span className="text-xl font-extrabold tabular-nums">£{placedOrder.total.toFixed(2)}</span>
                  </div>
                </div>

                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello Kerala Superstore! I just placed order ${placedOrder.number} for £${placedOrder.total.toFixed(2)} to ${formData.postcode.toUpperCase()}. Please confirm the delivery time.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full h-12 mt-1 rounded-[10px] bg-shop-green text-white font-extrabold flex items-center justify-center gap-2"
                >
                  <HandWhatsApp size={22} />
                  Confirm on WhatsApp
                </a>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="w-full h-12 rounded-[10px] border border-shop-line bg-white font-bold cursor-pointer"
                >
                  Back to the shop
                </button>
              </div>
            )}
          </div>

          {/* Footer: totals + actions */}
          {cart.length > 0 && checkoutStep !== 'success' && (
            <div className="px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white border-t border-shop-line flex flex-col gap-3 shrink-0">
              {(config.modules?.showPromoCoupons ?? true) &&
                checkoutStep === 'cart' &&
                (appliedCoupon ? (
                  <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-[9px] bg-[#EAF4EE] text-sm">
                    <span className="flex items-center gap-1.5 font-bold text-shop-green min-w-0">
                      <HandTag size={18} className="shrink-0" />
                      <span className="truncate">{appliedCoupon.code} applied</span>
                    </span>
                    <button type="button" onClick={handleRemoveCoupon} className="text-[13px] font-bold text-shop-red underline cursor-pointer shrink-0">
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon}>
                    <div className="flex gap-2">
                      <label htmlFor="co-coupon" className="sr-only">Promo code</label>
                      <input
                        id="co-coupon"
                        type="text"
                        placeholder="Promo code"
                        value={couponCodeInput}
                        onChange={(e) => {
                          setCouponCodeInput(e.target.value.toUpperCase());
                          setCouponError(null);
                        }}
                        className={`${inputClass} h-10 uppercase text-sm font-bold tracking-wide`}
                      />
                      <button
                        type="submit"
                        disabled={!couponCodeInput.trim()}
                        className="h-10 px-4 rounded-[9px] border-[1.5px] border-shop-green text-shop-green font-bold text-sm cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && <p className="mt-1 text-xs font-bold text-shop-red">{couponError}</p>}
                  </form>
                ))}

              <dl className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-shop-muted">Items</dt>
                  <dd className="tabular-nums">£{subtotal.toFixed(2)}</dd>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-shop-green font-bold">
                    <dt>Promo ({appliedCoupon.code})</dt>
                    <dd className="tabular-nums">−£{appliedCoupon.discountAmount.toFixed(2)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-shop-muted">Delivery</dt>
                  <dd className="tabular-nums">{deliveryCharge === 0 ? <span className="font-bold text-shop-green">Free</span> : `£${deliveryCharge.toFixed(2)}`}</dd>
                </div>
                <div className="flex justify-between items-baseline pt-2 mt-1 border-t border-dashed border-shop-dash">
                  <dt className="font-extrabold">Total</dt>
                  <dd className="text-[22px] font-extrabold tabular-nums">£{finalTotalAmount.toFixed(2)}</dd>
                </div>
              </dl>

              {checkoutStep === 'cart' ? (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('checkout')}
                    className="w-full h-12 rounded-[10px] bg-shop-yellow text-shop-ink font-extrabold cursor-pointer"
                  >
                    Checkout · pay on delivery
                  </button>
                  <button
                    type="button"
                    onClick={sendBasketToWhatsApp}
                    className="w-full h-12 rounded-[10px] border-[1.5px] border-shop-green text-shop-green font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <HandWhatsApp size={22} />
                    Send this basket on WhatsApp
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  form="checkout-form"
                  className="w-full h-12 rounded-[10px] bg-shop-green text-white font-extrabold cursor-pointer"
                >
                  Place order · £{finalTotalAmount.toFixed(2)}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
