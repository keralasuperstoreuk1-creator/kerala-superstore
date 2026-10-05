"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Cloud,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Zap,
  HardDrive,
  ShieldCheck,
  Globe,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  FolderOpen,
  Image as ImageIcon
} from "lucide-react";

export default function CloudflareStorageAdminPage() {
  const [status, setStatus] = useState<{
    r2Configured: boolean;
    bucket: string | null;
    publicUrl: string | null;
    freeTierDetails: {
      storage: string;
      bandwidth: string;
      classAOperations: string;
      classBOperations: string;
    };
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [testUploading, setTestUploading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; url?: string; message?: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const checkStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/upload-r2");
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleTestUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTestUploading(true);
    setTestResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "test-uploads");

    try {
      const res = await fetch("/api/admin/upload-r2", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setTestResult({ success: true, url: data.url });
      } else {
        setTestResult({ success: false, message: data.message || data.error });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTestUploading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 border border-amber-500/30 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border border-amber-500/30">
              <Cloud className="w-3.5 h-3.5" /> High-Performance Media Cloud
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Cloudflare R2 Image Storage (5,000+ Photos)
            </h1>
            <p className="text-emerald-100/80 text-sm mt-1 max-w-2xl">
              Permanent, ultra-fast image storage for Kerala Superstore. Zero monthly bandwidth bills, guaranteed no image loss, with UK edge caching.
            </p>
          </div>

          <button
            onClick={checkStatus}
            disabled={isLoading}
            className="self-start md:self-center px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer backdrop-blur"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
            Check Connection
          </button>
        </div>
      </div>

      {/* Connection Status & Free Tier Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Card */}
        <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Storage Engine Status
            </span>
            <div className="mt-4 flex items-center gap-3">
              {status?.r2Configured ? (
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-7 h-7" />
                </div>
              )}
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {status?.r2Configured ? "Connected & Active" : "Ready for API Keys"}
                </h3>
                <p className="text-xs text-slate-500">
                  {status?.r2Configured
                    ? `Bucket: ${status.bucket}`
                    : "Using Local/Supabase fallback"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Protection:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% Loss-Proof
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Data Center:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> UK & Global CDN
              </span>
            </div>
          </div>
        </div>

        {/* Free Tier Details */}
        <div className="md:col-span-2 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">
              Cloudflare R2 Free Quota (No Credit Card Bill Surprises)
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-emerald-100 dark:border-slate-700 text-center">
              <HardDrive className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <div className="text-xl font-black text-slate-900 dark:text-white">10 GB</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Free Storage (~15,000 photos)</div>
            </div>

            <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-emerald-100 dark:border-slate-700 text-center">
              <Globe className="w-5 h-5 text-teal-600 mx-auto mb-1" />
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">$0</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Unlimited Bandwidth</div>
            </div>

            <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-emerald-100 dark:border-slate-700 text-center">
              <UploadCloud className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <div className="text-xl font-black text-slate-900 dark:text-white">1 Million</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Free Uploads / mo</div>
            </div>

            <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-emerald-100 dark:border-slate-700 text-center">
              <ImageIcon className="w-5 h-5 text-amber-600 mx-auto mb-1" />
              <div className="text-xl font-black text-slate-900 dark:text-white">10 Million</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Free Views / mo</div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Upload Test Tool */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
          <UploadCloud className="w-5 h-5 text-emerald-600" />
          Test Instant Image Upload
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Upload any test product photo to test Cloudflare R2 permanent cloud storage.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <label className="w-full sm:w-auto px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-900/20 transition-all">
            <UploadCloud className="w-4 h-4" />
            <span>{testUploading ? "Uploading to R2..." : "Select Test Image"}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleTestUpload}
              disabled={testUploading}
            />
          </label>

          {testUploading && (
            <span className="text-xs text-slate-500 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" /> Uploading to Cloudflare R2...
            </span>
          )}
        </div>

        {testResult && (
          <div className={`mt-6 p-4 rounded-xl border text-xs ${
            testResult.success 
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
              : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
          }`}>
            {testResult.success ? (
              <div className="space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> Successfully Uploaded to Cloudflare R2!
                </div>
                <div className="break-all font-mono text-[11px] bg-white/60 dark:bg-slate-900/60 p-2 rounded border">
                  {testResult.url}
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={testResult.url}
                  alt="Uploaded test"
                  className="w-32 h-32 object-contain bg-white rounded-lg border p-1 mt-2 shadow"
                />
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Upload Notice:</div>
                  <div>{testResult.message}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step by Step Setup Guide */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          ⚙️ 3-Minute Cloudflare R2 Setup Guide (How to get free keys)
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Follow these 4 simple steps to connect your free Cloudflare account:
        </p>

        <div className="space-y-4 text-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="font-bold text-slate-900 dark:text-white mb-1 flex items-center justify-between">
              <span>Step 1: Create a Free Bucket</span>
              <a
                href="https://dash.cloudflare.com/?to=/:account/r2/overview"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 hover:underline inline-flex items-center gap-1"
              >
                Open Cloudflare R2 Dashboard <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-slate-500">
              Go to <strong>R2 Object Storage</strong> &rarr; Click <strong>&quot;Create Bucket&quot;</strong> &rarr; Name it <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">kerala-superstore-images</code>.
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="font-bold text-slate-900 dark:text-white mb-1">
              Step 2: Generate R2 API Tokens
            </div>
            <p className="text-slate-500">
              Click <strong>&quot;Manage R2 API Tokens&quot;</strong> on the right &rarr; Click <strong>&quot;Create API Token&quot;</strong> &rarr; Select <strong>&quot;Object Read & Write&quot;</strong> permission &rarr; Click <strong>Create</strong>.
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="font-bold text-slate-900 dark:text-white mb-1">
              Step 3: Copy Environment Variables into your .env file
            </div>
            <div className="mt-2 bg-slate-950 text-emerald-400 p-3 rounded-lg font-mono text-[11px] relative">
              <button
                onClick={() =>
                  copyToClipboard(
                    `CLOUDFLARE_R2_ACCOUNT_ID=your-account-id\nCLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key-id\nCLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-access-key\nCLOUDFLARE_R2_BUCKET_NAME=kerala-superstore-images\nCLOUDFLARE_R2_PUBLIC_URL=https://pub-xxxx.r2.dev`,
                    "env"
                  )
                }
                className="absolute top-2 right-2 px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-slate-300 flex items-center gap-1 text-[10px]"
              >
                {copiedKey === "env" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedKey === "env" ? "Copied" : "Copy"}
              </button>
              <div>CLOUDFLARE_R2_ACCOUNT_ID=your-account-id</div>
              <div>CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key-id</div>
              <div>CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-access-key</div>
              <div>CLOUDFLARE_R2_BUCKET_NAME=kerala-superstore-images</div>
              <div>CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxxx.r2.dev</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
