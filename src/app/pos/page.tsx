'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingCart,
  Scan,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CreditCard,
  Banknote,
  Pause,
  Play,
  RotateCcw,
  Package,
  FileText,
  BarChart3,
  Layers,
  Settings,
  X,
  CheckCircle2,
  Volume2,
  VolumeX,
  Maximize2,
  RefreshCw,
  Store,
  Clock,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Receipt,
  Download,
  AlertCircle,
  Sparkles,
  Upload,
  Percent,
  Sliders,
  Check,
  Pencil,
  Eye,
  Key,
  FileCheck,
  Camera,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  Sun,
  Moon,
  Boxes,
  ClipboardList,
  Users,
  UserPlus,
  UserCheck,
  Shield,
  KeyRound,
  LogOut,
  ArrowRightLeft,
  Calendar,
  Filter,
} from 'lucide-react';
import {
  getPosAdminPin,
  savePosAdminPin,
  verifyPosAdminPin,
  getAdminCredentials,
  saveAdminCredentials,
  getPosUsers,
  savePosUsers,
  addPosUser,
  updatePosUser,
  deletePosUser,
  getActivePosUser,
  setActivePosUser,
  authenticatePosUser,
  canUserEditPrices,
  canUserManageUsers,
  PosUser,
  UserRole,
  DEFAULT_USERS,
} from '@/lib/admin-auth';

interface PosProduct {
  barcode: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  sizeWeight: string;
  imageUrl: string;
  vatRate: number; // 0 for zero-rated UK food, 20 for standard VAT
  active: boolean;
}

interface CartItem {
  barcode: string;
  name: string;
  price: number;
  qty: number;
  vatRate: number;
  sizeWeight: string;
}

interface HeldBill {
  id: string;
  timestamp: string;
  customer: string;
  items: CartItem[];
  total: number;
}

interface StoreInfo {
  name: string;
  branch: string;
  address: string;
  phone: string;
  vatNumber: string;
  currency: string;
  symbol: string;
}

const POPULAR_UK_WHOLESALERS = [
  "7's TRADING LTD",
  "Graviss UK Pvt Ltd",
  "Home Foods Asia Ltd",
  "Kairali Foods Ltd",
  "TRS Wholesale UK",
  "Eastern UK Direct",
  "Air Cargo Direct Imports",
  "Heera Wholesale UK",
  "Natco Foods UK",
  "Double Horse UK Importers",
  "Nirapara UK Distributor",
  "Bakers Wholesale UK",
  "Aachi UK Imports",
  "Malabar Spices Manchester",
];

type PosTab = 'till' | 'purchase' | 'returns' | 'stock_manager' | 'reports' | 'barcode' | 'history';

// Isolated Clock Micro-Component (Prevents entire 8,000-line POS page from re-rendering every 1 second)
function PosLiveClock({ themeMode }: { themeMode: 'light' | 'dark' }) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) +
        ' • ' +
        now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span
      className={`text-[10px] font-mono font-semibold ${
        themeMode === 'light' ? 'text-slate-600' : 'text-slate-400'
      }`}
      suppressHydrationWarning
    >
      {timeStr}
    </span>
  );
}

