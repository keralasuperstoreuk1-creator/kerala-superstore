import { NextRequest, NextResponse } from 'next/server';
import { getPosSyncState, applyPosInventorySync, PosSyncItem } from '@/lib/pos-sync-store';
import { upsertPosProductsToCatalog, getUnifiedProductCatalog } from '@/lib/product-catalog';

const DEFAULT_POS_SECRET = process.env.POS_SYNC_SECRET || 'kss_pos_sync_key_2026_live';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('x-pos-sync-key') || req.headers.get('authorization')?.replace('Bearer ', '');
    const state = getPosSyncState();

    // If query contains ?summary=true, return compact summary
    const { searchParams } = new URL(req.url);
    const isSummary = searchParams.get('summary') === 'true';

    // Check if synced recently (within last 5 minutes)
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

    // Extract items array
    let items: PosSyncItem[] = [];
    if (Array.isArray(body)) {
      items = body;
    } else if (Array.isArray(body.items)) {
      items = body.items;
    } else if (body.item) {
      items = [body.item];
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No items provided in sync payload.' },
        { status: 400 }
      );
    }

    const source = body.source || 'RetailV2-POS (Manchester)';
    
    // 1. Update POS Inventory Sync State (Stock & Qty Tracking)
    const updatedState = applyPosInventorySync(items, source);

    // 2. Auto-Enrich & Upsert into Website Product Catalog (Auto create new products if missing!)
    const { updatedCount, newCount } = upsertPosProductsToCatalog(items);

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
