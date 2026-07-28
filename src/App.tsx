import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import FixtureBoard from './components/FixtureBoard';
import SlotEditor from './components/SlotEditor';
import RulesSettings from './components/RulesSettings';
import CatalogPanel from './components/CatalogPanel';
import './App.css';

type View = 'board' | 'rules' | 'catalog';

function AppInner() {
  const [view, setView] = useState<View>('board');
  const { products, dataSource, isRefreshing, lastRefreshError } = useApp();

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>VM Coordinator</h1>
          <span className="product-count">{products.length} products</span>
          <span className={`source-badge source-${dataSource}`}>
            {dataSource === 'scraped' ? 'LIVE' : 'STATIC'}
          </span>
          {isRefreshing && <span className="refreshing-indicator">Scraping...</span>}
          {lastRefreshError && !isRefreshing && (
            <span className="error-indicator" title={lastRefreshError}>!</span>
          )}
        </div>
        <nav className="app-nav">
          <button
            className={`nav-btn ${view === 'board' ? 'active' : ''}`}
            onClick={() => setView('board')}
          >
            Fixture Board
          </button>
          <button
            className={`nav-btn ${view === 'rules' ? 'active' : ''}`}
            onClick={() => setView('rules')}
          >
            Rules Settings
          </button>
          <button
            className={`nav-btn ${view === 'catalog' ? 'active' : ''}`}
            onClick={() => setView('catalog')}
          >
            Catalog
          </button>
        </nav>
      </header>

      <main className="app-main">
        {view === 'board' && (
          <div className="board-layout">
            <div className="board-panel">
              <FixtureBoard />
            </div>
            <div className="editor-panel">
              <SlotEditor />
            </div>
          </div>
        )}
        {view === 'rules' && <RulesSettings />}
        {view === 'catalog' && <CatalogPanel />}
      </main>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}

export default App;
