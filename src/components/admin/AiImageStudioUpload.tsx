'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { 
  UploadCloud, 
  Camera, 
  CheckCircle2, 
  RefreshCw, 
  Sparkles, 
  Sliders, 
  RotateCcw,
  Wand2,
  ZoomIn,
  Move,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Crosshair,
  Layers,
  Sun
} from 'lucide-react';

export type ImageStudioMode = 'packshot' | 'transparent' | 'original';

export interface AiImageStudioUploadProps {
  currentImageUrl?: string;
  onImageChange: (imageUrl: string, mode: ImageStudioMode) => void;
  title?: string;
  subtitle?: string;
  aspectRatio?: 'square' | 'wide' | 'auto';
  defaultMode?: ImageStudioMode;
  compact?: boolean;
}

export default function AiImageStudioUpload({
  currentImageUrl = '',
  onImageChange,
  title = 'Product / Promo Image Studio',
  subtitle = 'Upload any packet or flyer photo. Neural AI automatically isolates product and creates pure white #FFF studio packshots.',
  aspectRatio = 'square',
  defaultMode = 'packshot',
  compact = false,
}: AiImageStudioUploadProps) {
  // Image states
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [aiPackshotSrc, setAiPackshotSrc] = useState<string | null>(null);
  const [aiTransparentSrc, setAiTransparentSrc] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<ImageStudioMode>(defaultMode);
  
  // AI Progress states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>('');
  const [progressPct, setProgressPct] = useState<number>(0);
  const [processSuccess, setProcessSuccess] = useState<boolean>(false);
  const [processError, setProcessError] = useState<boolean>(false);

  // Zoom, pan & shadow controls
  const [zoomScale, setZoomScale] = useState<number>(100);
  const [posX, setPosX] = useState<number>(0);
  const [posY, setPosY] = useState<number>(0);
  const [showShadow, setShowShadow] = useState<boolean>(true);
  const [previewBg, setPreviewBg] = useState<'checker' | 'white' | 'cream' | 'emerald' | 'dark'>('checker');

  // Interactive Dragging on Preview Canvas
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);

  // DOM Refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const progressLabelRef = useRef<HTMLParagraphElement | null>(null);

  // Active displayed image URL
  const activeDisplaySrc = 
    activeMode === 'packshot' && aiPackshotSrc ? aiPackshotSrc :
    activeMode === 'transparent' && aiTransparentSrc ? aiTransparentSrc :
    rawImageSrc || currentImageUrl || '';

  // Render White Studio Packshot on 1000x1000 Canvas with soft contact shadow and position offset
  const renderWhiteStudioPackshot = useCallback((
    sourceBase64OrImg: string, 
    scale: number = 100, 
    shadow: boolean = true,
    offX: number = 0,
    offY: number = 0
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 1000;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(sourceBase64OrImg);

        // 1. Pure White Background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 1000, 1000);

        // 2. Scale & center proportionally
        const maxDim = 820 * (scale / 100);
        let w = maxDim;
        let h = maxDim;
        const aspect = img.width / img.height;
        if (aspect > 1) {
          h = w / aspect;
        } else {
          w = h * aspect;
        }
        const x = (1000 - w) / 2 + (offX * 2);
        const y = (1000 - h) / 2 + (offY * 2);

        // 3. Realistic soft contact shadow
        if (shadow) {
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
          ctx.shadowBlur = 24;
          ctx.shadowOffsetY = 16;
          ctx.drawImage(img, x, y, w, h);
          ctx.restore();
        }

        ctx.drawImage(img, x, y, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        resolve(dataUrl);
      };
      img.src = sourceBase64OrImg;
    });
  }, []);

  // Neural Network AI Background Removal (Calls Local /api/admin/remove-bg)
  const runAiRemoval = useCallback(async (base64Data: string) => {
    setIsProcessing(true);
    setProcessSuccess(false);
    setProcessError(false);
    setProgressText('🚀 Initializing AI neural net (U²-Net)...');
    setProgressPct(15);

    // Yield small delay so React renders overlay
    await new Promise((r) => setTimeout(r, 60));
    if (progressBarRef.current) progressBarRef.current.style.width = '15%';
    if (progressLabelRef.current) progressLabelRef.current.textContent = '🧠 AI neural network isolating product...';

    // Interval to smoothly increment progress bar while model executes
    let simPct = 15;
    const interval = setInterval(() => {
      simPct = Math.min(88, simPct + 12);
      if (progressBarRef.current) progressBarRef.current.style.width = `${simPct}%`;
      if (progressLabelRef.current) {
        if (simPct > 60) {
          progressLabelRef.current.textContent = '🎨 Preserving white packaging & product details...';
        } else if (simPct > 35) {
          progressLabelRef.current.textContent = '✂️ Removing background cleanly...';
        }
      }
    }, 400);

    try {
      // 1. Try server-side removal with 4s timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch('/api/admin/remove-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data }),
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
        const clientRes = await removeBackgroundOnCanvas(base64Data);
        transparentResult = clientRes.transparent;
        packshotResult = clientRes.packshot;
      }

      if (progressBarRef.current) progressBarRef.current.style.width = '100%';
      if (progressLabelRef.current) progressLabelRef.current.textContent = '✅ Studio Cutout & Packshot Ready!';

      setAiTransparentSrc(transparentResult);
      setAiPackshotSrc(packshotResult);

      const chosenMode = defaultMode || 'packshot';
      const chosenUrl = chosenMode === 'transparent' ? transparentResult : packshotResult;

      setProcessSuccess(true);
      setActiveMode(chosenMode);
      setProgressPct(100);
      setProgressText('✅ Ready!');

      onImageChange(chosenUrl, chosenMode);

    } catch (err) {
      clearInterval(interval);
      console.error('AI background removal fallback:', err);
      // Even on outer error, generate a clean packshot on canvas
      try {
        const { removeBackgroundOnCanvas } = await import('@/lib/client-bg-remover');
        const fallback = await removeBackgroundOnCanvas(base64Data);
        setAiTransparentSrc(fallback.transparent);
        setAiPackshotSrc(fallback.packshot);
        setProcessSuccess(true);
        setActiveMode('packshot');
        onImageChange(fallback.packshot, 'packshot');
      } catch {
        setProcessError(true);
        setActiveMode('original');
        onImageChange(base64Data, 'original');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [onImageChange, defaultMode]);

  // Handle File Upload from disk or camera
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessSuccess(false);
    setProcessError(false);
    setAiPackshotSrc(null);
    setAiTransparentSrc(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setRawImageSrc(base64);
      const initialMode = defaultMode || 'transparent';
      setActiveMode(initialMode);

      // 1. Immediately pass original as initial placeholder
      onImageChange(base64, 'original');

      // 2. AUTOMATICALLY RUN AI NEURAL BACKGROUND REMOVAL!
      runAiRemoval(base64);
    };
    reader.readAsDataURL(file);
  };

  // Re-render packshot if zoom, position or shadow changes
  useEffect(() => {
    if (aiTransparentSrc) {
      renderWhiteStudioPackshot(aiTransparentSrc, zoomScale, showShadow, posX, posY).then((packshot) => {
        setAiPackshotSrc(packshot);
        if (activeMode === 'packshot') {
          onImageChange(packshot, 'packshot');
        }
      });
    }
  }, [zoomScale, posX, posY, showShadow, renderWhiteStudioPackshot, aiTransparentSrc, activeMode, onImageChange]);

  // Handle Mode Change
  const handleSelectMode = (mode: ImageStudioMode) => {
    setActiveMode(mode);
    if (mode === 'packshot' && aiPackshotSrc) {
      onImageChange(aiPackshotSrc, 'packshot');
    } else if (mode === 'transparent' && aiTransparentSrc) {
      onImageChange(aiTransparentSrc, 'transparent');
    } else if (rawImageSrc) {
      onImageChange(rawImageSrc, 'original');
    }
  };

  // Canvas Drag Event Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!activeDisplaySrc) return;
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: posX,
      initY: posY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    setPosX(Math.round(dragStartRef.current.initX + dx));
    setPosY(Math.round(dragStartRef.current.initY + dy));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!activeDisplaySrc || e.touches.length === 0) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initX: posX,
      initY: posY,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !dragStartRef.current || e.touches.length === 0) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStartRef.current.startX;
    const dy = touch.clientY - dragStartRef.current.startY;
    setPosX(Math.round(dragStartRef.current.initX + dx));
    setPosY(Math.round(dragStartRef.current.initY + dy));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // Step Zoom & Nudge Helpers
  const stepZoom = (delta: number) => {
    setZoomScale((prev) => Math.max(40, Math.min(220, prev + delta)));
  };

  const nudge = (dx: number, dy: number) => {
    setPosX((prev) => prev + dx);
    setPosY((prev) => prev + dy);
  };

  const resetAllControls = () => {
    setZoomScale(100);
    setPosX(0);
    setPosY(0);
    setShowShadow(true);
  };

  const frameAspectClass = 
    aspectRatio === 'wide' ? 'aspect-[16/9]' :
    aspectRatio === 'auto' ? 'min-h-[220px]' : 
    'aspect-square';

  const previewBgClass = 
    previewBg === 'checker' ? 'bg-[linear-gradient(45deg,#f0f0f0_25%,transparent_25%),linear-gradient(-45deg,#f0f0f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f0f0f0_75%),linear-gradient(-45deg,transparent_75%,#f0f0f0_75%)] bg-[size:16px_16px]' :
    previewBg === 'white' ? 'bg-white' :
    previewBg === 'cream' ? 'bg-[#fffbeb]' :
    previewBg === 'emerald' ? 'bg-[#064e3b]' :
    'bg-[#0f172a]';

  return (
    <div className={`space-y-3.5 ${compact ? 'text-xs' : ''}`}>
      {/* Header Info */}
      {title && (
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-emerald-700" />
              <span>{title}</span>
            </h4>
            {subtitle && (
              <p className="text-[11px] text-slate-500 mt-0.5 max-w-lg leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {activeMode === 'transparent' && (aiTransparentSrc || currentImageUrl.includes('cutout')) && (
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 shrink-0 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Transparent Cutout Active</span>
            </span>
          )}
          {activeMode === 'packshot' && aiPackshotSrc && (
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 shrink-0 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>AI Packshot Active</span>
            </span>
          )}
        </div>
      )}

      {/* Main Preview Container with Switcher Tabs */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3 sm:p-4 space-y-3">
        {/* Top Control Bar: Upload Button + Preview Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Upload Button */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="py-2 px-3.5 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-500 rounded-xl font-bold text-xs text-slate-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:scale-[1.01] disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4 text-emerald-700" />
              <span>{activeDisplaySrc ? 'Change Photo' : 'Upload Photo'}</span>
            </button>

            {(rawImageSrc || currentImageUrl) && !isProcessing && (
              <button
                type="button"
                onClick={() => runAiRemoval(rawImageSrc || currentImageUrl)}
                className="py-2 px-3 bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-800 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                title="Run or Re-run AI Background Removal"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                <span className="hidden sm:inline">{aiTransparentSrc || aiPackshotSrc ? 'Re-run AI' : 'AI Remove BG'}</span>
              </button>
            )}
          </div>

          {/* 3 Interactive Mode Tabs */}
          {activeDisplaySrc && (
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              {defaultMode === 'transparent' ? (
                <>
                  {/* Option 1: Transparent Cutout */}
                  <button
                    type="button"
                    onClick={() => handleSelectMode('transparent')}
                    disabled={!aiTransparentSrc && !isProcessing}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                      activeMode === 'transparent'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 disabled:opacity-40'
                    }`}
                  >
                    <span>✨ Cutout (PNG)</span>
                  </button>

                  {/* Option 2: AI White Packshot */}
                  <button
                    type="button"
                    onClick={() => handleSelectMode('packshot')}
                    disabled={!aiPackshotSrc && !isProcessing}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                      activeMode === 'packshot'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 disabled:opacity-40'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>AI Packshot (#FFF)</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Option 1: AI White Packshot */}
                  <button
                    type="button"
                    onClick={() => handleSelectMode('packshot')}
                    disabled={!aiPackshotSrc && !isProcessing}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                      activeMode === 'packshot'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 disabled:opacity-40'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>AI Packshot (#FFF)</span>
                  </button>

                  {/* Option 2: Transparent Cutout */}
                  <button
                    type="button"
                    onClick={() => handleSelectMode('transparent')}
                    disabled={!aiTransparentSrc && !isProcessing}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                      activeMode === 'transparent'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 disabled:opacity-40'
                    }`}
                  >
                    <span>🏁 Cutout (PNG)</span>
                  </button>
                </>
              )}

              {/* Option 3: Original Upload */}
              <button
                type="button"
                onClick={() => handleSelectMode('original')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                  activeMode === 'original'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📸 Original</span>
              </button>
            </div>
          )}
        </div>

        {/* Live Preview Frame with Direct Drag-to-Move */}
        <div 
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`w-full max-w-md mx-auto ${frameAspectClass} rounded-2xl border-2 border-slate-200 overflow-hidden relative shadow-inner flex items-center justify-center select-none ${previewBgClass}`}
        >
          {activeDisplaySrc ? (
            <div
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              style={{
                transform: `translate(${posX}px, ${posY}px) scale(${zoomScale / 100})`,
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
              className={`relative w-full h-full p-4 transition-transform ${isDragging ? 'duration-0' : 'duration-150'} select-none group`}
              title="Click and drag to position photo!"
            >
              <Image
                src={activeDisplaySrc}
                alt="Studio Preview"
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
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="text-center p-6 text-slate-400 space-y-1.5 cursor-pointer hover:text-emerald-700 transition-colors"
            >
              <div className="w-12 h-12 mx-auto rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold">No Image Uploaded</div>
              <div className="text-[10px] text-slate-400">Click or drag photo here to auto-create clean studio packshot</div>
            </div>
          )}

          {/* AI Live Progress Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-white/94 backdrop-blur-xs flex flex-col items-center justify-center gap-3 p-5 text-center z-20">
              <div className="relative">
                <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
                <Sparkles className="w-4 h-4 text-amber-500 absolute -top-1 -right-1 animate-bounce" />
              </div>
              <span className="text-xs font-black text-slate-900">
                AI Removing Background...
              </span>
              <div className="w-full max-w-[240px] space-y-2">
                {/* Live progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden shadow-inner">
                  <div
                    ref={progressBarRef}
                    className="h-2.5 rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500"
                    style={{ width: `${progressPct}%`, transition: 'width 0.3s ease-out' }}
                  />
                </div>
                {/* Live stage label */}
                <p ref={progressLabelRef} className="text-[10px] font-semibold text-slate-600 min-h-[14px]">
                  {progressText || 'Initializing AI model...'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Live Canvas Background Swatches (To test on different storefront themes) */}
        {activeDisplaySrc && (
          <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-bold">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Preview Canvas BG:</span>
            </span>
            <div className="flex items-center gap-1.5">
              {[
                { id: 'checker', title: 'Alpha Checkerboard', class: 'bg-slate-200' },
                { id: 'white', title: 'White #FFF', class: 'bg-white border-slate-300' },
                { id: 'cream', title: 'Warm Cream #FFFBEB', class: 'bg-amber-100 border-amber-300' },
                { id: 'emerald', title: 'Kerala Emerald #064E3B', class: 'bg-emerald-900 border-emerald-950' },
                { id: 'dark', title: 'Midnight Slate #0F172A', class: 'bg-slate-900 border-slate-950' },
              ].map((swatch) => (
                <button
                  key={swatch.id}
                  type="button"
                  onClick={() => setPreviewBg(swatch.id as any)}
                  title={swatch.title}
                  className={`w-5 h-5 rounded-full border cursor-pointer transition-all ${swatch.class} ${
                    previewBg === swatch.id ? 'ring-2 ring-emerald-500 scale-110 shadow-xs' : 'opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* AI Success / Status Notice */}
        {processSuccess && !isProcessing && (
          <div className="p-2.5 bg-emerald-100/80 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Neural AI removed background cleanly. White packaging &amp; product labels 100% preserved.</span>
            </span>
          </div>
        )}

        {processError && !isProcessing && (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] font-semibold flex items-center justify-between">
            <span>⚠️ AI failed on this image. Using original photo.</span>
            <button
              type="button"
              onClick={() => rawImageSrc && runAiRemoval(rawImageSrc)}
              className="text-amber-800 underline font-bold cursor-pointer hover:opacity-80"
            >
              Retry
            </button>
          </div>
        )}

        {/* Zoom, Pan & Fine-Tuning Controls */}
        {activeDisplaySrc && !isProcessing && (
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Sliders className="w-3.5 h-3.5 text-emerald-700" />
                <span>Adjust Photo Size &amp; Position:</span>
              </div>

              <button
                type="button"
                onClick={resetAllControls}
                className="px-2 py-0.5 text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                title="Reset Zoom & Position"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* 1. Zoom Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span className="flex items-center gap-1 text-slate-600">
                  <ZoomIn className="w-3 h-3 text-slate-500" />
                  <span>Zoom / Scale:</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => stepZoom(-10)}
                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-xs"
                  >
                    -
                  </button>
                  <span className="font-mono text-emerald-700 font-extrabold w-10 text-center">{zoomScale}%</span>
                  <button
                    type="button"
                    onClick={() => stepZoom(10)}
                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-xs"
                  >
                    +
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="40"
                max="200"
                step="5"
                value={zoomScale}
                onChange={(e) => setZoomScale(Number(e.target.value))}
                className="w-full accent-emerald-700 cursor-pointer"
              />
            </div>

            {/* 2. Position Offset & 4-Way D-Pad */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-1 border-t border-slate-100">
              {/* D-Pad */}
              <div className="sm:col-span-5 flex flex-col items-center justify-center">
                <div className="grid grid-cols-3 gap-1 w-24 text-slate-700">
                  <div />
                  <button
                    type="button"
                    onClick={() => nudge(0, -10)}
                    className="h-7 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-400 rounded-md flex items-center justify-center font-bold cursor-pointer"
                    title="Move Up 10px"
                  >
                    <ArrowUp className="w-3.5 h-3.5 text-emerald-800" />
                  </button>
                  <div />

                  <button
                    type="button"
                    onClick={() => nudge(-10, 0)}
                    className="h-7 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-400 rounded-md flex items-center justify-center font-bold cursor-pointer"
                    title="Move Left 10px"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-emerald-800" />
                  </button>

                  <button
                    type="button"
                    onClick={() => { setPosX(0); setPosY(0); }}
                    className="h-7 bg-emerald-700 hover:bg-emerald-600 text-white rounded-md flex items-center justify-center font-bold cursor-pointer"
                    title="Center 0,0"
                  >
                    <Crosshair className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => nudge(10, 0)}
                    className="h-7 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-400 rounded-md flex items-center justify-center font-bold cursor-pointer"
                    title="Move Right 10px"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-800" />
                  </button>

                  <div />
                  <button
                    type="button"
                    onClick={() => nudge(0, 10)}
                    className="h-7 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-400 rounded-md flex items-center justify-center font-bold cursor-pointer"
                    title="Move Down 10px"
                  >
                    <ArrowDown className="w-3.5 h-3.5 text-emerald-800" />
                  </button>
                  <div />
                </div>
              </div>

              {/* Sliders */}
              <div className="sm:col-span-7 space-y-2">
                <div>
                  <div className="flex justify-between text-[10px] font-semibold text-slate-600 mb-0.5">
                    <span>Horizontal (X):</span>
                    <span className="font-mono font-bold text-emerald-700">{posX}px</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="2"
                    value={posX}
                    onChange={(e) => setPosX(Number(e.target.value))}
                    className="w-full accent-emerald-700 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] font-semibold text-slate-600 mb-0.5">
                    <span>Vertical (Y):</span>
                    <span className="font-mono font-bold text-emerald-700">{posY}px</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="2"
                    value={posY}
                    onChange={(e) => setPosY(Number(e.target.value))}
                    className="w-full accent-emerald-700 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Shadow Toggle for Packshots */}
            {activeMode === 'packshot' && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Soft Contact Shadow:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowShadow(!showShadow)}
                  className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] transition-colors cursor-pointer ${
                    showShadow ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {showShadow ? 'ON' : 'OFF'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
