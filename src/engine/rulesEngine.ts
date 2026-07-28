import type {
  RulesConfig,
  Fixture,
  Assignment,
  Product,
  Violation,
  FixtureType,
} from '../types';

/**
 * Rules Engine — standalone, unit-testable, data-driven.
 * Takes a Fixture + its Assignments + all Products + a RulesConfig,
 * and returns a list of violations.
 */
export function evaluateRules(
  fixture: Fixture,
  assignments: Assignment[],
  products: Product[],
  config: RulesConfig
): Violation[] {
  const violations: Violation[] = [];

  // Resolve product IDs to Product objects for quick lookup
  const productMap = new Map(products.map((p) => [p.id, p]));

  const mainProductIds = assignments
    .map((a) => a.main_product_id)
    .filter((id): id is string => id !== null);

  const mainProducts = mainProductIds
    .map((id) => productMap.get(id))
    .filter((p): p is Product => p !== undefined);

  // ── Count Rules ──
  violations.push(...evaluateCountRules(fixture, mainProducts.length, config));

  // ── Category Mixing ──
  violations.push(
    ...evaluateCategoryMixing(fixture, mainProducts, config)
  );

  // ── Color/Print Coordination ──
  violations.push(
    ...evaluateColorPrint(fixture, mainProducts, config)
  );

  // ── Size Run Completeness (pile slots) ──
  violations.push(
    ...evaluateSizeRun(fixture, assignments, productMap, config)
  );

  return violations;
}

/** Count rules — min/max items per fixture type */
function evaluateCountRules(
  fixture: Fixture,
  mainCount: number,
  config: RulesConfig
): Violation[] {
  const violations: Violation[] = [];
  const rule = config.countRules[fixture.type as FixtureType];

  if (!rule?.enabled) return violations;

  if (mainCount < rule.min) {
    violations.push({
      rule: 'count-min',
      severity: 'error',
      message: `Fixture "${fixture.name}" needs at least ${rule.min} item(s), but has ${mainCount}.`,
    });
  }

  if (mainCount > rule.max) {
    violations.push({
      rule: 'count-max',
      severity: 'error',
      message: `Fixture "${fixture.name}" allows at most ${rule.max} item(s), but has ${mainCount}.`,
    });
  }

  return violations;
}

/** Category mixing — blocked pairs can't share a fixture */
function evaluateCategoryMixing(
  fixture: Fixture,
  mainProducts: Product[],
  config: RulesConfig
): Violation[] {
  const violations: Violation[] = [];
  const { enabled, blockedPairs } = config.categoryMixing;

  if (!enabled || mainProducts.length < 2) return violations;

  const categories = mainProducts.map((p) => p.category);

  for (const [catA, catB] of blockedPairs) {
    const hasA = categories.includes(catA);
    const hasB = categories.includes(catB);

    if (hasA && hasB) {
      violations.push({
        rule: 'category-mixing',
        severity: 'error',
        message: `Fixture "${fixture.name}" mixes blocked categories: "${catA}" + "${catB}".`,
      });
    }
  }

  return violations;
}

/** Color/print coordination — max clashing prints */
function evaluateColorPrint(
  fixture: Fixture,
  mainProducts: Product[],
  config: RulesConfig
): Violation[] {
  const violations: Violation[] = [];
  const { enabled, maxClashing } = config.colorPrint;

  if (!enabled || mainProducts.length < 2) return violations;

  // Count non-solid prints as "clashing"
  const clashingCount = mainProducts.filter(
    (p) => p.print !== 'solid'
  ).length;

  if (clashingCount > maxClashing) {
    violations.push({
      rule: 'color-print',
      severity: 'warning',
      message: `Fixture "${fixture.name}" has ${clashingCount} clashing print(s), max allowed is ${maxClashing}.`,
    });
  }

  return violations;
}

/** Size-run completeness — for pile slots, main product must have full size curve */
function evaluateSizeRun(
  fixture: Fixture,
  assignments: Assignment[],
  productMap: Map<string, Product>,
  config: RulesConfig
): Violation[] {
  const violations: Violation[] = [];
  const { enabled, requiredSizes } = config.sizeRun;

  if (!enabled) return violations;

  // Only check pile slots (table fixtures)
  if (fixture.type !== 'table') return violations;

  for (const assignment of assignments) {
    if (!assignment.main_product_id) continue;

    const product = productMap.get(assignment.main_product_id);
    if (!product) continue;

    const missingSizes = requiredSizes.filter(
      (s) => !product.sizes.includes(s)
    );

    if (missingSizes.length > 0) {
      violations.push({
        rule: 'size-run',
        severity: 'error',
        message: `Product "${product.name}" on fixture "${fixture.name}" is missing required sizes: ${missingSizes.join(', ')}.`,
      });
    }
  }

  return violations;
}
