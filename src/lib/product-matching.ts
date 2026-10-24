import { Product } from '@/types';

/**
 * Detects non-food, toiletries, cleaning and cosmetic products
 * to prevent them from showing up inside grocery/pulses/masala food categories.
 */
export function isNonFoodOrToiletries(name: string): boolean {
  const n = (name || '').toLowerCase();
  const nonFoodKeywords = [
    'soap', 'sandal', 'medimix', 'chandrika', 'mysore', 'santoor', 'lux', 'dettol',
    'lifebuoy', 'cinthol', 'hamam', 'pears', 'dove', 'shampoo', 'conditioner',
    'toothpaste', 'colgate', 'close up', 'closeup', 'dabur red', 'sensodyne',
    'detergent', 'washing powder', 'surf excel', 'ariel', 'tide', 'rin', 'henko',
    'ujala', 'fabric softener', 'comfort', 'harpic', 'domex', 'lizol', 'cleaner',
    'vim bar', 'vim liquid', 'pril', 'dishwash', 'scrubber', 'scotch brite',
    'agarbatti', 'incense', 'camphor', 'dhoop', 'sambrani', 'pooja oil', 'hair oil',
    'parachute hair', 'navratna', 'bajaj almond drops', 'vatika', 'mehandi', 'henna',
    'cream', 'lotion', 'talc', 'yardley', 'cuticura', 'nivea', 'vaseline',
    'sanitary', 'whisper', 'stayfree', 'bleach', 'phenyl', 'broom'
  ];
  return nonFoodKeywords.some(kw => n.includes(kw));
}

/**
 * Intelligent helper to match products with selected category slugs/names.
 * Strictly isolates categories (e.g., prevents soaps from showing in Pulses & Dals).
 */
