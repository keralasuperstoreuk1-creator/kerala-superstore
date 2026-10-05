'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Sparkles, 
  Package, 
  ShoppingBag, 
  Settings, 
  Store, 
  Bell, 
  ShieldCheck, 
  ChevronRight,
  Menu,
  X,
  Sliders,
  Tag,
  Boxes,
  Cloud
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Storefront & Banners', href: '/admin/banners', icon: Sliders, badge: 'Live Visuals' },
    { label: 'Combo Bundles', href: '/admin/bundles', icon: Boxes, badge: 'Kits' },
    { label: 'Promo Coupons', href: '/admin/coupons', icon: Tag, badge: 'Discounts' },
    { label: 'Kitchen Specials & Alerts', href: '/admin/specials', icon: Bell, badge: 'Live App' },
    { label: 'AI Add Product', href: '/admin/ai-add', icon: Sparkles, badge: 'AI Vision' },
    { label: 'Products & Stock', href: '/admin/products', icon: Package },
    { label: 'Customer Orders', href: '/admin/orders', icon: ShoppingBag, badge: '2 New' },
    { label: 'Media Cloud (R2)', href: '/admin/storage', icon: Cloud, badge: 'Free 10GB' },
    { label: 'Store & UK Delivery', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center font-black text-amber-300">
            KSS
          </div>
          <span className="font-bold text-sm">Admin Portal</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 text-slate-300 hover:text-white"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`fixed md:sticky top-0 z-40 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col justify-between transition-transform duration-200 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div>
          {/* Logo & Store Info */}
          <div className="p-4 border-b border-slate-800">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-emerald-500 bg-emerald-950 shrink-0">
                <Image
                  src="/branding/kerala-superstore-round-logo.png"
                  alt="Kerala Superstore Admin"
                  fill
                  className="object-contain p-0.5"
                />
              </div>
              <div>
                <h2 className="font-black text-sm text-white tracking-wide">KERALA SUPERSTORE</h2>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Manchester M9</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Management
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-md'
                      : 'hover:bg-slate-800 hover:text-white text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      item.badge.includes('AI')
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-xs'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all"
          >
            <Store className="w-4 h-4 text-emerald-400" />
            <span>View Customer Store</span>
          </Link>

          <div className="px-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Admin: Shop Owner</span>
            <span className="text-emerald-400 font-semibold">UK £ (GBP)</span>
          </div>
        </div>
      </aside>

      {/* Main Admin Content Body */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top bar */}
        <div className="hidden md:flex items-center justify-between bg-white px-8 py-4 border-b border-slate-200">
          <div>
            <h1 className="font-black text-slate-900 text-lg">Shop Owner Portal</h1>
            <p className="text-xs text-slate-500">Kerala Superstore • 4 Wallbrook Drive, Manchester M9 8PX</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Orders: Cash on Delivery Active</span>
            </div>

            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Open Storefront</span>
            </Link>
          </div>
        </div>

        <div className="p-4 md:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
