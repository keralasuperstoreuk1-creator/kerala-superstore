'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  UploadCloud, 
  Camera, 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck,
  Crop,
  Wand2,
  Key,
  Sparkles,
  Search,
  Globe,
  Copy,
  Sliders,
  ZoomIn,
  Eye,
  Check,
  Layers,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  ChevronRight,
  ExternalLink,
  Plus
} from 'lucide-react';
import { CATEGORIES, INITIAL_PRODUCTS } from '@/lib/mock-data';
import { Product } from '@/types';
import InteractiveImageCropper from '@/components/admin/InteractiveImageCropper';

const POPULAR_BRANDS = [
  'Pavizham',
  'Nirapara',
  'Eastern',
  'Double Horse',
  'Brahmins',
  'Melam',
  'Grandmas',
  'KLF Coconad',
  'Bravo',
  'Kitchen Treasures',
  'Aachi',
  'Periyar'
];

export default function AIProductAddPage() {
  // Mobile step switcher: 'studio' (Image & Cutout) or 'details' (Product Form)
  const [mobileStep, setMobileStep] = useState<'studio' | 'details'>('studio');

  // Left studio sub-tab: 'studio' | 'crop' | 'google' | 'prompt'
  const [studioTab, setStudioTab] = useState<'studio' | 'crop' | 'google' | 'prompt'>('studio');

  // Image data URLs
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [studioImageSrc, setStudioImageSrc] = useState<string | null>(null);
  const [geminiCleanImageSrc, setGeminiCleanImageSrc] = useState<string | null>(null);
  const [aiPackshotSrc, setAiPackshotSrc] = useState<string | null>(null);
  const [aiTransparentSrc, setAiTransparentSrc] = useState<string | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<'packshot' | 'transparent' | 'original'>('packshot');
  
  // Processing & AI State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isRemovingBg, setIsRemovingBg] = useState<boolean>(false);
  const [bgRemoveMethod, setBgRemoveMethod] = useState<'local-ai' | 'gemini-api' | 'canvas' | null>(null);
  const [geminiEditPrompt, setGeminiEditPrompt] = useState<string>('');
  const [bgRemoveResult, setBgRemoveResult] = useState<'success' | 'no-key' | 'error' | null>(null);
  const [aiSource, setAiSource] = useState<'gemini-live' | 'smart-catalog-ai' | null>(null);
  const [bgProgressText, setBgProgressText] = useState<string>('');
  const [bgProgressPct, setBgProgressPct] = useState<number>(0);
  const [publishedSuccess, setPublishedSuccess] = useState<boolean>(false);
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);

  // Background Editor Tool Settings
  const [bgMode, setBgMode] = useState<'white' | 'transparent' | 'offwhite'>('white');
  const [cropTop, setCropTop] = useState<number>(0);
  const [cropBottom, setCropBottom] = useState<number>(0);
  const [cropLeft, setCropLeft] = useState<number>(0);
  const [cropRight, setCropRight] = useState<number>(0);
  const [scale, setScale] = useState<number>(100);
  const [showCropGuides, setShowCropGuides] = useState<boolean>(false);

  // Product Form Fields
  const [productName, setProductName] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('Pavizham');
  const [selectedCategory, setSelectedCategory] = useState<string>('Rice & Rice Products');
  const [packSize, setPackSize] = useState<string>('20 LB (9.07 kg)');
  const [price, setPrice] = useState<string>('19.99');
  const [offerPrice, setOfferPrice] = useState<string>('18.49');
  const [stock, setStock] = useState<string>('50');
  const [barcode, setBarcode] = useState<string>('8906001234567');
  const [allergens, setAllergens] = useState<string>('Naturally Gluten Free');
  const [description, setDescription] = useState<string>('');
  const [seoTitle, setSeoTitle] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  
  // Google Images Search
  const [isSearchingGoogle, setIsSearchingGoogle] = useState<boolean>(false);
  const [googleImageResults, setGoogleImageResults] = useState<Array<{ title: string; imageUrl: string; source?: string }>>([]);
  const [googleSearchQuery, setGoogleSearchQuery] = useState<string>('');
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const progressLabelRef = useRef<HTMLParagraphElement | null>(null);

  // Load API key from localStorage
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('kss_gemini_api_key');
      if (savedKey) setGeminiApiKey(savedKey);
    } catch {}
  }, []);

  const handleSaveApiKey = (key: string) => {
    setGeminiApiKey(key);
    try {
      localStorage.setItem('kss_gemini_api_key', key);
    } catch {}
    setShowKeyModal(false);
  };

  // Image Processing Canvas Pipeline: Clean framing, crop & zoom
  const processImageOnCanvas = useCallback((
    imageSource: string,
    cTop: number,
    cBottom: number,
    cLeft: number,
    cRight: number,
    zoomScale: number,
    backgroundType: 'white' | 'transparent' | 'offwhite'
  ) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current || document.createElement('canvas');
      const size = 1000;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Fill canvas background
      if (backgroundType === 'white') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
      } else if (backgroundType === 'offwhite') {
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(0, 0, size, size);
      } else {
        ctx.clearRect(0, 0, size, size);
      }

      // 2. Calculate crop coordinates from raw image
      const srcW = img.width;
      const srcH = img.height;
      const sx = (cLeft / 100) * srcW;
      const sy = (cTop / 100) * srcH;
      const sw = Math.max(1, srcW * (1 - (cLeft + cRight) / 100));
      const sh = Math.max(1, srcH * (1 - (cTop + cBottom) / 100));

      // 3. Draw onto 1000x1000 studio canvas (centered and scaled)
      const maxDim = 840 * (zoomScale / 100);
      let renderW = maxDim;
      let renderH = maxDim;
      const aspect = sw / sh;

      if (aspect > 1) {
        renderH = renderW / aspect;
      } else {
        renderW = renderH * aspect;
      }

      const dx = (size - renderW) / 2;
      const dy = (size - renderH) / 2;

      // Add subtle studio drop shadow on white/offwhite canvas
      if (backgroundType !== 'transparent') {
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 12;
        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, renderW, renderH);
        ctx.restore();
      }

      ctx.drawImage(img, sx, sy, sw, sh, dx, dy, renderW, renderH);

      const finalDataUrl = canvas.toDataURL(backgroundType === 'transparent' ? 'image/png' : 'image/jpeg', 0.95);
      setStudioImageSrc(finalDataUrl);
    };
    img.src = imageSource;
  }, []);

  const getCroppedImageBase64 = (
    imageSource: string,
    cTop: number,
    cBottom: number,
    cLeft: number,
    cRight: number
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const srcW = img.width;
        const srcH = img.height;
        const sx = (cLeft / 100) * srcW;
        const sy = (cTop / 100) * srcH;
        const sw = Math.max(10, srcW * (1 - (cLeft + cRight) / 100));
        const sh = Math.max(10, srcH * (1 - (cTop + cBottom) / 100));

        const canvas = document.createElement('canvas');
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(imageSource);

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.onerror = () => resolve(imageSource);
      img.src = imageSource;
    });
  };

  const handleApplyPresetAndRun = async (top: number, bottom: number, left: number, right: number) => {
    setCropTop(top);
    setCropBottom(bottom);
    setCropLeft(left);
    setCropRight(right);
    if (!rawImageSrc) return;
    // Update live preview immediately
    processImageOnCanvas(rawImageSrc, top, bottom, left, right, scale, bgMode);
    // Then run AI on cropped image
    const cropped = await getCroppedImageBase64(rawImageSrc, top, bottom, left, right);
    runLocalBgRemoval(cropped);
  };

  // Canvas pipeline: Immediately updates studioImageSrc whenever crop or scale changes in raw view
  useEffect(() => {
    if (!rawImageSrc || activeViewMode !== 'original') return;
    processImageOnCanvas(rawImageSrc, cropTop, cropBottom, cropLeft, cropRight, scale, bgMode);
  }, [rawImageSrc, cropTop, cropBottom, cropLeft, cropRight, scale, bgMode, activeViewMode, processImageOnCanvas]);

  // AI Background Removal
  const runLocalBgRemoval = useCallback(async (base64DataUrl: string) => {
    setIsRemovingBg(true);
    setBgRemoveResult(null);
    setBgRemoveMethod(null);
    setBgProgressText('🚀 Initializing Neural AI engine...');
    setBgProgressPct(15);

    try {
      const { removeBackgroundWithAi } = await import('@/lib/client-bg-remover');
      const result = await removeBackgroundWithAi(base64DataUrl, (msg, pct) => {
        setBgProgressText(msg);
        setBgProgressPct(pct);
        if (progressBarRef.current) progressBarRef.current.style.width = `${pct}%`;
        if (progressLabelRef.current) progressLabelRef.current.textContent = msg;
      });

      const transparentResult = result.transparent;
      const packshotResult = result.packshot;

      if (progressBarRef.current) progressBarRef.current.style.width = '100%';
      if (progressLabelRef.current) progressLabelRef.current.textContent = '✅ Studio Packshot Ready!';

      setAiTransparentSrc(transparentResult);
      setAiPackshotSrc(packshotResult);
      setGeminiCleanImageSrc(packshotResult);
      setStudioImageSrc(packshotResult);
      setActiveViewMode('packshot');
      setBgMode('white');
      setBgRemoveResult('success');
      setBgRemoveMethod('local-ai');
      setBgProgressPct(100);
      setBgProgressText('✅ Studio Packshot Ready!');

    } catch (err) {
      console.error('Local BG removal fallback:', err);
      try {
        const { removeBackgroundOnCanvas } = await import('@/lib/client-bg-remover');
        const fallback = await removeBackgroundOnCanvas(base64DataUrl);
        setAiTransparentSrc(fallback.transparent);
        setAiPackshotSrc(fallback.packshot);
        setGeminiCleanImageSrc(fallback.packshot);
        setStudioImageSrc(fallback.packshot);
        setActiveViewMode('packshot');
        setBgMode('white');
        setBgRemoveResult('success');
        setBgRemoveMethod('local-ai');
        setBgProgressPct(100);
        setBgProgressText('✅ Studio Packshot Ready!');
      } catch {
        setBgRemoveResult('error');
        setBgProgressText('');
        setBgProgressPct(0);
      }
    } finally {
      setIsRemovingBg(false);
    }
  }, []);

  const buildSmartWebsitePrompt = (name: string, brand: string, category: string) => {
    const productDesc = [brand, name].filter(Boolean).join(' ') || 'grocery product';
    const catHint = category || 'Kerala Indian grocery';
    const websiteContext = `Kerala Super Store - UK online supermarket in Manchester delivering authentic Kerala groceries`;

    return `Create a pure solid white studio packshot (#FFFFFF) for ${productDesc} (${catHint}) for ${websiteContext}.
Preserve exact packaging artwork, colors, and logos.
Remove flyer text, phone numbers, prices, and backgrounds.
Add subtle natural contact drop shadow directly below the packet.
Output square 1000x1000 pixel professional UK supermarket listing image.`;
  };

  // Run AI Vision / Metadata Detection
  const runAiAnalysis = async (file: File, base64: string) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/admin/ai-detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: file.type || 'image/jpeg',
          fileName: file.name,
          customApiKey: geminiApiKey,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        setAiSource(json.source);
        if (d.name) setProductName(d.name);
        if (d.brand) setSelectedBrand(d.brand);
        if (d.category) setSelectedCategory(d.category);
        if (d.sizeWeight) setPackSize(d.sizeWeight);
        if (d.suggestedPrice) {
          setPrice(String(d.suggestedPrice));
          setOfferPrice(String((d.suggestedPrice * 0.92).toFixed(2)));
        }
        if (d.barcode) setBarcode(d.barcode);
        if (d.allergens) setAllergens(Array.isArray(d.allergens) ? d.allergens.join(', ') : d.allergens);
        if (d.description) setDescription(d.description);
        if (d.seoTitle) setSeoTitle(d.seoTitle);
        if (d.slug) setSlug(d.slug);
        if (d.tags) setTags(Array.isArray(d.tags) ? d.tags.join(', ') : d.tags);

        const updatedPrompt = buildSmartWebsitePrompt(d.name || '', d.brand || selectedBrand, d.category || selectedCategory);
        setGeminiEditPrompt(updatedPrompt);
      }
    } catch {
      setAiSource('smart-catalog-ai');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleProcessUploadedFile = (file: File) => {
    setFileName(file.name);
    setBgRemoveResult(null);
    setBgRemoveMethod(null);
    setStudioImageSrc(null);
    setGeminiCleanImageSrc(null);
    setAiPackshotSrc(null);
    setAiTransparentSrc(null);
    setActiveViewMode('packshot');
    setBgMode('white');
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setRawImageSrc(base64);
      setStudioImageSrc(base64);
      processImageOnCanvas(base64, 0, 0, 0, 0, 100, 'white');
      setGeminiEditPrompt(buildSmartWebsitePrompt(file.name.replace(/\.[^/.]+$/, ''), '', ''));
      runAiAnalysis(file, base64);
      runLocalBgRemoval(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessUploadedFile(file);
  };

  const handleSelectBrandChip = (brandName: string) => {
    setSelectedBrand(brandName);
    if (!productName.toLowerCase().includes(brandName.toLowerCase())) {
      setProductName(`${brandName} ${productName.replace(/^(Pavizham|Nirapara|Eastern|Double Horse|Brahmins|Melam)\s*/i, '')}`.trim());
    }
  };

  // Google Images Search
  const handleSearchGoogleImages = async (customQ?: string) => {
    const q = (customQ || googleSearchQuery || `${selectedBrand} ${productName}`).trim();
    if (!q) return;
    setIsSearchingGoogle(true);
    setStudioTab('google');
    try {
      const res = await fetch(`/api/admin/search-images?name=${encodeURIComponent(productName || q)}&brand=${encodeURIComponent(selectedBrand || '')}&limit=8`);
      const data = await res.json();
      if (data.success && Array.isArray(data.images)) {
        setGoogleImageResults(data.images);
      }
    } catch (err) {
      console.error('Failed to search Google images:', err);
    } finally {
      setIsSearchingGoogle(false);
    }
  };

  const handleSelectGoogleImage = (imgUrl: string) => {
    setStudioImageSrc(imgUrl);
    setGeminiCleanImageSrc(imgUrl);
    setRawImageSrc(imgUrl);
    setActiveViewMode('packshot');
    setStudioTab('studio');
  };

  // Publish Product to live Storefront
  const handlePublishProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;

    const cleanBrand = selectedBrand || 'Kerala Superstore';
    const cleanName = productName.trim();
    const cleanSlug = slug || `${cleanBrand}-${cleanName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const cleanSeoTitle = seoTitle || `${cleanName} (${packSize || ''}) | Buy Online UK | Kerala Superstore Manchester`.trim();
    const cleanSeoDesc = description.trim() 
      ? `${description.trim()} Fast UK nationwide delivery with Cash on Delivery.`
      : `Buy authentic ${cleanName} (${packSize || 'Kerala Grocery'}). Fast delivery across Manchester & UK nationwide from Kerala Superstore.`;
    const defaultSeoTags = [
      cleanBrand.toLowerCase(),
      selectedCategory.toLowerCase(),
      'kerala groceries uk',
      'manchester grocery',
      'authentic south indian food',
    ];
    const finalTags = tags 
      ? Array.from(new Set([...tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean), ...defaultSeoTags]))
      : defaultSeoTags;

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: cleanName,
      slug: cleanSlug,
      brand: cleanBrand,
      category: selectedCategory,
      categorySlug: selectedCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      sizeWeight: packSize,
      price: Number(price) || 19.99,
      offerPrice: offerPrice ? Number(offerPrice) : undefined,
      stock: Number(stock) || 50,
      barcode: barcode,
      description: description || `${cleanName} authentic Kerala grocery staple delivered fresh across the UK.`,
      allergens: allergens ? [allergens] : [],
      tags: finalTags,
      imageUrl: studioImageSrc || '/products/matta-rice.png',
      isFeatured: true,
      isOffer: Boolean(offerPrice && Number(offerPrice) < Number(price)),
      status: 'published',
      origin: 'Palakkad, Kerala, India',
      seoTitle: cleanSeoTitle,
      seoDescription: cleanSeoDesc,
      createdAt: new Date().toISOString(),
    };

    try {
      const existing = localStorage.getItem('kss_products');
      const list: Product[] = existing ? JSON.parse(existing) : INITIAL_PRODUCTS;
      const updated = [newProduct, ...list];
      localStorage.setItem('kss_products', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('kss_products_updated'));
    } catch {}

    try {
      fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: newProduct }),
      }).catch(() => {});
    } catch {}

    setPublishedSuccess(true);
  };

  // Switch display mode
  const handleSetViewMode = (mode: 'packshot' | 'transparent' | 'original') => {
    setActiveViewMode(mode);
    if (mode === 'packshot') {
      setBgMode('white');
      if (aiPackshotSrc) {
        setStudioImageSrc(aiPackshotSrc);
      } else if (rawImageSrc) {
        processImageOnCanvas(rawImageSrc, cropTop, cropBottom, cropLeft, cropRight, scale, 'white');
      }
    } else if (mode === 'transparent') {
      setBgMode('transparent');
      if (aiTransparentSrc) {
        setStudioImageSrc(aiTransparentSrc);
      } else if (rawImageSrc) {
        processImageOnCanvas(rawImageSrc, cropTop, cropBottom, cropLeft, cropRight, scale, 'transparent');
      }
    } else {
      setBgMode('white');
      if (rawImageSrc) {
        processImageOnCanvas(rawImageSrc, cropTop, cropBottom, cropLeft, cropRight, scale, 'white');
      }
    }
  };

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden">
      
      {/* Hidden File Inputs for Browse & Mobile Camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Top Header Bar: Compact, zero wasted height */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-3 z-10 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-slate-900 truncate">
                AI Product Studio
              </h1>
              <span className="hidden sm:inline-block bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                Free White Packshot
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate hidden md:block">
              Auto background removal &amp; studio packshot generation for UK catalog
            </p>
          </div>
        </div>

        {/* Mobile Step Segmented Switcher (Visible only on mobile) */}
        <div className="flex lg:hidden items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setMobileStep('studio')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              mobileStep === 'studio' 
                ? 'bg-white text-emerald-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-emerald-700" />
            <span>1. Photo</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileStep('details')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              mobileStep === 'details' 
                ? 'bg-white text-emerald-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-700" />
            <span>2. Details</span>
            {price && <span className="text-[10px] text-emerald-700 font-bold">£{offerPrice || price}</span>}
          </button>
        </div>

        {/* Right Action Icons (API key modal + Catalog) */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowKeyModal(true)}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Google Gemini Vision API Key"
          >
            <Key className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[11px]">{geminiApiKey ? 'Gemini: Active' : 'Gemini Key'}</span>
          </button>

          <Link
            href="/admin/products"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            All Products
          </Link>
        </div>
      </div>

      {/* Published Success Alert Banner */}
      {publishedSuccess && (
        <div className="shrink-0 mx-4 mt-2 p-3 bg-emerald-50 border border-emerald-400 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Product published successfully to customer storefront!</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg shadow-xs flex items-center gap-1"
            >
              <span>View Store</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <button
              onClick={() => {
                setPublishedSuccess(false);
                setRawImageSrc(null);
                setStudioImageSrc(null);
                setProductName('');
              }}
              className="px-3 py-1 bg-white border border-slate-300 text-slate-700 text-[11px] font-bold rounded-lg cursor-pointer"
            >
              Add Another
            </button>
          </div>
        </div>
      )}

      {/* Main Fitted 2-Column Split Body */}
      <div className="flex-1 min-h-0 p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 overflow-hidden">
        
        {/* LEFT COLUMN: STUDIO, LIVE CROP & BACKGROUND REMOVAL */}
        <div className={`lg:col-span-5 h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden ${
          mobileStep === 'details' ? 'hidden lg:flex' : 'flex'
        }`}>
          
          {/* Studio Sub-tabs Header */}
          <div className="shrink-0 bg-slate-50 border-b border-slate-200 px-3 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setStudioTab('studio')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  studioTab === 'studio' 
                    ? 'bg-white text-emerald-900 border border-slate-200 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-emerald-700" />
                <span>Packshot</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setStudioTab('crop');
                  setShowCropGuides(true);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  studioTab === 'crop' 
                    ? 'bg-white text-emerald-900 border border-slate-200 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Crop className="w-3.5 h-3.5 text-violet-600" />
                <span>Live Crop</span>
                {(cropTop > 0 || cropBottom > 0 || cropLeft > 0 || cropRight > 0) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setStudioTab('google')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  studioTab === 'google' 
                    ? 'bg-white text-blue-900 border border-slate-200 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => setStudioTab('prompt')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  studioTab === 'prompt' 
                    ? 'bg-white text-purple-900 border border-slate-200 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="AI Studio Prompt"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden sm:inline">Prompt</span>
              </button>
            </div>

            {/* Upload & Mobile Camera Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                title="Take photo using mobile camera"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                <span>Camera</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              >
                <UploadCloud className="w-3.5 h-3.5 text-emerald-300" />
                <span>Upload</span>
              </button>
            </div>
          </div>

          {/* Canvas & Live Preview Viewport */}
          <div className="flex-1 min-h-0 relative flex flex-col items-center justify-center p-2.5 sm:p-3 bg-slate-100/70 overflow-hidden">
            
            {/* View Mode Pills (Floating overlay at top of canvas - visible only in Packshot mode) */}
            {studioTab !== 'crop' && (
              <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20 pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-1 bg-white/90 backdrop-blur-md p-1 rounded-xl border border-slate-200/90 shadow-xs">
                  <button
                    type="button"
                    onClick={() => handleSetViewMode('packshot')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                      activeViewMode === 'packshot' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>AI Packshot</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetViewMode('transparent')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                      activeViewMode === 'transparent' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Cutout (PNG)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetViewMode('original')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                      activeViewMode === 'original' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Original</span>
                  </button>
                </div>

                {/* Status Badge */}
                {bgRemoveResult === 'success' && (
                  <div className="bg-emerald-100/90 border border-emerald-300 text-emerald-800 text-[10px] font-extrabold px-2 py-1 rounded-xl shadow-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                    <span className="hidden sm:inline">Studio Clean</span>
                  </div>
                )}
              </div>
            )}

            {/* If Crop Tab is active: Render Interactive Corner Cropper */}
            {studioTab === 'crop' && (rawImageSrc || studioImageSrc) ? (
              <div className="w-full h-full flex flex-col items-center justify-center max-w-[340px]">
                <InteractiveImageCropper
                  imageSrc={rawImageSrc || studioImageSrc || ''}
                  crop={{ top: cropTop, bottom: cropBottom, left: cropLeft, right: cropRight }}
                  onChange={(newCrop) => {
                    setCropTop(newCrop.top);
                    setCropBottom(newCrop.bottom);
                    setCropLeft(newCrop.left);
                    setCropRight(newCrop.right);
                    if (rawImageSrc) {
                      processImageOnCanvas(rawImageSrc, newCrop.top, newCrop.bottom, newCrop.left, newCrop.right, scale, bgMode);
                    }
                  }}
                  onApply={async () => {
                    if (!rawImageSrc) return;
                    const cropped = await getCroppedImageBase64(rawImageSrc, cropTop, cropBottom, cropLeft, cropRight);
                    runLocalBgRemoval(cropped);
                    setStudioTab('studio');
                  }}
                  onReset={() => {
                    setCropTop(0);
                    setCropBottom(0);
                    setCropLeft(0);
                    setCropRight(0);
                    if (rawImageSrc) processImageOnCanvas(rawImageSrc, 0, 0, 0, 0, scale, bgMode);
                  }}
                />
              </div>
            ) : (
              /* The Standard Packshot Preview Container */
              <div className={`relative w-full max-w-[340px] aspect-square rounded-2xl border-2 border-slate-200 overflow-hidden shadow-inner flex items-center justify-center transition-all ${
                bgMode === 'white' 
                  ? 'bg-white' 
                  : bgMode === 'offwhite'
                  ? 'bg-slate-50'
                  : 'bg-[linear-gradient(45deg,#f0f0f0_25%,transparent_25%),linear-gradient(-45deg,#f0f0f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f0f0f0_75%),linear-gradient(-45deg,transparent_75%,#f0f0f0_75%)] bg-[size:16px_16px]'
              }`}>
                {studioImageSrc ? (
                  <Image
                    src={studioImageSrc}
                    alt="Product Studio Packshot"
                    fill
                    className="object-contain p-2"
                    unoptimized
                  />
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-center p-6 text-slate-400 space-y-2 cursor-pointer hover:text-emerald-700 transition-colors"
                  >
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-2xl shadow-xs">
                      📸
                    </div>
                    <div className="text-xs font-bold text-slate-700">Tap to Upload or Snap Photo</div>
                    <div className="text-[10px] text-slate-400 max-w-[200px] mx-auto">
                      Take a photo of any grocery flyer or packet on your shelf
                    </div>
                  </div>
                )}

                {/* Live Neural Progress Card (Floating bottom banner) */}
                {(isRemovingBg || isAnalyzing) && (
                  <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl rounded-xl p-2.5 z-30 space-y-1 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <RefreshCw className="w-3 h-3 text-emerald-600 animate-spin" />
                        <span>{isRemovingBg ? '🪄 Neural AI Isolating Product...' : '🔍 Scanning Label Details...'}</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold">
                        {bgProgressPct}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        ref={progressBarRef}
                        className="h-1.5 rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500 transition-all duration-300"
                        style={{ width: `${bgProgressPct}%` }}
                      />
                    </div>
                    <p ref={progressLabelRef} className="text-[9px] text-slate-500 truncate">
                      {bgProgressText || 'Processing image...'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Controls Panel (Switches with active tab, compact height) */}
          <div className="shrink-0 bg-white border-t border-slate-200 p-2.5 space-y-2">
            
            {/* TAB 1: STUDIO CONTROLS */}
            {studioTab === 'studio' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => rawImageSrc && runLocalBgRemoval(rawImageSrc)}
                      disabled={isRemovingBg || !rawImageSrc}
                      className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-emerald-600 hover:from-violet-700 hover:to-emerald-700 disabled:opacity-50 text-white rounded-xl font-black text-[11px] flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{bgRemoveResult === 'success' ? 'Re-run AI BG Removal' : 'Run AI BG Removal'}</span>
                    </button>
                    
                    {/* Background Tone Selector */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => { setBgMode('white'); handleSetViewMode('packshot'); }}
                        className={`w-5 h-5 rounded-md border text-[9px] font-bold flex items-center justify-center transition-all ${
                          bgMode === 'white' ? 'bg-white border-emerald-600 shadow-xs text-emerald-700' : 'bg-white border-slate-300 text-transparent'
                        }`}
                        title="Pure White #FFF"
                      >
                        W
                      </button>
                      <button
                        type="button"
                        onClick={() => { setBgMode('offwhite'); handleSetViewMode('packshot'); }}
                        className={`w-5 h-5 rounded-md border text-[9px] font-bold flex items-center justify-center transition-all ${
                          bgMode === 'offwhite' ? 'bg-slate-100 border-emerald-600 shadow-xs text-emerald-700' : 'bg-slate-100 border-slate-300 text-transparent'
                        }`}
                        title="Off-White Studio"
                      >
                        S
                      </button>
                      <button
                        type="button"
                        onClick={() => { setBgMode('transparent'); handleSetViewMode('transparent'); }}
                        className={`w-5 h-5 rounded-md border text-[9px] font-bold flex items-center justify-center transition-all ${
                          bgMode === 'transparent' ? 'bg-slate-200 border-emerald-600 shadow-xs text-emerald-700' : 'bg-slate-200 border-slate-300 text-transparent'
                        }`}
                        title="Transparent Cutout"
                      >
                        T
                      </button>
                    </div>
                  </div>

                  {/* Switch to interactive corner cropper button */}
                  <button
                    type="button"
                    onClick={() => setStudioTab('crop')}
                    className="px-2.5 py-1 bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-800 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                  >
                    <Crop className="w-3.5 h-3.5 text-violet-600" />
                    <span>Corner Cropper</span>
                  </button>
                </div>

                {/* 1-Tap Crop Preset Quick Chips */}
                <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleApplyPresetAndRun(28, 48, 18, 18)}
                    className="py-1 px-1.5 bg-slate-50 hover:bg-violet-50 hover:border-violet-300 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 text-center truncate cursor-pointer transition-colors"
                  >
                    📱 Screenshot
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetAndRun(20, 24, 15, 20)}
                    className="py-1 px-1.5 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 text-center truncate cursor-pointer transition-colors"
                  >
                    ✂️ Flyer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetAndRun(15, 15, 15, 15)}
                    className="py-1 px-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 text-center truncate cursor-pointer transition-colors"
                  >
                    🔲 1:1 Box
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetAndRun(0, 0, 0, 0)}
                    className="py-1 px-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 text-center truncate cursor-pointer transition-colors"
                  >
                    🔄 Full
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: LIVE CROP CONTROLS */}
            {studioTab === 'crop' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-slate-800">
                  <span className="flex items-center gap-1.5 text-emerald-800">
                    <Crop className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Touch &amp; Drag Crop Box Corners</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setCropTop(0); setCropBottom(0); setCropLeft(0); setCropRight(0); setScale(100); }}
                      className="text-[10px] text-slate-400 hover:text-slate-700 underline cursor-pointer"
                    >
                      Reset All
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudioTab('studio')}
                      className="text-[11px] font-bold text-white bg-emerald-800 hover:bg-emerald-700 px-3 py-1 rounded-xl cursor-pointer shadow-xs transition-colors"
                    >
                      Done Cropping
                    </button>
                  </div>
                </div>

                {/* Packet Frame Zoom */}
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <ZoomIn className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-[10px] font-bold text-slate-600 shrink-0">Scale Packet in Frame:</span>
                  <input
                    type="range"
                    min="60"
                    max="140"
                    value={scale}
                    onChange={(e) => {
                      const s = Number(e.target.value);
                      setScale(s);
                      if (rawImageSrc) processImageOnCanvas(rawImageSrc, cropTop, cropBottom, cropLeft, cropRight, s, bgMode);
                    }}
                    className="w-full h-1 accent-emerald-700 cursor-pointer"
                  />
                  <span className="text-[10px] font-bold text-emerald-800 w-8 text-right">{scale}%</span>
                </div>
              </div>
            )}

            {/* TAB 3: GOOGLE IMAGES FINDER */}
            {studioTab === 'google' && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={googleSearchQuery || `${selectedBrand} ${productName}`.trim()}
                    onChange={(e) => setGoogleSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchGoogleImages(e.currentTarget.value);
                      }
                    }}
                    placeholder="Search brand & product (e.g. Nirapara Matta Rice 5kg)"
                    className="flex-1 text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleSearchGoogleImages()}
                    disabled={isSearchingGoogle}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    {isSearchingGoogle ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    <span>Search</span>
                  </button>
                </div>

                {googleImageResults.length > 0 && (
                  <div className="grid grid-cols-4 gap-1.5 max-h-28 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                    {googleImageResults.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectGoogleImage(img.imageUrl)}
                        className="group relative aspect-square rounded-lg border border-slate-200 hover:border-emerald-500 overflow-hidden bg-white p-0.5 flex items-center justify-center transition-all cursor-pointer"
                        title={img.title}
                      >
                        <img
                          src={img.imageUrl}
                          alt={img.title}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: AI PROMPT */}
            {studioTab === 'prompt' && (
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-[11px]">AI Packshot Prompt:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const effectivePrompt = geminiEditPrompt || buildSmartWebsitePrompt(productName || 'Kerala Grocery Item', selectedBrand, selectedCategory);
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(effectivePrompt);
                        setCopiedPrompt(true);
                        setTimeout(() => setCopiedPrompt(false), 2000);
                      }
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                      copiedPrompt ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {copiedPrompt ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPrompt ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="bg-slate-900 text-slate-200 p-2 rounded-xl font-mono text-[9px] leading-relaxed max-h-20 overflow-y-auto whitespace-pre-wrap select-all">
                  {geminiEditPrompt || buildSmartWebsitePrompt(productName || 'Kerala Grocery Item', selectedBrand, selectedCategory)}
                </div>
              </div>
            )}

          </div>

          {/* Mobile Step 1 Next Button (Only visible on mobile when in Step 1) */}
          <div className="lg:hidden shrink-0 p-3 bg-emerald-50 border-t border-emerald-200 flex items-center justify-between">
            <div className="text-xs font-bold text-emerald-900">
              Photo ready? Proceed to details
            </div>
            <button
              type="button"
              onClick={() => setMobileStep('details')}
              className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Next: Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: CATALOG REVIEW & PRICING FORM */}
        <div className={`lg:col-span-7 h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden ${
          mobileStep === 'studio' ? 'hidden lg:flex' : 'flex'
        }`}>
          
          {/* Form Header */}
          <div className="shrink-0 bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span className="font-black text-xs sm:text-sm text-slate-900">
                2. AI Verified Catalog Review &amp; Pricing
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3 text-emerald-700" />
              <span>{aiSource === 'gemini-live' ? 'Gemini OCR' : 'Kerala Super Store AI'}</span>
            </div>
          </div>

          {/* Form Scrollable Body: Fits perfectly without page scrolling */}
          <form onSubmit={handlePublishProduct} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              
              {/* Product Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Product Title (Storefront Name) *
                </label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Pavizham Palakkadan Matta Rice (Long Grain Vadi)"
                  className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all text-slate-900"
                />
              </div>

              {/* Brand Selector: Compact horizontal chip bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Brand: <span className="text-emerald-700 font-black">{selectedBrand}</span>
                  </label>
                </div>
                <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                  {POPULAR_BRANDS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => handleSelectBrandChip(b)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                        selectedBrand.toLowerCase() === b.toLowerCase()
                          ? 'bg-emerald-800 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category and Pack Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Pack Size / Weight *
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      required
                      value={packSize}
                      onChange={(e) => setPackSize(e.target.value)}
                      placeholder="20 LB / 5 kg"
                      className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                    <div className="flex gap-1 shrink-0">
                      {['20 LB', '10 kg', '5 kg', '1 kg'].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setPackSize(size)}
                          className="px-1.5 py-1 bg-slate-100 hover:bg-emerald-100 text-[9px] font-bold rounded-lg text-slate-700"
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing & Stock Card (High density, high contrast) */}
              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-black text-emerald-950">
                    Admin Pricing &amp; UK Inventory (£ GBP)
                  </span>
                  <span className="text-[9px] bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                    UK Supermarket Rate
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Regular Price (£) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full text-xs font-black p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Offer Price (£)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                      className="w-full text-xs font-black p-2 bg-white border border-slate-300 rounded-lg text-amber-700 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Initial Stock *
                    </label>
                    <input
                      type="number"
                      required
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Natasha's Law Allergen Declaration */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Allergen Warning (UK Natasha&apos;s Law Compliant)</span>
                </label>
                <input
                  type="text"
                  value={allergens}
                  onChange={(e) => setAllergens(e.target.value)}
                  placeholder="e.g. Naturally Gluten Free / Contains Mustard / Sesame"
                  className="w-full text-xs font-semibold p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              {/* Product Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Product Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Authentic Pavizham Palakkadan Matta Rice parboiled in pure water..."
                  className="w-full text-xs font-medium p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden resize-none"
                />
              </div>

              {/* Slug & Barcode */}
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div>
                  <span className="font-bold text-[10px] block text-slate-600 mb-0.5">Barcode / EAN:</span>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px]"
                  />
                </div>
                <div>
                  <span className="font-bold text-[10px] block text-slate-600 mb-0.5">URL Slug:</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px]"
                  />
                </div>
              </div>

            </div>

            {/* Bottom Fixed Action Footer */}
            <div className="shrink-0 p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
              {/* Mobile Back Button (Only on mobile) */}
              <button
                type="button"
                onClick={() => setMobileStep('studio')}
                className="lg:hidden px-3 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Photo</span>
              </button>

              {/* Publish Button */}
              <button
                type="submit"
                className="flex-1 py-3 px-5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Publish Product to Storefront (£{offerPrice || price})</span>
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Gemini API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                <Key className="w-4 h-4 text-amber-600" />
                <span>Connect Google Gemini Vision API</span>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Enter your free Google Gemini API key from{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 underline font-bold"
              >
                aistudio.google.com
              </a>
              . This enables OCR analysis directly from packaging photos. Stored safely in your browser.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Gemini API Key:
              </label>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveApiKey(geminiApiKey)}
                className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-800 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
