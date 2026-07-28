import { useApp } from '../context/AppContext';

export default function CatalogPanel() {
  const {
    products,
    dataSource,
    isRefreshing,
    lastRefreshError,
    lastRefreshTimestamp,
    triggerRefresh,
    setDataSource,
  } = useApp();

  return (
    <div className="catalog-panel">
      <h2>Catalog Settings</h2>
      <p className="settings-description">
        Manage your product data source. Switch between the built-in static dataset and live-scraped data from Zara.
      </p>

      {/* Data Source Toggle */}
      <div className="catalog-section">
        <h3>Data Source</h3>
        <div className="source-toggle">
          <button
            className={`source-btn ${dataSource === 'static' ? 'active' : ''}`}
            onClick={() => setDataSource('static')}
            disabled={isRefreshing}
          >
            <span className="source-icon">📦</span>
            <div className="source-info">
              <span className="source-name">Static</span>
              <span className="source-desc">Built-in mock dataset ({products.length} products)</span>
            </div>
          </button>
          <button
            className={`source-btn ${dataSource === 'scraped' ? 'active' : ''}`}
            onClick={() => setDataSource('scraped')}
            disabled={isRefreshing}
          >
            <span className="source-icon">🌐</span>
            <div className="source-info">
              <span className="source-name">Scraped</span>
              <span className="source-desc">Live data from Zara</span>
            </div>
          </button>
        </div>
      </div>

      {/* Refresh Controls */}
      <div className="catalog-section">
        <h3>Refresh Catalog</h3>
        <p className="helper-text">
          Fetch the latest product data from Zara's website. This will overwrite the local cache.
          Rate-limited to {10} pages per run with {1.5}s delays between requests.
        </p>
        <div className="refresh-controls">
          <button
            className="btn btn-primary"
            onClick={triggerRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Scraping...' : 'Refresh Catalog'}
          </button>
          {lastRefreshTimestamp && (
            <span className="last-refresh">
              Last refresh: {new Date(lastRefreshTimestamp).toLocaleString()}
            </span>
          )}
        </div>
        {lastRefreshError && (
          <div className="refresh-error">
            <span className="error-icon">⚠️</span>
            <span>{lastRefreshError}</span>
          </div>
        )}
      </div>

      {/* Current Products Preview */}
      <div className="catalog-section">
        <h3>Current Products ({products.length})</h3>
        <div className="products-table-wrapper">
          <table className="products-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Subcategory</th>
                <th>Color</th>
                <th>Print</th>
                <th>Price</th>
                <th>Sizes</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, 50).map((product) => (
                <tr key={product.id}>
                  <td className="product-id">{product.id}</td>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>{product.subcategory}</td>
                  <td>{product.color}</td>
                  <td>{product.print}</td>
                  <td>${product.price.toFixed(2)}</td>
                  <td>{product.sizes.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {products.length > 50 && (
          <p className="table-footer">Showing 50 of {products.length} products</p>
        )}
      </div>

      {/* Category Distribution */}
      <div className="catalog-section">
        <h3>Category Distribution</h3>
        <div className="category-stats">
          {Object.entries(
            products.reduce(
              (acc, p) => {
                acc[p.category] = (acc[p.category] || 0) + 1;
                return acc;
              },
              {} as Record<string, number>
            )
          )
            .sort((a, b) => b[1] - a[1])
            .map(([category, count]) => (
              <div key={category} className="stat-row">
                <span className="stat-label">{category}</span>
                <div className="stat-bar-wrapper">
                  <div
                    className="stat-bar"
                    style={{
                      width: `${(count / products.length) * 100}%`,
                    }}
                  />
                </div>
                <span className="stat-count">{count}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Scraper Architecture Info */}
      <div className="catalog-section info-section">
        <h3>How It Works</h3>
        <div className="info-content">
          <div className="info-step">
            <span className="step-num">1</span>
            <div>
              <strong>Fetch categories</strong>
              <p>Hit Zara's public categories API to discover the product taxonomy</p>
            </div>
          </div>
          <div className="info-step">
            <span className="step-num">2</span>
            <div>
              <strong>Fetch products</strong>
              <p>Iterate category pages with rate limiting (1.5s delay, max 10 pages)</p>
            </div>
          </div>
          <div className="info-step">
            <span className="step-num">3</span>
            <div>
              <strong>Normalize</strong>
              <p>Map Zara's taxonomy to our internal categories via editable mapping tables</p>
            </div>
          </div>
          <div className="info-step">
            <span className="step-num">4</span>
            <div>
              <strong>Cache</strong>
              <p>Save to localStorage. On failure, previous cache is preserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
