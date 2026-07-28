import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import FixtureBoard from './components/FixtureBoard';
import SlotEditor from './components/SlotEditor';
import RulesSettings from './components/RulesSettings';
import './App.css';

type View = 'board' | 'rules';

function App() {
  const [view, setView] = useState<View>('board');

  return (
    <AppProvider>
      <div className="app">
        <header className="app-header">
          <h1>VM Coordinator</h1>
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
        </main>
      </div>
    </AppProvider>
  );
}

export default App;
