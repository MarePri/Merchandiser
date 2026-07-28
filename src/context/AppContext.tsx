import React, { createContext, useContext, useState, useCallback } from 'react';
import type {
  Product,
  Fixture,
  Slot,
  Assignment,
  RulesConfig,
  FixtureWithSlots,
  Store,
} from '../types';
import type { Violation } from '../types';
import { evaluateRules } from '../engine';
import {
  defaultStore,
  defaultFixtures,
  defaultSlots,
  defaultAssignments,
} from '../data/defaultStore';
import defaultRulesConfig from '../data/rulesConfig.json';
import productsData from '../data/products.json';
import { refreshCatalog, getCacheJson, readCache } from '../scraper';

interface AppState {
  products: Product[];
  store: Store;
  fixtures: Fixture[];
  slots: Slot[];
  assignments: Assignment[];
  rulesConfig: RulesConfig;
  selectedFixtureId: string | null;
  selectedSlotId: string | null;
  dataSource: 'static' | 'scraped';
  isRefreshing: boolean;
  lastRefreshError: string | null;
  lastRefreshTimestamp: string | null;
}

interface AppContextValue extends AppState {
  fixturesWithSlots: FixtureWithSlots[];
  getViolationsForFixture: (fixtureId: string) => Violation[];
  setMainProduct: (slotId: string, productId: string | null) => void;
  addAlternate: (slotId: string, productId: string) => void;
  removeAlternate: (slotId: string, productId: string) => void;
  reorderAlternates: (slotId: string, fromIndex: number, toIndex: number) => void;
  updateRulesConfig: (config: RulesConfig) => void;
  selectFixture: (fixtureId: string | null) => void;
  selectSlot: (slotId: string | null) => void;
  setDataSource: (source: 'static' | 'scraped') => void;
  triggerRefresh: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

/** Try to load cached products from localStorage on init */
function loadInitialProducts(): { products: Product[]; source: 'static' | 'scraped'; cacheJson: string | null } {
  try {
    const cacheJson = localStorage.getItem('products-cache');
    if (cacheJson) {
      const cached = readCache(cacheJson);
      if (cached && cached.length > 0) {
        return { products: cached, source: 'scraped', cacheJson };
      }
    }
  } catch {
    // localStorage unavailable or corrupt — fall through to static
  }
  return { products: productsData as Product[], source: 'static', cacheJson: null };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const initial = loadInitialProducts();
  const [products, setProducts] = useState<Product[]>(initial.products);
  const [dataSource, setDataSource] = useState<'static' | 'scraped'>(initial.source);
  const [cacheJson, setCacheJson] = useState<string | null>(initial.cacheJson);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshError, setLastRefreshError] = useState<string | null>(null);
  const [lastRefreshTimestamp, setLastRefreshTimestamp] = useState<string | null>(null);

  const [store] = useState<Store>(defaultStore);
  const [fixtures] = useState<Fixture[]>(defaultFixtures);
  const [slots] = useState<Slot[]>(defaultSlots);
  const [assignments, setAssignments] =
    useState<Assignment[]>(defaultAssignments);
  const [rulesConfig, setRulesConfig] =
    useState<RulesConfig>(defaultRulesConfig);
  const [selectedFixtureId, setSelectedFixtureId] = useState<string | null>(
    null
  );
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  // ── Derived state: fixtures with their slots and assignments ──
  const fixturesWithSlots: FixtureWithSlots[] = fixtures.map((fixture) => ({
    fixture,
    slots: slots
      .filter((s) => s.fixture_id === fixture.id)
      .sort((a, b) => a.position - b.position)
      .map((slot) => ({
        ...slot,
        assignment:
          assignments.find((a) => a.slot_id === slot.id) ?? null,
      })),
  }));

  // ── Violations per fixture ──
  const getViolationsForFixture = useCallback(
    (fixtureId: string): Violation[] => {
      const fixture = fixtures.find((f) => f.id === fixtureId);
      if (!fixture) return [];

      const fixtureAssignments = assignments.filter((a) =>
        slots
          .filter((s) => s.fixture_id === fixtureId)
          .some((s) => s.id === a.slot_id)
      );

      return evaluateRules(fixture, fixtureAssignments, products, rulesConfig);
    },
    [assignments, fixtures, slots, products, rulesConfig]
  );

