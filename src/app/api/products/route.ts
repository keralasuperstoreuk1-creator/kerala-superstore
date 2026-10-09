import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedProductCatalog, matchProductToCategory, saveDynamicProducts, getDynamicProducts } from '@/lib/product-catalog';
import { supabaseAdmin } from '@/lib/supabase';
import { Product } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q')?.toLowerCase();
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const limit = parseInt(searchParams.get('limit') || '5000', 10);

    // 1. Try Supabase Cloud Database first
    if (supabaseAdmin) {
      try {
        let query = supabaseAdmin
          .from('products')
          .select('*')
          .eq('status', 'published');

        if (search) {
          query = query.ilike('name', `%${search}%`);
        }
        if (category) {
          query = query.or(`category_slug.eq.${category},category.ilike.%${category}%`);
        }
        if (brand) {
          query = query.ilike('brand', `%${brand}%`);
        }

        const { data: dbProducts, error } = await query.limit(limit);

        if (!error && dbProducts && dbProducts.length > 0) {
          const mapped: Product[] = dbProducts.map((p: any) => ({
            id: p.id || `prod-${p.slug}`,
            name: p.name,
            slug: p.slug,
            brand: p.brand || 'Kerala Superstore',
            category: p.category || 'General Grocery',
            categorySlug: p.category_slug || 'grocery',
            sizeWeight: p.size_weight || 'Standard',
            price: Number(p.price) || 0,
            offerPrice: p.offer_price ? Number(p.offer_price) : undefined,
            stock: Number(p.stock_quantity) || 0,
            lowStockThreshold: Number(p.low_stock_threshold) || 5,
            barcode: p.barcode,
            description: p.description || '',
            tags: p.tags || [],
            imageUrl: p.image_url || '/products/matta-rice.png',
            status: p.status || 'published',
            createdAt: p.created_at || new Date().toISOString()
          }));

          return NextResponse.json({
            success: true,
            total: mapped.length,
            products: mapped,
            source: 'supabase'
          });
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
    if (Array.isArray(body)) {
      saveDynamicProducts(body);
      const unified = getUnifiedProductCatalog();
      return NextResponse.json({ success: true, count: unified.length, products: unified });
    } else if (body && body.product) {
      const dynamic = getDynamicProducts();
      const existingIdx = dynamic.findIndex(p => p.id === body.product.id || (p.barcode && p.barcode === body.product.barcode));
      if (existingIdx >= 0) {
        dynamic[existingIdx] = { ...dynamic[existingIdx], ...body.product };
      } else {
        dynamic.push(body.product);
      }
      saveDynamicProducts(dynamic);
      const unified = getUnifiedProductCatalog();
      return NextResponse.json({ success: true, product: body.product, products: unified });
    }
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Save failed' }, { status: 500 });
  }
}

