'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
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
  Cloud,
  LogOut,
  Lock,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import { isUserAdminAuthenticated, clearAdminSession, getAdminCredentials } from '@/lib/admin-auth';
import { useStoreConfig } from '@/context/StoreConfigContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { config } = useStoreConfig();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>('admin');

  useEffect(() => {
    if (pathname === '/admin/login') {
      setIsAuthenticated(true);
      return;
    }

    const auth = isUserAdminAuthenticated();
    setIsAuthenticated(auth);
    if (!auth) {
      router.replace('/admin/login');
    } else {
      const creds = getAdminCredentials();
      setCurrentUsername(creds.username || 'admin');
    }
  }, [pathname, router]);

  const handleLogout = () => {
    clearAdminSession();
    router.replace('/admin/login');
  };

  // If on login page, render full screen without sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-2xl border-4 border-amber-400/30 border-t-amber-400 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-300">Verifying Admin Access...</p>
      </div>
    );
  }

  // If not authenticated (while redirecting)
  if (!isAuthenticated) {
    return null;
  }

  const isSliderOn = config.modules?.showHeroSlider ?? true;
  const isBundlesOn = config.modules?.showComboBundles ?? true;
  const isCouponsOn = config.modules?.showPromoCoupons ?? true;
  const isSpecialsOn = config.modules?.showKitchenSpecials ?? true;

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'POS Stock Sync', href: '/admin/pos-sync', icon: RefreshCw, badge: 'RetailV2 EXE' },
    { label: 'Feature Switches', href: '/admin/settings', icon: Sliders, badge: 'On/Off' },
    { label: 'Storefront & Banners', href: '/admin/banners', icon: Sliders, badge: isSliderOn ? 'Live' : 'Hidden' },
    { label: 'Combo Bundles', href: '/admin/bundles', icon: Boxes, badge: isBundlesOn ? 'Kits' : 'Hidden' },
    { label: 'Promo Coupons', href: '/admin/coupons', icon: Tag, badge: isCouponsOn ? 'Discounts' : 'Hidden' },
    { label: 'Kitchen Specials & Alerts', href: '/admin/specials', icon: Bell, badge: isSpecialsOn ? 'Live App' : 'Hidden' },
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
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 text-rose-400 hover:text-rose-300"
          >
            <LogOut className="w-5 h-5" />
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 text-slate-300 hover:text-white"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`fixed md:sticky top-0 z-40 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col justify-between transition-transform duration-200 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="overflow-y-auto">
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

          {/* Logged in User Bar */}
          <div className="px-4 py-2.5 mx-3 my-2 bg-slate-800/80 border border-slate-700/60 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-bold text-white text-[11px] truncate max-w-[100px]">{currentUsername}</div>
                <div className="text-[9px] text-emerald-400">Authenticated</div>
              </div>
            </div>
            <Link
              href="/admin/settings"
              className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold"
              title="Change Password"
            >
              Pass
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
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
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
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
                      item.badge === 'Hidden'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : item.badge.includes('AI')
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
        <div className="p-4 border-t border-slate-800 space-y-2 shrink-0">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all"
          >
            <Store className="w-4 h-4 text-emerald-400" />
            <span>View Customer Store</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-rose-500/20"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out / Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Body */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top bar */}
        <div className="hidden md:flex items-center justify-between bg-white px-8 py-4 border-b border-slate-200">
          <div>
            <h1 className="font-black text-slate-900 text-lg">Shop Owner Portal</h1>
            <p className="text-xs text-slate-500">Kerala Superstore • Unit 2, 73 Old Market Street, Manchester M9 8DX</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Orders: COD Active</span>
            </div>

            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Open Storefront</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="Logout from Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        <div className="p-4 md:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