export function matchProductToCategory(product: Product, categorySlugOrName: string): boolean {
  if (!categorySlugOrName) return true;
  const target = categorySlugOrName.toLowerCase().trim();
  const pName = (product.name || '').toLowerCase().trim();
  const pCat = (product.category || '').toLowerCase().trim();
  const pSlug = (product.categorySlug || '').toLowerCase().trim();

  // If product is non-food / toiletries / soap, NEVER allow it into food categories
  const isFoodCategory = [
    'rice', 'pulse', 'dal', 'masala', 'curry', 'breakfast', 'podi',
    'spice', 'snack', 'crisp', 'oil', 'ghee', 'pickle', 'achar', 'frozen'
  ].some(k => target.includes(k));

  if (isFoodCategory && isNonFoodOrToiletries(pName)) {
    return false;
  }

  // 1. Pulses & Dal (cat-2) - STRICT: Only genuine lentils, peas, grams, and dals
  if (target.includes('pulse') || target.includes('dal')) {
    const dalRegex = /\b(dal|dall|daal|parippu|toor|tuvar|thuvara|chana|moong|urad|urid|masoor|cherupayar|vanpayar|kadala|chickpea|chickpeas|horse gram|muthira|karamani|payar|green gram|black gram|chowli|lobia|rajma|peas|gram)\b/i;
    // Exclude ready-to-eat thoran or curries unless specified
    return dalRegex.test(pName) || dalRegex.test(pCat);
  }

  // 2. Rice & Rice Products (cat-1)
  if (target.includes('rice')) {
    const riceRegex = /\b(rice|matta|kaima|jeerakasala|ponni|idli rice|dosa rice|sona masoori|basmati|biryani rice|biriyani rice|poha|aval|avalose|rice flakes|rice ada)\b/i;
    return riceRegex.test(pName) || riceRegex.test(pCat);
  }

  // 3. Masala & Curry Powders (cat-3)
  if (target.includes('masala')) {
    const masalaRegex = /\b(masala|curry powder|sambar powder|rasam powder|chilli powder|turmeric powder|coriander powder|meat masala|fish masala|chicken masala|garam masala|biryani masala|kabab masala|tandoori masala|mutton masala|beef masala|perumjeerakam powder|jeera powder|pepper powder|manjal podi|malli podi|mulaku podi|meat roast)\b/i;
    return masalaRegex.test(pName) || masalaRegex.test(pCat);
  }

  // 4. Breakfast Powders (cat-4)
  if (target.includes('breakfast')) {
    const bfRegex = /\b(puttu|puttupodi|puttu podi|chemba|appam|idiyappam|pathiri|rava|suji|sooji|dosa podi|idli podi|wheat flour|atta|maida|semolina|dosa mix|idli mix)\b/i;
    return bfRegex.test(pName) || bfRegex.test(pCat);
  }

  // 5. Spices & Whole Condiments (cat-5)
  if (target.includes('spice')) {
    const spiceRegex = /\b(cardamom|elakka|pepper|kurumulaku|clove|gramboo|cinnamon|karuvapatta|star anise|thakkolam|jeera|cumin|fennel|perumjeerakam|mustard|kaduku|fenugreek|uluva|nutmeg|jathikka|mace|jathipathri|bay leaf|whole spice)\b/i;
    return spiceRegex.test(pName) || spiceRegex.test(pCat);
  }

  // 6. Crisps & Snacks (cat-6)
  if (target.includes('snack') || target.includes('crisp')) {
    const snackRegex = /\b(banana chips|chips|upperi|sharkara|mixture|murukku|kuzhalappam|achappam|biscuit|rusk|namkeen|crisps|snack|tapioca chips|jackfruit chips|fryums|pappadam|papad)\b/i;
    return snackRegex.test(pName) || snackRegex.test(pCat);
  }

  // 7. Pure Oils & Ghee (cat-7)
  if (target.includes('oil') || target.includes('ghee')) {
    const oilRegex = /\b(coconut oil|velichenna|gingelly|sesame oil|nallenna|ghee|cow ghee|mustard oil|sunflower oil)\b/i;
    return oilRegex.test(pName) && !pName.includes('hair oil');
  }

  // 8. Traditional Pickles (cat-8)
  if (target.includes('pickle')) {
    const pickleRegex = /\b(pickle|achar|puli inji|kadumango|kadu manga|tender mango|cut mango|lime pickle|lemon pickle|garlic pickle|fish pickle|prawn pickle|beef pickle|meat pickle)\b/i;
    return pickleRegex.test(pName) || pickleRegex.test(pCat);
  }

  // 9. Frozen Delights (cat-9)
  if (target.includes('frozen')) {
    const frozenRegex = /\b(frozen|grated coconut|parotta|porotta|kappa|tapioca|karimeen|fish|prawn|squid|mutton|beef|chakka|samosa|cutlet|neyyappam)\b/i;
    return frozenRegex.test(pName) || frozenRegex.test(pCat) || pName.includes('frozen');
  }

  // 10. Traditional Kitchenwares (cat-10)
  if (target.includes('kitchen')) {
    const kwRegex = /\b(uruli|appam chatti|appachatti|puttu maker|puttu kutti|puttu kudam|tawa|dosa kallu|chirava|pot|cooker|kadai|cast iron|bronze|pan|knife)\b/i;
    return kwRegex.test(pName) || kwRegex.test(pCat);
  }

  // 11. Religious Items (cat-11)
  if (target.includes('relig') || target.includes('statue') || target.includes('christian')) {
    if (pName.includes('rosemary') || pName.includes('croissant') || pName.includes('chip') || pName.includes('snack') || pName.includes('biscuit') || pName.includes('crisp')) {
      return false;
    }
    const isRelTag = (product.tags || []).some(t => /relig|statue|christian|church|prayer|marian|catholic/i.test(t));
    const relRegex = /\b(statue|mary|jesus|joseph|angel|holy family|crucifix|cross|rosary|christian|prayer altar|zion arts|krishna|pooja|vilakkenna|agarbatti|dhoop|camphor)\b/i;
    return isRelTag || relRegex.test(pName) || relRegex.test(pCat) || pSlug.includes('relig');
  }

  // Direct matches
  if (pSlug === target || pCat === target) return true;
  if (pSlug.includes(target) || target.includes(pSlug)) return true;
  if (pCat.includes(target) || target.includes(pCat)) return true;

  return false;
}

/**
 * Intelligent helper to match products to specific sub-variety headings.
 * Ensures:
 * - Meat Masala ONLY shows meat/beef/mutton masala brands (Eastern, Nirapara, Melam, Brahmins, etc.)
 * - Fish Masala ONLY shows fish curry & fish fry masalas (Eastern, Melam, Nirapara, Saras, etc.)
 * - Chicken Masala ONLY shows chicken masala (Eastern, Melam, Nirapara, etc.)
 */
