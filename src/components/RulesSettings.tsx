import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { RulesConfig, FixtureType } from '../types';

const fixtureLabels: Record<FixtureType, string> = {
  wall: 'Wall',
  table: 'Table',
  buro: 'Buro',
};

export default function RulesSettings() {
  const { rulesConfig, updateRulesConfig } = useApp();
  const [config, setConfig] = useState<RulesConfig>({ ...rulesConfig });
  const [isDirty, setIsDirty] = useState(false);

  const updateCountRule = (
    fixtureType: FixtureType,
    field: 'enabled' | 'min' | 'max',
    value: boolean | number
  ) => {
    setConfig((prev) => ({
      ...prev,
      countRules: {
        ...prev.countRules,
        [fixtureType]: {
          ...prev.countRules[fixtureType],
          [field]: value,
        },
      },
    }));
    setIsDirty(true);
  };

  const updateCategoryMixing = (
    field: 'enabled',
    value: boolean
  ) => {
    setConfig((prev) => ({
      ...prev,
      categoryMixing: { ...prev.categoryMixing, [field]: value },
    }));
    setIsDirty(true);
  };

  const addBlockedPair = () => {
    setConfig((prev) => ({
      ...prev,
      categoryMixing: {
        ...prev.categoryMixing,
        blockedPairs: [...prev.categoryMixing.blockedPairs, ['', '']],
      },
    }));
    setIsDirty(true);
  };

  const updateBlockedPair = (
    index: number,
    pos: 0 | 1,
    value: string
  ) => {
    setConfig((prev) => {
      const newPairs = [...prev.categoryMixing.blockedPairs];
      newPairs[index] = [...newPairs[index]];
      newPairs[index][pos] = value;
      return {
        ...prev,
        categoryMixing: {
          ...prev.categoryMixing,
          blockedPairs: newPairs,
        },
      };
    });
    setIsDirty(true);
  };

  const removeBlockedPair = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      categoryMixing: {
        ...prev.categoryMixing,
        blockedPairs: prev.categoryMixing.blockedPairs.filter(
          (_, i) => i !== index
        ),
      },
    }));
    setIsDirty(true);
  };

  const updateColorPrint = (
    field: 'enabled' | 'maxClashing',
    value: boolean | number
  ) => {
    setConfig((prev) => ({
      ...prev,
      colorPrint: { ...prev.colorPrint, [field]: value },
    }));
    setIsDirty(true);
  };

  const updateSizeRun = (
    field: 'enabled' | 'requiredSizes',
    value: boolean | string[]
  ) => {
    setConfig((prev) => ({
      ...prev,
      sizeRun: { ...prev.sizeRun, [field]: value },
    }));
    setIsDirty(true);
  };

  const updateRequiredSizes = (value: string) => {
    const sizes = value.split(',').map((s) => s.trim()).filter(Boolean);
    updateSizeRun('requiredSizes', sizes);
  };

  const handleSave = () => {
    updateRulesConfig(config);
    setIsDirty(false);
  };

  const handleReset = () => {
    setConfig({ ...rulesConfig });
    setIsDirty(false);
  };

  return (
    <div className="rules-settings">
      <h2>Rules Settings</h2>
      <p className="settings-description">
        Configure compliance rules for fixtures. Changes apply live to all fixtures.
      </p>

      {/* Count Rules */}
      <div className="rules-section">
        <h3>Count Rules (Items per Fixture)</h3>
        <table className="rules-table">
          <thead>
            <tr>
              <th>Fixture Type</th>
              <th>Enabled</th>
              <th>Min</th>
              <th>Max</th>
            </tr>
          </thead>
          <tbody>
            {(['wall', 'table', 'buro'] as FixtureType[]).map((ft) => (
              <tr key={ft}>
                <td>{fixtureLabels[ft]}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={config.countRules[ft].enabled}
                    onChange={(e) =>
                      updateCountRule(ft, 'enabled', e.target.checked)
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    value={config.countRules[ft].min}
                    onChange={(e) =>
                      updateCountRule(ft, 'min', parseInt(e.target.value) || 0)
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={1}
                    value={config.countRules[ft].max}
                    onChange={(e) =>
                      updateCountRule(ft, 'max', parseInt(e.target.value) || 1)
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Category Mixing */}
      <div className="rules-section">
        <h3>Category Mixing</h3>
        <label className="rules-toggle">
          <input
            type="checkbox"
            checked={config.categoryMixing.enabled}
            onChange={(e) =>
              updateCategoryMixing('enabled', e.target.checked)
            }
          />
          <span>Enable category mixing rules</span>
        </label>

        {config.categoryMixing.enabled && (
          <div className="blocked-pairs">
            <p className="helper-text">
              Category pairs that cannot share a fixture:
            </p>
            {config.categoryMixing.blockedPairs.map((pair, index) => (
              <div key={index} className="blocked-pair-row">
                <select
                  value={pair[0]}
                  onChange={(e) =>
                    updateBlockedPair(index, 0, e.target.value)
                  }
                >
                  <option value="">Select category...</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <span className="pair-separator">+</span>
                <select
                  value={pair[1]}
                  onChange={(e) =>
                    updateBlockedPair(index, 1, e.target.value)
                  }
                >
                  <option value="">Select category...</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => removeBlockedPair(index)}
                >
                  ✕
                </button>
              </div>
            ))}
            <button className="btn btn-sm" onClick={addBlockedPair}>
              + Add Blocked Pair
            </button>
          </div>
        )}
      </div>

      {/* Color/Print */}
      <div className="rules-section">
        <h3>Color/Print Coordination</h3>
        <label className="rules-toggle">
          <input
            type="checkbox"
            checked={config.colorPrint.enabled}
            onChange={(e) =>
              updateColorPrint('enabled', e.target.checked)
            }
          />
          <span>Enable color/print rules</span>
        </label>
        {config.colorPrint.enabled && (
          <div className="rules-inline">
            <label>
              Max clashing prints per fixture:
              <input
                type="number"
                min={0}
                value={config.colorPrint.maxClashing}
                onChange={(e) =>
                  updateColorPrint(
                    'maxClashing',
                    parseInt(e.target.value) || 0
                  )
                }
              />
            </label>
          </div>
        )}
      </div>

      {/* Size Run */}
      <div className="rules-section">
        <h3>Size Run Completeness (Table Fixtures)</h3>
        <label className="rules-toggle">
          <input
            type="checkbox"
            checked={config.sizeRun.enabled}
            onChange={(e) =>
              updateSizeRun('enabled', e.target.checked)
            }
          />
          <span>Enable size run rules</span>
        </label>
        {config.sizeRun.enabled && (
          <div className="rules-inline">
            <label>
              Required sizes (comma-separated):
              <input
                type="text"
                value={config.sizeRun.requiredSizes.join(', ')}
                onChange={(e) => updateRequiredSizes(e.target.value)}
                placeholder="S, M, L, XL"
              />
            </label>
          </div>
        )}
      </div>

      {/* Save / Reset */}
      <div className="rules-actions">
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!isDirty}
        >
          Save Changes
        </button>
        <button
          className="btn"
          onClick={handleReset}
          disabled={!isDirty}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

const categoryOptions = [
  'tops',
  'bottoms',
  'outerwear',
  'basics',
  'dresses',
  'accessories',
];
