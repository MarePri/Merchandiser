import type { Product, Assignment } from '../types';

/**
 * Suggest alternates for a slot based on category + color/price proximity.
 * Manual override always wins — this just pre-fills.
 */
export function suggestAlternates(
  mainProduct: Product | null,
  allProducts: Product[],
  existingAssignment: Assignment | null,
  maxSuggestions: number = 5
): Product[] {
  if (!mainProduct) return [];

  // Exclude the main product itself and any already-assigned alternates
  const excludeIds = new Set<string>([mainProduct.id]);
  if (existingAssignment) {
    excludeIds.add(existingAssignment.main_product_id ?? '');
    existingAssignment.alternates.forEach((id) => excludeIds.add(id));
  }

  const candidates = allProducts.filter((p) => !excludeIds.has(p.id));

  // Score each candidate by proximity
  const scored = candidates.map((candidate) => {
    let score = 0;

    // Same category = big bonus
    if (candidate.category === mainProduct.category) {
      score += 100;
    }

    // Same subcategory = even bigger bonus
    if (candidate.subcategory === mainProduct.subcategory) {
      score += 50;
    }

    // Color match = bonus
    if (candidate.color === mainProduct.color) {
      score += 30;
    } else if (isComplementaryColor(mainProduct.color, candidate.color)) {
      score += 15;
    }

    // Price proximity (within 30% = good, within 10% = great)
    const priceDiff = Math.abs(candidate.price - mainProduct.price);
    const priceRange = mainProduct.price * 0.3;
    if (priceDiff <= mainProduct.price * 0.1) {
      score += 20;
    } else if (priceDiff <= priceRange) {
      score += 10;
    }

    // Same print style bonus
    if (candidate.print === mainProduct.print) {
      score += 5;
    }

    return { product: candidate, score };
  });

  // Sort by score descending, take top N
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, maxSuggestions).map((s) => s.product);
}

/**
 * Basic complementary-color heuristic.
 */
function isComplementaryColor(a: string, b: string): boolean {
  const complementaryPairs: [string, string][] = [
    ['black', 'white'],
    ['navy', 'beige'],
    ['olive', 'cream'],
    ['burgundy', 'grey'],
    ['red', 'navy'],
    ['blue', 'khaki'],
    ['sage', 'rust'],
    ['charcoal', 'cream'],
  ];

  return complementaryPairs.some(
    ([c1, c2]) =>
      (a === c1 && b === c2) || (a === c2 && b === c1)
  );
}
