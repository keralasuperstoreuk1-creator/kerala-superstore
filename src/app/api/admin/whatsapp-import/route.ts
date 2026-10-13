import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { invalidateProductCache } from '@/app/api/products/route';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: Array<{ name: string; imageUrl: string }> = Array.isArray(body) 
      ? body 
      : (body.items || []);

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'No items provided' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: 'Database connection unavailable' }, { status: 500 });
    }

    // Fetch existing products to match by name
    const { data: dbProducts, error: fetchErr } = await supabaseAdmin
      .from('products')
      .select('id, name, slug, image_url');

    if (fetchErr || !dbProducts) {
      return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
    }

    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

    let updatedCount = 0;
    const matchLog: Array<{ whatsappName: string; matchedProduct: string; id: string }> = [];

    for (const item of items) {
      if (!item.name || !item.imageUrl) continue;
      const cleanWa = normalize(item.name);
      const waWords = cleanWa.split(' ').filter(w => w.length > 2);

      // Find best matching product
      let bestMatch: any = null;
      let highestScore = 0;

      for (const prod of dbProducts) {
        const cleanProd = normalize(prod.name);
        if (cleanProd === cleanWa) {
          bestMatch = prod;
          highestScore = 100;
          break;
        }

        const prodWords = new Set(cleanProd.split(' '));
        const commonWords = waWords.filter(w => prodWords.has(w));
        const score = commonWords.length;

        if (score >= 2 && score > highestScore) {
          highestScore = score;
          bestMatch = prod;
        }
      }

      if (bestMatch && item.imageUrl.startsWith('http')) {
        // STRICT RULE: Update ONLY image_url. Do NOT touch price, stock, or any other field!
        const { error: updateErr } = await supabaseAdmin
          .from('products')
          .update({
            image_url: item.imageUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', bestMatch.id);

        if (!updateErr) {
          updatedCount++;
          matchLog.push({
            whatsappName: item.name,
            matchedProduct: bestMatch.name,
            id: bestMatch.id
          });
        }
      }
    }

    invalidateProductCache();

    return NextResponse.json({
      success: true,
      totalReceived: items.length,
      updatedCount,
      matches: matchLog.slice(0, 50)
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Sync error' }, { status: 500 });
  }
}
