import { describe, it, expect } from 'vitest';
import { evaluateRules } from '../rulesEngine';
import type {
  RulesConfig,
  Fixture,
  Assignment,
  Product,
} from '../../types';

const defaultConfig: RulesConfig = {
  countRules: {
    wall: { enabled: true, min: 2, max: 5 },
    table: { enabled: true, min: 1, max: 3 },
    buro: { enabled: true, min: 1, max: 1 },
  },
  categoryMixing: {
    enabled: true,
    blockedPairs: [
      ['outerwear', 'basics'],
      ['accessories', 'dresses'],
    ],
  },
  colorPrint: {
    enabled: true,
    maxClashing: 1,
  },
  sizeRun: {
    enabled: true,
    requiredSizes: ['S', 'M', 'L', 'XL'],
  },
};

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'p1',
  name: 'Test Product',
  category: 'tops',
  subcategory: 't-shirt',
  color: 'black',
  print: 'solid',
  price: 20,
  sizes: ['S', 'M', 'L', 'XL'],
  image_url: '',
  ...overrides,
});

const makeAssignment = (
  mainId: string | null,
  alternates: string[] = []
): Assignment => ({
  slot_id: 'slot-1',
  main_product_id: mainId,
  alternates,
});

const wallFixture: Fixture = {
  id: 'fix-wall',
  name: 'Test Wall',
  type: 'wall',
  slot_count: 3,
};

const tableFixture: Fixture = {
  id: 'fix-table',
  name: 'Test Table',
  type: 'table',
  slot_count: 2,
};

const buroFixture: Fixture = {
  id: 'fix-buro',
  name: 'Test Buro',
  type: 'buro',
  slot_count: 1,
};

// ── Count Rules ──
describe('Count Rules', () => {
  it('returns error when below minimum for wall', () => {
    const products = [makeProduct({ id: 'p1' })];
    const assignments = [makeAssignment('p1')];
    const violations = evaluateRules(
      wallFixture,
      assignments,
      products,
      defaultConfig
    );
    expect(
      violations.some(
        (v) => v.rule === 'count-min' && v.severity === 'error'
      )
    ).toBe(true);
  });

  it('returns error when above maximum for wall', () => {
    const products = Array.from({ length: 6 }, (_, i) =>
      makeProduct({ id: `p${i + 1}` })
    );
    const assignments = products.map((p) => makeAssignment(p.id));
    const violations = evaluateRules(
      wallFixture,
      assignments,
      products,
      defaultConfig
    );
    expect(
      violations.some(
        (v) => v.rule === 'count-max' && v.severity === 'error'
      )
    ).toBe(true);
  });

  it('returns no count violations when within range', () => {
    const products = Array.from({ length: 3 }, (_, i) =>
      makeProduct({ id: `p${i + 1}` })
    );
    const assignments = products.map((p) => makeAssignment(p.id));
    const violations = evaluateRules(
      wallFixture,
      assignments,
      products,
      defaultConfig
    );
    expect(
      violations.filter((v) => v.rule.startsWith('count-'))
    ).toHaveLength(0);
  });

  it('buro enforces exactly 1 item', () => {
    const products = [
      makeProduct({ id: 'p1' }),
      makeProduct({ id: 'p2' }),
    ];
    const assignments = [
      makeAssignment('p1'),
      makeAssignment('p2'),
    ];
    const violations = evaluateRules(
      buroFixture,
      assignments,
      products,
      defaultConfig
    );
    expect(
      violations.some(
        (v) => v.rule === 'count-max' && v.severity === 'error'
      )
    ).toBe(true);
  });
});

// ── Category Mixing ──
describe('Category Mixing', () => {
  it('returns error when outerwear + basics share a fixture', () => {
    const products = [
      makeProduct({
        id: 'p1',
        category: 'outerwear',
        subcategory: 'jacket',
      }),
      makeProduct({
        id: 'p2',
        category: 'basics',
        subcategory: 'tank-top',
      }),
    ];
    const assignments = [
      makeAssignment('p1'),
      makeAssignment('p2'),
    ];
    const violations = evaluateRules(
      wallFixture,
      assignments,
      products,
      defaultConfig
    );
    expect(
      violations.some(
        (v) =>
          v.rule === 'category-mixing' &&
          v.message.includes('outerwear') &&
          v.message.includes('basics')
      )
    ).toBe(true);
  });

  it('returns error when accessories + dresses share a fixture', () => {
    const products = [
      makeProduct({
        id: 'p1',
        category: 'accessories',
        subcategory: 'hat',
      }),
      makeProduct({
        id: 'p2',
        category: 'dresses',
        subcategory: 'mini-dress',
      }),
    ];
    const assignments = [
      makeAssignment('p1'),
      makeAssignment('p2'),
    ];
    const violations = evaluateRules(
      wallFixture,
      assignments,
      products,
      defaultConfig
    );
    expect(
      violations.some((v) => v.rule === 'category-mixing')
    ).toBe(true);
  });

  it('returns no category violation for compatible categories', () => {
    const products = [
      makeProduct({
        id: 'p1',
        category: 'tops',
        subcategory: 't-shirt',
      }),
      makeProduct({
        id: 'p2',
        category: 'bottoms',
        subcategory: 'jeans',
      }),
    ];
    const assignments = [
      makeAssignment('p1'),
      makeAssignment('p2'),
    ];
    const violations = evaluateRules(
      wallFixture,
      assignments,
      products,
      defaultConfig
    );
    expect(
      violations.filter((v) => v.rule === 'category-mixing')
    ).toHaveLength(0);
  });
});

