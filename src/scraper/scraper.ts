/**
 * Scraper Orchestrator
 *
 * Main entry point for the scraping pipeline:
 * fetch categories → fetch products → normalize → cache
 *
 * This module is the ONLY thing that ties fetcher + normalizer + cache together.
 * Nothing else in the app imports this directly — the app only calls refreshCatalog().
 */
import type { Product } from '../types';
import type { ScraperConfig } from './config';
import defaultConfig from './config';
import { fetchJson, sleep } from './fetcher';
import { normalizeProducts } from './normalizer';
import { serializeCache, validateCachedProducts } from './cache';
import type { ZaraCategoryProduct } from './normalizer';

// ── Zara API Response Types ──

interface ZaraCategoryNode {
  id: number;
  key: string;
  name: string;
  sectionName: string;
  seo?: {
    keyword: string;
    seoCategoryId?: number;
  };
  subcategories?: ZaraCategoryNode[];
}

interface ZaraCategoriesResponse {
  categories: ZaraCategoryNode[];
}

interface ZaraProductListResponse {
  productGroups?: Array<{
    elements: Array<{
      type: string;
      id: number;
      name: string;
      seo?: { keyword: string };
      detail?: {
        colors: Array<{
          id: number;
          name: string;
        }>;
      };
    }>;
  }>;
  // Alternative shape — some categories return flat products
  components?: Array<{
    products: ZaraCategoryProduct[];
  }>;
  // Another shape — search results
  results?: ZaraCategoryProduct[];
}

// ── Main Scraper Class ──

export interface ScrapeResult {
  success: boolean;
  products: Product[];
  error?: string;
  categoriesScraped: number;
  productsFound: number;
}

export class ZaraScraper {
  private config: ScraperConfig;
  private pagesFetched: number = 0;

  constructor(config: ScraperConfig = defaultConfig) {
    this.config = config;
  }

  /**
   * Main entry point: fetch → parse → normalize → serialize.
   * Returns serialized cache JSON ready to write to disk.
   */
  async scrape(): Promise<ScrapeResult> {
    this.pagesFetched = 0;
    const allProducts: Product[] = [];
    let categoriesScraped = 0;

    try {
      // Step 1: Fetch category tree
      const categories = await this.fetchCategories();
      categoriesScraped = categories.length;

      // Step 2: Fetch products from each category (up to maxPages)
      for (const category of categories) {
        if (this.pagesFetched >= this.config.rateLimit.maxPages) {
          break;
        }

        try {
          const products = await this.fetchCategoryProducts(category);
          allProducts.push(...products);
          this.pagesFetched++;

          // Rate limit delay between requests
          if (this.pagesFetched < this.config.rateLimit.maxPages) {
            await sleep(this.config.rateLimit.delayMs);
          }
        } catch {
          // Skip failed categories — log but continue
          console.warn(`Failed to scrape category: ${category.name}`);
        }
      }

      // Step 3: Deduplicate by name
      const deduplicated = this.deduplicateProducts(allProducts);

      // Step 4: Validate
      const validated = validateCachedProducts(deduplicated);

      // Step 5: Check minimum threshold
      if (validated.length < this.config.minProductsRequired) {
        return {
          success: false,
          products: validated,
          error: `Only found ${validated.length} products (minimum: ${this.config.minProductsRequired}). Cache NOT overwritten.`,
          categoriesScraped,
          productsFound: validated.length,
        };
      }

      return {
        success: true,
        products: validated,
        categoriesScraped,
        productsFound: validated.length,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        products: allProducts,
        error: `Scrape failed: ${message}`,
        categoriesScraped,
        productsFound: allProducts.length,
      };
    }
  }

  /**
   * Get the serialized cache JSON string from a successful scrape.
   */
  getCacheJson(products: Product[]): string {
    return serializeCache(products, 'zara.com');
  }

  // ── Private Methods ──

  /**
   * Fetch category tree from Zara's public categories API.
   * Returns flat list of scrapeable category nodes with IDs.
   */
  private async fetchCategories(): Promise<ZaraCategoryNode[]> {
    const url = `${this.config.baseUrl}${this.config.endpoints.categories}`;
    const response = await fetchJson<ZaraCategoriesResponse>(url, this.config);

    if (!response.categories) {
      throw new Error('No categories found in API response');
    }

    // Flatten category tree into scrapeable leaf categories
    const leaves: ZaraCategoryNode[] = [];
    for (const section of response.categories) {
      this.collectLeafCategories(section, leaves);
    }

    return leaves;
  }

  /**
   * Recursively collect leaf categories (those with seo keywords = product listings).
   */
  private collectLeafCategories(
    node: ZaraCategoryNode,
    leaves: ZaraCategoryNode[]
  ): void {
    if (node.subcategories && node.subcategories.length > 0) {
      for (const child of node.subcategories) {
        this.collectLeafCategories(child, leaves);
      }
    } else if (node.seo?.keyword) {
      leaves.push(node);
    }
  }

  /**
   * Fetch products from a single category page.
   */
  private async fetchCategoryProducts(
    category: ZaraCategoryNode
  ): Promise<Product[]> {
    const categoryUrl =
      this.config.baseUrl +
      this.config.endpoints.categoryProducts.replace(
        '{categoryId}',
        String(category.seo?.seoCategoryId || category.id)
      );

    try {
      const response = await fetchJson<ZaraProductListResponse>(
        categoryUrl,
        this.config
      );

      // Try to extract products from various response shapes
      const rawProducts = this.extractProductsFromResponse(response);

      if (rawProducts.length === 0) {
        return [];
      }

      return normalizeProducts(rawProducts);
    } catch {
      return [];
    }
  }

  /**
   * Extract product list from various Zara API response shapes.
   */
  private extractProductsFromResponse(
    response: ZaraProductListResponse
  ): ZaraCategoryProduct[] {
    // Shape 1: productGroups with elements
    if (response.productGroups) {
      const products: ZaraCategoryProduct[] = [];
      for (const group of response.productGroups) {
        if (group.elements) {
          for (const el of group.elements) {
            if (el.type === 'Product') {
              products.push({
                id: el.id,
                name: el.name,
                type: el.type,
                seo: el.seo || { keyword: '' },
                detail: el.detail,
              });
            }
          }
        }
      }
      return products;
    }

    // Shape 2: components with products
    if (response.components) {
      const products: ZaraCategoryProduct[] = [];
      for (const comp of response.components) {
        if (comp.products) {
          products.push(...comp.products);
        }
      }
      return products;
    }

    // Shape 3: results array
    if (response.results) {
      return response.results;
    }

    return [];
  }

  /**
   * Deduplicate products by name (keep first occurrence).
   */
  private deduplicateProducts(products: Product[]): Product[] {
    const seen = new Set<string>();
    return products.filter((p) => {
      const key = p.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
