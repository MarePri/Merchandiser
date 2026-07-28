/** ── Product ── */
export interface Product {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  color: string;
  print: string;
  price: number;
  sizes: string[];
  image_url: string;
}

/** ── Fixture ── */
export type FixtureType = 'wall' | 'table' | 'buro';

export type SlotType = 'outfit' | 'pile' | 'single';

export const fixtureSlotTypeMap: Record<FixtureType, SlotType> = {
  wall: 'outfit',
  table: 'pile',
  buro: 'single',
};

export interface Fixture {
  id: string;
  name: string;
  type: FixtureType;
  slot_count: number;
}

/** ── Slot ── */
export interface Slot {
  id: string;
  fixture_id: string;
  slot_type: SlotType;
  position: number;
}

/** ── Assignment ── */
export interface Assignment {
  slot_id: string;
  main_product_id: string | null;
  alternates: string[];
}

/** ── Store ── */
export interface Store {
  id: string;
  name: string;
  fixture_ids: string[];
}

/** ── Rules ── */
export type RuleSeverity = 'error' | 'warning';

export interface Violation {
  rule: string;
  severity: RuleSeverity;
  message: string;
}

export interface CountRule {
  enabled: boolean;
  min: number;
  max: number;
}

export interface CategoryMixingRule {
  enabled: boolean;
  blockedPairs: string[][]; // e.g. [["outerwear", "basics"]]
}

export interface ColorPrintRule {
  enabled: boolean;
  maxClashing: number;
}

export interface SizeRunRule {
  enabled: boolean;
  requiredSizes: string[]; // e.g. ["S", "M", "L", "XL"]
}

export interface RulesConfig {
  countRules: Record<FixtureType, CountRule>;
  categoryMixing: CategoryMixingRule;
  colorPrint: ColorPrintRule;
  sizeRun: SizeRunRule;
}

/** ── Combined fixture view ── */
export interface FixtureWithSlots {
  fixture: Fixture;
  slots: (Slot & { assignment: Assignment | null })[];
}
