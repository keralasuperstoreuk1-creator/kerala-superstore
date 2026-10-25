import fs from 'fs';
import path from 'path';
import { isR2Configured, getJsonFromR2, saveJsonToR2 } from '@/lib/cloudflare-r2';

export interface PosTransactionItem {
  barcode: string;
  name: string;
  price: number;
  qty: number;
  total: number;
  vat?: number;
}

export interface PosTransactionRecord {
  id: string;
  receiptNumber: string;
  timestamp: string;
  items: PosTransactionItem[];
  subtotal: number;
  vatTotal: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'split';
  cashTendered?: number;
  changeDue?: number;
  cashier?: string;
  source?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'pos_transactions.json');
const R2_TRANSACTIONS_KEY = 'pos/transactions.json';

// In-memory cache for ultra-fast access
let memoryTransactions: PosTransactionRecord[] = [];
let isMemoryInitialized = false;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch {
      // ignore
    }
  }
}

/**
 * Load all transactions from Disk + R2 + Memory with de-duplication
 */
export async function getStoredTransactions(): Promise<PosTransactionRecord[]> {
  const mergedMap = new Map<string, PosTransactionRecord>();

  // 1. Read from local persistent disk file
  try {
    ensureDataDir();
    if (fs.existsSync(TRANSACTIONS_FILE)) {
      const content = fs.readFileSync(TRANSACTIONS_FILE, 'utf-8');
      const diskTxs: PosTransactionRecord[] = JSON.parse(content);
      if (Array.isArray(diskTxs)) {
        diskTxs.forEach((t) => {
          const key = t.receiptNumber || t.id;
          if (key) mergedMap.set(key, t);
        });
      }
    }
  } catch (err) {
    console.warn('Error reading pos_transactions.json from disk:', err);
  }

  // 2. Read from Cloudflare R2 if available
  if (isR2Configured()) {
    try {
      const r2Txs = await getJsonFromR2<PosTransactionRecord[]>(R2_TRANSACTIONS_KEY);
      if (Array.isArray(r2Txs)) {
        r2Txs.forEach((t) => {
          const key = t.receiptNumber || t.id;
          if (key) {
            // Keep the newer one or merge
            if (!mergedMap.has(key)) {
              mergedMap.set(key, t);
            }
          }
        });
      }
    } catch (r2Err) {
      console.warn('Notice: Reading transactions from R2 failed or not ready:', r2Err);
    }
  }

  // 3. Merge in-memory transactions
  memoryTransactions.forEach((t) => {
    const key = t.receiptNumber || t.id;
    if (key) mergedMap.set(key, t);
  });

  const sorted = Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
  );

  memoryTransactions = sorted.slice(0, 2000);
  isMemoryInitialized = true;

  return sorted;
}

/**
 * Save new or updated transactions to Memory + Disk + R2
 */
export async function saveStoredTransactions(newTxs: PosTransactionRecord[]): Promise<boolean> {
  if (!newTxs || newTxs.length === 0) return true;

  try {
    const currentTxs = await getStoredTransactions();
    const map = new Map<string, PosTransactionRecord>();

    currentTxs.forEach((t) => {
      const key = t.receiptNumber || t.id;
      if (key) map.set(key, t);
    });

    // Add or update with new incoming transactions
    newTxs.forEach((t) => {
      const key = t.receiptNumber || t.id;
      if (key) map.set(key, t);
    });

    const merged = Array.from(map.values())
      .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
      .slice(0, 2500);

    // 1. Update memory
    memoryTransactions = merged;

    // 2. Write to local persistent disk
    try {
      ensureDataDir();
      fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(merged, null, 2), 'utf-8');
    } catch (diskErr) {
      console.warn('Error saving pos_transactions.json to disk:', diskErr);
    }

    // 3. Write to Cloudflare R2
    if (isR2Configured()) {
      try {
        await saveJsonToR2(R2_TRANSACTIONS_KEY, merged);
      } catch (r2Err) {
        console.warn('Notice: Error saving pos transactions to R2:', r2Err);
      }
    }

    return true;
  } catch (err) {
    console.error('Fatal error saving stored transactions:', err);
    return false;
  }
}
