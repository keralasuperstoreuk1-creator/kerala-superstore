'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  ShoppingBag, 
  PoundSterling, 
  Package, 
  AlertTriangle, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  Truck,
  Plus,
  Boxes,
  Tag,
  Bell,
  Sliders
} from 'lucide-react';
import { INITIAL_ORDERS, INITIAL_PRODUCTS } from '@/lib/mock-data';
import { Order, OrderStatus } from '@/types';
import { useStoreConfig, SiteTheme } from '@/context/StoreConfigContext';

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const { config, setTheme, toggleModule } = useStoreConfig();

  const totalSales = orders.reduce((sum, ord) => sum + ord.total, 0);
  const lowStockCount = INITIAL_PRODUCTS.filter((p) => p.stock <= (p.lowStockThreshold || 10)).length;

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o))
    );
  };

  const handleTogglePayment = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, paymentStatus: o.paymentStatus === 'paid' ? 'pending' : 'paid' }
          : o
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Quick 1-Click Festive Theme Switcher Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <span>🎭 Live Customer Store Theme:</span>
            <span className="font-black capitalize text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
              {config.theme === 'default' ? 'Emerald Classic' : config.theme === 'onam' ? 'Onam Festival' : 'Christmas & New Year'}
            </span>
          </h3>
          <p className="text-[11px] text-slate-400">Instantly switch store banners, festive color accents, and particle animations</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme('default')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              config.theme === 'default'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <span>🌿 Default</span>
          </button>
          <button
            onClick={() => setTheme('onam')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              config.theme === 'onam'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <span>🌼 Onam (Petals)</span>
          </button>
          <button
            onClick={() => setTheme('christmas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              config.theme === 'christmas'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <span>🎄 Christmas (Snow)</span>
          </button>
        </div>
      </div>

      {/* Quick Storefront Feature Visibility Controller */}
      <div className="bg-white p-4.5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-xs text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-700" />
              <span>⚡ Live Storefront Feature Controls (Enable / Disable)</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Turn OFF to instantly hide sections from live website keralasuperstore.com. Turn ON to restore.
            </p>
          </div>
          <Link
            href="/admin/settings"
            className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 self-start sm:self-auto bg-emerald-50 px-2.5 py-1 rounded-lg"
          >
            <span>All 10 Feature Controls</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Module 1: Combo Bundles */}
          {(() => {
            const isEnabled = config.modules?.showComboBundles ?? true;
            return (
              <button
                type="button"
                onClick={() => toggleModule('showComboBundles')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isEnabled
                    ? 'bg-amber-50/70 border-amber-200/80 hover:bg-amber-100/60'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
                    <Boxes className="w-3.5 h-3.5" />
                  </div>
                  <span className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                </div>
                <div>
                  <div className="font-black text-xs text-slate-900 leading-tight">Combo Bundles</div>
                  <div className="text-[10px] font-bold mt-0.5 text-slate-500">
                    {isEnabled ? '🟢 Live on Web' : '🔴 Hidden'}
                  </div>
                </div>
              </button>
            );
          })()}

          {/* Module 2: Promo Coupons */}
          {(() => {
            const isEnabled = config.modules?.showPromoCoupons ?? true;
            return (
              <button
                type="button"
                onClick={() => toggleModule('showPromoCoupons')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isEnabled
                    ? 'bg-emerald-50/70 border-emerald-200/80 hover:bg-emerald-100/60'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <Tag className="w-3.5 h-3.5" />
                  </div>
                  <span className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                </div>
                <div>
                  <div className="font-black text-xs text-slate-900 leading-tight">Promo Coupons</div>
                  <div className="text-[10px] font-bold mt-0.5 text-slate-500">
                    {isEnabled ? '🟢 Live in Basket' : '🔴 Hidden'}
                  </div>
                </div>
              </button>
            );
          })()}

          {/* Module 3: Kitchen Specials */}
          {(() => {
            const isEnabled = config.modules?.showKitchenSpecials ?? true;
            return (
              <button
                type="button"
                onClick={() => toggleModule('showKitchenSpecials')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isEnabled
                    ? 'bg-rose-50/70 border-rose-200/80 hover:bg-rose-100/60'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <span className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                </div>
                <div>
                  <div className="font-black text-xs text-slate-900 leading-tight">Kitchen Specials</div>
                  <div className="text-[10px] font-bold mt-0.5 text-slate-500">
                    {isEnabled ? '🟢 Live on Web' : '🔴 Hidden'}
                  </div>
                </div>
              </button>
            );
          })()}

          {/* Module 4: Hero Slider */}
          {(() => {
            const isEnabled = config.modules?.showHeroSlider ?? true;
            return (
              <button
                type="button"
                onClick={() => toggleModule('showHeroSlider')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isEnabled
                    ? 'bg-blue-50/70 border-blue-200/80 hover:bg-blue-100/60'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                    <Sliders className="w-3.5 h-3.5" />
                  </div>
                  <span className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                </div>
                <div>
                  <div className="font-black text-xs text-slate-900 leading-tight">Hero Banners</div>
                  <div className="text-[10px] font-bold mt-0.5 text-slate-500">
                    {isEnabled ? '🟢 Live on Web' : '🔴 Hidden'}
                  </div>
                </div>
              </button>
            );
          })()}
        </div>
      </div>
      {/* Top Banner with AI highlight */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 rounded-3xl p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl border border-emerald-800">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-emerald-950 text-xs font-black">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Cataloging Ready</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black">
            Add New Products in Seconds with Google Gemini AI
          </h2>
          <p className="text-xs text-emerald-200">
            Just snap or upload a photo of the packet. Gemini automatically extracts product name, brand, weight, ingredients, allergens and removes the background for free.
          </p>
        </div>

        <Link
          href="/admin/ai-add"
          className="shrink-0 px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black rounded-2xl text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-emerald-950" />
          <span>Launch AI Product Add</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today&apos;s Orders</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{orders.length}</div>
            <div className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>All active UK shipments</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today&apos;s Revenue</div>
            <div className="text-2xl font-black text-slate-900 mt-1">£{totalSales.toFixed(2)}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">Cash on Delivery + Online</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <span className="text-2xl font-black">£</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Products</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{INITIAL_PRODUCTS.length}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">10 Categories Active</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock Alert</div>
            <div className="text-2xl font-black text-rose-600 mt-1">{lowStockCount} items</div>
            <div className="text-[11px] text-rose-600 font-medium mt-1">Needs reordering</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-base text-slate-900">Recent Customer Orders</h3>
            <p className="text-xs text-slate-500">Live order processing, status updates &amp; COD payment collection</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-bold text-emerald-800 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer &amp; Location</th>
                <th className="p-4">Items</th>
                <th className="p-4">Amount (£)</th>
                <th className="p-4">Payment (COD)</th>
                <th className="p-4">Order Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4">
                    <span className="font-bold text-slate-900 block">{ord.orderNumber}</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="font-semibold text-slate-900">{ord.customerName}</div>
                    <div className="text-[11px] text-slate-500">{ord.city} ({ord.postcode})</div>
                    <div className="text-[11px] text-slate-400">{ord.customerPhone}</div>
                  </td>

                  <td className="p-4">
                    <span className="font-semibold text-slate-800 block">
                      {ord.items.length} {ord.items.length === 1 ? 'item' : 'items'}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate max-w-[180px] block">
                      {ord.items.map((i) => i.productName).join(', ')}
                    </span>
                  </td>

                  <td className="p-4 font-black text-slate-900 text-sm">
                    £{ord.total.toFixed(2)}
                  </td>

                  <td className="p-4">
                    <button
                      onClick={() => handleTogglePayment(ord.id)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 ${
                        ord.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                      }`}
                      title="Click to toggle Cash Received"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{ord.paymentStatus === 'paid' ? 'Cash Received' : 'Pending Cash (COD)'}</span>
                    </button>
                  </td>

                  <td className="p-4">
                    <select
                      value={ord.orderStatus}
                      onChange={(e) => handleStatusChange(ord.id, e.target.value as OrderStatus)}
                      aria-label="Update order status"
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold bg-white text-slate-800 outline-none focus:border-emerald-600"
                    >
                      <option value="new">🟡 New Order</option>
                      <option value="confirmed">🔵 Confirmed</option>
                      <option value="packed">📦 Packed</option>
                      <option value="out_for_delivery">🚚 Out for Delivery</option>
                      <option value="delivered">✅ Delivered</option>
                      <option value="cancelled">❌ Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
