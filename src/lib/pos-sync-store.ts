import fs from 'fs';
import path from 'path';

export interface PosSyncItem {
  sku?: number | string;
  barcode: string;
  description: string;
  quantity: number;
  price: number;
  webPrice?: number;
  active: boolean;
  isDeleted?: boolean;
  lastModified?: string;
  updatedAt?: string;
}

export interface PosSyncStatus {
  lastSyncTime: string | null;
  totalSyncedItems: number;
  inStockCount: number;
  outOfStockCount: number;
  recentLogs: Array<{
    timestamp: string;
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
    itemCount?: number;
  }>;
  syncedInventory: Record<string, PosSyncItem>; // keyed by barcode
}

const DATA_DIR = path.join(process.cwd(), 'data');
const STATE_FILE = path.join(DATA_DIR, 'pos_sync_state.json');

const defaultState: PosSyncStatus = {
  lastSyncTime: null,
  totalSyncedItems: 0,
  inStockCount: 0,
  outOfStockCount: 0,
  recentLogs: [
    {
      timestamp: new Date().toISOString(),
      type: 'info',
      message: 'POS Sync Service initialized. Ready to receive stock updates from RetailV2.',
    },
  ],
  syncedInventory: {},
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch {
      // fallback
    }
  }
}

export function getPosSyncState(): PosSyncStatus {
  try {
    ensureDataDir();
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, 'utf-8');
      return { ...defaultState, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Error reading POS sync state:', err);
  }
  return defaultState;
}

export function savePosSyncState(state: PosSyncStatus): boolean {
  try {
    ensureDataDir();
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving POS sync state:', err);
    return false;
  }
}

export function applyPosInventorySync(items: PosSyncItem[], source: string = 'RetailV2-POS'): PosSyncStatus {
  const state = getPosSyncState();
  const now = new Date().toISOString();

  let inStock = 0;
  let outOfStock = 0;

  items.forEach((item) => {
    if (!item.barcode) return;
    const cleanBarcode = String(item.barcode).trim();
    
    state.syncedInventory[cleanBarcode] = {
      ...item,
      barcode: cleanBarcode,
      quantity: Number(item.quantity) || 0,
      price: Number(item.price) || 0,
      webPrice: item.webPrice !== undefined ? Number(item.webPrice) : Number(item.price),
      active: item.active !== false && !item.isDeleted,
      updatedAt: now,
    };
  });

  // Calculate totals
  Object.values(state.syncedInventory).forEach((item) => {
    if (item.quantity > 0 && item.active) {
      inStock++;
    } else {
      outOfStock++;
    }
  });

  state.lastSyncTime = now;
  state.totalSyncedItems = Object.keys(state.syncedInventory).length;
  state.inStockCount = inStock;
  state.outOfStockCount = outOfStock;

  // Add to recent logs (keep last 50)
  state.recentLogs.unshift({
    timestamp: now,
    type: 'success',
    message: `Received ${items.length} items from ${source}. Total active catalog: ${state.totalSyncedItems}`,
    itemCount: items.length,
  });

  if (state.recentLogs.length > 50) {
    state.recentLogs = state.recentLogs.slice(0, 50);
  }

  savePosSyncState(state);
  return state;
}
