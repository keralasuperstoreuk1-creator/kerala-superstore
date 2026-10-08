'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle2, 
  Truck, 
  Package, 
  PoundSterling,
  Printer, 
  FileText, 
  Receipt, 
  X, 
  Share2, 
  ExternalLink, 
  MessageCircle, 
  CheckSquare,
  Trash2,
  Calendar,
  Search,
  Filter,
  Users,
  Copy,
  Check,
  Send,
  AlertTriangle
} from 'lucide-react';
import { INITIAL_ORDERS } from '@/lib/mock-data';
import { Order, OrderStatus } from '@/types';
import { useStoreConfig } from '@/context/StoreConfigContext';

const COMPANY_WHATSAPP = '+447749132122';

export default function AdminOrdersPage() {
  const { config } = useStoreConfig();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'pending' | 'out_for_delivery' | 'delivered' | 'customers'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [printMode, setPrintMode] = useState<'a4' | 'thermal'>('a4');
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Load orders from localStorage or mock data
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kss_orders');
      if (saved) {
        setOrders(JSON.parse(saved));
      } else {
        setOrders(INITIAL_ORDERS);
        localStorage.setItem('kss_orders', JSON.stringify(INITIAL_ORDERS));
      }
    } catch {
      setOrders(INITIAL_ORDERS);
    }
  }, []);

  const saveOrders = (updated: Order[]) => {
    setOrders(updated);
    try {
      localStorage.setItem('kss_orders', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save orders:', e);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o));
    saveOrders(updated);
    showToast(`Order status updated to ${newStatus.replace(/_/g, ' ').toUpperCase()}`);
  };

  const handlePaymentToggle = (orderId: string) => {
    const updated = orders.map((o) =>
      o.id === orderId
        ? { ...o, paymentStatus: o.paymentStatus === 'paid' ? 'pending' : 'paid' }
        : o
    );
    saveOrders(updated);
  };

  const confirmDeleteOrder = () => {
    if (!deletingOrder) return;
    const updated = orders.filter((o) => o.id !== deletingOrder.id);
    saveOrders(updated);
    showToast(`Order ${deletingOrder.orderNumber} deleted.`);
    setDeletingOrder(null);
  };

  // Generate WhatsApp Message to Customer
  const generateCustomerWhatsAppLink = (ord: Order) => {
    const cleanPhone = ord.customerPhone.replace(/[^0-9]/g, '');
    const itemsText = ord.items.map((i) => `• ${i.productName} (${i.sizeWeight}) x ${i.quantity} = £${i.totalPrice.toFixed(2)}`).join('%0A');
    const statusText = ord.orderStatus === 'out_for_delivery'
      ? '🚚 OUT FOR DELIVERY! Our driver is heading to your address.'
      : ord.orderStatus === 'confirmed'
      ? '✅ CONFIRMED and being packed fresh.'
      : ord.orderStatus === 'packed'
      ? '📦 PACKED and ready for delivery/collection.'
      : ord.orderStatus === 'delivered'
      ? '🎉 DELIVERED. Thank you for shopping with Kerala Superstore!'
      : 'RECEIVED and processing.';

    const message = `Namaskaram ${ord.customerName}! 🙏%0A%0AUpdate regarding your order *${ord.orderNumber}* from *Kerala Superstore Manchester*:%0A%0A*Status:* ${statusText}%0A%0A*Items Ordered:*%0A${itemsText}%0A%0A*Total Amount:* £${ord.total.toFixed(2)} (${ord.paymentStatus === 'paid' ? 'PAID' : 'Cash on Delivery'})%0A*Delivery Address:* ${ord.addressLine1}, ${ord.city} (${ord.postcode})%0A%0ANeed assistance? Call us on 07749 132122.%0AUnit 2, 73 Old Market Street, Manchester M9 8DX.`;

    return `https://wa.me/${cleanPhone}?text=${message}`;
  };

  // Generate WhatsApp Notification to Company Staff (+44 7749 132122)
  const generateCompanyWhatsAppLink = (ord: Order) => {
    const itemsList = ord.items.map((i) => `  - ${i.productName} (${i.sizeWeight}) x ${i.quantity} (£${i.totalPrice.toFixed(2)})`).join('%0A');
    const message = `📦 *NEW ORDER ALERT — KERALA SUPERSTORE*%0A%0A*Order:* ${ord.orderNumber}%0A*Customer:* ${ord.customerName}%0A*Phone:* ${ord.customerPhone}%0A*Address:* ${ord.addressLine1}, ${ord.city}, ${ord.postcode}%0A%0A*Items:*%0A${itemsList}%0A%0A*Total Bill:* £${ord.total.toFixed(2)} (${ord.paymentStatus === 'paid' ? 'PAID ONLINE' : 'CASH ON DELIVERY'})%0A*Order Date:* ${new Date(ord.createdAt).toLocaleString()}`;
    return `https://wa.me/${COMPANY_WHATSAPP.replace(/[^0-9]/g, '')}?text=${message}`;
  };

  // Copy phone number
  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
    showToast(`Copied phone: ${phone}`);
  };

  // Date check helper
  const isToday = (isoDate: string) => {
    const orderDate = new Date(isoDate).toDateString();
    const today = new Date().toDateString();
    return orderDate === today;
  };

  // Filtered Orders Logic
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = ord.customerName.toLowerCase().includes(q);
        const matchPhone = ord.customerPhone.toLowerCase().includes(q);
        const matchNumber = ord.orderNumber.toLowerCase().includes(q);
        const matchPostcode = ord.postcode.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchNumber && !matchPostcode) return false;
      }

      // 2. Specific Date Filter
      if (selectedDate) {
        const orderDateStr = new Date(ord.createdAt).toISOString().split('T')[0];
        if (orderDateStr !== selectedDate) return false;
      }

      // 3. Tab Filter
      if (activeTab === 'today') {
        return isToday(ord.createdAt);
      }
      if (activeTab === 'pending') {
        return ord.orderStatus === 'new' || ord.orderStatus === 'confirmed';
      }
      if (activeTab === 'out_for_delivery') {
        return ord.orderStatus === 'out_for_delivery' || ord.orderStatus === 'packed';
      }
      if (activeTab === 'delivered') {
        return ord.orderStatus === 'delivered';
      }

      return true; // 'all'
    });
  }, [orders, activeTab, searchQuery, selectedDate]);

  // Unique Customers Directory
  const customerDirectory = useMemo(() => {
    const map = new Map<string, {
      name: string;
      phone: string;
      email?: string;
      postcode: string;
      totalOrders: number;
      totalSpent: number;
      lastOrderDate: string;
      lastOrderNumber: string;
    }>();

    orders.forEach((ord) => {
      const key = ord.customerPhone.trim() || ord.customerName.trim();
      const existing = map.get(key);
      if (existing) {
        existing.totalOrders += 1;
        existing.totalSpent += ord.total;
        if (new Date(ord.createdAt) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = ord.createdAt;
          existing.lastOrderNumber = ord.orderNumber;
          existing.postcode = ord.postcode;
        }
      } else {
        map.set(key, {
          name: ord.customerName,
          phone: ord.customerPhone,
          email: ord.customerEmail,
          postcode: ord.postcode,
          totalOrders: 1,
          totalSpent: ord.total,
          lastOrderDate: ord.createdAt,
          lastOrderNumber: ord.orderNumber,
        });
      }
    });

    return Array.from(map.values());
  }, [orders]);

  // Metric Counts
  const todayCount = orders.filter((o) => isToday(o.createdAt)).length;
  const pendingCount = orders.filter((o) => o.orderStatus === 'new' || o.orderStatus === 'confirmed').length;
  const outCount = orders.filter((o) => o.orderStatus === 'out_for_delivery' || o.orderStatus === 'packed').length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? o.total : 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/40 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Header & Company WhatsApp Broadcast Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Customer Orders &amp; Live WhatsApp Dispatch</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily order tracking, live phone directory, and instant WhatsApp notifications
              </p>
            </div>
          </div>
        </div>

        {/* Company WhatsApp Live Alert Badge */}
        <div className="flex items-center gap-3">
          <a
            href={`https://wa.me/${COMPANY_WHATSAPP.replace(/[^0-9]/g, '')}?text=Kerala%20Superstore%20Order%20Center`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-900/20 transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>Store WhatsApp: +44 7749 132122</span>
          </a>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div 
          onClick={() => { setActiveTab('today'); setSelectedDate(''); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'today' ? 'bg-emerald-800 text-white border-emerald-800 shadow-md' : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-500'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold opacity-80 uppercase tracking-wider">
            <span>Today's Orders</span>
            <Calendar className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black mt-2">{todayCount}</div>
        </div>

        <div 
          onClick={() => { setActiveTab('pending'); setSelectedDate(''); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'pending' ? 'bg-amber-600 text-white border-amber-600 shadow-md' : 'bg-white text-slate-800 border-slate-200 hover:border-amber-500'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold opacity-80 uppercase tracking-wider">
            <span>Pending Packing</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black mt-2">{pendingCount}</div>
        </div>

        <div 
          onClick={() => { setActiveTab('out_for_delivery'); setSelectedDate(''); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'out_for_delivery' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-800 border-slate-200 hover:border-blue-500'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold opacity-80 uppercase tracking-wider">
            <span>Out for Delivery</span>
            <Truck className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black mt-2">{outCount}</div>
        </div>

        <div 
          onClick={() => { setActiveTab('customers'); setSelectedDate(''); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'customers' ? 'bg-purple-700 text-white border-purple-700 shadow-md' : 'bg-white text-slate-800 border-slate-200 hover:border-purple-500'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold opacity-80 uppercase tracking-wider">
            <span>Customer Contacts</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black mt-2">{customerDirectory.length}</div>
        </div>
      </div>

      {/* Filter Navigation & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {[
              { id: 'today', label: '📅 Today' },
              { id: 'pending', label: '⏳ Pending' },
              { id: 'out_for_delivery', label: '🚚 Out for Delivery' },
              { id: 'delivered', label: '✅ Delivered' },
              { id: 'all', label: '📋 All Orders' },
              { id: 'customers', label: '👥 Customer Phone List' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedDate('');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Date Picker Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold hidden sm:inline">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold outline-none focus:border-emerald-500"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="text-xs font-bold text-rose-600 hover:text-rose-800"
              >
                Clear Date
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone number, postcode (e.g. M9 8DX), or order #..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'customers' ? (
        /* CUSTOMER CONTACT DIRECTORY */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">Customer Phone &amp; Contact Directory</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                List of all customers who ordered with phone numbers and WhatsApp links
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
              {customerDirectory.length} Customers
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Customer Name</th>
                  <th className="p-3.5">Phone Number</th>
                  <th className="p-3.5">Postcode</th>
                  <th className="p-3.5 text-center">Total Orders</th>
                  <th className="p-3.5 text-right">Total Spent</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerDirectory.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-[10px]">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{c.name}</span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span>{c.phone}</span>
                        <button
                          onClick={() => handleCopyPhone(c.phone)}
                          className="p-1 hover:bg-slate-200 rounded text-slate-500"
                          title="Copy phone"
                        >
                          {copiedPhone === c.phone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-600">{c.postcode}</td>
                    <td className="p-3.5 text-center font-bold text-emerald-700">{c.totalOrders}</td>
                    <td className="p-3.5 text-right font-black text-slate-900">£{c.totalSpent.toFixed(2)}</td>
                    <td className="p-3.5 text-center">
                      <a
                        href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(c.name)},%20greeting%20from%20Kerala%20Superstore%20Manchester!`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Chat on WhatsApp
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ORDERS LISTING */
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-base font-bold text-slate-800">No orders found for this filter</p>
              <p className="text-xs text-slate-500">Try changing the tab or clearing the date/search query.</p>
            </div>
          ) : (
            filteredOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 hover:shadow-md transition-shadow space-y-4"
              >
                {/* Top Row: Order Number, Date, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-base text-slate-900 font-mono">
                      {ord.orderNumber}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(ord.createdAt).toLocaleDateString()} {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Select */}
                    <select
                      value={ord.orderStatus}
                      onChange={(e) => handleStatusChange(ord.id, e.target.value as OrderStatus)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold outline-none cursor-pointer ${
                        ord.orderStatus === 'delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.orderStatus === 'out_for_delivery'
                          ? 'bg-blue-100 text-blue-800'
                          : ord.orderStatus === 'confirmed'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      <option value="new">New Order</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="packed">Packed</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    {/* Payment Toggle */}
                    <button
                      onClick={() => handlePaymentToggle(ord.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                        ord.paymentStatus === 'paid'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {ord.paymentStatus === 'paid' ? 'Paid Online' : 'Cash on Delivery'}
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => setDeletingOrder(ord)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Delete Order"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Middle Row: Customer Info & Items */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Customer Contact */}
                  <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Customer Details</span>
                    <p className="font-black text-slate-900 text-sm">{ord.customerName}</p>
                    <div className="flex items-center gap-1.5 text-slate-700 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ord.customerPhone}</span>
                      <button
                        onClick={() => handleCopyPhone(ord.customerPhone)}
                        className="p-0.5 text-slate-400 hover:text-slate-800"
                        title="Copy"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-slate-600 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{ord.addressLine1}, {ord.city} ({ord.postcode})</span>
                    </p>
                  </div>

                  {/* Items Ordered List */}
                  <div className="md:col-span-2 space-y-2 bg-slate-50 p-3.5 rounded-2xl">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Items ({ord.items.length})</span>
                      <span>Total: £{ord.total.toFixed(2)}</span>
                    </div>

                    <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                      {ord.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-slate-700 text-xs">
                          <span className="font-medium text-slate-900">
                            {item.productName} <span className="text-slate-400">({item.sizeWeight})</span> x {item.quantity}
                          </span>
                          <span className="font-bold">£{item.totalPrice.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Bar: WhatsApp & Print */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Notify Company WhatsApp */}
                    <a
                      href={generateCompanyWhatsAppLink(ord)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send to Store WhatsApp (+44 7749 132122)
                    </a>

                    {/* Notify Customer WhatsApp */}
                    <a
                      href={generateCustomerWhatsAppLink(ord)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Update Customer
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Print A4 Slip */}
                    <button
                      onClick={() => {
                        setPrintingOrder(ord);
                        setPrintMode('a4');
                        setTimeout(window.print, 200);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      A4 Packing Slip
                    </button>

                    {/* Print Thermal POS Receipt */}
                    <button
                      onClick={() => {
                        setPrintingOrder(ord);
                        setPrintMode('thermal');
                        setTimeout(window.print, 200);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      Thermal Receipt (POS)
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Delete Order {deletingOrder.orderNumber}?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete this order from the system? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeletingOrder(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteOrder}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-900/20 transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT STYLES & TEMPLATE */}
      {printingOrder && (
        <div className="hidden print:block fixed inset-0 bg-white p-8 z-[9999]">
          {printMode === 'thermal' ? (
            /* 80MM THERMAL RECEIPT */
            <div className="w-[80mm] font-mono text-xs text-black space-y-2">
              <div className="text-center pb-2 border-b border-dashed border-black">
                <p className="font-black text-sm">KERALA SUPERSTORE</p>
                <p className="text-[10px]">Unit 2, 73 Old Market Street</p>
                <p className="text-[10px]">Manchester, M9 8DX • 07749 132122</p>
              </div>

              <div className="text-[10px] space-y-0.5">
                <p>Order: {printingOrder.orderNumber}</p>
                <p>Date: {new Date(printingOrder.createdAt).toLocaleString()}</p>
                <p>Customer: {printingOrder.customerName}</p>
                <p>Phone: {printingOrder.customerPhone}</p>
                <p>Postcode: {printingOrder.postcode}</p>
              </div>

              <div className="border-t border-b border-dashed border-black py-2 space-y-1">
                {printingOrder.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between text-[10px]">
                    <span>{i.productName.slice(0, 18)} x{i.quantity}</span>
                    <span>£{i.totalPrice.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-0.5 text-[11px] font-black pt-1">
                <div className="flex justify-between">
                  <span>TOTAL:</span>
                  <span>£{printingOrder.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[9px] font-normal">
                  <span>Payment:</span>
                  <span>{printingOrder.paymentStatus === 'paid' ? 'PAID' : 'CASH ON DELIVERY'}</span>
                </div>
              </div>

              <div className="text-center pt-3 border-t border-dashed border-black text-[9px]">
                <p>Thank you for shopping authentic Kerala groceries!</p>
                <p>www.keralasuperstore.com</p>
              </div>
            </div>
          ) : (
            /* A4 PACKING SLIP */
            <div className="max-w-3xl mx-auto p-8 border border-slate-300 space-y-6">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900">KERALA SUPERSTORE</h1>
                  <p className="text-xs text-slate-500">Unit 2, 73 Old Market Street, Manchester, M9 8DX</p>
                  <p className="text-xs text-slate-500">Tel: 07749 132122 • info@keralasuperstores.com</p>
                </div>
                <div className="text-right">
                  <h2 className="text-lg font-bold text-slate-800">PACKING SLIP</h2>
                  <p className="text-xs font-mono font-bold">#{printingOrder.orderNumber}</p>
                  <p className="text-xs text-slate-500">{new Date(printingOrder.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl">
                <div>
                  <p className="font-bold text-slate-500 uppercase">Deliver To:</p>
                  <p className="font-bold text-slate-900">{printingOrder.customerName}</p>
                  <p>{printingOrder.addressLine1}</p>
                  <p>{printingOrder.city}, {printingOrder.postcode}</p>
                  <p>Phone: {printingOrder.customerPhone}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-500 uppercase">Payment Method:</p>
                  <p className="font-bold text-slate-900">
                    {printingOrder.paymentStatus === 'paid' ? 'Paid Online' : 'Cash on Delivery (COD)'}
                  </p>
                  <p className="font-bold text-slate-500 uppercase mt-2">Status:</p>
                  <p className="font-bold text-emerald-700">{printingOrder.orderStatus.toUpperCase()}</p>
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-800">
                    <th className="py-2">Item Description</th>
                    <th className="py-2">Size/Weight</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Unit Price</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {printingOrder.items.map((i, idx) => (
                    <tr key={idx}>
                      <td className="py-2 font-medium">{i.productName}</td>
                      <td className="py-2 text-slate-500">{i.sizeWeight}</td>
                      <td className="py-2 text-center font-bold">{i.quantity}</td>
                      <td className="py-2 text-right">£{i.unitPrice.toFixed(2)}</td>
                      <td className="py-2 text-right font-bold">£{i.totalPrice.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end pt-4 border-t">
                <div className="w-64 space-y-1 text-xs">
                  <div className="flex justify-between text-sm font-black pt-2 border-t">
                    <span>Grand Total:</span>
                    <span>£{printingOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
