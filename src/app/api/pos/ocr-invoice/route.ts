import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isNonFoodOrToiletries } from '@/lib/product-matching';
import { markCatalogStale } from '@/lib/product-catalog';

const DEFAULT_GEMINI_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBn7A1Zb371H5iBXytz0RIjqUcKZAA5csQ';
let memoryCachedApiKey = '';

// Category-based default profit margin percentages
const DEFAULT_CATEGORY_MARGINS: Record<string, number> = {
  'Spices & Masalas': 35,
  'Rice & Flours': 20,
  'Pulses & Dal': 25,
  'Snacks & Bakery': 30,
  'Oils & Ghee': 20,
  'Fish & Meat': 25,
  'Frozen Foods': 28,
  'Tea & Coffee': 25,
  'Household & Toiletries': 35,
  'General Grocery': 25,
};

interface InvoiceParsedItem {
  id: string;
  description: string;
  matchedName?: string;
  matchedBarcode?: string;
  sizeWeight?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  category: string;
  profitMarginPercent: number;
  sellingPrice: number;
  expectedProfit: number;
  currentStock?: number;
  currentPrice?: number;
  isExistingStock?: boolean;
  matchScore?: number;
  matchType?: 'barcode' | 'intelligent_matcher' | 'new_item';
  suggestions?: Array<{ barcode: string; name: string; stock: number; price: number; score: number }>;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || 'ocr_scan';

    // 0. ACTION: SAVE & CACHE API KEY
    if (action === 'save_key') {
      const key = String(body.apiKey || '').trim();
      if (key) {
        memoryCachedApiKey = key;
      }
      return NextResponse.json({ success: true, message: 'Gemini API key saved in active session.' });
    }

