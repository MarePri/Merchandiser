import { describe, it, expect } from 'vitest';
import {
  normalizeProduct,
  normalizeProducts,
  type ZaraCategoryProduct,
  type ZaraProductDetail,
} from '../normalizer';

describe('normalizeProduct', () => {
  const baseRaw: ZaraCategoryProduct = {
    id: 12345,
    name: 'Oversized T-Shirt',
    type: 't-shirts',
    seo: { keyword: 'oversized-t-shirt' },
  };

  it('normalizes a basic product with detail data', () => {
    const detail: ZaraProductDetail = {
      id: 12345,
      name: 'Oversized T-Shirt',
      reference: 'REF001',
      category: 'T-shirts',
      subcategory: 't-shirt',
      color: 'Black',
      colors: [
        {
          id: 1,
          name: 'Black',
          sizes: [
            { name: 'S', availability: 'in_stock' },
            { name: 'M', availability: 'in_stock' },
            { name: 'L', availability: 'in_stock' },
            { name: 'XL', availability: 'low_stock' },
          ],
          images: [{ src: '//static.zara.net/photos/test.jpg' }],
        },
      ],
      price: 25.95,
      print: 'solid',
    };

    const product = normalizeProduct(baseRaw, detail);

    expect(product.id).toBe('zara-12345');
    expect(product.name).toBe('Oversized T-Shirt');
    expect(product.category).toBe('tops');
    expect(product.subcategory).toBe('t-shirt');
    expect(product.color).toBe('black');
    expect(product.print).toBe('solid');
    expect(product.price).toBe(25.95);
    expect(product.sizes).toEqual(['S', 'M', 'L', 'XL']);
    expect(product.image_url).toBe('https://static.zara.net/photos/test.jpg');
  });

  it('maps Zara categories to internal categories', () => {
    const testCases: [string, string][] = [
      ['T-shirts', 'tops'],
      ['Jeans', 'bottoms'],
      ['Jackets', 'outerwear'],
      ['Dresses', 'dresses'],
      ['Bags', 'accessories'],
      ['Basics', 'basics'],
    ];

    for (const [zaraCategory, expected] of testCases) {
      const raw = { ...baseRaw, type: zaraCategory.toLowerCase() };
      const detail: ZaraProductDetail = {
        ...baseRaw as any,
        category: zaraCategory,
        color: 'Black',
        colors: [],
        price: 20,
      };
      const product = normalizeProduct(raw, detail);
      expect(product.category).toBe(expected);
    }
  });

  it('maps Zara colors to internal colors', () => {
    const testCases: [string, string][] = [
      ['Black', 'black'],
      ['White', 'white'],
      ['Navy Blue', 'navy'],
      ['Beige', 'beige'],
      ['Olive Green', 'olive'],
      ['Dusty Pink', 'pink'],
      ['Dark Grey', 'grey'],
    ];

    for (const [zaraColor, expected] of testCases) {
      const detail: ZaraProductDetail = {
        id: 1,
        name: 'Test',
        reference: 'R',
        category: 'T-shirts',
        color: zaraColor,
        colors: [],
        price: 20,
      };
      const product = normalizeProduct(baseRaw, detail);
      expect(product.color).toBe(expected);
    }
  });

  it('defaults print to solid when not provided', () => {
    const product = normalizeProduct(baseRaw);
    expect(product.print).toBe('solid');
  });

  it('maps Zara prints to internal prints', () => {
    const testCases: [string, string][] = [
      ['Striped', 'stripes'],
      ['Floral', 'floral'],
      ['Check', 'check'],
      ['Graphic', 'graphic'],
      ['Leopard', 'animal-print'],
    ];

    for (const [zaraPrint, expected] of testCases) {
      const detail: ZaraProductDetail = {
        id: 1,
        name: 'Test',
        reference: 'R',
        category: 'T-shirts',
        color: 'Black',
        colors: [],
        price: 20,
        print: zaraPrint,
      };
      const product = normalizeProduct(baseRaw, detail);
      expect(product.print).toBe(expected);
    }
  });

  it('handles missing detail gracefully', () => {
    const product = normalizeProduct(baseRaw);
    expect(product.id).toBe('zara-12345');
    expect(product.name).toBe('Oversized T-Shirt');
    expect(product.category).toBe('tops');
    expect(product.print).toBe('solid');
    expect(product.sizes).toEqual([]); // no detail, no raw sizes → empty
  });

  it('filters out out-of-stock sizes', () => {
    const detail: ZaraProductDetail = {
      id: 1,
      name: 'Test',
      reference: 'R',
      category: 'T-shirts',
      color: 'Black',
      colors: [
        {
          id: 1,
          name: 'Black',
          sizes: [
            { name: 'XS', availability: 'out_of_stock' },
            { name: 'S', availability: 'in_stock' },
            { name: 'M', availability: 'in_stock' },
            { name: 'L', availability: 'out_of_stock' },
            { name: 'XL', availability: 'in_stock' },
          ],
          images: [],
        },
      ],
      price: 20,
    };
    const product = normalizeProduct(baseRaw, detail);
    expect(product.sizes).toEqual(['S', 'M', 'XL']);
  });

  it('normalizes prices correctly', () => {
    const testCases: [number, number][] = [
      [25.95, 25.95],
      [2595, 2595],
      [0, 0],
      [99.99, 99.99],
    ];

    for (const [input, expected] of testCases) {
      const detail: ZaraProductDetail = {
        id: 1,
        name: 'Test',
        reference: 'R',
        category: 'T-shirts',
        color: 'Black',
        colors: [],
        price: input,
      };
      const product = normalizeProduct(baseRaw, detail);
      expect(product.price).toBe(expected);
    }
  });
});

describe('normalizeProducts', () => {
  it('normalizes a batch of products with detail data', () => {
    const rawProducts: ZaraCategoryProduct[] = [
      { id: 1, name: 'Shirt A', type: 'shirts', seo: { keyword: 'shirt-a' } },
      { id: 2, name: 'Shirt B', type: 'shirts', seo: { keyword: 'shirt-b' } },
      { id: 3, name: 'Jeans C', type: 'jeans', seo: { keyword: 'jeans-c' } },
    ];

    const details = new Map<number, ZaraProductDetail>([
      [1, { id: 1, name: 'Shirt A', reference: 'R1', category: 'Shirts', color: 'White', colors: [], price: 29.99 }],
      [2, { id: 2, name: 'Shirt B', reference: 'R2', category: 'Shirts', color: 'Blue', colors: [], price: 24.99 }],
      [3, { id: 3, name: 'Jeans C', reference: 'R3', category: 'Jeans', color: 'Black', colors: [], price: 49.99 }],
    ]);

    const products = normalizeProducts(rawProducts, details);
    expect(products.length).toBe(3);
    expect(products[0].category).toBe('tops');
    expect(products[2].category).toBe('bottoms');
  });

  it('filters out products with no price or unknown name', () => {
    const rawProducts: ZaraCategoryProduct[] = [
      { id: 1, name: 'Good Product', type: 't-shirts', seo: { keyword: 'good' } },
      { id: 2, name: 'Unknown Product', type: 't-shirts', seo: { keyword: 'unknown' } },
    ];

    const products = normalizeProducts(rawProducts);
    // Both have price 0 from missing detail, so "Unknown Product" is filtered
    // but "Good Product" has a valid name and would need detail for price > 0
    expect(products.every((p) => p.name !== 'Unknown Product')).toBe(true);
  });
});
