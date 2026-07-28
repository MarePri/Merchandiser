/**
 * refreshCatalog() — the single public entry point for scraping.
 *
 * Call this manually to re-scrape and overwrite the cache.
 * This is the only function the rest of the app needs to know about.
 *
 * Pipeline: fetch → normalize → validate → cache → return
 * Fallback: on failure, previous cache is preserved, error is returned.
 */
import type { Product } from '../types';
import { ZaraScraper, type ScrapeResult } from './scraper';
import { serializeCache, parseCache, validateCachedProducts } from './cache';
import defaultConfig, { type ScraperConfig } from './config';

export interface RefreshResult {
  success: boolean;
  products: Product[];
  source: 'scraped' | 'fallback-static';
  error?: string;
  timestamp: string;
  productCount: number;
  categoriesScraped: number;
}

/**
 * Refresh the product catalog from the live retailer site.
 *
 * 1. Attempt to scrape live data from Zara
 * 2. If scrape succeeds and meets minimum threshold → return new products
 * 3. If scrape fails → preserve previous cache, return error
 * 4. If no cache exists → fall back to static products.json
 */
export async function refreshCatalog(
  existingCacheJson: string | null,
  config: ScraperConfig = defaultConfig
): Promise<RefreshResult> {
  const timestamp = new Date().toISOString();

  // ── Step 1: Attempt live scrape ──
  const scraper = new ZaraScraper(config);
  const result: ScrapeResult = await scraper.scrape();

  if (result.success && result.products.length >= config.minProductsRequired) {
    // Scrape succeeded — return new data
    return {
      success: true,
      products: result.products,
      source: 'scraped',
      timestamp,
      productCount: result.products.length,
      categoriesScraped: result.categoriesScraped,
    };
  }

  // ── Step 2: Scrape failed — try to preserve previous cache ──
  if (existingCacheJson) {
    const previousCache = parseCache(existingCacheJson);
    if (previousCache && previousCache.products.length > 0) {
      const validated = validateCachedProducts(previousCache.products);
      if (validated.length > 0) {
        return {
          success: false,
          products: validated,
          source: 'scraped',
          error: `Live scrape failed (${result.error}). Using previous cache from ${previousCache.timestamp}.`,
          timestamp: previousCache.timestamp,
          productCount: validated.length,
          categoriesScraped: 0,
        };
      }
    }
  }

  // ── Step 3: No valid cache — fall back to static data ──
  return {
    success: false,
    products: [],
    source: 'fallback-static',
    error: `Live scrape failed (${result.error}). No valid cache available. App should use static products.json.`,
    timestamp,
    productCount: 0,
    categoriesScraped: 0,
  };
}

/**
 * Get the cache JSON string to write to disk after a successful refresh.
 */
export function getCacheJson(products: Product[]): string {
  return serializeCache(products, 'zara.com');
}

/**
 * Read products from cache JSON string.
 * Returns null if cache is invalid.
 */
export function readCache(cacheJson: string): Product[] | null {
  const entry = parseCache(cacheJson);
  if (!entry) return null;
  return validateCachedProducts(entry.products);
}

export type { ScraperConfig };
