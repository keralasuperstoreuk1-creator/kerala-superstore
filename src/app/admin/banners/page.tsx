'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Sliders, 
  Flame, 
  Leaf, 
  Eye, 
  Camera, 
  RotateCcw, 
  Edit2, 
  X, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Sparkles, 
  Wand2, 
  Layers, 
  ShoppingBag, 
  Palette, 
  ImageIcon, 
  RefreshCw,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Move,
  ZoomIn,
  ZoomOut,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Crosshair
} from 'lucide-react';
import { useStoreConfig } from '@/context/StoreConfigContext';
import { OfferBannerConfig, HeroSlide, SpotlightPromoConfig } from '@/types';
import { DEFAULT_HERO_SLIDES, DEFAULT_SPOTLIGHT_PROMO } from '@/lib/hero-slides';
import { CATEGORIES } from '@/lib/mock-data';
import AiImageStudioUpload from '@/components/admin/AiImageStudioUpload';

type CustomizerTab = 'hero-slider' | 'announcement' | 'categories';

const CUTOUT_MIGRATION_MAP: Record<string, string> = {
  '/branding/kerala-grocery-basket.jpg': '/branding/kerala-grocery-basket-cutout.png',
  '/branding/kerala-spices-pack.jpg': '/branding/kerala-spices-pack-cutout.png',
  '/specials/thalassery_chicken_biriyani.jpg': '/specials/thalassery_chicken_biriyani-cutout.png',
  '/branding/kerala-snacks-showcase.jpg': '/branding/kerala-snacks-showcase-cutout.png',
  '/branding/kerala-coconut-oil-promo.jpg': '/branding/kerala-coconut-oil-promo-cutout.png',
};

const migrateImageSrc = (src?: string | null): string => {
  if (!src) return '';
  return CUTOUT_MIGRATION_MAP[src] || src;
};