export default function PosTerminalPage() {
  const [activeTab, setActiveTab] = useState<PosTab>('till');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({
    name: 'Kerala Superstore UK',
    branch: 'Manchester Superstore (Till 01)',
    address: 'Unit 2, 73 Old Market Street, Manchester, M9 8DX',
    phone: '+44 7749 132122',
    vatNumber: 'GB 384 9201 55',
    currency: 'GBP',
    symbol: '£',
  });

  // Till Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cashierName, setCashierName] = useState('Sathya (Cashier)');

  // Theme Mode: Default to 'light' (high-visibility white retail till mode)
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('kss_pos_theme_mode');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setThemeMode(savedTheme);
      }
    } catch {}
  }, []);

  // Sync direct background to prevent white/dark flashes across browser repaint cycles
  useEffect(() => {
    const bg = themeMode === 'light' ? '#f1f5f9' : '#020617';
    if (typeof document !== 'undefined') {
      document.documentElement.style.backgroundColor = bg;
      document.body.classList.remove('pos-dark-active', 'pos-light-active');
      document.body.classList.add(themeMode === 'light' ? 'pos-light-active' : 'pos-dark-active');
    }
  }, [themeMode]);

  const handleToggleTheme = () => {
    if (typeof playBeep === 'function') {
      try { playBeep(750, 'sine', 0.05); } catch {}
    }
    const nextTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(nextTheme);
    try {
      localStorage.setItem('kss_pos_theme_mode', nextTheme);
    } catch {}
  };

  // Payment & Receipt Modals
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [cashGiven, setCashGiven] = useState<string>('');
  const [lastReceipt, setLastReceipt] = useState<any | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // Stock-In (Purchase) State
  const [stockInBarcode, setStockInBarcode] = useState('');
  const [stockInQty, setStockInQty] = useState('10');
  const [stockInSupplier, setStockInSupplier] = useState('');
  const [stockInSellingPrice, setStockInSellingPrice] = useState('');
  const [stockInSuccess, setStockInSuccess] = useState<string | null>(null);

  // Enhanced Supplier & Item Suggestion State
  const [stockInItemSearch, setStockInItemSearch] = useState('');
  const [stockInSuggestionsOpen, setStockInSuggestionsOpen] = useState(false);
  const [selectedStockInProduct, setSelectedStockInProduct] = useState<PosProduct | null>(null);
  const [supplierSuggestionsOpen, setSupplierSuggestionsOpen] = useState(false);
  const [ocrSupplierSuggestionsOpen, setOcrSupplierSuggestionsOpen] = useState(false);
  const [activeSuggestionItemId, setActiveSuggestionItemId] = useState<string | null>(null);
  const [popoverCatalogSearch, setPopoverCatalogSearch] = useState('');

  // OCR Purchase Bill State (Google Gemini AI)
  const [purchaseMode, setPurchaseMode] = useState<'ai_ocr' | 'manual'>('ai_ocr');
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [invoiceImageBase64, setInvoiceImageBase64] = useState<string | null>(null);
  const [invoiceFileName, setInvoiceFileName] = useState<string>('');
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<any | null>(null);
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);
  const [invoiceSuccessMsg, setInvoiceSuccessMsg] = useState<string | null>(null);
  const [showMarginSettings, setShowMarginSettings] = useState(false);

  // Profit Margins State (Category-wise & Default)
  const [defaultMarginPercent, setDefaultMarginPercent] = useState<number>(25);
  const [categoryMargins, setCategoryMargins] = useState<Record<string, number>>({
    'Spices & Masalas': 35,
    'Rice & Flours': 20,
    'Pulses & Dal': 25,
    'Snacks & Bakery': 30,
    'Oils & Ghee': 20,
    'Fish & Meat': 25,
    'Frozen Foods': 28,
    'Tea & Coffee': 25,
    'Household & Toiletries': 35,
    'General Grocery': 25,
  });

  // Sales Return & Refund State
  const [returnSubTab, setReturnSubTab] = useState<'receipt' | 'direct' | 'history'>('receipt');
  const [receiptSearchTerm, setReceiptSearchTerm] = useState('');
  const [isSearchingReceipt, setIsSearchingReceipt] = useState(false);
  const [receiptSearchError, setReceiptSearchError] = useState<string | null>(null);
  const [loadedReceipt, setLoadedReceipt] = useState<any | null>(null);
  const [recentReceiptsList, setRecentReceiptsList] = useState<any[]>([]);

  // Return Basket Items
  const [returnCart, setReturnCart] = useState<Array<{
    barcode: string;
    name: string;
    price: number;
    qty: number;
    maxQty?: number;
    refundAmount: number;
    reason: string;
    condition: 'restockable' | 'damaged_waste';
  }>>([]);

  const [returnRefundMethod, setReturnRefundMethod] = useState<'cash' | 'card' | 'store_credit'>('cash');
  const [returnCustomerName, setReturnCustomerName] = useState('');
  const [returnCustomerPhone, setReturnCustomerPhone] = useState('');
  const [returnNotes, setReturnNotes] = useState('');
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);
  const [lastReturnSlip, setLastReturnSlip] = useState<any | null>(null);
  const [returnSlipModalOpen, setReturnSlipModalOpen] = useState(false);
  const [returnsHistoryList, setReturnsHistoryList] = useState<any[]>([]);
  const [returnsHistoryLoading, setReturnsHistoryLoading] = useState(false);
  const [directReturnSearch, setDirectReturnSearch] = useState('');

  // Admin PIN Protection State (Cashiers cannot edit price/stock without password)
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPinModalOpen, setAdminPinModalOpen] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pendingAdminAction, setPendingAdminAction] = useState<(() => void) | null>(null);
  const [changePinModalOpen, setChangePinModalOpen] = useState(false);
  const [newAdminPin, setNewAdminPin] = useState('');
  const [confirmNewAdminPin, setConfirmNewAdminPin] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState<string | null>(null);

  // Single Product Price & Stock Edit State
  const [editProductModalOpen, setEditProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PosProduct | null>(null);
  const [editPriceMode, setEditPriceMode] = useState<'manual' | 'percent'>('manual');
  const [newPriceInput, setNewPriceInput] = useState<string>('');
  const [percentChangeInput, setPercentChangeInput] = useState<string>('5');
  const [editStockMode, setEditStockMode] = useState<'exact' | 'adjust'>('exact');
  const [newStockInput, setNewStockInput] = useState<string>('');
  const [adjustStockDelta, setAdjustStockDelta] = useState<string>('0');
  const [editReason, setEditReason] = useState<string>('Stock & Price Verification');
  const [isSavingProductEdit, setIsSavingProductEdit] = useState(false);

  // Bulk Category % Price Adjustment State
  const [bulkCategoryModalOpen, setBulkCategoryModalOpen] = useState(false);
  const [bulkCategorySelected, setBulkCategorySelected] = useState<string>('All');
  const [bulkPercentChange, setBulkPercentChange] = useState<string>('5');
  const [bulkRoundTo99p, setBulkRoundTo99p] = useState<boolean>(true);
  const [isProcessingBulkPrice, setIsProcessingBulkPrice] = useState(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  // Stock Manager Filter/Search
  const [stockManagerSearch, setStockManagerSearch] = useState('');
  const [stockManagerCategory, setStockManagerCategory] = useState('All');
  const [stockFilterHealth, setStockFilterHealth] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');

  // Daily Report & Closing Stock State
  const [reportData, setReportData] = useState<any | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [closingStockModalOpen, setClosingStockModalOpen] = useState(false);

  // Total Sales & Closing Stock Sub-tabs & Filter State
  const [reportsSubTab, setReportsSubTab] = useState<'sales' | 'closing_stock'>('sales');
  const [salesPeriod, setSalesPeriod] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [salesSearchQuery, setSalesSearchQuery] = useState('');
  const [salesReportViewMode, setSalesReportViewMode] = useState<'bills' | 'items'>('bills');
  const [billSearchQuery, setBillSearchQuery] = useState('');
  const [salesReportModalOpen, setSalesReportModalOpen] = useState(false);

  // Closing Stock Filter states
  const [closingStockSearchQuery, setClosingStockSearchQuery] = useState('');
  const [closingStockFilterCategory, setClosingStockFilterCategory] = useState('all');
  const [closingStockStatusFilter, setClosingStockStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [closingStockPage, setClosingStockPage] = useState(1);
  const closingStockPageSize = 50;
  const [closingStockA4ModalOpen, setClosingStockA4ModalOpen] = useState(false);
  const [closingStockAuditDate, setClosingStockAuditDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [a4ReportScope, setA4ReportScope] = useState<'low_and_out' | 'all' | 'low_only' | 'out_only'>('low_and_out');

  // POS Multi-User & Admin Credentials Management State
  const [allUsers, setAllUsers] = useState<PosUser[]>(DEFAULT_USERS);
  const [activeUser, setActiveUser] = useState<PosUser>(DEFAULT_USERS[0]);
  const [userSwitchModalOpen, setUserSwitchModalOpen] = useState(false);
  const [switchTargetUser, setSwitchTargetUser] = useState<PosUser | null>(null);
  const [switchSecretInput, setSwitchSecretInput] = useState('');
  const [switchError, setSwitchError] = useState<string | null>(null);

  // Admin & User Settings Modal State
  const [adminManageModalOpen, setAdminManageModalOpen] = useState(false);
  const [adminManageTab, setAdminManageTab] = useState<'creds' | 'users' | 'add_user'>('creds');
  
  // Admin Credentials form
  const [adminFormUsername, setAdminFormUsername] = useState('admin');
  const [adminFormPassword, setAdminFormPassword] = useState('');
  const [adminFormConfirmPassword, setAdminFormConfirmPassword] = useState('');
  const [adminFormPin, setAdminFormPin] = useState('2026');
  const [adminFormSuccess, setAdminFormSuccess] = useState<string | null>(null);
  const [adminFormError, setAdminFormError] = useState<string | null>(null);

  // Add User Form
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserPin, setNewUserPin] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('cashier');
  const [userManageSuccess, setUserManageSuccess] = useState<string | null>(null);
  const [userManageError, setUserManageError] = useState<string | null>(null);

  // Barcode Label Tool State
  const [labelProduct, setLabelProduct] = useState<PosProduct | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Receipt Printer Width (POS-58 default 58mm compact or 80mm standard ESC/POS)
  const [receiptPaperWidth, setReceiptPaperWidth] = useState<'80mm' | '58mm'>('58mm');

  // Cash Drawer State (RJ11 Kick Engine - Only Open on Cash Payments)
  const [cashDrawerModalOpen, setCashDrawerModalOpen] = useState(false);
  const [drawerKickOnCashOnly, setDrawerKickOnCashOnly] = useState(true);
  const [drawerHardwareStatus, setDrawerHardwareStatus] = useState<'ready' | 'connected' | 'unpaired'>('ready');
  const [lastDrawerKickTime, setLastDrawerKickTime] = useState<string | null>(null);
  const [drawerKickNotification, setDrawerKickNotification] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedKick = localStorage.getItem('kss_drawer_cash_only');
      if (savedKick !== null) {
        setDrawerKickOnCashOnly(savedKick !== 'false');
      }
    } catch {}
  }, []);

  const handleToggleDrawerKickMode = (enabled: boolean) => {
    setDrawerKickOnCashOnly(enabled);
    try {
      localStorage.setItem('kss_drawer_cash_only', String(enabled));
    } catch {}
    if (typeof playBeep === 'function') {
      try { playBeep(850, 'sine', 0.08); } catch {}
    }
  };

  // Direct Raw ESC/POS USB Printer Engine (Zero Preview, Instant Hardware Print)
  const printReceiptViaEscPos = async (receipt: any, paperWidth: '80mm' | '58mm' = '58mm') => {
    const w = window as any;
    if (!w.__kss_drawer_serial_port?.writable) return false;

    try {
      const writer = w.__kss_drawer_serial_port.writable.getWriter();
      const enc = new TextEncoder();

      const write = async (bytes: number[] | Uint8Array) => {
        await writer.write(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));
      };

      const writeText = async (text: string) => {
        await writer.write(enc.encode(text));
      };

      // 1. Initialize Printer (ESC @)
      await write([0x1B, 0x40]);

      // 2. Center Align (ESC a 1)
      await write([0x1B, 0x61, 0x01]);

      // Double height & width for store name (ESC ! 0x30)
      await write([0x1B, 0x21, 0x30]);
      await writeText(`${storeInfo.name}\n`);

      // Normal font (ESC ! 0x00)
      await write([0x1B, 0x21, 0x00]);
      await writeText(`${storeInfo.address}\n`);
      await writeText(`Tel: ${storeInfo.phone}\n`);
      await writeText(`VAT: ${storeInfo.vatNumber}\n`);
      await writeText('--------------------------------\n');

      // Left Align (ESC a 0)
      await write([0x1B, 0x61, 0x00]);
      await writeText(`Receipt: ${receipt.receiptNumber}\n`);
      await writeText(`Date: ${receipt.date || new Date().toLocaleString('en-GB')}\n`);
      await writeText(`Cashier: ${receipt.cashier || cashierName}\n`);
      await writeText('--------------------------------\n');

      // Items List
      const maxCol = paperWidth === '80mm' ? 44 : 32;
      for (const it of (receipt.items || [])) {
        const nameQty = `${it.qty}x ${it.name}`;
        const priceStr = `£${(Number(it.price || 0) * Number(it.qty || 1)).toFixed(2)}`;
        const spaces = Math.max(1, maxCol - nameQty.length - priceStr.length);
        if (nameQty.length + priceStr.length < maxCol) {
          await writeText(`${nameQty}${' '.repeat(spaces)}${priceStr}\n`);
        } else {
          await writeText(`${nameQty.slice(0, Math.max(0, maxCol - priceStr.length - 1))} ${priceStr}\n`);
        }
      }

      await writeText('--------------------------------\n');

      // Right Align for Totals (ESC a 2)
      await write([0x1B, 0x61, 0x02]);
      await writeText(`Subtotal: £${Number(receipt.subtotal || receipt.total || 0).toFixed(2)}\n`);
      await writeText(`VAT: £${Number(receipt.vatTotal || 0).toFixed(2)}\n`);

      // Bold for Total (ESC E 1)
      await write([0x1B, 0x45, 0x01]);
      await writeText(`TOTAL PAID: £${Number(receipt.total || 0).toFixed(2)}\n`);
      await write([0x1B, 0x45, 0x00]);

      await writeText(`Payment: ${String(receipt.paymentMethod || 'cash').toUpperCase()}\n`);
      if (receipt.paymentMethod === 'cash' && receipt.changeDue !== undefined) {
        await writeText(`Change Due: £${Number(receipt.changeDue).toFixed(2)}\n`);
      }

      // Center Align Footer
      await write([0x1B, 0x61, 0x01]);
      await writeText('--------------------------------\n');
      await writeText('Bank: Kerala superstore Ltd\n');
      await writeText('SC: 04-00-03  Acc: 44347284\n');
      await writeText('Thank you for shopping!\n');
      await writeText('www.keralasuperstore.com\n\n\n');

      // Cash Drawer Kick if Cash (ESC p 0 25 250)
      if (receipt.paymentMethod === 'cash') {
        await write([0x1B, 0x70, 0x00, 0x19, 0xFA]);
      }

      // Paper Cut (GS V 66 0)
      await write([0x1D, 0x56, 0x42, 0x00]);

      writer.releaseLock();
      playBeep(1200, 'sine', 0.1);
      return true;
    } catch (err) {
      console.warn('ESC/POS direct write error:', err);
      return false;
    }
  };

  // Universal Thermal Receipt Printer Engine (Works on Epson, Star, Munbyn, Bixolon, Windows Drivers)
  // Clean, Zero-Iframe, Zero-Blink, Silent Print Compatible
  const printElementToThermal = (
    elementId: string,
    paperWidth: '80mm' | '58mm' = receiptPaperWidth,
    isCashSale: boolean = false
  ) => {
    if (typeof window === 'undefined') return;

    // 1. If cash payment, trigger drawer kick pulse
    if (isCashSale) {
      triggerCashDrawerKick('cash_sale');
    }

    // 2. Direct WebSerial / WebUSB hardware print if connected (Bypasses browser print preview entirely!)
    const w = window as any;
    if (w.__kss_drawer_serial_port && w.__kss_drawer_serial_port.writable && elementId === 'thermal-receipt-preview' && lastReceipt) {
      printReceiptViaEscPos(lastReceipt, paperWidth).then((success) => {
        if (success) return;
        window.print();
      }).catch(() => {
        window.print();
      });
      return;
    }

    // 3. Clean Browser Print: Zero iframes, no DOM node destruction, no screen blinking!
    // Handled perfectly by @media print in globals.css
    try {
      window.print();
    } catch (err) {
      console.warn('Window print error:', err);
    }
  };

  // ESC/POS Cash Drawer Kick Engine (Opens RJ11 Solenoid via WebUSB / WebSerial / Audio / Control Pulse)
  const triggerCashDrawerKick = async (reason: 'cash_sale' | 'manual' | 'test' = 'cash_sale') => {
    if (reason === 'cash_sale' && !drawerKickOnCashOnly) {
      return;
    }

    try {
      // 1. Audio chime for cash drawer kick
      playBeep(1200, 'sine', 0.12);
      setTimeout(() => playBeep(1800, 'sine', 0.18), 100);

      // 2. Set visual notification on till
      setDrawerKickNotification(
        reason === 'cash_sale'
          ? '💵 Cash Drawer Opened (Cash Payment)'
          : reason === 'manual'
          ? '🔓 Cash Drawer Opened Manually (F12)'
          : '✓ Cash Drawer Test Pulse Sent'
      );
      setTimeout(() => setDrawerKickNotification(null), 3500);
      setLastDrawerKickTime(new Date().toLocaleTimeString('en-GB'));

      // 3. Web Serial API direct kick (if browser supports and port is cached)
      const w = window as any;
      if (w.__kss_drawer_serial_port && w.__kss_drawer_serial_port.writable) {
        try {
          const writer = w.__kss_drawer_serial_port.writable.getWriter();
          // ESC p 0 25 250 (Pin 2 kick)
          await writer.write(new Uint8Array([0x1B, 0x70, 0x00, 0x19, 0xFA]));
          // ESC p 1 25 250 (Pin 5 kick)
          await writer.write(new Uint8Array([0x1B, 0x70, 0x01, 0x19, 0xFA]));
          writer.releaseLock();
          return;
        } catch (e) {
          console.warn('Serial drawer kick write failed:', e);
        }
      }

      // 4. WebUSB direct kick (if browser supports and device is cached)
      if (w.__kss_drawer_usb_device && w.__kss_drawer_usb_device.opened) {
        try {
          await w.__kss_drawer_usb_device.transferOut(1, new Uint8Array([0x1B, 0x70, 0x00, 0x19, 0xFA]));
          return;
        } catch (e) {
          console.warn('USB drawer kick write failed:', e);
        }
      }
    } catch (err) {
      console.warn('Cash drawer trigger error:', err);
    }
  };

  // Pair USB / Serial Thermal Printer for 1-Click Hardware Drawer Kick
  const handlePairHardwarePrinter = async () => {
    const w = window as any;
    try {
      if ('serial' in navigator) {
        const port = await (navigator as any).serial.requestPort();
        await port.open({ baudRate: 9600 });
        w.__kss_drawer_serial_port = port;
        setDrawerHardwareStatus('connected');
        const writer = port.writable.getWriter();
        await writer.write(new Uint8Array([0x1B, 0x70, 0x00, 0x19, 0xFA]));
        writer.releaseLock();
        playBeep(1400, 'sine', 0.2);
        alert('Thermal Printer paired via Serial/USB! Cash drawer test kick sent successfully.');
        return;
      } else if ('usb' in navigator) {
        const device = await (navigator as any).usb.requestDevice({ filters: [] });
        await device.open();
        if (device.configuration === null) await device.selectConfiguration(1);
        await device.claimInterface(0);
        w.__kss_drawer_usb_device = device;
        setDrawerHardwareStatus('connected');
        await device.transferOut(1, new Uint8Array([0x1B, 0x70, 0x00, 0x19, 0xFA]));
        playBeep(1400, 'sine', 0.2);
        alert('Thermal Printer paired via USB! Cash drawer test kick sent successfully.');
        return;
      } else {
        alert('WebUSB / WebSerial is not supported in this browser. Please use Chrome or Edge.');
      }
    } catch (err: any) {
      console.warn('Pair hardware printer error:', err);
      if (err.name !== 'NotFoundError') {
        alert('Could not pair hardware printer: ' + (err.message || err));
      }
    }
  };



  // Audio Beep Generator using Web Audio API
  const playBeep = (freq = 850, type = 'sine', duration = 0.08) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type as any;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio fallback
    }
  };



  // Global F12 Hotkey for opening cash drawer manually
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault();
        triggerCashDrawerKick('manual');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerKickOnCashOnly]);

  // Fetch all 3,000+ Barcodes & Products from Supabase backend
  const fetchTerminalData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pos/terminal');
      if (res.ok) {
        const data = await res.json();
        if (data.products && Array.isArray(data.products)) {
          setProducts(data.products);
          if (data.store) setStoreInfo(data.store);
        }
      }
    } catch (err) {
      console.error('POS fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerminalData();
    try {
      const users = getPosUsers();
      setAllUsers(users);
      const active = getActivePosUser();
      setActiveUser(active);
      setCashierName(`${active.name} (${active.role.toUpperCase()})`);
      const creds = getAdminCredentials();
      setAdminFormUsername(creds.username || 'admin');
      setAdminFormPin(getPosAdminPin());
    } catch (e) {
      console.warn('Error initializing POS users:', e);
    }
  }, []);

  // Live Closing Stock Metrics (Aggregated live across all 3,000+ items)
  const closingStockMetrics = useMemo(() => {
    let totalUnits = 0;
    let totalRetailValue = 0;
    let outOfStockCount = 0;
    let lowStockCount = 0;
    let healthyStockCount = 0;

    const categoryMap: Record<string, { skus: number; units: number; value: number }> = {};
    const lowStockList: PosProduct[] = [];

    products.forEach((p) => {
      const qty = Number(p.stock) || 0;
      const price = Number(p.price) || 0;
      const val = qty * price;

      totalUnits += qty;
      totalRetailValue += val;

      if (qty <= 0) {
        outOfStockCount++;
        lowStockList.push(p);
      } else if (qty <= 5) {
        lowStockCount++;
        lowStockList.push(p);
      } else {
        healthyStockCount++;
      }

      const cat = p.category || 'General Grocery';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { skus: 0, units: 0, value: 0 };
      }
      categoryMap[cat].skus += 1;
      categoryMap[cat].units += qty;
      categoryMap[cat].value += val;
    });

    return {
      totalSkus: products.length,
      totalUnits,
      totalRetailValue,
      outOfStockCount,
      lowStockCount,
      healthyStockCount,
      categoryBreakdown: Object.entries(categoryMap)
        .map(([category, d]) => ({
          category,
          skus: d.skus,
          units: d.units,
          value: d.value,
          pct: totalRetailValue > 0 ? (d.value / totalRetailValue) * 100 : 0,
        }))
        .sort((a, b) => b.value - a.value),
      lowStockList: lowStockList.sort((a, b) => a.stock - b.stock),
    };
  }, [products]);

  // Export Complete Closing Stock in CSV format for Excel/Accountant
  const handleDownloadClosingStockCsv = () => {
    try {
      const headers = ['Barcode', 'Product Name', 'Category', 'Unit Stock', 'Selling Price (GBP)', 'Total Valuation (GBP)'];
      const rows = products.map((p) => [
        `"${p.barcode}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category || 'General Grocery'}"`,
        p.stock,
        p.price.toFixed(2),
        (p.stock * p.price).toFixed(2),
      ]);
      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('href', url);
      link.setAttribute('download', `kerala-superstore-closing-stock-${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (typeof playBeep === 'function') {
        try { playBeep(900, 'sine', 0.1); } catch {}
      }
    } catch {
      alert('Failed to generate Closing Stock CSV.');
    }
  };

  const handlePrintA4ClosingStock = () => {
    try {
      const reportEl = document.getElementById('a4-closing-stock-report');
      if (!reportEl) {
        window.print();
        return;
      }

      // Remove any existing print frame
      const oldFrame = document.getElementById('kss-isolated-print-frame');
      if (oldFrame) oldFrame.remove();

      // Create an offscreen rendered iframe with real dimensions so Chrome's print engine computes pagination instantly
      const iframe = document.createElement('iframe');
      iframe.id = 'kss-isolated-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.top = '0';
      iframe.style.left = '0';
      iframe.style.width = '1024px';
      iframe.style.height = '1024px';
      iframe.style.border = '0';
      iframe.style.opacity = '0.01';
      iframe.style.pointerEvents = 'none';
      iframe.style.zIndex = '-9999';
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document;
      if (!frameDoc) {
        window.print();
        return;
      }

      const reportHtml = reportEl.innerHTML;

      frameDoc.open();
      frameDoc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Closing Stock Audit - ${closingStockAuditDate}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm 10mm 10mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff !important;
      color: #0f172a !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.35;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: auto;
      font-size: 10px;
      margin-top: 6px;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    thead {
      display: table-header-group;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 4px 6px;
      text-align: left;
    }
    th {
      background: #f1f5f9 !important;
      color: #0f172a !important;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 9.5px;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .font-bold { font-weight: 700; }
    .font-black { font-weight: 900; }
    .text-emerald-950 { color: #022c22 !important; }
    .text-emerald-900 { color: #064e3b !important; }
    .text-emerald-800 { color: #065f46 !important; }
    .text-slate-900 { color: #0f172a !important; }
    .text-slate-950 { color: #020617 !important; }
    .text-slate-700 { color: #334155 !important; }
    .text-slate-600 { color: #475569 !important; }
    .text-slate-500 { color: #64748b !important; }
    .bg-emerald-50 { background-color: #ecfdf5 !important; }
    .border-emerald-200 { border-color: #a7f3d0 !important; }
    .bg-slate-50 { background-color: #f8fafc !important; }
    .border-slate-200 { border-color: #e2e8f0 !important; }
    .bg-blue-50 { background-color: #eff6ff !important; }
    .border-blue-200 { border-color: #bfdbfe !important; }
    .bg-amber-50 { background-color: #fffbeb !important; }
    .border-amber-200 { border-color: #fde68a !important; }
    .bg-rose-50 { background-color: #fff1f2 !important; }
    .border-rose-200 { border-color: #fecdd3 !important; }
    .bg-slate-900 { background-color: #0f172a !important; color: #ffffff !important; }
    .border-slate-900 { border-color: #0f172a !important; }
    .border-b-2 { border-bottom-width: 2px !important; }
    .grid { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
    .grid > div { flex: 1 1 14%; min-width: 90px; }
    img { max-height: 48px; object-fit: contain; }
  </style>
</head>
<body>
  ${reportHtml}
</body>
</html>`);
      frameDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          window.print();
        }
        setTimeout(() => {
          const el = document.getElementById('kss-isolated-print-frame');
          if (el) el.remove();
        }, 60000);
      }, 350);
    } catch (e) {
      console.error('Error in iframe print, falling back:', e);
      window.print();
    }
  };

  const handleSaveClosingStockHtmlDocument = () => {
    try {
      const reportEl = document.getElementById('a4-closing-stock-report');
      if (!reportEl) return;
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Kerala Superstore - Closing Stock Audit (${closingStockAuditDate})</title>
  <style>
    @page { size: A4 portrait; margin: 8mm 10mm 10mm 10mm; }
    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fff; color: #0f172a; margin: 0; padding: 20px; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px; }
    th, td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; }
    th { background: #f1f5f9; font-weight: 800; text-transform: uppercase; font-size: 9.5px; color: #1e293b; }
    tr { page-break-inside: avoid; }
    thead { display: table-header-group; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-mono { font-family: monospace; }
    .font-bold { font-weight: 700; }
    .font-black { font-weight: 900; }
    .grid { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
    .grid > div { flex: 1 1 14%; min-width: 90px; }
    img { max-height: 48px; object-fit: contain; }
  </style>
</head>
<body>
  ${reportEl.innerHTML}
  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kerala-superstore-closing-stock-${closingStockAuditDate}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error saving report HTML:', e);
    }
  };

  // Filtered Closing Stock Items for Full Table View
  const filteredClosingStockItems = useMemo(() => {
    return products.filter((p) => {
      if (closingStockFilterCategory !== 'all' && p.category !== closingStockFilterCategory) {
        return false;
      }
      if (closingStockStatusFilter === 'in_stock' && p.stock <= 5) return false;
      if (closingStockStatusFilter === 'low_stock' && (p.stock <= 0 || p.stock > 5)) return false;
      if (closingStockStatusFilter === 'out_of_stock' && p.stock > 0) return false;
      if (closingStockSearchQuery.trim()) {
        const q = closingStockSearchQuery.trim().toLowerCase();
        const mName = p.name.toLowerCase().includes(q);
        const mBc = p.barcode.toLowerCase().includes(q);
        const mCat = (p.category || '').toLowerCase().includes(q);
        if (!mName && !mBc && !mCat) return false;
      }
      return true;
    });
  }, [products, closingStockFilterCategory, closingStockStatusFilter, closingStockSearchQuery]);

  // Items rendered in the A4 Report Ledger based on user scope
  const a4LedgerItems = useMemo(() => {
    return products.filter((p) => {
      if (closingStockFilterCategory !== 'all' && p.category !== closingStockFilterCategory) {
        return false;
      }
      if (a4ReportScope === 'low_and_out') {
        return p.stock <= 5;
      }
      if (a4ReportScope === 'low_only') {
        return p.stock > 0 && p.stock <= 5;
      }
      if (a4ReportScope === 'out_only') {
        return p.stock <= 0;
      }
      return true;
    });
  }, [products, closingStockFilterCategory, a4ReportScope]);

  const closingStockTotalPages = Math.max(1, Math.ceil(filteredClosingStockItems.length / closingStockPageSize));
  const paginatedClosingStockItems = useMemo(() => {
    const start = (closingStockPage - 1) * closingStockPageSize;
    return filteredClosingStockItems.slice(start, start + closingStockPageSize);
  }, [filteredClosingStockItems, closingStockPage]);

  // Unique categories list
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  // Aggregate bills for the report period (with local storage backup)
  const reportBills = useMemo(() => {
    const list: any[] = [];
    const seen = new Set<string>();

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const matchesCurrentPeriod = (ts?: string) => {
      if (!ts) return false;
      const dStr = String(ts).split('T')[0];
      const d = new Date(ts);
      if (salesPeriod === 'today') return dStr === todayStr || String(ts).includes(now.toLocaleDateString('en-GB'));
      if (salesPeriod === 'yesterday') return dStr === yesterdayStr;
      if (salesPeriod === 'week') return !isNaN(d.getTime()) && d >= sevenDaysAgo;
      if (salesPeriod === 'month') return !isNaN(d.getTime()) && d >= thirtyDaysAgo;
      if (salesPeriod === 'all') return true;
      if (salesPeriod === 'custom' && customStartDate) {
        const to = customEndDate || todayStr;
        return dStr >= customStartDate && dStr <= to;
      }
      return dStr === todayStr;
    };

    if (reportData && Array.isArray(reportData.recentTransactions)) {
      reportData.recentTransactions.forEach((tx: any) => {
        const id = tx.receiptNumber || tx.id;
        if (id && !seen.has(id)) {
          seen.add(id);
          list.push(tx);
        }
      });
    }

    if (typeof window !== 'undefined') {
      try {
        const localSaved = JSON.parse(localStorage.getItem('kss_pos_saved_receipts') || '[]');
        if (Array.isArray(localSaved)) {
          localSaved.forEach((tx: any) => {
            const id = tx.receiptNumber || tx.id;
            if (id && !seen.has(id)) {
              seen.add(id);
              list.push(tx);
            }
          });
        }
      } catch {}
    }

    const filtered = list.filter((b) => matchesCurrentPeriod(b.timestamp || b.date));
    return filtered.sort((a, b) => {
      const ta = new Date(a.timestamp || a.date || 0).getTime();
      const tb = new Date(b.timestamp || b.date || 0).getTime();
      return tb - ta;
    });
  }, [reportData, salesPeriod, customStartDate, customEndDate]);

  // Quantity and revenue sold per barcode on the selected Closing Stock Audit Date
  const dateSoldMap = useMemo(() => {
    const map: Record<string, { qty: number; revenue: number }> = {};
    if (!reportBills || !Array.isArray(reportBills)) return map;

    reportBills.forEach((b: any) => {
      const bDate = b.timestamp
        ? String(b.timestamp).split('T')[0]
        : (b.date ? String(b.date).split('T')[0] : '');
      if (bDate === closingStockAuditDate) {
        if (Array.isArray(b.items)) {
          b.items.forEach((it: any) => {
            const bc = String(it.barcode || it.sku || it.name || '').trim();
            if (bc) {
              const q = Number(it.qty) || 1;
              const rev = Number(it.total) || (Number(it.price) * q) || 0;
              if (!map[bc]) map[bc] = { qty: 0, revenue: 0 };
              map[bc].qty += q;
              map[bc].revenue += rev;
            }
          });
        }
      }
    });

    return map;
  }, [reportBills, closingStockAuditDate]);

  const totalSoldOnDate = useMemo(() => {
    return Object.values(dateSoldMap).reduce((acc, curr) => acc + curr.qty, 0);
  }, [dateSoldMap]);

  // Load Total Sales & Period Report
  const fetchReport = async (periodOverride?: string, fromDate?: string, toDate?: string) => {
    if (activeTab === 'reports') {
      setLoadingReport(true);
    }
    try {
      const p = periodOverride || salesPeriod;
      let url = `/api/pos/terminal?action=report&period=${p}`;
      if (p === 'custom') {
        const from = fromDate || customStartDate;
        const to = toDate || customEndDate;
        if (from) url += `&fromDate=${encodeURIComponent(from)}`;
        if (to) url += `&toDate=${encodeURIComponent(to)}`;
      }
      let serverData: any = null;
      try {
        const res = await fetch(url);
        if (res.ok) {
          serverData = await res.json();
        }
      } catch (e) {
        console.warn('Server report fetch error, calculating from local receipts:', e);
      }

      // Merge local sales receipts & returns stored on this counter terminal
      let localReceipts: any[] = [];
      let localReturns: any[] = [];
      try {
        localReceipts = JSON.parse(localStorage.getItem('kss_pos_saved_receipts') || '[]');
        localReturns = JSON.parse(localStorage.getItem('kss_pos_saved_returns') || '[]');
      } catch {}

      // Period matching helpers
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const yesterdayDate = new Date(now);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const matchesPeriod = (ts?: string) => {
        if (!ts) return false;
        const dStr = String(ts).split('T')[0];
        const d = new Date(ts);
        if (p === 'today') return dStr === todayStr || String(ts).includes(now.toLocaleDateString('en-GB'));
        if (p === 'yesterday') return dStr === yesterdayStr;
        if (p === 'week') return !isNaN(d.getTime()) && d >= sevenDaysAgo;
        if (p === 'month') return !isNaN(d.getTime()) && d >= thirtyDaysAgo;
        if (p === 'all') return true;
        if (p === 'custom' && fromDate) {
          const to = toDate || todayStr;
          return dStr >= fromDate && dStr <= to;
        }
        return dStr === todayStr;
      };

      // 1. Merge transactions (de-duplicated)
      const allTxMap = new Map<string, any>();
      if (serverData?.recentTransactions && Array.isArray(serverData.recentTransactions)) {
        serverData.recentTransactions.forEach((tx: any) => {
          const key = tx.receiptNumber || tx.id;
          if (key) allTxMap.set(key, tx);
        });
      }
      localReceipts.forEach((r: any) => {
        const key = r.receiptNumber || r.id;
        if (key) allTxMap.set(key, r);
      });

      const periodTxs = Array.from(allTxMap.values()).filter((t: any) => matchesPeriod(t.timestamp || t.date));

      // 2. Merge returns (de-duplicated)
      const allRetMap = new Map<string, any>();
      if (serverData?.returns && Array.isArray(serverData.returns)) {
        serverData.returns.forEach((ret: any) => {
          const key = ret.returnSlipNumber || ret.id;
          if (key) allRetMap.set(key, ret);
        });
      }
      localReturns.forEach((ret: any) => {
        const key = ret.returnSlipNumber || ret.id;
        if (key) allRetMap.set(key, ret);
      });

      const periodReturns = Array.from(allRetMap.values()).filter((r: any) => matchesPeriod(r.timestamp || r.date));

      // 3. Calculate financial totals with full Cash vs Card breakdown
      let cashSales = 0;
      let cardSales = 0;
      let totalSales = 0;
      let vatCollected = 0;
      let cashOrdersCount = 0;
      let cardOrdersCount = 0;

      const itemSalesMap: Record<string, { barcode: string; name: string; qty: number; revenue: number; price: number }> = {};

      periodTxs.forEach((tx: any) => {
        const tTotal = Number(tx.total) || 0;
        const tVat = Number(tx.vatTotal) || 0;
        const method = String(tx.paymentMethod || 'cash').toLowerCase();

        totalSales += tTotal;
        vatCollected += tVat;

        if (method === 'card') {
          cardSales += tTotal;
          cardOrdersCount++;
        } else {
          cashSales += tTotal;
          cashOrdersCount++;
        }

        if (Array.isArray(tx.items)) {
          tx.items.forEach((it: any) => {
            const bc = String(it.barcode || it.sku || it.name || 'item');
            const qty = Number(it.qty) || 1;
            const rev = Number(it.total) || (Number(it.price) * qty) || 0;
            if (!itemSalesMap[bc]) {
              itemSalesMap[bc] = {
                barcode: bc,
                name: it.name || 'Product',
                qty: 0,
                revenue: 0,
                price: Number(it.price) || 0,
              };
            }
            itemSalesMap[bc].qty += qty;
            itemSalesMap[bc].revenue += rev;
          });
        }
      });

      let cashRefunds = 0;
      let cardRefunds = 0;
      let totalRefunds = 0;
      let cashRefundsCount = 0;
      let cardRefundsCount = 0;

      periodReturns.forEach((r: any) => {
        const refAmt = Number(r.totalRefund || r.refundAmount) || 0;
        const refMethod = String(r.refundMethod || 'cash').toLowerCase();
        totalRefunds += refAmt;
        if (refMethod === 'card') {
          cardRefunds += refAmt;
          cardRefundsCount++;
        } else {
          cashRefunds += refAmt;
          cashRefundsCount++;
        }
      });

      const netSales = Math.max(0, totalSales - totalRefunds);
      const netCash = cashSales - cashRefunds;
      const netCard = cardSales - cardRefunds;
      const transactionCount = periodTxs.length;
      const returnCount = periodReturns.length;
      const averageBasket = transactionCount > 0 ? totalSales / transactionCount : 0;

      const allSoldItems = Object.values(itemSalesMap).sort((a, b) => b.revenue - a.revenue);
      const topItems = allSoldItems.slice(0, 10);

      const periodLabels: Record<string, string> = {
        today: 'Today',
        yesterday: 'Yesterday',
        week: 'This Week (Last 7 Days)',
        month: 'This Month (Last 30 Days)',
        all: 'All Time Total',
        custom: `Custom (${fromDate || ''} - ${toDate || todayStr})`,
      };

      setReportData({
        success: true,
        period: p,
        periodLabel: periodLabels[p] || 'Today',
        totalSales: Math.round(totalSales * 100) / 100,
        cashSales: Math.round(cashSales * 100) / 100,
        cardSales: Math.round(cardSales * 100) / 100,
        cashOrdersCount,
        cardOrdersCount,
        totalRefunds: Math.round(totalRefunds * 100) / 100,
        cashRefunds: Math.round(cashRefunds * 100) / 100,
        cardRefunds: Math.round(cardRefunds * 100) / 100,
        cashRefundsCount,
        cardRefundsCount,
        netSales: Math.round(netSales * 100) / 100,
        netCash: Math.round(netCash * 100) / 100,
        netCard: Math.round(netCard * 100) / 100,
        transactionCount,
        returnCount,
        averageBasket: Math.round(averageBasket * 100) / 100,
        vatCollected: Math.round(vatCollected * 100) / 100,
        allSoldItems,
        topItems,
        recentTransactions: periodTxs.slice(0, 100),
        returns: periodReturns.slice(0, 100),
        closingStockSkus: serverData?.closingStockSkus || products.length,
        closingStockUnits: serverData?.closingStockUnits,
        closingStockRetailValue: serverData?.closingStockRetailValue,
        outOfStockCount: serverData?.outOfStockCount,
        lowStockCount: serverData?.lowStockCount,
      });
    } catch (err) {
      console.error('Report fetch error:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  const fetchDailyReport = () => fetchReport();




  // Export Total Sales to CSV
  const handleDownloadSalesCsv = () => {
    if (!reportData) return;
    try {
      const rows = [
        ['Kerala Superstore UK - Total Sales & Turnover Report'],
        ['Report Period', reportData.periodLabel || salesPeriod],
        ['Generated At', new Date().toLocaleString('en-GB')],
        [''],
        ['SUMMARY METRIC', 'AMOUNT / COUNT'],
        ['Gross Sales (£)', (reportData.totalSales || 0).toFixed(2)],
        ['Sales Returns (£)', (reportData.totalRefunds || 0).toFixed(2)],
        ['Net Sales (£)', (reportData.netSales || 0).toFixed(2)],
        ['Cash in Till (£)', (reportData.netCash || 0).toFixed(2)],
        ['Card Machine Total (£)', (reportData.netCard || 0).toFixed(2)],
        ['Total Orders', String(reportData.transactionCount || 0)],
        ['Return Slips', String(reportData.returnCount || 0)],
        ['Average Basket (£)', (reportData.averageBasket || 0).toFixed(2)],
        ['VAT Collected (£)', (reportData.vatCollected || 0).toFixed(2)],
        [''],
        ['PRODUCT SALES RANKING'],
        ['Barcode', 'Product Name', 'Units Sold', 'Unit Price (£)', 'Total Revenue (£)'],
      ];

      const items = reportData.allSoldItems || reportData.topItems || [];
      items.forEach((it: any) => {
        rows.push([
          `"${it.barcode}"`,
          `"${(it.name || '').replace(/"/g, '""')}"`,
          String(it.qty),
          Number(it.price || 0).toFixed(2),
          Number(it.revenue || 0).toFixed(2),
        ]);
      });

      const csvContent = rows.map((r) => r.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `kss-sales-${salesPeriod}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (typeof playBeep === 'function') {
        try { playBeep(900, 'sine', 0.1); } catch {}
      }
    } catch {
      alert('Failed to export Sales CSV.');
    }
  };

  // Reprint Previous Sale Receipt from Report or History
  const handleReprintReceipt = (tx: any) => {
    try {
      if (typeof playBeep === 'function') {
        try { playBeep(900, 'sine', 0.1); } catch {}
      }
      const formattedItems = (tx.items || []).map((it: any) => ({
        barcode: it.barcode || '',
        name: it.name || it.productName || 'Item',
        price: Number(it.price) || 0,
        qty: Number(it.qty) || Number(it.quantity) || 1,
        vatRate: Number(it.vatRate) || 0,
        sizeWeight: it.sizeWeight || 'Standard',
      }));

      setLastReceipt({
        receiptNumber: tx.receiptNumber || `KSS-${Date.now().toString().slice(-6)}`,
        date: tx.timestamp ? new Date(tx.timestamp).toLocaleString('en-GB') : (tx.date || new Date().toLocaleString('en-GB')),
        cashier: tx.cashier || cashierName,
        items: formattedItems,
        subtotal: Number(tx.subtotal) || Number(tx.total) || 0,
        vatTotal: Number(tx.vatTotal) || 0,
        total: Number(tx.total) || 0,
        paymentMethod: tx.paymentMethod || 'cash',
        cashGiven: tx.cashTendered !== undefined ? Number(tx.cashTendered) : Number(tx.total),
        changeDue: tx.changeDue !== undefined ? Number(tx.changeDue) : 0,
      });
      setReceiptModalOpen(true);
    } catch (err) {
      console.error('Reprint receipt error:', err);
    }
  };

  // Delete an individual test bill from local storage & cloud persistence
  const handleDeleteBill = async (receiptNum: string) => {
    if (!receiptNum) return;
    const ok = window.confirm(`ഈ ബിൽ (${receiptNum}) സ്ഥിരമായി ഡിലീറ്റ് ചെയ്യണോ?\n(Delete this bill permanently?)`);
    if (!ok) return;

    try {
      const localSaved = JSON.parse(localStorage.getItem('kss_pos_saved_receipts') || '[]');
      const updated = localSaved.filter((r: any) => r.receiptNumber !== receiptNum && r.id !== receiptNum);
      localStorage.setItem('kss_pos_saved_receipts', JSON.stringify(updated));
    } catch {}

    try {
      await fetch('/api/pos/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_transaction', receiptNumber: receiptNum }),
      });
    } catch (err) {
      console.warn('Server delete notice:', err);
    }

    if (typeof playBeep === 'function') {
      try { playBeep(500, 'sine', 0.1); } catch {}
    }

    await fetchReport();
  };

  // Clear all sample test bills from local storage & cloud persistence
  const handleClearAllTestBills = async () => {
    const ok = window.confirm('എല്ലാ സാമ്പിൾ/ടെസ്റ്റ് ബില്ലുകളും പൂർണ്ണമായി ഡിലീറ്റ് ചെയ്യണോ?\n(Clear all test/sample sales bills?)');
    if (!ok) return;

    try {
      localStorage.removeItem('kss_pos_saved_receipts');
    } catch {}

    try {
      await fetch('/api/pos/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_all_transactions' }),
      });
    } catch (err) {
      console.warn('Server clear notice:', err);
    }

    if (typeof playBeep === 'function') {
      try { playBeep(450, 'sine', 0.15); } catch {}
    }

    await fetchReport();
  };

  // User Management Operations
  const handleConfirmSwitchUser = () => {
    if (!switchTargetUser) return;
    const cleanSecret = switchSecretInput.trim();
    if (!cleanSecret) {
      setSwitchError('Please enter user PIN or Password.');
      return;
    }
    if (
      switchTargetUser.pin === cleanSecret ||
      switchTargetUser.password === cleanSecret ||
      verifyPosAdminPin(cleanSecret)
    ) {
      playBeep(950, 'sine', 0.1);
      setActiveUser(switchTargetUser);
      setActivePosUser(switchTargetUser);
      setCashierName(`${switchTargetUser.name} (${switchTargetUser.role.toUpperCase()})`);
      setSearchQuery('');
      setSelectedCategory('All');
      setUserSwitchModalOpen(false);
      setSwitchTargetUser(null);
      setSwitchSecretInput('');
      setSwitchError(null);
    } else {
      playBeep(350, 'sawtooth', 0.2);
      setSwitchError('Incorrect PIN or Password for this user.');
    }
  };

  const handleSaveAdminCreds = () => {
    setAdminFormError(null);
    setAdminFormSuccess(null);
    if (!adminFormUsername.trim()) {
      setAdminFormError('Admin username cannot be empty.');
      return;
    }
    if (adminFormPassword && adminFormPassword !== adminFormConfirmPassword) {
      setAdminFormError('Passwords do not match.');
      return;
    }
    if (adminFormPin && adminFormPin.length < 3) {
      setAdminFormError('PIN must be at least 3 digits.');
      return;
    }
    try {
      if (adminFormPassword) {
        saveAdminCredentials(adminFormUsername.trim(), adminFormPassword.trim());
      }
      if (adminFormPin) {
        savePosAdminPin(adminFormPin.trim());
      }
      setAllUsers(getPosUsers());
      playBeep(1000, 'sine', 0.15);
      setAdminFormSuccess('Admin credentials & PIN updated successfully!');
      setTimeout(() => setAdminFormSuccess(null), 3000);
    } catch (e: any) {
      setAdminFormError(e?.message || 'Failed to update credentials.');
    }
  };

  const handleAddNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserManageError(null);
    setUserManageSuccess(null);
    if (!newUserName.trim() || !newUserUsername.trim()) {
      setUserManageError('Name and Username are required.');
      return;
    }
    try {
      const created = addPosUser({
        name: newUserName,
        username: newUserUsername,
        password: newUserPassword || newUserPin || '1234',
        pin: newUserPin || '1234',
        role: newUserRole,
      });
      setAllUsers(getPosUsers());
      playBeep(1000, 'sine', 0.15);
      setUserManageSuccess(`User "${created.name}" created successfully!`);
      setNewUserName('');
      setNewUserUsername('');
      setNewUserPassword('');
      setNewUserPin('');
      setNewUserRole('cashier');
      setTimeout(() => {
        setUserManageSuccess(null);
        setAdminManageTab('users');
      }, 1500);
    } catch (err: any) {
      setUserManageError(err?.message || 'Failed to create user.');
    }
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete user "${name}"?`)) return;
    try {
      deletePosUser(id);
      setAllUsers(getPosUsers());
      setActiveUser(getActivePosUser());
      playBeep(800, 'sine', 0.1);
    } catch (e: any) {
      alert(e?.message || 'Cannot delete user.');
    }
  };

  const handleOpenUserManagement = () => {
    if (canUserManageUsers(activeUser)) {
      setAdminManageModalOpen(true);
    } else {
      requireAdminAuth(() => setAdminManageModalOpen(true));
    }
  };

  // Fetch recent receipts for returns selection
  const fetchRecentReceipts = async () => {
    try {
      const res = await fetch('/api/pos/terminal?action=recent_receipts');
      if (res.ok) {
        const data = await res.json();
        if (data.receipts) setRecentReceiptsList(data.receipts);
      }
    } catch (e) {
      console.warn('Failed to load recent receipts:', e);
    }
  };

  // Fetch returns history
  const fetchReturnsHistory = async () => {
    setReturnsHistoryLoading(true);
    try {
      const res = await fetch('/api/pos/terminal?action=returns_history');
      if (res.ok) {
        const data = await res.json();
        if (data.returns) setReturnsHistoryList(data.returns);
      }
    } catch (e) {
      console.warn('Failed to load returns history:', e);
    } finally {
      setReturnsHistoryLoading(false);
    }
  };

  // Lookup receipt by number
  const handleLookupReceipt = async (receiptNumToSearch?: string) => {
    const term = (receiptNumToSearch || receiptSearchTerm).trim();
    if (!term) {
      setReceiptSearchError('Please enter or scan a Receipt Number (e.g. KSS-123456).');
      return;
    }
    setIsSearchingReceipt(true);
    setReceiptSearchError(null);
    try {
      const res = await fetch(`/api/pos/terminal?action=lookup_receipt&receiptNumber=${encodeURIComponent(term)}`);
      const data = await res.json();
      if (res.ok && data.success && data.transaction) {
        setLoadedReceipt(data.transaction);
        playBeep(950, 'sine', 0.1);
        setReturnCart([]);
      } else {
        setReceiptSearchError(data.error || `Receipt "${term}" not found.`);
        setLoadedReceipt(null);
        playBeep(350, 'sawtooth', 0.2);
      }
    } catch (err: any) {
      setReceiptSearchError(err?.message || 'Error looking up receipt.');
      playBeep(350, 'sawtooth', 0.2);
    } finally {
      setIsSearchingReceipt(false);
    }
  };

  // Toggle item from loaded receipt into returnCart
  const handleToggleReturnItemFromReceipt = (receiptItem: any) => {
    const existing = returnCart.find((i) => i.barcode === receiptItem.barcode);
    if (existing) {
      setReturnCart((prev) => prev.filter((i) => i.barcode !== receiptItem.barcode));
    } else {
      setReturnCart((prev) => [
        ...prev,
        {
          barcode: receiptItem.barcode,
          name: receiptItem.name,
          price: Number(receiptItem.price) || 0,
          qty: 1,
          maxQty: Number(receiptItem.qty) || 1,
          refundAmount: Number(receiptItem.price) || 0,
          reason: 'Wrong Item Purchased',
          condition: 'restockable',
        },
      ]);
    }
  };

  // Direct add product into returnCart
  const handleDirectAddReturnItem = (product: PosProduct) => {
    playBeep(850, 'sine', 0.05);
    const existing = returnCart.find((i) => i.barcode === product.barcode);
    if (existing) {
      setReturnCart((prev) =>
        prev.map((i) =>
          i.barcode === product.barcode
            ? {
                ...i,
                qty: i.qty + 1,
                refundAmount: Math.round((i.qty + 1) * i.price * 100) / 100,
              }
            : i
        )
      );
    } else {
      setReturnCart((prev) => [
        ...prev,
        {
          barcode: product.barcode,
          name: product.name,
          price: product.price,
          qty: 1,
          maxQty: 999,
          refundAmount: product.price,
          reason: 'Customer Return',
          condition: 'restockable',
        },
      ]);
    }
    setDirectReturnSearch('');
  };

  // Update return item quantity
  const handleUpdateReturnQty = (barcode: string, newQty: number) => {
    setReturnCart((prev) =>
      prev.map((i) => {
        if (i.barcode === barcode) {
          const validatedQty = Math.max(1, i.maxQty ? Math.min(newQty, i.maxQty) : newQty);
          return {
            ...i,
            qty: validatedQty,
            refundAmount: Math.round(validatedQty * i.price * 100) / 100,
          };
        }
        return i;
      })
    );
  };

  // Update return item price
  const handleUpdateReturnPrice = (barcode: string, newPrice: number) => {
    setReturnCart((prev) =>
      prev.map((i) => {
        if (i.barcode === barcode) {
          return {
            ...i,
            price: newPrice,
            refundAmount: Math.round(i.qty * newPrice * 100) / 100,
          };
        }
        return i;
      })
    );
  };

  // Update return item reason
  const handleUpdateReturnReason = (barcode: string, reason: string) => {
    setReturnCart((prev) => prev.map((i) => (i.barcode === barcode ? { ...i, reason } : i)));
  };

  // Update return item condition
  const handleUpdateReturnCondition = (barcode: string, condition: 'restockable' | 'damaged_waste') => {
    setReturnCart((prev) => prev.map((i) => (i.barcode === barcode ? { ...i, condition } : i)));
  };

  // Remove return item from cart
  const handleRemoveReturnItem = (barcode: string) => {
    setReturnCart((prev) => prev.filter((i) => i.barcode !== barcode));
  };

  // Total refund calculation
  const totalReturnRefund = useMemo(() => {
    return returnCart.reduce((sum, i) => sum + (Number(i.refundAmount) || 0), 0);
  }, [returnCart]);

  // Submit return to backend
  const handleProcessSalesReturn = async () => {
    if (returnCart.length === 0) {
      alert('Please add at least one item to return.');
      return;
    }
    setIsProcessingReturn(true);
    try {
      const res = await fetch('/api/pos/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sales_return',
          originalReceiptNumber: loadedReceipt ? loadedReceipt.receiptNumber : 'DIRECT-RETURN',
          items: returnCart,
          refundMethod: returnRefundMethod,
          totalRefund: totalReturnRefund,
          customerName: returnCustomerName,
          customerPhone: returnCustomerPhone,
          notes: returnNotes,
          cashier: cashierName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        playBeep(1100, 'sine', 0.25);
        const slipData = {
          ...data.returnSlip,
          returnSlipNumber: data.returnSlip?.returnSlipNumber || `RET-${Date.now().toString().slice(-6)}`,
          date: new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          timestamp: new Date().toISOString(),
          refundMethod: returnRefundMethod,
          totalRefund: totalReturnRefund,
          items: [...returnCart],
          cashier: cashierName,
        };

        try {
          const existingRet = JSON.parse(localStorage.getItem('kss_pos_saved_returns') || '[]');
          const updatedRet = [slipData, ...existingRet.filter((r: any) => r.returnSlipNumber !== slipData.returnSlipNumber)].slice(0, 100);
          localStorage.setItem('kss_pos_saved_returns', JSON.stringify(updatedRet));
        } catch {}

        setLastReturnSlip(slipData);
        setReturnSlipModalOpen(true);
        fetchTerminalData();
        fetchReturnsHistory();
        fetchDailyReport();
        setReturnCart([]);
        setLoadedReceipt(null);
        setReceiptSearchTerm('');
        setReturnCustomerName('');
        setReturnCustomerPhone('');
        setReturnNotes('');
      } else {
        alert(data.error || 'Failed to process sales return.');
        playBeep(350, 'sawtooth', 0.2);
      }
    } catch (err: any) {
      alert(err?.message || 'Network error processing sales return.');
    } finally {
      setIsProcessingReturn(false);
    }
  };

  // Admin PIN Protection Helpers
  const requireAdminAuth = (actionCallback: () => void) => {
    if (isAdminUnlocked) {
      actionCallback();
    } else {
      setEnteredPin('');
      setPinError(null);
      setPendingAdminAction(() => actionCallback);
      setAdminPinModalOpen(true);
    }
  };

  const handleVerifyPin = () => {
    if (verifyPosAdminPin(enteredPin)) {
      playBeep(1000, 'sine', 0.15);
      setIsAdminUnlocked(true);
      setAdminPinModalOpen(false);
      setPinError(null);
      if (pendingAdminAction) {
        pendingAdminAction();
        setPendingAdminAction(null);
      }
    } else {
      playBeep(350, 'sawtooth', 0.2);
      setPinError('Invalid Admin PIN or Password. Access Denied.');
    }
  };

  const handleLockAdminMode = () => {
    setIsAdminUnlocked(false);
    playBeep(500, 'sine', 0.1);
  };

  const handleSaveNewPin = () => {
    if (!newAdminPin || newAdminPin.length < 3) {
      alert('PIN must be at least 3 digits/characters.');
      return;
    }
    if (newAdminPin !== confirmNewAdminPin) {
      alert('PINs do not match. Please verify.');
      return;
    }
    if (savePosAdminPin(newAdminPin)) {
      playBeep(1000, 'sine', 0.15);
      setPinChangeSuccess('Admin PIN successfully updated!');
      setTimeout(() => {
        setChangePinModalOpen(false);
        setNewAdminPin('');
        setConfirmNewAdminPin('');
        setPinChangeSuccess(null);
      }, 1500);
    } else {
      alert('Failed to save PIN.');
    }
  };

  // Open Product Edit Modal (Protected by Admin PIN)
  const openProductEditModal = (product: PosProduct) => {
    if (!canUserEditPrices(activeUser)) {
      requireAdminAuth(() => proceedOpenProductEditModal(product));
      return;
    }
    proceedOpenProductEditModal(product);
  };

  const proceedOpenProductEditModal = (product: PosProduct) => {
    setEditingProduct(product);
    setEditPriceMode('manual');
    setNewPriceInput(product.price.toFixed(2));
    setPercentChangeInput('5');
    setEditStockMode('exact');
    setNewStockInput(String(product.stock));
    setAdjustStockDelta('0');
    setEditReason('Stock & Price Verification');
    setEditProductModalOpen(true);
  };

  // Save Product Price & Stock Edit
  const handleSaveProductEdit = async () => {
    if (!editingProduct) return;
    setIsSavingProductEdit(true);

    let finalPrice = editingProduct.price;
    if (editPriceMode === 'manual') {
      const p = parseFloat(newPriceInput);
      if (!isNaN(p) && p >= 0) finalPrice = p;
    } else {
      const pct = parseFloat(percentChangeInput);
      if (!isNaN(pct)) {
        finalPrice = Math.max(0.05, Math.round(editingProduct.price * (1 + pct / 100) * 100) / 100);
      }
    }

    let finalStock = editingProduct.stock;
    if (editStockMode === 'exact') {
      const s = parseInt(newStockInput);
      if (!isNaN(s) && s >= 0) finalStock = s;
    } else {
      const delta = parseInt(adjustStockDelta);
      if (!isNaN(delta)) {
        finalStock = Math.max(0, editingProduct.stock + delta);
      }
    }

    try {
      const res = await fetch('/api/pos/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_product_price_stock',
          barcode: editingProduct.barcode,
          newPrice: finalPrice,
          newStock: finalStock,
          reason: editReason,
          cashier: cashierName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        playBeep(1100, 'sine', 0.2);
        setProducts((prev) =>
          prev.map((p) =>
            p.barcode === editingProduct.barcode
              ? { ...p, price: finalPrice, stock: finalStock }
              : p
          )
        );
        setCart((prev) =>
          prev.map((c) =>
            c.barcode === editingProduct.barcode ? { ...c, price: finalPrice } : c
          )
        );
        setEditProductModalOpen(false);
        setEditingProduct(null);

        // Notify other tabs/storefront to reload products immediately
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('kss_products_updated'));
          try {
            const saved = localStorage.getItem('kss_products');
            if (saved) {
              const list = JSON.parse(saved);
              const updated = list.map((item: any) =>
                item.barcode === editingProduct.barcode
                  ? { ...item, price: finalPrice, stock: finalStock, offerPrice: finalPrice }
                  : item
              );
              localStorage.setItem('kss_products', JSON.stringify(updated));
            }
          } catch {}
        }
      } else {
        alert(data.error || 'Failed to update price/stock.');
      }
    } catch (err: any) {
      alert(err?.message || 'Network error updating price/stock.');
    } finally {
      setIsSavingProductEdit(false);
    }
  };

  // Bulk Category % Price Adjustment
  const handleApplyBulkCategoryPrice = async () => {
    const pct = parseFloat(bulkPercentChange);
    if (isNaN(pct)) {
      alert('Please enter a valid percentage number.');
      return;
    }
    setIsProcessingBulkPrice(true);
    setBulkSuccessMsg(null);
    try {
      const res = await fetch('/api/pos/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_category_price_adjustment',
          category: bulkCategorySelected,
          percentChange: pct,
          roundTo99p: bulkRoundTo99p,
          cashier: cashierName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        playBeep(1100, 'sine', 0.25);
        setBulkSuccessMsg(data.message);
        fetchTerminalData();
        setTimeout(() => {
          setBulkCategoryModalOpen(false);
          setBulkSuccessMsg(null);
        }, 2500);
      } else {
        alert(data.error || 'Failed to bulk adjust category prices.');
      }
    } catch (err: any) {
      alert(err?.message || 'Network error.');
    } finally {
      setIsProcessingBulkPrice(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchDailyReport();
    }
    if (activeTab === 'returns') {
      fetchRecentReceipts();
      fetchReturnsHistory();
    }
  }, [activeTab]);

  // Global Hardware Barcode Scanner Listener
  // Intercepts input from USB/Bluetooth scanner guns anywhere on the till
  useEffect(() => {
    let scannedChars = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in regular search/form inputs
      if (
        document.activeElement instanceof HTMLInputElement &&
        document.activeElement.id !== 'barcode-hidden-listener'
      ) {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 150) {
        scannedChars = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (scannedChars.trim().length >= 4) {
          e.preventDefault();
          handleBarcodeScanned(scannedChars.trim());
          scannedChars = '';
        }
      } else if (e.key.length === 1) {
        scannedChars += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products]);

  // Handle scanned or entered barcode
  const handleBarcodeScanned = (barcode: string) => {
    const cleanBc = barcode.trim();
    if (!cleanBc) return;

    const matched = products.find(
      (p) => p.barcode === cleanBc || p.sku === cleanBc || p.barcode.endsWith(cleanBc)
    );

    if (matched) {
      playBeep(950, 'sine', 0.1);
      addToCart(matched);
      setBarcodeInput('');
    } else {
      playBeep(350, 'sawtooth', 0.2);
      alert(`Barcode "${cleanBc}" not found in current inventory.`);
    }
  };

  // Add product to cart
  const addToCart = (product: PosProduct) => {
    playBeep(850, 'sine', 0.05);
    setCart((prev) => {
      const existing = prev.find((i) => i.barcode === product.barcode);
      if (existing) {
        return prev.map((i) =>
          i.barcode === product.barcode ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [
        ...prev,
        {
          barcode: product.barcode,
          name: product.name,
          price: product.price,
          qty: 1,
          vatRate: product.vatRate,
          sizeWeight: product.sizeWeight,
        },
      ];
    });
  };

  const updateQuantity = (barcode: string, newQty: number) => {
    playBeep(700, 'sine', 0.04);
    if (newQty <= 0) {
      setCart((prev) => prev.filter((i) => i.barcode !== barcode));
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.barcode === barcode ? { ...i, qty: newQty } : i))
    );
  };

  const removeFromCart = (barcode: string) => {
    playBeep(500, 'sine', 0.06);
    setCart((prev) => prev.filter((i) => i.barcode !== barcode));
  };

  const clearCart = () => {
    if (cart.length > 0 && confirm('Clear entire checkout basket?')) {
      playBeep(400, 'sine', 0.08);
      setCart([]);
    }
  };

  // Hold current bill
  const handleHoldBill = () => {
    if (cart.length === 0) return;
    const bill: HeldBill = {
      id: `HOLD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      customer: `Customer #${heldBills.length + 1}`,
      items: [...cart],
      total: grandTotal,
    };
    setHeldBills((prev) => [...prev, bill]);
    setCart([]);
    playBeep(600, 'triangle', 0.12);
  };

  // Recall held bill
  const handleRecallBill = (bill: HeldBill) => {
    setCart(bill.items);
    setHeldBills((prev) => prev.filter((b) => b.id !== bill.id));
    playBeep(900, 'sine', 0.08);
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [cart]);

  const vatTotal = useMemo(() => {
    // UK HMRC rules: basic food = 0% VAT. Standard taxable non-food items = 20%
    return cart.reduce((sum, item) => {
      if (item.vatRate > 0) {
        return sum + (item.price * item.qty * item.vatRate) / 100;
      }
      return sum;
    }, 0);
  }, [cart]);

  const grandTotal = useMemo(() => {
    return Math.round((subtotal + vatTotal) * 100) / 100;
  }, [subtotal, vatTotal]);

  const totalItemCount = useMemo(() => {
    return cart.reduce((sum, i) => sum + i.qty, 0);
  }, [cart]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set).slice(0, 9)];
  }, [products]);

  // Filtered products for touch grid
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const text = `${p.name} ${p.barcode} ${p.category} ${p.sizeWeight}`.toLowerCase();
        return text.includes(q);
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  // Checkout Execution
  const handleConfirmPayment = async () => {
    if (cart.length === 0 || isProcessingCheckout) return;
    setIsProcessingCheckout(true);

    const cashNum = parseFloat(cashGiven) || grandTotal;
    const change = Math.max(0, cashNum - grandTotal);

    const payload = {
      action: 'checkout',
      items: cart.map((i) => ({
        barcode: i.barcode,
        name: i.name,
        price: i.price,
        qty: i.qty,
        total: i.price * i.qty,
      })),
      subtotal,
      vatTotal,
      total: grandTotal,
      paymentMethod,
      cashTendered: paymentMethod === 'cash' ? cashNum : grandTotal,
      changeDue: paymentMethod === 'cash' ? change : 0,
      cashier: cashierName,
    };

    try {
      const res = await fetch('/api/pos/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        const receiptData = {
          receiptNumber: result.receiptNumber || `KSS-${Date.now().toString().slice(-6)}`,
          date: new Date().toLocaleString('en-GB'),
          timestamp: new Date().toISOString(),
          cashier: cashierName,
          items: [...cart],
          subtotal,
          vatTotal,
          total: grandTotal,
          paymentMethod,
          cashTendered: cashNum,
          changeDue: change,
        };
        setLastReceipt(receiptData);

        try {
          const existing = JSON.parse(localStorage.getItem('kss_pos_saved_receipts') || '[]');
          const updated = [receiptData, ...existing.filter((r: any) => r.receiptNumber !== receiptData.receiptNumber)].slice(0, 200);
          localStorage.setItem('kss_pos_saved_receipts', JSON.stringify(updated));
        } catch {}

        // Deduct local stock immediately for instantaneous responsiveness
        setProducts((prev) =>
          prev.map((p) => {
            const sold = cart.find((i) => i.barcode === p.barcode);
            if (sold) {
              return { ...p, stock: Math.max(0, p.stock - sold.qty) };
            }
            return p;
          })
        );

        setCart([]);
        setPaymentModalOpen(false);
        setReceiptModalOpen(true);
        fetchReport();

        // Kick Cash Drawer ONLY for Cash payments (Card payments keep drawer closed)
        if (paymentMethod === 'cash') {
          triggerCashDrawerKick('cash_sale');
        }
      } else {
        alert('Payment processing failed. Please retry.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Network or server error during checkout.');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  // Stock-In (Purchase) Execution
  const handleStockInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockInBarcode.trim() || !stockInQty) return;

    try {
      const res = await fetch('/api/pos/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'stock_in',
          barcode: stockInBarcode.trim(),
          quantityAdded: Number(stockInQty),
          supplier: stockInSupplier.trim(),
          sellingPrice: stockInSellingPrice ? Number(stockInSellingPrice) : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        playBeep(900, 'sine', 0.15);
        setStockInSuccess(data.message || 'Stock updated successfully!');

        // Update local list
        setProducts((prev) =>
          prev.map((p) => {
            if (p.barcode === stockInBarcode.trim()) {
              return {
                ...p,
                stock: p.stock + Number(stockInQty),
                price: stockInSellingPrice ? Number(stockInSellingPrice) : p.price,
              };
            }
            return p;
          })
        );

        setStockInBarcode('');
        setSelectedStockInProduct(null);
        setStockInItemSearch('');
        setStockInQty('10');
        setStockInSellingPrice('');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('kss_products_updated'));
        }
        setTimeout(() => setStockInSuccess(null), 3000);
      }
    } catch {
      alert('Failed to submit purchase stock update.');
    }
  };

  // Load saved Gemini API key and category margins
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('kss_gemini_api_key');
      if (savedKey) setGeminiApiKey(savedKey);
      const savedMargins = localStorage.getItem('kss_category_margins');
      if (savedMargins) setCategoryMargins(JSON.parse(savedMargins));
      const savedDef = localStorage.getItem('kss_default_margin');
      if (savedDef) setDefaultMarginPercent(Number(savedDef));
    } catch {}
  }, []);

  const handleSaveApiKey = (key: string) => {
    setGeminiApiKey(key);
    try {
      localStorage.setItem('kss_gemini_api_key', key);
    } catch {}
  };

  const handleInvoiceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInvoiceFileName(file.name);
    setOcrError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setInvoiceImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRunOcrScan = async () => {
    if (!invoiceImageBase64) {
      alert('Please upload or take a photo of the purchase invoice first.');
      return;
    }
    setIsOcrScanning(true);
    setOcrError(null);
    try {
      const res = await fetch('/api/pos/ocr-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ocr_scan',
          imageBase64: invoiceImageBase64,
          customApiKey: geminiApiKey,
          categoryMargins,
          defaultProfitMargin: defaultMarginPercent,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOcrResult(data);
        playBeep(950, 'sine', 0.15);
      } else {
        setOcrError(data.error || 'Failed to scan invoice.');
        playBeep(350, 'sawtooth', 0.2);
      }
    } catch (err: any) {
      setOcrError(err?.message || 'Network error scanning invoice.');
      playBeep(350, 'sawtooth', 0.2);
    } finally {
      setIsOcrScanning(false);
    }
  };

  const handleItemMarginChange = (itemId: string, newMargin: number) => {
    if (!ocrResult) return;
    setOcrResult((prev: any) => {
      const updatedItems = prev.items.map((it: any) => {
        if (it.id === itemId) {
          const sellingPrice = Math.round(it.unitCost * (1 + newMargin / 100) * 100) / 100;
          const expectedProfit = Math.round((sellingPrice - it.unitCost) * it.quantity * 100) / 100;
          return { ...it, profitMarginPercent: newMargin, sellingPrice, expectedProfit };
        }
        return it;
      });
      return { ...prev, items: updatedItems };
    });
  };

  const handleItemPriceChange = (itemId: string, newPrice: number) => {
    if (!ocrResult) return;
    setOcrResult((prev: any) => {
      const updatedItems = prev.items.map((it: any) => {
        if (it.id === itemId) {
          const margin = it.unitCost > 0 ? Math.round(((newPrice - it.unitCost) / it.unitCost) * 100) : 0;
          const expectedProfit = Math.round((newPrice - it.unitCost) * it.quantity * 100) / 100;
          return { ...it, sellingPrice: newPrice, profitMarginPercent: margin, expectedProfit };
        }
        return it;
      });
      return { ...prev, items: updatedItems };
    });
  };

  const handleItemCostChange = (itemId: string, newCost: number) => {
    if (!ocrResult) return;
    setOcrResult((prev: any) => {
      const updatedItems = prev.items.map((it: any) => {
        if (it.id === itemId) {
          const sellingPrice = Math.round(newCost * (1 + it.profitMarginPercent / 100) * 100) / 100;
          const expectedProfit = Math.round((sellingPrice - newCost) * it.quantity * 100) / 100;
          const totalCost = Math.round(newCost * it.quantity * 100) / 100;
          return { ...it, unitCost: newCost, sellingPrice, expectedProfit, totalCost };
        }
        return it;
      });
      return { ...prev, items: updatedItems };
    });
  };

  const handleItemQtyChange = (itemId: string, newQty: number) => {
    if (!ocrResult) return;
    setOcrResult((prev: any) => {
      const updatedItems = prev.items.map((it: any) => {
        if (it.id === itemId) {
          const totalCost = Math.round(it.unitCost * newQty * 100) / 100;
          const expectedProfit = Math.round((it.sellingPrice - it.unitCost) * newQty * 100) / 100;
          return { ...it, quantity: newQty, totalCost, expectedProfit };
        }
        return it;
      });
      return { ...prev, items: updatedItems };
    });
  };

  const handleItemCategoryChange = (itemId: string, newCategory: string) => {
    if (!ocrResult) return;
    const catMargin = categoryMargins[newCategory] !== undefined ? categoryMargins[newCategory] : defaultMarginPercent;
    setOcrResult((prev: any) => {
      const updatedItems = prev.items.map((it: any) => {
        if (it.id === itemId) {
          const sellingPrice = Math.round(it.unitCost * (1 + catMargin / 100) * 100) / 100;
          const expectedProfit = Math.round((sellingPrice - it.unitCost) * it.quantity * 100) / 100;
          return { ...it, category: newCategory, profitMarginPercent: catMargin, sellingPrice, expectedProfit };
        }
        return it;
      });
      return { ...prev, items: updatedItems };
    });
  };

  const handleDeleteOcrItem = (itemId: string) => {
    if (!ocrResult) return;
    setOcrResult((prev: any) => ({
      ...prev,
      items: prev.items.filter((it: any) => it.id !== itemId),
    }));
  };

  const handleCategoryMarginUpdate = (cat: string, newMargin: number) => {
    const updated = { ...categoryMargins, [cat]: newMargin };
    setCategoryMargins(updated);
    try {
      localStorage.setItem('kss_category_margins', JSON.stringify(updated));
    } catch {}

    if (ocrResult?.items) {
      setOcrResult((prev: any) => {
        const updatedItems = prev.items.map((it: any) => {
          if (it.category === cat) {
            const sellingPrice = Math.round(it.unitCost * (1 + newMargin / 100) * 100) / 100;
            const expectedProfit = Math.round((sellingPrice - it.unitCost) * it.quantity * 100) / 100;
            return { ...it, profitMarginPercent: newMargin, sellingPrice, expectedProfit };
          }
          return it;
        });
        return { ...prev, items: updatedItems };
      });
    }
  };

  const handleGlobalMarginApply = (margin: number) => {
    setDefaultMarginPercent(margin);
    try {
      localStorage.setItem('kss_default_margin', String(margin));
    } catch {}
    if (ocrResult?.items) {
      setOcrResult((prev: any) => {
        const updatedItems = prev.items.map((it: any) => {
          const sellingPrice = Math.round(it.unitCost * (1 + margin / 100) * 100) / 100;
          const expectedProfit = Math.round((sellingPrice - it.unitCost) * it.quantity * 100) / 100;
          return { ...it, profitMarginPercent: margin, sellingPrice, expectedProfit };
        });
        return { ...prev, items: updatedItems };
      });
    }
  };

  const handleSaveOcrInvoice = async () => {
    if (!ocrResult || !ocrResult.items || ocrResult.items.length === 0 || isSavingInvoice) return;
    setIsSavingInvoice(true);
    setInvoiceSuccessMsg(null);
    try {
      const res = await fetch('/api/pos/ocr-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_invoice',
          items: ocrResult.items,
          supplierName: ocrResult.supplierName,
          invoiceNumber: ocrResult.invoiceNumber,
          invoiceDate: ocrResult.invoiceDate,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        playBeep(1100, 'sine', 0.25);
        setInvoiceSuccessMsg(data.message || 'Invoice successfully imported into POS and website!');

        fetchTerminalData();

        setTimeout(() => {
          setOcrResult(null);
          setInvoiceImageBase64(null);
          setInvoiceFileName('');
          setInvoiceSuccessMsg(null);
        }, 3500);
      } else {
        alert(data.error || 'Failed to save invoice.');
      }
    } catch (err: any) {
      alert(err?.message || 'Network error saving invoice.');
    } finally {
      setIsSavingInvoice(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 flex h-screen w-screen overflow-hidden font-sans select-none ${
        themeMode === 'light' ? 'pos-light bg-slate-100 text-slate-900' : 'pos-dark bg-slate-950 text-slate-100'
      }`}
    >
      {/* 1. LEFT ICON NAVIGATION SIDEBAR (Matching Modern FreshPos Layout) */}
      <aside className="w-16 sm:w-20 bg-slate-900 border-r border-slate-800 flex flex-col items-center justify-between py-4 shrink-0 z-30">
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Official Store Logo */}
          <Link
            href="/"
            className="w-12 h-12 rounded-2xl bg-white p-1 flex items-center justify-center shadow-lg shadow-emerald-950/40 hover:scale-105 transition-transform border border-emerald-500/30 overflow-hidden shrink-0"
            title="Kerala Superstore Main Website"
          >
            <img
              src="/logo.png"
              alt="Kerala Superstore Official Logo"
              className="w-full h-full object-contain"
            />
          </Link>

          {/* Navigation Buttons */}
          <nav className="flex flex-col items-center gap-2 w-full px-2">
            <button
              onClick={() => setActiveTab('till')}
              className={`w-full py-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
                activeTab === 'till'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-700/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title="Sales Till / Register"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="text-[10px] font-bold">Till</span>
            </button>

            <button
              onClick={() => setActiveTab('purchase')}
              className={`w-full py-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
                activeTab === 'purchase'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-700/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title="Purchase Stock In"
            >
              <Package className="w-5 h-5" />
              <span className="text-[10px] font-bold">Stock In</span>
            </button>

            {/* Sales Return / Refund Button */}
            <button
              onClick={() => setActiveTab('returns')}
              className={`w-full py-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all relative ${
                activeTab === 'returns'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-700/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title="Sales Return & Refund"
            >
              <RotateCcw className="w-5 h-5" />
              <span className="text-[10px] font-bold">Returns</span>
              {returnCart.length > 0 && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-400" />
              )}
            </button>

            {/* Price & Stock Manager Button (Admin PIN Protected) */}
            <button
              onClick={() => requireAdminAuth(() => setActiveTab('stock_manager'))}
              className={`w-full py-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all relative ${
                activeTab === 'stock_manager'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-700/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title="Price & Stock Controller (Admin PIN Protected)"
            >
              <Sliders className="w-5 h-5" />
              <span className="text-[10px] font-bold">Pricing</span>
              {!isAdminUnlocked && (
                <Lock className="w-2.5 h-2.5 absolute top-1.5 right-2 text-slate-500" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full py-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
                activeTab === 'reports'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-700/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title="Daily Z-Report & Sales"
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-[10px] font-bold">Reports</span>
            </button>

            <button
              onClick={() => setActiveTab('barcode')}
              className={`w-full py-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
                activeTab === 'barcode'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-700/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title="Barcode Label Tool"
            >
              <Scan className="w-5 h-5" />
              <span className="text-[10px] font-bold">Barcodes</span>
            </button>
          </nav>
        </div>

        {/* Bottom Utility Toggles */}
        <div className="flex flex-col items-center gap-3 w-full px-2">
          {/* Day / Night Theme Toggle */}
          <button
            onClick={handleToggleTheme}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              themeMode === 'light'
                ? 'text-amber-500 hover:bg-slate-200'
                : 'text-amber-400 hover:bg-slate-800'
            }`}
            title={themeMode === 'light' ? 'Current: Daylight White Mode (Click for Dark Mode)' : 'Current: Dark Mode (Click for White Daylight Mode)'}
          >
            {themeMode === 'light' ? <Sun className="w-5 h-5 fill-amber-400/20" /> : <Moon className="w-5 h-5 fill-blue-400/20" />}
          </button>

          {/* Audio Beep Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              soundEnabled ? 'text-emerald-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-800'
            }`}
            title={soundEnabled ? 'Beep Audio: ON' : 'Beep Audio: OFF'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              } else {
                document.exitFullscreen().catch(() => {});
              }
            }}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
            title="Toggle Fullscreen Kiosk Mode"
          >
            <Maximize2 className="w-5 h-5" />
          </button>

          {/* Back to Website */}
          <Link
            href="/"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-amber-400 hover:bg-slate-800 transition-all"
            title="Back to Online Store"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </aside>

      {/* 2. MAIN CENTER CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        {/* Top Terminal Status Header */}
        <header className={`h-16 border-b px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 ${
          themeMode === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                <span>{storeInfo.name}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold uppercase tracking-wider">
                  UK Retail POS 2026
                </span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {storeInfo.branch} • {storeInfo.address}
              </span>
            </div>
          </div>

          {/* Center: Live Barcode Scanner Input */}
          {activeTab === 'till' && (
            <div className="flex items-center gap-2 flex-1 max-w-md mx-2">
              <div className="relative w-full">
                <Scan className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleBarcodeScanned(barcodeInput);
                    }
                  }}
                  placeholder="Scan barcode with gun or type digits..."
                  className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 font-mono tracking-wider"
                />
              </div>
              <button
                onClick={() => handleBarcodeScanned(barcodeInput)}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
              >
                Enter
              </button>
            </div>
          )}

          {/* Right: Cashier, User Switcher & Admin Controls */}
          <div className="flex items-center gap-2.5 text-right">
            {/* Live Clock (Isolated Micro-Component) */}
            <div className="hidden xl:flex flex-col items-end">
              <PosLiveClock themeMode={themeMode} />
            </div>

            {/* Active Till User & Quick Shift Switcher */}
            <button
              type="button"
              id="pos-active-user-pill"
              onClick={() => {
                setSwitchTargetUser(null);
                setSwitchSecretInput('');
                setSwitchError(null);
                setUserSwitchModalOpen(true);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-xs ${
                themeMode === 'light'
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300'
                  : 'bg-slate-800/90 hover:bg-slate-700/90 text-white border border-slate-700'
              }`}
              title="Click to Switch Cashier / Log In"
            >
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  activeUser.role === 'admin'
                    ? 'bg-amber-500 shadow-amber-500/50 shadow-sm'
                    : activeUser.role === 'manager'
                    ? 'bg-blue-500 shadow-blue-500/50 shadow-sm'
                    : 'bg-emerald-500 shadow-emerald-500/50 shadow-sm'
                } shrink-0`}
              />
              <div className="flex flex-col items-start leading-none text-left">
                <span className="text-[11px] font-black flex items-center gap-1.5">
                  <span className={themeMode === 'light' ? 'text-slate-950 font-black' : 'text-white'}>
                    {activeUser.name}
                  </span>
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-black tracking-wider ${
                      activeUser.role === 'admin'
                        ? themeMode === 'light'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : activeUser.role === 'manager'
                        ? themeMode === 'light'
                          ? 'bg-blue-100 text-blue-900 border border-blue-300'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : themeMode === 'light'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {activeUser.role}
                  </span>
                </span>
                <span className={`text-[9px] font-mono mt-0.5 ${themeMode === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                  Switch User ▾
                </span>
              </div>
              <ArrowRightLeft className={`w-3.5 h-3.5 ml-0.5 shrink-0 ${themeMode === 'light' ? 'text-slate-600' : 'text-slate-400'}`} />
            </button>

            {/* Admin & Staff User Management Button */}
            <button
              type="button"
              onClick={handleOpenUserManagement}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all border ${
                themeMode === 'light'
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 shadow-sm'
                  : 'bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-200 border-indigo-500/30'
              }`}
              title="Manage Admin Username/Password & Staff Accounts"
            >
              <Users className={`w-3.5 h-3.5 ${themeMode === 'light' ? 'text-white' : 'text-indigo-400'}`} />
              <span className="hidden sm:inline text-[11px]">Users</span>
            </button>

            {/* Admin PIN Mode Controller */}
            <div className="flex items-center gap-1.5">
              {!isAdminUnlocked && !canUserEditPrices(activeUser) ? (
                <button
                  type="button"
                  onClick={() => requireAdminAuth(() => {})}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all border ${
                    themeMode === 'light'
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                  title="Cashier Mode active. Tap to enter Admin PIN to edit prices/stock."
                >
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden md:inline text-[11px]">Price Locked</span>
                </button>
              ) : (
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border ${
                  themeMode === 'light'
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-950 shadow-xs'
                    : 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                }`}>
                  <ShieldCheck className={`w-4 h-4 ${themeMode === 'light' ? 'text-emerald-700' : 'text-emerald-400'}`} />
                  <span className={`text-[11px] font-black hidden md:inline ${themeMode === 'light' ? 'text-emerald-900' : 'text-emerald-300'}`}>Price Unlocked</span>
                  <button
                    type="button"
                    onClick={handleLockAdminMode}
                    className="p-1 hover:text-rose-500 text-slate-500 text-[10px] cursor-pointer"
                    title="Lock Price Editing (Switch to Cashier Mode)"
                  >
                    <Lock className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* White / Dark Mode Toggle Button */}
            <button
              type="button"
              onClick={handleToggleTheme}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                themeMode === 'light'
                  ? 'bg-amber-500/10 text-amber-700 border-amber-300 hover:bg-amber-500/20 shadow-xs'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title={
                themeMode === 'light'
                  ? 'Current: Daylight White Mode (Click for Dark Mode)'
                  : 'Current: Dark Mode (Click for White Daylight Mode)'
              }
            >
              {themeMode === 'light' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span className="hidden sm:inline">White Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-blue-400 fill-blue-400" />
                  <span className="hidden sm:inline">Dark Mode</span>
                </>
              )}
            </button>

            {/* Cash Drawer Control Button (F12 Shortcut) */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => triggerCashDrawerKick('manual')}
                className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs ${
                  themeMode === 'light'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                    : 'bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 border-emerald-500/40'
                }`}
                title="Open Cash Drawer (Hotkey: F12)"
              >
                <Banknote className={`w-3.5 h-3.5 ${themeMode === 'light' ? 'text-white' : 'text-emerald-400'}`} />
                <span className="hidden lg:inline text-[11px]">Open Drawer</span>
                <span className={`text-[9px] px-1 py-0.5 rounded font-mono ${
                  themeMode === 'light' ? 'bg-emerald-800 text-white' : 'bg-emerald-500/20 text-emerald-300'
                }`}>F12</span>
              </button>

              <button
                type="button"
                onClick={() => setCashDrawerModalOpen(true)}
                className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                  themeMode === 'light'
                    ? 'border-slate-300 hover:border-emerald-600 text-slate-700 hover:text-emerald-700 bg-slate-100'
                    : 'border-slate-700 hover:border-emerald-500/50 text-slate-400 hover:text-emerald-400 bg-slate-800/80'
                }`}
                title="Cash Drawer & Windows Driver Setup Guide (Card vs Cash)"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={fetchTerminalData}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
              title="Refresh Catalog and Stock from Supabase"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </header>

        {/* Floating Cash Drawer Notification Banner */}
        {drawerKickNotification && !receiptModalOpen && (
          <div className="fixed top-20 right-6 z-40 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-black border border-emerald-400">
            <Banknote className="w-4 h-4 shrink-0" />
            <span>{drawerKickNotification}</span>
          </div>
        )}

        {/* TAB 1: SALES TILL / REGISTER */}
        {activeTab === 'till' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left 65%: Product Categories & Grid */}
            <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-800 p-4">
              {/* Category Pills Bar */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 shrink-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Quick Search Box */}
              <div className="relative mb-3 shrink-0">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search item by name, brand, barcode, SKU (e.g. Rice, Oil, Spices)..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Products Touch Grid */}
              <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
                {loading ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                    <span className="text-xs font-bold">Loading 3,000+ items from Manchester POS database...</span>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3 py-16">
                    <AlertCircle className="w-10 h-10 text-amber-500" />
                    <div className="text-center space-y-1">
                      <span className="text-base font-bold text-slate-300 block">
                        No items match &quot;{searchQuery || selectedCategory}&quot;
                      </span>
                      <span className="text-xs text-slate-400 block max-w-sm">
                        {searchQuery.toLowerCase().includes('admin') || searchQuery.toLowerCase().includes('cashier') || searchQuery.toLowerCase().includes('login')
                          ? 'Looking to switch cashier or log in as Store Administrator? Tap the user pill in the top-right header.'
                          : 'Try searching by barcode, product name, or reset the search filter.'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                        >
                          Clear Search &amp; Show All Products
                        </button>
                      )}
                      {selectedCategory !== 'All' && (
                        <button
                          type="button"
                          onClick={() => setSelectedCategory('All')}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer"
                        >
                          Show All Categories
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {filteredProducts.slice(0, 80).map((prod) => (
                      <div
                        key={prod.barcode}
                        onClick={() => addToCart(prod)}
                        className="bg-slate-900 border border-slate-800/80 hover:border-emerald-500 rounded-2xl p-2.5 flex flex-col justify-between group cursor-pointer transition-all hover:shadow-lg hover:shadow-emerald-950/40 active:scale-95"
                      >
                        {/* Image Showcase */}
                        <div className="relative w-full aspect-square rounded-xl bg-slate-950/80 overflow-hidden mb-2 border border-slate-800/50">
                          <Image
                            src={prod.imageUrl || '/categories/spices.jpg'}
                            alt={prod.name}
                            fill
                            className="object-contain p-1 group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                          {/* Stock pill */}
                          <span
                            className={`absolute bottom-1 right-1 text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                              prod.stock > 0
                                ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-700/50'
                                : 'bg-rose-950/90 text-rose-300 border border-rose-700/50'
                            }`}
                          >
                            {prod.stock > 0 ? `${prod.stock}` : '0'}
                          </span>
                        </div>

                        {/* Title & Weight */}
                        <div className="space-y-0.5 mb-2">
                          <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 line-clamp-2 leading-tight">
                            {prod.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 block">{prod.sizeWeight}</span>
                        </div>

                        {/* Price & Barcode with Admin Protected Edit Icon */}
                        <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-emerald-400">
                              £{prod.price.toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                requireAdminAuth(() => openProductEditModal(prod));
                              }}
                              className="p-1 text-slate-500 hover:text-amber-400 rounded-md hover:bg-slate-800 transition-colors"
                              title={isAdminUnlocked ? "Edit Price / Stock" : "Admin PIN required to edit price/stock"}
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-[9px] font-mono text-slate-500 truncate max-w-[60px]">
                            {prod.barcode.slice(-4)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right 35%: Billing Order Ticket (FreshPos Cart Panel) */}
            <div className="w-[340px] sm:w-[380px] lg:w-[420px] bg-slate-900 flex flex-col shrink-0 border-l border-slate-800 shadow-2xl print:hidden">
              {/* Ticket Header & Held Bills */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0 bg-slate-900/90">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-white">
                    Current Ticket ({totalItemCount})
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {heldBills.length > 0 && (
                    <button
                      onClick={() => handleRecallBill(heldBills[0])}
                      className="px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      title="Recall previously held order"
                    >
                      <Play className="w-3 h-3 fill-amber-300" />
                      <span>Held ({heldBills.length})</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setActiveTab('returns');
                      fetchRecentReceipts();
                      fetchReturnsHistory();
                    }}
                    className="px-2 py-1 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                    title="Process Sales Return & Refund"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Return</span>
                  </button>

                  <button
                    onClick={clearCart}
                    disabled={cart.length === 0}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Clear Cart"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 py-12">
                    <Scan className="w-10 h-10 text-slate-600 stroke-1" />
                    <p className="text-xs font-bold text-slate-400">Ready to Scan or Tap</p>
                    <p className="text-[11px] text-slate-500 text-center max-w-[200px]">
                      Scan barcode with scanner gun or select items from grid.
                    </p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.barcode}
                      className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-bold text-white truncate">{item.name}</h5>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span>£{item.price.toFixed(2)} each</span>
                          <span>•</span>
                          <span className="font-mono">{item.barcode.slice(-5)}</span>
                          {item.vatRate > 0 && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded-sm">
                              VAT 20%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stepper */}
                      <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1">
                        <button
                          onClick={() => updateQuantity(item.barcode, item.qty - 1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-300 hover:bg-slate-800 rounded-md font-bold cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-bold text-xs text-white">{item.qty}</span>
                        <button
                          onClick={() => updateQuantity(item.barcode, item.qty + 1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-300 hover:bg-slate-800 rounded-md font-bold cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="text-right min-w-[50px]">
                        <span className="text-xs font-black text-emerald-400">
                          £{(item.price * item.qty).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Totals & Quick Pay Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-900/95 space-y-3 shrink-0">
                {/* Breakdown Summary */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-mono">£{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>UK VAT (Food 0% / Std 20%):</span>
                    <span className="font-mono">£{vatTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-white pt-1 border-t border-slate-800">
                    <span>TOTAL PAYABLE:</span>
                    <span className="text-xl text-emerald-400 font-mono">£{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Quick Cash Shortcuts */}
                {cart.length > 0 && (
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    <button
                      onClick={() => {
                        setCashGiven(grandTotal.toFixed(2));
                        setPaymentMethod('cash');
                        setPaymentModalOpen(true);
                      }}
                      className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                    >
                      Exact
                    </button>
                    <button
                      onClick={() => {
                        setCashGiven('5.00');
                        setPaymentMethod('cash');
                        setPaymentModalOpen(true);
                      }}
                      className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                    >
                      £5
                    </button>
                    <button
                      onClick={() => {
                        setCashGiven('10.00');
                        setPaymentMethod('cash');
                        setPaymentModalOpen(true);
                      }}
                      className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                    >
                      £10
                    </button>
                    <button
                      onClick={() => {
                        setCashGiven('20.00');
                        setPaymentMethod('cash');
                        setPaymentModalOpen(true);
                      }}
                      className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                    >
                      £20
                    </button>
                  </div>
                )}

                {/* Main Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleHoldBill}
                    disabled={cart.length === 0}
                    className="py-3 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-40 cursor-pointer"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Hold</span>
                  </button>

                  <button
                    onClick={() => {
                      setPaymentMethod('card');
                      setCashGiven(grandTotal.toFixed(2));
                      setPaymentModalOpen(true);
                    }}
                    disabled={cart.length === 0}
                    className="py-3 px-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-md disabled:opacity-40 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Card / Tap</span>
                  </button>

                  <button
                    onClick={() => {
                      setPaymentMethod('cash');
                      setCashGiven(grandTotal.toFixed(2));
                      setPaymentModalOpen(true);
                    }}
                    disabled={cart.length === 0}
                    className="py-3 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex flex-col items-center justify-center gap-1 shadow-lg shadow-emerald-950/50 disabled:opacity-40 cursor-pointer"
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Cash Pay</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PURCHASE & STOCK-IN ENTRY (AI OCR & PROFIT MARGIN ENGINE) */}
        {activeTab === 'purchase' && (
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-6xl mx-auto w-full space-y-6">
            {/* Top Switcher: AI Gemini OCR Scanner vs Manual Entry */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-400" />
                  <span>Purchase &amp; Wholesale Invoice Management</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Scan wholesale paper bills using Google Gemini AI, calculate profit margins (%) by category and per product, and bulk-sync to POS &amp; website.
                </p>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setPurchaseMode('ai_ocr')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    purchaseMode === 'ai_ocr'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>AI Bill Scanner (OCR)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPurchaseMode('manual')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    purchaseMode === 'manual'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Manual Barcode Stock-In</span>
                </button>
              </div>
            </div>

            {/* Success notification banner */}
            {invoiceSuccessMsg && (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg animate-fade-in">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                <span>{invoiceSuccessMsg}</span>
              </div>
            )}

            {/* MODE 1: AI GEMINI OCR INVOICE SCANNER */}
            {purchaseMode === 'ai_ocr' && (
              <div className="space-y-6">
                {/* Gemini API Key & Category Margin Controls Strip */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 max-w-md">
                      <Key className="w-4 h-4 text-amber-400 shrink-0" />
                      <input
                        type="password"
                        value={geminiApiKey}
                        onChange={(e) => handleSaveApiKey(e.target.value)}
                        placeholder="Google Gemini API Key (saved in browser)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-mono"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Gemini 1.5 Flash Vision OCR Active</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => setShowMarginSettings(!showMarginSettings)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                          showMarginSettings
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                        }`}
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>{showMarginSettings ? 'Hide Category Margins' : 'Category Profit Margins (%)'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Expandable Category Profit Margin Settings Panel */}
                  {showMarginSettings && (
                    <div className="pt-3 border-t border-slate-800 space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300">
                          Configure Profit Margin % by Category (Auto-calculates Retail Selling Price = Cost + Margin%)
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">Default Margin:</span>
                          <input
                            type="number"
                            min="0"
                            max="200"
                            value={defaultMarginPercent}
                            onChange={(e) => handleGlobalMarginApply(Number(e.target.value))}
                            className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-0.5 text-xs text-white text-center font-bold"
                          />
                          <span className="text-xs text-slate-400">%</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                        {Object.entries(categoryMargins).map(([cat, margin]) => (
                          <div key={cat} className="bg-slate-950 border border-slate-800/80 p-2.5 rounded-xl space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 block truncate" title={cat}>
                              {cat}
                            </span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="200"
                                value={margin}
                                onChange={(e) => handleCategoryMarginUpdate(cat, Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-emerald-400 font-bold font-mono focus:outline-hidden focus:border-emerald-500"
                              />
                              <span className="text-xs font-bold text-slate-500">%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* File Upload & Scan Box (When no invoice is active) */}
                {!ocrResult && (
                  <div className="bg-slate-900 border-2 border-dashed border-slate-800 hover:border-emerald-500/60 rounded-3xl p-8 text-center transition-all">
                    {invoiceImageBase64 ? (
                      <div className="space-y-4 max-w-md mx-auto">
                        <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center p-2">
                          {invoiceFileName.endsWith('.pdf') ? (
                            <div className="flex flex-col items-center gap-2 text-slate-400">
                              <FileCheck className="w-12 h-12 text-emerald-400" />
                              <span className="text-xs font-bold">{invoiceFileName}</span>
                            </div>
                          ) : (
                            <img
                              src={invoiceImageBase64}
                              alt="Invoice Preview"
                              className="max-h-full max-w-full object-contain rounded-lg"
                            />
                          )}
                        </div>

                        <div className="flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setInvoiceImageBase64(null);
                              setInvoiceFileName('');
                            }}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Remove
                          </button>

                          <button
                            type="button"
                            onClick={handleRunOcrScan}
                            disabled={isOcrScanning}
                            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-950/50 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            {isOcrScanning ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Reading Bill with Gemini AI...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 text-amber-300" />
                                <span>Scan &amp; Extract Invoice</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 max-w-md mx-auto">
                        <div className="w-16 h-16 rounded-2xl bg-slate-800 text-emerald-400 flex items-center justify-center mx-auto">
                          <Upload className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">Upload Wholesale Purchase Bill / Invoice</h3>
                          <p className="text-xs text-slate-400 mt-1">
                            Take a photo of your paper invoice or upload an image/PDF. Gemini will automatically extract all products, pack sizes, quantities, and cost prices.
                          </p>
                        </div>

                        <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md active:scale-95">
                          <Camera className="w-4 h-4" />
                          <span>Choose Invoice Photo / PDF</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleInvoiceFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}

                    {ocrError && (
                      <div className="mt-4 p-3 bg-rose-500/20 border border-rose-500/50 text-rose-300 rounded-xl text-xs font-bold max-w-md mx-auto">
                        {ocrError}
                      </div>
                    )}
                  </div>
                )}

                {/* INVOICE REVIEW & PROFIT MARGIN ADJUSTER TABLE */}
                {ocrResult && (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 animate-scale-up">
                    {/* Invoice Header Details */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Wholesaler / Supplier</span>
                          <div className="relative">
                            <input
                              type="text"
                              value={ocrResult.supplierName}
                              onChange={(e) => {
                                setOcrResult({ ...ocrResult, supplierName: e.target.value });
                                setOcrSupplierSuggestionsOpen(true);
                              }}
                              onFocus={() => setOcrSupplierSuggestionsOpen(true)}
                              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold text-white focus:outline-hidden focus:border-emerald-500 w-48 sm:w-56"
                              placeholder="e.g. 7's Trading / Graviss UK"
                            />
                            {ocrSupplierSuggestionsOpen && (
                              <div className="absolute left-0 top-full mt-1 w-64 bg-slate-900/95 backdrop-blur-xl border border-emerald-500/40 rounded-xl shadow-2xl z-50 p-1 space-y-0.5 max-h-48 overflow-y-auto animate-scale-up">
                                <div className="px-2 py-1 text-[9px] uppercase tracking-wider text-emerald-400 font-bold border-b border-slate-800 flex justify-between items-center">
                                  <span>Suggested UK Wholesalers</span>
                                  <button
                                    type="button"
                                    onClick={() => setOcrSupplierSuggestionsOpen(false)}
                                    className="text-slate-400 hover:text-white"
                                  >
                                    ✕
                                  </button>
                                </div>
                                {POPULAR_UK_WHOLESALERS
                                  .filter(s => !ocrResult.supplierName || s.toLowerCase().includes(ocrResult.supplierName.toLowerCase()))
                                  .map((s) => (
                                    <button
                                      key={s}
                                      type="button"
                                      onClick={() => {
                                        setOcrResult({ ...ocrResult, supplierName: s });
                                        setOcrSupplierSuggestionsOpen(false);
                                        if (typeof playBeep === 'function') try { playBeep(850, 'sine', 0.05); } catch {}
                                      }}
                                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:bg-emerald-600/30 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                                    >
                                      <span>{s}</span>
                                      <Check className="w-3 h-3 text-emerald-400 opacity-60" />
                                    </button>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Invoice #</span>
                          <input
                            type="text"
                            value={ocrResult.invoiceNumber}
                            onChange={(e) => setOcrResult({ ...ocrResult, invoiceNumber: e.target.value })}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold text-white font-mono focus:outline-hidden focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Invoice Date</span>
                          <input
                            type="text"
                            value={ocrResult.invoiceDate}
                            onChange={(e) => setOcrResult({ ...ocrResult, invoiceDate: e.target.value })}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold text-white font-mono focus:outline-hidden focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Discard this invoice and scan another?')) {
                              setOcrResult(null);
                              setInvoiceImageBase64(null);
                              setInvoiceFileName('');
                            }
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          Discard
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveOcrInvoice}
                          disabled={isSavingInvoice}
                          className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-950/40 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isSavingInvoice ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Importing to POS...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Confirm &amp; Import All ({ocrResult.items.length})</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* 4 Financial Metric Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Total Invoice Cost</span>
                        <div className="text-xl font-black text-slate-200 font-mono mt-0.5">
                          £{ocrResult.items.reduce((s: number, i: any) => s + (Number(i.unitCost) * Number(i.quantity)), 0).toFixed(2)}
                        </div>
                      </div>

                      <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Projected Retail Turnover</span>
                        <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                          £{ocrResult.items.reduce((s: number, i: any) => s + (Number(i.sellingPrice) * Number(i.quantity)), 0).toFixed(2)}
                        </div>
                      </div>

                      <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Projected Net Profit</span>
                        <div className="text-xl font-black text-teal-300 font-mono mt-0.5">
                          £{(ocrResult.items.reduce((s: number, i: any) => s + (Number(i.sellingPrice) * Number(i.quantity)), 0) - ocrResult.items.reduce((s: number, i: any) => s + (Number(i.unitCost) * Number(i.quantity)), 0)).toFixed(2)}
                        </div>
                      </div>

                      <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Profit Margin</span>
                        <div className="text-xl font-black text-amber-400 font-mono mt-0.5">
                          {ocrResult.items.length > 0
                            ? Math.round(
                                ((ocrResult.items.reduce((s: number, i: any) => s + (Number(i.sellingPrice) * Number(i.quantity)), 0) -
                                  ocrResult.items.reduce((s: number, i: any) => s + (Number(i.unitCost) * Number(i.quantity)), 0)) /
                                  Math.max(1, ocrResult.items.reduce((s: number, i: any) => s + (Number(i.unitCost) * Number(i.quantity)), 0))) *
                                  100
                              )
                            : 0}%
                        </div>
                      </div>
                    </div>

                    {/* Interactive Items Table with Category & Individual Profit Margin Adjusters */}
                    <div className="overflow-x-auto border border-slate-800 rounded-2xl">
                      <table className="w-full text-left text-xs divide-y divide-slate-800">
                        <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="py-3 px-3">Item Description</th>
                            <th className="py-3 px-2">Matched Barcode</th>
                            <th className="py-3 px-2 text-center">Qty</th>
                            <th className="py-3 px-2 text-right">Cost (£)</th>
                            <th className="py-3 px-2">Category</th>
                            <th className="py-3 px-2 text-center text-emerald-400">Profit Margin %</th>
                            <th className="py-3 px-2 text-right text-emerald-400 font-black">Selling Price (£)</th>
                            <th className="py-3 px-2 text-right">Profit (£)</th>
                            <th className="py-3 px-2 text-center">Del</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                          {ocrResult.items.map((item: any) => (
                            <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                              {/* Description & Weight with Existing Stock vs New Item Badge & Suggestions */}
                              <td className="py-2.5 px-3 max-w-[240px] relative">
                                <span className="font-bold text-white block truncate" title={item.description}>
                                  {item.description}
                                </span>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  <span className="text-[10px] text-slate-500 font-mono">{item.sizeWeight}</span>
                                  {item.isExistingStock ? (
                                    <span
                                      className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-950/90 text-emerald-300 border border-emerald-700/60"
                                      title={`Matched with existing store stock: ${item.matchedName} (Current Stock: ${item.currentStock || 0}, Current Price: £${(item.currentPrice || 0).toFixed(2)})`}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                      Existing Stock ({item.currentStock || 0})
                                    </span>
                                  ) : (
                                    <span
                                      className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-md bg-sky-950/90 text-sky-300 border border-sky-700/60"
                                      title="New product - will be added as new SKU into inventory"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                                      New Item
                                    </span>
                                  )}

                                  {/* Quick Interactive Match Switcher */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveSuggestionItemId(activeSuggestionItemId === item.id ? null : item.id);
                                      setPopoverCatalogSearch('');
                                    }}
                                    className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all cursor-pointer"
                                    title="View smart matching suggestions or search catalog"
                                  >
                                    <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                                    <span>{item.suggestions?.length ? `Matches (${item.suggestions.length})` : 'Find Item'}</span>
                                  </button>
                                </div>

                                {item.isExistingStock && item.matchedName && item.matchedName !== item.description && (
                                  <span className="text-[10px] text-emerald-400/90 block truncate mt-0.5 font-medium" title={item.matchedName}>
                                    Linked: {item.matchedName}
                                  </span>
                                )}

                                {/* Interactive Match Suggestion Popover */}
                                {activeSuggestionItemId === item.id && (
                                  <div className="absolute left-3 top-full mt-1 w-80 bg-slate-950/98 backdrop-blur-2xl border border-emerald-500/50 rounded-2xl shadow-2xl z-50 p-3 space-y-2.5 animate-scale-up text-left">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 text-amber-400" /> Link to Existing Stock
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setActiveSuggestionItemId(null)}
                                        className="text-slate-400 hover:text-white p-0.5 text-xs cursor-pointer"
                                      >
                                        ✕
                                      </button>
                                    </div>

                                    {/* Catalog Search Input */}
                                    <div className="relative">
                                      <input
                                        type="text"
                                        value={popoverCatalogSearch}
                                        onChange={(e) => setPopoverCatalogSearch(e.target.value)}
                                        placeholder="Search all 3,000+ products..."
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                                      />
                                    </div>

                                    {/* Suggestions List */}
                                    <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                                      {(popoverCatalogSearch
                                        ? products.filter(p => p.name.toLowerCase().includes(popoverCatalogSearch.toLowerCase()) || p.barcode.includes(popoverCatalogSearch)).slice(0, 5)
                                        : (item.suggestions && item.suggestions.length > 0
                                            ? item.suggestions.map((s: any) => {
                                                const match = products.find(p => p.barcode === s.barcode);
                                                return match || { barcode: s.barcode, name: s.name, price: s.price, stock: s.stock, similarityPercent: s.similarityPercent };
                                              })
                                            : products.filter(p => p.name.toLowerCase().includes(item.description.slice(0, 5).toLowerCase())).slice(0, 4))
                                      ).map((s: any) => (
                                        <div
                                          key={s.barcode}
                                          onClick={() => {
                                            setOcrResult((prev: any) => ({
                                              ...prev,
                                              items: prev.items.map((it: any) =>
                                                it.id === item.id
                                                  ? {
                                                      ...it,
                                                      matchedBarcode: s.barcode,
                                                      matchedName: s.name,
                                                      isExistingStock: true,
                                                      currentStock: s.stock,
                                                      currentPrice: s.price,
                                                    }
                                                  : it
                                              ),
                                            }));
                                            setActiveSuggestionItemId(null);
                                            if (typeof playBeep === 'function') try { playBeep(950, 'sine', 0.05); } catch {}
                                          }}
                                          className="p-2 rounded-xl bg-slate-900/90 hover:bg-emerald-950/70 border border-slate-800/80 hover:border-emerald-500/60 flex items-center justify-between gap-2 cursor-pointer transition-all group"
                                        >
                                          <div className="min-w-0 flex-1">
                                            <span className="text-xs font-bold text-white group-hover:text-emerald-300 block truncate">
                                              {s.name}
                                            </span>
                                            <div className="flex items-center gap-2 text-[9px] text-slate-400 mt-0.5">
                                              <span className="font-mono text-slate-500">{s.barcode}</span>
                                              <span>• Stock: <strong className="text-emerald-400">{s.stock}</strong></span>
                                              <span>• £{Number(s.price).toFixed(2)}</span>
                                              {s.similarityPercent ? (
                                                <span className="text-amber-400 font-bold ml-auto">{s.similarityPercent}% match</span>
                                              ) : null}
                                            </div>
                                          </div>
                                          <button
                                            type="button"
                                            className="px-2 py-1 bg-emerald-600/30 group-hover:bg-emerald-600 text-emerald-300 group-hover:text-white rounded-lg text-[10px] font-bold shrink-0 transition-colors"
                                          >
                                            Link
                                          </button>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Action to keep as New SKU */}
                                    <div className="pt-1.5 border-t border-slate-800 flex justify-between items-center text-[10px]">
                                      <span className="text-slate-500">Not in current stock?</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOcrResult((prev: any) => ({
                                            ...prev,
                                            items: prev.items.map((it: any) =>
                                              it.id === item.id
                                                ? {
                                                    ...it,
                                                    matchedBarcode: `5012345${String(Date.now()).slice(-6)}`,
                                                    matchedName: item.description,
                                                    isExistingStock: false,
                                                    currentStock: 0,
                                                    currentPrice: 0,
                                                  }
                                                : it
                                            ),
                                          }));
                                          setActiveSuggestionItemId(null);
                                        }}
                                        className="text-sky-400 hover:text-sky-300 font-bold cursor-pointer"
                                      >
                                        + Keep as New Product
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </td>

                              {/* Matched Barcode */}
                              <td className="py-2.5 px-2">
                                <input
                                  type="text"
                                  value={item.matchedBarcode || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setOcrResult((prev: any) => ({
                                      ...prev,
                                      items: prev.items.map((it: any) => it.id === item.id ? { ...it, matchedBarcode: val } : it)
                                    }));
                                  }}
                                  className="w-28 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] font-mono text-slate-300 focus:outline-hidden focus:border-emerald-500"
                                />
                              </td>

                              {/* Qty Received */}
                              <td className="py-2.5 px-2 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleItemQtyChange(item.id, Number(e.target.value))}
                                  className="w-14 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-center text-white focus:outline-hidden focus:border-emerald-500 font-mono"
                                />
                              </td>

                              {/* Unit Cost */}
                              <td className="py-2.5 px-2 text-right">
                                <div className="flex items-center justify-end gap-0.5">
                                  <span className="text-slate-500">£</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={item.unitCost}
                                    onChange={(e) => handleItemCostChange(item.id, parseFloat(e.target.value) || 0)}
                                    className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-1.5 py-1 text-xs font-bold text-right text-white focus:outline-hidden focus:border-emerald-500 font-mono"
                                  />
                                </div>
                              </td>

                              {/* Category Dropdown */}
                              <td className="py-2.5 px-2">
                                <select
                                  value={item.category}
                                  onChange={(e) => handleItemCategoryChange(item.id, e.target.value)}
                                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-hidden focus:border-emerald-500 max-w-[130px]"
                                >
                                  {Object.keys(categoryMargins).map((c) => (
                                    <option key={c} value={c}>
                                      {c}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              {/* Profit Margin % (Editable per item) */}
                              <td className="py-2.5 px-2 text-center">
                                <div className="inline-flex items-center gap-1 bg-emerald-950/40 border border-emerald-500/40 px-2 py-1 rounded-lg">
                                  <input
                                    type="number"
                                    min="0"
                                    max="500"
                                    value={item.profitMarginPercent}
                                    onChange={(e) => handleItemMarginChange(item.id, Number(e.target.value))}
                                    className="w-12 bg-transparent text-xs font-black text-center text-emerald-400 focus:outline-hidden font-mono"
                                  />
                                  <span className="text-[10px] font-bold text-emerald-500">%</span>
                                </div>
                              </td>

                              {/* Selling Price (£) (Calculated with Margin % or direct override) */}
                              <td className="py-2.5 px-2 text-right">
                                <div className="flex items-center justify-end gap-0.5">
                                  <span className="text-emerald-500 font-bold">£</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={item.sellingPrice}
                                    onChange={(e) => handleItemPriceChange(item.id, parseFloat(e.target.value) || 0)}
                                    className="w-16 bg-slate-950 border border-emerald-500/50 rounded-lg px-1.5 py-1 text-xs font-black text-right text-emerald-400 focus:outline-hidden focus:border-emerald-400 font-mono shadow-xs"
                                  />
                                </div>
                              </td>

                              {/* Expected Profit (£) */}
                              <td className="py-2.5 px-2 text-right font-mono font-bold text-teal-400">
                                £{((item.sellingPrice - item.unitCost) * item.quantity).toFixed(2)}
                              </td>

                              {/* Delete Action */}
                              <td className="py-2.5 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteOcrItem(item.id)}
                                  className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                                  title="Remove item from bill"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
                      <span className="text-xs text-slate-400">
                        {ocrResult.items.length} items ready to be imported. Selling prices will be immediately live on the physical POS and website.
                      </span>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Discard this invoice and scan another?')) {
                              setOcrResult(null);
                              setInvoiceImageBase64(null);
                              setInvoiceFileName('');
                            }
                          }}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          Discard
                        </button>

                        <button
                          type="button"
                          onClick={handleSaveOcrInvoice}
                          disabled={isSavingInvoice}
                          className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-950/50 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isSavingInvoice ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Importing to POS &amp; Website...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Confirm &amp; Import All Items</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MODE 2: MANUAL DUAL SEARCH & BARCODE RESTOCK */}
            {purchaseMode === 'manual' && (() => {
              const matchedProduct = selectedStockInProduct || products.find((p) => p.barcode === stockInBarcode.trim());
              const filteredItemSuggestions = stockInItemSearch.trim().length > 1
                ? products
                    .filter((p) =>
                      p.name.toLowerCase().includes(stockInItemSearch.toLowerCase()) ||
                      p.barcode.toLowerCase().includes(stockInItemSearch.toLowerCase()) ||
                      (p.category && p.category.toLowerCase().includes(stockInItemSearch.toLowerCase()))
                    )
                    .slice(0, 8)
                : [];

              const filteredSuppliers = stockInSupplier.trim().length > 0
                ? POPULAR_UK_WHOLESALERS.filter((s) => s.toLowerCase().includes(stockInSupplier.toLowerCase()))
                : POPULAR_UK_WHOLESALERS;

              return (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2.5">
                        <span className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                          <Package className="w-5 h-5" />
                        </span>
                        <span>Smart Item Restock &amp; Stock-In</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Search catalog by name or scan barcode to quickly replenish inventory and sync to online shop.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Live Website &amp; Till Counter Sync Active</span>
                    </div>
                  </div>

                  {stockInSuccess && (
                    <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-lg shadow-emerald-950/30 animate-fade-in">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>{stockInSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleStockInSubmit} className="space-y-6">
                    {/* STEP 1: DUAL SEARCH / ITEM FINDER */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Name Search with Live Suggestion Autocomplete */}
                      <div className="relative">
                        <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Search className="w-3.5 h-3.5 text-emerald-400" />
                            <span>1. Find Product by Name</span>
                          </span>
                          <span className="text-[11px] font-normal text-slate-400">Live 3,000+ catalog search</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={stockInItemSearch}
                            onChange={(e) => {
                              setStockInItemSearch(e.target.value);
                              setStockInSuggestionsOpen(true);
                            }}
                            onFocus={() => setStockInSuggestionsOpen(true)}
                            placeholder="Type name (e.g. Matta Rice, Pavizham, Nirapara...)"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all pr-10"
                          />
                          {stockInItemSearch && (
                            <button
                              type="button"
                              onClick={() => {
                                setStockInItemSearch('');
                                setStockInSuggestionsOpen(false);
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs p-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Dropdown Suggestions */}
                        {stockInSuggestionsOpen && filteredItemSuggestions.length > 0 && (
                          <div className="absolute z-40 left-0 right-0 mt-2 bg-slate-950/95 backdrop-blur-md border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                            <div className="p-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/80">
                              Matching Catalog Products ({filteredItemSuggestions.length})
                            </div>
                            {filteredItemSuggestions.map((prod) => (
                              <button
                                key={prod.barcode}
                                type="button"
                                onClick={() => {
                                  setSelectedStockInProduct(prod);
                                  setStockInBarcode(prod.barcode);
                                  setStockInItemSearch(prod.name);
                                  setStockInSellingPrice(prod.price.toFixed(2));
                                  setStockInSuggestionsOpen(false);
                                  playBeep(900, 'sine', 0.08);
                                }}
                                className="w-full text-left p-2.5 hover:bg-emerald-500/10 transition-colors flex items-center justify-between gap-3 group"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {prod.imageUrl ? (
                                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-slate-700/60 relative">
                                      <Image
                                        src={prod.imageUrl}
                                        alt={prod.name}
                                        fill
                                        sizes="36px"
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-500">
                                      <Package className="w-4 h-4" />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-white group-hover:text-emerald-300 truncate">
                                      {prod.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                                      <span className="font-mono text-slate-400">{prod.barcode}</span>
                                      <span>•</span>
                                      <span>{prod.category}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-xs font-black text-emerald-400 font-mono">
                                    £{prod.price.toFixed(2)}
                                  </div>
                                  <div className={`text-[10px] font-bold mt-0.5 ${prod.stock <= 5 ? 'text-amber-400' : 'text-slate-400'}`}>
                                    {prod.stock} in stock
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Barcode Scanner Gun input */}
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Scan className="w-3.5 h-3.5 text-emerald-400" />
                            <span>OR Scan / Enter Barcode</span>
                          </span>
                          <span className="text-[11px] font-normal text-slate-400">Scanner gun compatible</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={stockInBarcode}
                          onChange={(e) => {
                            const bc = e.target.value;
                            setStockInBarcode(bc);
                            const found = products.find((p) => p.barcode === bc.trim());
                            if (found) {
                              setSelectedStockInProduct(found);
                              setStockInItemSearch(found.name);
                              setStockInSellingPrice(found.price.toFixed(2));
                            }
                          }}
                          placeholder="Scan or enter barcode (e.g. 5012345678904)"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 font-mono transition-all"
                        />
                      </div>
                    </div>

                    {/* PRODUCT PREVIEW CARD (When an item is matched or selected) */}
                    {matchedProduct && (
                      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-emerald-950/20">
                        <div className="flex items-center gap-3.5 min-w-0">
                          {matchedProduct.imageUrl ? (
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-emerald-500/40 relative shadow-inner">
                              <Image
                                src={matchedProduct.imageUrl}
                                alt={matchedProduct.name}
                                fill
                                sizes="56px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-400">
                              <Package className="w-6 h-6 text-emerald-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                                {matchedProduct.barcode}
                              </span>
                              <span className="text-[11px] text-slate-400">{matchedProduct.category}</span>
                            </div>
                            <h4 className="text-sm font-black text-white truncate mt-1">
                              {matchedProduct.name}
                            </h4>
                            <div className="flex items-center gap-3 mt-1 text-xs">
                              <span className="text-slate-400">
                                Current Shelf Stock:{' '}
                                <strong className={`font-mono ${matchedProduct.stock <= 5 ? 'text-amber-400' : 'text-white'}`}>
                                  {matchedProduct.stock} units
                                </strong>
                              </span>
                              <span>•</span>
                              <span className="text-slate-400">
                                Current Price: <strong className="text-emerald-400 font-mono">£{matchedProduct.price.toFixed(2)}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 border-t sm:border-t-0 border-slate-800/80 pt-2 sm:pt-0">
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Projected Stock</span>
                            <span className="text-xs font-black text-emerald-400 font-mono">
                              {matchedProduct.stock + (parseInt(stockInQty) || 0)} units
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStockInProduct(null);
                              setStockInBarcode('');
                              setStockInItemSearch('');
                            }}
                            className="text-[11px] text-slate-400 hover:text-red-400 underline underline-offset-2 cursor-pointer transition-colors"
                          >
                            Change Item
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 2: SUPPLIER SELECTION & QUICK CHIPS */}
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <label className="block text-xs font-bold text-slate-300">
                          2. Supplier / Wholesaler Name
                        </label>
                        <span className="text-[11px] text-slate-400">Click a popular UK supplier to fill instantly</span>
                      </div>

                      {/* Quick Supplier Chips */}
                      <div className="flex flex-wrap gap-1.5 pb-1">
                        {POPULAR_UK_WHOLESALERS.slice(0, 6).map((sup) => (
                          <button
                            key={sup}
                            type="button"
                            onClick={() => setStockInSupplier(sup)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                              stockInSupplier === sup
                                ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950/40'
                                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {sup}
                          </button>
                        ))}
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          value={stockInSupplier}
                          onChange={(e) => {
                            setStockInSupplier(e.target.value);
                            setSupplierSuggestionsOpen(true);
                          }}
                          onFocus={() => setSupplierSuggestionsOpen(true)}
                          placeholder="e.g. 7's TRADING LTD / Graviss UK / Home Foods Asia / Kairali Foods"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all"
                        />
                        {supplierSuggestionsOpen && filteredSuppliers.length > 0 && (
                          <div className="absolute z-30 left-0 right-0 mt-1 bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-800/60">
                            {filteredSuppliers.map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => {
                                  setStockInSupplier(s);
                                  setSupplierSuggestionsOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-emerald-500/10 transition-colors font-medium"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* STEP 3: QUANTITY RECEIVED & SELLING PRICE */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Quantity Input + Case Packing Multipliers */}
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                          <span>3. Received Quantity (Units) *</span>
                          <span className="text-[11px] text-slate-400">Total individual packs</span>
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            required
                            min="1"
                            value={stockInQty}
                            onChange={(e) => setStockInQty(e.target.value)}
                            placeholder="e.g. 24, 50, 100"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-hidden focus:border-emerald-500 font-mono font-bold"
                          />
                        </div>
                        {/* Carton Case Multiplier Buttons */}
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-[10px] text-slate-500 font-bold uppercase">Carton packs:</span>
                          {[6, 12, 24, 48, 100].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setStockInQty(String(num))}
                              className="px-2 py-0.5 rounded-md bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-emerald-300 border border-slate-800 text-[10px] font-mono font-bold transition-colors cursor-pointer"
                            >
                              +{num}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Selling Price */}
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                          <span>4. Update Retail Selling Price (£)</span>
                          <span className="text-[11px] text-slate-400">Optional override</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">£</span>
                          <input
                            type="number"
                            step="0.01"
                            value={stockInSellingPrice}
                            onChange={(e) => setStockInSellingPrice(e.target.value)}
                            placeholder="Leave blank to keep existing price"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-xs text-white focus:outline-hidden focus:border-emerald-500 font-mono"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Changes will update both POS counter and website shop instantly.
                        </p>
                      </div>
                    </div>

                    {/* CONFIRM BUTTON */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800/80">
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Instant database commit with automatic cache refresh</span>
                      </div>

                      <button
                        type="submit"
                        className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-950/50 hover:shadow-emerald-900/40 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>+ Confirm Stock-In &amp; Sync to Website</span>
                      </button>
                    </div>
                  </form>
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB: SALES RETURN & REFUND */}
        {activeTab === 'returns' && (
          <div className="flex-1 p-6 overflow-y-auto max-w-6xl mx-auto w-full space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-rose-400" />
                  <span>Sales Return &amp; Customer Refund</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Process customer returns with original receipt validation, restock / damage waste control, and cash/card refund slips.
                </p>
              </div>

              {/* Sub-Tab Navigation Switcher */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-2xl shrink-0">
                <button
                  type="button"
                  onClick={() => setReturnSubTab('receipt')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    returnSubTab === 'receipt'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Return via Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReturnSubTab('direct')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    returnSubTab === 'direct'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Direct Item Return</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setReturnSubTab('history');
                    fetchReturnsHistory();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    returnSubTab === 'history'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Returns History ({returnsHistoryList.length})</span>
                </button>
              </div>
            </div>

            {/* SUB-TAB 1: RETURN VIA RECEIPT */}
            {returnSubTab === 'receipt' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left 7 cols: Receipt Search & Items Selection */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Search Box */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Search className="w-4 h-4 text-rose-400" />
                      <span>Lookup Customer Sale Receipt</span>
                    </h3>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleLookupReceipt();
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={receiptSearchTerm}
                        onChange={(e) => setReceiptSearchTerm(e.target.value)}
                        placeholder="Scan or enter Receipt # (e.g. KSS-849201)..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500 font-mono"
                      />
                      <button
                        type="submit"
                        disabled={isSearchingReceipt}
                        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isSearchingReceipt ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Search className="w-3.5 h-3.5" />
                        )}
                        <span>Find Bill</span>
                      </button>
                    </form>

                    {receiptSearchError && (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{receiptSearchError}</span>
                      </div>
                    )}

                    {/* Quick Pick: Recent Receipts from Today */}
                    {recentReceiptsList.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80">
                        <span className="text-[11px] text-slate-400 font-semibold block mb-2">
                          Recent Sales Bills Today (Click to Select):
                        </span>
                        <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto no-scrollbar">
                          {recentReceiptsList.map((rcpt: any) => (
                            <button
                              key={rcpt.receiptNumber || rcpt.id}
                              type="button"
                              onClick={() => {
                                setReceiptSearchTerm(rcpt.receiptNumber);
                                handleLookupReceipt(rcpt.receiptNumber);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-mono border transition-all cursor-pointer flex items-center gap-2 ${
                                loadedReceipt?.receiptNumber === rcpt.receiptNumber
                                  ? 'bg-rose-600/30 border-rose-500 text-rose-300 font-bold'
                                  : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                              }`}
                            >
                              <span>{rcpt.receiptNumber}</span>
                              <span className="text-emerald-400 font-bold">£{Number(rcpt.total || 0).toFixed(2)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Loaded Receipt Details & Selectable Items */}
                  {loadedReceipt ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 animate-fade-in">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white font-mono">{loadedReceipt.receiptNumber}</span>
                            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-bold uppercase">
                              {loadedReceipt.paymentMethod}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {new Date(loadedReceipt.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} • Cashier: {loadedReceipt.cashier}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Original Total</span>
                          <span className="text-base font-black text-emerald-400 font-mono">
                            £{Number(loadedReceipt.total || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-300 block">
                          Select Item(s) to Return:
                        </span>

                        <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar pr-1">
                          {loadedReceipt.items.map((item: any) => {
                            const isSelected = returnCart.some((i) => i.barcode === item.barcode);
                            const cartItem = returnCart.find((i) => i.barcode === item.barcode);

                            return (
                              <div
                                key={item.barcode}
                                className={`p-3 rounded-2xl border transition-all ${
                                  isSelected
                                    ? 'bg-rose-950/20 border-rose-500/60 shadow-md'
                                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <label className="flex items-start gap-3 cursor-pointer flex-1">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleToggleReturnItemFromReceipt(item)}
                                      className="mt-1 w-4 h-4 rounded-md accent-rose-500 cursor-pointer"
                                    />
                                    <div>
                                      <span className="text-xs font-bold text-white block">{item.name}</span>
                                      <span className="text-[10px] text-slate-500 font-mono">
                                        Barcode: {item.barcode} • Purchased Qty: {item.qty} @ £{Number(item.price).toFixed(2)}
                                      </span>
                                    </div>
                                  </label>

                                  <span className="text-xs font-black text-rose-400 font-mono shrink-0">
                                    £{(Number(item.price) * (cartItem?.qty || 1)).toFixed(2)}
                                  </span>
                                </div>

                                {isSelected && cartItem && (
                                  <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                                    {/* Qty Stepper */}
                                    <div>
                                      <span className="text-[10px] text-slate-400 block mb-1">
                                        Return Qty (Max: {cartItem.maxQty})
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateReturnQty(cartItem.barcode, cartItem.qty - 1)}
                                          className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center font-bold"
                                        >
                                          -
                                        </button>
                                        <span className="w-8 text-center font-bold text-white font-mono">{cartItem.qty}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateReturnQty(cartItem.barcode, cartItem.qty + 1)}
                                          className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center font-bold"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>

                                    {/* Reason Selector */}
                                    <div>
                                      <span className="text-[10px] text-slate-400 block mb-1">Reason</span>
                                      <select
                                        value={cartItem.reason}
                                        onChange={(e) => handleUpdateReturnReason(cartItem.barcode, e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[11px] text-slate-200 focus:outline-hidden focus:border-rose-500"
                                      >
                                        <option value="Wrong Item Purchased">Wrong Item Purchased</option>
                                        <option value="Damaged / Expired">Damaged / Expired</option>
                                        <option value="Quality Issue">Quality Issue</option>
                                        <option value="Customer Changed Mind">Customer Changed Mind</option>
                                        <option value="Incorrect Price">Incorrect Price</option>
                                      </select>
                                    </div>

                                    {/* Condition Selector */}
                                    <div>
                                      <span className="text-[10px] text-slate-400 block mb-1">Condition</span>
                                      <select
                                        value={cartItem.condition}
                                        onChange={(e) => handleUpdateReturnCondition(cartItem.barcode, e.target.value as any)}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[11px] text-slate-200 focus:outline-hidden focus:border-rose-500"
                                      >
                                        <option value="restockable">🟢 Restock (Return to Shelf)</option>
                                        <option value="damaged_waste">🔴 Damaged Waste (Write-Off)</option>
                                      </select>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-10 border border-dashed border-slate-800 rounded-3xl text-center space-y-2 bg-slate-900/30">
                      <Receipt className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs font-bold text-slate-400">No Receipt Loaded</p>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        Enter a receipt number above or click one of the recent bills to view items and issue customer refund.
                      </p>
                    </div>
                  )}
                </div>

                {/* Right 5 cols: Return Settlement & Checkout */}
                <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-2">
                      <RotateCcw className="w-4 h-4" />
                      <span>Refund Settlement ({returnCart.length} items)</span>
                    </h3>
                    {returnCart.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setReturnCart([])}
                        className="text-[11px] text-slate-400 hover:text-rose-400"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Big Total Refund Due Card */}
                  <div className="bg-rose-950/20 border border-rose-500/40 p-4 rounded-2xl text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300">
                      Total Customer Refund Due
                    </span>
                    <div className="text-3xl font-black text-rose-400 font-mono mt-1">
                      £{totalReturnRefund.toFixed(2)}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {returnCart.reduce((sum, i) => sum + i.qty, 0)} units returned
                    </span>
                  </div>

                  {/* Refund Payment Method */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-300">
                      Refund Method:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setReturnRefundMethod('cash')}
                        className={`py-2.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                          returnRefundMethod === 'cash'
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        <Banknote className="w-4 h-4" />
                        <span>Cash</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReturnRefundMethod('card')}
                        className={`py-2.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                          returnRefundMethod === 'card'
                            ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Card</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReturnRefundMethod('store_credit')}
                        className={`py-2.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                          returnRefundMethod === 'store_credit'
                            ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        <Receipt className="w-4 h-4" />
                        <span>Store Credit</span>
                      </button>
                    </div>
                  </div>

                  {/* Customer Information (Optional for Audit) */}
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Audit &amp; Customer Details (Optional)
                    </span>

                    <div>
                      <input
                        type="text"
                        value={returnCustomerName}
                        onChange={(e) => setReturnCustomerName(e.target.value)}
                        placeholder="Customer Name (e.g. Rahul Nair)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        value={returnCustomerPhone}
                        onChange={(e) => setReturnCustomerPhone(e.target.value)}
                        placeholder="Customer Mobile (e.g. +44 7700 900123)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <textarea
                        rows={2}
                        value={returnNotes}
                        onChange={(e) => setReturnNotes(e.target.value)}
                        placeholder="Return remarks or note..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-hidden focus:border-rose-500 resize-none"
                      />
                    </div>
                  </div>

                  {/* Process Return Action Button */}
                  <button
                    type="button"
                    onClick={handleProcessSalesReturn}
                    disabled={returnCart.length === 0 || isProcessingReturn}
                    className="w-full py-4 bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-rose-950/60 transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2 active:scale-95"
                  >
                    {isProcessingReturn ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Processing Return &amp; Restock...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Return &amp; Print Slip (£{totalReturnRefund.toFixed(2)})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* SUB-TAB 2: DIRECT ITEM RETURN (WITHOUT RECEIPT) */}
            {returnSubTab === 'direct' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Search className="w-4 h-4 text-rose-400" />
                      <span>Search &amp; Pick Product from Inventory</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      For customer returns where original receipt is missing. Scan barcode or type product name.
                    </p>
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={directReturnSearch}
                      onChange={(e) => setDirectReturnSearch(e.target.value)}
                      placeholder="Search product name or barcode (e.g. Eastern, Matta, Coconut)..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-hidden focus:border-rose-500"
                    />
                  </div>

                  {/* Matching Products Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[420px] overflow-y-auto no-scrollbar">
                    {products
                      .filter((p) => {
                        if (!directReturnSearch) return true;
                        const q = directReturnSearch.toLowerCase();
                        return p.name.toLowerCase().includes(q) || p.barcode.includes(q);
                      })
                      .slice(0, 24)
                      .map((prod) => (
                        <div
                          key={prod.barcode}
                          onClick={() => handleDirectAddReturnItem(prod)}
                          className="bg-slate-950 border border-slate-800 hover:border-rose-500/60 p-3 rounded-2xl flex items-center justify-between gap-2 cursor-pointer transition-all hover:scale-[1.01]"
                        >
                          <div className="truncate flex-1">
                            <span className="text-xs font-bold text-white block truncate">{prod.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Stock: {prod.stock} • Barcode: {prod.barcode.slice(-5)}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-rose-400 font-mono">
                              £{prod.price.toFixed(2)}
                            </span>
                            <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded-md block mt-0.5">
                              + Return
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Right 5 cols: Return Cart */}
                <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-rose-400">
                      Direct Return Basket ({returnCart.length})
                    </h3>
                    {returnCart.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setReturnCart([])}
                        className="text-[11px] text-slate-400 hover:text-rose-400"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {returnCart.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 space-y-2">
                      <RotateCcw className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs font-bold">No Items in Return Basket</p>
                      <p className="text-[11px] text-slate-500">
                        Tap any product on the left to add to customer refund.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-72 overflow-y-auto no-scrollbar">
                      {returnCart.map((item) => (
                        <div
                          key={item.barcode}
                          className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="truncate flex-1">
                              <span className="text-xs font-bold text-white block truncate">{item.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono">Barcode: {item.barcode}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveReturnItem(item.barcode)}
                              className="text-slate-500 hover:text-rose-400"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 block mb-0.5">Return Price (£)</span>
                              <input
                                type="number"
                                step="0.01"
                                value={item.price}
                                onChange={(e) => handleUpdateReturnPrice(item.barcode, parseFloat(e.target.value) || 0)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-white font-mono"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block mb-0.5">Quantity</span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateReturnQty(item.barcode, item.qty - 1)}
                                  className="w-6 h-6 bg-slate-800 text-white rounded-md flex items-center justify-center font-bold"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center font-bold text-white font-mono">{item.qty}</span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateReturnQty(item.barcode, item.qty + 1)}
                                  className="w-6 h-6 bg-slate-800 text-white rounded-md flex items-center justify-center font-bold"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <select
                              value={item.reason}
                              onChange={(e) => handleUpdateReturnReason(item.barcode, e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1 text-[10px] text-slate-300"
                            >
                              <option value="Wrong Item Purchased">Wrong Item Purchased</option>
                              <option value="Damaged / Expired">Damaged / Expired</option>
                              <option value="Quality Issue">Quality Issue</option>
                              <option value="Customer Changed Mind">Changed Mind</option>
                            </select>

                            <select
                              value={item.condition}
                              onChange={(e) => handleUpdateReturnCondition(item.barcode, e.target.value as any)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1 text-[10px] text-slate-300"
                            >
                              <option value="restockable">🟢 Restock</option>
                              <option value="damaged_waste">🔴 Damaged Waste</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400">Total Refund Due:</span>
                      <span className="text-2xl font-black text-rose-400 font-mono">
                        £{totalReturnRefund.toFixed(2)}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setReturnRefundMethod('cash')}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          returnRefundMethod === 'cash' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        Cash
                      </button>
                      <button
                        type="button"
                        onClick={() => setReturnRefundMethod('card')}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          returnRefundMethod === 'card' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        Card
                      </button>
                      <button
                        type="button"
                        onClick={() => setReturnRefundMethod('store_credit')}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          returnRefundMethod === 'store_credit' ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        Credit
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleProcessSalesReturn}
                      disabled={returnCart.length === 0 || isProcessingReturn}
                      className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-40"
                    >
                      {isProcessingReturn ? 'Processing...' : `Confirm Direct Return (£${totalReturnRefund.toFixed(2)})`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 3: RETURNS HISTORY LIST */}
            {returnSubTab === 'history' && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-rose-400" />
                    <span>Sales Returns &amp; Credit Notes Log</span>
                  </h3>
                  <button
                    type="button"
                    onClick={fetchReturnsHistory}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${returnsHistoryLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {returnsHistoryList.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 space-y-2">
                    <RotateCcw className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs font-bold">No Returns Recorded</p>
                    <p className="text-[11px] text-slate-500">Processed customer returns will appear here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                          <th className="py-2.5 px-3">Return Slip #</th>
                          <th className="py-2.5 px-3">Original Bill</th>
                          <th className="py-2.5 px-3">Date &amp; Time</th>
                          <th className="py-2.5 px-3">Items Returned</th>
                          <th className="py-2.5 px-3 text-right">Refund Amount</th>
                          <th className="py-2.5 px-3 text-center">Method</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {returnsHistoryList.map((ret: any) => (
                          <tr key={ret.returnSlipNumber || ret.id} className="hover:bg-slate-800/40">
                            <td className="py-3 px-3 font-bold text-rose-400">{ret.returnSlipNumber}</td>
                            <td className="py-3 px-3 text-slate-400">{ret.originalReceiptNumber}</td>
                            <td className="py-3 px-3 text-slate-400 font-sans text-[11px]">
                              {new Date(ret.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-3 px-3 font-sans text-white text-[11px]">
                              {ret.items?.map((it: any) => `${it.qty}x ${it.name}`).join(', ') || 'Item'}
                            </td>
                            <td className="py-3 px-3 text-right font-black text-rose-400">
                              £{Number(ret.totalRefund || 0).toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-center font-sans">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 uppercase font-bold">
                                {ret.refundMethod}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setLastReturnSlip({
                                    ...ret,
                                    date: new Date(ret.timestamp).toLocaleDateString('en-GB', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    }),
                                  });
                                  setReturnSlipModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-sans font-bold flex items-center gap-1 ml-auto cursor-pointer"
                              >
                                <Printer className="w-3 h-3" />
                                <span>Slip</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB: PRICE & STOCK MANAGER (ADMIN PIN PROTECTED) */}
        {activeTab === 'stock_manager' && (
          <div className="flex-1 p-6 overflow-y-auto max-w-6xl mx-auto w-full space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-400" />
                  <span>Price &amp; Stock Manager</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    Admin Authorized
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update selling prices manually or by percentage (+/- %), adjust stock counts, or update whole categories in bulk.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBulkCategoryModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-950/40 cursor-pointer"
                >
                  <Percent className="w-4 h-4" />
                  <span>Bulk Category % Adjustment</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChangePinModalOpen(true)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  title="Change Admin / Manager PIN"
                >
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>Change PIN</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleLockAdminMode();
                    setActiveTab('till');
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  title="Lock Till (Switch to Cashier Mode)"
                >
                  <Lock className="w-4 h-4" />
                  <span>Lock Till</span>
                </button>
              </div>
            </div>

            {/* Closing Stock KPI Cards Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Closing Stock Value
                </span>
                <span className="text-xl font-black text-emerald-400 font-mono mt-1">
                  £{closingStockMetrics.totalRetailValue.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500">Retail shelf asset value</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Closing Units
                </span>
                <span className="text-xl font-black text-white font-mono mt-1">
                  {closingStockMetrics.totalUnits.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500">Across {products.length} SKUs</span>
              </div>

              <button
                type="button"
                onClick={() => setStockFilterHealth(stockFilterHealth === 'low_stock' ? 'all' : 'low_stock')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  stockFilterHealth === 'low_stock'
                    ? 'bg-amber-500/20 border-amber-500 text-white shadow-md'
                    : 'bg-slate-900 border-amber-500/30 hover:border-amber-500/60'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    Low Stock (1-5)
                  </span>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className="text-xl font-black text-amber-400 font-mono mt-1">
                  {closingStockMetrics.lowStockCount}
                </span>
                <span className="text-[10px] text-amber-300/80">Click to filter</span>
              </button>

              <button
                type="button"
                onClick={() => setStockFilterHealth(stockFilterHealth === 'out_of_stock' ? 'all' : 'out_of_stock')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  stockFilterHealth === 'out_of_stock'
                    ? 'bg-rose-500/20 border-rose-500 text-white shadow-md'
                    : 'bg-slate-900 border-rose-500/30 hover:border-rose-500/60'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                    Out of Stock (0)
                  </span>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <span className="text-xl font-black text-rose-400 font-mono mt-1">
                  {closingStockMetrics.outOfStockCount}
                </span>
                <span className="text-[10px] text-rose-300/80">Click to filter</span>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <div className="md:col-span-8 relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={stockManagerSearch}
                    onChange={(e) => setStockManagerSearch(e.target.value)}
                    placeholder="Search from 3,023 items by name, barcode, or brand..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="md:col-span-4 flex items-center gap-2">
                  <select
                    value={stockManagerCategory}
                    onChange={(e) => setStockManagerCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-hidden focus:border-amber-500 cursor-pointer"
                  >
                    <option value="All">All Categories</option>
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleDownloadClosingStockCsv}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                    title="Export Closing Stock CSV"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                  </button>
                </div>
              </div>

              {/* Health Quick Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 border-t border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 shrink-0">Closing Stock Filter:</span>
                <button
                  type="button"
                  onClick={() => setStockFilterHealth('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    stockFilterHealth === 'all'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  All Items ({products.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilterHealth('in_stock')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    stockFilterHealth === 'in_stock'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Healthy Stock &gt;5 ({closingStockMetrics.healthyStockCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilterHealth('low_stock')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    stockFilterHealth === 'low_stock'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-950 text-amber-400/90 hover:text-amber-300 border border-slate-800'
                  }`}
                >
                  Low Stock 1-5 ({closingStockMetrics.lowStockCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilterHealth('out_of_stock')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    stockFilterHealth === 'out_of_stock'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-950 text-rose-400/90 hover:text-rose-300 border border-slate-800'
                  }`}
                >
                  Out of Stock 0 ({closingStockMetrics.outOfStockCount})
                </button>
              </div>
            </div>

            {/* Products Table with Direct Price & Stock Controls */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                <span>
                  Showing{' '}
                  <strong className="text-white">
                    {
                      products.filter((p) => {
                        const matchesCat = stockManagerCategory === 'All' || p.category === stockManagerCategory;
                        const q = stockManagerSearch.toLowerCase().trim();
                        const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.barcode.includes(q);
                        const matchesHealth =
                          stockFilterHealth === 'all'
                            ? true
                            : stockFilterHealth === 'out_of_stock'
                            ? p.stock <= 0
                            : stockFilterHealth === 'low_stock'
                            ? p.stock > 0 && p.stock <= 5
                            : p.stock > 5;
                        return matchesCat && matchesSearch && matchesHealth;
                      }).length
                    }
                  </strong>{' '}
                  matching items
                </span>
                <span className="text-[11px] text-slate-500">
                  Tap "Edit" on any item to change price or adjust stock
                </span>
              </div>

              <div className="overflow-x-auto max-h-[600px] overflow-y-auto pr-1">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className={`border-b text-[10px] uppercase tracking-wider sticky top-0 z-10 ${
                      themeMode === 'light' ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">Barcode</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-center">In Stock</th>
                      <th className="py-2.5 px-3 text-right">Selling Price</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y font-mono ${themeMode === 'light' ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
                    {products
                      .filter((p) => {
                        const matchesCat = stockManagerCategory === 'All' || p.category === stockManagerCategory;
                        const q = stockManagerSearch.toLowerCase().trim();
                        const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.barcode.includes(q);
                        const matchesHealth =
                          stockFilterHealth === 'all'
                            ? true
                            : stockFilterHealth === 'out_of_stock'
                            ? p.stock <= 0
                            : stockFilterHealth === 'low_stock'
                            ? p.stock > 0 && p.stock <= 5
                            : p.stock > 5;
                        return matchesCat && matchesSearch && matchesHealth;
                      })
                      .slice(0, 100)
                      .map((prod) => (
                        <tr key={prod.barcode} className={`transition-colors ${themeMode === 'light' ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'}`}>
                          <td className="py-3 px-3 font-sans max-w-[240px]">
                            <span className={`font-bold block truncate ${themeMode === 'light' ? 'text-slate-900' : 'text-white'}`} title={prod.name}>
                              {prod.name}
                            </span>
                            <span className={`text-[10px] font-mono ${themeMode === 'light' ? 'text-slate-500' : 'text-slate-500'}`}>{prod.sizeWeight}</span>
                          </td>

                          <td className={`py-3 px-3 text-[11px] ${themeMode === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>{prod.barcode}</td>

                          <td className={`py-3 px-3 font-sans text-[11px] ${themeMode === 'light' ? 'text-slate-800' : 'text-slate-300'}`}>
                            <span className={`px-2 py-0.5 rounded-md border ${
                              themeMode === 'light' ? 'bg-slate-100 text-slate-800 border-slate-300' : 'bg-slate-950 text-slate-300 border-slate-800'
                            }`}>
                              {prod.category}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-block min-w-[34px] px-2.5 py-1 rounded-lg text-xs font-black border ${
                                prod.stock > 10
                                  ? themeMode === 'light'
                                    ? 'bg-emerald-100 text-emerald-950 border-emerald-400 shadow-xs'
                                    : 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                                  : prod.stock > 0
                                  ? themeMode === 'light'
                                    ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-xs'
                                    : 'bg-amber-950/70 text-amber-300 border-amber-500/40'
                                  : themeMode === 'light'
                                  ? 'bg-rose-100 text-rose-950 border-rose-400 shadow-xs'
                                  : 'bg-rose-950/70 text-rose-300 border-rose-500/40'
                              }`}
                            >
                              {prod.stock}
                            </span>
                          </td>

                          <td className={`py-3 px-3 text-right font-black text-sm ${themeMode === 'light' ? 'text-emerald-700' : 'text-emerald-400'}`}>
                            £{prod.price.toFixed(2)}
                          </td>

                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => openProductEditModal(prod)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 ml-auto transition-all cursor-pointer border ${
                                themeMode === 'light'
                                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500 shadow-xs'
                                  : 'bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border-amber-500/40'
                              }`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TOTAL SALES & CLOSING STOCK REPORTS */}
        {activeTab === 'reports' && (
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-6xl mx-auto w-full space-y-6">
            {/* Header & Sub-Tab Navigation Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-xl font-black text-white tracking-tight">
                    Financial &amp; Stock Reports
                  </h2>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Till Analytics
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Comprehensive Total Sales revenue analysis across custom periods, and Closing Stock inventory valuation.
                </p>
              </div>

              {/* Sub-Report Switcher Pills */}
              <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setReportsSubTab('sales')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                    reportsSubTab === 'sales'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Total Sales Report</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportsSubTab('closing_stock')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                    reportsSubTab === 'closing_stock'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Boxes className="w-4 h-4" />
                  <span>Closing Stock Audit</span>
                </button>
              </div>
            </div>

            {/* ======================================================== */}
            {/* SUB-TAB 1: TOTAL SALES & REVENUE REPORT                  */}
            {/* ======================================================== */}
            {reportsSubTab === 'sales' && (
              <div className="space-y-6 animate-in fade-in">
                {/* Period Filter Toolbar */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-md space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      <span>Select Report Period:</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fetchReport()}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
                        title="Reload live report data"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loadingReport ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSalesReportModalOpen(true)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                        title="Open thermal receipt preview and print slip"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Z-Report Slip</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadSalesCsv}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all border ${
                          themeMode === 'light'
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 shadow-xs'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }`}
                        title="Download sales report as CSV"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Export CSV</span>
                      </button>

                      <a
                        href="https://github.com/keralasuperstoreuk1-creator/kerala-superstore/releases/download/v1.0.0/KSS-POS-Sync.exe"
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-md hover:scale-105"
                        title="Download shop PC live sync agent (KSS-POS-Sync.exe) to sync shop sales & stock"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-white" />
                        <span>Shop Sync Tool (.exe)</span>
                      </a>
                    </div>
                  </div>

                  {/* Period Button Chips */}
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
                    {[
                      { id: 'today', label: 'Today' },
                      { id: 'yesterday', label: 'Yesterday' },
                      { id: 'week', label: 'This Week (7 Days)' },
                      { id: 'month', label: 'This Month (30 Days)' },
                      { id: 'all', label: 'All-Time Total' },
                      { id: 'custom', label: 'Custom Range...' },
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        type="button"
                        onClick={() => {
                          setSalesPeriod(btn.id as any);
                          if (btn.id !== 'custom') {
                            fetchReport(btn.id);
                          }
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                          salesPeriod === btn.id
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Date Range Pickers (shown when custom is selected) */}
                  {salesPeriod === 'custom' && (
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400 font-medium">From Date:</label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400 font-medium">To Date:</label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => fetchReport('custom', customStartDate, customEndDate)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
                      >
                        Apply Filter
                      </button>
                    </div>
                  )}
                </div>

                {loadingReport ? (
                  <div className="p-12 text-center text-slate-500 bg-slate-900/50 rounded-3xl border border-slate-800">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-2" />
                    <span className="text-xs font-bold">Calculating sales metrics for {salesPeriod}...</span>
                  </div>
                ) : reportData ? (
                  <>
                    {/* Financial Summary 5 Primary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Gross Sales
                        </span>
                        <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
                          £{(reportData.totalSales || 0).toFixed(2)}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                          <span className="text-teal-400 font-semibold">Cash: £{(reportData.cashSales || 0).toFixed(2)}</span>
                          <span>•</span>
                          <span className="text-blue-400 font-semibold">Card: £{(reportData.cardSales || 0).toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="bg-slate-900 border border-rose-500/30 p-4 rounded-2xl bg-rose-950/10 shadow-sm">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                          Sales Returns
                        </span>
                        <div className="text-2xl font-black text-rose-400 mt-1 font-mono">
                          -£{(reportData.totalRefunds || 0).toFixed(2)}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-rose-300/80 mt-0.5">
                          <span>Cash: -£{(reportData.cashRefunds || 0).toFixed(2)}</span>
                          <span>•</span>
                          <span>Card: -£{(reportData.cardRefunds || 0).toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="bg-slate-900 border border-emerald-500/30 p-4 rounded-2xl bg-emerald-950/10 shadow-sm">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                          Net Sales (Turnover)
                        </span>
                        <div className="text-2xl font-black text-emerald-300 mt-1 font-mono">
                          £{(reportData.netSales !== undefined ? reportData.netSales : Math.max(0, (reportData.totalSales || 0) - (reportData.totalRefunds || 0))).toFixed(2)}
                        </div>
                        <span className="text-[10px] text-emerald-400/70">Actual Till Revenue</span>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Cash in Drawer (To Count)
                        </span>
                        <div className="text-2xl font-black text-teal-300 mt-1 font-mono">
                          £{(reportData.netCash !== undefined ? reportData.netCash : (reportData.cashSales || 0) - (reportData.cashRefunds || 0)).toFixed(2)}
                        </div>
                        <span className="text-[10px] text-slate-500">{reportData.cashOrdersCount || 0} Cash Sales minus Refunds</span>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Card Machine Total
                        </span>
                        <div className="text-2xl font-black text-blue-400 mt-1 font-mono">
                          £{(reportData.netCard !== undefined ? reportData.netCard : (reportData.cardSales || 0) - (reportData.cardRefunds || 0)).toFixed(2)}
                        </div>
                        <span className="text-[10px] text-slate-500">{reportData.cardOrdersCount || 0} Card terminal settlements</span>
                      </div>
                    </div>

                    {/* Secondary Metrics & Payment Method Distribution */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400">Average Basket</span>
                          <div className="text-lg font-black text-white font-mono mt-0.5">
                            £{(reportData.averageBasket || (reportData.transactionCount > 0 ? (reportData.totalSales / reportData.transactionCount) : 0)).toFixed(2)}
                          </div>
                          <span className="text-[10px] text-slate-500">Revenue per customer</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
                          <ShoppingCart className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400">HMRC VAT Total</span>
                          <div className="text-lg font-black text-amber-300 font-mono mt-0.5">
                            £{(reportData.vatCollected || 0).toFixed(2)}
                          </div>
                          <span className="text-[10px] text-slate-500">UK Standard 20% Tax</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400">
                          <Receipt className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-300">Payment Breakdown</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Cash: {reportData.totalSales > 0 ? Math.round(((reportData.cashSales || 0) / reportData.totalSales) * 100) : 0}% • Card: {reportData.totalSales > 0 ? Math.round(((reportData.cardSales || 0) / reportData.totalSales) * 100) : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex mt-2">
                          <div
                            className="bg-teal-400 h-full transition-all"
                            style={{
                              width: `${reportData.totalSales > 0 ? ((reportData.cashSales || 0) / reportData.totalSales) * 100 : 50}%`,
                            }}
                            title={`Cash: £${(reportData.cashSales || 0).toFixed(2)}`}
                          />
                          <div
                            className="bg-blue-500 h-full transition-all"
                            style={{
                              width: `${reportData.totalSales > 0 ? ((reportData.cardSales || 0) / reportData.totalSales) * 100 : 50}%`,
                            }}
                            title={`Card: £${(reportData.cardSales || 0).toFixed(2)}`}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-teal-400" /> Cash: £{(reportData.cashSales || 0).toFixed(2)}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-blue-500" /> Card: £{(reportData.cardSales || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Daily Bills (with Reprint) & Sold Products Ranking Dual View */}
                    <div className={`rounded-3xl p-5 shadow-lg space-y-4 transition-colors ${
                      themeMode === 'light'
                        ? 'bg-white border border-slate-200 text-slate-900 shadow-slate-200/50'
                        : 'bg-slate-900 border border-slate-800 text-white'
                    }`}>
                      {/* View Switcher: Bills & Receipts vs Sold Items */}
                      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 ${
                        themeMode === 'light' ? 'border-slate-200' : 'border-slate-800'
                      }`}>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSalesReportViewMode('bills')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              salesReportViewMode === 'bills'
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                                : themeMode === 'light'
                                  ? 'bg-slate-100 text-slate-600 hover:text-slate-950 border border-slate-200'
                                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                          >
                            <Receipt className="w-4 h-4 text-emerald-300" />
                            <span>Daily Bills &amp; Receipts ({reportBills.length})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSalesReportViewMode('items')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              salesReportViewMode === 'items'
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                                : themeMode === 'light'
                                  ? 'bg-slate-100 text-slate-600 hover:text-slate-950 border border-slate-200'
                                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                          >
                            <Package className="w-4 h-4 text-amber-300" />
                            <span>Sold Items Breakdown ({(reportData.allSoldItems || reportData.topItems || []).length})</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          {salesReportViewMode === 'bills' && reportBills.length > 0 && (
                            <button
                              type="button"
                              onClick={handleClearAllTestBills}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-300/40 transition-all cursor-pointer whitespace-nowrap shadow-xs"
                              title="Clear all test / sample bills"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Clear Test Sales</span>
                            </button>
                          )}
                          <div className="relative w-full sm:w-64">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={salesReportViewMode === 'bills' ? billSearchQuery : salesSearchQuery}
                              onChange={(e) => {
                                if (salesReportViewMode === 'bills') {
                                  setBillSearchQuery(e.target.value);
                                } else {
                                  setSalesSearchQuery(e.target.value);
                                }
                              }}
                              placeholder={salesReportViewMode === 'bills' ? 'Search bill # (e.g. KSS-...), cashier...' : 'Filter sold items...'}
                              className={`w-full rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono focus:outline-none focus:border-emerald-500 transition-colors ${
                                themeMode === 'light'
                                  ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400'
                                  : 'bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500'
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* VIEW 1: DAILY BILLS & RECEIPTS WITH REPRINT BUTTON */}
                      {salesReportViewMode === 'bills' && (() => {
                        const filteredBills = reportBills.filter((b: any) => {
                          if (!billSearchQuery.trim()) return true;
                          const q = billSearchQuery.toLowerCase();
                          const rc = (b.receiptNumber || '').toLowerCase();
                          const cs = (b.cashier || '').toLowerCase();
                          const pm = (b.paymentMethod || '').toLowerCase();
                          const tot = String(b.total || '');
                          return rc.includes(q) || cs.includes(q) || pm.includes(q) || tot.includes(q);
                        });

                        return filteredBills.length > 0 ? (
                          <div className="overflow-x-auto max-h-96 overflow-y-auto no-scrollbar">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className={`border-b text-[10px] uppercase tracking-wider font-bold ${
                                  themeMode === 'light'
                                    ? 'border-slate-200 text-slate-600 bg-slate-50'
                                    : 'border-slate-800 text-slate-400 bg-slate-950/60'
                                }`}>
                                  <th className="py-2.5 px-3">Receipt No</th>
                                  <th className="py-2.5 px-3">Date &amp; Time</th>
                                  <th className="py-2.5 px-3">Cashier</th>
                                  <th className="py-2.5 px-3">Items Purchased</th>
                                  <th className="py-2.5 px-3 text-center">Payment</th>
                                  <th className="py-2.5 px-3 text-right">Total (£)</th>
                                  <th className="py-2.5 px-3 text-center">Action</th>
                                </tr>
                              </thead>
                              <tbody className={`divide-y font-mono text-[11px] ${
                                themeMode === 'light' ? 'divide-slate-200' : 'divide-slate-800/60'
                              }`}>
                                {filteredBills.map((bill: any, idx: number) => {
                                  const itemCount = Array.isArray(bill.items)
                                    ? bill.items.reduce((s: number, i: any) => s + (Number(i.qty) || 1), 0)
                                    : 0;
                                  const firstItem = bill.items?.[0]?.name || 'Items';
                                  const itemsText = Array.isArray(bill.items) && bill.items.length > 1
                                    ? `${firstItem} + ${bill.items.length - 1} more (${itemCount} pcs)`
                                    : `${firstItem} (${itemCount} pcs)`;

                                  const dateStr = bill.timestamp
                                    ? new Date(bill.timestamp).toLocaleString('en-GB')
                                    : bill.date || 'Recent';

                                  return (
                                    <tr key={bill.receiptNumber || idx} className={`transition-colors ${
                                      themeMode === 'light' ? 'hover:bg-emerald-50/50' : 'hover:bg-slate-800/50'
                                    }`}>
                                      <td className="py-2.5 px-3 font-bold">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-xs font-black tracking-wider shadow-xs ${
                                          themeMode === 'light'
                                            ? 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-extrabold'
                                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 font-extrabold'
                                        }`}>
                                          <Receipt className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                                          {bill.receiptNumber}
                                        </span>
                                      </td>
                                      <td className={`py-2.5 px-3 text-[10px] font-sans ${themeMode === 'light' ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>
                                        {dateStr}
                                      </td>
                                      <td className={`py-2.5 px-3 text-[10px] font-sans ${themeMode === 'light' ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                                        {bill.cashier || 'Admin'}
                                      </td>
                                      <td className={`py-2.5 px-3 font-sans text-xs truncate max-w-xs font-medium ${themeMode === 'light' ? 'text-slate-900' : 'text-slate-200'}`} title={bill.items?.map((it: any) => `${it.qty}x ${it.name}`).join(', ')}>
                                        {itemsText}
                                      </td>
                                      <td className="py-2.5 px-3 text-center">
                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                                          bill.paymentMethod === 'card'
                                            ? themeMode === 'light'
                                              ? 'bg-blue-100 text-blue-900 border border-blue-300 font-black'
                                              : 'bg-blue-950 text-blue-300 border border-blue-500/30'
                                            : themeMode === 'light'
                                              ? 'bg-teal-100 text-teal-900 border border-teal-300 font-black'
                                              : 'bg-teal-950 text-teal-300 border border-teal-500/30'
                                        }`}>
                                          {bill.paymentMethod || 'cash'}
                                        </span>
                                      </td>
                                      <td className={`py-2.5 px-3 text-right font-black text-xs ${themeMode === 'light' ? 'text-slate-950' : 'text-white'}`}>
                                        £{Number(bill.total || 0).toFixed(2)}
                                      </td>
                                      <td className="py-2.5 px-3 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => handleReprintReceipt(bill)}
                                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-md transition-all cursor-pointer hover:scale-105"
                                            title="Reprint official thermal receipt"
                                          >
                                            <Printer className="w-3.5 h-3.5" />
                                            <span>Reprint</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteBill(bill.receiptNumber)}
                                            className="p-1.5 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-all cursor-pointer border border-rose-300/30 hover:scale-105"
                                            title="Delete this test bill (ബിൽ ഡിലീറ്റ് ചെയ്യുക)"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="py-12 text-center text-slate-500 space-y-2">
                            <Receipt className="w-8 h-8 mx-auto text-slate-600" />
                            <p className="text-xs font-bold text-slate-400">No bills found matching &quot;{billSearchQuery}&quot;.</p>
                            <p className="text-[11px] text-slate-500">Completed counter sales will appear here for instant reprint.</p>
                          </div>
                        );
                      })()}

                      {/* VIEW 2: SOLD PRODUCTS BREAKDOWN */}
                      {salesReportViewMode === 'items' && (() => {
                        const items = (reportData.allSoldItems || reportData.topItems || []).filter((it: any) => {
                          if (!salesSearchQuery.trim()) return true;
                          const q = salesSearchQuery.toLowerCase();
                          return (it.name || '').toLowerCase().includes(q) || (it.barcode || '').includes(q);
                        });

                        return items.length > 0 ? (
                          <div className="overflow-x-auto max-h-80 overflow-y-auto no-scrollbar">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                                  <th className="py-2.5 px-3">#</th>
                                  <th className="py-2.5 px-3">Product Name</th>
                                  <th className="py-2.5 px-3">Barcode</th>
                                  <th className="py-2.5 px-3 text-center">Units Sold</th>
                                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                                  <th className="py-2.5 px-3 text-right">Total Revenue</th>
                                  <th className="py-2.5 px-3 text-right">% of Sales</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                                {items.map((item: any, idx: number) => {
                                  const pct = reportData.totalSales > 0 ? (item.revenue / reportData.totalSales) * 100 : 0;
                                  return (
                                    <tr key={item.barcode || idx} className="hover:bg-slate-800/50">
                                      <td className="py-2 px-3 text-slate-500 font-bold">#{idx + 1}</td>
                                      <td className="py-2 px-3 font-sans font-bold text-white truncate max-w-xs">
                                        {item.name}
                                      </td>
                                      <td className="py-2 px-3 text-slate-400 text-[10px]">{item.barcode}</td>
                                      <td className="py-2 px-3 text-center font-bold text-white">
                                        <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                                          {item.qty} pcs
                                        </span>
                                      </td>
                                      <td className="py-2 px-3 text-right text-slate-300">
                                        £{Number(item.price || 0).toFixed(2)}
                                      </td>
                                      <td className="py-2 px-3 text-right font-bold text-emerald-400">
                                        £{Number(item.revenue || 0).toFixed(2)}
                                      </td>
                                      <td className="py-2 px-3 text-right font-sans text-slate-400 text-[10px]">
                                        {pct.toFixed(1)}%
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="py-10 text-center text-slate-500 space-y-1">
                            <ShoppingCart className="w-6 h-6 mx-auto text-slate-600" />
                            <p className="text-xs">No matching transactions found for this period filter.</p>
                          </div>
                        );
                      })()}
                    </div>
                  </>
                ) : null}
              </div>
            )}

            {/* ======================================================== */}
            {/* SUB-TAB 2: CLOSING STOCK AUDIT & INVENTORY VALUATION     */}
            {/* ======================================================== */}
            {reportsSubTab === 'closing_stock' && (
              <div className="space-y-6 animate-in fade-in">
                {/* 6 Closing Stock Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className={`p-4 rounded-2xl transition-colors ${
                    themeMode === 'light'
                      ? 'bg-white border border-slate-200 shadow-xs'
                      : 'bg-slate-900 border border-slate-800 shadow-sm'
                  }`}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${themeMode === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                      Closing Stock Worth
                    </span>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                      £{closingStockMetrics.totalRetailValue.toFixed(2)}
                    </div>
                    <span className={`text-[10px] ${themeMode === 'light' ? 'text-slate-500' : 'text-slate-500'}`}>Retail shelf asset value</span>
                  </div>

                  <div className={`p-4 rounded-2xl transition-colors ${
                    themeMode === 'light'
                      ? 'bg-white border border-slate-200 shadow-xs'
                      : 'bg-slate-900 border border-slate-800 shadow-sm'
                  }`}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${themeMode === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                      Total Units in Stock
                    </span>
                    <div className={`text-2xl font-black mt-1 font-mono ${themeMode === 'light' ? 'text-slate-900' : 'text-white'}`}>
                      {closingStockMetrics.totalUnits.toLocaleString()}
                    </div>
                    <span className={`text-[10px] ${themeMode === 'light' ? 'text-slate-500' : 'text-slate-500'}`}>Across {products.length} SKUs</span>
                  </div>

                  <div className={`p-4 rounded-2xl transition-colors ${
                    themeMode === 'light'
                      ? 'bg-white border border-slate-200 shadow-xs'
                      : 'bg-slate-900 border border-slate-800 shadow-sm'
                  }`}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${themeMode === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                      Active Catalog SKUs
                    </span>
                    <div className="text-2xl font-black text-teal-600 dark:text-teal-300 mt-1 font-mono">
                      {products.length}
                    </div>
                    <span className={`text-[10px] ${themeMode === 'light' ? 'text-slate-500' : 'text-slate-500'}`}>Product barcodes</span>
                  </div>

                  <div className={`p-4 rounded-2xl transition-colors ${
                    themeMode === 'light'
                      ? 'bg-amber-50/70 border border-amber-300 shadow-xs'
                      : 'bg-slate-900 border border-amber-500/30 bg-amber-950/10 shadow-sm'
                  }`}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${themeMode === 'light' ? 'text-amber-800' : 'text-amber-400'}`}>
                      Low Stock (&le; 5)
                    </span>
                    <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
                      {closingStockMetrics.lowStockCount}
                    </div>
                    <span className={`text-[10px] ${themeMode === 'light' ? 'text-amber-700/80' : 'text-amber-300/70'}`}>Needs reorder</span>
                  </div>

                  <div className={`p-4 rounded-2xl transition-colors ${
                    themeMode === 'light'
                      ? 'bg-rose-50/70 border border-rose-300 shadow-xs'
                      : 'bg-slate-900 border border-rose-500/30 bg-rose-950/10 shadow-sm'
                  }`}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${themeMode === 'light' ? 'text-rose-800' : 'text-rose-400'}`}>
                      Out of Stock (0)
                    </span>
                    <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono">
                      {closingStockMetrics.outOfStockCount}
                    </div>
                    <span className={`text-[10px] ${themeMode === 'light' ? 'text-rose-700/80' : 'text-rose-300/70'}`}>Zero shelf units</span>
                  </div>

                  <div className={`p-4 rounded-2xl transition-colors ${
                    themeMode === 'light'
                      ? 'bg-blue-50/70 border border-blue-300 shadow-xs'
                      : 'bg-slate-900 border border-blue-500/30 bg-blue-950/10 shadow-sm'
                  }`}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${themeMode === 'light' ? 'text-blue-800' : 'text-blue-400'}`}>
                      Sold on Audit Date
                    </span>
                    <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 font-mono">
                      {totalSoldOnDate} pcs
                    </div>
                    <span className={`text-[10px] ${themeMode === 'light' ? 'text-blue-700/80' : 'text-blue-300/70'}`}>On {closingStockAuditDate}</span>
                  </div>
                </div>

                {/* Filter, Audit Date & Action Bar */}
                <div className={`p-4 rounded-3xl space-y-3 transition-colors ${
                  themeMode === 'light'
                    ? 'bg-white border border-slate-200 shadow-xs'
                    : 'bg-slate-900 border border-slate-800 shadow-md'
                }`}>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Live Search */}
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={closingStockSearchQuery}
                        onChange={(e) => {
                          setClosingStockSearchQuery(e.target.value);
                          setClosingStockPage(1);
                        }}
                        placeholder="Search stock by item name, barcode, or category..."
                        className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500 transition-colors ${
                          themeMode === 'light'
                            ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400'
                            : 'bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500'
                        }`}
                      />
                    </div>

                    {/* Date Picker, Category Dropdown & Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Date-wise Audit selector */}
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-colors ${
                        themeMode === 'light'
                          ? 'bg-slate-50 border-slate-200 text-slate-800'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}>
                        <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-bold text-[11px] whitespace-nowrap">Audit Date:</span>
                        <input
                          type="date"
                          value={closingStockAuditDate}
                          onChange={(e) => setClosingStockAuditDate(e.target.value)}
                          className="bg-transparent font-mono font-bold text-xs focus:outline-none cursor-pointer"
                        />
                      </div>

                      {/* Category Dropdown */}
                      <select
                        value={closingStockFilterCategory}
                        onChange={(e) => {
                          setClosingStockFilterCategory(e.target.value);
                          setClosingStockPage(1);
                        }}
                        className={`text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 transition-colors ${
                          themeMode === 'light'
                            ? 'bg-slate-50 border border-slate-200 text-slate-900'
                            : 'bg-slate-950 border border-slate-800 text-slate-200'
                        }`}
                      >
                        <option value="all">All Categories ({availableCategories.length})</option>
                        {availableCategories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>

                      {/* Print Detailed Report (A4 / Page Print) */}
                      <button
                        type="button"
                        onClick={() => setClosingStockA4ModalOpen(true)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer hover:scale-105 transition-all"
                        title="Print detailed full-page A4 closing stock audit report"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Detailed Report (A4)</span>
                      </button>

                      {/* Print Thermal Slip */}
                      <button
                        type="button"
                        onClick={() => setClosingStockModalOpen(true)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all border ${
                          themeMode === 'light'
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }`}
                        title="Print thermal closing stock certificate"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Thermal Slip</span>
                      </button>

                      {/* Export CSV */}
                      <button
                        type="button"
                        onClick={handleDownloadClosingStockCsv}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all border ${
                          themeMode === 'light'
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }`}
                        title="Download complete closing stock CSV"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="hidden sm:inline">Export CSV</span>
                      </button>
                    </div>
                  </div>

                  {/* Stock Status Filter Pills */}
                  <div className={`flex items-center gap-2 pt-2 border-t overflow-x-auto no-scrollbar ${
                    themeMode === 'light' ? 'border-slate-200' : 'border-slate-800'
                  }`}>
                    <span className={`text-[11px] font-bold shrink-0 ${themeMode === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Status:</span>
                    {[
                      { id: 'all', label: `All Items (${products.length})` },
                      { id: 'in_stock', label: 'Healthy Stock (> 5)' },
                      { id: 'low_stock', label: `Low Stock (≤ 5) [${closingStockMetrics.lowStockCount}]` },
                      { id: 'out_of_stock', label: `Out of Stock (0) [${closingStockMetrics.outOfStockCount}]` },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setClosingStockStatusFilter(st.id as any);
                          setClosingStockPage(1);
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                          closingStockStatusFilter === st.id
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : themeMode === 'light'
                            ? 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comprehensive Closing Stock Inventory Table */}
                <div className={`rounded-3xl p-5 shadow-sm space-y-4 transition-colors ${
                  themeMode === 'light'
                    ? 'bg-white border border-slate-200'
                    : 'bg-slate-900 border border-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-sm font-black flex items-center gap-2 ${themeMode === 'light' ? 'text-slate-900' : 'text-white'}`}>
                        <span>Closing Stock Inventory Register</span>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
                          {filteredClosingStockItems.length} Products Found
                        </span>
                      </h3>
                      <p className={`text-xs ${themeMode === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                        Showing page {closingStockPage} of {closingStockTotalPages} (50 items per page) • Audit Date: {closingStockAuditDate}
                      </p>
                    </div>

                    {/* Page pagination controls */}
                    <div className="flex items-center gap-1 text-xs">
                      <button
                        type="button"
                        disabled={closingStockPage <= 1}
                        onClick={() => setClosingStockPage((p) => Math.max(1, p - 1))}
                        className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer disabled:opacity-40 transition-colors ${
                          themeMode === 'light'
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        Prev
                      </button>
                      <span className={`px-2 font-mono text-xs font-bold ${themeMode === 'light' ? 'text-slate-700' : 'text-slate-400'}`}>
                        {closingStockPage} / {closingStockTotalPages}
                      </span>
                      <button
                        type="button"
                        disabled={closingStockPage >= closingStockTotalPages}
                        onClick={() => setClosingStockPage((p) => Math.min(closingStockTotalPages, p + 1))}
                        className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer disabled:opacity-40 transition-colors ${
                          themeMode === 'light'
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto no-scrollbar">
                    <table className="w-full text-left text-xs">
                      <thead className={`sticky top-0 z-10 ${
                        themeMode === 'light' ? 'bg-slate-50 text-slate-700' : 'bg-slate-900 text-slate-400'
                      }`}>
                        <tr className={`border-b text-[10px] uppercase tracking-wider font-extrabold ${
                          themeMode === 'light' ? 'border-slate-200' : 'border-slate-800'
                        }`}>
                          <th className="py-2.5 px-3">Barcode</th>
                          <th className="py-2.5 px-3">Product Name</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3 text-right">Shelf Price</th>
                          <th className="py-2.5 px-3 text-center">Sold on Date</th>
                          <th className="py-2.5 px-3 text-center">Closing Qty</th>
                          <th className="py-2.5 px-3 text-right">Closing Value (£)</th>
                          <th className="py-2.5 px-3 text-center">Stock Status</th>
                          <th className="py-2.5 px-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y font-mono text-[11px] ${
                        themeMode === 'light' ? 'divide-slate-200' : 'divide-slate-800/60'
                      }`}>
                        {paginatedClosingStockItems.map((prod) => {
                          const val = prod.stock * prod.price;
                          const soldQty = dateSoldMap[prod.barcode]?.qty || 0;
                          return (
                            <tr key={prod.barcode} className={`transition-colors ${
                              themeMode === 'light' ? 'hover:bg-emerald-50/40' : 'hover:bg-slate-800/50'
                            }`}>
                              <td className={`py-2.5 px-3 ${themeMode === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                                {prod.barcode}
                              </td>
                              <td className={`py-2.5 px-3 font-sans font-bold max-w-xs truncate ${themeMode === 'light' ? 'text-slate-900' : 'text-white'}`} title={prod.name}>
                                {prod.name}
                              </td>
                              <td className={`py-2.5 px-3 font-sans text-[10px] max-w-[140px] truncate ${themeMode === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                                {prod.category || 'General Grocery'}
                              </td>
                              <td className={`py-2.5 px-3 text-right font-black ${themeMode === 'light' ? 'text-slate-950' : 'text-white'}`}>
                                £{prod.price.toFixed(2)}
                              </td>
                              <td className={`py-2.5 px-3 text-center font-bold ${
                                soldQty > 0
                                  ? themeMode === 'light' ? 'text-blue-800' : 'text-blue-300'
                                  : themeMode === 'light' ? 'text-slate-400' : 'text-slate-600'
                              }`}>
                                {soldQty > 0 ? `${soldQty} pcs` : '-'}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span
                                  className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-black tracking-wide shadow-2xs ${
                                    prod.stock <= 0
                                      ? themeMode === 'light'
                                        ? 'bg-rose-100 text-rose-950 border border-rose-300 font-extrabold'
                                        : 'bg-rose-950/80 text-rose-300 border border-rose-500/50 font-extrabold'
                                      : prod.stock <= 5
                                      ? themeMode === 'light'
                                        ? 'bg-amber-100 text-amber-950 border border-amber-300 font-extrabold'
                                        : 'bg-amber-950/80 text-amber-300 border border-amber-500/50 font-extrabold'
                                      : themeMode === 'light'
                                      ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 font-extrabold'
                                      : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 font-extrabold'
                                  }`}
                                >
                                  {prod.stock} units
                                </span>
                              </td>
                              <td className={`py-2.5 px-3 text-right font-black ${themeMode === 'light' ? 'text-emerald-800' : 'text-emerald-400'}`}>
                                £{val.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-center font-sans text-[10px]">
                                {prod.stock <= 0 ? (
                                  <span className={`font-black ${themeMode === 'light' ? 'text-rose-700' : 'text-rose-400'}`}>Out of Stock</span>
                                ) : prod.stock <= 5 ? (
                                  <span className={`font-black ${themeMode === 'light' ? 'text-amber-800' : 'text-amber-400'}`}>Low Stock</span>
                                ) : (
                                  <span className={`font-black ${themeMode === 'light' ? 'text-emerald-700' : 'text-emerald-400'}`}>In Stock</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center font-sans">
                                <button
                                  type="button"
                                  onClick={() => openProductEditModal(prod)}
                                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                                    themeMode === 'light'
                                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                  }`}
                                  title="Edit stock or price"
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Bottom Pagination */}
                  <div className={`flex items-center justify-between border-t pt-3 text-xs ${
                    themeMode === 'light' ? 'border-slate-200' : 'border-slate-800'
                  }`}>
                    <span className={`text-[11px] ${themeMode === 'light' ? 'text-slate-500' : 'text-slate-500'}`}>
                      Showing {(closingStockPage - 1) * closingStockPageSize + 1} to{' '}
                      {Math.min(closingStockPage * closingStockPageSize, filteredClosingStockItems.length)} of{' '}
                      {filteredClosingStockItems.length} items
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={closingStockPage <= 1}
                        onClick={() => setClosingStockPage((p) => Math.max(1, p - 1))}
                        className={`px-3 py-1 rounded-lg font-bold cursor-pointer disabled:opacity-40 transition-colors ${
                          themeMode === 'light'
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        disabled={closingStockPage >= closingStockTotalPages}
                        onClick={() => setClosingStockPage((p) => Math.min(closingStockTotalPages, p + 1))}
                        className={`px-3 py-1 rounded-lg font-bold cursor-pointer disabled:opacity-40 transition-colors ${
                          themeMode === 'light'
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>

                {/* Category-Wise Valuation Breakdown Table */}
                <div className={`rounded-3xl p-5 shadow-sm space-y-3 transition-colors ${
                  themeMode === 'light'
                    ? 'bg-white border border-slate-200'
                    : 'bg-slate-900 border border-slate-800'
                }`}>
                  <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center justify-between ${
                    themeMode === 'light' ? 'text-slate-900' : 'text-white'
                  }`}>
                    <span>Category Valuation Summary</span>
                    <span className={`text-[10px] font-mono font-normal ${themeMode === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                      {closingStockMetrics.categoryBreakdown.length} Categories
                    </span>
                  </h4>

                  <div className="overflow-x-auto max-h-64 overflow-y-auto no-scrollbar">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className={`border-b text-[10px] uppercase tracking-wider font-extrabold ${
                          themeMode === 'light' ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'
                        }`}>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3 text-center">SKUs</th>
                          <th className="py-2 px-3 text-center">Units</th>
                          <th className="py-2 px-3 text-right">Closing Value (£)</th>
                          <th className="py-2 px-3 text-right">Asset Share</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y font-mono text-[11px] ${
                        themeMode === 'light' ? 'divide-slate-200' : 'divide-slate-800/60'
                      }`}>
                        {closingStockMetrics.categoryBreakdown.map((c) => (
                          <tr key={c.category} className={`transition-colors ${
                            themeMode === 'light' ? 'hover:bg-slate-50' : 'hover:bg-slate-800/50'
                          }`}>
                            <td className={`py-2 px-3 font-sans font-bold truncate max-w-[160px] ${
                              themeMode === 'light' ? 'text-slate-900' : 'text-white'
                            }`}>
                              {c.category}
                            </td>
                            <td className={`py-2 px-3 text-center ${themeMode === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>{c.skus}</td>
                            <td className={`py-2 px-3 text-center font-bold ${themeMode === 'light' ? 'text-slate-900' : 'text-slate-200'}`}>{c.units.toLocaleString()}</td>
                            <td className={`py-2 px-3 text-right font-black ${themeMode === 'light' ? 'text-emerald-800' : 'text-emerald-400'}`}>
                              £{c.value.toFixed(2)}
                            </td>
                            <td className={`py-2 px-3 text-right font-sans text-[10px] ${themeMode === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                              {c.pct.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: BARCODE & SHELF LABEL PRINT TOOL */}
        {activeTab === 'barcode' && (
          <div className="flex-1 p-6 overflow-y-auto max-w-4xl mx-auto w-full space-y-6">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Scan className="w-5 h-5 text-emerald-400" />
                <span>Barcode &amp; Shelf Price Tag Generator</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate and print UK standard shelf labels (Code128 format) with prices in £ for any product.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Product Selector */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white">1. Select Product</h3>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search item to print label..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="max-h-80 overflow-y-auto space-y-1.5 divide-y divide-slate-800/50">
                  {filteredProducts.slice(0, 30).map((prod) => (
                    <div
                      key={prod.barcode}
                      onClick={() => setLabelProduct(prod)}
                      className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                        labelProduct?.barcode === prod.barcode
                          ? 'bg-emerald-600/20 border border-emerald-500 text-white'
                          : 'hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="truncate min-w-0 pr-2">
                        <span className="text-xs font-bold truncate block">{prod.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{prod.barcode}</span>
                      </div>
                      <span className="text-xs font-black text-emerald-400 shrink-0">
                        £{prod.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Printable Shelf Label Preview */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col items-center">
                <h3 className="text-sm font-bold text-white self-start">2. Shelf Label Preview (50mm x 30mm)</h3>

                {labelProduct ? (
                  <div className="w-72 bg-white text-slate-900 p-4 rounded-xl shadow-2xl border-2 border-slate-300 flex flex-col items-center text-center space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                      Kerala Superstore Manchester
                    </span>
                    <h4 className="text-sm font-black text-slate-900 leading-tight">
                      {labelProduct.name}
                    </h4>
                    <span className="text-xs font-semibold text-slate-600">
                      Pack Size: {labelProduct.sizeWeight}
                    </span>

                    <div className="text-2xl font-black text-slate-950 font-mono py-1">
                      £{labelProduct.price.toFixed(2)}
                    </div>

                    {/* SVG Barcode Graphic */}
                    <div className="w-full flex flex-col items-center pt-1 border-t border-slate-200">
                      <svg className="h-10 w-48" viewBox="0 0 160 40">
                        {/* Realistic Code128 bar pattern */}
                        <rect x="0" y="0" width="160" height="40" fill="#fff" />
                        {[2, 6, 12, 16, 22, 28, 34, 38, 44, 52, 58, 64, 70, 78, 86, 92, 98, 106, 114, 122, 128, 136, 142, 148, 154].map((x, idx) => (
                          <rect key={idx} x={x} y="4" width={idx % 3 === 0 ? "3" : "1.8"} height="30" fill="#000" />
                        ))}
                      </svg>
                      <span className="font-mono text-xs font-bold text-slate-700 tracking-widest mt-1">
                        {labelProduct.barcode}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Select a product on the left to preview its shelf label.
                  </div>
                )}

                {labelProduct && (
                  <button
                    onClick={() => window.print()}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Label to Barcode Printer</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* PAYMENT MODAL (Cash / Card Checkout) */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 isolate">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Payment Settlement</span>
              </h3>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400">Total Due Amount</span>
              <div className="text-3xl font-black text-emerald-400 font-mono mt-1">
                £{grandTotal.toFixed(2)}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Cash Payment</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('card');
                  setCashGiven(grandTotal.toFixed(2));
                }}
                className={`py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  paymentMethod === 'card'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Card / Chip &amp; PIN</span>
              </button>
            </div>

            {/* Cash Tendered Input */}
            {paymentMethod === 'cash' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  Cash Received (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  className="w-full bg-slate-950 border border-emerald-500/60 rounded-xl px-4 py-3 text-lg font-mono font-bold text-white focus:outline-hidden"
                />

                {parseFloat(cashGiven) >= grandTotal && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-300">Change to Customer:</span>
                    <span className="font-mono font-black text-emerald-400 text-base">
                      £{(parseFloat(cashGiven) - grandTotal).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleConfirmPayment}
              disabled={isProcessingCheckout}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-950/60 cursor-pointer disabled:opacity-50 transition-colors"
            >
              {isProcessingCheckout ? 'Processing Sale...' : '✓ Complete Sale & Deduct Stock'}
            </button>
          </div>
        </div>
      )}

      {/* THERMAL RECEIPT MODAL (Formatted 80mm & 58mm ESC/POS layout) */}
      {receiptModalOpen && lastReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 isolate">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">
                Sale Completed ✓ {lastReceipt.paymentMethod === 'cash' ? '(Cash Drawer Kicked)' : ''}
              </span>
              <button
                onClick={() => setReceiptModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Paper Width Selector (Supports All Thermal Printer Hardware) */}
            <div className="flex items-center justify-between bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-[11px] font-semibold text-slate-400">Printer Roll:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setReceiptPaperWidth('80mm')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    receiptPaperWidth === '80mm'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  80mm Standard
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptPaperWidth('58mm')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    receiptPaperWidth === '58mm'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  58mm Compact
                </button>
              </div>
            </div>

            {/* Receipt Preview (Thermal Paper Look with Store Logo) */}
            <div
              id="thermal-receipt-preview"
              className={`bg-white text-slate-950 p-5 rounded-xl font-mono text-[11px] space-y-2 shadow-inner border border-slate-200 ${
                receiptPaperWidth === '58mm' ? 'paper-58mm max-w-[240px] mx-auto text-[9.5px]' : ''
              }`}
            >
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                {/* Official Store Logo on Bill */}
                <img
                  src="/logo.png"
                  alt="Kerala Superstore Logo"
                  className="receipt-logo w-14 h-14 mx-auto object-contain mb-1"
                />
                <h4 className="font-black text-xs uppercase">{storeInfo.name}</h4>
                <p className="text-[10px] text-slate-600">{storeInfo.address}</p>
                <p className="text-[10px] text-slate-600">Tel: {storeInfo.phone}</p>
                <p className="text-[10px] text-slate-600">VAT: {storeInfo.vatNumber}</p>
              </div>

              <div className="flex justify-between text-[10px] text-slate-600 pt-1">
                <span>Receipt: {lastReceipt.receiptNumber}</span>
                <span>{lastReceipt.date}</span>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1">
                {lastReceipt.items.map((it: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="truncate max-w-[170px]">
                      <span>{it.qty}x {it.name}</span>
                    </div>
                    <span>£{(it.price * it.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-0.5 text-right pt-1 font-bold">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>£{lastReceipt.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>VAT:</span>
                  <span>£{lastReceipt.vatTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-black border-t border-slate-400 pt-1">
                  <span>TOTAL PAID:</span>
                  <span>£{lastReceipt.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>Payment:</span>
                  <span className="uppercase">{lastReceipt.paymentMethod}</span>
                </div>
                {lastReceipt.paymentMethod === 'cash' && (
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>Change Due:</span>
                    <span>£{lastReceipt.changeDue.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Direct Bank Transfer Details */}
              <div className="border-t border-dashed border-slate-300 pt-2 text-[9.5px] text-slate-800 space-y-0.5">
                <p className="font-bold text-center uppercase tracking-wider text-[10px] text-slate-900">Direct Bank Transfer</p>
                <div className="flex justify-between">
                  <span className="text-slate-600">Name:</span>
                  <span className="font-bold">Kerala superstore Ltd</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Sort code:</span>
                  <span className="font-bold font-mono">04-00-03</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">ACC.No:</span>
                  <span className="font-bold font-mono">44347284</span>
                </div>
              </div>

              {/* Instagram QR Code Follow Section */}
              <div className="text-center pt-2.5 border-t border-dashed border-slate-300 space-y-1">
                <p className="font-bold text-[9px] uppercase tracking-wider text-slate-700">
                  Follow Us On Instagram
                </p>
                <img
                  src="/instagram-qr.png"
                  alt="Follow @KERALASUPERSTORE on Instagram"
                  className="receipt-qr w-24 h-24 mx-auto object-contain"
                />
                <p className="font-bold font-mono text-[9px] text-slate-900 tracking-wider">
                  @KERALASUPERSTORE
                </p>
              </div>

              <div className="text-center pt-2 border-t border-dashed border-slate-300 text-[10px] text-slate-600">
                <p className="font-bold">Thank you for shopping at Kerala Superstore UK!</p>
                <p className="font-bold">www.keralasuperstore.com</p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => printElementToThermal('thermal-receipt-preview', receiptPaperWidth, lastReceipt?.paymentMethod === 'cash')}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Bill ({receiptPaperWidth})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReceiptModalOpen(false)}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  New Sale
                </button>
              </div>

              {/* Direct Hardware USB Print Option (Bypasses Preview completely) */}
              <button
                type="button"
                onClick={handlePairHardwarePrinter}
                className="w-full py-1.5 px-3 bg-slate-950 hover:bg-slate-800/80 text-emerald-400 border border-emerald-500/30 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                title="Connect printer directly via USB for instant silent printing without any preview dialog"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Direct USB Print (1-Click Pair • Zero Preview)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* THERMAL RETURN / REFUND VOUCHER MODAL (Formatted 80mm & 58mm ESC/POS layout) */}
      {returnSlipModalOpen && lastReturnSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400">Return Processed ✓</span>
              <button
                onClick={() => setReturnSlipModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Return Slip Paper Width Selector */}
            <div className="flex items-center justify-between bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-[11px] font-semibold text-slate-400">Printer Roll:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setReceiptPaperWidth('80mm')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    receiptPaperWidth === '80mm'
                      ? 'bg-rose-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  80mm Standard
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptPaperWidth('58mm')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    receiptPaperWidth === '58mm'
                      ? 'bg-rose-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  58mm Compact
                </button>
              </div>
            </div>

            {/* Return Slip Preview (Thermal Paper Look with Store Logo) */}
            <div
              id="thermal-return-preview"
              className={`bg-white text-slate-950 p-5 rounded-xl font-mono text-[11px] space-y-2 shadow-inner border border-slate-200 ${
                receiptPaperWidth === '58mm' ? 'paper-58mm max-w-[240px] mx-auto text-[9.5px]' : ''
              }`}
            >
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                {/* Official Store Logo on Return Voucher */}
                <img
                  src="/logo.png"
                  alt="Kerala Superstore Logo"
                  className="receipt-logo w-14 h-14 mx-auto object-contain mb-1"
                />
                <h4 className="font-black text-xs uppercase">{storeInfo.name}</h4>
                <p className="text-[10px] text-slate-600">{storeInfo.address}</p>
                <p className="text-[10px] text-slate-600">Tel: {storeInfo.phone}</p>
                <p className="text-[10px] text-slate-600">VAT: {storeInfo.vatNumber}</p>
                <p className="text-xs font-black text-rose-700 mt-1 uppercase">** SALES RETURN &amp; REFUND VOUCHER **</p>
              </div>

              <div className="flex justify-between text-[10px] text-slate-600 pt-1">
                <span>Credit Slip: {lastReturnSlip.returnSlipNumber}</span>
                <span>{lastReturnSlip.date || 'Today'}</span>
              </div>
              <div className="text-[10px] text-slate-600">
                <span>Original Bill Ref: {lastReturnSlip.originalReceiptNumber}</span>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1">
                {lastReturnSlip.items.map((it: any, idx: number) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between items-start">
                      <div className="truncate max-w-[170px]">
                        <span>{it.qty}x {it.name}</span>
                      </div>
                      <span>-£{Number(it.refundAmount || it.price * it.qty).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500">
                      <span>Reason: {it.reason}</span>
                      <span>{it.condition === 'restockable' ? 'Restocked' : 'Waste'}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-0.5 text-right pt-1 font-bold">
                <div className="flex justify-between text-xs font-black border-b border-slate-400 pb-1">
                  <span>TOTAL REFUNDED:</span>
                  <span className="text-rose-700">-£{Number(lastReturnSlip.totalRefund).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-600 pt-1">
                  <span>Refund Method:</span>
                  <span className="uppercase">{lastReturnSlip.refundMethod}</span>
                </div>
                {lastReturnSlip.customerName && (
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>Customer:</span>
                    <span>{lastReturnSlip.customerName}</span>
                  </div>
                )}
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>Cashier:</span>
                  <span>{lastReturnSlip.cashier}</span>
                </div>
              </div>

              <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-600 space-y-2">
                <p>Goods returned acknowledged by store.</p>
                <div className="pt-2 border-t border-dotted border-slate-300">
                  <p className="text-[9px]">Customer / Cashier Signature: __________________</p>
                </div>
                <p className="font-bold">www.keralasuperstore.com</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => printElementToThermal('thermal-return-preview', receiptPaperWidth)}
                className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print Return Slip</span>
              </button>

              <button
                onClick={() => setReturnSlipModalOpen(false)}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. ADMIN PIN VERIFICATION MODAL */}
      {adminPinModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative text-slate-100">
            <button
              onClick={() => {
                setAdminPinModalOpen(false);
                setPendingAdminAction(null);
                setPinError(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white">Admin Security PIN</h3>
              <p className="text-xs text-slate-400">
                Enter Admin PIN or Password to modify prices and stock levels.
                <br />
                <span className="text-[11px] text-slate-500">Cashier restricted: Manager authorization required</span>
              </p>
            </div>

            {pinError && (
              <div className="bg-rose-500/15 border border-rose-500/30 p-2.5 rounded-xl flex items-center gap-2 text-rose-300 text-xs animate-shake">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{pinError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="relative">
                <input
                  type="password"
                  value={enteredPin}
                  onChange={(e) => {
                    setEnteredPin(e.target.value);
                    setPinError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleVerifyPin();
                  }}
                  placeholder="Enter 4-Digit PIN or Password"
                  autoFocus
                  className="w-full text-center tracking-[0.4em] font-mono text-xl py-3 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-white placeholder:tracking-normal placeholder:text-xs placeholder:text-slate-500"
                />
              </div>

              {/* Touch Numpad for Till Display */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (key === 'C') {
                        setEnteredPin('');
                        setPinError(null);
                      } else if (key === 'OK') {
                        handleVerifyPin();
                      } else {
                        setEnteredPin((prev) => prev + key);
                        setPinError(null);
                      }
                    }}
                    className={`py-3 rounded-xl font-bold text-sm transition-all cursor-pointer select-none active:scale-95 ${
                      key === 'OK'
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                        : key === 'C'
                        ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>Default PIN: <strong className="text-slate-400 font-mono">2026</strong></span>
              <button
                type="button"
                onClick={() => {
                  setAdminPinModalOpen(false);
                  setChangePinModalOpen(true);
                }}
                className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Key className="w-3 h-3" />
                <span>Change PIN</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CHANGE ADMIN PIN MODAL */}
      {changePinModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative text-slate-100">
            <button
              onClick={() => {
                setChangePinModalOpen(false);
                setNewAdminPin('');
                setConfirmNewAdminPin('');
                setPinChangeSuccess(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/30">
                <Key className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white">Change Admin PIN</h3>
              <p className="text-xs text-slate-400">Set a new security PIN for managing stock &amp; prices</p>
            </div>

            {pinChangeSuccess && (
              <div className="bg-emerald-500/20 border border-emerald-500/40 p-2.5 rounded-xl flex items-center gap-2 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{pinChangeSuccess}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">New PIN</label>
                <input
                  type="password"
                  value={newAdminPin}
                  onChange={(e) => setNewAdminPin(e.target.value)}
                  placeholder="Enter new PIN (e.g. 2026)"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 text-center tracking-widest font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Confirm New PIN</label>
                <input
                  type="password"
                  value={confirmNewAdminPin}
                  onChange={(e) => setConfirmNewAdminPin(e.target.value)}
                  placeholder="Re-enter new PIN"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 text-center tracking-widest font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setChangePinModalOpen(false)}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNewPin}
                className="py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Save New PIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SINGLE PRODUCT PRICE & STOCK EDIT MODAL */}
      {editProductModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl relative text-slate-100 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => {
                setEditProductModalOpen(false);
                setEditingProduct(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Product Info */}
            <div className="flex items-start gap-3 border-b border-slate-800 pb-3">
              <div className="w-14 h-14 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 relative">
                {editingProduct.imageUrl ? (
                  <img
                    src={editingProduct.imageUrl}
                    alt={editingProduct.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-6 h-6 text-slate-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {editingProduct.category}
                </span>
                <h3 className="font-bold text-white text-sm truncate mt-1">{editingProduct.name}</h3>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                  <span>Barcode: {editingProduct.barcode}</span>
                  <span>•</span>
                  <span>Current: £{editingProduct.price.toFixed(2)}</span>
                  <span>•</span>
                  <span>Stock: {editingProduct.stock}</span>
                </div>
              </div>
            </div>

            {/* SECTION 1: SELLING PRICE */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <Banknote className="w-4 h-4" />
                  <span>Selling Price Edit</span>
                </div>
                {/* Manual vs % toggle */}
                <div className="flex bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setEditPriceMode('manual')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      editPriceMode === 'manual'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Manual (£)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditPriceMode('percent')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      editPriceMode === 'percent'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Percentage (%)
                  </button>
                </div>
              </div>

              {editPriceMode === 'manual' ? (
                <div className="space-y-2">
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold">£</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newPriceInput}
                      onChange={(e) => setNewPriceInput(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  {/* Quick price adjust chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {[0.1, 0.2, 0.5, 1.0].map((add) => (
                      <button
                        key={`add-${add}`}
                        type="button"
                        onClick={() => {
                          const cur = parseFloat(newPriceInput) || editingProduct.price;
                          setNewPriceInput((cur + add).toFixed(2));
                        }}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold border border-slate-700"
                      >
                        +{add.toFixed(2)}
                      </button>
                    ))}
                    {[0.1, 0.2, 0.5].map((sub) => (
                      <button
                        key={`sub-${sub}`}
                        type="button"
                        onClick={() => {
                          const cur = parseFloat(newPriceInput) || editingProduct.price;
                          setNewPriceInput(Math.max(0.1, cur - sub).toFixed(2));
                        }}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-lg text-[11px] font-semibold border border-slate-700"
                      >
                        -{sub.toFixed(2)}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        step="1"
                        value={percentChangeInput}
                        onChange={(e) => setPercentChangeInput(e.target.value)}
                        placeholder="e.g. 5 or -5"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-500"
                      />
                      <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
                    </div>
                    {/* Calculated New Price Preview */}
                    <div className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-right min-w-[110px]">
                      <span className="text-[10px] text-slate-400 block">New Price</span>
                      <span className="font-mono text-sm font-black text-emerald-400">
                        £{Math.max(0.05, Math.round(editingProduct.price * (1 + (parseFloat(percentChangeInput) || 0) / 100) * 100) / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {/* Preset % buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {['+3', '+5', '+10', '+15', '+20', '-5', '-10'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPercentChangeInput(p)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                          percentChangeInput === p
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                      >
                        {p}%
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: STOCK QUANTITY */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <Package className="w-4 h-4" />
                  <span>Stock Inventory Level</span>
                </div>
                {/* Exact vs Delta adjust toggle */}
                <div className="flex bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setEditStockMode('exact')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      editStockMode === 'exact'
                        ? 'bg-amber-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Exact Count
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditStockMode('adjust')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      editStockMode === 'adjust'
                        ? 'bg-amber-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    +/- Adjust
                  </button>
                </div>
              </div>

              {editStockMode === 'exact' ? (
                <div className="space-y-2">
                  <input
                    type="number"
                    min="0"
                    value={newStockInput}
                    onChange={(e) => setNewStockInput(e.target.value)}
                    placeholder="Physical shelf count"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-base font-bold focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[11px] text-slate-500">
                    Direct shelf stock count.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={adjustStockDelta}
                      onChange={(e) => setAdjustStockDelta(e.target.value)}
                      placeholder="e.g. +10 or -2"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-base font-bold focus:outline-none focus:border-amber-500"
                    />
                    <div className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-right min-w-[110px]">
                      <span className="text-[10px] text-slate-400 block">Resulting Stock</span>
                      <span className="font-mono text-sm font-black text-amber-400">
                        {Math.max(0, editingProduct.stock + (parseInt(adjustStockDelta) || 0))} units
                      </span>
                    </div>
                  </div>
                  {/* Delta presets */}
                  <div className="flex flex-wrap gap-1.5">
                    {['+5', '+10', '+20', '+50', '-1', '-5'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setAdjustStockDelta(d)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                          adjustStockDelta === d
                            ? 'bg-amber-600 text-white border-amber-500'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reason input */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Adjustment Reason / Note</label>
              <input
                type="text"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="e.g. Shelf audit, Supplier cost change, Expired item"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-slate-500"
              />
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setEditProductModalOpen(false);
                  setEditingProduct(null);
                }}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingProductEdit}
                onClick={handleSaveProductEdit}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                {isSavingProductEdit ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Syncing Supabase...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save &amp; Sync to Till</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. BULK CATEGORY % PRICE ADJUSTMENT MODAL */}
      {bulkCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl relative text-slate-100">
            <button
              onClick={() => {
                setBulkCategoryModalOpen(false);
                setBulkSuccessMsg(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/30">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Bulk % Price Adjustment</h3>
                <p className="text-xs text-slate-400">Apply a percentage price adjustment across all products in this category</p>
              </div>
            </div>

            {bulkSuccessMsg && (
              <div className="bg-emerald-500/20 border border-emerald-500/40 p-3 rounded-xl flex items-center gap-2 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{bulkSuccessMsg}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Select Category</label>
                <select
                  value={bulkCategorySelected}
                  onChange={(e) => setBulkCategorySelected(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="All">All Categories (Storewide 3,000+ items)</option>
                  <option value="Spices & Masalas">Spices & Masalas</option>
                  <option value="Rice & Flours">Rice & Flours</option>
                  <option value="Pulses & Dal">Pulses & Dal</option>
                  <option value="Fish & Meat">Fish & Meat</option>
                  <option value="Snacks & Bakery">Snacks & Bakery</option>
                  <option value="Oils & Ghee">Oils & Ghee</option>
                  <option value="Frozen Foods">Frozen Foods</option>
                  <option value="Tea & Coffee">Tea & Coffee</option>
                  <option value="Household & Toiletries">Household & Toiletries</option>
                  <option value="General Grocery">General Grocery</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-400">Percentage Change (+/- %)</label>
                  <span className="text-[11px] font-mono text-indigo-400 font-bold">
                    {parseFloat(bulkPercentChange) > 0 ? `+${bulkPercentChange}%` : `${bulkPercentChange}%`}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={bulkPercentChange}
                    onChange={(e) => setBulkPercentChange(e.target.value)}
                    placeholder="e.g. 5 or -5"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm font-bold focus:outline-none focus:border-indigo-500"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
                </div>
                {/* Preset chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['+2', '+3', '+5', '+7.5', '+10', '+15', '-5'].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setBulkPercentChange(pct)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                        bulkPercentChange === pct
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* UK Retail Psychological Rounding Checkbox */}
              <label className="flex items-center gap-2 p-3 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-950 transition-all">
                <input
                  type="checkbox"
                  checked={bulkRoundTo99p}
                  onChange={(e) => setBulkRoundTo99p(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-0"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 block">Round to UK Retail .99p / .49p</span>
                  <span className="text-[11px] text-slate-500">e.g. £2.87 will be rounded to £2.99 or £2.49 for customer psychological pricing</span>
                </div>
              </label>

              <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-[11px] text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <span>
                  Admin Warning: This will update prices in both POS Terminal inventory and Supabase online store catalog immediately.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setBulkCategoryModalOpen(false)}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingBulkPrice}
                onClick={handleApplyBulkCategoryPrice}
                className="py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                {isProcessingBulkPrice ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Updating Prices...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Apply % Adjustment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CLOSING STOCK STATEMENT THERMAL PRINT MODAL */}
      {closingStockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-3 animate-scale-up max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Boxes className="w-4 h-4" />
                <span>Closing Stock Audit ✓</span>
              </span>
              <button
                onClick={() => setClosingStockModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Paper Width Selector */}
            <div className="flex items-center justify-between bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-[11px] font-semibold text-slate-400">Printer Roll:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setReceiptPaperWidth('80mm')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    receiptPaperWidth === '80mm'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  80mm Standard
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptPaperWidth('58mm')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    receiptPaperWidth === '58mm'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  58mm Compact
                </button>
              </div>
            </div>

            {/* Closing Stock Slip Preview (Thermal Paper Look with Store Logo) */}
            <div
              id="thermal-closing-stock-preview"
              className={`bg-white text-slate-950 p-5 rounded-xl font-mono text-[11px] space-y-2 shadow-inner border border-slate-200 ${
                receiptPaperWidth === '58mm' ? 'paper-58mm max-w-[240px] mx-auto text-[9.5px]' : ''
              }`}
            >
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                <img
                  src="/logo.png"
                  alt="Kerala Superstore Logo"
                  className="receipt-logo w-14 h-14 mx-auto object-contain mb-1"
                />
                <h4 className="font-black text-xs uppercase">{storeInfo.name}</h4>
                <p className="text-[10px] text-slate-600">{storeInfo.address}</p>
                <p className="text-[10px] text-slate-600">Tel: {storeInfo.phone}</p>
                <p className="text-[10px] text-slate-600">VAT: {storeInfo.vatNumber}</p>
                <p className="text-xs font-black text-emerald-700 mt-1 uppercase">** DAILY CLOSING STOCK AUDIT **</p>
              </div>

              <div className="flex justify-between text-[10px] text-slate-600 pt-1">
                <span>Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                <span>Time: {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>Till / Register: 01</span>
                <span>Auditor: {cashierName}</span>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Total Active SKUs:</span>
                  <span className="font-bold">{closingStockMetrics.totalSkus}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Physical Units:</span>
                  <span className="font-bold">{closingStockMetrics.totalUnits.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-200">
                  <span>CLOSING VALUATION:</span>
                  <span className="text-emerald-700 font-mono">£{closingStockMetrics.totalRetailValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-rose-600">
                  <span>Out of Stock (0):</span>
                  <span>{closingStockMetrics.outOfStockCount} items</span>
                </div>
                <div className="flex justify-between text-[10px] text-amber-600">
                  <span>Low Stock (&le; 5):</span>
                  <span>{closingStockMetrics.lowStockCount} items</span>
                </div>
              </div>

              {/* Category Summary on Receipt */}
              <div className="py-1 text-[10px] space-y-0.5 border-b border-dashed border-slate-300">
                <span className="font-bold block uppercase mb-1">Category Valuation:</span>
                {closingStockMetrics.categoryBreakdown.slice(0, 7).map((c) => (
                  <div key={c.category} className="flex justify-between">
                    <span className="truncate max-w-[150px]">{c.category}:</span>
                    <span>£{c.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="text-center pt-3 text-[10px] text-slate-600 space-y-2">
                <p>Official stock closing count verified.</p>
                <div className="pt-2 border-t border-dotted border-slate-300">
                  <p className="text-[9px]">Manager Sign: __________________</p>
                </div>
                <p className="font-bold">www.keralasuperstore.com</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => printElementToThermal('thermal-closing-stock-preview', receiptPaperWidth)}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print Slip ({receiptPaperWidth})</span>
              </button>

              <button
                onClick={() => setClosingStockModalOpen(false)}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5B. DETAILED DATE-WISE CLOSING STOCK & AUDIT REPORT (A4 FULL PAGE PRINT MODAL) */}
      {closingStockA4ModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/85 backdrop-blur-md overflow-hidden">
          {/* Top Floating Control Bar (Hidden on print) */}
          <div className="no-print bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-lg z-20">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setClosingStockA4ModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-emerald-400" />
                  <span>Daily Detailed Closing Stock & Inventory Audit Report (A4)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Certified stock report with date-wise sales, item valuation, and sign-off
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Audit Date Picker */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200">
                <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-bold text-[11px] text-slate-400">Audit Date:</span>
                <input
                  type="date"
                  value={closingStockAuditDate}
                  onChange={(e) => setClosingStockAuditDate(e.target.value)}
                  className="bg-transparent font-mono font-bold text-xs focus:outline-none cursor-pointer text-white"
                />
              </div>

              {/* Category Filter */}
              <select
                value={closingStockFilterCategory}
                onChange={(e) => {
                  setClosingStockFilterCategory(e.target.value);
                  setClosingStockPage(1);
                }}
                className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">All Categories ({availableCategories.length})</option>
                {availableCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Report Scope Selector */}
              <select
                value={a4ReportScope}
                onChange={(e) => setA4ReportScope(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer font-bold"
                title="Select items to include in report ledger"
              >
                <option value="low_and_out">Scope: Low & Out of Stock ({closingStockMetrics.lowStockCount + closingStockMetrics.outOfStockCount})</option>
                <option value="all">Scope: Full Catalog (All {filteredClosingStockItems.length})</option>
                <option value="low_only">Scope: Low Stock Only ({closingStockMetrics.lowStockCount})</option>
                <option value="out_only">Scope: Out of Stock (0) ({closingStockMetrics.outOfStockCount})</option>
              </select>

              {/* Export CSV */}
              <button
                type="button"
                onClick={handleDownloadClosingStockCsv}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                title="Export complete inventory CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV</span>
              </button>

              {/* Save Document (.html) */}
              <button
                type="button"
                onClick={handleSaveClosingStockHtmlDocument}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                title="Save self-contained report file for offline viewing or emailing"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Save Document</span>
              </button>

              {/* Print A4 / Save as PDF */}
              <button
                type="button"
                onClick={handlePrintA4ClosingStock}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg cursor-pointer hover:scale-105 transition-all"
                title="Print full A4 sheet or save as PDF"
              >
                <Printer className="w-4 h-4" />
                <span>Print A4 / PDF</span>
              </button>
            </div>
          </div>

          {/* Printable Report Document Scroll Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-900/60 flex justify-center">
            <div
              id="a4-closing-stock-report"
              className="bg-white text-slate-900 w-full max-w-[960px] p-8 sm:p-10 rounded-2xl shadow-2xl border border-slate-200 my-auto text-xs leading-normal"
            >
              {/* Store Header & Document Title */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b-2 border-slate-900 gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src="/logo.png"
                    alt="Kerala Superstore"
                    className="w-16 h-16 object-contain"
                  />
                  <div>
                    <h1 className="text-xl font-black uppercase tracking-tight text-slate-950">
                      {storeInfo.name}
                    </h1>
                    <p className="text-[11px] text-slate-600 font-medium">
                      {storeInfo.address}
                    </p>
                    <p className="text-[10px] text-slate-600">
                      Tel: <span className="font-bold">{storeInfo.phone}</span> | VAT Reg: <span className="font-bold">{storeInfo.vatNumber}</span> | Web: <span className="font-bold">www.keralasuperstore.com</span>
                    </p>
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-slate-300 sm:pl-6 space-y-1">
                  <div className="inline-block bg-slate-900 text-white px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                    Official Inventory Audit
                  </div>
                  <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                    CLOSING STOCK REPORT
                  </h2>
                  <div className="text-[11px] font-mono text-slate-700 space-y-0.5">
                    <div>Audit Date: <strong className="text-slate-950">{closingStockAuditDate}</strong></div>
                    <div>Generated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div>Auditor: <strong className="text-slate-950">{cashierName}</strong> (Till 01)</div>
                  </div>
                </div>
              </div>

              {/* KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 my-5">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                  <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Total Value</div>
                  <div className="text-base font-black text-emerald-950 font-mono mt-0.5">
                    £{closingStockMetrics.totalRetailValue.toFixed(2)}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Total Units</div>
                  <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                    {closingStockMetrics.totalUnits.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Active SKUs</div>
                  <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                    {closingStockMetrics.totalSkus}
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-center">
                  <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Sold on Date</div>
                  <div className="text-base font-black text-blue-950 font-mono mt-0.5">
                    {totalSoldOnDate} <span className="text-[11px] font-normal">units</span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
                  <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Low Stock (≤5)</div>
                  <div className="text-base font-black text-amber-950 font-mono mt-0.5">
                    {closingStockMetrics.lowStockCount}
                  </div>
                </div>

                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-center">
                  <div className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Out of Stock (0)</div>
                  <div className="text-base font-black text-rose-950 font-mono mt-0.5">
                    {closingStockMetrics.outOfStockCount}
                  </div>
                </div>
              </div>

              {/* Category Valuation Summary Table */}
              <div className="mb-6">
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-300">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Category Valuation Summary ({closingStockMetrics.categoryBreakdown.length} Categories)
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Valuation based on shelf retail price
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-black text-[10px] uppercase border-b border-slate-300">
                        <th className="py-1.5 px-3">Category</th>
                        <th className="py-1.5 px-3 text-center">SKUs</th>
                        <th className="py-1.5 px-3 text-center">Units</th>
                        <th className="py-1.5 px-3 text-right">Valuation (£)</th>
                        <th className="py-1.5 px-3 text-right">Asset Share %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-[11px] font-mono">
                      {closingStockMetrics.categoryBreakdown.map((c) => (
                        <tr key={c.category} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 font-sans font-bold text-slate-900">{c.category}</td>
                          <td className="py-1.5 px-3 text-center text-slate-700">{c.skus}</td>
                          <td className="py-1.5 px-3 text-center font-bold text-slate-900">{c.units.toLocaleString()}</td>
                          <td className="py-1.5 px-3 text-right font-black text-emerald-900">£{c.value.toFixed(2)}</td>
                          <td className="py-1.5 px-3 text-right text-slate-600 font-sans text-[10px]">{c.pct.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Item-by-Item Detailed Inventory Ledger */}
              <div className="mb-8">
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-300">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Detailed Item Inventory Ledger ({a4LedgerItems.length} Items)
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    Scope: {a4ReportScope === 'low_and_out' ? 'Low Stock & Out of Stock' : a4ReportScope === 'low_only' ? 'Low Stock Only' : a4ReportScope === 'out_only' ? 'Out of Stock Only' : 'Full Catalog'} | Category: {closingStockFilterCategory === 'all' ? 'All' : closingStockFilterCategory}
                  </span>
                </div>

                <table className="w-full text-left text-xs border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-black text-[10px] uppercase border-b border-slate-300">
                      <th className="py-1.5 px-2 text-center w-8">#</th>
                      <th className="py-1.5 px-2 w-28">Barcode</th>
                      <th className="py-1.5 px-2">Description</th>
                      <th className="py-1.5 px-2 w-28">Category</th>
                      <th className="py-1.5 px-2 text-right w-16">Price</th>
                      <th className="py-1.5 px-2 text-center w-20">Sold ({closingStockAuditDate.slice(5)})</th>
                      <th className="py-1.5 px-2 text-center w-24">Closing Qty</th>
                      <th className="py-1.5 px-2 text-right w-20">Valuation</th>
                      <th className="py-1.5 px-2 text-center w-20">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {a4LedgerItems.map((prod, idx) => {
                      const stockVal = Number((prod.stock * prod.price).toFixed(2));
                      const soldQty = dateSoldMap[prod.barcode]?.qty || 0;
                      return (
                        <tr key={prod.barcode || idx} className="hover:bg-slate-50">
                          <td className="py-1.5 px-2 text-center text-slate-400 font-mono text-[10px]">
                            {idx + 1}
                          </td>
                          <td className="py-1.5 px-2 font-mono text-[10px] font-bold text-slate-700">
                            {prod.barcode || '-'}
                          </td>
                          <td className="py-1.5 px-2 font-medium text-slate-950">
                            {prod.name}
                          </td>
                          <td className="py-1.5 px-2 text-slate-600 text-[10px]">
                            {prod.category}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900">
                            £{prod.price.toFixed(2)}
                          </td>
                          <td className="py-1.5 px-2 text-center font-mono font-bold">
                            {soldQty > 0 ? (
                              <span className="text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded font-black border border-blue-200 text-[10px]">
                                {soldQty}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-normal">-</span>
                            )}
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-black font-mono border ${
                                prod.stock === 0
                                  ? 'bg-rose-100 text-rose-950 border-rose-300'
                                  : prod.stock <= 5
                                  ? 'bg-amber-100 text-amber-950 border-amber-300'
                                  : 'bg-emerald-100 text-emerald-950 border-emerald-300'
                              }`}
                            >
                              {prod.stock} units
                            </span>
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono font-black text-slate-900">
                            £{stockVal.toFixed(2)}
                          </td>
                          <td className="py-1.5 px-2 text-center text-[10px] font-bold">
                            {prod.stock === 0 ? (
                              <span className="text-rose-700">OUT</span>
                            ) : prod.stock <= 5 ? (
                              <span className="text-amber-700">LOW</span>
                            ) : (
                              <span className="text-emerald-700">OK</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Auditor & Manager Sign-off Strip */}
              <div className="pt-6 border-t-2 border-slate-900 space-y-6">
                <div className="text-[10px] text-slate-600 italic">
                  I hereby verify that this closing stock statement has been reconciled against the physical count and sales registry for Kerala Superstore Manchester on {closingStockAuditDate}.
                </div>

                <div className="grid grid-cols-2 gap-12 pt-2">
                  <div className="space-y-6">
                    <div className="border-b border-slate-400 pb-1 flex justify-between items-end text-xs">
                      <span className="font-bold text-slate-900">Auditor / Cashier:</span>
                      <span className="font-mono">{cashierName}</span>
                    </div>
                    <div className="border-b border-slate-400 pb-1 flex justify-between items-end text-xs">
                      <span className="font-bold text-slate-900">Signature:</span>
                      <span className="text-slate-400 italic font-serif">_________________________</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Date: {new Date().toLocaleDateString('en-GB')}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="border-b border-slate-400 pb-1 flex justify-between items-end text-xs">
                      <span className="font-bold text-slate-900">Store Manager:</span>
                      <span className="text-slate-400 italic">_________________________</span>
                    </div>
                    <div className="border-b border-slate-400 pb-1 flex justify-between items-end text-xs">
                      <span className="font-bold text-slate-900">Signature:</span>
                      <span className="text-slate-400 italic font-serif">_________________________</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Date: {new Date().toLocaleDateString('en-GB')}
                    </div>
                  </div>
                </div>

                <div className="text-center text-[10px] text-slate-500 pt-4 border-t border-dashed border-slate-300">
                  Kerala Superstore Manchester • 1022 Stockport Road, Levenshulme, Manchester, M19 3WN • www.keralasuperstore.com
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. TOTAL SALES / Z-REPORT THERMAL PRINT MODAL */}
      {salesReportModalOpen && reportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-3 animate-scale-up max-h-[92vh] overflow-y-auto text-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4" />
                <span>Total Sales / Z-Report</span>
              </span>
              <button
                onClick={() => setSalesReportModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Paper Width Selector */}
            <div className="flex items-center justify-between bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-[11px] font-semibold text-slate-400">Printer Roll:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setReceiptPaperWidth('80mm')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    receiptPaperWidth === '80mm'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  80mm Standard
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptPaperWidth('58mm')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    receiptPaperWidth === '58mm'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  58mm Compact
                </button>
              </div>
            </div>

            {/* Total Sales Report Slip Preview */}
            <div
              id="thermal-sales-report-preview"
              className={`bg-white text-slate-950 p-5 rounded-xl font-mono text-[11px] space-y-2 shadow-inner border border-slate-200 ${
                receiptPaperWidth === '58mm' ? 'paper-58mm max-w-[240px] mx-auto text-[9.5px]' : ''
              }`}
            >
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                <img
                  src="/logo.png"
                  alt="Kerala Superstore Logo"
                  className="receipt-logo w-14 h-14 mx-auto object-contain mb-1"
                />
                <h4 className="font-black text-xs uppercase">{storeInfo.name}</h4>
                <p className="text-[10px] text-slate-600">{storeInfo.address}</p>
                <p className="text-[10px] text-slate-600">Tel: {storeInfo.phone}</p>
                <p className="text-[10px] text-slate-600">VAT Reg: {storeInfo.vatNumber}</p>
                <p className="text-xs font-black text-emerald-700 mt-1 uppercase">** TOTAL SALES &amp; Z-REPORT **</p>
              </div>

              <div className="flex justify-between text-[10px] text-slate-600 pt-1">
                <span>Period: {reportData.periodLabel || salesPeriod}</span>
                <span>Date: {new Date().toLocaleDateString('en-GB')}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>Till / Register: 01</span>
                <span>Cashier: {activeUser.name}</span>
              </div>

              {/* Financial Turnover Summary with Cash & Credit Card Split */}
              <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-2 text-xs">
                {/* 1. SALES BREAKDOWN */}
                <div className="pb-1.5 border-b border-dashed border-slate-300 space-y-0.5">
                  <div className="font-black uppercase text-[10px] text-slate-900 tracking-wider">
                    [ SALES BREAKDOWN ]
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span>Cash Sales ({reportData.cashOrdersCount || 0} bills):</span>
                    <span className="font-bold">£{(reportData.cashSales || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span>Card / Credit ({reportData.cardOrdersCount || 0} bills):</span>
                    <span className="font-bold">£{(reportData.cardSales || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black text-xs pt-1 border-t border-dotted border-slate-300">
                    <span>GROSS SALES TOTAL:</span>
                    <span>£{(reportData.totalSales || 0).toFixed(2)}</span>
                  </div>
                </div>

                {/* 2. RETURNS BREAKDOWN */}
                <div className="pb-1.5 border-b border-dashed border-slate-300 space-y-0.5">
                  <div className="font-black uppercase text-[10px] text-slate-900 tracking-wider">
                    [ RETURNS &amp; REFUNDS ]
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span>Cash Refunds ({reportData.cashRefundsCount || 0} slips):</span>
                    <span>-£{(reportData.cashRefunds || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span>Card Refunds ({reportData.cardRefundsCount || 0} slips):</span>
                    <span>-£{(reportData.cardRefunds || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black text-xs pt-1 border-t border-dotted border-slate-300">
                    <span>TOTAL REFUNDS:</span>
                    <span>-£{(reportData.totalRefunds || 0).toFixed(2)}</span>
                  </div>
                </div>

                {/* 3. TILL SETTLEMENT / TAKINGS */}
                <div className="space-y-0.5">
                  <div className="font-black uppercase text-[10px] text-slate-900 tracking-wider">
                    [ TILL BALANCING &amp; TAKINGS ]
                  </div>
                  <div className="flex justify-between text-[11px] font-bold">
                    <span>Cash in Drawer (To Count):</span>
                    <span className="font-mono font-black">£{(reportData.netCash || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold">
                    <span>Card Machine Total:</span>
                    <span className="font-mono font-black">£{(reportData.netCard || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-400">
                    <span>NET TURNOVER:</span>
                    <span className="font-mono">
                      £{(reportData.netSales !== undefined ? reportData.netSales : Math.max(0, (reportData.totalSales || 0) - (reportData.totalRefunds || 0))).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600 pt-0.5">
                    <span>Total Orders:</span>
                    <span>{reportData.transactionCount || 0} orders</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>Average Basket:</span>
                    <span>£{(reportData.averageBasket || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>HMRC VAT (20%):</span>
                    <span>£{(reportData.vatCollected || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Top Products on Report */}
              <div className="py-1 text-[10px] space-y-0.5 border-b border-dashed border-slate-300">
                <span className="font-bold block uppercase mb-1">Top Selling Items:</span>
                {(reportData.topItems || []).slice(0, 6).map((it: any, i: number) => (
                  <div key={i} className="flex justify-between">
                    <span className="truncate max-w-[150px]">
                      {it.qty}x {it.name}
                    </span>
                    <span>£{Number(it.revenue || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="text-center pt-2 text-[10px] text-slate-600 space-y-2">
                <p>Register balanced &amp; verified.</p>
                <div className="pt-2 border-t border-dotted border-slate-300">
                  <p className="text-[9px]">Manager Sign: __________________</p>
                </div>
                <p className="font-bold">www.keralasuperstore.com</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => printElementToThermal('thermal-sales-report-preview', receiptPaperWidth)}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print Slip ({receiptPaperWidth})</span>
              </button>

              <button
                type="button"
                onClick={() => setSalesReportModalOpen(false)}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. TILL USER SWITCHER & CASHIER LOGIN MODAL */}
      {userSwitchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-scale-up text-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Switch Till Shift</h3>
                  <p className="text-[11px] text-slate-400">Select cashier account to operate till</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setUserSwitchModalOpen(false);
                  setSwitchTargetUser(null);
                  setSwitchSecretInput('');
                  setSwitchError(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of Registered Accounts */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 block">Select Staff Member:</label>
              <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto no-scrollbar">
                {allUsers.map((u) => {
                  const isCurrent = activeUser.id === u.id;
                  const isSelected = switchTargetUser?.id === u.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => {
                        setSwitchTargetUser(u);
                        setSwitchSecretInput('');
                        setSwitchError(null);
                      }}
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-600/20 border-emerald-500 text-white'
                          : isCurrent
                          ? 'bg-slate-800/80 border-slate-700 text-slate-200'
                          : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            u.role === 'admin'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : u.role === 'manager'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">{u.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">@{u.username}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-extrabold ${
                            u.role === 'admin'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : u.role === 'manager'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {u.role}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">
                            ACTIVE
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Password / PIN input for selected user */}
            {switchTargetUser && (
              <div className="space-y-3 pt-2 border-t border-slate-800 animate-in fade-in">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Enter PIN or Password for <strong className="text-white">{switchTargetUser.name}</strong>:
                  </label>
                  <input
                    type="password"
                    autoFocus
                    value={switchSecretInput}
                    onChange={(e) => setSwitchSecretInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleConfirmSwitchUser();
                      }
                    }}
                    placeholder="Enter PIN / password..."
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 text-center tracking-widest font-mono"
                  />
                </div>

                {switchError && (
                  <div className="bg-rose-500/20 border border-rose-500/40 p-2.5 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{switchError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSwitchTargetUser(null);
                      setSwitchSecretInput('');
                      setSwitchError(null);
                    }}
                    className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSwitchUser}
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md"
                  >
                    Confirm Login
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. ADMIN CREDENTIALS & STAFF USER MANAGEMENT MODAL */}
      {adminManageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl space-y-4 animate-scale-up text-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Admin &amp; User Management</h3>
                  <p className="text-xs text-slate-400">Configure administrator login and manage cashier staff accounts</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setAdminManageModalOpen(false);
                  setAdminFormSuccess(null);
                  setAdminFormError(null);
                  setUserManageSuccess(null);
                  setUserManageError(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab navigation within management modal */}
            <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setAdminManageTab('creds')}
                className={`flex-1 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  adminManageTab === 'creds'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Admin Credentials</span>
              </button>

              <button
                type="button"
                onClick={() => setAdminManageTab('users')}
                className={`flex-1 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  adminManageTab === 'users'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Staff Accounts ({allUsers.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setAdminManageTab('add_user')}
                className={`flex-1 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  adminManageTab === 'add_user'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add New User</span>
              </button>
            </div>

            {/* TAB 1: ADMIN CREDENTIALS */}
            {adminManageTab === 'creds' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="bg-indigo-950/30 border border-indigo-500/20 p-3.5 rounded-2xl text-xs text-indigo-300">
                  <p className="font-semibold text-white">Store Administrator Security</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Update the primary Admin username, master password, and quick security PIN used to authorize price &amp; stock edits.
                  </p>
                </div>

                {adminFormSuccess && (
                  <div className="bg-emerald-500/20 border border-emerald-500/40 p-3 rounded-xl flex items-center gap-2 text-emerald-300 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{adminFormSuccess}</span>
                  </div>
                )}

                {adminFormError && (
                  <div className="bg-rose-500/20 border border-rose-500/40 p-3 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{adminFormError}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Admin Username</label>
                    <input
                      type="text"
                      value={adminFormUsername}
                      onChange={(e) => setAdminFormUsername(e.target.value)}
                      placeholder="admin"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">New Admin Password</label>
                      <input
                        type="password"
                        value={adminFormPassword}
                        onChange={(e) => setAdminFormPassword(e.target.value)}
                        placeholder="Leave blank to keep current"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Confirm Password</label>
                      <input
                        type="password"
                        value={adminFormConfirmPassword}
                        onChange={(e) => setAdminFormConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Quick Security PIN (e.g. 2026)
                    </label>
                    <input
                      type="password"
                      value={adminFormPin}
                      onChange={(e) => setAdminFormPin(e.target.value)}
                      placeholder="2026"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 font-mono tracking-widest text-center max-w-xs"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Used on till screen for fast 1-tap price &amp; stock unlocks.
                    </span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSaveAdminCreds}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save Admin Credentials &amp; PIN</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: STAFF USERS LIST */}
            {adminManageTab === 'users' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Registered Till Accounts</span>
                  <button
                    type="button"
                    onClick={() => setAdminManageTab('add_user')}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add User</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
                  {allUsers.map((u) => (
                    <div
                      key={u.id}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                            u.role === 'admin'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : u.role === 'manager'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">{u.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Username: @{u.username} • PIN: {u.pin ? '••••' : 'None'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-extrabold ${
                            u.role === 'admin'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : u.role === 'manager'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {u.role}
                        </span>

                        {u.role !== 'admin' && u.id !== 'user-admin-main' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors"
                            title="Delete this user account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: ADD NEW STAFF MEMBER */}
            {adminManageTab === 'add_user' && (
              <form onSubmit={handleAddNewUser} className="space-y-4 animate-in fade-in">
                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl text-xs text-slate-300">
                  <p className="font-semibold text-white">Create New Till User</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Add cashier or manager accounts. Cashiers can only ring up sales and returns — price and stock editing is locked for them.
                  </p>
                </div>

                {userManageSuccess && (
                  <div className="bg-emerald-500/20 border border-emerald-500/40 p-3 rounded-xl flex items-center gap-2 text-emerald-300 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{userManageSuccess}</span>
                  </div>
                )}

                {userManageError && (
                  <div className="bg-rose-500/20 border border-rose-500/40 p-3 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{userManageError}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="e.g. Rahul - Till 2"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Username (Login ID)</label>
                    <input
                      type="text"
                      required
                      value={newUserUsername}
                      onChange={(e) => setNewUserUsername(e.target.value)}
                      placeholder="e.g. rahul2"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
                      <input
                        type="password"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        placeholder="e.g. cashier123"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">4-Digit Quick PIN</label>
                      <input
                        type="password"
                        value={newUserPin}
                        onChange={(e) => setNewUserPin(e.target.value)}
                        placeholder="e.g. 1234"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-mono text-center tracking-widest"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Account Role &amp; Permissions</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="cashier">Cashier (Till Sales &amp; Returns Only - Price editing locked)</option>
                      <option value="manager">Manager (Sales, Returns, Price &amp; Stock adjustments)</option>
                      <option value="admin">Administrator (Full Access &amp; User Management)</option>
                    </select>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Create Staff Account</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 8. CASH DRAWER HARDWARE & WINDOWS DRIVER SETUP MODAL */}
      {cashDrawerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 animate-scale-up text-slate-100 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Cash Drawer Setup (ക്യാഷ് ഡ്രോയർ)</h3>
                  <p className="text-[11px] text-slate-400">Cash payments only trigger kick • Card payments keep locked</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCashDrawerModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rule 1: Cash Only Mode Toggle */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-white block">Only Open Drawer on Cash Payments</span>
                  <span className="text-[11px] text-slate-400">
                    Cash ബില്ലുകൾക്ക് മാത്രം ഡ്രോയർ തുറക്കുക. Card പേയ്മെന്റുകളിൽ ഡ്രോയർ പൂട്ടിക്കിടക്കും.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleDrawerKickMode(!drawerKickOnCashOnly)}
                  className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                    drawerKickOnCashOnly ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4.5 h-4.5 bg-white rounded-full transition-transform ${
                      drawerKickOnCashOnly ? 'translate-x-5.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Status Pills */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-xs font-bold">
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Cash Sale:</span>
                    <span className="text-emerald-300 font-black">Drawer Auto-Opens ✓</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Card / Credit:</span>
                    <span className="text-blue-300 font-black">Stays Locked 🔒</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Manual Controls & Hardware Kick */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <span className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                Quick Drawer Controls
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => triggerCashDrawerKick('test')}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Banknote className="w-4 h-4" />
                  <span>Test Kick Drawer Now</span>
                </button>

                <button
                  type="button"
                  onClick={handlePairHardwarePrinter}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                  <span>Pair USB / Serial</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>Keyboard Hotkey: Press <strong className="text-white bg-slate-800 px-1.5 py-0.5 rounded font-mono">F12</strong> anytime to pop drawer</span>
                {lastDrawerKickTime && <span>Last opened: {lastDrawerKickTime}</span>}
              </div>
            </div>

            {/* CRITICAL WINDOWS PRINTER DRIVER CONFIGURATION GUIDE */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 text-amber-400" />
                <span>Windows പ്രിന്ററിൽ Card അടിക്കുമ്പോഴും ഡ്രോയർ തുറക്കുന്നത് മാറ്റാൻ:</span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                നിങ്ങളുടെ കമ്പ്യൂട്ടറിൽ Windows പ്രിന്റർ ഡ്രൈവറിൽ <em>"Cash Drawer: Open Before Printing"</em> എന്ന് സെറ്റ് ചെയ്തിട്ടുണ്ടെങ്കിൽ, പ്രിന്റർ എല്ലാ പ്രിന്റിലും തനിയെ ഡ്രോയർ തുറക്കും. ഇത് മാറ്റാൻ താഴെ പറയുന്ന സ്റ്റെപ്പുകൾ ചെയ്യുക:
              </p>

              <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-slate-300">
                <li>
                  Windows Start തുറന്ന് <strong className="text-white">"Printers &amp; scanners"</strong> എന്ന് സെർച്ച് ചെയ്യുക.
                </li>
                <li>
                  ലിസ്റ്റിലുള്ള നിങ്ങളുടെ തെർമൽ പ്രിന്റർ (<strong className="text-white">POS-58</strong> / <strong className="text-white">XP-58</strong> / <strong className="text-white">Epson</strong>) ക്ലിക്ക് ചെയ്യുക.
                </li>
                <li>
                  <strong className="text-white">"Printer properties"</strong> (പ്രിന്റർ പ്രോപ്പർട്ടീസ്) ക്ലിക്ക് ചെയ്യുക.
                </li>
                <li>
                  മുകളിലെ <strong className="text-white">"Device Settings"</strong> (അല്ലെങ്കിൽ <strong className="text-white">"Document Properties"</strong>) ടാബ് എടുക്കുക.
                </li>
                <li>
                  <strong className="text-white">"Cash Drawer"</strong> എന്ന ഓപ്ഷൻ <strong className="text-rose-300">"Do Not Open"</strong> (അല്ലെങ്കിൽ <strong className="text-rose-300">"Disabled"</strong>) ആക്കി മാറ്റുക.
                </li>
                <li>
                  <strong className="text-emerald-400">"Apply"</strong> നൽകി <strong className="text-emerald-400">"OK"</strong> അമർത്തുക.
                </li>
              </ol>

              <div className="pt-1 text-[11px] text-emerald-300 font-semibold border-t border-amber-500/20">
                ✓ ഇത് ചെയ്തുകഴിഞ്ഞാൽ Card ബില്ലുകൾ അടിക്കുമ്പോൾ ഡ്രോയർ അടഞ്ഞുതന്നെയിരിക്കും. Cash ബില്ലുകളിൽ മാത്രം POS സോഫ്റ്റ്‌വെയർ ഡ്രോയർ ഓപ്പൺ ചെയ്യും!
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setCashDrawerModalOpen(false)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
