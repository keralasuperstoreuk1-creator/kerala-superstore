import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedProductCatalog } from '@/lib/product-catalog';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q')?.toLowerCase();
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    let products = getUnifiedProductCatalog();

    if (category) {
      products = products.filter(
        (p) => p.categorySlug === category || p.category.toLowerCase() === category.toLowerCase()
      );
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
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
