import { NextRequest, NextResponse } from 'next/server';
import { searchProductImages, searchProductGoogleImage, buildProductSearchQuery } from '@/lib/serper';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name') || searchParams.get('q') || '';
    const brand = searchParams.get('brand') || '';
    const limit = parseInt(searchParams.get('limit') || '8', 10);

    if (!name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Product name or query is required' },
        { status: 400 }
      );
    }

    const searchQuery = buildProductSearchQuery(name, brand);
    const images = await searchProductImages(name, brand, limit);

    return NextResponse.json({
      success: true,
      query: searchQuery,
      count: images.length,
      images,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to search images' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = body.name || body.query || body.q || '';
    const brand = body.brand || '';
    const limit = body.limit ? parseInt(String(body.limit), 10) : 8;

    if (!name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Product name or query is required' },
        { status: 400 }
      );
    }

    const searchQuery = buildProductSearchQuery(name, brand);
    const images = await searchProductImages(name, brand, limit);

    return NextResponse.json({
      success: true,
      query: searchQuery,
      count: images.length,
      images,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to search images' },
      { status: 500 }
    );
  }
}
