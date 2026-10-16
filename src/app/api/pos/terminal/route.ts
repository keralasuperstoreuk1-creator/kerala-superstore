import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUnifiedProductCatalog, markCatalogStale } from '@/lib/product-catalog';
import { isNonFoodOrToiletries } from '@/lib/product-matching';

// Fallback in-memory storage for transactions when offline or standalone
interface PosTransaction {
  id: string;
  timestamp: string;
  receiptNumber: string;
  items: Array<{
    barcode: string;
    name: string;
    price: number;
    qty: number;
    total: number;
  }>;
  subtotal: number;
  vatTotal: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'split';
  cashTendered?: number;
  changeDue?: number;
  cashier: string;
}

export interface PosReturn {
  id: string;
  timestamp: string;
  returnSlipNumber: string;
  originalReceiptNumber: string;
  items: Array<{
    barcode: string;
    name: string;
    price: number;
    qty: number;
    refundAmount: number;
    reason: string;
    condition: 'restockable' | 'damaged_waste';
  }>;
  totalRefund: number;
  refundMethod: 'cash' | 'card' | 'store_credit';
  customerName?: string;
  customerPhone?: string;
  cashier: string;
  notes?: string;
}

function getInitialTransactions(): PosTransaction[] {
  const today = new Date();
  const d0 = today.toISOString();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const d1 = yesterday.toISOString();
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const d2 = threeDaysAgo.toISOString();

  return [
    {
      id: 'tx-init-1',
      timestamp: d0,
      receiptNumber: 'KSS-901421',
      items: [
        { barcode: '501234567001', name: 'Nirapara Matta Rice 5kg', price: 9.99, qty: 2, total: 19.98 },
        { barcode: '501234567002', name: 'Eastern Chilli Powder 500g', price: 2.89, qty: 1, total: 2.89 },
        { barcode: '501234567003', name: 'Aachi Sambar Powder 200g', price: 1.49, qty: 2, total: 2.98 },
      ],
      subtotal: 25.85,
      vatTotal: 0.0,
      total: 25.85,
      paymentMethod: 'card',
      cashier: 'Store Administrator',
    },
    {
      id: 'tx-init-2',
      timestamp: d0,
      receiptNumber: 'KSS-901422',
      items: [
        { barcode: '501234567004', name: 'Brahmins Roasted Rava 1kg', price: 2.19, qty: 1, total: 2.19 },
        { barcode: '501234567005', name: 'Kerala Banana Chips 250g', price: 2.49, qty: 3, total: 7.47 },
        { barcode: '501234567006', name: 'Dettol Handwash Anti-Bacterial 250ml', price: 2.49, qty: 1, total: 2.49 },
      ],
      subtotal: 12.15,
      vatTotal: 0.5,
      total: 12.65,
      paymentMethod: 'cash',
      cashTendered: 20.0,
      changeDue: 7.35,
      cashier: 'Counter Cashier 1',
    },
    {
      id: 'tx-init-3',
      timestamp: d1,
      receiptNumber: 'KSS-901380',
      items: [
        { barcode: '501234567001', name: 'Nirapara Matta Rice 5kg', price: 9.99, qty: 1, total: 9.99 },
        { barcode: '501234567007', name: 'Parachute Coconut Oil 1L', price: 4.89, qty: 2, total: 9.78 },
      ],
      subtotal: 19.77,
      vatTotal: 0.0,
      total: 19.77,
      paymentMethod: 'card',
      cashier: 'Store Administrator',
    },
    {
      id: 'tx-init-4',
      timestamp: d2,
      receiptNumber: 'KSS-901290',
      items: [
        { barcode: '501234567008', name: 'Double Horse Idiyappam Podi 1kg', price: 2.79, qty: 2, total: 5.58 },
        { barcode: '501234567005', name: 'Kerala Banana Chips 250g', price: 2.49, qty: 2, total: 4.98 },
      ],
      subtotal: 10.56,
      vatTotal: 0.0,
      total: 10.56,
      paymentMethod: 'cash',
      cashTendered: 15.0,
      changeDue: 4.44,
      cashier: 'Counter Cashier 1',
    },
  ];
}

function getInitialReturns(): PosReturn[] {
  const today = new Date();
  return [
    {
      id: 'ret-init-1',
      timestamp: today.toISOString(),
      returnSlipNumber: 'RET-801210',
      originalReceiptNumber: 'KSS-901380',
      items: [
        {
          barcode: '501234567007',
          name: 'Parachute Coconut Oil 1L',
          price: 4.89,
          qty: 1,
          refundAmount: 4.89,
          reason: 'Customer bought extra duplicate bottle',
          condition: 'restockable',
        },
      ],
      totalRefund: 4.89,
      refundMethod: 'cash',
      cashier: 'Store Administrator',
    },
  ];
}

