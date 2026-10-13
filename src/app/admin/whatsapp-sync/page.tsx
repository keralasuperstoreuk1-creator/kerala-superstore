'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Camera, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Sparkles, 
  ArrowRight, 
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Layers,
  FileText
} from 'lucide-react';

interface MatchedImageItem {
  file?: File;
  previewUrl: string;
  originalName: string;
  matchedProductId?: string;
  matchedProductName?: string;
  status: 'matched' | 'unmatched' | 'synced';
}

export default function WhatsAppSyncPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'console' | 'google'>('upload');
  const [jsonInput, setJsonInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Auto Google Search state
  const [isSearchingGoogle, setIsSearchingGoogle] = useState(false);
  const [googleSearchCount, setGoogleSearchCount] = useState(50);
  const [googleResults, setGoogleResults] = useState<string | null>(null);

  // Image files drop state
  const [dragActive, setDragActive] = useState(false);
  const [matchedItems, setMatchedItems] = useState<MatchedImageItem[]>([]);
  const [dbProducts, setDbProducts] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    // Load products from DB for client-side fuzzy matching
    fetch('/api/products?limit=5000')
      .then(res => res.json())
      .then(data => {
        if (data.products && Array.isArray(data.products)) {
          setDbProducts(data.products.map((p: any) => ({ id: p.id, name: p.name })));
        }
      })
      .catch(() => {});
  }, []);

  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

  // Handle files selected from computer
  const handleFiles = (files: FileList) => {
    const list: MatchedImageItem[] = [];
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const preview = URL.createObjectURL(file);
      const cleanFile = normalize(file.name.replace(/\.[^/.]+$/, ''));
      const fileWords = cleanFile.split(' ').filter(w => w.length > 2);

      let bestMatch: any = null;
      let highestScore = 0;

      for (const prod of dbProducts) {
        const cleanProd = normalize(prod.name);
        if (cleanProd === cleanFile) {
          bestMatch = prod;
          highestScore = 100;
          break;
        }
        const prodWords = new Set(cleanProd.split(' '));
        const common = fileWords.filter(w => prodWords.has(w));
        if (common.length >= 2 && common.length > highestScore) {
          highestScore = common.length;
          bestMatch = prod;
        }
      }

      list.push({
        file,
        previewUrl: preview,
        originalName: file.name,
        matchedProductId: bestMatch?.id,
        matchedProductName: bestMatch?.name,
        status: bestMatch ? 'matched' : 'unmatched'
      });
    });

    setMatchedItems(prev => [...prev, ...list]);
  };

  // Submit JSON from WhatsApp Web Console
  const handleSyncJson = async () => {
    if (!jsonInput.trim()) return;
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const parsed = JSON.parse(jsonInput.trim());
      const res = await fetch('/api/admin/whatsapp-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `Success! Successfully matched and updated ${data.updatedCount} product images in Supabase! Prices and stock remain 100% untouched.`
        });
        setJsonInput('');
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Failed to sync images'
        });
      }
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Invalid JSON format. Please ensure you copied the complete array from WhatsApp Web Console.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyScriptToClipboard = () => {
    const script = `(() => {
  const items = [];
  document.querySelectorAll('div[role="listitem"], div[tabindex="0"]').forEach(el => {
    const img = el.querySelector('img')?.src;
    const titleEl = el.querySelector('span[title], div[title], h2, span');
    const title = titleEl ? (titleEl.getAttribute('title') || titleEl.innerText) : '';
    if (img && img.startsWith('http') && title && title.trim().length > 2) {
      if (!items.some(i => i.name === title.trim())) {
        items.push({ name: title.trim(), imageUrl: img });
      }
    }
  });
  console.log(JSON.stringify(items));
  copy(JSON.stringify(items));
  alert('Copied ' + items.length + ' catalog images to clipboard! Now paste it into Kerala Superstore Admin.');
})();`;
    navigator.clipboard.writeText(script);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-emerald-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <Camera className="w-3.5 h-3.5" />
              <span>WhatsApp &amp; UK Computer Packshot Sync</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Import Authentic Product Images
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Connect your authentic packaging photos directly from your WhatsApp catalog or UK store computer folder. 
              <strong className="text-emerald-400 font-bold block mt-1">
                🔒 Strict Protection: Only `image_url` is updated. Prices and stock from your RetailV2 POS computer are never changed!
              </strong>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <Link
              href="/admin/products"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold backdrop-blur-md transition-all"
            >
              Back to Products
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload Folder of Photos (UK PC)</span>
        </button>

        <button
          onClick={() => setActiveTab('console')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'console'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>WhatsApp Web 1-Click Sync</span>
        </button>
      </div>

      {/* Tab 1: Folder / Images Drop from Computer */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
            }}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all ${
              dragActive ? 'border-emerald-600 bg-emerald-50/60' : 'border-slate-300 bg-white hover:border-emerald-500'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-xs">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="font-black text-slate-900 text-lg">
              Drag &amp; Drop Product Photos from UK Computer
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
              Select multiple photos from your WhatsApp media or Desktop folder. The system will automatically match each filename (e.g. <span className="font-mono text-emerald-800">Eastern Chicken Masala.jpg</span>) to your 3,000 POS items.
            </p>
            <label className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md active:scale-95">
              <Camera className="w-4 h-4" />
              <span>Browse Files from PC</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
                className="hidden"
              />
            </label>
          </div>

          {/* Matched Preview Table */}
          {matchedItems.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Selected Photos ({matchedItems.length})</h4>
                  <p className="text-xs text-slate-500">Review auto-matched products before saving</p>
                </div>
                <button
                  onClick={() => setMatchedItems([])}
                  className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {matchedItems.slice(0, 30).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50">
                    <div className="relative w-12 h-12 rounded-xl bg-white border overflow-hidden shrink-0">
                      <Image src={item.previewUrl} alt={item.originalName} fill className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate">{item.originalName}</p>
                      {item.matchedProductName ? (
                        <p className="text-[11px] font-semibold text-emerald-700 truncate flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{item.matchedProductName}</span>
                        </p>
                      ) : (
                        <p className="text-[11px] font-medium text-amber-600 truncate flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>No match found</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: WhatsApp Web 1-Click Sync */}
      {activeTab === 'console' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-black text-slate-900">
              WhatsApp Web 1-Click Catalog Importer (No Meta Account Required)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Since your WhatsApp is logged in on your UK computer, you can extract all product photos directly from the WhatsApp Web browser in 3 easy steps:
            </p>
          </div>

          {/* 3 Step Instruction Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="w-6 h-6 rounded-full bg-emerald-800 text-white font-black text-xs flex items-center justify-center">1</span>
              <h4 className="font-bold text-xs text-slate-900">Open WhatsApp Web</h4>
              <p className="text-[11px] text-slate-500">
                On the UK computer, go to <a href="https://web.whatsapp.com" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-bold">web.whatsapp.com</a> and click on your store profile &gt; <strong>Catalog</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="w-6 h-6 rounded-full bg-emerald-800 text-white font-black text-xs flex items-center justify-center">2</span>
              <h4 className="font-bold text-xs text-slate-900">Copy &amp; Paste Script</h4>
              <p className="text-[11px] text-slate-500">
                Press <strong>F12</strong> (Developer Console), paste the snippet below, and press Enter. It automatically copies all product photos to your clipboard!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="w-6 h-6 rounded-full bg-emerald-800 text-white font-black text-xs flex items-center justify-center">3</span>
              <h4 className="font-bold text-xs text-slate-900">Paste Below &amp; Sync</h4>
              <p className="text-[11px] text-slate-500">
                Paste the copied data into the box below and click <strong>&quot;Sync Images to Catalog&quot;</strong>.
              </p>
            </div>
          </div>

          {/* Code Snippet Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Script for WhatsApp Web (Press F12 &gt; Console):</span>
              <button
                onClick={copyScriptToClipboard}
                className="px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSnippet ? 'Copied to Clipboard!' : 'Copy Script'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
{`(() => {
  const items = [];
  document.querySelectorAll('div[role="listitem"]').forEach(el => {
    const img = el.querySelector('img')?.src;
    const title = el.querySelector('span[title]')?.getAttribute('title') || el.innerText.split('\\n')[0];
    if (img && title) items.push({ name: title, imageUrl: img });
  });
  copy(JSON.stringify(items));
  alert('Copied ' + items.length + ' photos! Now paste into Kerala Superstore.');
})();`}
            </pre>
          </div>

          {/* Paste Input Box */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-800">
              Paste Extracted Data Here:
            </label>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='[{"name": "Nirapara Matta Rice", "imageUrl": "https://..."}, ...]'
              rows={5}
              className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-mono outline-none focus:border-emerald-600 focus:bg-white transition-all"
            />

            {statusMessage && (
              <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <button
              onClick={handleSyncJson}
              disabled={isSubmitting || !jsonInput.trim()}
              className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Sync Images to Catalog (Keep POS Prices)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
