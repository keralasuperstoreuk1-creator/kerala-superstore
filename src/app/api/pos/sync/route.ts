import { NextRequest, NextResponse } from 'next/server';
import { getPosSyncState, applyPosInventorySync, PosSyncItem } from '@/lib/pos-sync-store';
import { upsertPosProductsToCatalog, getUnifiedProductCatalog, autoEnrichPosProduct } from '@/lib/product-catalog';
import { supabaseAdmin } from '@/lib/supabase';
import { searchProductGoogleImage } from '@/lib/serper';
import { isR2Configured, saveJsonToR2, getJsonFromR2 } from '@/lib/cloudflare-r2';
import { saveStoredTransactions } from '@/lib/pos-transactions-store';

const DEFAULT_POS_SECRET = process.env.POS_SYNC_SECRET || 'kss_pos_sync_key_2026_live';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('x-pos-sync-key') || req.headers.get('authorization')?.replace('Bearer ', '');
    const { searchParams } = new URL(req.url);
    const isSummary = searchParams.get('summary') === 'true';

    // 1. Check Supabase first if available
    if (supabaseAdmin) {
      try {
        const { count: totalSynced, error: countErr } = await supabaseAdmin
          .from('pos_inventory')
          .select('*', { count: 'exact', head: true });

        if (!countErr && totalSynced !== null && totalSynced > 0) {
          const { count: inStock } = await supabaseAdmin
            .from('pos_inventory')
            .select('*', { count: 'exact', head: true })
            .gt('quantity', 0);

          const { data: latestLogs } = await supabaseAdmin
            .from('pos_sync_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(20);

          const lastSyncTime = latestLogs && latestLogs.length > 0 ? latestLogs[0].timestamp : new Date().toISOString();
          const isConnected = lastSyncTime
            ? Date.now() - new Date(lastSyncTime).getTime() < 5 * 60 * 1000
            : false;

          const outOfStock = Math.max(0, totalSynced - (inStock || 0));

          if (isSummary) {
            return NextResponse.json({
              success: true,
              isConnected,
              lastSyncTime,
              totalSyncedItems: totalSynced,
              inStockCount: inStock || 0,
              outOfStockCount: outOfStock,
            });
          }

          const { data: samples } = await supabaseAdmin
            .from('pos_inventory')
            .select('*')
            .limit(10);

          return NextResponse.json({
            success: true,
            isConnected,
            lastSyncTime,
            totalSyncedItems: totalSynced,
            inStockCount: inStock || 0,
            outOfStockCount: outOfStock,
            recentLogs: (latestLogs || []).map(l => ({
              timestamp: l.timestamp,
              type: l.type,
              message: l.message,
              itemCount: l.item_count
            })),
            sampleItems: samples || [],
          });
        }
      } catch (err) {
        console.warn('Supabase query error, falling back to local store:', err);
      }
    }

    // 2. Fallback to local store
    const state = getPosSyncState();
    const isConnected = state.lastSyncTime
      ? Date.now() - new Date(state.lastSyncTime).getTime() < 5 * 60 * 1000
      : false;

    if (isSummary) {
      return NextResponse.json({
        success: true,
        isConnected,
        lastSyncTime: state.lastSyncTime,
        totalSyncedItems: state.totalSyncedItems,
        inStockCount: state.inStockCount,
        outOfStockCount: state.outOfStockCount,
      });
    }

    return NextResponse.json({
      success: true,
      isConnected,
      lastSyncTime: state.lastSyncTime,
      totalSyncedItems: state.totalSyncedItems,
      inStockCount: state.inStockCount,
      outOfStockCount: state.outOfStockCount,
      recentLogs: state.recentLogs.slice(0, 20),
      sampleItems: Object.values(state.syncedInventory).slice(0, 10),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('x-pos-sync-key') || req.headers.get('authorization')?.replace('Bearer ', '');
    
    // Validate secret key
    if (!authHeader || authHeader !== DEFAULT_POS_SECRET) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized: Invalid or missing X-POS-SYNC-KEY header.' 
        },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Check payload type
    if (body.type === 'ping') {
      const state = getPosSyncState();
      return NextResponse.json({
        success: true,
        message: 'POS Agent connected successfully.',
        serverTime: new Date().toISOString(),
        totalSyncedItems: state.totalSyncedItems,
      });
    }

    // Extract items array and sales array
    let items: PosSyncItem[] = [];
    if (Array.isArray(body)) {
      items = body;
    } else if (Array.isArray(body.items)) {
      items = body.items;
    } else if (body.item) {
      items = [body.item];
    }

    const sales = Array.isArray(body.sales) ? body.sales : [];

    if ((!items || items.length === 0) && sales.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No items or sales provided in sync payload.' },
        { status: 400 }
      );
    }

    const source = body.source || 'RetailV2-POS (Manchester)';
    const now = new Date().toISOString();

    // 0. Process Synced Store Sales (RetailV2 Transactions -> Web POS Daily Report)
    let syncedSalesCount = 0;
    if (sales.length > 0) {
      const syncedSales = sales.map((s: any) => {
        const rawItems = Array.isArray(s.items) && s.items.length > 0 ? s.items : [];
        const items = rawItems.length > 0
          ? rawItems.map((it: any) => {
              const p = Number(it.price) || 0;
              const q = Number(it.qty) || 1;
              const t = Number(it.total) > 0 ? Number(it.total) : Number((p * q).toFixed(2));
              return {
                barcode: String(it.barcode || ''),
                name: String(it.name || it.description || 'Grocery Item'),
                price: p,
                qty: q,
                total: t,
                vat: Number(it.vat || it.vatRate || 0),
              };
            })
          : [{ barcode: '', name: `Store Sale (${s.itemCount || 1} items)`, price: Number(s.totalAmount) || 0, qty: 1, total: Number(s.totalAmount) || 0, vat: 0 }];

        const itemsSum = Number(items.reduce((acc: number, it: any) => acc + (Number(it.total) || 0), 0).toFixed(2));
        const resolvedTotal = Number(s.totalAmount) > 0 ? Number(s.totalAmount) : (Number(s.total) > 0 ? Number(s.total) : itemsSum);

        let calculatedVat = 0;
        items.forEach((it: any) => {
          if (it.vat > 0) {
            calculatedVat += (Number(it.total) || 0) * (it.vat / (100 + it.vat));
          }
        });
        calculatedVat = Number(calculatedVat.toFixed(2));
        const resolvedVat = Number(s.vatTotal) > 0 ? Number(s.vatTotal) : calculatedVat;
        const resolvedSubtotal = Number(s.subtotal) > 0 ? Number(s.subtotal) : Number((resolvedTotal - resolvedVat).toFixed(2));

        const rNum = String(s.receiptNumber || (s.tranId ? (String(s.tranId).startsWith('RFT-') ? s.tranId : `RFT-${s.tranId}`) : `RFT-${Date.now()}`));

        return {
          id: `ret-${s.tranId || Date.now()}`,
          receiptNumber: rNum,
          timestamp: s.date ? new Date(s.date).toISOString() : now,
          items,
          subtotal: resolvedSubtotal,
          vatTotal: resolvedVat,
          total: resolvedTotal,
          paymentMethod: (Number(s.card) > 0 || String(s.paymentMethod).toLowerCase() === 'card') ? 'card' : 'cash',
          cashTendered: Number(s.cash || s.cashTendered || (Number(s.card) > 0 ? 0 : resolvedTotal)),
          changeDue: Number(s.change || s.changeDue || 0),
          cashier: s.cashier || `Till #${s.tillId || 1} (Staff ${s.userCode || 1})`,
        };
      });

      syncedSalesCount = syncedSales.length;

      // Persistently record sales in Memory + Disk + R2
      try {
        await saveStoredTransactions(syncedSales as any);
      } catch (saveErr) {
        console.warn('Could not save synced sales to transactions store:', saveErr);
      }

      if (supabaseAdmin) {
        try {
          await supabaseAdmin.from('pos_sync_logs').insert({
            timestamp: now,
            type: 'sale',
            message: `Synced ${syncedSales.length} live sales tickets from ${source}`,
            item_count: syncedSales.length,
          });
        } catch (sbErr) {
          console.warn('Supabase sales log notice:', sbErr);
        }
      }
    }

    if (!items || items.length === 0) {
      return NextResponse.json({
        success: true,
        message: `Successfully processed ${syncedSalesCount} store sales transactions.`,
        syncedSalesCount,
      });
    }

    // 1. Update POS Inventory Sync State (File Fallback)
    const updatedState = applyPosInventorySync(items, source);

    // 2. Auto-Enrich & Upsert into Website Product Catalog
    const { updatedCount, newCount } = upsertPosProductsToCatalog(items);

    // 3. Supabase Cloud Database Direct Mirror (Permanent Cloud Storage!)
    if (supabaseAdmin) {
      try {
        const posRows = items
          .filter(i => i.barcode)
          .map(i => ({
            barcode: String(i.barcode).trim(),
            sku: i.sku ? String(i.sku) : null,
            description: i.description || 'Kerala Grocery Product',
            quantity: Number(i.quantity) || 0,
            price: Number(i.price) || 0,
            web_price: i.webPrice ? Number(i.webPrice) : null,
            active: i.active !== false,
            updated_at: now
          }));

        if (posRows.length > 0) {
          await supabaseAdmin
            .from('pos_inventory')
            .upsert(posRows, { onConflict: 'barcode' });
        }

        // Also enrich and upsert into products table with Google Images via Serper
        const productRows = await Promise.all(
          items
            .filter(i => i.barcode && i.description)
            .map(async i => {
              const enriched = autoEnrichPosProduct(i);
              let imgUrl = enriched.imageUrl;
              // If image is a local placeholder, attempt Google Image search by brand + name
              if (!imgUrl || !imgUrl.startsWith('http')) {
                try {
                  const googleImg = await searchProductGoogleImage(enriched.name, enriched.brand);
                  if (googleImg) {
                    imgUrl = googleImg;
                  }
                } catch {
                  // Keep fallback on error
                }
              }
              return {
                name: enriched.name,
                slug: enriched.slug,
                size_weight: enriched.sizeWeight,
                price: enriched.price,
                offer_price: enriched.offerPrice || null,
                stock_quantity: Math.max(0, Math.floor(enriched.stock)),
                barcode: enriched.barcode,
                description: enriched.description,
                image_url: imgUrl,
                tags: enriched.tags,
                status: enriched.status,
                updated_at: now
              };
            })
        );

        if (productRows.length > 0) {
          await supabaseAdmin
            .from('products')
            .upsert(productRows, { onConflict: 'slug' });
        }

        // Record live sync log in Supabase
        await supabaseAdmin
          .from('pos_sync_logs')
          .insert({
            timestamp: now,
            type: 'success',
            message: `Received ${items.length} items from ${source}`,
            item_count: items.length
          });
      } catch (sbErr) {
        console.warn('Supabase mirror sync notice:', sbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${items.length} items (${newCount} new products added to web catalog, ${updatedCount} stock levels updated).`,
      processedCount: items.length,
      newProductsCreated: newCount,
      existingProductsUpdated: updatedCount,
      totalSyncedItems: updatedState.totalSyncedItems,
      inStockCount: updatedState.inStockCount,
      outOfStockCount: updatedState.outOfStockCount,
      lastSyncTime: updatedState.lastSyncTime,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to process POS sync payload.' },
      { status: 500 }
    );
  }
}
