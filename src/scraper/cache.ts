/**
 * Cache module — read/write products.cache.json
 * Manages the local cache of scraped products.
 */
import type { Product } from '../types';

export interface CacheEntry {
  timestamp: string;
  source: string;
  productCount: number;
  products: Product[];
}

/**
 * Serialize a cache entry to JSON string.
 */
export function serializeCache(products: Product[], source: string): string {
  const entry: CacheEntry = {
    timestamp: new Date().toISOString(),
    source,
    productCount: products.length,
    products,
  };
  return JSON.stringify(entry, null, 2);
}

/**
 * Parse a cache entry from JSON string.
 * Returns null if the cache is invalid or expired.
 */
export function parseCache(json: string, maxAgeMs?: number): CacheEntry | null {
  try {
    const entry = JSON.parse(json) as CacheEntry;

    // Validate structure
    if (
      !entry.timestamp ||
      !Array.isArray(entry.products) ||
      typeof entry.productCount !== 'number'
    ) {
      return null;
    }

    // Check age if maxAgeMs is specified
    if (maxAgeMs !== undefined) {
      const age = Date.now() - new Date(entry.timestamp).getTime();
      if (age > maxAgeMs) {
        return null; // Cache expired
      }
    }

    return entry;
  } catch {
    return null;
  }
}

/**
 * Validate that cached products all conform to the Product shape.
 * Returns only valid products.
 */
export function validateCachedProducts(products: Product[]): Product[] {
  return products.filter(
    (p) =>
      typeof p.id === 'string' &&
      typeof p.name === 'string' &&
      typeof p.category === 'string' &&
      typeof p.subcategory === 'string' &&
      typeof p.color === 'string' &&
      typeof p.print === 'string' &&
      typeof p.price === 'number' &&
      Array.isArray(p.sizes) &&
      typeof p.image_url === 'string'
  );
}
