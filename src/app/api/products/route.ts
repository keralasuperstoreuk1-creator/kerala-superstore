import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedProductCatalog, matchProductToCategory, saveDynamicProducts, getDynamicProducts, getCatalogStaleTimestamp } from '@/lib/product-catalog';
import { supabaseAdmin } from '@/lib/supabase';
import { Product } from '@/types';
import { searchProductGoogleImage } from '@/lib/serper';

// In-memory catalog cache for lightning fast responses (< 10ms)
let cachedCatalog: Product[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

export function invalidateProductCache() {
  cachedCatalog = null;
  lastCacheTime = 0;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q')?.toLowerCase();
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const limit = parseInt(searchParams.get('limit') || '5000', 10);

    const isFullCatalogRequest = !search && !category && !brand;

    // Check fast in-memory cache first (invalidated immediately if admin updates price/stock)
    if (isFullCatalogRequest && cachedCatalog && (Date.now() - lastCacheTime < CACHE_TTL_MS) && lastCacheTime > getCatalogStaleTimestamp()) {
      return NextResponse.json(
        {
          success: true,
          total: cachedCatalog.length,
          products: cachedCatalog.slice(0, limit),
          source: 'cache'
        },
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        }
      );
    }

    // 1. Try Supabase Cloud Database first
    if (supabaseAdmin) {
      try {
        const dbProducts: any[] = [];
        const PAGE_SIZE = 1000;
        let offset = 0;

        if (search) {
          const { data, error } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('status', 'published')
            .ilike('name', `%${search}%`)
            .limit(1000);
          if (!error && data) dbProducts.push(...data);
        } else {
          // Full catalog or category fetch: paginate to load all store products (2,977+)
          while (true) {
            const { data, error } = await supabaseAdmin
              .from('products')
              .select('*')
              .eq('status', 'published')
              .range(offset, offset + PAGE_SIZE - 1);
            if (error || !data || data.length === 0) break;
            dbProducts.push(...data);
            if (data.length < PAGE_SIZE) break;
            offset += PAGE_SIZE;
            if (offset > 10000) break;
          }
        }

        if (dbProducts && dbProducts.length > 0) {
          let mapped: Product[] = dbProducts.map((p: any) => {
            let detectedBrand = 'Kerala Superstore';
            if (p.tags && Array.isArray(p.tags) && p.tags.length > 0) {
              const brandTag = p.tags.find((t: string) => !['religious', 'statue', 'christian', 'catholic'].includes(String(t).toLowerCase()));
              if (brandTag) detectedBrand = brandTag;
            }
            if (/zion/i.test(p.name || '') || (p.tags && Array.isArray(p.tags) && p.tags.some((t: string) => /zion/i.test(t)))) {
              detectedBrand = 'Zion Arts';
            }

            let category = p.category || 'General Grocery';
            let categorySlug = p.category_slug || 'grocery';

            // Detect Religious category from tags or product name
            const isReligious = (p.tags && Array.isArray(p.tags) && p.tags.some((t: string) => /religious|statue|christian|church|altar|prayer/i.test(t))) ||
              /\b(statue|mother mary|child jesus|holy family|praying angel)\b/i.test(p.name || '');

            if (isReligious) {
              category = 'Religious';
              categorySlug = 'religious';
            }

            const price = Number(p.price) || 0;
            const offerPriceNum = p.offer_price ? Number(p.offer_price) : undefined;
            // Only consider offerPrice if it's strictly a discount lower than selling price
            const validOffer = offerPriceNum !== undefined && offerPriceNum < price ? offerPriceNum : undefined;

            return {
              id: p.id || `prod-${p.slug}`,
              name: p.name,
              slug: p.slug,
              brand: detectedBrand,
              category,
              categorySlug,
              sizeWeight: p.size_weight || 'Standard',
              price,
              offerPrice: validOffer,
              stock: Number(p.stock_quantity) || 0,
              lowStockThreshold: Number(p.low_stock_threshold) || 5,
              barcode: p.barcode,
              description: p.description || '',
              tags: p.tags || [],
              imageUrl: p.image_url || '/products/matta-rice.png',
              status: p.status || 'published',
              createdAt: p.created_at || new Date().toISOString()
            };
          });

          if (isFullCatalogRequest) {
            cachedCatalog = mapped;
            lastCacheTime = Date.now();
          }

          if (category) {
            mapped = mapped.filter((p) => matchProductToCategory(p, category));
          }
          if (brand) {
            mapped = mapped.filter((p) => (p.brand || '').toLowerCase() === brand.toLowerCase());
          }

          return NextResponse.json(
            {
              success: true,
              total: mapped.length,
              products: mapped.slice(0, limit),
              source: 'supabase'
            },
            {
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate'
              }
            }
          );
        }
      } catch (sbErr) {
        console.warn('Supabase products fetch fallback:', sbErr);
      }
    }

    // 2. Fallback to Local Unified Catalog
    let products = getUnifiedProductCatalog();

    if (category) {
      products = products.filter((p) => matchProductToCategory(p, category));
    }

    if (brand) {
      products = products.filter(
        (p) => p.brand.toLowerCase() === brand.toLowerCase()
      );
    }

    if (search) {
      products = products.filter((p) => {
        const titleMatch = p.name.toLowerCase().includes(search);
        const brandMatch = p.brand.toLowerCase().includes(search);
        const catMatch = p.category.toLowerCase().includes(search);
        const barcodeMatch = p.barcode ? p.barcode.includes(search) : false;
        const tagMatch = p.tags ? p.tags.some(t => t.toLowerCase().includes(search)) : false;
        return titleMatch || brandMatch || catMatch || barcodeMatch || tagMatch;
      });
    }

    return NextResponse.json({
      success: true,
      total: products.length,
      products: products.slice(0, limit),
      source: 'local'
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    invalidateProductCache();

    if (Array.isArray(body)) {
      saveDynamicProducts(body);
      const unified = getUnifiedProductCatalog();
      return NextResponse.json({ success: true, count: unified.length, products: unified });
    } else if (body && body.product) {
      const prod = { ...body.product };

      // Auto-fetch Google Image if image is empty or local placeholder
      if (!prod.imageUrl || !prod.imageUrl.startsWith('http')) {
        try {
          const googleImg = await searchProductGoogleImage(prod.name, prod.brand);
          if (googleImg) {
            prod.imageUrl = googleImg;
          }
        } catch {
          // ignore error
        }
      }

      const dynamic = getDynamicProducts();
      const existingIdx = dynamic.findIndex(p => p.id === prod.id || (p.barcode && p.barcode === prod.barcode));
      if (existingIdx >= 0) {
        dynamic[existingIdx] = { ...dynamic[existingIdx], ...prod };
      } else {
        dynamic.push(prod);
      }
      saveDynamicProducts(dynamic);

      // Also mirror to Supabase if available
      if (supabaseAdmin) {
        try {
          await supabaseAdmin.from('products').upsert({
            name: prod.name,
            slug: prod.slug || prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            size_weight: prod.sizeWeight || 'Standard',
            price: Number(prod.price) || 0,
            offer_price: prod.offerPrice ? Number(prod.offerPrice) : null,
            stock_quantity: Math.max(0, Math.floor(Number(prod.stock) || 0)),
            barcode: prod.barcode || null,
            description: prod.description || '',
            image_url: prod.imageUrl || '/products/matta-rice.png',
            tags: prod.tags || (prod.brand ? [prod.brand] : []),
            status: prod.status || 'published',
            updated_at: new Date().toISOString()
          }, { onConflict: 'slug' });
        } catch (sbErr) {
          console.warn('Supabase product mirror error:', sbErr);
        }
      }

      const unified = getUnifiedProductCatalog();
      return NextResponse.json({ success: true, product: prod, products: unified });
    }
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Save failed' }, { status: 500 });
  }
}