export function matchProductToVariety(product: Product, variety: string): boolean {
  if (!variety || variety === 'All' || variety === 'All Varieties') return true;
  const v = variety.toLowerCase().trim();
  const pName = (product.name || '').toLowerCase();
  const desc = (product.description || '').toLowerCase();

  // 1. Meat Masala: Must be Meat, Beef, or Mutton Masala (strictly exclude fish and chicken)
  if (v.includes('meat masala') || v === 'meat masala') {
    const isMeat = /\b(meat\s*masala|beef\s*masala|mutton\s*masala|meat\s*curry|beef\s*roast\s*masala|mutton\s*curry)\b/i.test(pName);
    const notOther = !/\b(fish|meen|chicken|kozhi|sambar|rasam)\b/i.test(pName);
    return isMeat && notOther;
  }

  // 2. Fish Curry Masala / Fish Masala: Must be Fish Masala (strictly exclude meat and chicken)
  if (v.includes('fish') || v.includes('fish curry masala') || v.includes('fish masala')) {
    const isFish = /\b(fish\s*masala|fish\s*curry|meen\s*masala|meen\s*curry|fish\s*fry\s*masala)\b/i.test(pName);
    const notOther = !/\b(meat|beef|mutton|chicken|kozhi|sambar)\b/i.test(pName);
    return isFish && notOther;
  }

  // 3. Chicken Masala: Must be Chicken Masala (strictly exclude meat and fish)
  if (v.includes('chicken masala')) {
    const isChicken = /\b(chicken\s*masala|chicken\s*curry|chicken\s*fry\s*masala|chicken\s*roast\s*masala|chicken\s*65)\b/i.test(pName);
    const notOther = !/\b(meat|beef|mutton|fish|meen)\b/i.test(pName);
    return isChicken && notOther;
  }

  // 4. Sambar Powder
  if (v.includes('sambar')) {
    return /\b(sambar)\b/i.test(pName);
  }

  // 5. Garam Masala
  if (v.includes('garam masala')) {
    return /\b(garam\s*masala)\b/i.test(pName);
  }

  // 6. Kashmiri Chilli
  if (v.includes('kashmiri chilli') || v.includes('kashmiri')) {
    return /\b(kashmiri)\b/i.test(pName);
  }

  // 7. Rice Varieties
  if (v.includes('vadi matta') || v.includes('palakkadan vadi')) {
    return (/\b(vadi|palakkadan)\b/i.test(pName) || pName.includes('matta')) && !/\b(kaima|jeerakasala|biryani|unda)\b/i.test(pName);
  }
  if (v.includes('unda matta')) {
    return /\b(unda|round\s*matta)\b/i.test(pName);
  }
  if (v.includes('kaima') || v.includes('jeerakasala')) {
    return /\b(kaima|jeerakasala|biryani\s*rice|biriyani\s*rice)\b/i.test(pName);
  }
  if (v.includes('ponni')) {
    return /\b(ponni)\b/i.test(pName);
  }
  if (v.includes('idli') && v.includes('dosa')) {
    return /\b(idli\s*rice|dosa\s*rice|idly\s*rice)\b/i.test(pName);
  }

  // 8. Dal & Pulses Varieties
  if (v.includes('cherupayar') || v.includes('moong')) {
    return /\b(cherupayar|moong|green\s*gram)\b/i.test(pName);
  }
  if (v.includes('toor dal') || v.includes('toor')) {
    return /\b(toor|tuvar|thuvara)\b/i.test(pName);
  }
  if (v.includes('kadala') || v.includes('brown kadala')) {
    return /\b(kadala|kala\s*chana|brown\s*chickpea|chana\s*brown)\b/i.test(pName);
  }
  if (v.includes('urad dal') || v.includes('urad')) {
    return /\b(urad|urid|uzhunnu|black\s*gram|urad\s*gota)\b/i.test(pName);
  }
  if (v.includes('vanpayar')) {
    return /\b(vanpayar|cowpea|red\s*cowpea|chowli|lobia)\b/i.test(pName);
  }

  // Religious statue varieties
  if (v.includes('mary')) return /mary/i.test(pName);
  if (v.includes('joseph')) return /joseph/i.test(pName);
  if (v.includes('jesus')) return /jesus|christ/i.test(pName) && !/joseph|family/i.test(pName);
  if (v.includes('family')) return /family/i.test(pName);
  if (v.includes('angel')) return /angel/i.test(pName);

  // Generic fallback: check if the variety phrase is in product name
  const words = v.split(/[\s/()]+/).filter(w => w.length > 2);
  if (words.length > 0) {
    return words.every(w => pName.includes(w) || desc.includes(w));
  }

  return true;
}

