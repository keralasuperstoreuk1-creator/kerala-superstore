/**
 * Serper.dev Google Images Integration for Kerala Superstore UK
 * Fetches authentic product packaging photos using Brand + Item Name
 */

const DEFAULT_SERPER_API_KEY = '5c71895da3ddd6f6e287859051a486a50ddb9b79';

export interface GoogleImageResult {
  title: string;
  imageUrl: string;
  source?: string;
  width?: number;
  height?: number;
}

/**
 * Builds an optimized Google search query using Brand and Item Name
 */
export function buildProductSearchQuery(name: string, brand?: string): string {
  let cleanName = (name || '').trim();

  // Strip POS trailing internal codes like " MT", " MC", " GV", " FL", " KT" at end of name
  cleanName = cleanName.replace(/\s+(MT|MC|GV|FL|KT|RR|HD|A1)$/i, '').trim();

  // Extract brand if name begins with known brand
  let cleanBrand = (brand || '').trim();
  if (cleanBrand === 'Kerala Superstore' || cleanBrand === 'Standard' || cleanBrand === 'Generic') {
    cleanBrand = '';
  }

  // If brand is "KT", expand to "Kitchen Treasures"
  if (cleanBrand.toUpperCase() === 'KT') {
    cleanBrand = 'Kitchen Treasures';
  }

  let fullQuery = '';
  if (cleanBrand && !new RegExp(`\\b${cleanBrand}\\b`, 'i').test(cleanName)) {
    fullQuery = `${cleanBrand} ${cleanName}`;
  } else {
    fullQuery = cleanName;
  }

  // Add packaging / packet hint for grocery packshots
  if (!/packaging|packet|pouch|bottle|jar|box/i.test(fullQuery)) {
    fullQuery = `${fullQuery} packet packaging`;
  }

  return fullQuery.trim();
}

/**
 * Fetches multiple Google image candidates from Serper.dev
 */
export async function searchProductImages(
  name: string,
  brand?: string,
  limit: number = 6
): Promise<GoogleImageResult[]> {
  const apiKey = process.env.SERPER_API_KEY || DEFAULT_SERPER_API_KEY;
  if (!apiKey) {
    console.warn('Serper API key not configured');
    return [];
  }

  const query = buildProductSearchQuery(name, brand);
  if (!query) return [];

  try {
    const res = await fetch('https://google.serper.dev/images', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: Math.max(limit, 6),
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.warn(`Serper API error: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const images: any[] = data.images || [];

    const results: GoogleImageResult[] = [];
    for (const item of images) {
      const u = item.imageUrl || '';
      if (!u || !u.startsWith('http')) continue;

      // Filter out untrusted / broken formats
      if (/\.(svg|ico)$/i.test(u)) continue;

      results.push({
        title: item.title || cleanQueryTitle(query),
        imageUrl: u,
        source: item.source || item.domain || 'Google',
        width: item.imageWidth,
        height: item.imageHeight,
      });

      if (results.length >= limit) break;
    }

    return results;
  } catch (err) {
    console.error('Serper search error:', err);
    return [];
  }
}

/**
 * Returns single best Google packshot image URL for a product
 */
export async function searchProductGoogleImage(
  name: string,
  brand?: string
): Promise<string | null> {
  const results = await searchProductImages(name, brand, 4);
  if (results.length === 0) return null;

  // Prefer images from common retail / e-commerce CDNs or clear extensions
  const preferred = results.find(
    (r) =>
      r.imageUrl.includes('media-amazon') ||
      r.imageUrl.includes('walmart') ||
      r.imageUrl.includes('indiamart') ||
      r.imageUrl.includes('bigbasket') ||
      r.imageUrl.includes('jiomart') ||
      r.imageUrl.includes('shopify') ||
      r.imageUrl.includes('cloudinary') ||
      r.imageUrl.includes('cdn') ||
      /\.(jpg|jpeg|png|webp)$/i.test(r.imageUrl)
  );

  return preferred ? preferred.imageUrl : results[0].imageUrl;
}

function cleanQueryTitle(query: string): string {
  return query.replace(/\s+packet packaging/i, '');
}
