import { useApp } from '../context/AppContext';
import type { Violation } from '../types';

const fixtureTypeLabels: Record<string, string> = {
  wall: 'Wall Display',
  table: 'Table',
  buro: 'Buro',
};

const fixtureTypeColors: Record<string, string> = {
  wall: '#4a90d9',
  table: '#e6a23c',
  buro: '#67c23a',
};

export default function FixtureBoard() {
  const { fixturesWithSlots, getViolationsForFixture, selectFixture, selectSlot, selectedFixtureId } = useApp();

  return (
    <div className="fixture-board">
      <h2>Fixture Board</h2>
      <div className="fixture-grid">
        {fixturesWithSlots.map(({ fixture, slots }) => {
          const violations = getViolationsForFixture(fixture.id);
          const hasError = violations.some((v) => v.severity === 'error');
          const hasWarning = violations.some((v) => v.severity === 'warning');
          const isSelected = selectedFixtureId === fixture.id;

          return (
            <div
              key={fixture.id}
              className={`fixture-card ${isSelected ? 'selected' : ''} ${hasError ? 'has-error' : ''} ${hasWarning ? 'has-warning' : ''}`}
              onClick={() => selectFixture(fixture.id)}
            >
              <div className="fixture-header">
                <span
                  className="fixture-type-badge"
                  style={{ backgroundColor: fixtureTypeColors[fixture.type] }}
                >
                  {fixtureTypeLabels[fixture.type]}
                </span>
                <span className="fixture-name">{fixture.name}</span>
              </div>

              <div className="slots-container">
                {slots.map((slot) => {
                  return (
                    <SlotCard
                      key={slot.id}
                      slot={slot}
                      isSelected={false}
                      onSelect={() => selectSlot(slot.id)}
                    />
                  );
                })}
              </div>

              {violations.length > 0 && (
                <ViolationsList violations={violations} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SlotCard({
  slot,
  onSelect,
}: {
  slot: { id: string; slot_type: string; position: number; assignment: { main_product_id: string | null } | null };
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { products } = useApp();
  const mainProduct = slot.assignment?.main_product_id
    ? products.find((p) => p.id === slot.assignment!.main_product_id)
    : null;

  const slotTypeIcons: Record<string, string> = {
    outfit: '👔',
    pile: '📦',
    single: '⭐',
  };

  return (
    <div className="slot-card" onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      <div className="slot-header">
        <span className="slot-position">#{slot.position}</span>
        <span className="slot-type-label" title={slot.slot_type}>
          {slotTypeIcons[slot.slot_type] || '•'}
        </span>
      </div>
      {mainProduct ? (
        <div className="slot-product">
          <img
            src={mainProduct.image_url}
            alt={mainProduct.name}
            className="slot-product-image"
          />
          <div className="slot-product-info">
            <span className="slot-product-name">{mainProduct.name}</span>
            <span className="slot-product-price">${mainProduct.price.toFixed(2)}</span>
          </div>
        </div>
      ) : (
        <div className="slot-empty">
          <span>Empty Slot</span>
        </div>
      )}
    </div>
  );
}

function ViolationsList({ violations }: { violations: Violation[] }) {
  return (
    <div className="violations-list">
      {violations.map((v, i) => (
        <div key={i} className={`violation violation-${v.severity}`}>
          <span className="violation-icon">
            {v.severity === 'error' ? '🔴' : '🟡'}
          </span>
          <span className="violation-message">{v.message}</span>
        </div>
      ))}
    </div>
  );
}
