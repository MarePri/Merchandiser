/**
 * Normalizer — maps raw retailer data onto our Product shape.
 * This is the critical translation layer between Zara's taxonomy and ours.
 */
import type { Product } from '../types';
import categoryMapping from './categoryMap';

// ── Raw Zara product shapes (what their API returns) ──

/** A product from Zara's category listing */
export interface ZaraCategoryProduct {
  id: number;
  name: string;
  type: string;
  seo: {
    keyword: string;
    seoProductId?: string;
  };
  detail?: {
    colors: ZaraColor[];
  };
}

/** Color detail from Zara */
export interface ZaraColor {
  id: number;
  name: string;
  images?: {
    [view: string]: {
      src: string;
      type: string;
    };
  };
  sizes?: ZaraSize[];
}

/** Size detail from Zara */
export interface ZaraSize {
  id: number;
  name: string;
  availability: string;
}

/** Flattened product from Zara's product detail API */
export interface ZaraProductDetail {
  id: number;
  name: string;
  reference: string;
  category: string;
  subcategory?: string;
  color: string;
  colors: Array<{
    id: number;
    name: string;
    sizes: Array<{
      name: string;
      availability: string;
    }>;
    images: Array<{
      src: string;
    }>;
  }>;
  price: number;
  oldPrice?: number;
  print?: string;
  composition?: string[];
}

// ── Normalization functions ──

function mapCategory(rawCategory: string): string {
  const lower = rawCategory.toLowerCase().trim();
  return categoryMapping.categoryMap[lower] || inferCategory(lower);
}

function mapSubcategory(rawSubcategory: string): string {
  const lower = rawSubcategory.toLowerCase().trim();
  return categoryMapping.subcategoryMap[lower] || lower.replace(/\s+/g, '-');
}

function mapColor(rawColor: string): string {
  const lower = rawColor.toLowerCase().trim();
  return categoryMapping.colorMap[lower] || lower;
}

function mapPrint(rawPrint: string | undefined): string {
  if (!rawPrint) return 'solid';
  const lower = rawPrint.toLowerCase().trim();
  return categoryMapping.printMap[lower] || 'solid';
}

/** Infer category from name/context when explicit category is missing */
function inferCategory(name: string): string {
  const lower = name.toLowerCase();

  if (/jacket|coat|blazer|bomber|parka|puffer|gilet/.test(lower)) return 'outerwear';
  if (/dress|jumpsuit|playsuit/.test(lower)) return 'dresses';
  if (/jean|trouser|short|skirt|legging|jogger/.test(lower)) return 'bottoms';
  if (/hat|scarf|belt|bag|sunglass/.test(lower)) return 'accessories';
  if (/tank|cami|bodysuit|basic/.test(lower)) return 'basics';
  if (/t-shirt|shirt|polo|blouse|knit|sweater|hoodie|sweatshirt|top/.test(lower)) return 'tops';

  return 'tops'; // default fallback
}

/** Normalize a price (handle cents, currency symbols, etc.) */
function normalizePrice(raw: number | string): number {
  if (typeof raw === 'number') return Math.round(raw * 100) / 100;
  const parsed = parseFloat(String(raw).replace(/[^0-9.]/g, ''));
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
}

/** Extract available sizes from Zara color/size data */
function extractSizes(colors: ZaraColor[]): string[] {
  const sizeSet = new Set<string>();
  for (const color of colors) {
    if (color.sizes) {
      for (const size of color.sizes) {
        if (size.availability === 'in_stock' || size.availability === 'low_stock') {
          sizeSet.add(size.name);
        }
      }
    }
  }
  return Array.from(sizeSet);
}

/** Extract image URL from Zara color images */
function extractImageUrl(colors: ZaraColor[]): string {
  for (const color of colors) {
    if (color.images) {
      const frontView = color.images['front'] || color.images['def'];
      if (frontView?.src) {
        return frontView.src.startsWith('//')
          ? `https:${frontView.src}`
          : frontView.src;
      }
      // Fallback to first available image
      const firstImage = Object.values(color.images)[0];
      if (firstImage?.src) {
        return firstImage.src.startsWith('//')
          ? `https:${firstImage.src}`
          : firstImage.src;
      }
    }
  }
  return '';
}

/**
 * Normalize a single Zara category product + optional detail data
 * into our Product shape.
 */
export function normalizeProduct(
  raw: ZaraCategoryProduct,
  detail?: ZaraProductDetail
): Product {
  const name = detail?.name || raw.name || 'Unknown Product';
  const category = detail?.category
    ? mapCategory(detail.category)
    : mapCategory(raw.type || '');
  const subcategory = detail?.subcategory
    ? mapSubcategory(detail.subcategory)
    : mapSubcategory(raw.type || '');
  const color = detail?.color
    ? mapColor(detail.color)
    : detail?.colors?.[0]?.name
    ? mapColor(detail.colors[0].name)
    : 'black';

  const sizes = detail?.colors
    ? extractSizes(detail.colors.map(c => ({
        id: c.id,
        name: c.name,
        sizes: c.sizes.map(s => ({ id: 0, name: s.name, availability: s.availability })),
      })))
    : raw.detail?.colors
    ? extractSizes(raw.detail.colors)
    : [];

  const image_url = detail?.colors?.[0]?.images?.[0]?.src
    ? (detail.colors[0].images[0].src.startsWith('//')
        ? `https:${detail.colors[0].images[0].src}`
        : detail.colors[0].images[0].src)
    : raw.detail?.colors
    ? extractImageUrl(raw.detail.colors)
    : '';

  return {
    id: `zara-${raw.id}`,
    name,
    category,
    subcategory,
    color,
    print: mapPrint(detail?.print),
    price: normalizePrice(detail?.price ?? 0),
    sizes,
    image_url,
  };
}

/**
 * Normalize a batch of Zara category products.
 */
export function normalizeProducts(
  rawProducts: ZaraCategoryProduct[],
  details?: Map<number, ZaraProductDetail>
): Product[] {
  return rawProducts
    .map((raw) => {
      const detail = details?.get(raw.id);
      return normalizeProduct(raw, detail);
    })
    .filter((p) => p.name !== 'Unknown Product' && p.price > 0);
}
