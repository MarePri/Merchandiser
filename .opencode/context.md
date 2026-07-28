# Project Context — VM Coordinator

## Environment
- Language: TypeScript
- Runtime: Node.js (Vite 8)
- Build: `npm run build` (tsc -b && vite build)
- Test: `npm test` (vitest)
- Package Manager: npm

## Project Type
- [x] Application (Web — React SPA)
- [ ] Library/Package
- [ ] Microservice
- [ ] Monorepo

## Structure
- Source: `src/`
  - `src/types/` — Domain model types
  - `src/data/` — Static datasets + config (products.json, rulesConfig.json, defaultStore.ts)
  - `src/engine/` — Rules engine + alternates suggestion (pure logic, no UI)
  - `src/engine/__tests__/` — Unit tests
  - `src/context/` — React state management (AppContext)
  - `src/components/` — UI components
- Tests: `src/engine/__tests__/`
- Config: `vite.config.ts`, `vitest.config.ts`

## Conventions
- Naming: camelCase for functions/variables, PascalCase for types/components
- Imports: relative paths
- Error handling: violation arrays from rules engine
- Testing: vitest with globals

## Phase 1 (Complete)
- Data model: Product, Store, Fixture, Slot, Assignment
- Rules engine: count, category mixing, color/print, size run — all data-driven
- UI: FixtureBoard, SlotEditor, RulesSettings
- 40 mock products in products.json

## Phase 2 (In Progress)
- Scraper module for Zara catalog data
- Target: Zara US site (www.zara.com/us/)
- Zara categories API: `https://www.zara.com/us/categories?ajax=true` — WORKS, returns category tree JSON
- Product listing API: Not yet discovered (site is fully SPA-rendered)
- Plan: Build scraper architecture with categories API + fallback approach

## Data Source Investigation (2026-07-28)
### Zara (inditex.com)
- `/us/categories?ajax=true` → Returns full category tree with IDs ✅
- `/us/en/man-tshirts-l659.html` → SPA, returns empty HTML ❌
- `/us/en/category/{id}/products` → 404 ❌
- `itxrest/2/catalog/...` → 404 ❌
- Search endpoint → Only returns mkSpots/layout, no products ❌
- **Conclusion**: Product listing requires browser JS execution. Need to scrape the HTML page and extract embedded data, OR use the API endpoints discovered from browser devtools.

### Pull&Bear
- All pages return empty HTML (SPA) or 404
- Same Inditex infrastructure as Zara
- **Decision**: Use Zara as primary target (more public API surface found)
