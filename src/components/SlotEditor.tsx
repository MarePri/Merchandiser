import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { suggestAlternates } from '../engine';

export default function SlotEditor() {
  const {
    products,
    slots,
    assignments,
    selectedSlotId,
    selectSlot,
    setMainProduct,
    addAlternate,
    removeAlternate,
    reorderAlternates,
    fixtures,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  const selectedSlot = selectedSlotId
    ? slots.find((s) => s.id === selectedSlotId)
    : null;

  const selectedAssignment = selectedSlotId
    ? assignments.find((a) => a.slot_id === selectedSlotId) ?? null
    : null;

  const selectedFixture = selectedSlot
    ? fixtures.find((f) => f.id === selectedSlot.fixture_id)
    : null;

  const mainProduct = selectedAssignment?.main_product_id
    ? products.find((p) => p.id === selectedAssignment.main_product_id) ?? null
    : null;

  // Filter products for search
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return products.slice(0, 20);
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.color.toLowerCase().includes(q) ||
        p.subcategory.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  // Suggested alternates
  const suggested = useMemo(
    () => (mainProduct ? suggestAlternates(mainProduct, products, selectedAssignment) : []),
    [mainProduct, products, selectedAssignment]
  );

  const assignedAlternates = selectedAssignment?.alternates
    ? selectedAssignment.alternates
        .map((id) => products.find((p) => p.id === id))
        .filter(Boolean)
    : [];

  const suggestedNotAssigned = suggested.filter(
    (s) => !selectedAssignment?.alternates.includes(s.id)
  );

  if (!selectedSlot) {
    return (
      <div className="slot-editor empty">
        <div className="empty-state">
          <span className="empty-icon">👈</span>
          <p>Select a slot from the fixture board to edit it.</p>
        </div>
      </div>
    );
  }

  const slotTypeLabels: Record<string, string> = {
    outfit: 'Outfit (Wall)',
    pile: 'Pile (Table)',
    single: 'Single (Buro)',
  };

  return (
    <div className="slot-editor">
      <div className="editor-header">
        <h2>Edit Slot</h2>
        <button className="close-btn" onClick={() => selectSlot(null)}>
          ✕
        </button>
      </div>

      <div className="editor-meta">
        <span className="meta-item">
          <strong>Fixture:</strong> {selectedFixture?.name}
        </span>
        <span className="meta-item">
          <strong>Type:</strong>{' '}
          {slotTypeLabels[selectedSlot.slot_type]}
        </span>
        <span className="meta-item">
          <strong>Position:</strong> #{selectedSlot.position}
        </span>
      </div>

      {/* Main Product Picker */}
      <div className="editor-section">
        <h3>Main Product</h3>
        {mainProduct && (
          <div className="current-product">
            <img
              src={mainProduct.image_url}
              alt={mainProduct.name}
              className="current-product-image"
            />
            <div className="current-product-info">
              <span className="current-product-name">{mainProduct.name}</span>
              <span className="current-product-detail">
                {mainProduct.color} · {mainProduct.category} · $
                {mainProduct.price.toFixed(2)}
              </span>
            </div>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setMainProduct(selectedSlot.id, null)}
            >
              Remove
            </button>
          </div>
        )}

        <div className="product-search">
          <input
            type="text"
            placeholder="Search products by name, category, color..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="product-list">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`product-item ${product.id === mainProduct?.id ? 'active' : ''}`}
              onClick={() => {
                setMainProduct(selectedSlot.id, product.id);
                setSearchQuery('');
              }}
            >
              <img
                src={product.image_url}
                alt={product.name}
                className="product-item-image"
              />
              <div className="product-item-info">
                <span className="product-item-name">{product.name}</span>
                <span className="product-item-detail">
                  {product.color} · {product.print} · ${product.price.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assigned Alternates */}
      {assignedAlternates.length > 0 && (
        <div className="editor-section">
          <h3>Assigned Alternates ({assignedAlternates.length})</h3>
          <div className="alternate-list">
            {assignedAlternates.map((product, index) => (
              <div key={product!.id} className="alternate-item">
                <span className="alternate-order">{index + 1}</span>
                <img
                  src={product!.image_url}
                  alt={product!.name}
                  className="alternate-image"
                />
                <span className="alternate-name">{product!.name}</span>
                <div className="alternate-actions">
                  {index > 0 && (
                    <button
                      className="btn btn-sm"
                      onClick={() =>
                        reorderAlternates(selectedSlot.id, index, index - 1)
                      }
                    >
                      ↑
                    </button>
                  )}
                  {index < assignedAlternates.length - 1 && (
                    <button
                      className="btn btn-sm"
                      onClick={() =>
                        reorderAlternates(selectedSlot.id, index, index + 1)
                      }
                    >
                      ↓
                    </button>
                  )}
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() =>
                      removeAlternate(selectedSlot.id, product!.id)
                    }
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Alternates */}
      {suggestedNotAssigned.length > 0 && (
        <div className="editor-section">
          <h3>Suggested Alternates</h3>
          <div className="alternate-list suggested">
            {suggestedNotAssigned.map((product) => (
              <div key={product.id} className="alternate-item suggested">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="alternate-image"
                />
                <span className="alternate-name">{product.name}</span>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => addAlternate(selectedSlot.id, product.id)}
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
