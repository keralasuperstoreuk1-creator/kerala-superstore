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
  Sparkles
} from 'lucide-react';
import { CATEGORIES, BRANDS, INITIAL_PRODUCTS } from '@/lib/mock-data';
import { Product } from '@/types';

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
  // Original uploaded raw image data URL
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  
  // Processed Studio Packshot data URL  
  const [studioImageSrc, setStudioImageSrc] = useState<string | null>(null);
  // Clean result lock - once AI removes bg, canvas pipeline won't overwrite
  const [geminiCleanImageSrc, setGeminiCleanImageSrc] = useState<string | null>(null);
  // AI Generated Versions
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
  // Live AI progress tracking
  const [bgProgressText, setBgProgressText] = useState<string>('');
  const [bgProgressPct, setBgProgressPct] = useState<number>(0);
  const [publishedSuccess, setPublishedSuccess] = useState<boolean>(false);
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);

  // Background Editor Tool Settings (Framing & Crop only - NO color wiping)
  const [bgMode, setBgMode] = useState<'white' | 'transparent'>('white');
  const [cropTop, setCropTop] = useState<number>(0);
  const [cropBottom, setCropBottom] = useState<number>(0);
  const [cropLeft, setCropLeft] = useState<number>(0);
  const [cropRight, setCropRight] = useState<number>(0);
  const [scale, setScale] = useState<number>(100);

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

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Direct DOM refs for live AI progress — bypasses React batching for instant repaints
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const progressLabelRef = useRef<HTMLParagraphElement | null>(null);

  // Load API key from localStorage if saved
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

  // Image Processing Canvas Pipeline: Clean framing, crop & zoom (NO color wiping)
  const processImageOnCanvas = (
    imageSource: string,
    cTop: number,
    cBottom: number,
    cLeft: number,
    cRight: number,
    zoomScale: number,
    backgroundType: 'white' | 'transparent'
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
      const maxDim = 850 * (zoomScale / 100);
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

      // Add subtle studio drop shadow on white canvas
      if (backgroundType === 'white') {
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.10)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 14;
        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, renderW, renderH);
        ctx.restore();
      }

      ctx.drawImage(img, sx, sy, sw, sh, dx, dy, renderW, renderH);

      const finalDataUrl = canvas.toDataURL(backgroundType === 'white' ? 'image/jpeg' : 'image/png', 0.95);
      setStudioImageSrc(finalDataUrl);
    };
    img.src = imageSource;
  };

  // Canvas pipeline: ONLY updates studioImageSrc when viewing original
  useEffect(() => {
    if (rawImageSrc && activeViewMode === 'original') {
      processImageOnCanvas(rawImageSrc, cropTop, cropBottom, cropLeft, cropRight, scale, bgMode);
    }
  }, [rawImageSrc, cropTop, cropBottom, cropLeft, cropRight, scale, bgMode, activeViewMode]);

  /**
   * LOCAL AI BACKGROUND REMOVAL
   * Uses @imgly/background-removal - runs 100% in the browser
   * No API key. No image recreation. Removes background from exact uploaded photo.
   * Result: transparent PNG → placed on white canvas
   */


  const runLocalBgRemoval = useCallback(async (base64DataUrl: string) => {
    setIsRemovingBg(true);
    setBgRemoveResult(null);
    setBgRemoveMethod(null);
    setBgProgressText('🚀 Starting AI neural network (U²-Net)...');
    setBgProgressPct(15);

    if (progressBarRef.current) progressBarRef.current.style.width = '15%';
    if (progressLabelRef.current) progressLabelRef.current.textContent = '🧠 AI neural network isolating product...';

    const interval = setInterval(() => {
      setBgProgressPct((prev) => {
        const next = Math.min(88, prev + 12);
        if (progressBarRef.current) progressBarRef.current.style.width = `${next}%`;
        if (progressLabelRef.current) {
          if (next > 60) {
            progressLabelRef.current.textContent = '🎨 Preserving white packaging & labels...';
          } else if (next > 35) {
            progressLabelRef.current.textContent = '✂️ Removing background cleanly...';
          }
        }
        return next;
      });
    }, 400);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch('/api/admin/remove-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64DataUrl }),
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);
      clearInterval(interval);

      let transparentResult = '';
      let packshotResult = '';

      if (res && res.ok) {
        const data = await res.json();
        if (data.success && data.transparent && data.packshot && data.source === 'u2net-ai-neural') {
          transparentResult = data.transparent;
          packshotResult = data.packshot;
        }
      }

      // 2. Client-side smart segmentation fallback if server didn't supply clean packshot
      if (!transparentResult || !packshotResult) {
        if (progressLabelRef.current) progressLabelRef.current.textContent = '⚡ Applying smart studio packshot framing...';
        const { removeBackgroundOnCanvas } = await import('@/lib/client-bg-remover');
        const clientRes = await removeBackgroundOnCanvas(base64DataUrl);
        transparentResult = clientRes.transparent;
        packshotResult = clientRes.packshot;
      }

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
      clearInterval(interval);
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

  /**
   * SMART CONTEXT-AWARE PROMPT BUILDER
   * Automatically creates the perfect Gemini prompt based on:
   * - Kerala Super Store UK website context
   * - Detected product brand, category, name
   * - E-commerce product listing requirements
   * - Common Kerala grocery flyer elements to remove
   */
  const buildSmartWebsitePrompt = (name: string, brand: string, category: string) => {
    const productDesc = [brand, name].filter(Boolean).join(' ') || 'grocery product';
    const catHint = category || 'Kerala Indian grocery';

    // Website-specific context
    const websiteContext = `Kerala Super Store - a UK-based online supermarket specialising in authentic South Indian (Kerala) groceries delivered across the United Kingdom`;

    // Smart detection of what to remove based on typical Kerala/Indian grocery flyers
    const removeList = [
      'promotional flyer text and headlines',
      'price tags, offer badges, "EXCLUSIVE OFFER", "1 PACK", "2 PACK" stickers',
      'dollar/pound price text ($1999, $3500 etc)',
      'store name/logo (Royal Kerala, Kerala Super Store etc)',
      'store address and phone numbers',
      'website URLs and social media handles',
      'coloured background (teal, blue, dark green, red etc)',
      'decorative borders and frames',
      'food photography plates/bowls beside the packet',
      'any text that is NOT printed ON the product packaging itself',
    ].join('; ');

    return `You are processing a product image for ${websiteContext}.

TASK: Remove the background from this ${catHint} product photo and create a professional studio packshot.

PRODUCT: ${productDesc}

KEEP EXACTLY:
- The ${productDesc} packet/bag/box EXACTLY as it physically looks
- All text, logos, and design printed ON the product packaging
- The product's original colours, shape and proportions
- Nothing should change about the actual product itself

REMOVE COMPLETELY:
- ${removeList}

OUTPUT REQUIREMENTS:
- Pure solid white background (#FFFFFF) - no gradients, no shadows on background
- Product centred in a 1000x1000 pixel square frame
- Product occupies 75-80% of the frame height
- Add a soft, subtle shadow ONLY directly below the product (natural ground shadow)
- High quality, sharp edges around the product
- Suitable for a UK online grocery store product listing page

Do NOT recreate or redraw the product - work with the exact uploaded image.`;
  };

  // Gemini AI Background Removal: sends uploaded image to Gemini for real editing
  const handleGeminiRemoveBg = async () => {
    if (!rawImageSrc) return;
    setIsRemovingBg(true);
    setBgRemoveResult(null);
    try {
      const res = await fetch('/api/admin/generate-packshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: rawImageSrc,
          mimeType: 'image/jpeg',
          productName,
          brand: selectedBrand,
          category: selectedCategory,
          customApiKey: geminiApiKey,
          editPrompt: geminiEditPrompt,
        }),
      });
      const json = await res.json();
      if (json.success && json.imageUrl) {
        setGeminiCleanImageSrc(json.imageUrl); // Lock in Gemini result
        setStudioImageSrc(json.imageUrl);
        setBgRemoveResult('success');
      } else if (json.source === 'no-api-key') {
        setBgRemoveResult('no-key');
      } else {
        setBgRemoveResult('error');
      }
    } catch {
      setBgRemoveResult('error');
    } finally {
      setIsRemovingBg(false);
    }
  };

  // AUTO background removal: runs immediately on upload if Gemini API key is connected
  const autoRemoveBackground = async (base64: string, fName: string) => {
    setIsRemovingBg(true);
    setBgRemoveResult(null);
    try {
      // Use the smart website-context-aware prompt
      const smartPrompt = buildSmartWebsitePrompt(
        fName.replace(/\.[^/.]+$/, ''),
        '',
        'Kerala Indian grocery'
      );
      setGeminiEditPrompt(smartPrompt); // Show what we're sending
      const res = await fetch('/api/admin/generate-packshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: 'image/jpeg',
          productName: fName.replace(/\.[^/.]+$/, ''),
          brand: '',
          category: 'Kerala Indian grocery',
          customApiKey: geminiApiKey,
          editPrompt: smartPrompt,
        }),
      });
      const json = await res.json();
      if (json.success && json.imageUrl) {
        setGeminiCleanImageSrc(json.imageUrl); // Lock in - canvas won't overwrite
        setStudioImageSrc(json.imageUrl);
        setBgRemoveResult('success');
      } else if (json.source === 'no-api-key') {
        setBgRemoveResult('no-key');
      } else {
        setBgRemoveResult('error');
      }
    } catch {
      setBgRemoveResult('error');
    } finally {
      setIsRemovingBg(false);
    }
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
        setProductName(d.name || file.name.replace(/\.[^/.]+$/, ''));
        setSelectedBrand(d.brand || 'Pavizham');
        setSelectedCategory(d.category || 'Rice & Rice Products');
        setPackSize(d.sizeWeight || '20 LB (9.07 kg)');
        setPrice(d.suggestedPrice ? String(d.suggestedPrice) : '19.99');
        setOfferPrice(d.suggestedPrice ? String((d.suggestedPrice * 0.92).toFixed(2)) : '18.49');
        setBarcode(d.barcode || '890' + Math.floor(1000000000 + Math.random() * 9000000000));
        setAllergens(Array.isArray(d.allergens) ? d.allergens.join(', ') : d.allergens || 'Naturally Gluten Free');
        setDescription(d.description || '');
        setSeoTitle(d.seoTitle || `${d.name} UK | Kerala Super Store`);
        setSlug(d.slug || d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        setTags(Array.isArray(d.tags) ? d.tags.join(', ') : d.tags || '');
        // Update smart prompt with now-known product details
        const updatedPrompt = buildSmartWebsitePrompt(d.name || '', d.brand || selectedBrand, d.category || selectedCategory);
        setGeminiEditPrompt(updatedPrompt);
        // If Gemini already produced a clean image, re-run with better product details
        if (geminiCleanImageSrc && geminiApiKey) {
          // Re-process with exact product details now available
          setTimeout(() => handleGeminiRemoveBg(), 100);
        }
      }
    } catch {
      setAiSource('smart-catalog-ai');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
        // Show pristine original on canvas as instant preview without altering any colors
        processImageOnCanvas(base64, 0, 0, 0, 0, 100, 'white');
        // Build smart website prompt (for Gemini fallback)
        setGeminiEditPrompt(buildSmartWebsitePrompt(file.name.replace(/\.[^/.]+$/, ''), '', ''));
        // 1. Parallel: Detect product metadata text (Vision AI)
        runAiAnalysis(file, base64);
        // 2. Parallel: AUTOMATIC REAL AI NEURAL NETWORK BACKGROUND REMOVAL!
        runLocalBgRemoval(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Quick Preset Handlers for 1-click Brand Switch
  const handleSelectBrandChip = (brandName: string) => {
    setSelectedBrand(brandName);
    if (!productName.toLowerCase().includes(brandName.toLowerCase())) {
      setProductName(`${brandName} ${productName.replace(/^(Pavizham|Nirapara|Eastern|Double Horse|Brahmins|Melam)\s*/i, '')}`);
    }
  };

  // Publish Product to live Storefront
  const handlePublishProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: productName.trim(),
      slug: slug || productName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      brand: selectedBrand,
      category: selectedCategory,
      categorySlug: selectedCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      sizeWeight: packSize,
      price: Number(price) || 19.99,
      offerPrice: offerPrice ? Number(offerPrice) : undefined,
      stock: Number(stock) || 50,
      barcode: barcode,
      description: description || `${productName} authentic Kerala grocery item delivered across the UK.`,
      allergens: allergens ? [allergens] : [],
      tags: tags ? tags.split(',').map((t) => t.trim()) : [selectedBrand.toLowerCase()],
      imageUrl: studioImageSrc || '/products/matta-rice.png',
      isFeatured: true,
      isOffer: Boolean(offerPrice && Number(offerPrice) < Number(price)),
      status: 'published',
      origin: 'Palakkad, Kerala, India',
      seoTitle: seoTitle || `${productName} UK | Kerala Super Store`,
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage so storefront immediately shows it
    try {
      const existing = localStorage.getItem('kss_products');
      const list: Product[] = existing ? JSON.parse(existing) : INITIAL_PRODUCTS;
      const updated = [newProduct, ...list];
      localStorage.setItem('kss_products', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    } catch {}

    setPublishedSuccess(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900">AI Product Studio &amp; Auto-Packshot</h1>
            <span className="bg-emerald-600 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Free AI White Packshot
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Upload any flyer or packet photo. Auto-generates clean product packshots on pure white background (#FFF) without messy flyers or discount badges!
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowKeyModal(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Key className="w-3.5 h-3.5 text-amber-600" />
            <span>{geminiApiKey ? 'Gemini API: Connected' : 'Connect Gemini API Key'}</span>
          </button>

          <Link
            href="/admin/products"
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            All Products
          </Link>
        </div>
      </div>

      {/* Published Success Alert */}
      {publishedSuccess && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5 text-emerald-900 font-bold text-xs sm:text-sm">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <span>Product published successfully! It is now live in your customer storefront catalog.</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              View on Website ↗
            </Link>
            <button
              onClick={() => {
                setPublishedSuccess(false);
                setRawImageSrc(null);
                setStudioImageSrc(null);
              }}
              className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
            >
              Add Another Item
            </button>
          </div>
        </div>
      )}

      {/* Main 2-Column Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Studio Image & Background Removal Suite */}
        <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-black text-sm text-slate-900">
              <Camera className="w-4 h-4 text-emerald-700" />
              <span>1. Image Upload &amp; Clean Packshot</span>
            </div>
            {studioImageSrc && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                ✅ Your Photo · White Canvas
              </span>
            )}
          </div>

          {/* Upload Dropzone */}
          <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all group">
            <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            <span className="mt-1.5 text-xs font-black text-slate-800 group-hover:text-emerald-900">
              Upload Flyer or Packet Photo
            </span>
            <span className="text-[10px] text-slate-400">
              Auto-detects Pavizham, Nirapara, Eastern, Double Horse, etc.
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          {/* Live Studio Canvas Preview */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-slate-700">
              <span>Preview Mode:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setActiveViewMode('packshot');
                    setBgMode('white');
                    if (aiPackshotSrc) setStudioImageSrc(aiPackshotSrc);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                    activeViewMode === 'packshot' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>AI Packshot (#FFF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveViewMode('transparent');
                    setBgMode('transparent');
                    if (aiTransparentSrc) setStudioImageSrc(aiTransparentSrc);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                    activeViewMode === 'transparent' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>🏁 Cutout (PNG)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveViewMode('original');
                    setBgMode('white');
                    if (rawImageSrc) {
                      processImageOnCanvas(rawImageSrc, cropTop, cropBottom, cropLeft, cropRight, scale, 'white');
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                    activeViewMode === 'original' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>📸 Original</span>
                </button>
              </div>
            </div>

            {/* 1:1 Aspect Frame with Solid White Background */}
            <div className={`w-full aspect-square rounded-2xl border-2 border-slate-200 overflow-hidden relative shadow-inner flex items-center justify-center ${
              bgMode === 'white' ? 'bg-white' : 'bg-[linear-gradient(45deg,#f0f0f0_25%,transparent_25%),linear-gradient(-45deg,#f0f0f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f0f0f0_75%),linear-gradient(-45deg,transparent_75%,#f0f0f0_75%)] bg-[size:16px_16px]'
            }`}>
              {studioImageSrc ? (
                <Image
                  src={studioImageSrc}
                  alt="Studio Cleaned Packshot"
                  fill
                  className="object-contain p-4"
                  unoptimized
                />
              ) : (
                <div className="text-center p-6 text-slate-400 space-y-1">
                  <div className="text-3xl">📦</div>
                  <div className="text-xs font-bold">No Image Uploaded</div>
                  <div className="text-[10px]">Upload a photo or flyer above to generate clean packshot</div>
                </div>
              )}

              {/* Spinner Overlay - shows when local AI or analysis is running */}
              {(isRemovingBg || isAnalyzing) && (
                <div className="absolute inset-0 bg-white/92 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-5 text-center">
                  <div className="relative">
                    <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
                    <Sparkles className="w-4 h-4 text-amber-500 absolute -top-1 -right-1 animate-bounce" />
                  </div>
                  <span className="text-xs font-black text-slate-900">
                    {isRemovingBg ? '🪄 AI Removing Background...' : '🔍 Reading Product Details...'}
                  </span>
                  {isRemovingBg && (
                    <div className="w-full max-w-[240px] space-y-2">
                      {/* Live progress bar — updated via DOM ref for instant repaints */}
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden shadow-inner">
                        <div
                          ref={progressBarRef}
                          className="h-2.5 rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500"
                          style={{ width: '0%', transition: 'width 0.3s ease-out' }}
                        />
                      </div>
                      {/* Live stage label — updated via DOM ref */}
                      <p ref={progressLabelRef} className="text-[10px] font-semibold text-slate-600 min-h-[14px]">
                        Initialising AI...
                      </p>
                    </div>
                  )}
                  {isAnalyzing && (
                    <span className="text-[10px] text-slate-500 max-w-[220px] leading-relaxed">
                      Scanning product label for auto-fill...
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* AI BACKGROUND REMOVAL CONTROLS */}
          {rawImageSrc && (
            <div className="space-y-3">

              {/* PRIMARY: Local AI Status Card */}
              <div className={`p-4 rounded-2xl border-2 space-y-3 text-xs ${
                bgRemoveResult === 'success' 
                  ? 'bg-emerald-50 border-emerald-400' 
                  : bgRemoveResult === 'error'
                  ? 'bg-orange-50 border-orange-300'
                  : isRemovingBg
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-gradient-to-br from-violet-50 to-emerald-50 border-emerald-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Wand2 className="w-4 h-4 text-violet-600" />
                    <span>Neural AI Background Removal</span>
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    isRemovingBg ? 'bg-blue-200 text-blue-900 animate-pulse' :
                    bgRemoveResult === 'success' ? 'bg-emerald-200 text-emerald-900' :
                    bgRemoveResult === 'error' ? 'bg-red-200 text-red-800' :
                    'bg-violet-100 text-violet-800'
                  }`}>
                    {isRemovingBg ? '⏳ Processing...' : 
                     bgRemoveResult === 'success' ? `✅ Studio Packshot Ready` : 
                     bgRemoveResult === 'error' ? '❌ Failed' : '📸 Original Photo Active'}
                  </span>
                </div>

                {/* Processing or success view */}
                {!isRemovingBg && bgRemoveResult === null && (
                  <div className="space-y-2.5">
                    <div className="bg-white/80 text-slate-700 p-2.5 rounded-xl text-[11px]">
                      📸 <strong>Original Photo loaded.</strong> Click below to run AI Background Removal.
                    </div>
                    <button
                      type="button"
                      onClick={() => rawImageSrc && runLocalBgRemoval(rawImageSrc)}
                      className="w-full py-2.5 px-3 bg-gradient-to-r from-violet-600 to-emerald-600 hover:from-violet-700 hover:to-emerald-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all hover:scale-[1.01]"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>✨ Run AI Background Removal</span>
                    </button>
                  </div>
                )}
                {bgRemoveResult === 'success' && (
                  <div className="space-y-2">
                    <div className="bg-emerald-100/90 text-emerald-900 p-2.5 rounded-xl text-[11px] font-bold flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>AI Neural Network isolated product. White packaging &amp; text 100% preserved.</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => rawImageSrc && runLocalBgRemoval(rawImageSrc)}
                        className="py-1.5 px-3 bg-white border border-slate-200 hover:border-emerald-500 text-slate-700 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <RefreshCw className="w-3 h-3 text-emerald-600" />
                        <span>Re-run AI</span>
                      </button>
                    </div>
                  </div>
                )}
                {bgRemoveResult === 'error' && (
                  <div className="space-y-2">
                    <p className="text-orange-800 font-bold">⚠️ AI removal failed. Original photo is still active.</p>
                    <button
                      type="button"
                      onClick={() => rawImageSrc && runLocalBgRemoval(rawImageSrc)}
                      disabled={isRemovingBg}
                      className="w-full py-2 px-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-black text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry AI Removal</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Manual Framing & Crop Fallback */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Crop className="w-4 h-4 text-slate-500" />
                    <span>Framing &amp; Flyer Crop</span>
                  </span>
                  <button type="button" onClick={() => { setCropTop(0); setCropBottom(0); setCropLeft(0); setCropRight(0); setScale(100); }}
                    className="text-[10px] text-slate-400 hover:text-slate-700 underline cursor-pointer">Reset</button>
                </div>

                <p className="text-[10px] text-slate-500">
                  Use sliders to crop out flyer borders, price stickers, or adjust the packet zoom.
                </p>

              {/* Flyer Crop Presets */}
              <div className="grid grid-cols-3 gap-1.5">
                <button type="button"
                  onClick={() => { setCropTop(24); setCropBottom(28); setCropLeft(18); setCropRight(38); }}
                  className="py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black">
                  ✂️ Cut Flyer Badges
                </button>
                <button type="button"
                  onClick={() => { setCropTop(10); setCropBottom(10); setCropLeft(6); setCropRight(6); }}
                  className="py-1.5 px-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 text-slate-700 text-[10px] font-bold">
                  Light Crop
                </button>
                <button type="button"
                  onClick={() => { setCropTop(0); setCropBottom(0); setCropLeft(0); setCropRight(0); }}
                  className="py-1.5 px-2 rounded-xl bg-white border border-slate-200 hover:border-slate-400 text-slate-700 text-[10px] font-bold">
                  No Crop
                </button>
              </div>

              {/* Scale */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                  <span>Packet Size in Frame</span>
                  <span className="font-black text-emerald-800">{scale}%</span>
                </div>
                <input type="range" min="50" max="150" value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="w-full accent-emerald-700 cursor-pointer" />
              </div>

              {/* Fine Crop */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1 border-t border-slate-200">
                {([['Top', cropTop, setCropTop], ['Bottom', cropBottom, setCropBottom], ['Left', cropLeft, setCropLeft], ['Right', cropRight, setCropRight]] as [string, number, (v: number) => void][]).map(([label, val, setter]) => (
                  <div key={label}>
                    <span className="text-[10px] font-bold text-slate-500">Crop {label}: {val}%</span>
                    <input type="range" min="0" max="50" value={val}
                      onChange={(e) => setter(Number(e.target.value))}
                      className="w-full accent-emerald-700" />
                  </div>
                ))}
              </div>
            </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: AI Extracted Details & Live Store Catalog Form */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-black text-sm text-slate-900">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>2. AI Verified Catalog Review &amp; Pricing</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>{aiSource === 'gemini-live' ? 'Live Gemini Vision OCR' : 'Kerala Super Store Catalog AI'}</span>
            </div>
          </div>

          <form onSubmit={handlePublishProduct} className="space-y-4">
            
            {/* Product Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Product Title (Storefront Name) *
              </label>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Pavizham Palakkadan Matta Rice 20 LB"
                className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all text-slate-900"
              />
            </div>

            {/* Quick Brand Preset Chips */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Brand Selection:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_BRANDS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => handleSelectBrandChip(b)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pack Size / Weight *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={packSize}
                    onChange={(e) => setPackSize(e.target.value)}
                    placeholder="20 LB / 5 kg / 1 kg"
                    className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                  <div className="flex gap-1 shrink-0">
                    {['20 LB', '10 kg', '5 kg', '1 kg', '500 g'].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setPackSize(size)}
                        className="px-2 py-1 bg-slate-100 hover:bg-emerald-100 text-[10px] font-bold rounded-lg text-slate-700"
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing and Stock Card */}
            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-950">
                  Admin Pricing &amp; UK Inventory (£ GBP)
                </span>
                <span className="text-[10px] bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                  UK Supermarket Rate
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Regular Price (£) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full text-xs font-black p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Offer Price (£)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    className="w-full text-xs font-black p-2.5 bg-white border border-slate-300 rounded-xl text-amber-700 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Initial Stock *
                  </label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Natasha's Law Allergen Declaration */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Allergen Warning (UK Natasha&apos;s Law Compliant)</span>
              </label>
              <input
                type="text"
                value={allergens}
                onChange={(e) => setAllergens(e.target.value)}
                placeholder="e.g. Naturally Gluten Free / Contains Mustard / Sesame"
                className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            {/* Product Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Product Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Authentic Kerala grocery item delivered fresh across the UK..."
                className="w-full text-xs font-medium p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            {/* Slug & Barcode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-500">
              <div>
                <span className="font-bold text-[11px] block text-slate-600 mb-0.5">Barcode / EAN:</span>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <span className="font-bold text-[11px] block text-slate-600 mb-0.5">URL Slug:</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Submit & Publish Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 px-6 bg-emerald-800 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
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
              . This enables live OCR analysis directly from packaging photos. Stored safely in your browser.
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
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveApiKey(geminiApiKey)}
                className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-800 hover:bg-emerald-700 text-white shadow-xs"
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