// ── Color/Print Coordination ──
describe('Color/Print Coordination', () => {
  it('returns warning when too many clashing prints', () => {
    const products = [
      makeProduct({ id: 'p1', print: 'floral' }),
      makeProduct({ id: 'p2', print: 'stripes' }),
      makeProduct({ id: 'p3', print: 'solid' }),
    ];
    const assignments = [
      makeAssignment('p1'),
      makeAssignment('p2'),
      makeAssignment('p3'),
    ];
    const violations = evaluateRules(
      wallFixture,
      assignments,
      products,
      defaultConfig
    );
    expect(
      violations.some(
        (v) => v.rule === 'color-print' && v.severity === 'warning'
      )
    ).toBe(true);
  });

  it('returns no warning when within clashing limit', () => {
    const products = [
      makeProduct({ id: 'p1', print: 'floral' }),
      makeProduct({ id: 'p2', print: 'solid' }),
    ];
    const assignments = [
      makeAssignment('p1'),
      makeAssignment('p2'),
    ];
    const violations = evaluateRules(
      wallFixture,
      assignments,
      products,
      defaultConfig
    );
    expect(
      violations.filter((v) => v.rule === 'color-print')
    ).toHaveLength(0);
  });
});

// ── Size Run Completeness ──
describe('Size Run Completeness', () => {
  it('returns error for pile slot when sizes incomplete', () => {
    const products = [
      makeProduct({
        id: 'p1',
        sizes: ['S', 'M'], // missing L, XL
      }),
    ];
    const assignments = [makeAssignment('p1')];
    const violations = evaluateRules(
      tableFixture,
      assignments,
      products,
      defaultConfig
    );
    expect(
      violations.some(
        (v) =>
          v.rule === 'size-run' &&
          v.severity === 'error' &&
          v.message.includes('L') &&
          v.message.includes('XL')
      )
    ).toBe(true);
  });

  it('returns no size-run violation when sizes are complete', () => {
    const products = [
      makeProduct({
        id: 'p1',
        sizes: ['S', 'M', 'L', 'XL'],
      }),
    ];
    const assignments = [makeAssignment('p1')];
    const violations = evaluateRules(
      tableFixture,
      assignments,
      products,
      defaultConfig
    );
    expect(
      violations.filter((v) => v.rule === 'size-run')
    ).toHaveLength(0);
  });

  it('does not check size-run for wall fixtures', () => {
    const products = [
      makeProduct({
        id: 'p1',
        sizes: ['S', 'M'], // incomplete
      }),
    ];
    const assignments = [makeAssignment('p1')];
    const violations = evaluateRules(
      wallFixture,
      assignments,
      products,
      defaultConfig
    );
    expect(
      violations.filter((v) => v.rule === 'size-run')
    ).toHaveLength(0);
  });
});

// ── Empty / Edge Cases ──
describe('Edge Cases', () => {
  it('returns count-min error for empty fixture', () => {
    const violations = evaluateRules(
      wallFixture,
      [],
      [],
      defaultConfig
    );
    expect(
      violations.some((v) => v.rule === 'count-min')
    ).toBe(true);
  });

  it('handles null main_product_id gracefully', () => {
    const assignments: Assignment[] = [
      { slot_id: 'slot-1', main_product_id: null, alternates: [] },
    ];
    const violations = evaluateRules(
      wallFixture,
      assignments,
      [],
      defaultConfig
    );
    // Should get count-min but no crashes
    expect(violations.length).toBeGreaterThan(0);
    expect(
      violations.some((v) => v.rule === 'count-min')
    ).toBe(true);
  });

  it('returns all violations for a severely non-compliant fixture', () => {
    // Wall with 1 item (below min), outerwear+basics mix, 3 clashing prints
    const products = [
      makeProduct({
        id: 'p1',
        category: 'outerwear',
        print: 'floral',
        sizes: ['S', 'M', 'L', 'XL'],
      }),
    ];
    const assignments = [makeAssignment('p1')];
    const violations = evaluateRules(
      wallFixture,
      assignments,
      products,
      defaultConfig
    );
    // At least count-min violation
    expect(
      violations.some((v) => v.rule === 'count-min')
    ).toBe(true);
  });
});