    // 1. ACTION: CONFIRM BULK INVOICE IMPORT INTO SUPABASE POS & WEBSITE
    if (action === 'save_invoice') {
      const { items, supplierName, invoiceNumber, invoiceDate } = body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ success: false, error: 'No items provided to import.' }, { status: 400 });
      }

      const now = new Date().toISOString();
      let updatedCount = 0;
      let newCount = 0;

      if (supabaseAdmin) {
        for (const item of items) {
          const bc = String(item.matchedBarcode || item.barcode || '').trim();
          const addQty = Math.max(1, Number(item.quantity) || 1);
          const newPrice = Number(item.sellingPrice) || Number(item.price) || 0;

          if (bc) {
            // 1. Update pos_inventory
            const { data: curPos } = await supabaseAdmin
              .from('pos_inventory')
              .select('quantity, price')
              .eq('barcode', bc)
              .single();

            if (curPos) {
              const updatedQty = (Number(curPos.quantity) || 0) + addQty;
              await supabaseAdmin
                .from('pos_inventory')
                .update({
                  quantity: updatedQty,
                  price: newPrice > 0 ? newPrice : curPos.price,
                  updated_at: now,
                })
                .eq('barcode', bc);
              updatedCount++;
            } else {
              // Insert as new inventory item
              await supabaseAdmin.from('pos_inventory').insert({
                barcode: bc,
                description: item.description || item.name || 'Kerala Grocery Item',
                quantity: addQty,
                price: newPrice,
                category: item.category || 'General Grocery',
                active: true,
                updated_at: now,
              });
              newCount++;
            }

            // 2. Also update products table (both price and offer_price so website syncs immediately)
            const { data: curProd } = await supabaseAdmin
              .from('products')
              .select('id, stock_quantity, price')
              .eq('barcode', bc)
              .single();

            const prodPayload: any = {
              stock_quantity: curProd ? (Number(curProd.stock_quantity) || 0) + addQty : addQty,
              updated_at: now,
            };
            if (newPrice > 0) {
              prodPayload.price = newPrice;
              prodPayload.offer_price = newPrice;
            }

            if (curProd) {
              await supabaseAdmin
                .from('products')
                .update(prodPayload)
                .eq('barcode', bc);
            } else if (item.description || item.name) {
              await supabaseAdmin
                .from('products')
                .update(prodPayload)
                .ilike('name', (item.description || item.name).trim());
            }

            // Invalidate website catalog cache
            markCatalogStale();
          }
        }

        // Record purchase sync log
        await supabaseAdmin.from('pos_sync_logs').insert({
          timestamp: now,
          type: 'purchase_invoice_ocr',
          message: `AI OCR Invoice imported (${invoiceNumber || 'INV-DIRECT'}) from ${supplierName || 'Wholesaler'}: ${items.length} items updated with profit margins.`,
          item_count: items.length,
        });
      }

      return NextResponse.json({
        success: true,
        message: `Successfully imported ${items.length} invoice items (${updatedCount} updated, ${newCount} created) into POS and website!`,
        updatedCount,
        newCount,
      });
    }

    // 2. ACTION: OCR SCAN INVOICE VIA GEMINI MULTIMODAL API
    const {
      imageBase64,
      mimeType = 'image/jpeg',
      customApiKey = '',
      categoryMargins = {},
      defaultProfitMargin = 25,
    } = body;

    if (!imageBase64) {
      return NextResponse.json({ success: false, error: 'Invoice image is required' }, { status: 400 });
    }

    const apiKey = customApiKey.trim() || memoryCachedApiKey || DEFAULT_GEMINI_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Gemini API key is required. Please enter your Gemini API key in the input box.',
      }, { status: 400 });
    }

    // Merge default and custom category margins
    const activeMargins = { ...DEFAULT_CATEGORY_MARGINS, ...categoryMargins };

    const prompt = `You are an expert UK Indian/Kerala Grocery invoice auditor and OCR specialist.
Examine this scanned paper wholesale purchase invoice, receipt, delivery note, or bill image.
Known UK Indian/Kerala Wholesalers include: 7's TRADING LTD (Stevenage), Graviss UK Pvt Ltd (Manchester), Home Foods Asia Ltd (Liverpool), Kairali Foods Ltd (Manchester), TRS Wholesale UK, Eastern UK, Heera Wholesale, Natco Foods UK, Double Horse UK.
Extract the header details and all line items accurately.

Return ONLY a valid JSON object with the following structure:
{
  "supplierName": "Name of wholesaler / supplier (e.g. 7's Trading Ltd, Graviss UK, Home Foods Asia, Kairali Foods, TRS Wholesale, Eastern UK)",
  "invoiceNumber": "Invoice or Bill reference number (e.g. 20166, 0526549, 13126, 4118)",
  "invoiceDate": "Date on the invoice (YYYY-MM-DD or DD/MM/YYYY)",
  "currency": "GBP",
  "items": [
    {
      "description": "Clean retail product title without wholesale case suffix (e.g. BR Chutney Powder 100g, Ajmi Idiyappam Podi 1kg, Thekkans Coconut Oil 1L, Yippee Magic Masala Noodles 280g, Mayil Matta 10kg, PF Matta Rice 10kg, Prime Idli Dosa Batter 1kg)",
      "sizeWeight": "Pack weight or volume (e.g. 100g, 160g, 200g, 280g, 400g, 500g, 750g, 1kg, 2kg, 5kg, 10kg, 1L, 750ml)",
      "quantity": 12,
      "unitCost": 3.99,
      "totalCost": 47.99,
      "barcode": "Barcode if printed on the invoice, else empty string",
      "category": "One of: Spices & Masalas, Rice & Flours, Pulses & Dal, Snacks & Bakery, Oils & Ghee, Fish & Meat, Frozen Foods, Tea & Coffee, Household & Toiletries, General Grocery"
    }
  ]
}

CRITICAL WHOLESALE CASE-PACKING RULES:
Wholesale suppliers in the UK frequently bill by outer case or box pack, for example:
1. "THEKKANS COCONUT OIL 1LTRX12" with Qty 1 at rate 47.99 -> There are 12 bottles of 1L in the case. Set quantity = 12, unitCost = 4.00, totalCost = 47.99.
2. "AJMI IDIYAPPAM PODI 10X1KG" with Qty 1 at rate 18.99 -> There are 10 packets of 1kg in the box. Set quantity = 10, unitCost = 1.90, totalCost = 18.99.
3. "BR SAMBAR POWDER 160GMX20" with Qty 0.50 at rate 39.99 (Amount £20.00) -> 0.50 of a 20-pack box = 10 packets. Set quantity = 10, unitCost = 2.00, totalCost = 20.00.
4. "YIPEE MAGIC MASALA NOODLES 280G X 24 PKTS" with Qty 1 at rate 23.88 -> 24 packets in the box. Set quantity = 24, unitCost = 0.995, totalCost = 23.88.
5. "MAYIL MATTA 10 KG +1KG FREE" with Qty 15 at rate 11.99 (Amount £179.85) -> 15 bags. Set quantity = 15, unitCost = 11.99, totalCost = 179.85.
6. "PF KASHMIRI CHILLI POWDER 14 X 500G" with Rate £5.30 X 14 = £74.20, Qty 1 -> 14 packets of 500g. Set quantity = 14, unitCost = 5.30, totalCost = 74.20.

IMPORTANT: Always calculate 'quantity' as the total individual retail packs that will be placed on store shelves, and 'unitCost' as totalCost / quantity.
Do NOT wrap in markdown backticks. Output pure raw JSON only.`;

    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: cleanBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.1,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini OCR API error:', geminiRes.status, errText);
      return NextResponse.json({
        success: false,
        error: `Gemini API returned error (${geminiRes.status}). Please verify your Gemini API key.`,
        details: errText,
      }, { status: 500 });
    }

    const geminiJson = await geminiRes.json();
    const rawText = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return NextResponse.json({ success: false, error: 'Gemini did not return any OCR content.' }, { status: 500 });
    }

    let parsedInvoice: any;
    try {
      parsedInvoice = JSON.parse(rawText);
    } catch {
      // Try regex cleanup if extra characters exist
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedInvoice = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse Gemini OCR response as JSON.');
      }
    }

    // Brand abbreviations & aliases dictionary
    const BRAND_EXPANSIONS: Record<string, string> = {
      'kt': 'kitchen treasures',
      'gm': "grandma's",
      'bk': 'bakers',
      'gv': 'green valley',
      'ni': 'nirapara',
      'nr': 'nirapara',
      'dh': 'double horse',
      'em': 'eastern',
      'br': 'brahmins',
      'tn': 'tasty nibbles',
      'kd': 'kitchen delight',
      'id': 'id fresh',
      'plt': 'palat',
      'palat': 'palat',
      'loyal': 'loyal',
      'mayil': 'mayil',
      'ajmi': 'ajmi',
      'pf': 'periyar',
      'dd': 'daily delight',
      'gw': 'gold winner',
      'kk': 'kk foods',
      'kaula': 'kaula',
      'meeval': 'meeval',
      'navya': 'navya',
      'marias': 'marias',
      'kerasam': 'kerasam',
      'jacme': 'jacme',
      'melam': 'melam',
      'tf': 'tasty foods',
      'cct': 'coconut tree',
      'trs': 'trs',
      'natco': 'natco',
      'kpl': 'kpl shudhi',
      'aachi': 'aachi',
    };

    const cleanAndTokenize = (text: string): Set<string> => {
      let s = text.toLowerCase();
      // Strip supplier model codes, case codes, batch numbers
      s = s.replace(/\b(art|item|mod|code|ref|box|case|ctn|batch|sku|no|lot|pack|pk)[#:\s\-]*[a-z0-9\-]+\b/gi, ' ');
      s = s.replace(/\b\d+x\d+[a-z]*\b/gi, ' ');
      s = s.replace(/[^a-z0-9\s]/g, ' ');
      const ignore = new Set(['and', 'with', 'the', 'of', 'in', 'kg', '1kg', '2kg', '5kg', 'g', 'gm', '100g', '200g', '250g', '500g', 'ml', 'ltr', 'pack', 'pkt', 'box', 'tin']);
      const tokens = new Set<string>();
      for (const w of s.split(/\s+/)) {
        const mapped = BRAND_EXPANSIONS[w] || w;
        for (const sub of mapped.split(/\s+/)) {
          if (sub && !ignore.has(sub) && sub.length > 1) {
            tokens.add(sub);
          }
        }
      }
      return tokens;
    };

    // Load ALL existing items from pos_inventory with pagination (all 3,000+ store items)
    let existingItems: any[] = [];
    if (supabaseAdmin) {
      try {
        let offset = 0;
        const PAGE_SIZE = 1000;
        while (true) {
          const { data, error } = await supabaseAdmin
            .from('pos_inventory')
            .select('barcode, description, price, quantity, category')
            .range(offset, offset + PAGE_SIZE - 1);
          if (error || !data || data.length === 0) break;
          existingItems.push(...data);
          if (data.length < PAGE_SIZE) break;
          offset += PAGE_SIZE;
          if (offset > 10000) break;
        }
      } catch (err) {
        console.warn('Existing items lookup error:', err);
      }
    }

    const existingIndex = existingItems.map((e) => ({
      item: e,
      tokens: cleanAndTokenize(e.description || ''),
    }));

    // Process and enrich line items with Profit Margin and Intelligent Catalog Matching
    const rawItems = Array.isArray(parsedInvoice.items) ? parsedInvoice.items : [];
    const enrichedItems: InvoiceParsedItem[] = rawItems.map((item: any, idx: number) => {
      const desc = String(item.description || '').trim();
      const unitCost = Math.max(0.01, Number(item.unitCost) || 1.0);
      const qty = Math.max(1, Number(item.quantity) || 1);
      const totalCost = Number(item.totalCost) || unitCost * qty;

      // Smart category detection
      let category = item.category || 'General Grocery';
      if (isNonFoodOrToiletries(desc)) {
        category = 'Household & Toiletries';
      }

      // Determine margin percentage: check category margin, fallback to default profit margin
      const marginPercent = activeMargins[category] !== undefined ? activeMargins[category] : defaultProfitMargin;

      // Intelligent matching with existing inventory
      let matchedBarcode = String(item.barcode || '').trim();
      let matchedName = '';
      let curStock = 0;
      let curPrice = 0;
      let isExistingStock = false;
      let matchScore = 0;
      let matchType: 'barcode' | 'intelligent_matcher' | 'new_item' = 'new_item';
      let suggestions: Array<{ barcode: string; name: string; stock: number; price: number; score: number }> = [];

      // 1. Direct Barcode Match
      if (matchedBarcode && existingItems.length > 0) {
        const match = existingItems.find((e) => String(e.barcode).trim() === matchedBarcode);
        if (match) {
          matchedName = match.description;
          curStock = Number(match.quantity) || 0;
          curPrice = Number(match.price) || 0;
          isExistingStock = true;
          matchScore = 10;
          matchType = 'barcode';
          if (match.category) category = match.category;
        }
      }

      // 2. Intelligent Supplier Matcher (Handles Dirty Invoice Codes & Brand Abbreviations)
      if (!isExistingStock && desc && existingIndex.length > 0) {
        const rawTokens = cleanAndTokenize(desc);
        const scoredMatches: Array<{ item: any; score: number }> = [];

        for (const entry of existingIndex) {
          let score = 0;
          for (const t of rawTokens) {
            if (entry.tokens.has(t)) score++;
          }
          if (score > 0) {
            scoredMatches.push({ item: entry.item, score });
          }
        }

        scoredMatches.sort((a, b) => b.score - a.score);

        if (scoredMatches.length > 0 && scoredMatches[0].score >= 2) {
          const top = scoredMatches[0];
          matchedBarcode = top.item.barcode;
          matchedName = top.item.description;
          curStock = Number(top.item.quantity) || 0;
          curPrice = Number(top.item.price) || 0;
          isExistingStock = true;
          matchScore = top.score;
          matchType = 'intelligent_matcher';
          if (top.item.category) category = top.item.category;

          suggestions = scoredMatches.slice(0, 3).map((sm) => ({
            barcode: sm.item.barcode,
            name: sm.item.description,
            stock: Number(sm.item.quantity) || 0,
            price: Number(sm.item.price) || 0,
            score: sm.score,
          }));
        }
      }

      // 3. New Item If No Match Found
      if (!isExistingStock) {
        matchType = 'new_item';
        if (!matchedBarcode) {
          matchedBarcode = `5012345${String(Date.now() + idx).slice(-6)}`;
        }
      }

      // Calculate Selling Price with Profit Margin %:
      // Selling Price = unitCost * (1 + margin / 100)
      const calculatedSellingPrice = Math.round(unitCost * (1 + marginPercent / 100) * 100) / 100;
      const expectedProfit = Math.round((calculatedSellingPrice - unitCost) * qty * 100) / 100;

      return {
        id: `inv-item-${idx + 1}`,
        description: desc || 'Kerala Grocery Product',
        matchedName: matchedName || desc,
        matchedBarcode,
        sizeWeight: item.sizeWeight || 'Standard',
        quantity: qty,
        unitCost: Math.round(unitCost * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        category,
        profitMarginPercent: marginPercent,
        sellingPrice: calculatedSellingPrice,
        expectedProfit,
        currentStock: curStock,
        currentPrice: curPrice,
        isExistingStock,
        matchScore,
        matchType,
        suggestions,
      };
    });

    const totalInvoiceCost = enrichedItems.reduce((sum, i) => sum + i.totalCost, 0);
    const totalExpectedSales = enrichedItems.reduce((sum, i) => sum + i.sellingPrice * i.quantity, 0);
    const totalExpectedProfit = totalExpectedSales - totalInvoiceCost;
    const overallMargin = totalInvoiceCost > 0 ? Math.round((totalExpectedProfit / totalInvoiceCost) * 100) : defaultProfitMargin;

    return NextResponse.json({
      success: true,
      supplierName: parsedInvoice.supplierName || 'Wholesale Supplier',
      invoiceNumber: parsedInvoice.invoiceNumber || `INV-${Date.now().toString().slice(-5)}`,
      invoiceDate: parsedInvoice.invoiceDate || new Date().toISOString().split('T')[0],
      totalItems: enrichedItems.length,
      totalInvoiceCost: Math.round(totalInvoiceCost * 100) / 100,
      totalExpectedSales: Math.round(totalExpectedSales * 100) / 100,
      totalExpectedProfit: Math.round(totalExpectedProfit * 100) / 100,
      overallMargin,
      items: enrichedItems,
      categoryMargins: activeMargins,
    });
  } catch (error: any) {
    console.error('OCR Invoice error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to process invoice OCR' },
      { status: 500 }
    );
  }
}
