import { describe, it, expect } from 'vitest';
import {
  serializeCache,
  parseCache,
  validateCachedProducts,
  type CacheEntry,
} from '../cache';
import type { Product } from '../../types';

const validProduct: Product = {
  id: 'p001',
  name: 'Test Shirt',
  category: 'tops',
  subcategory: 'shirt',
  color: 'white',
  print: 'solid',
  price: 29.99,
  sizes: ['S', 'M', 'L'],
  image_url: 'https://example.com/img.jpg',
};

describe('serializeCache', () => {
  it('produces valid JSON with required fields', () => {
    const json = serializeCache([validProduct], 'zara.com');
    const parsed = JSON.parse(json) as CacheEntry;

    expect(parsed.timestamp).toBeDefined();
    expect(parsed.source).toBe('zara.com');
    expect(parsed.productCount).toBe(1);
    expect(parsed.products).toHaveLength(1);
    expect(parsed.products[0].id).toBe('p001');
  });
});

describe('parseCache', () => {
  it('parses a valid cache entry', () => {
    const entry: CacheEntry = {
      timestamp: new Date().toISOString(),
      source: 'zara.com',
      productCount: 1,
      products: [validProduct],
    };
    const result = parseCache(JSON.stringify(entry));

    expect(result).not.toBeNull();
    expect(result!.products).toHaveLength(1);
    expect(result!.source).toBe('zara.com');
  });

  it('returns null for invalid JSON', () => {
    expect(parseCache('not json')).toBeNull();
  });

  it('returns null for missing required fields', () => {
    expect(parseCache('{}')).toBeNull();
    expect(parseCache('{"timestamp":"2024-01-01"}')).toBeNull();
  });

  it('returns null when cache is expired', () => {
    const entry: CacheEntry = {
      timestamp: new Date(Date.now() - 100000).toISOString(),
      source: 'zara.com',
      productCount: 1,
      products: [validProduct],
    };
    const result = parseCache(JSON.stringify(entry), 50000); // maxAge 50s
    expect(result).toBeNull();
  });

  it('returns valid entry when within maxAge', () => {
    const entry: CacheEntry = {
      timestamp: new Date().toISOString(),
      source: 'zara.com',
      productCount: 1,
      products: [validProduct],
    };
    const result = parseCache(JSON.stringify(entry), 60000); // maxAge 60s
    expect(result).not.toBeNull();
  });
});

describe('validateCachedProducts', () => {
  it('keeps valid products', () => {
    const result = validateCachedProducts([validProduct]);
    expect(result).toHaveLength(1);
  });

  it('filters out products missing required fields', () => {
    const invalid = {
      id: 'p001',
      name: 'Test',
      // missing other fields
    };
    const result = validateCachedProducts([invalid as any, validProduct]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('p001');
  });

  it('filters out non-array sizes', () => {
    const bad = { ...validProduct, sizes: 'not an array' };
    const result = validateCachedProducts([bad as any]);
    expect(result).toHaveLength(0);
  });

  it('filters out non-number price', () => {
    const bad = { ...validProduct, price: '29.99' };
    const result = validateCachedProducts([bad as any]);
    expect(result).toHaveLength(0);
  });

  it('handles empty input', () => {
    expect(validateCachedProducts([])).toHaveLength(0);
  });
});
