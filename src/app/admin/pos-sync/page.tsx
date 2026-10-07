'use client';

import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Download, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Terminal, 
  Server, 
  ArrowRight,
  ShieldCheck,
  Package,
  Layers,
  Zap,
  HelpCircle
} from 'lucide-react';

interface SyncStatusData {
  success: boolean;
  isConnected: boolean;
  lastSyncTime: string | null;
  totalSyncedItems: number;
  inStockCount: number;
  outOfStockCount: number;
  recentLogs?: Array<{
    timestamp: string;
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
    itemCount?: number;
  }>;
  sampleItems?: any[];
}

export default function PosSyncAdminPage() {
  const [data, setData] = useState<SyncStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const apiKey = 'kss_pos_sync_key_2026_live';

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/pos/sync');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch POS sync status:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleSimulateSync = async () => {
    setSimulating(true);
    try {
      const res = await fetch('/api/pos/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-POS-SYNC-KEY': apiKey,
        },
        body: JSON.stringify({
          source: 'Admin Simulator Test',
          items: [
            {
              sku: 101,
              barcode: '5012345678901',
              description: 'Nirapara Matta Rice 5kg (Live Sync Test)',
              quantity: Math.floor(Math.random() * 40) + 5,
              price: 7.99,
              webPrice: 7.49,
              active: true,
            },
            {
              sku: 102,
              barcode: '5012345678902',
              description: 'Eastern Sambar Powder 200g (Live Sync Test)',
              quantity: Math.floor(Math.random() * 50) + 10,
              price: 1.49,
              webPrice: 1.39,
              active: true,
            }
          ]
        })
      });

      if (res.ok) {
        showToast('✅ Test sync completed successfully! Stock updated.');
        await fetchStatus();
      } else {
        showToast('❌ Test sync failed.');
      }
    } catch (e: any) {
      showToast('❌ Error: ' + e.message);
    } finally {
      setSimulating(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const formatTimeAgo = (isoString: string | null) => {
    if (!isoString) return 'Never';
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 10) return 'Just now';
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/40 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in">
          <Zap className="w-5 h-5 text-emerald-400 animate-pulse" />
          <span className="text-sm font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                RetailV2 POS Auto-Sync Bridge
                <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-1 rounded-full border border-emerald-500/30">
                  v2.0 EXE
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Automatically synchronizes physical store stock & prices from Microsoft SQL Server (epos) to website.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => {
              setRefreshing(true);
              fetchStatus();
            }}
            disabled={refreshing}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-bold transition-all border border-slate-700 active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            Refresh Status
          </button>
          <a
            href="/downloads/KSS-POS-Sync-Setup.exe"
            download="KSS-POS-Sync-Setup.exe"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            Download Windows Installer (.exe Setup)
          </a>
          <a
            href="/downloads/KSS-POS-Sync.exe"
            download="KSS-POS-Sync.exe"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-all active:scale-95"
            title="Download portable standalone version without installer"
          >
            Portable .EXE
          </a>
        </div>
      </div>

      {/* Connection & Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Connection Status Card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Bridge Status</span>
            <span className="flex h-3 w-3 relative">
              {data?.isConnected ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              )}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-white flex items-center gap-2">
              {data?.isConnected ? (
                <span className="text-emerald-400">🟢 Connected & Live</span>
              ) : (
                <span className="text-amber-300">🟡 Ready / Standby</span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Last Heartbeat: <span className="text-slate-200 font-semibold">{formatTimeAgo(data?.lastSyncTime || null)}</span>
            </p>
          </div>
        </div>

        {/* Total Synced Items */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Products Synced</span>
            <Package className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white">
              {data?.totalSyncedItems?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              From <span className="text-emerald-400 font-semibold">epos.Inventory</span> table
            </p>
          </div>
        </div>

        {/* In Stock Count */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">In Stock Items</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-emerald-400">
              {data?.inStockCount?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Live for website ordering
            </p>
          </div>
        </div>

        {/* Out of Stock Count */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Out of Stock</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-rose-400">
              {data?.outOfStockCount?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Qty = 0 in RetailV2
            </p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: POS Quick Setup & Configuration */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Setup Instructions */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-400" />
              POS Machine Quick Setup
            </h2>

            <div className="space-y-4 text-sm text-slate-300">
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  1
                </div>
                <div>
                  <p className="font-bold text-white">Download Tool on POS PC</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Click the download button above to save <code className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-300">KSS-POS-Sync.exe</code> onto the till PC (e.g. Desktop or POS folder).
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  2
                </div>
                <div>
                  <p className="font-bold text-white">Run KSS-POS-Sync.exe</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Double-click to start. It connects to <code className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-300">localhost epos DB</code> automatically using Windows Auth.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  3
                </div>
                <div>
                  <p className="font-bold text-white">Click "Start Auto-Sync"</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Every 30 seconds, all sales and inventory changes will seamlessly update the website stock.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={handleSimulateSync}
                disabled={simulating}
                className="w-full py-2.5 px-4 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold rounded-xl border border-emerald-500/30 transition-all text-xs flex items-center justify-center gap-2"
              >
                <Zap className={`w-4 h-4 ${simulating ? 'animate-bounce' : ''}`} />
                {simulating ? 'Simulating Sync...' : 'Send Test Sync Payload (Test Now)'}
              </button>
            </div>
          </div>

          {/* API Security Token Box */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              API Secret Header Token
            </h3>
            <p className="text-xs text-slate-400">
              This secret key protects the stock update endpoint from unauthorized access.
            </p>
            <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <code className="text-xs text-emerald-400 font-mono flex-1 overflow-x-auto">
                {apiKey}
              </code>
              <button
                onClick={handleCopyKey}
                title="Copy API Key"
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
              >
                {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Logs & Synced Catalog Sample */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Activity Logs */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-400" />
                Live Sync Activity Logs
              </h2>
              <span className="text-xs text-slate-400">Auto-refreshes live</span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {data?.recentLogs && data.recentLogs.length > 0 ? (
                data.recentLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs font-mono flex items-start gap-3"
                  >
                    <span className="text-slate-500 font-semibold flex-shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span
                      className={`font-semibold flex-1 ${
                        log.type === 'success'
                          ? 'text-emerald-400'
                          : log.type === 'error'
                          ? 'text-rose-400'
                          : log.type === 'warning'
                          ? 'text-amber-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {log.message}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No sync activities recorded yet. Run <code className="text-emerald-400">KSS-POS-Sync.exe</code> or click the test button.
                </div>
              )}
            </div>
          </div>

          {/* Sample Synced Items Table */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-teal-400" />
              Recently Synced Stock Sample
            </h2>

            {data?.sampleItems && data.sampleItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-3">Barcode</th>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-right">POS Qty</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {data.sampleItems.map((item, i) => (
                      <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-mono text-emerald-400">{item.barcode}</td>
                        <td className="p-3 font-medium text-white">{item.description}</td>
                        <td className="p-3 text-right font-bold">
                          {item.quantity > 0 ? (
                            <span className="text-emerald-400">{item.quantity}</span>
                          ) : (
                            <span className="text-rose-400">0</span>
                          )}
                        </td>
                        <td className="p-3 text-right text-amber-300 font-semibold">
                          £{Number(item.webPrice || item.price).toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          {item.quantity > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              IN STOCK
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              OUT OF STOCK
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs">
                No items synced yet. Once the tool runs, live stock counts will appear here.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
