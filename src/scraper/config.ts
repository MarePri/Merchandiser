/**
 * Scraper Configuration
 * Central config for all scraping parameters.
 * Edit this file to change endpoints, rate limits, etc.
 */
export interface ScraperConfig {
  /** Which data source the app uses */
  dataSource: 'static' | 'scraped';

  /** Base URL for the retailer site */
  baseUrl: string;

  /** API endpoints to try, in order of preference */
  endpoints: {
    /** Category tree endpoint (returns all categories) */
    categories: string;
    /** Product listing per category — {categoryId} is interpolated */
    categoryProducts: string;
    /** Individual product detail — {productId} is interpolated */
    productDetail: string;
  };

  /** Rate limiting */
  rateLimit: {
    /** Minimum milliseconds between requests */
    delayMs: number;
    /** Hard cap on total pages fetched per refresh run */
    maxPages: number;
  };

  /** Minimum products required to consider a scrape successful */
  minProductsRequired: number;

  /** Request headers */
  headers: Record<string, string>;
}

const defaultConfig: ScraperConfig = {
  dataSource: 'scraped',

  baseUrl: 'https://www.zara.com',

  endpoints: {
    categories: '/us/categories?ajax=true',
    categoryProducts: '/us/en/category/{categoryId}/products?ajax=true',
    productDetail: '/us/en/product/{productId}?ajax=true',
  },

  rateLimit: {
    delayMs: 1500,
    maxPages: 10,
  },

  minProductsRequired: 10,

  headers: {
    Accept: 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'X-Requested-With': 'XMLHttpRequest',
  },
};

export default defaultConfig;
