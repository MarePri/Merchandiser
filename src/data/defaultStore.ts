import type { Store, Fixture, Slot, Assignment } from '../types';
import { fixtureSlotTypeMap } from '../types';

/**
 * Default store data — a single store with various fixture types.
 * This is seed data; in a real app this would come from a database.
 */

export const defaultStore: Store = {
  id: 'store-001',
  name: 'Flagship Store',
  fixture_ids: ['fix-001', 'fix-002', 'fix-003', 'fix-004', 'fix-005'],
};

export const defaultFixtures: Fixture[] = [
  { id: 'fix-001', name: 'Front Wall Display', type: 'wall', slot_count: 3 },
  { id: 'fix-002', name: 'Center Table', type: 'table', slot_count: 2 },
  { id: 'fix-003', name: 'Window Buro', type: 'buro', slot_count: 1 },
  { id: 'fix-004', name: 'Back Wall', type: 'wall', slot_count: 4 },
  { id: 'fix-005', name: 'Side Table', type: 'table', slot_count: 2 },
];

/** Generate slots from fixtures */
export function generateSlots(fixtures: Fixture[]): Slot[] {
  const slots: Slot[] = [];
  for (const fixture of fixtures) {
    for (let i = 0; i < fixture.slot_count; i++) {
      slots.push({
        id: `slot-${fixture.id}-${i + 1}`,
        fixture_id: fixture.id,
        slot_type: fixtureSlotTypeMap[fixture.type],
        position: i + 1,
      });
    }
  }
  return slots;
}

/** Start with empty assignments for all slots */
export function generateEmptyAssignments(slots: Slot[]): Assignment[] {
  return slots.map((slot) => ({
    slot_id: slot.id,
    main_product_id: null,
    alternates: [],
  }));
}

export const defaultSlots = generateSlots(defaultFixtures);
export const defaultAssignments = generateEmptyAssignments(defaultSlots);
