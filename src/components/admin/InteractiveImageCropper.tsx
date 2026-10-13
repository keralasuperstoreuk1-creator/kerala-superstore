'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Move, Check, RotateCcw, Smartphone, Scissors, Square, Maximize2 } from 'lucide-react';

export interface CropMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface InteractiveImageCropperProps {
  imageSrc: string;
  crop: CropMargins;
  onChange: (newCrop: CropMargins) => void;
  onApply?: () => void;
  onReset?: () => void;
}

type DragHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e' | 'move';

export default function InteractiveImageCropper({
  imageSrc,
  crop,
  onChange,
  onApply,
  onReset,
}: InteractiveImageCropperProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeHandle, setActiveHandle] = useState<DragHandle | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Drag state refs to avoid closure stalls during rapid pointer moves
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    startCrop: CropMargins;
    handle: DragHandle;
  } | null>(null);

  const handlePointerDown = (e: React.PointerEvent, handle: DragHandle) => {
    e.preventDefault();
    e.stopPropagation();

    // Capture pointer so dragging outside the element still tracks smoothly
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    setActiveHandle(handle);
    setIsDragging(true);

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startCrop: { ...crop },
      handle,
    };
  };

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStartRef.current || !containerRef.current) return;

    const { startX, startY, startCrop, handle } = dragStartRef.current;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Convert pixel delta into percentage (0 - 100)
    const dx = ((e.clientX - startX) / rect.width) * 100;
    const dy = ((e.clientY - startY) / rect.height) * 100;

    let { top, bottom, left, right } = startCrop;

    const MIN_SIZE = 12; // Minimum crop box size in %

    if (handle === 'nw') {
      top = Math.max(0, Math.min(100 - startCrop.bottom - MIN_SIZE, startCrop.top + dy));
      left = Math.max(0, Math.min(100 - startCrop.right - MIN_SIZE, startCrop.left + dx));
    } else if (handle === 'ne') {
      top = Math.max(0, Math.min(100 - startCrop.bottom - MIN_SIZE, startCrop.top + dy));
      right = Math.max(0, Math.min(100 - startCrop.left - MIN_SIZE, startCrop.right - dx));
    } else if (handle === 'sw') {
      bottom = Math.max(0, Math.min(100 - startCrop.top - MIN_SIZE, startCrop.bottom - dy));
      left = Math.max(0, Math.min(100 - startCrop.right - MIN_SIZE, startCrop.left + dx));
    } else if (handle === 'se') {
      bottom = Math.max(0, Math.min(100 - startCrop.top - MIN_SIZE, startCrop.bottom - dy));
      right = Math.max(0, Math.min(100 - startCrop.left - MIN_SIZE, startCrop.right - dx));
    } else if (handle === 'n') {
      top = Math.max(0, Math.min(100 - startCrop.bottom - MIN_SIZE, startCrop.top + dy));
    } else if (handle === 's') {
      bottom = Math.max(0, Math.min(100 - startCrop.top - MIN_SIZE, startCrop.bottom - dy));
    } else if (handle === 'w') {
      left = Math.max(0, Math.min(100 - startCrop.right - MIN_SIZE, startCrop.left + dx));
    } else if (handle === 'e') {
      right = Math.max(0, Math.min(100 - startCrop.left - MIN_SIZE, startCrop.right - dx));
    } else if (handle === 'move') {
      const curW = 100 - (startCrop.left + startCrop.right);
      const curH = 100 - (startCrop.top + startCrop.bottom);

      const targetLeft = Math.max(0, Math.min(100 - curW, startCrop.left + dx));
      left = targetLeft;
      right = 100 - curW - targetLeft;

      const targetTop = Math.max(0, Math.min(100 - curH, startCrop.top + dy));
      top = targetTop;
      bottom = 100 - curH - targetTop;
    }

    onChange({
      top: Math.round(top * 10) / 10,
      bottom: Math.round(bottom * 10) / 10,
      left: Math.round(left * 10) / 10,
      right: Math.round(right * 10) / 10,
    });
  }, [onChange]);

  const handlePointerUp = (e: React.PointerEvent) => {
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    dragStartRef.current = null;
    setActiveHandle(null);
    setIsDragging(false);
  };

  // Preset Handlers
  const handlePreset = (t: number, b: number, l: number, r: number) => {
    onChange({ top: t, bottom: b, left: l, right: r });
  };

  return (
    <div className="w-full h-full flex flex-col justify-between select-none">
      
      {/* Interactive Crop Viewport Canvas Area */}
      <div 
        ref={containerRef}
        onPointerMove={handlePointerMove}
        className="relative w-full aspect-square max-h-[320px] sm:max-h-[350px] mx-auto rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center touch-none shadow-inner"
        style={{ touchAction: 'none' }}
      >
        {/* Background Image being cropped */}
        <img
          src={imageSrc}
          alt="Original for Cropping"
          className="w-full h-full object-contain pointer-events-none select-none"
          draggable={false}
        />

        {/* 4 Shaded Mask Panels outside the Crop Box */}
        {/* Top mask */}
        <div 
          className="absolute top-0 inset-x-0 bg-black/65 backdrop-blur-[0.5px] pointer-events-none transition-[height] duration-75"
          style={{ height: `${crop.top}%` }}
        />
        {/* Bottom mask */}
        <div 
          className="absolute bottom-0 inset-x-0 bg-black/65 backdrop-blur-[0.5px] pointer-events-none transition-[height] duration-75"
          style={{ height: `${crop.bottom}%` }}
        />
        {/* Left mask */}
        <div 
          className="absolute left-0 bg-black/65 backdrop-blur-[0.5px] pointer-events-none transition-[width] duration-75"
          style={{ 
            top: `${crop.top}%`, 
            bottom: `${crop.bottom}%`, 
            width: `${crop.left}%` 
          }}
        />
        {/* Right mask */}
        <div 
          className="absolute right-0 bg-black/65 backdrop-blur-[0.5px] pointer-events-none transition-[width] duration-75"
          style={{ 
            top: `${crop.top}%`, 
            bottom: `${crop.bottom}%`, 
            width: `${crop.right}%` 
          }}
        />

        {/* ACTIVE CROP BOX */}
        <div 
          className="absolute border-2 border-emerald-400 shadow-[0_0_0_1px_rgba(0,0,0,0.5)] z-20 cursor-move transition-all duration-75"
          style={{
            top: `${crop.top}%`,
            bottom: `${crop.bottom}%`,
            left: `${crop.left}%`,
            right: `${crop.right}%`,
          }}
          onPointerDown={(e) => handlePointerDown(e, 'move')}
          onPointerUp={handlePointerUp}
        >
          {/* Rule of Thirds Grid (Active while dragging) */}
          <div className={`absolute inset-0 pointer-events-none transition-opacity duration-200 ${
            isDragging ? 'opacity-70' : 'opacity-25'
          }`}>
            <div className="w-full h-full grid grid-cols-3 grid-rows-3">
              <div className="border-r border-b border-emerald-300/40" />
              <div className="border-r border-b border-emerald-300/40" />
              <div className="border-b border-emerald-300/40" />
              <div className="border-r border-b border-emerald-300/40" />
              <div className="border-r border-b border-emerald-300/40" />
              <div className="border-b border-emerald-300/40" />
              <div className="border-r border-emerald-300/40" />
              <div className="border-r border-emerald-300/40" />
              <div />
            </div>
          </div>

          {/* Move Indicator badge in center */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`px-2 py-1 rounded-full bg-slate-900/80 text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-xs transition-opacity ${
              isDragging ? 'opacity-90 scale-105' : 'opacity-0'
            }`}>
              <Move className="w-3 h-3 text-emerald-400" />
              <span>Drag to Pan</span>
            </div>
          </div>

          {/* 4 CORNER HANDLES (Large touch zones for mobile fingers) */}
          {/* Top-Left Corner (NW) */}
          <div
            className="absolute -top-3 -left-3 w-8 h-8 flex items-start justify-start cursor-nwse-resize touch-none z-30 group"
            onPointerDown={(e) => handlePointerDown(e, 'nw')}
            onPointerUp={handlePointerUp}
          >
            <div className="w-4 h-4 border-t-3 border-l-3 border-emerald-400 bg-white shadow-md rounded-tl-sm transition-transform group-active:scale-125" />
          </div>

          {/* Top-Right Corner (NE) */}
          <div
            className="absolute -top-3 -right-3 w-8 h-8 flex items-start justify-end cursor-nesw-resize touch-none z-30 group"
            onPointerDown={(e) => handlePointerDown(e, 'ne')}
            onPointerUp={handlePointerUp}
          >
            <div className="w-4 h-4 border-t-3 border-r-3 border-emerald-400 bg-white shadow-md rounded-tr-sm transition-transform group-active:scale-125" />
          </div>

          {/* Bottom-Left Corner (SW) */}
          <div
            className="absolute -bottom-3 -left-3 w-8 h-8 flex items-end justify-start cursor-nesw-resize touch-none z-30 group"
            onPointerDown={(e) => handlePointerDown(e, 'sw')}
            onPointerUp={handlePointerUp}
          >
            <div className="w-4 h-4 border-b-3 border-l-3 border-emerald-400 bg-white shadow-md rounded-bl-sm transition-transform group-active:scale-125" />
          </div>

          {/* Bottom-Right Corner (SE) */}
          <div
            className="absolute -bottom-3 -right-3 w-8 h-8 flex items-end justify-end cursor-nwse-resize touch-none z-30 group"
            onPointerDown={(e) => handlePointerDown(e, 'se')}
            onPointerUp={handlePointerUp}
          >
            <div className="w-4 h-4 border-b-3 border-r-3 border-emerald-400 bg-white shadow-md rounded-br-sm transition-transform group-active:scale-125" />
          </div>

          {/* 4 MIDPOINT EDGE HANDLES */}
          {/* Top Edge (N) */}
          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-5 flex items-center justify-center cursor-ns-resize touch-none z-30"
            onPointerDown={(e) => handlePointerDown(e, 'n')}
            onPointerUp={handlePointerUp}
          >
            <div className="w-5 h-1.5 bg-emerald-400 border border-white rounded-full shadow-xs" />
          </div>

          {/* Bottom Edge (S) */}
          <div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-5 flex items-center justify-center cursor-ns-resize touch-none z-30"
            onPointerDown={(e) => handlePointerDown(e, 's')}
            onPointerUp={handlePointerUp}
          >
            <div className="w-5 h-1.5 bg-emerald-400 border border-white rounded-full shadow-xs" />
          </div>

          {/* Left Edge (W) */}
          <div
            className="absolute top-1/2 -left-2 -translate-y-1/2 w-5 h-8 flex items-center justify-center cursor-ew-resize touch-none z-30"
            onPointerDown={(e) => handlePointerDown(e, 'w')}
            onPointerUp={handlePointerUp}
          >
            <div className="w-1.5 h-5 bg-emerald-400 border border-white rounded-full shadow-xs" />
          </div>

          {/* Right Edge (E) */}
          <div
            className="absolute top-1/2 -right-2 -translate-y-1/2 w-5 h-8 flex items-center justify-center cursor-ew-resize touch-none z-30"
            onPointerDown={(e) => handlePointerDown(e, 'e')}
            onPointerUp={handlePointerUp}
          >
            <div className="w-1.5 h-5 bg-emerald-400 border border-white rounded-full shadow-xs" />
          </div>
        </div>
      </div>

      {/* QUICK PRESETS & ACTIONS BAR */}
      <div className="mt-2 space-y-2">
        
        {/* Preset Buttons */}
        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => handlePreset(28, 48, 18, 18)}
            className="py-1 px-2 rounded-xl bg-slate-100 hover:bg-emerald-50 border border-slate-200 text-slate-700 hover:text-emerald-900 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <Smartphone className="w-3 h-3 text-emerald-700" />
            <span>Phone</span>
          </button>
          
          <button
            type="button"
            onClick={() => handlePreset(20, 24, 15, 20)}
            className="py-1 px-2 rounded-xl bg-slate-100 hover:bg-emerald-50 border border-slate-200 text-slate-700 hover:text-emerald-900 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <Scissors className="w-3 h-3 text-emerald-700" />
            <span>Flyer</span>
          </button>

          <button
            type="button"
            onClick={() => handlePreset(15, 15, 15, 15)}
            className="py-1 px-2 rounded-xl bg-slate-100 hover:bg-emerald-50 border border-slate-200 text-slate-700 hover:text-emerald-900 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <Square className="w-3 h-3 text-emerald-700" />
            <span>1:1 Box</span>
          </button>

          <button
            type="button"
            onClick={() => handlePreset(0, 0, 0, 0)}
            className="py-1 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        {/* Live Corner Feedback / Values */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium px-1">
          <span>
            Box: <strong className="text-slate-800">{Math.round(100 - crop.left - crop.right)}%</strong> × <strong className="text-slate-800">{Math.round(100 - crop.top - crop.bottom)}%</strong>
          </span>
          <span className="text-emerald-700 font-bold">
            💡 Drag corners or edges on the photo
          </span>
        </div>

        {/* Apply Crop Button */}
        {onApply && (
          <button
            type="button"
            onClick={onApply}
            className="w-full py-2 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-[0.99]"
          >
            <Check className="w-4 h-4 text-emerald-300" />
            <span>Apply Crop &amp; Re-run AI Packshot</span>
          </button>
        )}
      </div>

    </div>
  );
}
