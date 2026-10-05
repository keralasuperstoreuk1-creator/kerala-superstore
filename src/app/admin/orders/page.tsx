'use client';

import React, { useState } from 'react';
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
  CheckSquare
} from 'lucide-react';
import { INITIAL_ORDERS } from '@/lib/mock-data';
import { Order, OrderStatus } from '@/types';
import { useStoreConfig } from '@/context/StoreConfigContext';

export default function AdminOrdersPage() {
  const { config } = useStoreConfig();
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [printMode, setPrintMode] = useState<'a4' | 'thermal'>('a4');

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'all') return true;
    return o.orderStatus === filterStatus;
  });

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o))
    );
  };

  const handlePaymentToggle = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, paymentStatus: o.paymentStatus === 'paid' ? 'pending' : 'paid' }
          : o
      )
    );
  };

  // WhatsApp Message Generator
  const generateWhatsAppLink = (ord: Order) => {
    const cleanPhone = ord.customerPhone.replace(/[^0-9]/g, '');
    const itemsText = ord.items.map((i) => `• ${i.productName} (${i.sizeWeight}) x ${i.quantity} = £${i.totalPrice.toFixed(2)}`).join('%0A');
    const statusText = ord.orderStatus === 'out_for_delivery'
      ? '🚚 OUT FOR DELIVERY! Our driver is heading to your address.'
      : ord.orderStatus === 'confirmed'
      ? '✅ CONFIRMED and being packed fresh.'
      : ord.orderStatus === 'packed'
      ? '📦 PACKED and ready for delivery/collection.'
      : ord.orderStatus === 'delivered'
      ? '🎉 DELIVERED. Thank you for shopping with us!'
      : 'RECEIVED and processing.';

    const message = `Namaskaram ${ord.customerName}! 🙏%0A%0AUpdate regarding your order *${ord.orderNumber}* from *Kerala Superstore Manchester*:%0A%0A*Status:* ${statusText}%0A%0A*Items Ordered:*%0A${itemsText}%0A%0A*Total Amount:* £${ord.total.toFixed(2)} (${ord.paymentStatus === 'paid' ? 'PAID' : 'Cash on Delivery'})%0A*Delivery To:* ${ord.addressLine1}, ${ord.city} (${ord.postcode})%0A%0AQuestions? WhatsApp us or call 07749 132122.%0A4 Wallbrook Drive, Manchester M9 8PX.`;

    return `https://wa.me/${cleanPhone}?text=${message}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">Customer Orders &amp; Delivery</h1>
          <p className="text-xs text-slate-500">Live order workflow, printable packing slips, thermal receipts &amp; WhatsApp updates</p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 text-xs">
          {['all', 'new', 'confirmed', 'packed', 'out_for_delivery', 'delivered'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all capitalize cursor-pointer ${
                filterStatus === st
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((ord) => (
          <div
            key={ord.id}
            className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-emerald-300 transition-colors"
          >
            {/* Top row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-black text-sm text-slate-900">{ord.orderNumber}</span>
                <span className="text-xs text-slate-400">
                  {new Date(ord.createdAt).toLocaleDateString('en-GB')} at{' '}
                  {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[11px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">
                  {ord.deliveryMethod === 'standard' ? 'UK Home Delivery' : 'Click & Collect'}
                </span>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={ord.orderStatus}
                  onChange={(e) => handleStatusChange(ord.id, e.target.value as OrderStatus)}
                  aria-label="Change order status"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-800 outline-none focus:border-emerald-600"
                >
                  <option value="new">🟡 New</option>
                  <option value="confirmed">🔵 Confirmed</option>
                  <option value="packed">📦 Packed</option>
                  <option value="out_for_delivery">🚚 Out for Delivery</option>
                  <option value="delivered">✅ Delivered</option>
                  <option value="cancelled">❌ Cancelled</option>
                </select>

                <button
                  onClick={() => handlePaymentToggle(ord.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    ord.paymentStatus === 'paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{ord.paymentStatus === 'paid' ? 'Paid' : 'Collect £' + ord.total.toFixed(2)}</span>
                </button>

                {/* Print Packing Slip Button */}
                <button
                  onClick={() => {
                    setPrintingOrder(ord);
                    setPrintMode('a4');
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Print Packing Slip or Thermal Invoice"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Print Slip</span>
                </button>

                {/* WhatsApp Order Update Button */}
                <a
                  href={generateWhatsAppLink(ord)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 transition-colors"
                  title="Send live WhatsApp status to customer"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Middle Grid: Customer & Delivery details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Customer */}
              <div className="bg-slate-50 p-3.5 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer</span>
                <div className="font-bold text-slate-900 text-sm">{ord.customerName}</div>
                <div className="flex items-center gap-1 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{ord.customerPhone}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{ord.customerEmail}</span>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-slate-50 p-3.5 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">UK Shipping Address</span>
                <div className="font-semibold text-slate-800">{ord.addressLine1}</div>
                <div className="font-bold text-emerald-800">{ord.city}, {ord.postcode}</div>
                {ord.notes && (
                  <div className="text-[11px] text-amber-900 bg-amber-50 px-2 py-0.5 rounded mt-1">
                    Note: {ord.notes}
                  </div>
                )}
              </div>

              {/* Order Financials */}
              <div className="bg-slate-50 p-3.5 rounded-2xl space-y-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment &amp; Total</span>
                  <div className="flex justify-between text-slate-600 mt-1">
                    <span>Subtotal:</span>
                    <span>£{ord.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Charge:</span>
                    <span>{ord.deliveryCharge === 0 ? 'FREE' : `£${ord.deliveryCharge.toFixed(2)}`}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="font-black text-slate-900">Total (£ GBP):</span>
                  <span className="font-black text-emerald-800 text-base">£{ord.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Ordered Items Preview */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                Order Items ({ord.items.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {ord.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs bg-white"
                  >
                    <div>
                      <div className="font-bold text-slate-900 truncate max-w-[150px]">{item.productName}</div>
                      <div className="text-[11px] text-slate-400">{item.sizeWeight} × {item.quantity} qty</div>
                    </div>
                    <div className="font-black text-slate-800">
                      £{item.totalPrice.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================= */}
      {/* PRINT PACKING SLIP & THERMAL INVOICE MODAL               */}
      {/* ========================================================= */}
      {printingOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-fadeIn">
            {/* Modal Header (Hidden during actual print) */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2.5">
                <Printer className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="font-black text-sm sm:text-base">Packing Slip &amp; Store Receipt</h3>
                  <p className="text-[11px] text-slate-400">Order #{printingOrder.orderNumber} • {printingOrder.customerName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Print mode switcher */}
                <div className="flex items-center bg-slate-800 rounded-xl p-1 text-xs font-bold">
                  <button
                    onClick={() => setPrintMode('a4')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      printMode === 'a4' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    A4 Warehouse Slip
                  </button>
                  <button
                    onClick={() => setPrintMode('thermal')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      printMode === 'thermal' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    80mm Thermal POS
                  </button>
                </div>

                <button
                  onClick={() => setPrintingOrder(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Body Content */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50 flex justify-center">
              {printMode === 'a4' ? (
                /* A4 Warehouse Packing Slip */
                <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm w-full max-w-xl text-slate-900 text-xs space-y-6 print:shadow-none print:border-none print:p-0">
                  {/* Store Header */}
                  <div className="flex items-start justify-between border-b pb-4 border-slate-200">
                    <div>
                      <h2 className="font-black text-base text-emerald-950 uppercase tracking-wide">
                        Kerala Superstore Manchester
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        4 Wallbrook Drive, Manchester M9 8PX • UK<br/>
                        Phone / WhatsApp: +44 7749 132122
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-sm bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md uppercase">
                        Warehouse Packing Slip
                      </span>
                      <p className="text-[11px] text-slate-400 mt-1 font-mono">
                        {new Date(printingOrder.createdAt).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                  </div>

                  {/* Order & Customer Metadata */}
                  <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Deliver To:</span>
                      <div className="font-bold text-sm text-slate-900">{printingOrder.customerName}</div>
                      <div className="text-slate-600">{printingOrder.addressLine1}</div>
                      <div className="font-black text-slate-900">{printingOrder.city}, {printingOrder.postcode}</div>
                      <div className="text-slate-500 font-semibold mt-0.5">📞 {printingOrder.customerPhone}</div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Order Details:</span>
                      <div className="font-black text-sm text-slate-900">#{printingOrder.orderNumber}</div>
                      <div className="text-slate-600">Method: {printingOrder.deliveryMethod === 'standard' ? 'UK Home Delivery' : 'Click & Collect'}</div>
                      <div className="mt-1">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          printingOrder.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                        }`}>
                          {printingOrder.paymentStatus === 'paid' ? 'Paid Online' : 'Cash on Delivery (COD)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Picking Checklist Table */}
                  <div>
                    <div className="flex items-center justify-between font-bold text-[11px] text-slate-500 uppercase pb-1 mb-2 border-b">
                      <span>Pick [✓]</span>
                      <span>Item Description</span>
                      <span>Qty</span>
                      <span>Total</span>
                    </div>

                    <div className="divide-y divide-slate-100 space-y-1">
                      {printingOrder.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded border-2 border-slate-400 inline-block shrink-0" />
                            <div>
                              <span className="font-bold text-slate-900">{item.productName}</span>
                              <span className="text-slate-400 block text-[11px]">{item.sizeWeight}</span>
                            </div>
                          </div>
                          <span className="font-bold text-slate-700">{item.quantity}</span>
                          <span className="font-black text-slate-900">£{item.totalPrice.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Financials Summary */}
                  <div className="border-t pt-3 border-slate-200 space-y-1 text-right">
                    <div className="text-slate-600">Subtotal: <strong>£{printingOrder.subtotal.toFixed(2)}</strong></div>
                    <div className="text-slate-600">Delivery: <strong>{printingOrder.deliveryCharge === 0 ? 'FREE' : `£${printingOrder.deliveryCharge.toFixed(2)}`}</strong></div>
                    <div className="font-black text-base text-slate-900 pt-1 border-t border-slate-100">
                      Total Payable: <span className="text-emerald-800">£{printingOrder.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Warehouse Signoff & Receiver Sign box */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-[10px] text-slate-400">
                    <div className="border-t border-dashed border-slate-300 pt-2">
                      Packed By (Staff Sign): ___________________
                    </div>
                    <div className="border-t border-dashed border-slate-300 pt-2 text-right">
                      Customer Received Sign: ___________________
                    </div>
                  </div>
                </div>
              ) : (
                /* 80mm Thermal POS Receipt */
                <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm w-[320px] font-mono text-[11px] text-slate-900 space-y-3 print:shadow-none print:border-none print:w-full">
                  <div className="text-center space-y-1 pb-2 border-b border-dashed border-slate-400">
                    <h3 className="font-black text-xs uppercase">KERALA SUPERSTORE</h3>
                    <p className="text-[10px] text-slate-600">
                      4 Wallbrook Dr, Manchester M9 8PX<br/>
                      Tel: 07749 132122
                    </p>
                    <div className="font-bold text-[10px] pt-1">
                      ORDER #{printingOrder.orderNumber}
                    </div>
                    <div className="text-[9px] text-slate-500">
                      {new Date(printingOrder.createdAt).toLocaleDateString('en-GB')} {new Date(printingOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="text-[10px] space-y-0.5 pb-2 border-b border-dashed border-slate-400">
                    <div><strong>Cust:</strong> {printingOrder.customerName}</div>
                    <div><strong>Tel:</strong> {printingOrder.customerPhone}</div>
                    <div><strong>Addr:</strong> {printingOrder.addressLine1}, {printingOrder.postcode}</div>
                  </div>

                  {/* Items */}
                  <div className="space-y-1.5 pb-2 border-b border-dashed border-slate-400 text-[10px]">
                    {printingOrder.items.map((i, idx) => (
                      <div key={idx} className="flex justify-between items-start">
                        <div className="pr-2">
                          <div>[ ] {i.productName}</div>
                          <div className="text-[9px] text-slate-500">{i.quantity} x £{i.unitPrice.toFixed(2)}</div>
                        </div>
                        <span className="font-bold">£{i.totalPrice.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="space-y-0.5 text-right text-[10px]">
                    <div>Subtotal: £{printingOrder.subtotal.toFixed(2)}</div>
                    <div>Delivery: {printingOrder.deliveryCharge === 0 ? 'FREE' : `£${printingOrder.deliveryCharge.toFixed(2)}`}</div>
                    <div className="text-xs font-black pt-1 border-t border-slate-400">
                      TOTAL: £{printingOrder.total.toFixed(2)}
                    </div>
                    <div className="font-bold text-[10px] uppercase pt-0.5">
                      [{printingOrder.paymentStatus === 'paid' ? 'PAID ONLINE' : 'CASH ON DELIVERY'}]
                    </div>
                  </div>

                  <div className="text-center pt-2 text-[9px] text-slate-500 border-t border-dashed border-slate-400">
                    Nandi! Thank you for supporting our authentic Kerala superstore!
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between print:hidden">
              <span className="text-xs text-slate-500">
                Use your standard Windows printer or thermal roll printer.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrintingOrder(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Send to Printer (Print)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