  // ── Trigger catalog refresh ──
  const triggerRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setLastRefreshError(null);

    try {
      const result = await refreshCatalog(cacheJson);

      if (result.success) {
        setProducts(result.products);
        setDataSource('scraped');
        const newCache = getCacheJson(result.products);
        setCacheJson(newCache);
        // Persist to localStorage
        try {
          localStorage.setItem('products-cache', newCache);
        } catch { /* ignore */ }
        setLastRefreshTimestamp(result.timestamp);
        setLastRefreshError(null);
      } else if (result.source === 'fallback-static') {
        // Scrape failed and no valid cache — use static
        setProducts(productsData as Product[]);
        setDataSource('static');
        setLastRefreshError(result.error || 'Scrape failed, using static data');
      } else {
        // Scrape failed but kept previous cache
        setLastRefreshError(result.error || 'Scrape failed, kept previous cache');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setLastRefreshError(`Unexpected error: ${msg}`);
    } finally {
      setIsRefreshing(false);
    }
  }, [cacheJson]);

  // ── Mutations ──
  const setMainProduct = useCallback(
    (slotId: string, productId: string | null) => {
      setAssignments((prev) =>
        prev.map((a) =>
          a.slot_id === slotId
            ? { ...a, main_product_id: productId, alternates: [] }
            : a
        )
      );
    },
    []
  );

  const addAlternate = useCallback(
    (slotId: string, productId: string) => {
      setAssignments((prev) =>
        prev.map((a) =>
          a.slot_id === slotId && !a.alternates.includes(productId)
            ? { ...a, alternates: [...a.alternates, productId] }
            : a
        )
      );
    },
    []
  );

  const removeAlternate = useCallback(
    (slotId: string, productId: string) => {
      setAssignments((prev) =>
        prev.map((a) =>
          a.slot_id === slotId
            ? {
                ...a,
                alternates: a.alternates.filter((id) => id !== productId),
              }
            : a
        )
      );
    },
    []
  );

  const reorderAlternates = useCallback(
    (slotId: string, fromIndex: number, toIndex: number) => {
      setAssignments((prev) =>
        prev.map((a) => {
          if (a.slot_id !== slotId) return a;
          const newAlts = [...a.alternates];
          const [moved] = newAlts.splice(fromIndex, 1);
          newAlts.splice(toIndex, 0, moved);
          return { ...a, alternates: newAlts };
        })
      );
    },
    []
  );

  const selectFixture = useCallback((fixtureId: string | null) => {
    setSelectedFixtureId(fixtureId);
    setSelectedSlotId(null);
  }, []);

  const selectSlot = useCallback((slotId: string | null) => {
    setSelectedSlotId(slotId);
  }, []);

  const handleSetDataSource = useCallback((source: 'static' | 'scraped') => {
    if (source === 'static') {
      setProducts(productsData as Product[]);
      setDataSource('static');
    } else {
      // Try to load from cache
      if (cacheJson) {
        const cached = readCache(cacheJson);
        if (cached && cached.length > 0) {
          setProducts(cached);
          setDataSource('scraped');
          return;
        }
      }
      // No cache available — can't switch to scraped
      setLastRefreshError('No scraped data available. Run Refresh Catalog first.');
    }
  }, [cacheJson]);

  return (
    <AppContext.Provider
      value={{
        products,
        store,
        fixtures,
        slots,
        assignments,
        rulesConfig,
        selectedFixtureId,
        selectedSlotId,
        dataSource,
        isRefreshing,
        lastRefreshError,
        lastRefreshTimestamp,
        fixturesWithSlots,
        getViolationsForFixture,
        setMainProduct,
        addAlternate,
        removeAlternate,
        reorderAlternates,
        updateRulesConfig: setRulesConfig,
        selectFixture,
        selectSlot,
        setDataSource: handleSetDataSource,
        triggerRefresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