export default function StorefrontBannersPage() {
  const { config, updateOfferBanner } = useStoreConfig();

  const [activeTab, setActiveTab] = useState<CustomizerTab>('hero-slider');
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  // Top Announcement Banner state
  const [offerBanner, setOfferBanner] = useState<OfferBannerConfig>(config.offerBanner);

  // Category custom images state: { [slug]: string }
  const [categoryImages, setCategoryImages] = useState<{ [slug: string]: string }>({});
  const [editingCategory, setEditingCategory] = useState<{ slug: string; name: string; currentImg: string } | null>(null);

  // Hero Slides state (EMarket Center Slider)
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(DEFAULT_HERO_SLIDES);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);

  // Slide Edit Modal Image upload state (AI Transparent Cutout vs Original vs Packshot)
  const [slideModalRaw, setSlideModalRaw] = useState<string | null>(null);
  const [slideModalTransparent, setSlideModalTransparent] = useState<string | null>(null);
  const [slideModalPackshot, setSlideModalPackshot] = useState<string | null>(null);
  const [slideModalOption, setSlideModalOption] = useState<'original' | 'ai-transparent' | 'ai-packshot'>('original');
  const [isSlideModalProcessing, setIsSlideModalProcessing] = useState<boolean>(false);
  const [slideModalProgress, setSlideModalProgress] = useState<string>('');
  const slideFileInputRef = useRef<HTMLInputElement | null>(null);

  // Spotlight Promo Card state (Right Promo Card)
  const [spotlightPromo, setSpotlightPromo] = useState<SpotlightPromoConfig>(DEFAULT_SPOTLIGHT_PROMO);
  const [spotlightRaw, setSpotlightRaw] = useState<string | null>(null);
  const [spotlightTransparent, setSpotlightTransparent] = useState<string | null>(null);
  const [spotlightPackshot, setSpotlightPackshot] = useState<string | null>(null);
  const [spotlightOption, setSpotlightOption] = useState<'original' | 'ai-transparent' | 'ai-packshot'>('original');
  const [isSpotlightProcessing, setIsSpotlightProcessing] = useState<boolean>(false);
  const [spotlightProgress, setSpotlightProgress] = useState<string>('');
  const spotlightFileInputRef = useRef<HTMLInputElement | null>(null);

  // Cloud sync helper
  const syncToCloud = async (payload: {
    heroSlides?: HeroSlide[];
    spotlightPromo?: SpotlightPromoConfig;
    categoryImages?: Record<string, string>;
  }) => {
    try {
      await fetch('/api/store/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.warn('Cloud sync error (fallback to local):', e);
    }
  };

  // Load from localStorage and sync with live Cloudflare R2 Cloud
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kss_category_images');
      if (saved) setCategoryImages(JSON.parse(saved));
    } catch {}

    try {
      const savedSlides = localStorage.getItem('kss_hero_slides');
      if (savedSlides) {
        const parsed = JSON.parse(savedSlides);
        if (Array.isArray(parsed) && parsed.length >= 1) {
          const migrated = parsed.map((s: HeroSlide) => ({
            ...s,
            image: migrateImageSrc(s.image),
          }));
          setHeroSlides(migrated);
        } else {
          setHeroSlides(DEFAULT_HERO_SLIDES);
        }
      } else {
        setHeroSlides(DEFAULT_HERO_SLIDES);
      }
    } catch {
      setHeroSlides(DEFAULT_HERO_SLIDES);
    }

    try {
      const savedPromo = localStorage.getItem('kss_spotlight_promo');
      if (savedPromo) {
        const parsed = JSON.parse(savedPromo);
        const migrated = {
          ...parsed,
          image: migrateImageSrc(parsed.image),
        };
        setSpotlightPromo(migrated);
      } else {
        setSpotlightPromo(DEFAULT_SPOTLIGHT_PROMO);
      }
    } catch {
      setSpotlightPromo(DEFAULT_SPOTLIGHT_PROMO);
    }

    // Fetch live configuration from Cloudflare R2 cloud (syncs across all computers & devices)
    fetch('/api/store/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (Array.isArray(data.heroSlides) && data.heroSlides.length > 0) {
            const migrated = data.heroSlides.map((s: HeroSlide) => ({
              ...s,
              image: migrateImageSrc(s.image),
            }));
            setHeroSlides(migrated);
            try { localStorage.setItem('kss_hero_slides', JSON.stringify(migrated)); } catch {}
          }
          if (data.spotlightPromo) {
            const migratedPromo = {
              ...data.spotlightPromo,
              image: migrateImageSrc(data.spotlightPromo.image),
            };
            setSpotlightPromo(migratedPromo);
            try { localStorage.setItem('kss_spotlight_promo', JSON.stringify(migratedPromo)); } catch {}
          }
          if (data.categoryImages && Object.keys(data.categoryImages).length > 0) {
            setCategoryImages(data.categoryImages);
            try { localStorage.setItem('kss_category_images', JSON.stringify(data.categoryImages)); } catch {}
          }
        }
      })
      .catch((e) => console.warn('Could not fetch cloud config:', e));
  }, []);

  const showSuccess = (msg: string) => {
    setSavedSuccess(msg);
    setTimeout(() => setSavedSuccess(null), 3500);
  };

  // Dragging & Pinch states for interactive image move in banner preview
  const [isDragging, setIsDragging] = useState(false);
  const [showSlideNudgePad, setShowSlideNudgePad] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);
  const pinchStartRef = useRef<{ dist: number; initScale: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!editingSlide) return;
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: editingSlide.imageX || 0,
      initY: editingSlide.imageY || 0,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current || !editingSlide) return;
    const currentDrag = dragStartRef.current;
    if (!currentDrag) return;
    const dx = e.clientX - currentDrag.startX;
    const dy = e.clientY - currentDrag.startY;
    const nextX = Math.round(currentDrag.initX + dx);
    const nextY = Math.round(currentDrag.initY + dy);
    setEditingSlide((prev) => prev ? {
      ...prev,
      imageX: nextX,
      imageY: nextY,
    } : null);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // Full Touch & Pinch-to-zoom support for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!editingSlide) return;
    if (e.touches.length === 2) {
      // 2 fingers = Pinch to zoom on phone screen
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      pinchStartRef.current = {
        dist: dist > 0 ? dist : 1,
        initScale: editingSlide.imageScale || 100,
      };
      setIsDragging(false);
      dragStartRef.current = null;
      return;
    }
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      dragStartRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        initX: editingSlide.imageX || 0,
        initY: editingSlide.imageY || 0,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!editingSlide) return;
    if (e.touches.length === 2 && pinchStartRef.current) {
      // Smooth Mobile Pinch Zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      const factor = currentDist / pinchStartRef.current.dist;
      const nextScale = Math.min(220, Math.max(40, Math.round(pinchStartRef.current.initScale * factor)));
      setEditingSlide((prev) => prev ? { ...prev, imageScale: nextScale } : null);
      return;
    }
    if (isDragging && dragStartRef.current && e.touches.length === 1) {
      const currentDrag = dragStartRef.current;
      const touch = e.touches[0];
      const dx = touch.clientX - currentDrag.startX;
      const dy = touch.clientY - currentDrag.startY;
      const nextX = Math.round(currentDrag.initX + dx);
      const nextY = Math.round(currentDrag.initY + dy);
      setEditingSlide((prev) => prev ? {
        ...prev,
        imageX: nextX,
        imageY: nextY,
      } : null);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    dragStartRef.current = null;
    pinchStartRef.current = null;
  };

  // Helper nudge functions for directional buttons
  const nudgeImage = (dx: number, dy: number) => {
    if (!editingSlide) return;
    setEditingSlide((prev) => prev ? {
      ...prev,
      imageX: (prev.imageX || 0) + dx,
      imageY: (prev.imageY || 0) + dy,
    } : null);
  };

  const zoomImage = (delta: number) => {
    if (!editingSlide) return;
    setEditingSlide((prev) => {
      if (!prev) return null;
      const current = prev.imageScale || 100;
      const next = Math.min(220, Math.max(40, current + delta));
      return { ...prev, imageScale: next };
    });
  };

  const resetImagePositionAndZoom = () => {
    if (!editingSlide) return;
    setEditingSlide((prev) => prev ? {
      ...prev,
      imageScale: 100,
      imageX: 0,
      imageY: 0,
    } : null);
  };

  // ==========================================
  // ON-DEVICE AI BACKGROUND REMOVAL HELPER
  // ==========================================
  const runAiBgRemoval = async (
    base64DataUrl: string,
    onProgress?: (text: string) => void
  ): Promise<{ packshot: string; transparent: string }> => {
    onProgress?.('🧠 Neural network isolating product (U²-Net)...');
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
    onProgress?.('✅ Background cleanly removed!');
    return { packshot: data.packshot, transparent: data.transparent };
  };

  // ==========================================
  // HERO SLIDES HANDLERS
  // ==========================================
  const saveHeroSlides = (slides: HeroSlide[]) => {
    setHeroSlides(slides);
    try {
      localStorage.setItem('kss_hero_slides', JSON.stringify(slides));
      window.dispatchEvent(new Event('kss_hero_slides_updated'));
    } catch {}
    // Global Cloudflare R2 sync across all devices & customer computers
    syncToCloud({ heroSlides: slides });
    showSuccess('Hero banner slides updated! Live on customer storefront.');
  };

  const handleOpenSlideModal = (slide: HeroSlide) => {
    setEditingSlide({ 
      ...slide, 
      imageScale: slide.imageScale ?? 100,
      imageX: slide.imageX ?? 0,
      imageY: slide.imageY ?? 0,
    });
    setSlideModalRaw(slide.image || null);
    setSlideModalTransparent(null);
    setSlideModalPackshot(null);
    setSlideModalOption('original');
    setIsSlideModalProcessing(false);
    setSlideModalProgress('');
  };

  // Upload Slide Photo (Instant Original, NO Auto AI)
  const handleSlideModalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingSlide) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const rawBase64 = ev.target?.result as string;
      if (!rawBase64) return;

      setSlideModalRaw(rawBase64);
      setSlideModalTransparent(null);
      setSlideModalPackshot(null);
      setSlideModalOption('original');
      setEditingSlide((prev) => (prev ? { ...prev, image: rawBase64 } : null));
    };
    reader.readAsDataURL(file);
  };

  // Explicit Button to trigger AI background removal only when requested
  const handleRunSlideAiBgRemoval = async () => {
    const source = slideModalRaw || editingSlide?.image;
    if (!source || isSlideModalProcessing) return;

    setIsSlideModalProcessing(true);
    try {
      const { packshot, transparent } = await runAiBgRemoval(source, setSlideModalProgress);
      setSlideModalTransparent(transparent);
      setSlideModalPackshot(packshot);
      setSlideModalOption('ai-transparent');
      setEditingSlide((prev) => (prev ? { ...prev, image: transparent } : null));
      showSuccess('✨ Clean transparent cutout created (No background square/shade)!');
    } catch (err) {
      console.error('AI removal error:', err);
      alert('Could not remove background automatically. Your original image is retained.');
    } finally {
      setIsSlideModalProcessing(false);
      setSlideModalProgress('');
    }
  };

  const handleSelectSlideOption = (option: 'original' | 'ai-transparent' | 'ai-packshot') => {
    if (!editingSlide) return;
    setSlideModalOption(option);
    if (option === 'original' && slideModalRaw) {
      setEditingSlide({ ...editingSlide, image: slideModalRaw });
    } else if (option === 'ai-transparent' && slideModalTransparent) {
      setEditingSlide({ ...editingSlide, image: slideModalTransparent });
    } else if (option === 'ai-packshot' && slideModalPackshot) {
      setEditingSlide({ ...editingSlide, image: slideModalPackshot });
    }
  };

  const handleSaveEditedSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide) return;
    const exists = heroSlides.some((s) => s.id === editingSlide.id);
    const updated = exists 
      ? heroSlides.map((s) => (s.id === editingSlide.id ? editingSlide : s))
      : [...heroSlides, editingSlide];
    saveHeroSlides(updated);
    setEditingSlide(null);
  };

  const handleAddNewSlide = () => {
    const newId = `slide-${Date.now()}`;
    const newSlide: HeroSlide = {
      id: newId,
      badge: '100% Authentic Kerala Import',
      titleMain: 'Fresh & Authentic',
      titleHighlight: 'Specialities',
      sub: 'Kerala',
      desc: 'Exclusive traditional delicacies and fresh groceries delivered to your home across the UK.',
      image: '/branding/kerala-grocery-basket.jpg',
      cta: 'SHOP NOW',
      categorySlug: 'rice-and-rice-products',
      bgColor: '#064e3b',
      textColor: 'light',
      accentColor: '#22c55e',
      imageScale: 100,
      imageX: 0,
      imageY: 0
    };
    handleOpenSlideModal(newSlide);
  };

  const handleDeleteSlide = (id: string) => {
    if (heroSlides.length <= 1) {
      alert('At least one slide is required for the hero slider.');
      return;
    }
    const updated = heroSlides.filter((s) => s.id !== id);
    saveHeroSlides(updated);
    if (editingSlide?.id === id) setEditingSlide(null);
  };

  const handleResetSlides = () => {
    saveHeroSlides(DEFAULT_HERO_SLIDES);
    setEditingSlide(null);
  };

  // ==========================================
  // SPOTLIGHT PROMO CARD HANDLERS
  // ==========================================
  const saveSpotlightPromo = (promo: SpotlightPromoConfig, notify: boolean = true) => {
    setSpotlightPromo(promo);
    try {
      localStorage.setItem('kss_spotlight_promo', JSON.stringify(promo));
      window.dispatchEvent(new Event('kss_spotlight_promo_updated'));
    } catch {}
    if (notify) {
      syncToCloud({ spotlightPromo: promo });
      showSuccess('Right spotlight promo card updated! Live on customer storefront.');
    }
  };

  // Helper spotlight zoom & nudge functions
  const nudgeSpotlight = (dx: number, dy: number) => {
    saveSpotlightPromo({
      ...spotlightPromo,
      imageX: (spotlightPromo.imageX || 0) + dx,
      imageY: (spotlightPromo.imageY || 0) + dy,
    }, false);
  };

  const zoomSpotlight = (delta: number) => {
    const current = spotlightPromo.imageScale || 100;
    const next = Math.max(40, Math.min(250, current + delta));
    saveSpotlightPromo({
      ...spotlightPromo,
      imageScale: next,
    }, false);
  };

  const resetSpotlightPositionAndZoom = () => {
    saveSpotlightPromo({
      ...spotlightPromo,
      imageScale: 100,
      imageX: 0,
      imageY: 0,
    }, true);
  };

  // Dragging & Pinch states for interactive image move on Spotlight Preview Card
  const [isSpotlightDragging, setIsSpotlightDragging] = useState(false);
  const [showSpotlightNudgePad, setShowSpotlightNudgePad] = useState(false);
  const spotlightDragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);
  const spotlightPinchStartRef = useRef<{ dist: number; initScale: number } | null>(null);

  const handleSpotlightMouseDown = (e: React.MouseEvent) => {
    setIsSpotlightDragging(true);
    spotlightDragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: spotlightPromo.imageX || 0,
      initY: spotlightPromo.imageY || 0,
    };
  };

  const handleSpotlightMouseMove = (e: React.MouseEvent) => {
    if (!isSpotlightDragging || !spotlightDragStartRef.current) return;
    const currentDrag = spotlightDragStartRef.current;
    if (!currentDrag) return;
    const dx = e.clientX - currentDrag.startX;
    const dy = e.clientY - currentDrag.startY;
    const nextX = Math.round(currentDrag.initX + dx);
    const nextY = Math.round(currentDrag.initY + dy);
    saveSpotlightPromo({
      ...spotlightPromo,
      imageX: nextX,
      imageY: nextY,
    }, false);
  };

  const handleSpotlightMouseUp = () => {
    if (isSpotlightDragging) {
      setIsSpotlightDragging(false);
      spotlightDragStartRef.current = null;
      showSuccess('Promo image position saved!');
    }
  };

  const handleSpotlightTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // 2-finger pinch to zoom on phone screen
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      spotlightPinchStartRef.current = {
        dist: dist > 0 ? dist : 1,
        initScale: spotlightPromo.imageScale || 100,
      };
      setIsSpotlightDragging(false);
      spotlightDragStartRef.current = null;
      return;
    }
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsSpotlightDragging(true);
      spotlightDragStartRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        initX: spotlightPromo.imageX || 0,
        initY: spotlightPromo.imageY || 0,
      };
    }
  };

  const handleSpotlightTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && spotlightPinchStartRef.current) {
      // Smooth Pinch Zoom on Spotlight
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      const factor = currentDist / spotlightPinchStartRef.current.dist;
      const nextScale = Math.min(250, Math.max(40, Math.round(spotlightPinchStartRef.current.initScale * factor)));
      saveSpotlightPromo({
        ...spotlightPromo,
        imageScale: nextScale,
      }, false);
      return;
    }
    if (isSpotlightDragging && spotlightDragStartRef.current && e.touches.length === 1) {
      const currentDrag = spotlightDragStartRef.current;
      const touch = e.touches[0];
      const dx = touch.clientX - currentDrag.startX;
      const dy = touch.clientY - currentDrag.startY;
      const nextX = Math.round(currentDrag.initX + dx);
      const nextY = Math.round(currentDrag.initY + dy);
      saveSpotlightPromo({
        ...spotlightPromo,
        imageX: nextX,
        imageY: nextY,
      }, false);
    }
  };

  const handleSpotlightTouchEnd = () => {
    if (isSpotlightDragging) {
      setIsSpotlightDragging(false);
      spotlightDragStartRef.current = null;
      showSuccess('Promo image position saved!');
    }
    spotlightPinchStartRef.current = null;
  };

  const handleSpotlightFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const rawBase64 = ev.target?.result as string;
      if (!rawBase64) return;

      setSpotlightRaw(rawBase64);
      setSpotlightPackshot(null);
      setSpotlightOption('original');
      saveSpotlightPromo({ ...spotlightPromo, image: rawBase64 });
    };
    reader.readAsDataURL(file);
  };

  const handleRunSpotlightAi = async () => {
    const source = spotlightRaw || spotlightPromo.image;
    if (!source || isSpotlightProcessing) return;

    setIsSpotlightProcessing(true);
    try {
      const { packshot } = await runAiBgRemoval(source, setSpotlightProgress);
      setSpotlightPackshot(packshot);
      setSpotlightOption('ai-packshot');
      saveSpotlightPromo({ ...spotlightPromo, image: packshot });
      showSuccess('✨ AI Studio Packshot created for Promo Card!');
    } catch (err) {
      console.error('Spotlight AI error:', err);
      alert('Could not remove background automatically. Your original image is retained.');
    } finally {
      setIsSpotlightProcessing(false);
      setSpotlightProgress('');
    }
  };

  const handleSelectSpotlightOption = (option: 'original' | 'ai-packshot') => {
    setSpotlightOption(option);
    if (option === 'original' && spotlightRaw) {
      saveSpotlightPromo({ ...spotlightPromo, image: spotlightRaw });
    } else if (option === 'ai-packshot' && spotlightPackshot) {
      saveSpotlightPromo({ ...spotlightPromo, image: spotlightPackshot });
    }
  };

  // ==========================================
  // CATEGORIES & IMAGES HANDLERS
  // ==========================================
  const handleCategoryImageUpload = (slug: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      const updated = { ...categoryImages, [slug]: dataUrl };
      setCategoryImages(updated);
      localStorage.setItem('kss_category_images', JSON.stringify(updated));
      window.dispatchEvent(new Event('kss_category_images_updated'));
      syncToCloud({ categoryImages: updated });
      showSuccess('Category image updated with uploaded photo!');
    };
    reader.readAsDataURL(file);
  };

  const handleResetCategoryImage = (slug: string) => {
    const updated = { ...categoryImages };
    delete updated[slug];
    setCategoryImages(updated);
    localStorage.setItem('kss_category_images', JSON.stringify(updated));
    window.dispatchEvent(new Event('kss_category_images_updated'));
    syncToCloud({ categoryImages: updated });
    showSuccess('Reset category image to default.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Storefront &amp; Banner Customizer
              </h1>
              <p className="text-xs text-slate-500">
                Live visual control: Hero Carousel Slider, Spotlight Promo Card, Flash Announcement Bar &amp; Category Cards.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/settings"
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span>Store &amp; Delivery Settings</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2"
          >
            <Eye className="w-4 h-4 text-amber-300" />
            <span>Open Customer Store</span>
          </a>
        </div>
      </div>

      {/* Global Toast Notification */}
      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2.5 text-xs font-bold shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{savedSuccess}</span>
        </div>
      )}

      {/* Navigation Tabs - Horizontally Scrollable on Mobile */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs text-xs font-bold overflow-x-auto no-scrollbar whitespace-nowrap">
        <button
          onClick={() => setActiveTab('hero-slider')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'hero-slider'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>1. Hero Slider &amp; Spotlight Promo</span>
        </button>

        <button
          onClick={() => setActiveTab('announcement')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'announcement'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Flame className="w-4 h-4 text-rose-500" />
          <span>2. Flash Announcement Bar</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'categories'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Leaf className="w-4 h-4 text-emerald-400" />
          <span>3. Category Cards &amp; Photos</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: HERO SLIDER & SPOTLIGHT PROMO CARD                 */}
      {/* ========================================================= */}
      {activeTab === 'hero-slider' && (
        <div className="space-y-6">
          {/* Hero Slider Cards Header */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                  <Sliders className="w-5 h-5 text-emerald-700" />
                  <span>Main Center Hero Carousel Slides</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Control all sliding promotional banners shown at the top center of your storefront homepage.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetSlides}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default Slides</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddNewSlide}
                  className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Slide</span>
                </button>
              </div>
            </div>

            {/* List of Hero Slides */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {heroSlides.map((slide, index) => {
                const bg = slide.bgColor || '#064e3b';
                const isDark = slide.textColor === 'light' || (!slide.textColor && bg !== '#ffffff');

                return (
                  <div
                    key={slide.id}
                    className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow"
                  >
                    {/* Visual Slide Header Preview */}
                    <div 
                      style={{ backgroundColor: bg }}
                      className="p-4 relative overflow-hidden flex flex-col justify-between min-h-[140px]"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className={`px-2 py-0.5 rounded-full ${
                          isDark ? 'bg-black/30 text-amber-300' : 'bg-white/80 text-emerald-800'
                        }`}>
                          Slide #{index + 1} • {slide.badge || 'Banner'}
                        </span>
                        {slide.offerTag && (
                          <span className="bg-amber-400 text-emerald-950 px-2 py-0.5 rounded-md font-black text-[10px]">
                            {slide.offerTag}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-12 gap-2 items-center my-auto">
                        <div className="col-span-8">
                          <h4 className={`font-black text-sm leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {slide.titleMain} <span className={isDark ? 'text-amber-300' : 'text-orange-600'}>{slide.sub}</span><br/>
                            <span>{slide.titleHighlight}</span>
                          </h4>
                          <p className={`text-[10px] line-clamp-1 mt-1 ${isDark ? 'text-emerald-100/70' : 'text-slate-500'}`}>
                            {slide.desc}
                          </p>
                        </div>
                        <div className="col-span-4 relative h-16 flex items-center justify-center">
                          {slide.image && (
                            <Image
                              src={slide.image}
                              alt={slide.titleMain}
                              fill
                              unoptimized
                              className="object-contain"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="p-3 bg-white flex items-center justify-between border-t border-slate-200 text-xs">
                      <span className="text-[11px] text-slate-500 font-medium truncate max-w-[180px]">
                        CTA: <strong>{slide.cta || 'Shop Now'}</strong>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenSlideModal(slide)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit Banner</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteSlide(slide.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Delete Slide"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION B: RIGHT SPOTLIGHT PROMO CARD */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>Right Spotlight Promo Banner (Stationary Deal Card)</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Control the prominent stationary promo card displayed on the right of your storefront hero grid.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={spotlightPromo.enabled}
                    onChange={(e) => saveSpotlightPromo({ ...spotlightPromo, enabled: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500"
                  />
                  <span>Show Promo Card</span>
                </label>

                <button
                  type="button"
                  onClick={() => saveSpotlightPromo(DEFAULT_SPOTLIGHT_PROMO)}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Promo Card Preview (Exact Storefront Appearance) */}
              <div className="lg:col-span-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Live Deal Card Preview (Storefront Look):
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Real-Time Sync
                  </span>
                </div>

                {(() => {
                  const promoBg = spotlightPromo.bgColor || 'gradient-amber';
                  const isCustomBg = promoBg !== 'gradient-amber' && promoBg !== '#fffbeb';
                  const isDark = spotlightPromo.textColor === 'light' || (!spotlightPromo.textColor && isCustomBg && promoBg !== '#ffffff');
                  const btnColor = spotlightPromo.accentColor || '#5ea813';
                  const ribbonBg = spotlightPromo.ribbonColor || '#f97316';
                  const bgStyle = promoBg === 'gradient-amber' ? {} : { backgroundColor: promoBg };
                  const bgClass = promoBg === 'gradient-amber' ? 'bg-gradient-to-br from-amber-50/80 via-white to-amber-50/50' : '';

                  return (
                    <div
                      onMouseMove={handleSpotlightMouseMove}
                      onMouseUp={handleSpotlightMouseUp}
                      onMouseLeave={handleSpotlightMouseUp}
                      onTouchMove={handleSpotlightTouchMove}
                      onTouchEnd={handleSpotlightTouchEnd}
                      style={bgStyle}
                      className={`w-full ${bgClass} rounded-2xl border border-slate-200/90 shadow-md p-6 flex flex-col justify-between relative min-h-[380px] overflow-hidden select-none transition-colors duration-300`}
                    >
                      {/* Diagonal Corner Ribbon */}
                      <div
                        style={{ backgroundColor: ribbonBg }}
                        className="absolute top-4 -right-10 text-white text-[9px] font-black uppercase tracking-wider py-1 px-10 rotate-45 shadow-sm pointer-events-none"
                      >
                        {spotlightPromo.ribbonText || 'Special Offer'}
                      </div>

                      {/* Content Header */}
                      <div className="space-y-1 relative z-10 text-left pointer-events-none">
                        <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-amber-300' : 'text-slate-500'}`}>
                          {spotlightPromo.subtitle || 'Cold Pressed Pure'}
                        </span>
                        <div className={`text-xl sm:text-2xl font-black leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          <span className={isDark ? 'text-amber-400' : 'text-[#f97316]'}>{spotlightPromo.highlightText || '25% OFF'}</span> <br />
                          <span className={isDark ? 'text-white' : 'text-slate-900'}>{spotlightPromo.title || 'Coconut Oil'}</span>
                        </div>
                        <p className={`text-[11px] leading-tight pt-1 ${isDark ? 'text-emerald-100/80' : 'text-slate-500'}`}>
                          {spotlightPromo.description || 'Pure roasted & filtered Kerala coconut oil for authentic curries.'}
                        </p>

                        {/* CTA Button */}
                        <div className="pt-2">
                          <span
                            style={{ backgroundColor: btnColor }}
                            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20"
                          >
                            <span>{spotlightPromo.buttonText || 'SHOP NOW'}</span>
                            <span className="text-sm">▷</span>
                          </span>
                        </div>
                      </div>

                      {/* Interactive Drag & Pan Product Image Showcase */}
                      <div className="relative w-full aspect-square max-h-56 mt-3 flex items-center justify-center overflow-hidden border border-dashed border-amber-300/40 rounded-xl bg-white/20 group cursor-grab active:cursor-grabbing touch-none">
                        {spotlightPromo.image && (
                          <div
                            onMouseDown={handleSpotlightMouseDown}
                            onTouchStart={handleSpotlightTouchStart}
                            style={{
                              transform: `translate(${spotlightPromo.imageX || 0}px, ${spotlightPromo.imageY || 0}px) scale(${(spotlightPromo.imageScale || 100) / 100})`,
                              cursor: isSpotlightDragging ? 'grabbing' : 'grab',
                            }}
                            className={`relative w-44 h-44 sm:w-48 sm:h-48 transition-transform ${isSpotlightDragging ? 'duration-0' : 'duration-150'} select-none touch-none`}
                            title="Touch or Drag to position photo, Pinch to zoom!"
                          >
                            <Image
                              src={spotlightPromo.image}
                              alt={spotlightPromo.title || 'Promo'}
                              fill
                              unoptimized
                              draggable={false}
                              className="object-contain pointer-events-none"
                            />
                            <div className="absolute inset-0 border border-dashed border-amber-400/60 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none flex items-center justify-center transition-opacity">
                              <span className="bg-black/75 text-amber-300 text-[9px] font-black px-2 py-0.5 rounded shadow">
                                ✋ Drag to Move
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Interactive Floating On-Card Zoom & Mobile Nudge Bar */}
                      <div 
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className={`flex flex-wrap items-center justify-between gap-2 text-[10px] pt-2 border-t relative z-20 ${isDark ? 'border-white/15 text-white' : 'border-slate-200 text-slate-800'}`}
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold flex items-center gap-1 text-[10px]">
                            <span>✋ Touch/Drag</span>
                            <span className="opacity-40">•</span>
                            <span>🤏 Pinch</span>
                          </span>
                          <span className={`font-mono px-1.5 py-0.5 rounded text-[9px] font-bold border ${isDark ? 'bg-black/60 text-amber-300 border-white/10' : 'bg-white text-emerald-800 border-slate-200'}`}>
                            X: {spotlightPromo.imageX || 0}px | Y: {spotlightPromo.imageY || 0}px
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowSpotlightNudgePad(!showSpotlightNudgePad)}
                            className={`px-2 py-0.5 rounded-md font-bold text-[9px] cursor-pointer transition-colors border ${
                              showSpotlightNudgePad
                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                                : isDark
                                ? 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                            }`}
                            title="Toggle Directional Tap Buttons for Precise Mobile Adjustment"
                          >
                            🎯 Nudge Pad
                          </button>
                        </div>

                        {/* Direct Zoom Controls */}
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border backdrop-blur-md shadow-md ${isDark ? 'bg-black/80 border-white/20 text-white' : 'bg-white/90 border-slate-300 text-slate-900'}`}>
                          <button
                            type="button"
                            onClick={() => zoomSpotlight(-10)}
                            className={`w-6 h-6 rounded-md flex items-center justify-center font-black text-sm cursor-pointer active:scale-95 transition-transform ${isDark ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}
                            title="Zoom Out (-10%)"
                          >
                            -
                          </button>
                          <input
                            type="range"
                            min="40"
                            max="220"
                            step="5"
                            value={spotlightPromo.imageScale || 100}
                            onChange={(e) => saveSpotlightPromo({ ...spotlightPromo, imageScale: Number(e.target.value) }, false)}
                            className="w-16 sm:w-20 accent-amber-500 cursor-pointer h-2"
                            title="Zoom Slider"
                          />
                          <span className="font-mono text-amber-500 font-black w-9 text-center text-[10px]">
                            {spotlightPromo.imageScale || 100}%
                          </span>
                          <button
                            type="button"
                            onClick={() => zoomSpotlight(10)}
                            className={`w-6 h-6 rounded-md flex items-center justify-center font-black text-sm cursor-pointer active:scale-95 transition-transform ${isDark ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}
                            title="Zoom In (+10%)"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={resetSpotlightPositionAndZoom}
                            className="ml-0.5 px-2 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 text-[9px] font-bold border border-amber-500/30 cursor-pointer active:scale-95 transition-all"
                            title="Reset Position to Center & 100%"
                          >
                            <RotateCcw className="w-2.5 h-2.5 inline mr-0.5" />
                            Reset
                          </button>
                        </div>
                      </div>

                      {/* Optional Mobile Quick Nudge Directional Buttons */}
                      {showSpotlightNudgePad && (
                        <div 
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          className={`mt-2 p-2 rounded-xl border flex items-center justify-between gap-2 z-20 ${
                            isDark ? 'bg-black/85 border-white/20 text-white' : 'bg-slate-100/95 border-slate-300 text-slate-900'
                          }`}
                        >
                          <span className="text-[9px] font-bold text-amber-400">Tap to Nudge 5px:</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => nudgeSpotlight(-5, 0)}
                              className="w-7 h-7 rounded-md bg-white/20 hover:bg-white/30 flex items-center justify-center font-black text-xs cursor-pointer active:scale-90"
                              title="Move Left"
                            >
                              ◀
                            </button>
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                onClick={() => nudgeSpotlight(0, -5)}
                                className="w-7 h-3.5 rounded bg-white/20 hover:bg-white/30 flex items-center justify-center font-black text-[9px] cursor-pointer active:scale-90"
                                title="Move Up"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                onClick={() => nudgeSpotlight(0, 5)}
                                className="w-7 h-3.5 rounded bg-white/20 hover:bg-white/30 flex items-center justify-center font-black text-[9px] cursor-pointer active:scale-90"
                                title="Move Down"
                              >
                                ▼
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => nudgeSpotlight(5, 0)}
                              className="w-7 h-7 rounded-md bg-white/20 hover:bg-white/30 flex items-center justify-center font-black text-xs cursor-pointer active:scale-90"
                              title="Move Right"
                            >
                              ▶
                            </button>
                            <button
                              type="button"
                              onClick={() => saveSpotlightPromo({ ...spotlightPromo, imageX: 0, imageY: 0 }, false)}
                              className="ml-1 px-2 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[9px] cursor-pointer active:scale-90"
                              title="Center Position"
                            >
                              Center
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Promo Card Edit Controls & Customizer */}
              <div className="lg:col-span-7 space-y-4 text-xs">
                {/* 1. Theme & Color Palettes */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <span className="font-black text-slate-900 text-xs block">
                    🎨 Promo Card Background Theme &amp; Color Style
                  </span>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-600">
                      Preset Deal Card Palette:
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[
                        { label: 'Amber Cream', hex: '#fffbeb', textColor: 'dark', accent: '#5ea813', ribbon: '#f97316' },
                        { label: 'Deep Emerald', hex: '#064e3b', textColor: 'light', accent: '#22c55e', ribbon: '#eab308' },
                        { label: 'Forest Green', hex: '#052e16', textColor: 'light', accent: '#f97316', ribbon: '#f97316' },
                        { label: 'Midnight Slate', hex: '#0f172a', textColor: 'light', accent: '#22c55e', ribbon: '#e11d48' },
                        { label: 'Warm Saffron', hex: '#78350f', textColor: 'light', accent: '#eab308', ribbon: '#f97316' },
                        { label: 'Royal Navy', hex: '#0c4a6e', textColor: 'light', accent: '#38bdf8', ribbon: '#f97316' },
                      ].map((pal) => (
                        <button
                          key={pal.hex}
                          type="button"
                          onClick={() => saveSpotlightPromo({
                            ...spotlightPromo,
                            bgColor: pal.hex,
                            textColor: pal.textColor as 'light' | 'dark',
                            accentColor: pal.accent,
                            ribbonColor: pal.ribbon,
                          })}
                          style={{ backgroundColor: pal.hex }}
                          className={`p-2 rounded-xl text-center font-bold text-[10px] cursor-pointer transition-all border ${
                            spotlightPromo.bgColor === pal.hex
                              ? 'ring-2 ring-amber-500 scale-105 border-white shadow-md'
                              : 'border-slate-300 opacity-90 hover:opacity-100'
                          } ${pal.textColor === 'light' ? 'text-white' : 'text-slate-900'}`}
                        >
                          {pal.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Custom BG Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={spotlightPromo.bgColor || '#fffbeb'}
                          onChange={(e) => saveSpotlightPromo({ ...spotlightPromo, bgColor: e.target.value })}
                          className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={spotlightPromo.bgColor || '#fffbeb'}
                          onChange={(e) => saveSpotlightPromo({ ...spotlightPromo, bgColor: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-[11px]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Font Text Style</label>
                      <select
                        value={spotlightPromo.textColor || 'dark'}
                        onChange={(e) => saveSpotlightPromo({ ...spotlightPromo, textColor: e.target.value as 'light' | 'dark' })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white text-xs"
                      >
                        <option value="dark">⚫ Slate / Dark Text (For Light BG)</option>
                        <option value="light">⚪ White / Light Text (For Dark BG)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Button Accent Color</label>
                      <select
                        value={spotlightPromo.accentColor || '#5ea813'}
                        onChange={(e) => saveSpotlightPromo({ ...spotlightPromo, accentColor: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white text-xs"
                      >
                        <option value="#5ea813">🟢 Fresh Leaf Green</option>
                        <option value="#f97316">🟠 Vibrant Orange</option>
                        <option value="#eab308">🟡 Kerala Gold</option>
                        <option value="#e11d48">🔴 Crimson Rose</option>
                        <option value="#0284c7">🔵 Ocean Blue</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Text & Content Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Corner Diagonal Ribbon</label>
                    <input
                      type="text"
                      value={spotlightPromo.ribbonText || ''}
                      onChange={(e) => saveSpotlightPromo({ ...spotlightPromo, ribbonText: e.target.value })}
                      placeholder="e.g. Special Offer, 25% OFF"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Subtitle Line</label>
                    <input
                      type="text"
                      value={spotlightPromo.subtitle || ''}
                      onChange={(e) => saveSpotlightPromo({ ...spotlightPromo, subtitle: e.target.value })}
                      placeholder="e.g. Cold Pressed Pure"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Headline Highlight (Colored)</label>
                    <input
                      type="text"
                      value={spotlightPromo.highlightText || ''}
                      onChange={(e) => saveSpotlightPromo({ ...spotlightPromo, highlightText: e.target.value })}
                      placeholder="e.g. 25% OFF, WEEKLY COMBO"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold text-orange-600 outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Main Product Title</label>
                    <input
                      type="text"
                      value={spotlightPromo.title || ''}
                      onChange={(e) => saveSpotlightPromo({ ...spotlightPromo, title: e.target.value })}
                      placeholder="e.g. Coconut Oil"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">CTA Button Text</label>
                    <input
                      type="text"
                      value={spotlightPromo.buttonText || ''}
                      onChange={(e) => saveSpotlightPromo({ ...spotlightPromo, buttonText: e.target.value })}
                      placeholder="e.g. SHOP NOW"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Link Category</label>
                    <select
                      value={spotlightPromo.categorySlug || 'oils-and-ghee'}
                      onChange={(e) => saveSpotlightPromo({ ...spotlightPromo, categorySlug: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold outline-none focus:border-emerald-600"
                    >
                      <option value="">🎯 Scroll to Daily Deals</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat.slug} value={cat.slug}>
                          📁 {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Description / Bullet</label>
                    <input
                      type="text"
                      value={spotlightPromo.description || ''}
                      onChange={(e) => saveSpotlightPromo({ ...spotlightPromo, description: e.target.value })}
                      placeholder="e.g. Pure roasted & filtered Kerala coconut oil for authentic curries."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* 3. AI Image Studio Upload with Cutout (PNG), Packshot (#FFF) & Original */}
                <div className="mt-2">
                  <AiImageStudioUpload
                    currentImageUrl={spotlightPromo.image}
                    onImageChange={(newUrl) => {
                      saveSpotlightPromo({ ...spotlightPromo, image: newUrl });
                    }}
                    title="Promo Product Photo (AI Studio)"
                    subtitle="Auto-run AI background removal with Cutout (PNG), Packshot (#FFF) & Original views"
                    defaultMode="transparent"
                    compact
                  />
                </div>


              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: TOP FLASH ANNOUNCEMENT BAR                         */}
      {/* ========================================================= */}
      {activeTab === 'announcement' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <Flame className="w-5 h-5 text-rose-600" />
              <span>Top Flash Offer &amp; Moving Announcement Bar</span>
            </div>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              Top of Customer Website
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
              <input
                type="checkbox"
                checked={offerBanner.enabled}
                onChange={(e) => {
                  const updated = { ...offerBanner, enabled: e.target.checked };
                  setOfferBanner(updated);
                  updateOfferBanner(updated);
                  showSuccess('Top Announcement Banner visibility updated!');
                }}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
              />
              <span>Enable Top Animated Flash Offer Banner on Customer Storefront</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Badge Text (e.g. FLASH DEAL)</label>
                <input
                  type="text"
                  value={offerBanner.badgeText}
                  onChange={(e) => setOfferBanner({ ...offerBanner, badgeText: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium outline-none focus:border-emerald-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Message Text</label>
                <input
                  type="text"
                  value={offerBanner.text}
                  onChange={(e) => setOfferBanner({ ...offerBanner, text: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Link URL</label>
                <input
                  type="text"
                  value={offerBanner.linkUrl}
                  onChange={(e) => setOfferBanner({ ...offerBanner, linkUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Link Button Text</label>
                <input
                  type="text"
                  value={offerBanner.linkText}
                  onChange={(e) => setOfferBanner({ ...offerBanner, linkText: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Live Preview */}
            <div className="p-3 bg-slate-900 text-white rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="bg-rose-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full">
                  {offerBanner.badgeText || 'OFFER'}
                </span>
                <span className="font-medium text-slate-200">{offerBanner.text}</span>
              </div>
              <span className="text-amber-300 font-bold underline text-[11px] cursor-pointer">
                {offerBanner.linkText} →
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  updateOfferBanner(offerBanner);
                  showSuccess('Top Announcement Banner settings saved live!');
                }}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-2xs"
              >
                Save Announcement Banner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: SHOP BY CATEGORIES & CARD PHOTOS                   */}
      {/* ========================================================= */}
      {activeTab === 'categories' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <Leaf className="w-5 h-5 text-emerald-700" />
                <span>Shop by Categories &amp; Card Photos</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Upload custom photos for your category cards. All photos are rendered in pure white studio backgrounds.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {CATEGORIES.map((cat) => {
              const currentImg = categoryImages[cat.slug] || cat.imageUrl || '/categories/round-rice.jpg';
              const isCustom = Boolean(categoryImages[cat.slug]);

              return (
                <div key={cat.slug} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{cat.name}</span>
                    {isCustom ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">
                        Custom Upload
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-200 text-slate-600 font-medium px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>

                  {/* Circular Card Preview */}
                  <div className="flex justify-center py-2">
                    <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-slate-200 shadow-xs relative overflow-hidden aspect-square">
                      <Image
                        src={currentImg}
                        alt={cat.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  </div>

                  {/* Upload / AI Studio Action */}
                  <div className="space-y-1.5 pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setEditingCategory({ slug: cat.slug, name: cat.name, currentImg })}
                      className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>AI Studio Photo</span>
                    </button>

                    {isCustom && (
                      <button
                        type="button"
                        onClick={() => handleResetCategoryImage(cat.slug)}
                        className="w-full py-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset to Default</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CATEGORY PHOTO EDIT MODAL (WITH AI STUDIO) */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900">
                    Category Photo: {editingCategory.name}
                  </h3>
                  <p className="text-xs text-slate-500">Live AI background removal &amp; studio packshot</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <AiImageStudioUpload
              currentImageUrl={editingCategory.currentImg}
              onImageChange={(newUrl) => {
                setEditingCategory((prev) => prev ? { ...prev, currentImg: newUrl } : null);
              }}
              title="Category Visual"
              subtitle="Upload any photo to auto-remove background and create studio card visual"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = { ...categoryImages, [editingCategory.slug]: editingCategory.currentImg };
                  setCategoryImages(updated);
                  localStorage.setItem('kss_category_images', JSON.stringify(updated));
                  window.dispatchEvent(new Event('kss_category_images_updated'));
                  showSuccess(`Category photo updated for ${editingCategory.name}!`);
                  setEditingCategory(null);
                }}
                className="px-5 py-2 text-xs font-black text-white bg-emerald-700 hover:bg-emerald-600 rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Save Category Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SLIDE EDIT MODAL (FOR HERO BANNER SLIDES)                 */}
      {/* ========================================================= */}
      {editingSlide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
          <div className="bg-white rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[94vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm sm:text-base text-slate-900">
                  Edit Hero Banner Slide Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingSlide(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* LIVE REAL-TIME BANNER PREVIEW */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Live Banner Preview (Exact Storefront Look):
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Real-Time Sync
                </span>
              </div>

              {(() => {
                const bg = editingSlide.bgColor || '#064e3b';
                const isDark = editingSlide.textColor === 'light' || (!editingSlide.textColor && bg !== '#ffffff');
                const btn = editingSlide.accentColor || (isDark ? '#22c55e' : '#f97316');
                const currentImg = editingSlide.image;

                return (
                  <div 
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{ backgroundColor: bg }}
                    className="w-full rounded-2xl p-4 sm:p-5 border border-slate-200/40 shadow-inner flex flex-col justify-between relative overflow-hidden transition-colors duration-300 min-h-[210px] select-none"
                  >
                    {/* Top Seal Badge */}
                    <div className="absolute top-3 right-3 z-10 pointer-events-none">
                      <div className={`w-10 h-10 rounded-full border border-dashed p-0.5 backdrop-blur-xs flex items-center justify-center text-center ${
                        isDark ? 'border-emerald-300/80 bg-emerald-950/70 text-emerald-300' : 'border-[#5ea813] bg-white/90 text-[#5ea813]'
                      }`}>
                        <div className="text-[7px] font-black leading-none uppercase">100%<br/><span className="text-[5px]">NATURAL</span></div>
                      </div>
                    </div>

                    <div className="pr-12 pointer-events-none">
                      <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isDark ? 'text-emerald-300 bg-emerald-900/70 border border-emerald-400/30' : 'text-[#5ea813] bg-emerald-50'
                      }`}>
                        • {editingSlide.badge || 'New Season Batch'}
                      </span>
                    </div>

                    <div className="grid grid-cols-12 gap-2 items-center my-auto py-1">
                      <div className="col-span-7 space-y-1.5 text-left pointer-events-none z-10">
                        <div className={`font-black text-sm sm:text-base leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {editingSlide.titleMain} <span className={isDark ? 'text-amber-400' : 'text-[#f97316]'}>{editingSlide.sub}</span> <br/>
                          <span className={isDark ? 'text-white' : 'text-slate-950'}>{editingSlide.titleHighlight}</span>
                        </div>

                        {editingSlide.offerTag && (
                          <div className={`border-l-2 pl-1.5 text-[9px] font-black uppercase tracking-wider ${
                            isDark ? 'border-amber-400 text-amber-300' : 'border-[#f97316] text-[#f97316]'
                          }`}>
                            {editingSlide.offerTag}
                          </div>
                        )}

                        <p className={`text-[10px] line-clamp-1 ${isDark ? 'text-emerald-100/80' : 'text-slate-500'}`}>
                          {editingSlide.desc}
                        </p>

                        <div className="pt-0.5">
                          <span 
                            style={{ backgroundColor: btn }}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-white font-black text-[10px] uppercase shadow-xs"
                          >
                            <span>{editingSlide.cta || 'Shop now'}</span>
                            <span className="text-[10px]">→</span>
                          </span>
                        </div>
                      </div>

                      {/* Interactive Moveable & Zoomable Image Area */}
                      <div className="col-span-5 relative h-28 sm:h-32 flex items-center justify-end overflow-visible select-none">
                        {currentImg && (
                          <div 
                            onMouseDown={handleMouseDown}
                            onTouchStart={handleTouchStart}
                            style={{ 
                              transform: `translate(${editingSlide.imageX || 0}px, ${editingSlide.imageY || 0}px) scale(${(editingSlide.imageScale || 100) / 100})`,
                              cursor: isDragging ? 'grabbing' : 'grab',
                            }}
                            className={`relative w-full h-full transition-transform ${isDragging ? 'duration-0' : 'duration-150'} select-none touch-none group`}
                            title="Touch or Drag to position image, Pinch to zoom!"
                          >
                            <Image
                              src={currentImg}
                              alt="Preview"
                              fill
                              unoptimized
                              draggable={false}
                              className="object-contain object-right-center pointer-events-none"
                            />
                            <div className="absolute inset-0 border border-dashed border-amber-400/60 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none flex items-center justify-center transition-opacity">
                              <span className="bg-black/75 text-amber-300 text-[9px] font-black px-2 py-0.5 rounded shadow">
                                ✋ Drag to Move
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Interactive Floating On-Banner Zoom & Mobile Nudge Bar */}
                    <div 
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      className="flex flex-wrap items-center justify-between gap-2 text-[10px] pt-2 border-t border-white/15 text-white relative z-20"
                    >
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-white/80 flex items-center gap-1 font-bold text-[10px]">
                          <span>✋ Touch/Drag</span>
                          <span className="text-white/40">•</span>
                          <span>🤏 Pinch</span>
                        </span>
                        <span className="font-mono bg-black/60 px-2 py-0.5 rounded text-amber-300 font-bold border border-white/10 text-[9px]">
                          X: {editingSlide.imageX || 0}px | Y: {editingSlide.imageY || 0}px
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowSlideNudgePad(!showSlideNudgePad)}
                          className={`px-2 py-0.5 rounded-md font-bold text-[9px] cursor-pointer transition-colors border ${
                            showSlideNudgePad
                              ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs'
                              : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                          }`}
                          title="Toggle Directional Tap Buttons for Precise Mobile Adjustment"
                        >
                          🎯 Nudge Pad
                        </button>
                      </div>

                      {/* Integrated Zoom Controls right on the Preview */}
                      <div className="flex items-center gap-1.5 bg-black/80 px-2.5 py-1 rounded-xl border border-white/20 backdrop-blur-md shadow-lg">
                        <button
                          type="button"
                          onClick={() => zoomImage(-10)}
                          className="w-6 h-6 rounded-md bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-black text-sm cursor-pointer active:scale-95 transition-transform"
                          title="Zoom Out (-10%)"
                        >
                          -
                        </button>
                        <input
                          type="range"
                          min="40"
                          max="220"
                          step="5"
                          value={editingSlide.imageScale || 100}
                          onChange={(e) => setEditingSlide({ ...editingSlide, imageScale: Number(e.target.value) })}
                          className="w-20 sm:w-28 accent-amber-400 cursor-pointer h-2"
                          title="Zoom Slider"
                        />
                        <span className="font-mono text-amber-300 font-black w-10 text-center text-[10px]">
                          {editingSlide.imageScale || 100}%
                        </span>
                        <button
                          type="button"
                          onClick={() => zoomImage(10)}
                          className="w-6 h-6 rounded-md bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-black text-sm cursor-pointer active:scale-95 transition-transform"
                          title="Zoom In (+10%)"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={resetImagePositionAndZoom}
                          className="ml-1 px-2 py-1 rounded-md bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 text-[9px] font-bold border border-amber-400/30 cursor-pointer active:scale-95 transition-all"
                          title="Reset Position to Center & 100%"
                        >
                          <RotateCcw className="w-2.5 h-2.5 inline mr-0.5" />
                          Reset
                        </button>
                      </div>
                    </div>

                    {/* Optional Mobile Quick Nudge Directional Buttons */}
                    {showSlideNudgePad && (
                      <div 
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className="mt-2 p-2 rounded-xl border border-white/20 bg-black/85 text-white flex items-center justify-between gap-2 z-20"
                      >
                        <span className="text-[9px] font-bold text-amber-300">Tap to Nudge 5px:</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => nudgeImage(-5, 0)}
                            className="w-7 h-7 rounded-md bg-white/20 hover:bg-white/30 flex items-center justify-center font-black text-xs cursor-pointer active:scale-90"
                            title="Move Left"
                          >
                            ◀
                          </button>
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => nudgeImage(0, -5)}
                              className="w-7 h-3.5 rounded bg-white/20 hover:bg-white/30 flex items-center justify-center font-black text-[9px] cursor-pointer active:scale-90"
                              title="Move Up"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => nudgeImage(0, 5)}
                              className="w-7 h-3.5 rounded bg-white/20 hover:bg-white/30 flex items-center justify-center font-black text-[9px] cursor-pointer active:scale-90"
                              title="Move Down"
                            >
                              ▼
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => nudgeImage(5, 0)}
                            className="w-7 h-7 rounded-md bg-white/20 hover:bg-white/30 flex items-center justify-center font-black text-xs cursor-pointer active:scale-90"
                            title="Move Right"
                          >
                            ▶
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSlide((prev) => prev ? { ...prev, imageX: 0, imageY: 0 } : null)}
                            className="ml-1 px-2 py-1 rounded-md bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[9px] cursor-pointer active:scale-90"
                            title="Center Position"
                          >
                            Center
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <form onSubmit={handleSaveEditedSlide} className="space-y-4 text-xs">
              {/* Theme & Color Palettes */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="font-black text-slate-900 text-xs block">
                  🎨 Banner Background Theme &amp; Font Color
                </span>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-600">
                    Preset Supermarket Color Palette:
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[
                      { label: 'Deep Emerald', hex: '#064e3b', textColor: 'light' },
                      { label: 'Forest Green', hex: '#052e16', textColor: 'light' },
                      { label: 'Midnight Slate', hex: '#0f172a', textColor: 'light' },
                      { label: 'Warm Saffron', hex: '#78350f', textColor: 'light' },
                      { label: 'Royal Navy', hex: '#0c4a6e', textColor: 'light' },
                      { label: 'Clean White', hex: '#ffffff', textColor: 'dark' },
                    ].map((pal) => (
                      <button
                        key={pal.hex}
                        type="button"
                        onClick={() => setEditingSlide({
                          ...editingSlide,
                          bgColor: pal.hex,
                          textColor: pal.textColor as 'light' | 'dark'
                        })}
                        style={{ backgroundColor: pal.hex }}
                        className={`p-2 rounded-xl text-center font-bold text-[10px] cursor-pointer transition-all border ${
                          editingSlide.bgColor === pal.hex
                            ? 'ring-2 ring-emerald-500 scale-105 border-white shadow-md'
                            : 'border-slate-300 opacity-90 hover:opacity-100'
                        } ${pal.textColor === 'light' ? 'text-white' : 'text-slate-900'}`}
                      >
                        {pal.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Custom BG Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editingSlide.bgColor || '#064e3b'}
                        onChange={(e) => setEditingSlide({ ...editingSlide, bgColor: e.target.value })}
                        className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={editingSlide.bgColor || '#064e3b'}
                        onChange={(e) => setEditingSlide({ ...editingSlide, bgColor: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Font Text Style</label>
                    <select
                      value={editingSlide.textColor || 'light'}
                      onChange={(e) => setEditingSlide({ ...editingSlide, textColor: e.target.value as 'light' | 'dark' })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white text-xs"
                    >
                      <option value="light">⚪ White / Light Text (For Dark BG)</option>
                      <option value="dark">⚫ Slate / Dark Text (For Light BG)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Button Accent Color</label>
                    <select
                      value={editingSlide.accentColor || '#22c55e'}
                      onChange={(e) => setEditingSlide({ ...editingSlide, accentColor: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white text-xs"
                    >
                      <option value="#22c55e">🟢 Fresh Leaf Green</option>
                      <option value="#f97316">🟠 Vibrant Orange</option>
                      <option value="#eab308">🟡 Kerala Gold</option>
                      <option value="#e11d48">🔴 Crimson Rose</option>
                      <option value="#0284c7">🔵 Ocean Blue</option>
                    </select>
                  </div>
                </div>
              </div>

              <AiImageStudioUpload
                currentImageUrl={editingSlide.image}
                onImageChange={(newUrl) => {
                  setEditingSlide((prev) => (prev ? { ...prev, image: newUrl } : null));
                }}
                title="Slide Product Photo (AI Studio)"
                subtitle="AI background cutout (transparent PNG) or studio white packshot"
                defaultMode="transparent"
                compact
              />

              {/* Text Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Top Badge Text</label>
                  <input
                    type="text"
                    value={editingSlide.badge}
                    onChange={(e) => setEditingSlide({ ...editingSlide, badge: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium outline-none focus:border-emerald-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Special Offer Tag</label>
                  <input
                    type="text"
                    value={editingSlide.offerTag || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, offerTag: e.target.value })}
                    placeholder="e.g. FLAT 15% OFF THIS WEEK"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium outline-none focus:border-emerald-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Main Title First Part</label>
                  <input
                    type="text"
                    value={editingSlide.titleMain}
                    onChange={(e) => setEditingSlide({ ...editingSlide, titleMain: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold outline-none focus:border-emerald-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Title Sub Word</label>
                  <input
                    type="text"
                    value={editingSlide.sub}
                    onChange={(e) => setEditingSlide({ ...editingSlide, sub: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-amber-600 outline-none focus:border-emerald-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Title Highlight Second Line</label>
                  <input
                    type="text"
                    value={editingSlide.titleHighlight}
                    onChange={(e) => setEditingSlide({ ...editingSlide, titleHighlight: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold outline-none focus:border-emerald-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Button Call to Action</label>
                  <input
                    type="text"
                    value={editingSlide.cta}
                    onChange={(e) => setEditingSlide({ ...editingSlide, cta: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold outline-none focus:border-emerald-600 bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Description / Subtitle</label>
                  <input
                    type="text"
                    value={editingSlide.desc}
                    onChange={(e) => setEditingSlide({ ...editingSlide, desc: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium outline-none focus:border-emerald-600 bg-white"
                  />
                </div>
              </div>

              {/* Modal Action Buttons - Sticky on Mobile for effortless Save without scrolling */}
              <div className="sticky bottom-0 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 p-4 sm:p-5 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-between gap-2 z-30 rounded-b-3xl shadow-lg">
                <button
                  type="button"
                  onClick={() => setEditingSlide(null)}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors text-xs active:scale-95"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md cursor-pointer transition-all text-xs flex items-center gap-1.5 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Save Slide to Storefront</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
