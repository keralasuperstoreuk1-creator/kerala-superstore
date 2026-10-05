'use client';

import React, { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSpecialsNotification } from '@/context/SpecialsNotificationContext';
import { 
  ChefHat, 
  Bell, 
  Flame, 
  Clock, 
  Plus, 
  Minus,
  Trash2, 
  Check, 
  Send, 
  Sparkles, 
  ArrowLeft, 
  ShieldCheck,
  Package,
  Layers,
  ShoppingBag,
  Camera,
  Upload,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  Palette,
  Sliders,
  RotateCcw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { DailySpecial, DailySpecialsThemeConfig } from '@/types';
import { DEFAULT_DAILY_SPECIALS_THEME, DAILY_SPECIALS_THEME_PRESETS } from '@/lib/daily-specials-theme';
import AiImageStudioUpload from '@/components/admin/AiImageStudioUpload';

const PRESET_FOOD_IMAGES = [
  { label: '🍲 Thalassery Chicken Biriyani (Banana Leaf)', url: '/specials/thalassery_chicken_biriyani.jpg' },
  { label: '🫓 Kerala Porotta & Dark Beef Roast', url: '/specials/porotta_beef_roast.jpg' },
  { label: '☕ Evening Hot Snacks & Pazham Pori', url: '/categories/snacks.jpg' },
  { label: '🌾 Palakkadan Matta Rice & Curries', url: '/categories/rice.jpg' },
  { label: '🌿 Traditional Malabar Spices Display', url: '/branding/kerala-superstore-hero-banner.jpg' },
];

export default function AdminSpecialsPage() {
  const {
    dailySpecials,
    addDailySpecial,
    deleteDailySpecial,
    toggleSoldOut,
    updateDailySpecial,
    notifications,
    broadcastNotification,
  } = useSpecialsNotification();

  // Theme & Section Color Customizer State
  const [themeConfig, setThemeConfig] = useState<DailySpecialsThemeConfig>(DEFAULT_DAILY_SPECIALS_THEME);
  const [isThemePanelOpen, setIsThemePanelOpen] = useState(true);

  // Load theme on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('kss_daily_specials_theme');
      if (saved) {
        setThemeConfig({ ...DEFAULT_DAILY_SPECIALS_THEME, ...JSON.parse(saved) });
      }
    } catch {}
  }, []);

  const handleSaveTheme = (newTheme: DailySpecialsThemeConfig) => {
    setThemeConfig(newTheme);
    try {
      localStorage.setItem('kss_daily_specials_theme', JSON.stringify(newTheme));
      window.dispatchEvent(new Event('kss_daily_specials_theme_updated'));
    } catch {}
    setSuccessMsg('✨ Daily Specials background and card/table colors updated live on storefront!');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleResetTheme = () => {
    handleSaveTheme(DEFAULT_DAILY_SPECIALS_THEME);
  };

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('7.99');
  const [category, setCategory] = useState<'biriyani' | 'curry_bread' | 'snacks' | 'air_cargo'>('biriyani');
  const [availableTime, setAvailableTime] = useState('Fresh Batch • Ready Today from 12:30 PM');
  const [portionsTotal, setPortionsTotal] = useState('40');
  const [portionsRemaining, setPortionsRemaining] = useState('40');
  const [badge, setBadge] = useState('🔥 Hot Kitchen Special');
  const [imageUrl, setImageUrl] = useState('/specials/thalassery_chicken_biriyani.jpg');

  // Form Image Upload & AI state
  const [imageTab, setImageTab] = useState<'upload' | 'preset'>('upload');
  const [uploadedFormRaw, setUploadedFormRaw] = useState<string | null>(null);
  const [aiFormCleanPackshot, setAiFormCleanPackshot] = useState<string | null>(null);
  const [aiFormTransparent, setAiFormTransparent] = useState<string | null>(null);
  const [formImageOption, setFormImageOption] = useState<'ai-packshot' | 'ai-transparent' | 'original'>('ai-packshot');
  const [isFormProcessingBg, setIsFormProcessingBg] = useState(false);
  const [formBgProgressText, setFormBgProgressText] = useState('');
  const formFileInputRef = useRef<HTMLInputElement | null>(null);

  // Edit Existing Special Image Modal state
  const [activeEditSpecial, setActiveEditSpecial] = useState<DailySpecial | null>(null);
  const [editImageTab, setEditImageTab] = useState<'upload' | 'preset'>('upload');
  const [editPresetUrl, setEditPresetUrl] = useState<string>('');
  const [editUploadedRaw, setEditUploadedRaw] = useState<string | null>(null);
  const [editAiCleanPackshot, setEditAiCleanPackshot] = useState<string | null>(null);
  const [editAiTransparent, setEditAiTransparent] = useState<string | null>(null);
  const [editImageOption, setEditImageOption] = useState<'ai-packshot' | 'ai-transparent' | 'original'>('original');
  const [isEditProcessingBg, setIsEditProcessingBg] = useState(false);
  const [editBgProgressText, setEditBgProgressText] = useState('');
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  // Custom notification state
  const [customNotifTitle, setCustomNotifTitle] = useState('');
  const [customNotifMsg, setCustomNotifMsg] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ==========================================
  // HELPER: LOCAL AI BACKGROUND REMOVAL
  // ==========================================
  const runLocalAiBgRemoval = async (
    base64DataUrl: string, 
    setProgressText: (t: string) => void
  ): Promise<{ packshot: string; transparent: string }> => {
    setProgressText('🧠 Neural network isolating food product (U²-Net)...');
    const res = await fetch('/api/admin/remove-bg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64DataUrl }),
    });
    if (!res.ok) throw new Error('Failed to remove background');
    const data = await res.json();
    if (!data.success || !data.transparent || !data.packshot) {
      throw new Error(data.error || 'Failed to remove background');
    }
    setProgressText('✅ Background cleanly removed!');
    return { packshot: data.packshot, transparent: data.transparent };
  };

  // Form Image Change Handler (Instant Original, NO Auto AI)
  const handleFormFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setUploadedFormRaw(base64);
      setImageUrl(base64); // Default to original photo
      setAiFormCleanPackshot(null);
      setAiFormTransparent(null);
      setFormImageOption('original');
      setIsFormProcessingBg(false);
      setFormBgProgressText('');
    };
    reader.readAsDataURL(file);
  };

  // Explicit Trigger for Form AI BG Removal
  const handleRunFormAiBgRemoval = async () => {
    if (!uploadedFormRaw || isFormProcessingBg) return;
    setIsFormProcessingBg(true);
    try {
      const { packshot, transparent } = await runLocalAiBgRemoval(uploadedFormRaw, setFormBgProgressText);
      setAiFormCleanPackshot(packshot);
      setAiFormTransparent(transparent);
      setFormImageOption('ai-packshot');
      setImageUrl(packshot);
    } catch (err) {
      console.error('Form BG removal failed:', err);
      setFormBgProgressText('Notice: AI removal failed. Original photo retained.');
    } finally {
      setIsFormProcessingBg(false);
      setFormBgProgressText('');
    }
  };

  // Form Image Option Switcher
  const handleSelectFormImageOption = (option: 'ai-packshot' | 'ai-transparent' | 'original') => {
    setFormImageOption(option);
    if (option === 'ai-packshot' && aiFormCleanPackshot) {
      setImageUrl(aiFormCleanPackshot);
    } else if (option === 'ai-transparent' && aiFormTransparent) {
      setImageUrl(aiFormTransparent);
    } else if (option === 'original' && uploadedFormRaw) {
      setImageUrl(uploadedFormRaw);
    }
  };

  // ==========================================
  // EDIT EXISTING SPECIAL IMAGE MODAL
  // ==========================================
  const handleOpenEditSpecialModal = (special: DailySpecial) => {
    setActiveEditSpecial(special);
    setEditImageTab('upload');
    setEditPresetUrl(special.imageUrl || PRESET_FOOD_IMAGES[0].url);
    setEditUploadedRaw(null);
    setEditAiCleanPackshot(null);
    setEditAiTransparent(null);
    setEditImageOption('original');
    setIsEditProcessingBg(false);
    setEditBgProgressText('');
  };

  const handleEditFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setEditUploadedRaw(base64);
      setEditAiCleanPackshot(null);
      setEditAiTransparent(null);
      setEditImageOption('original');
      setIsEditProcessingBg(false);
      setEditBgProgressText('');
    };
    reader.readAsDataURL(file);
  };

  // Explicit Trigger for Edit Modal AI BG Removal
  const handleRunEditAiBgRemoval = async () => {
    if (!editUploadedRaw || isEditProcessingBg) return;
    setIsEditProcessingBg(true);
    try {
      const { packshot, transparent } = await runLocalAiBgRemoval(editUploadedRaw, setEditBgProgressText);
      setEditAiCleanPackshot(packshot);
      setEditAiTransparent(transparent);
      setEditImageOption('ai-packshot');
    } catch (err) {
      console.error('Edit BG removal failed:', err);
      setEditBgProgressText('Notice: AI removal failed. Original photo retained.');
    } finally {
      setIsEditProcessingBg(false);
      setEditBgProgressText('');
    }
  };

  const handleSaveEditedSpecialImage = () => {
    if (!activeEditSpecial) return;

    let finalImg = activeEditSpecial.imageUrl;
    if (editImageTab === 'preset' && editPresetUrl) {
      finalImg = editPresetUrl;
    } else if (editImageOption === 'ai-packshot' && editAiCleanPackshot) {
      finalImg = editAiCleanPackshot;
    } else if (editImageOption === 'ai-transparent' && editAiTransparent) {
      finalImg = editAiTransparent;
    } else if (editImageOption === 'original' && editUploadedRaw) {
      finalImg = editUploadedRaw;
    }

    updateDailySpecial(activeEditSpecial.id, { imageUrl: finalImg });
    setSuccessMsg(`✨ Updated photo for "${activeEditSpecial.title}"!`);
    setActiveEditSpecial(null);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Create Special
  const handleCreateSpecial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsPublishing(true);

    const newSpecial = addDailySpecial({
      title,
      description,
      price: parseFloat(price) || 0,
      category,
      availableTime,
      portionsTotal: parseInt(portionsTotal, 10) || 30,
      portionsRemaining: parseInt(portionsRemaining, 10) || 30,
      isSoldOut: false,
      badge,
      imageUrl,
    });

    // Send push notification to backend
    try {
      await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `🍲 Fresh Kitchen Special: ${title}!`,
          message: `${availableTime}. £${parseFloat(price).toFixed(2)} - Only ${portionsRemaining} portions ready today!`,
          type: 'special_item',
          specialItemId: newSpecial.id,
          link: '/',
        }),
      });
    } catch (err) {
      console.warn('Broadcast API call notice:', err);
    }

    setIsPublishing(false);
    setSuccessMsg(`Published "${title}" & broadcasted notification to all customer apps!`);
    setTimeout(() => setSuccessMsg(null), 3500);

    // Reset Form
    setTitle('');
    setDescription('');
    setUploadedFormRaw(null);
    setAiFormCleanPackshot(null);
    setAiFormTransparent(null);
  };

  const handleSendCustomBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNotifTitle.trim() || !customNotifMsg.trim()) return;

    broadcastNotification(customNotifTitle, customNotifMsg, 'general');

    try {
      await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: customNotifTitle,
          message: customNotifMsg,
          type: 'general',
          link: '/',
        }),
      });
    } catch (err) {
      console.warn('Broadcast API call notice:', err);
    }

    setSuccessMsg(`Sent custom broadcast: "${customNotifTitle}" to customers!`);
    setTimeout(() => setSuccessMsg(null), 3500);

    setCustomNotifTitle('');
    setCustomNotifMsg('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Back to Admin Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-300">
                Kitchen Specials &amp; Push Alerts
              </span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full">
                Live App Synced
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
              Daily Specials &amp; Customer Notification Hub
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Broadcast fresh Kerala meals, upload photos with on-device AI packshot generation, and send real-time alerts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <Eye className="w-4 h-4 text-amber-300" />
            <span>View Live Storefront</span>
          </Link>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl font-bold text-xs flex items-center gap-2.5 shadow-2xs animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Active Kitchen Specials</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{dailySpecials.length}</div>
          <div className="text-[11px] text-emerald-700 font-bold mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live on Customer App
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Total Portions Ready</div>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {dailySpecials.reduce((acc, s) => acc + (s.isSoldOut ? 0 : s.portionsRemaining), 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Portions remaining today</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Broadcasts Delivered</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{notifications.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Push alerts sent to users</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Customer PWA App</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">Active</div>
          <div className="text-[11px] text-slate-400 mt-1">iOS &amp; Android Ready</div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION & TABLE COLOR CUSTOMIZER (BACKGROUND & CARDS)      */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header with Toggle */}
        <div 
          onClick={() => setIsThemePanelOpen(!isThemePanelOpen)}
          className="p-5 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white flex items-center justify-between cursor-pointer select-none transition-all hover:brightness-110"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base text-white">
                  Section Background &amp; Table/Card Color Customizer
                </h2>
                <span className="px-2 py-0.5 bg-amber-400 text-slate-950 rounded-full text-[10px] font-black uppercase">
                  Live Customizer
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                ഈ ഭാഗത്തിന്റെ ബാക്ക്ഗ്രൗണ്ടും ടേബിൾ/കാർഡ് കളറുകളും മാറ്റുക (Change Background, Table/Card Colors, Borders &amp; Buttons)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              {isThemePanelOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {isThemePanelOpen && (
          <div className="p-6 space-y-6">
            {/* 1. ONE-CLICK PRESET THEMES */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>One-Click Supermarket Theme Presets:</span>
                </label>
                <span className="text-[11px] text-slate-500">Click any preset to apply instantly</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {DAILY_SPECIALS_THEME_PRESETS.map((preset) => {
                  const isCurrent = 
                    themeConfig.sectionBgColor === preset.config.sectionBgColor &&
                    themeConfig.cardBgColor === preset.config.cardBgColor;

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSaveTheme(preset.config)}
                      className={`p-3 rounded-2xl border-2 transition-all flex flex-col justify-between text-left relative cursor-pointer group ${
                        isCurrent
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-600/20'
                          : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      {isCurrent && (
                        <span className="absolute top-2 right-2 px-1.5 py-0.2 bg-emerald-700 text-white text-[8px] font-black rounded-full uppercase">
                          ✓ Active
                        </span>
                      )}

                      <div 
                        style={{ background: preset.previewBg }}
                        className="w-full h-12 rounded-xl mb-2.5 shadow-inner border border-white/20 relative flex items-center justify-center"
                      >
                        <div 
                          style={{ backgroundColor: preset.config.accentButtonColor }}
                          className="w-4 h-4 rounded-full shadow-xs"
                        />
                      </div>

                      <div>
                        <div className="font-black text-xs text-slate-900 leading-tight truncate">
                          {preset.name}
                        </div>
                        <span className="text-[9px] font-bold text-slate-500 block mt-0.5">
                          {preset.badge}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. LIVE INTERACTIVE STOREFRONT PREVIEW BOX */}
            <div className="p-4 bg-slate-100 rounded-3xl border border-slate-200/90 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                <span>👁️ Live Storefront Appearance Preview:</span>
                <span className="text-[11px] text-slate-500 font-normal">Simulates how customer sees this section</span>
              </div>

              {/* Simulated Section */}
              <div 
                style={
                  themeConfig.sectionBgType === 'gradient'
                    ? {
                        background: `linear-gradient(135deg, ${themeConfig.sectionBgColor}, ${themeConfig.sectionBgGradientEnd || '#022c22'})`,
                        borderColor: themeConfig.sectionBorderColor,
                      }
                    : {
                        backgroundColor: themeConfig.sectionBgColor,
                        borderColor: themeConfig.sectionBorderColor,
                      }
                }
                className="p-5 rounded-2xl border-2 shadow-lg text-white space-y-4 transition-colors duration-300 relative overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <div 
                      style={{ 
                        backgroundColor: `${themeConfig.badgeColor}22`,
                        borderColor: `${themeConfig.badgeColor}66`,
                        color: themeConfig.badgeColor 
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border"
                    >
                      <ChefHat className="w-3 h-3" />
                      <span>Manchester Kitchen</span>
                    </div>
                    <div className={`font-black text-base mt-1 ${themeConfig.sectionTextColor === 'light' ? 'text-white' : 'text-slate-950'}`}>
                      Today&apos;s Fresh Daily Specials 🍲
                    </div>
                  </div>

                  <button
                    type="button"
                    style={{ backgroundColor: themeConfig.accentButtonColor, color: themeConfig.accentButtonColor === '#fbbf24' || themeConfig.accentButtonColor === '#f59e0b' || themeConfig.accentButtonColor === '#ffffff' ? '#09090b' : '#ffffff' }}
                    className="px-3 py-1.5 rounded-xl font-black text-[10px] shadow-sm flex items-center gap-1"
                  >
                    <Bell className="w-3 h-3" />
                    <span>Alerts</span>
                  </button>
                </div>

                {/* Simulated Cards Grid (Table Colour preview) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { title: 'Thalassery Chicken Dum Biriyani', price: '£7.99', badge: '🔥 Chef Special', img: '/specials/thalassery_chicken_biriyani.jpg' },
                    { title: 'Malabar Porotta & Dark Beef Roast', price: '£8.49', badge: '⭐ Bestseller', img: '/specials/porotta_beef_roast.jpg' },
                    { title: 'Evening Chaya & Pazham Pori Box', price: '£3.99', badge: '☕ Tea Special', img: '/categories/snacks.jpg' },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      style={{ 
                        backgroundColor: themeConfig.cardBgColor,
                        borderColor: themeConfig.cardBorderColor,
                      }}
                      className="p-3 rounded-xl border-2 backdrop-blur-md flex flex-col justify-between space-y-2 shadow-sm"
                    >
                      <div className="relative w-full h-20 rounded-lg overflow-hidden bg-slate-900">
                        <Image src={item.img} alt={item.title} fill className="object-cover" unoptimized />
                        <span 
                          style={{ backgroundColor: themeConfig.badgeColor, color: themeConfig.badgeColor === '#fbbf24' || themeConfig.badgeColor === '#f59e0b' ? '#09090b' : '#ffffff' }}
                          className="absolute top-1.5 left-1.5 text-[8px] font-black px-1.5 py-0.5 rounded-full"
                        >
                          {item.badge}
                        </span>
                      </div>

                      <div className="text-left">
                        <h4 className={`font-black text-xs truncate ${themeConfig.cardTextColor === 'light' ? 'text-white' : 'text-slate-900'}`}>
                          {item.title}
                        </h4>
                        <div style={{ color: themeConfig.priceColor }} className="text-xs font-black mt-0.5">
                          {item.price}
                        </div>
                      </div>

                      <button
                        type="button"
                        style={{ 
                          backgroundColor: themeConfig.accentButtonColor, 
                          color: themeConfig.accentButtonColor === '#fbbf24' || themeConfig.accentButtonColor === '#f59e0b' || themeConfig.accentButtonColor === '#ffffff' ? '#09090b' : '#ffffff' 
                        }}
                        className="w-full py-1.5 rounded-lg text-[10px] font-black uppercase shadow-xs flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Pre-Order Box</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. DETAILED CUSTOM COLOR PICKERS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 text-xs">
              {/* Column A: SECTION BACKGROUND */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="font-black text-slate-900 block flex items-center gap-1.5">
                  <span>🎨 Section Background</span>
                </span>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Background Type</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setThemeConfig({ ...themeConfig, sectionBgType: 'gradient' })}
                      className={`py-1.5 px-2 rounded-xl font-bold text-[11px] cursor-pointer border ${
                        themeConfig.sectionBgType === 'gradient'
                          ? 'bg-emerald-700 text-white border-emerald-800'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      🌈 Gradient
                    </button>
                    <button
                      type="button"
                      onClick={() => setThemeConfig({ ...themeConfig, sectionBgType: 'solid' })}
                      className={`py-1.5 px-2 rounded-xl font-bold text-[11px] cursor-pointer border ${
                        themeConfig.sectionBgType === 'solid'
                          ? 'bg-emerald-700 text-white border-emerald-800'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      ⬛ Solid Color
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {themeConfig.sectionBgType === 'gradient' ? 'Gradient Start / Primary BG' : 'Section Background Color'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeConfig.sectionBgColor.startsWith('#') ? themeConfig.sectionBgColor : '#451a03'}
                      onChange={(e) => setThemeConfig({ ...themeConfig, sectionBgColor: e.target.value })}
                      className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={themeConfig.sectionBgColor}
                      onChange={(e) => setThemeConfig({ ...themeConfig, sectionBgColor: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-[11px]"
                    />
                  </div>
                </div>

                {themeConfig.sectionBgType === 'gradient' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Gradient End Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={themeConfig.sectionBgGradientEnd?.startsWith('#') ? themeConfig.sectionBgGradientEnd : '#022c22'}
                        onChange={(e) => setThemeConfig({ ...themeConfig, sectionBgGradientEnd: e.target.value })}
                        className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={themeConfig.sectionBgGradientEnd || '#022c22'}
                        onChange={(e) => setThemeConfig({ ...themeConfig, sectionBgGradientEnd: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-[11px]"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Section Border Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeConfig.sectionBorderColor.startsWith('#') ? themeConfig.sectionBorderColor : '#f59e0b'}
                      onChange={(e) => setThemeConfig({ ...themeConfig, sectionBorderColor: e.target.value })}
                      className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={themeConfig.sectionBorderColor}
                      onChange={(e) => setThemeConfig({ ...themeConfig, sectionBorderColor: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Section Text Color</label>
                  <select
                    value={themeConfig.sectionTextColor}
                    onChange={(e) => setThemeConfig({ ...themeConfig, sectionTextColor: e.target.value as 'light' | 'dark' })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-bold"
                  >
                    <option value="light">⚪ White / Light Text (For Dark BG)</option>
                    <option value="dark">⚫ Slate / Dark Text (For Light BG)</option>
                  </select>
                </div>
              </div>

              {/* Column B: TABLE / CARD COLORS */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="font-black text-slate-900 block flex items-center gap-1.5">
                  <span>🪑 Table / Card Colors (ടേബിൾ കാർഡ് കളർ)</span>
                </span>

                {/* Quick Card Style Presets */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quick Card Presets:</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: 'Translucent Glass', bg: 'rgba(255, 255, 255, 0.10)', border: 'rgba(255, 255, 255, 0.15)', text: 'light' },
                      { label: 'Dark Slate Card', bg: '#1e293b', border: '#334155', text: 'light' },
                      { label: 'Emerald Tint', bg: 'rgba(6, 78, 59, 0.50)', border: 'rgba(34, 197, 94, 0.35)', text: 'light' },
                      { label: 'Pure White Card', bg: '#ffffff', border: '#e2e8f0', text: 'dark' },
                    ].map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setThemeConfig({
                          ...themeConfig,
                          cardBgColor: p.bg,
                          cardBorderColor: p.border,
                          cardTextColor: p.text as 'light' | 'dark',
                        })}
                        className="py-1 px-2 rounded-lg text-[10px] font-bold bg-white hover:bg-slate-100 border border-slate-200 cursor-pointer text-slate-700 truncate"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Card Background Color</label>
                  <input
                    type="text"
                    value={themeConfig.cardBgColor}
                    onChange={(e) => setThemeConfig({ ...themeConfig, cardBgColor: e.target.value })}
                    placeholder="e.g. rgba(255, 255, 255, 0.10) or #1e293b"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-[11px] bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Card Border Color</label>
                  <input
                    type="text"
                    value={themeConfig.cardBorderColor}
                    onChange={(e) => setThemeConfig({ ...themeConfig, cardBorderColor: e.target.value })}
                    placeholder="e.g. rgba(255, 255, 255, 0.15) or #334155"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-[11px] bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Card Text Style</label>
                  <select
                    value={themeConfig.cardTextColor}
                    onChange={(e) => setThemeConfig({ ...themeConfig, cardTextColor: e.target.value as 'light' | 'dark' })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-bold"
                  >
                    <option value="light">⚪ White / Light Text</option>
                    <option value="dark">⚫ Slate / Dark Text</option>
                  </select>
                </div>
              </div>

              {/* Column C: BUTTONS, BADGES & PRICE ACCENTS */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="font-black text-slate-900 block flex items-center gap-1.5">
                  <span>✨ Button &amp; Accent Highlights</span>
                </span>

                {/* Accent Button Color */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pre-Order Box Button Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeConfig.accentButtonColor.startsWith('#') ? themeConfig.accentButtonColor : '#fbbf24'}
                      onChange={(e) => setThemeConfig({ ...themeConfig, accentButtonColor: e.target.value })}
                      className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={themeConfig.accentButtonColor}
                      onChange={(e) => setThemeConfig({ ...themeConfig, accentButtonColor: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-[11px] bg-white"
                    />
                  </div>
                  {/* Swatches */}
                  <div className="flex items-center gap-1.5 pt-1.5">
                    {['#fbbf24', '#22c55e', '#f97316', '#e11d48', '#38bdf8', '#ffffff'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        style={{ backgroundColor: c }}
                        onClick={() => setThemeConfig({ ...themeConfig, accentButtonColor: c })}
                        className={`w-6 h-6 rounded-md border cursor-pointer ${themeConfig.accentButtonColor === c ? 'ring-2 ring-emerald-500 scale-110' : 'border-slate-300'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Price Color */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price Highlight Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeConfig.priceColor.startsWith('#') ? themeConfig.priceColor : '#fbbf24'}
                      onChange={(e) => setThemeConfig({ ...themeConfig, priceColor: e.target.value })}
                      className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={themeConfig.priceColor}
                      onChange={(e) => setThemeConfig({ ...themeConfig, priceColor: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-[11px] bg-white"
                    />
                  </div>
                </div>

                {/* Badge Color */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Top Badge Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeConfig.badgeColor.startsWith('#') ? themeConfig.badgeColor : '#fbbf24'}
                      onChange={(e) => setThemeConfig({ ...themeConfig, badgeColor: e.target.value })}
                      className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={themeConfig.badgeColor}
                      onChange={(e) => setThemeConfig({ ...themeConfig, badgeColor: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-[11px] bg-white"
                    />
                  </div>
                </div>

                {/* Action Save Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveTheme(themeConfig)}
                    className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4 text-amber-300" />
                    <span>Save Theme Colors</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetTheme}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    title="Reset to Default Theme"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2-Column Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Create & Broadcast Special Form */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center font-black shadow-md">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">Broadcast New Daily Special</h3>
              <p className="text-xs text-slate-500">Post hot Biriyanis, Porottas or Air Cargo drops</p>
            </div>
          </div>

          <form onSubmit={handleCreateSpecial} className="space-y-4 text-xs">
            {/* Title */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Special Item Name *</label>
              <input
                type="text"
                placeholder="e.g. Thalassery Dum Chicken Biriyani (Weekend Special)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Description &amp; Sides *</label>
              <textarea
                rows={3}
                placeholder="e.g. Authentic fragrant Jeerakasala rice, marinated chicken, fried onions, served with onion raita, lemon pickle & pappadam."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 transition-colors"
              />
            </div>

            {/* Category & Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e: any) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-600 transition-colors"
                >
                  <option value="biriyani">🍲 Fresh Dum Biriyani</option>
                  <option value="curry_bread">🫓 Porotta &amp; Curries</option>
                  <option value="snacks">☕ Hot Tea Snacks / Bakery</option>
                  <option value="air_cargo">✈️ Air Cargo Fresh Arrival</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Price (£)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="7.99"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-emerald-600 transition-colors"
                />
              </div>
            </div>

            {/* Portions & Badge */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Total Portions</label>
                <input
                  type="number"
                  value={portionsTotal}
                  onChange={(e) => {
                    setPortionsTotal(e.target.value);
                    setPortionsRemaining(e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 transition-colors"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Badge Text</label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="🔥 Hot Kitchen Special"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 transition-colors"
                />
              </div>
            </div>

            {/* Availability Time */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Availability Time Tag</label>
              <input
                type="text"
                value={availableTime}
                onChange={(e) => setAvailableTime(e.target.value)}
                placeholder="Fresh Batch • Ready Today from 12:30 PM"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 transition-colors"
              />
            </div>

            {/* ========================================== */}
            {/* PHOTO UPLOAD & ON-DEVICE AI STUDIO SECTION */}
            {/* ========================================== */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-800">
                  Dish / Product Photo (Upload &amp; AI)
                </label>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setImageTab('upload')}
                    className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                      imageTab === 'upload' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Upload Photo (AI)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageTab('preset')}
                    className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                      imageTab === 'preset' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Library Presets
                  </button>
                </div>
              </div>

              {imageTab === 'upload' ? (
                <div className="pt-1">
                  <AiImageStudioUpload
                    currentImageUrl={imageUrl}
                    title="Deal Food Photo Studio"
                    subtitle="Upload food photo or packaging. Neural AI automatically isolates product and creates studio packshots."
                    onImageChange={(newUrl) => {
                      setImageUrl(newUrl);
                    }}
                    compact
                  />
                </div>
              ) : (
                /* Preset Library Dropdown */
                <select
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-600 transition-colors"
                >
                  {PRESET_FOOD_IMAGES.map((p) => (
                    <option key={p.url} value={p.url}>
                      {p.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isPublishing || isFormProcessingBg}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-600 text-white font-black text-sm transition-all shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-amber-300" />
                <span>🚀 Broadcast &amp; Publish Special</span>
              </button>
              <p className="text-[10px] text-slate-500 text-center mt-2 font-medium">
                Instantly sends push notification toast &amp; showcases this item on the live customer storefront!
              </p>
            </div>
          </form>
        </div>

        {/* Right Column: Active Specials List & Notification History */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Active Specials Manager */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  Active Daily Kitchen Specials ({dailySpecials.length})
                </h3>
                <p className="text-xs text-slate-500">Live items currently displayed to customers on the app</p>
              </div>
            </div>

            <div className="space-y-3">
              {dailySpecials.map((special) => (
                <div
                  key={special.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-50/90 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    {/* Image with AI Photo Change trigger */}
                    <div className="relative group w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-white border border-slate-200 shadow-2xs">
                      <Image
                        src={special.imageUrl}
                        alt={special.title}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                      <button
                        onClick={() => handleOpenEditSpecialModal(special)}
                        className="absolute inset-0 bg-slate-900/70 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5 cursor-pointer"
                        title="Upload new image & remove background with AI"
                      >
                        <Camera className="w-4 h-4 text-amber-300" />
                        <span className="text-[9px] font-bold">AI Edit</span>
                      </button>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">{special.title}</h4>
                        {special.isSoldOut && (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-black rounded-md border border-rose-200">
                            SOLD OUT
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-amber-800 font-bold mt-0.5">
                        £{special.price.toFixed(2)} • {special.availableTime}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {special.portionsRemaining} / {special.portionsTotal} portions left
                      </div>
                    </div>
                  </div>

                  {/* Actions: Portion stepper, Sold out toggle, Delete */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {/* Portion decrement/increment */}
                    <div className="flex items-center bg-white rounded-xl p-1 border border-slate-200 shadow-2xs text-xs">
                      <button
                        onClick={() => updateDailySpecial(special.id, {
                          portionsRemaining: Math.max(0, special.portionsRemaining - 1),
                          isSoldOut: special.portionsRemaining - 1 <= 0
                        })}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer"
                        title="Reduce portion"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2.5 font-black text-slate-800">{special.portionsRemaining}</span>
                      <button
                        onClick={() => updateDailySpecial(special.id, {
                          portionsRemaining: special.portionsRemaining + 1,
                          isSoldOut: false
                        })}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer"
                        title="Increase portion"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Upload / Change Photo Button */}
                    <button
                      onClick={() => handleOpenEditSpecialModal(special)}
                      className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                      title="Upload normal photo or use AI Studio"
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="hidden sm:inline">Upload Photo</span>
                    </button>

                    {/* Sold Out Toggle */}
                    <button
                      onClick={() => toggleSoldOut(special.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        special.isSoldOut
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                      }`}
                    >
                      {special.isSoldOut ? 'In Stock' : 'Mark Sold Out'}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => deleteDailySpecial(special.id)}
                      className="p-2 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition-colors cursor-pointer"
                      title="Delete Special"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Custom Broadcast Form */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Bell className="w-4 h-4" />
              </div>
              <h3 className="font-black text-sm text-slate-900">Send Direct App Announcement to All Customers</h3>
            </div>

            <form onSubmit={handleSendCustomBroadcast} className="space-y-3 text-xs">
              <input
                type="text"
                placeholder="Announcement Title (e.g. ✈️ Fresh Air Cargo Tapioca & Nendran Arrived!)"
                value={customNotifTitle}
                onChange={(e) => setCustomNotifTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 font-semibold transition-colors"
              />
              <textarea
                rows={2}
                placeholder="Message (e.g. Direct air cargo batch available in Manchester store now! Limited stock.)"
                value={customNotifMsg}
                onChange={(e) => setCustomNotifMsg(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 transition-colors"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5 text-amber-400" />
                <span>Send Broadcast Notification</span>
              </button>
            </form>
          </div>

        </div>

      </div>

      {/* ========================================================= */}
      {/* MODAL: EDIT SPECIAL ITEM PHOTO (NORMAL PHOTO / AI STUDIO) */}
      {/* ========================================================= */}
      {activeEditSpecial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" 
            onClick={() => setActiveEditSpecial(null)} 
          />
          <div className="relative bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl z-10 space-y-5 border border-slate-200 animate-fadeIn">
            <button
              onClick={() => setActiveEditSpecial(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header & Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-800 to-teal-600 text-white flex items-center justify-center shadow-md">
                  <Camera className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Update Special Dish Photo
                  </h3>
                  <p className="text-xs text-slate-500 font-medium truncate max-w-[260px]">{activeEditSpecial.title}</p>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-bold self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => setEditImageTab('upload')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    editImageTab === 'upload' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  📸 Upload Photo
                </button>
                <button
                  type="button"
                  onClick={() => setEditImageTab('preset')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    editImageTab === 'preset' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  📚 Preset Library
                </button>
              </div>
            </div>

            {editImageTab === 'upload' ? (
              <div className="pt-1">
                <AiImageStudioUpload
                  currentImageUrl={editImage || activeEditSpecial.imageUrl}
                  title="Edit Food Photo Studio"
                  subtitle="Upload new food photo. Real-time AI will automatically isolate the item and create a clean studio packshot."
                  onImageChange={(newUrl) => {
                    setEditImage(newUrl);
                  }}
                  compact
                />
              </div>
            ) : (
              /* Preset Library Picker in Modal */
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Select from Authentic Kerala Food Library:
                </label>
                <select
                  value={editPresetUrl}
                  onChange={(e) => setEditPresetUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-600 text-xs transition-colors"
                >
                  {PRESET_FOOD_IMAGES.map((p) => (
                    <option key={p.url} value={p.url}>
                      {p.label}
                    </option>
                  ))}
                </select>

                {editPresetUrl && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Preset Preview
                    </span>
                    <div className="relative w-36 h-36 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                      <Image
                        src={editPresetUrl}
                        alt="Selected Preset"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveEditSpecial(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditedSpecialImage}
                disabled={(editImageTab === 'upload' && !editUploadedRaw) || isEditProcessingBg}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Photo to Live Special</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
