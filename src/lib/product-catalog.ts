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
  let category = 'Spices & Masalas';
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
    category = 'Pickles & Preserves';
    categorySlug = 'pickles-and-preserves';
  } else if (/oil|velichenna|coconut oil|ghee|gingelly|mustard oil|sunflower/i.test(cleanDesc)) {
    category = 'Oils & Ghee';
    categorySlug = 'oils-and-ghee';
  } else if (/frozen|kappa|tapioca|parotta|porotta|fish|prawns|beef|mutton/i.test(cleanDesc)) {
    category = 'Frozen & Ready-to-Cook';
    categorySlug = 'frozen-and-ready-to-cook';
  } else if (/uruli|appam chatti|puttu maker|cooker|kadai|vilakku|pooja|soap|ayurvedic/i.test(cleanDesc)) {
    category = 'Kitchenware & Homeware';
    categorySlug = 'kitchenware-and-homeware';
  } else if (/tea|coffee|horlicks|boost|bru|kannan devan|avt/i.test(cleanDesc)) {
    category = 'Beverages & Instant';
    categorySlug = 'beverages-and-instant';
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
    description: `Premium quality authentic ${cleanDesc} (${sizeWeight}) sourced directly from Kerala, India. Specially packaged for maximum freshness, aroma, and rich traditional taste. Available for fast home delivery across Greater Manchester and nationwide UK from Kerala Superstore Manchester.\n\nതനതായ കേരള തനിമയിലും ഗുണമേന്മയിലും തയ്യാറാക്കിയത്.`,
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

  if (newCount > 0) {
    saveDynamicProducts(dynamicProducts);
  }

  return { updatedCount, newCount };
}

/**
 * Returns the unified active catalog.
 * When POS products are synchronized from the shop computer,
 * it replaces development mock items with the shop's REAL active inventory!
 */
export function getUnifiedProductCatalog(preferExclusivePos: boolean = true): Product[] {
  const dynamicProducts = getDynamicProducts();
  const posState = getPosSyncState();

  // If real POS products exist in dynamic catalog, use ONLY real POS products
  let baseProducts: Product[] = [];
  
  if (dynamicProducts.length > 0 && preferExclusivePos) {
    // Pure real items from POS computer
    baseProducts = [...dynamicProducts];
  } else {
    // Development fallback
    baseProducts = [...INITIAL_PRODUCTS, ...dynamicProducts];
  }

  // Overlay live POS stock & price updates
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

  // Filter out any deleted or inactive items
  return baseProducts.filter(p => p.status === 'published');
}

