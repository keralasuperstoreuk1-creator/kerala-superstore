import fs from 'fs';
import path from 'path';
import { Product } from '@/types';
import { INITIAL_PRODUCTS, CATEGORIES } from '@/lib/mock-data';
import { PosSyncItem, getPosSyncState } from '@/lib/pos-sync-store';

const DATA_DIR = path.join(process.cwd(), 'data');
const DYNAMIC_PRODUCTS_FILE = path.join(DATA_DIR, 'dynamic_products.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch {
      // fallback
    }
  }
}

export function getDynamicProducts(): Product[] {
  try {
    ensureDataDir();
    if (fs.existsSync(DYNAMIC_PRODUCTS_FILE)) {
      const data = fs.readFileSync(DYNAMIC_PRODUCTS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading dynamic products:', err);
  }
  return [];
}

export function saveDynamicProducts(products: Product[]): boolean {
  try {
    ensureDataDir();
    fs.writeFileSync(DYNAMIC_PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving dynamic products:', err);
    return false;
  }
}

// Brand Dictionary for accurate identification
const KNOWN_BRANDS = [
  'Nirapara', 'Eastern', 'Double Horse', 'Brahmins', 'Aachi', 'Melam', 'Kera', 
  'Grandma', 'Periyar', 'Pavizham', 'Daily Fresh', 'Priya', 'Everest', 'MDH',
  'Milma', 'Elite', 'Kitchen Treasures', 'Ajmi', 'Surabhi', 'MTR', 'Ashirvaad',
  'Kannan Devan', 'AVT', 'Tata Tea', 'Bru', 'Wagh Bakri', 'Heera', 'TRS', 'Natco',
  'Nandini', 'Ujala', 'Lion Dates', 'Amul', 'Govind'
];

// Product packshot image match table based on keywords
const IMAGE_KEYWORD_MAP: Array<{ regex: RegExp; image: string }> = [
  { regex: /matta|palakkadan|vadi|unda matta/i, image: '/products/matta-rice.png' },
  { regex: /kaima|jeerakasala|biryani rice/i, image: '/products/kaima-rice.png' },
  { regex: /pavizham|ponni|idli rice|rice/i, image: '/products/pavizham-rice.png' },
  { regex: /sambar/i, image: '/products/sambar-powder.png' },
  { regex: /chicken masala|curry powder/i, image: '/products/chicken-masala.png' },
  { regex: /meat masala|beef masala|mutton masala/i, image: '/products/meat-masala.png' },
  { regex: /fish masala|fish curry/i, image: '/products/fish-masala.png' },
  { regex: /kashmiri chilli|chilli powder|red chilli/i, image: '/products/kashmiri-chilli.png' },
  { regex: /pepper|kurumulaku/i, image: '/products/black-pepper.png' },
  { regex: /cardamom|elakka/i, image: '/products/cardamom.png' },
  { regex: /clove|gramboo/i, image: '/products/cloves.png' },
  { regex: /star anise|thakkolam/i, image: '/products/star-anise.png' },
  { regex: /puttu podi|chemba puttu|white puttu/i, image: '/products/puttu-podi.png' },
  { regex: /appam podi|idiyappam/i, image: '/products/appam-podi.png' },
  { regex: /rava|suji|sooji/i, image: '/products/roasted-rava.png' },
  { regex: /banana chips|chips|nendran/i, image: '/products/banana-chips.png' },
  { regex: /sharkara upperi|sharkaravatti/i, image: '/products/sharkara-upperi.png' },
  { regex: /mixture|kerala mixture/i, image: '/products/kerala-mixture.png' },
  { regex: /kera coconut oil|coconut oil|velichenna/i, image: '/products/kera-coconut-oil.png' },
  { regex: /gingelly|sesame oil|nallenna/i, image: '/products/gingelly-oil.png' },
  { regex: /ghee|malabar ghee|cow ghee/i, image: '/products/malabar-ghee.png' },
  { regex: /cut mango|mango pickle|achar/i, image: '/products/cut-mango-pickle.png' },
  { regex: /puli inji|ginger pickle|inji curry/i, image: '/products/puli-inji.png' },
  { regex: /kappa|tapioca|frozen kappa/i, image: '/products/frozen-kappa.png' },
  { regex: /parotta|porotta|malabar parotta/i, image: '/products/malabar-parotta.png' },
  { regex: /cherupayar|moong/i, image: '/products/cherupayar.png' },
  { regex: /toor dal|tuvar/i, image: '/products/toor-dal.png' },
  { regex: /kadala|brown chickpea|kala chana/i, image: '/products/kadala.png' },
  { regex: /grated coconut|coconut/i, image: '/products/grated-coconut.png' },
  { regex: /puttu maker|puttu kutti/i, image: '/products/puttu-maker.png' },
  { regex: /appam chatti/i, image: '/products/appam-chatti.png' },
  { regex: /uruli|bronze/i, image: '/products/bronze-uruli.png' },
  { regex: /tea|chai|munnar/i, image: '/products/tea-munnar.png' },
];

/**
 * Parses raw POS inventory descriptions to produce a full, rich website Product
 */
export function autoEnrichPosProduct(item: PosSyncItem): Product {
  const desc = item.description || 'Kerala Grocery Product';
  const cleanDesc = desc.trim();

  // 1. Detect Brand
  let detectedBrand = 'Kerala Superstore';
  for (const b of KNOWN_BRANDS) {
    if (new RegExp(`\\b${b}\\b`, 'i').test(cleanDesc)) {
      detectedBrand = b;
      break;
    }
  }

  // 2. Extract Size/Weight (e.g. 5kg, 1kg, 500g, 200g, 100g, 1L, 500ml)
  const weightMatch = cleanDesc.match(/(\d+(\.\d+)?\s*(kg|g|gm|l|ltr|litre|ml|pack|pcs|piece))/i);
  const sizeWeight = weightMatch ? weightMatch[0].toUpperCase().replace(/\s+/, '') : 'Standard Pack';

  // 3. Detect Category
  let category = 'Spices & Whole Condiments';
  let categorySlug = 'spices-and-whole-condiments';

  if (/rice|matta|jeerakasala|kaima|ponni|idli rice|sona masoori/i.test(cleanDesc)) {
    category = 'Rice & Rice Products';
    categorySlug = 'rice-and-rice-products';
  } else if (/dal|payar|kadala|moong|urad|toor|chana|gram/i.test(cleanDesc)) {
    category = 'Pulses & Dal';
    categorySlug = 'pulses-and-dal';
  } else if (/masala|sambar powder|curry powder|turmeric|chilli|coriander|meat masala|chicken masala|fish masala/i.test(cleanDesc)) {
    category = 'Masala & Curry Powders';
    categorySlug = 'masala-and-curry-powders';
  } else if (/puttu|appam|idiyappam|rava|suji|podi|flour|atta|maida|rice powder/i.test(cleanDesc)) {
    category = 'Breakfast Powders';
    categorySlug = 'breakfast-powders';
  } else if (/chips|upperi|mixture|murukku|snack|kuzhalappam|achappam|halwa|biscuit|rusk/i.test(cleanDesc)) {
    category = 'Crisps & Snacks';
    categorySlug = 'crisps-and-snacks';
  } else if (/pickle|achar|chammanthi|puli inji|chutney|paste/i.test(cleanDesc)) {
    category = 'Traditional Pickles';
    categorySlug = 'traditional-pickles';
  } else if (/oil|velichenna|coconut oil|ghee|gingelly|mustard oil|sunflower/i.test(cleanDesc)) {
    category = 'Pure Oils & Ghee';
    categorySlug = 'oils-and-ghee';
  } else if (/frozen|kappa|tapioca|parotta|porotta|fish|prawns|beef|mutton/i.test(cleanDesc)) {
    category = 'Frozen Delights';
    categorySlug = 'frozen-delights';
  } else if (/uruli|appam chatti|puttu maker|cooker|kadai|vilakku|pooja|soap|ayurvedic/i.test(cleanDesc)) {
    category = 'Traditional Kitchenwares';
    categorySlug = 'traditional-kitchenwares';
  } else if (/tea|coffee|horlicks|boost|bru|kannan devan|avt/i.test(cleanDesc)) {
    category = 'Breakfast Powders';
    categorySlug = 'breakfast-powders';
  }

  // 4. Match Image
  let imageUrl = '/products/matta-rice.png'; // default fallback
  for (const mapItem of IMAGE_KEYWORD_MAP) {
    if (mapItem.regex.test(cleanDesc)) {
      imageUrl = mapItem.image;
      break;
    }
  }

  // 5. Generate Slug
  const barcodeSlug = item.barcode ? `-${item.barcode.slice(-4)}` : '';
  const slug = cleanDesc
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') + barcodeSlug;

  const price = Number(item.price) || 2.99;
  const webPrice = item.webPrice !== undefined && item.webPrice > 0 ? Number(item.webPrice) : price;
  const stock = Number(item.quantity) || 0;

  return {
    id: `pos-${item.barcode || Date.now()}`,
    name: cleanDesc,
    slug: slug,
    brand: detectedBrand,
    category: category,
    categorySlug: categorySlug,
    sizeWeight: sizeWeight,
    price: price,
    offerPrice: webPrice < price ? webPrice : undefined,
    stock: stock,
    lowStockThreshold: 5,
    barcode: item.barcode,
    description: `Premium quality authentic ${cleanDesc} (${sizeWeight}) sourced directly from Kerala, India. Specially packaged for maximum freshness, aroma, and rich traditional taste. Available for fast home delivery across Greater Manchester and nationwide UK from Kerala Superstore Manchester.`,
    ingredients: `${detectedBrand} authentic preparation with 100% natural ingredients.`,
    tags: [detectedBrand, category, 'Kerala Authentic', 'UK Fast Delivery', 'Fresh Stock', sizeWeight],
    imageUrl: imageUrl,
    status: 'published',
    origin: 'Product of Kerala, India',
    seoTitle: `${cleanDesc} (${sizeWeight}) | Buy Online UK | Kerala Superstore Manchester`,
    seoDescription: `Order authentic ${cleanDesc} online at Kerala Superstore Manchester. Best UK price £${price.toFixed(2)}, fast dispatch & free delivery options.`,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Upserts a batch of POS sync items into the website's live dynamic catalog
 */
export function upsertPosProductsToCatalog(items: PosSyncItem[]): { updatedCount: number; newCount: number } {
  const dynamicProducts = getDynamicProducts();
  const existingMap = new Map<string, Product>();

  // Map initial + dynamic
  INITIAL_PRODUCTS.forEach((p) => {
    if (p.barcode) existingMap.set(p.barcode, p);
    existingMap.set(p.slug, p);
  });

  dynamicProducts.forEach((p) => {
    if (p.barcode) existingMap.set(p.barcode, p);
    existingMap.set(p.slug, p);
  });

  let newCount = 0;
  let updatedCount = 0;

  items.forEach((item) => {
    const barcode = item.barcode?.trim();
    if (!barcode) return;

    const existing = existingMap.get(barcode);
    if (existing) {
      // Update existing
      existing.stock = Number(item.quantity) || 0;
      if (item.price) existing.price = Number(item.price);
      if (item.webPrice && item.webPrice < existing.price) {
        existing.offerPrice = Number(item.webPrice);
      }
      updatedCount++;
    } else {
      // New product added from POS!
      const newProduct = autoEnrichPosProduct(item);
      dynamicProducts.push(newProduct);
      existingMap.set(barcode, newProduct);
      existingMap.set(newProduct.slug, newProduct);
      newCount++;
    }
  });

  if (newCount > 0 || updatedCount > 0) {
    saveDynamicProducts(dynamicProducts);
  }

  return { updatedCount, newCount };
}

/**
 * Returns the unified active catalog.
 * Combines standard catalog items with real POS items and dynamic store updates.
 */
export function getUnifiedProductCatalog(): Product[] {
  const dynamicProducts = getDynamicProducts();
  const posState = getPosSyncState();

  const productMap = new Map<string, Product>();

  // 1. Seed with initial core Kerala grocery products
  INITIAL_PRODUCTS.forEach((prod) => {
    productMap.set(prod.id, { ...prod });
    if (prod.barcode) {
      productMap.set(`barcode:${prod.barcode}`, { ...prod });
    }
  });

  // 2. Overlay dynamic products (saved via admin or synced from POS)
  dynamicProducts.forEach((dyn) => {
    if (dyn.barcode && productMap.has(`barcode:${dyn.barcode}`)) {
      const existing = productMap.get(`barcode:${dyn.barcode}`)!;
      const merged = { ...existing, ...dyn };
      productMap.set(existing.id, merged);
      productMap.set(`barcode:${dyn.barcode}`, merged);
    } else if (productMap.has(dyn.id)) {
      const existing = productMap.get(dyn.id)!;
      const merged = { ...existing, ...dyn };
      productMap.set(dyn.id, merged);
      if (dyn.barcode) productMap.set(`barcode:${dyn.barcode}`, merged);
    } else {
      productMap.set(dyn.id, { ...dyn });
      if (dyn.barcode) productMap.set(`barcode:${dyn.barcode}`, dyn);
    }
  });

  // 3. De-duplicate by product ID
  const seenIds = new Set<string>();
  const baseProducts: Product[] = [];
  productMap.forEach((prod) => {
    if (!seenIds.has(prod.id)) {
      seenIds.add(prod.id);
      baseProducts.push(prod);
    }
  });

  // 4. Overlay live POS stock & price updates if available
  if (posState.syncedInventory) {
    baseProducts.forEach((prod) => {
      if (prod.barcode && posState.syncedInventory[prod.barcode]) {
        const live = posState.syncedInventory[prod.barcode];
        prod.stock = live.quantity;
        if (live.price) prod.price = live.price;
        if (live.webPrice && live.webPrice < prod.price) {
          prod.offerPrice = live.webPrice;
        }
      }
    });
  }

  // Filter out any un-published products
  return baseProducts.filter(p => p.status === 'published' || !p.status);
}

/**
 * Intelligent helper to match products with selected category slugs/names
 */
export function matchProductToCategory(product: Product, categorySlugOrName: string): boolean {
  if (!categorySlugOrName) return true;
  const target = categorySlugOrName.toLowerCase().trim();
  const pSlug = (product.categorySlug || '').toLowerCase().trim();
  const pCat = (product.category || '').toLowerCase().trim();
  const pName = (product.name || '').toLowerCase().trim();

  // 1. Direct or partial match
  if (pSlug === target || pCat === target) return true;
  if (pSlug.includes(target) || target.includes(pSlug)) return true;
  if (pCat.includes(target) || target.includes(pCat)) return true;

  // 2. Department keywords matching
  if (target.includes('rice') && (pSlug.includes('rice') || pCat.includes('rice') || pName.includes('rice') || pName.includes('matta') || pName.includes('kaima') || pName.includes('ponni'))) return true;
  if ((target.includes('pulse') || target.includes('dal')) && (pSlug.includes('pulse') || pSlug.includes('dal') || pCat.includes('pulse') || pCat.includes('dal') || pName.includes('dal') || pName.includes('payar') || pName.includes('kadala') || pName.includes('moong') || pName.includes('urad'))) return true;
  if (target.includes('masala') && (pSlug.includes('masala') || pCat.includes('masala') || pName.includes('masala') || pName.includes('powder') || pName.includes('sambar') || pName.includes('curry') || pName.includes('chilli'))) return true;
  if ((target.includes('snack') || target.includes('crisp')) && (pSlug.includes('snack') || pCat.includes('snack') || pName.includes('chips') || pName.includes('mixture') || pName.includes('upperi') || pName.includes('murukku'))) return true;
  if (target.includes('oil') && (pSlug.includes('oil') || pCat.includes('oil') || pName.includes('oil') || pName.includes('ghee') || pName.includes('velichenna') || pName.includes('gingelly'))) return true;
  if (target.includes('pickle') && (pSlug.includes('pickle') || pCat.includes('pickle') || pName.includes('pickle') || pName.includes('achar') || pName.includes('puli inji') || pName.includes('mango'))) return true;
  if (target.includes('frozen') && (pSlug.includes('frozen') || pCat.includes('frozen') || pName.includes('frozen') || pName.includes('kappa') || pName.includes('parotta') || pName.includes('fish'))) return true;
  if (target.includes('kitchen') && (pSlug.includes('kitchen') || pCat.includes('kitchen') || pName.includes('uruli') || pName.includes('chatti') || pName.includes('maker') || pName.includes('kudam'))) return true;
  if (target.includes('breakfast') && (pSlug.includes('breakfast') || pCat.includes('breakfast') || pName.includes('podi') || pName.includes('puttu') || pName.includes('appam') || pName.includes('rava') || pName.includes('suji'))) return true;
  if (target.includes('spice') && (pSlug.includes('spice') || pCat.includes('spice') || pName.includes('pepper') || pName.includes('cardamom') || pName.includes('clove') || pName.includes('cinnamon') || pName.includes('anise'))) return true;

  return false;
}