const SEARCH_SYNONYMS: Record<string, string[]> = {
  meen: ['fish', 'meen', 'curry cut'],
  fish: ['meen', 'fish'],
  erachi: ['meat', 'beef', 'mutton', 'chicken', 'erachi'],
  irachi: ['meat', 'beef', 'mutton', 'chicken', 'irachi'],
  meat: ['meat', 'erachi', 'irachi', 'beef', 'mutton'],
  beef: ['beef', 'meat', 'erachi'],
  chicken: ['chicken', 'koli', 'kozhi'],
  kozhi: ['chicken', 'kozhi'],
  ari: ['rice', 'matta', 'kaima', 'ponni', 'ari'],
  rice: ['rice', 'ari', 'matta', 'kaima', 'ponni'],
  matta: ['matta', 'palakkadan', 'vadi', 'unda', 'rice'],
  parippu: ['dal', 'daal', 'parippu', 'toor', 'moong', 'urad', 'lentil'],
  dal: ['dal', 'daal', 'parippu', 'toor', 'moong', 'urad', 'lentil'],
  velichenna: ['coconut oil', 'velichenna', 'keragovind', 'klf'],
  cherupayar: ['cherupayar', 'moong', 'green gram'],
  kadala: ['kadala', 'chana', 'chickpea'],
  vanpayar: ['vanpayar', 'cowpea', 'lobia', 'red gram'],
  uzhunnu: ['urad', 'urid', 'uzhunnu', 'black gram'],
  mulaku: ['chilli', 'chilly', 'mulaku', 'mirch'],
  chilli: ['chilli', 'chilly', 'mulaku', 'mirch'],
  malli: ['coriander', 'malli', 'dhaniya'],
  coriander: ['coriander', 'malli', 'dhaniya'],
  manjal: ['turmeric', 'manjal', 'haldi'],
  turmeric: ['turmeric', 'manjal', 'haldi'],
  jeerakam: ['jeera', 'cumin', 'jeerakam'],
  perumjeerakam: ['fennel', 'perumjeerakam', 'saunf'],
  kayam: ['asafoetida', 'hing', 'kayam'],
  vellam: ['jaggery', 'vellam', 'sharkkara', 'sharkara'],
  sharkara: ['jaggery', 'sharkara', 'sharkkara', 'vellam'],
  jaggery: ['jaggery', 'sharkara', 'sharkkara', 'vellam'],
  thairu: ['curd', 'yogurt', 'thairu'],
  uppu: ['salt', 'uppu'],
  chaya: ['tea', 'chaya'],
  kaappi: ['coffee', 'kaappi'],
  tea: ['tea', 'chaya'],
  coffee: ['coffee', 'kaappi'],
  pappadam: ['pappadam', 'poppadom', 'papad'],
  puttu: ['puttu', 'pittu', 'puttupodi'],
  appam: ['appam', 'idiyappam', 'pathiri'],
  idli: ['idli', 'idly', 'dosa'],
  dosa: ['dosa', 'idli', 'idly'],
  achaar: ['pickle', 'achar', 'achaar'],
  pickle: ['pickle', 'achar', 'achaar'],
};

/**
 * Intelligent Multi-Term & Synonym Search Matcher.
 * Matches across product name, brand, category, size/weight, description, tags, and barcode.
 * Supports English, Manglish, and Malayalam common terms.
 */
export function matchProductSearch(product: Product, query: string): boolean {
  if (!query || !query.trim()) return true;
  const q = query.toLowerCase().trim();
  
  // Searchable text blob
  const searchableText = `${product.name || ''} ${product.brand || ''} ${product.category || ''} ${product.categorySlug || ''} ${product.sizeWeight || ''} ${product.description || ''} ${(product.tags || []).join(' ')} ${product.barcode || ''}`.toLowerCase();

  // Split query into terms
  const terms = q.split(/\s+/).filter(Boolean);

  // Every term in the query must match either directly or via a synonym
  return terms.every((term) => {
    // 1. Direct match in product text
    if (searchableText.includes(term)) return true;

    // 2. Check synonyms
    const syns = SEARCH_SYNONYMS[term];
    if (syns && syns.some((syn) => searchableText.includes(syn))) {
      return true;
    }

    return false;
  });
}