let inMemoryTransactions: PosTransaction[] = getInitialTransactions();
let inMemoryReturns: PosReturn[] = getInitialReturns();

// High-speed in-memory cache for terminal catalog
let memoryCatalogCache: { items: any[]; timestamp: number } | null = null;
const CATALOG_CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

export function invalidateTerminalCatalogCache() {
  memoryCatalogCache = null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    // 1. Receipt Lookup for Sales Return
    if (action === 'lookup_receipt') {
      const receiptNumber = (searchParams.get('receiptNumber') || '').trim().toUpperCase();
      if (!receiptNumber) {
        return NextResponse.json({ success: false, error: 'Receipt number required' }, { status: 400 });
      }

      const foundTx = inMemoryTransactions.find(
        (t) => t.receiptNumber.toUpperCase() === receiptNumber || t.id.toUpperCase() === receiptNumber
      );

      if (!foundTx) {
        return NextResponse.json({
          success: false,
          error: `Receipt ${receiptNumber} not found in current terminal session. You can still proceed with a Direct Return.`,
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        transaction: foundTx,
      });
    }

    // 2. Recent Sales Receipts (for easy click-to-return)
    if (action === 'recent_receipts') {
      return NextResponse.json({
        success: true,
        receipts: inMemoryTransactions.slice(-25).reverse(),
      });
    }

    // 3. Sales Returns History
    if (action === 'returns_history') {
      return NextResponse.json({
        success: true,
        returns: inMemoryReturns.slice(-30).reverse(),
      });
    }

    // 4. Total Sales & Closing Stock Report with Period Filtering
    if (action === 'report') {
      const period = (searchParams.get('period') || 'today').toLowerCase();
      const fromDate = searchParams.get('fromDate');
      const toDate = searchParams.get('toDate');

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      const yesterdayDate = new Date(now);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let periodLabel = 'Today';
      if (period === 'yesterday') periodLabel = 'Yesterday';
      else if (period === 'week') periodLabel = 'This Week (Last 7 Days)';
      else if (period === 'month') periodLabel = 'This Month (Last 30 Days)';
      else if (period === 'all') periodLabel = 'All Time Total';
      else if (period === 'custom') periodLabel = `Custom (${fromDate || ''} - ${toDate || todayStr})`;

      const filterRecordByPeriod = (timestamp: string) => {
        if (!timestamp) return false;
        if (period === 'today') return timestamp.startsWith(todayStr);
        if (period === 'yesterday') return timestamp.startsWith(yesterdayStr);
        if (period === 'week') return new Date(timestamp) >= sevenDaysAgo;
        if (period === 'month') return new Date(timestamp) >= thirtyDaysAgo;
        if (period === 'all') return true;
        if (period === 'custom' && fromDate) {
          const tsDate = timestamp.split('T')[0];
          const to = toDate || todayStr;
          return tsDate >= fromDate && tsDate <= to;
        }
        return timestamp.startsWith(todayStr);
      };

      const filteredTxs = inMemoryTransactions.filter((t) => filterRecordByPeriod(t.timestamp));
      const totalSales = filteredTxs.reduce((sum, t) => sum + t.total, 0);
      const cashSales = filteredTxs.filter((t) => t.paymentMethod === 'cash').reduce((sum, t) => sum + t.total, 0);
      const cardSales = filteredTxs.filter((t) => t.paymentMethod === 'card').reduce((sum, t) => sum + t.total, 0);
      const vatCollected = filteredTxs.reduce((sum, t) => sum + t.vatTotal, 0);

      const filteredReturns = inMemoryReturns.filter((r) => filterRecordByPeriod(r.timestamp));
      const totalRefunds = filteredReturns.reduce((sum, r) => sum + r.totalRefund, 0);
      const cashRefunds = filteredReturns.filter((r) => r.refundMethod === 'cash').reduce((sum, r) => sum + r.totalRefund, 0);
      const cardRefunds = filteredReturns.filter((r) => r.refundMethod === 'card').reduce((sum, r) => sum + r.totalRefund, 0);
      const storeCreditRefunds = filteredReturns.filter((r) => r.refundMethod === 'store_credit').reduce((sum, r) => sum + r.totalRefund, 0);

      const netSales = Math.max(0, totalSales - totalRefunds);
      const netCash = cashSales - cashRefunds;
      const netCard = cardSales - cardRefunds;
      const transactionCount = filteredTxs.length;
      const returnCount = filteredReturns.length;
      const averageBasket = transactionCount > 0 ? Math.round((totalSales / transactionCount) * 100) / 100 : 0;

      // Item-level breakdown for the selected period
      const itemMap: Record<string, { barcode: string; name: string; qty: number; revenue: number; price: number }> = {};
      filteredTxs.forEach((t) => {
        t.items.forEach((i) => {
          if (!itemMap[i.barcode]) {
            itemMap[i.barcode] = { barcode: i.barcode, name: i.name, qty: 0, revenue: 0, price: i.price };
          }
          itemMap[i.barcode].qty += i.qty;
          itemMap[i.barcode].revenue += i.total;
        });
      });

      const allSoldItems = Object.values(itemMap).sort((a, b) => b.revenue - a.revenue);
      const topItems = allSoldItems.slice(0, 10);

      // Compute Live Closing Stock Statistics
      let closingStockUnits = 0;
      let closingStockRetailValue = 0;
      let outOfStockCount = 0;
      let lowStockCount = 0;
      let totalInventorySkus = 0;
      const categoryStockMap: Record<string, { skus: number; units: number; value: number }> = {};
      const lowStockItems: any[] = [];

      if (supabaseAdmin) {
        try {
          const { data: invData } = await supabaseAdmin
            .from('pos_inventory')
            .select('barcode, description, price, quantity, category')
            .limit(4000);

          if (invData && Array.isArray(invData)) {
            totalInventorySkus = invData.length;
            invData.forEach((item: any) => {
              const qty = Number(item.quantity) || 0;
              const price = Number(item.price) || 0;
              const val = qty * price;
              closingStockUnits += qty;
              closingStockRetailValue += val;

              if (qty === 0) {
                outOfStockCount++;
                if (lowStockItems.length < 30) {
                  lowStockItems.push({
                    barcode: item.barcode || '',
                    name: item.description || 'Item',
                    stock: qty,
                    price,
                    category: item.category || 'General Grocery',
                  });
                }
              } else if (qty <= 5) {
                lowStockCount++;
                if (lowStockItems.length < 30) {
                  lowStockItems.push({
                    barcode: item.barcode || '',
                    name: item.description || 'Item',
                    stock: qty,
                    price,
                    category: item.category || 'General Grocery',
                  });
                }
              }

              const cat = item.category || 'General Grocery';
              if (!categoryStockMap[cat]) {
                categoryStockMap[cat] = { skus: 0, units: 0, value: 0 };
              }
              categoryStockMap[cat].skus++;
              categoryStockMap[cat].units += qty;
              categoryStockMap[cat].value += val;
            });
          }
        } catch (e) {
          console.error('Error fetching closing stock metrics:', e);
        }
      }

      return NextResponse.json({
        success: true,
        date: todayStr,
        period,
        periodLabel,
        totalSales: Math.round(totalSales * 100) / 100,
        cashSales: Math.round(cashSales * 100) / 100,
        cardSales: Math.round(cardSales * 100) / 100,
        vatCollected: Math.round(vatCollected * 100) / 100,
        totalRefunds: Math.round(totalRefunds * 100) / 100,
        cashRefunds: Math.round(cashRefunds * 100) / 100,
        cardRefunds: Math.round(cardRefunds * 100) / 100,
        storeCreditRefunds: Math.round(storeCreditRefunds * 100) / 100,
        netSales: Math.round(netSales * 100) / 100,
        netCash: Math.round(netCash * 100) / 100,
        netCard: Math.round(netCard * 100) / 100,
        transactionCount,
        returnCount,
        averageBasket,
        topItems,
        allSoldItems,
        closingStock: {
          totalSkus: totalInventorySkus,
          totalUnits: closingStockUnits,
          totalRetailValue: Math.round(closingStockRetailValue * 100) / 100,
          outOfStockCount,
          lowStockCount,
          categoryBreakdown: Object.entries(categoryStockMap).map(([category, d]) => ({
            category,
            skus: d.skus,
            units: d.units,
            value: Math.round(d.value * 100) / 100,
          })).sort((a, b) => b.value - a.value),
          lowStockItems,
        },
        recentTransactions: filteredTxs.slice(-300).reverse(),
        recentReturns: filteredReturns.slice(-100).reverse(),
      });
    }

    // 2. Fetch Terminal Catalog with Barcodes & Images
    // Priority: Supabase Cloud Database (all 3,000+ items with barcodes)
    let catalogItems: any[] = [];

    if (memoryCatalogCache && Date.now() - memoryCatalogCache.timestamp < CATALOG_CACHE_TTL_MS) {
      catalogItems = memoryCatalogCache.items;
    } else if (supabaseAdmin) {
      try {
        // 1. Fetch ALL items from pos_inventory with pagination (bypasses PostgREST 1000 row limit)
        const posData: any[] = [];
        let posOffset = 0;
        const PAGE_SIZE = 1000;
        while (true) {
          const { data: batch, error: batchErr } = await supabaseAdmin
            .from('pos_inventory')
            .select('*')
            .order('description', { ascending: true })
            .range(posOffset, posOffset + PAGE_SIZE - 1);

          if (batchErr || !batch || batch.length === 0) break;
          posData.push(...batch);
          if (batch.length < PAGE_SIZE) break;
          posOffset += PAGE_SIZE;
          if (posOffset > 10000) break;
        }

        // 2. Fetch ALL published website products with valid columns and pagination
        const prodData: any[] = [];
        let prodOffset = 0;
        while (true) {
          const { data: batch, error: batchErr } = await supabaseAdmin
            .from('products')
            .select('id, name, slug, barcode, image_url, size_weight, tags, category_id')
            .range(prodOffset, prodOffset + PAGE_SIZE - 1);

          if (batchErr || !batch || batch.length === 0) break;
          prodData.push(...batch);
          if (batch.length < PAGE_SIZE) break;
          prodOffset += PAGE_SIZE;
          if (prodOffset > 10000) break;
        }

        // 3. Multi-tier Image Mapping & Clean Packshot Index
        const imageMapByBarcode = new Map<string, { imageUrl: string; sizeWeight?: string; tags?: string[]; categoryId?: string }>();
        const imageMapByName = new Map<string, { imageUrl: string; sizeWeight?: string; tags?: string[]; categoryId?: string }>();
        const prodTokenList: Array<{ meta: any; tokens: Set<string> }> = [];

        const cleanTokens = (text: string): Set<string> => {
          const cleaned = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
          const stopWords = new Set([
            'and', 'with', 'the', 'of', 'in', 'kg', '1kg', '2kg', '5kg', '10kg',
            'g', 'gm', '100g', '200g', '250g', '400g', '500g', '500gm', '750g', '150g', '125g',
            'ml', 'ltr', '1l', '2l', '500ml', '750ml', 'pack', 'pkt', 'box', 'tin', 'can', 'bottle'
          ]);
          const tokens = new Set<string>();
          for (const w of cleaned.split(/\s+/)) {
            if (w && !stopWords.has(w) && w.length > 1) {
              tokens.add(w);
            }
          }
          return tokens;
        };

        if (prodData && prodData.length > 0) {
          prodData.forEach((p: any) => {
            const img = p.image_url;
            if (!img || img.includes('spices.jpg')) return;

            const meta = {
              imageUrl: img,
              sizeWeight: p.size_weight,
              tags: p.tags,
              categoryId: p.category_id,
            };

            const bc = String(p.barcode || '').trim();
            if (bc) {
              imageMapByBarcode.set(bc, meta);
            }

            const cleanName = (p.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            if (cleanName) {
              imageMapByName.set(cleanName, meta);
            }

            prodTokenList.push({
              meta,
              tokens: cleanTokens(p.name || ''),
            });
          });
        }

        const getFallbackImage = (desc: string): string => {
          const lower = desc.toLowerCase();
          if (/(rice|matta|ponni|jeerakasala|biryani rice|basmati|pachari)/i.test(lower)) return '/categories/rice.jpg';
          if (/(masala|powder|chilli|coriander|turmeric|curry|sambar|rasam|pepper|jeera|cumin)/i.test(lower)) return '/categories/masala.jpg';
          if (/(pickle|achar|chutney|chammanthi)/i.test(lower)) return '/categories/pickles.jpg';
          if (/(chips|murukku|mixture|bonda|crisp|snack|cookie|biscuit|digestive|heart|rusk|halwa|kuzhalappam)/i.test(lower)) return '/categories/snacks.jpg';
          if (/(puttu|appam|idiyappam|dosa|idli|ada|payasam|vermicelli|rava|wheat|flour|maida)/i.test(lower)) return '/categories/breakfast.jpg';
          if (/(oil|ghee|nallenna|velichenna|gingelly)/i.test(lower)) return '/categories/oils.jpg';
          if (/(dal|gram|lentil|payar|peas|kadala|chana|toor|urad|moong)/i.test(lower)) return '/categories/pulses.jpg';
          if (/(frozen|fish|meat|kappa|tapioca|mutton|beef|chicken|porotta|paratha)/i.test(lower)) return '/categories/frozen.jpg';
          if (/(cooker|pan|pot|knife|pooja|lamp|vessel|kitchen|soap|shampoo|paste|cleaner|brush|detergent)/i.test(lower)) return '/categories/kitchenwares.jpg';
          return '/categories/spices.jpg';
        };

        if (posData && posData.length > 0) {
          catalogItems = posData.map((item: any) => {
            const bc = String(item.barcode || '').trim();
            const desc = item.description || 'Kerala Grocery Item';
            const cleanDesc = desc.toLowerCase().replace(/[^a-z0-9]/g, '');
            const isNonFood = isNonFoodOrToiletries(desc);

            // Tier 1: Exact Barcode Match (matches 2,977+ items)
            let matchedMeta = imageMapByBarcode.get(bc);

            // Tier 2: Exact Normalized Name Match
            if (!matchedMeta && cleanDesc) {
              matchedMeta = imageMapByName.get(cleanDesc);
            }

            // Tier 3: Smart Token / Brand Fuzzy Match
            if (!matchedMeta) {
              const itemTokens = cleanTokens(desc);
              let bestMeta: any = null;
              let bestScore = 0;
              for (const pt of prodTokenList) {
                let score = 0;
                for (const t of itemTokens) {
                  if (pt.tokens.has(t)) score++;
                }
                if (score > bestScore) {
                  bestScore = score;
                  bestMeta = pt.meta;
                }
              }
              if (bestMeta && bestScore >= 2) {
                matchedMeta = bestMeta;
              }
            }

            return {
              barcode: bc,
              sku: item.sku || bc,
              name: desc,
              price: Number(item.price) || 0,
              stock: Number(item.quantity) || 0,
              category: item.category || (isNonFood ? 'Household & Toiletries' : 'General Grocery'),
              sizeWeight: matchedMeta?.sizeWeight || 'Standard',
              imageUrl: matchedMeta?.imageUrl || getFallbackImage(desc),
              vatRate: isNonFood ? 20 : 0, // UK HMRC Rule: Basic groceries = 0% VAT, non-food/cosmetics = 20%
              active: item.active !== false,
            };
          });

          // Save to fast in-memory cache
          memoryCatalogCache = {
            items: catalogItems,
            timestamp: Date.now(),
          };
        }
      } catch (err) {
        console.warn('Supabase terminal fetch error:', err);
      }
    }

    // Fallback to local catalog if database is empty
    if (catalogItems.length === 0) {
      const local = getUnifiedProductCatalog();
      catalogItems = local.map((p, idx) => ({
        barcode: p.barcode || `501234567${String(idx).padStart(4, '0')}`,
        sku: p.barcode || `SKU-${p.id}`,
        name: p.name,
        price: Number(p.price) || 0,
        stock: Number(p.stock) || 0,
        category: p.category || 'General Grocery',
        sizeWeight: p.sizeWeight || 'Standard',
        imageUrl: p.imageUrl || '/categories/spices.jpg',
        vatRate: isNonFoodOrToiletries(p.name) ? 20 : 0,
        active: true,
      }));
    }

    return NextResponse.json({
      success: true,
      count: catalogItems.length,
      store: {
        name: 'Kerala Superstore UK',
        branch: 'Manchester Superstore (Till 01)',
        address: '148 Moston Lane, Manchester, M9 8DX',
        phone: '+44 7749 132122',
        vatNumber: 'GB 384 9201 55',
        currency: 'GBP',
        symbol: '£',
      },
      products: catalogItems,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to load POS terminal data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || 'checkout';

    // Invalidate memory catalog cache on any mutating action
    memoryCatalogCache = null;

    // 1. CHECKOUT TRANSACTION (Sales at till)
    if (action === 'checkout') {
      const {
        items,
        subtotal,
        vatTotal,
        total,
        paymentMethod = 'cash',
        cashTendered,
        changeDue,
        cashier = 'Admin Cashier',
      } = body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ success: false, error: 'Cart is empty' }, { status: 400 });
      }

      const receiptNumber = `KSS-${Date.now().toString().slice(-6)}`;
      const now = new Date().toISOString();

      const transaction: PosTransaction = {
        id: `tx-${Date.now()}`,
        timestamp: now,
        receiptNumber,
        items,
        subtotal: Number(subtotal) || 0,
        vatTotal: Number(vatTotal) || 0,
        total: Number(total) || 0,
        paymentMethod,
        cashTendered: Number(cashTendered) || 0,
        changeDue: Number(changeDue) || 0,
        cashier,
      };

      inMemoryTransactions.push(transaction);

      // Decrement stock in Supabase for each purchased item
      if (supabaseAdmin) {
        try {
          for (const item of items) {
            const bc = String(item.barcode).trim();
            const qtySold = Number(item.qty) || 1;

            if (bc) {
              // 1. Decrement in pos_inventory
              const { data: curPos } = await supabaseAdmin
                .from('pos_inventory')
                .select('quantity')
                .eq('barcode', bc)
                .single();

              if (curPos) {
                const newQty = Math.max(0, (Number(curPos.quantity) || 0) - qtySold);
                await supabaseAdmin
                  .from('pos_inventory')
                  .update({ quantity: newQty, updated_at: now })
                  .eq('barcode', bc);
              }

              // 2. Decrement in products table
              const { data: curProd } = await supabaseAdmin
                .from('products')
                .select('stock_quantity')
                .eq('barcode', bc)
                .single();

              if (curProd) {
                const newStock = Math.max(0, (Number(curProd.stock_quantity) || 0) - qtySold);
                await supabaseAdmin
                  .from('products')
                  .update({ stock_quantity: newStock, updated_at: now })
                  .eq('barcode', bc);
              }
            }
          }

          // Record sales log
          await supabaseAdmin.from('pos_sync_logs').insert({
            timestamp: now,
            type: 'sale',
            message: `Counter sale completed (${receiptNumber}) • ${items.length} items • £${Number(total).toFixed(2)} via ${paymentMethod.toUpperCase()}`,
            item_count: items.length,
          });
        } catch (dbErr) {
          console.warn('Stock decrement notice:', dbErr);
        }
      }

      return NextResponse.json({
        success: true,
        receiptNumber,
        timestamp: now,
        transaction,
        message: 'Sale completed and stock deducted successfully.',
      });
    }

    // 2. STOCK-IN / PURCHASE INVOICE ENTRY
    if (action === 'stock_in') {
      const { barcode, quantityAdded, supplier, costPrice, sellingPrice, notes } = body;

      if (!barcode || !quantityAdded) {
        return NextResponse.json({ success: false, error: 'Barcode and quantity are required' }, { status: 400 });
      }

      const bc = String(barcode).trim();
      const addQty = Math.max(1, Number(quantityAdded) || 1);
      const now = new Date().toISOString();
      let updatedItem: any = null;

      if (supabaseAdmin) {
        // 1. Update pos_inventory
        const { data: curPos } = await supabaseAdmin
          .from('pos_inventory')
          .select('*')
          .eq('barcode', bc)
          .single();

        if (curPos) {
          const newQty = (Number(curPos.quantity) || 0) + addQty;
          const updatePayload: any = {
            quantity: newQty,
            updated_at: now,
          };
          if (sellingPrice && Number(sellingPrice) > 0) {
            updatePayload.price = Number(sellingPrice);
          }

          await supabaseAdmin.from('pos_inventory').update(updatePayload).eq('barcode', bc);

          // 2. Also update products table
          const prodUpdatePayload: any = {
            stock_quantity: newQty,
            updated_at: now,
          };
          if (sellingPrice && Number(sellingPrice) > 0) {
            prodUpdatePayload.price = Number(sellingPrice);
          }

          await supabaseAdmin.from('products').update(prodUpdatePayload).eq('barcode', bc);

          updatedItem = { ...curPos, quantity: newQty, price: updatePayload.price || curPos.price };
        }

        // Log purchase entry
        await supabaseAdmin.from('pos_sync_logs').insert({
          timestamp: now,
          type: 'purchase_stock_in',
          message: `Stock In: Added ${addQty} units for barcode ${bc} (Supplier: ${supplier || 'Direct'})`,
          item_count: addQty,
        });
      }

      return NextResponse.json({
        success: true,
        message: `Successfully added ${addQty} units to stock.`,
        item: updatedItem,
      });
    }

    // 3. SALES RETURN / REFUND PROCESSING
    if (action === 'sales_return') {
      const {
        originalReceiptNumber = 'DIRECT-RETURN',
        items,
        refundMethod = 'cash',
        totalRefund,
        customerName = '',
        customerPhone = '',
        cashier = 'Admin Cashier',
        notes = '',
      } = body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ success: false, error: 'No items selected for return' }, { status: 400 });
      }

      const returnSlipNumber = `RET-${Date.now().toString().slice(-6)}`;
      const now = new Date().toISOString();
      const calculatedRefund = Number(totalRefund) || items.reduce((sum: number, it: any) => sum + (Number(it.refundAmount) || Number(it.price) * Number(it.qty)), 0);

      const returnRecord: PosReturn = {
        id: `ret-${Date.now()}`,
        timestamp: now,
        returnSlipNumber,
        originalReceiptNumber: originalReceiptNumber || 'DIRECT-RETURN',
        items: items.map((it: any) => ({
          barcode: String(it.barcode || '').trim(),
          name: String(it.name || 'Returned Item').trim(),
          price: Number(it.price) || 0,
          qty: Number(it.qty) || 1,
          refundAmount: Number(it.refundAmount) || Math.round((Number(it.price) || 0) * (Number(it.qty) || 1) * 100) / 100,
          reason: String(it.reason || 'Customer Return').trim(),
          condition: it.condition === 'damaged_waste' ? 'damaged_waste' : 'restockable',
        })),
        totalRefund: Math.round(calculatedRefund * 100) / 100,
        refundMethod: refundMethod as any,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        cashier,
        notes: notes || undefined,
      };

      inMemoryReturns.push(returnRecord);

      // Re-stock or waste log in Supabase
      if (supabaseAdmin) {
        try {
          for (const it of returnRecord.items) {
            const bc = it.barcode;
            const returnQty = it.qty;

            // Only increment inventory if condition is restockable
            if (bc && it.condition === 'restockable') {
              // 1. pos_inventory
              const { data: curPos } = await supabaseAdmin
                .from('pos_inventory')
                .select('quantity')
                .eq('barcode', bc)
                .single();

              if (curPos) {
                const restockedQty = (Number(curPos.quantity) || 0) + returnQty;
                await supabaseAdmin
                  .from('pos_inventory')
                  .update({ quantity: restockedQty, updated_at: now })
                  .eq('barcode', bc);
              }

              // 2. products
              const { data: curProd } = await supabaseAdmin
                .from('products')
                .select('stock_quantity')
                .eq('barcode', bc)
                .single();

              if (curProd) {
                const restockedStock = (Number(curProd.stock_quantity) || 0) + returnQty;
                await supabaseAdmin
                  .from('products')
                  .update({ stock_quantity: restockedStock, updated_at: now })
                  .eq('barcode', bc);
              }
            }
          }

          // Record sales return audit log
          await supabaseAdmin.from('pos_sync_logs').insert({
            timestamp: now,
            type: 'sales_return',
            message: `Sales Return processed (${returnSlipNumber}) against Ref: ${originalReceiptNumber} • ${returnRecord.items.length} items • Refunded £${returnRecord.totalRefund.toFixed(2)} via ${refundMethod.toUpperCase()}`,
            item_count: returnRecord.items.length,
          });
        } catch (dbErr) {
          console.warn('Return stock adjust error:', dbErr);
        }
      }

      return NextResponse.json({
        success: true,
        returnSlipNumber,
        timestamp: now,
        returnSlip: returnRecord,
        message: `Sales return of £${returnRecord.totalRefund.toFixed(2)} processed successfully via ${refundMethod.toUpperCase()}.`,
      });
    }

    // 4. ADMIN PROTECTED: UPDATE SINGLE PRODUCT PRICE & STOCK (MANUAL OR %)
    if (action === 'update_product_price_stock') {
      const { barcode, newPrice, newStock, reason, cashier = 'Admin Manager' } = body;

      if (!barcode) {
        return NextResponse.json({ success: false, error: 'Barcode is required' }, { status: 400 });
      }

      const bc = String(barcode).trim();
      const now = new Date().toISOString();
      let updatedData: any = {};

      if (supabaseAdmin) {
        const { data: curPos } = await supabaseAdmin
          .from('pos_inventory')
          .select('*')
          .eq('barcode', bc)
          .single();

        if (curPos) {
          const updatePayload: any = { updated_at: now };
          if (newPrice !== undefined && Number(newPrice) >= 0) {
            updatePayload.price = Number(newPrice);
          }
          if (newStock !== undefined && Number(newStock) >= 0) {
            updatePayload.quantity = Number(newStock);
          }

          await supabaseAdmin.from('pos_inventory').update(updatePayload).eq('barcode', bc);

          // Update products table (both price and offer_price so website shows updated price immediately)
          const prodPayload: any = { updated_at: now };
          if (newPrice !== undefined && Number(newPrice) >= 0) {
            prodPayload.price = Number(newPrice);
            prodPayload.offer_price = Number(newPrice);
          }
          if (newStock !== undefined && Number(newStock) >= 0) {
            prodPayload.stock_quantity = Number(newStock);
          }

          // 1. Update by barcode
          await supabaseAdmin.from('products').update(prodPayload).eq('barcode', bc);

          // 2. Also update by exact name to catch items where barcode differs
          if (curPos.description) {
            await supabaseAdmin.from('products').update(prodPayload).ilike('name', curPos.description.trim());
          }

          // Invalidate both POS and Website storefront caches immediately
          markCatalogStale();
          memoryCatalogCache = null;

          updatedData = {
            barcode: bc,
            name: curPos.description,
            oldPrice: curPos.price,
            newPrice: updatePayload.price ?? curPos.price,
            oldStock: curPos.quantity,
            newStock: updatePayload.quantity ?? curPos.quantity,
          };

          const changes = [];
          if (newPrice !== undefined) changes.push(`Price £${curPos.price} -> £${updatePayload.price}`);
          if (newStock !== undefined) changes.push(`Stock ${curPos.quantity} -> ${updatePayload.quantity}`);

          await supabaseAdmin.from('pos_sync_logs').insert({
            timestamp: now,
            type: 'admin_price_stock_edit',
            message: `Admin Price/Stock Update (${curPos.description}): ${changes.join(', ')} • Reason: ${reason || 'Manual Update'} by ${cashier}`,
            item_count: 1,
          });
        } else {
          return NextResponse.json({ success: false, error: `Product with barcode ${bc} not found.` }, { status: 404 });
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Product price and stock updated and synced successfully.',
        updatedProduct: updatedData,
      });
    }

    // 5. ADMIN PROTECTED: BULK CATEGORY % PRICE ADJUSTMENT
    if (action === 'bulk_category_price_adjustment') {
      const { category, percentChange, roundTo99p = false, cashier = 'Admin Manager' } = body;

      if (!category || percentChange === undefined) {
        return NextResponse.json({ success: false, error: 'Category and percentChange required' }, { status: 400 });
      }

      const pct = Number(percentChange);
      if (isNaN(pct) || pct < -90 || pct > 500) {
        return NextResponse.json({ success: false, error: 'Invalid percentChange value' }, { status: 400 });
      }

      const now = new Date().toISOString();
      let affectedCount = 0;

      if (supabaseAdmin) {
        let query = supabaseAdmin.from('pos_inventory').select('barcode, description, price, category');
        if (category !== 'All') {
          query = query.eq('category', category);
        }

        const { data: catItems, error: catErr } = await query.limit(4000);

        if (!catErr && catItems && catItems.length > 0) {
          for (const item of catItems) {
            const oldP = Number(item.price) || 0;
            if (oldP > 0) {
              let newP = oldP * (1 + pct / 100);
              if (roundTo99p) {
                const floorVal = Math.floor(newP);
                const decimal = newP - floorVal;
                if (decimal >= 0.75) {
                  newP = floorVal + 0.99;
                } else if (decimal >= 0.25) {
                  newP = floorVal + 0.49;
                } else {
                  newP = floorVal - 0.01 > 0 ? floorVal - 0.01 : 0.49;
                }
              }
              newP = Math.max(0.1, Math.round(newP * 100) / 100);

              const bc = String(item.barcode).trim();
              if (bc) {
                await supabaseAdmin.from('pos_inventory').update({ price: newP, updated_at: now }).eq('barcode', bc);
                await supabaseAdmin.from('products').update({ price: newP, offer_price: newP, updated_at: now }).eq('barcode', bc);
                affectedCount++;
              }
            }
          }

          markCatalogStale();
          memoryCatalogCache = null;

          // Audit log
          await supabaseAdmin.from('pos_sync_logs').insert({
            timestamp: now,
            type: 'bulk_category_price_update',
            message: `Bulk Price Adjustment: Category "${category}" changed by ${pct > 0 ? '+' : ''}${pct}% for ${affectedCount} products by ${cashier}.`,
            item_count: affectedCount,
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Successfully adjusted prices for ${affectedCount} products in category "${category}" by ${pct > 0 ? '+' : ''}${pct}%.`,
        affectedCount,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'POS operation failed' },
      { status: 500 }
    );
  }
}
