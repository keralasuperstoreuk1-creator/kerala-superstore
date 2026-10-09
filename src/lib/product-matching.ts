import { Product } from '@/types';

/**
 * Intelligent helper to match products with selected category slugs/names.
 * Safe for both Client Components and Server Components (no Node fs dependencies).
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
