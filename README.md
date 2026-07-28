# VM Coordinator — Merchandiser

A visual merchandising coordination app that manages which products go on which store fixtures, with hero products per spot plus swap-in alternatives, validated against store compliance rules.

## Stack

- **React 19** + **TypeScript** + **Vite 8**
- **Vitest** for unit testing
- No backend — local state + local JSON
- Structured for future DB replacement without rewrite

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |

## Architecture

```
src/
├── types/          # Domain model types (Store, Fixture, Slot, Assignment, Rules)
├── data/           # Static datasets (products.json, rulesConfig.json, defaultStore)
├── engine/         # Rules engine + alternates suggestion (pure logic, no UI)
│   └── __tests__/  # Unit tests for rules engine
├── context/        # React state management (AppContext)
├── components/     # UI components (FixtureBoard, SlotEditor, RulesSettings)
└── App.tsx         # Root component with navigation
```

## Phase 1 Features

1. **Static product dataset** — 40 mock entries shaped like real catalog data
2. **Domain model** — Store → Fixture → Slot → Assignment hierarchy
3. **Rules engine** — Data-driven, configurable compliance rules:
   - Count rules (min/max per fixture type)
   - Category mixing (blocked category pairs)
   - Color/print coordination (max clashing prints)
   - Size-run completeness (required sizes for pile slots)
4. **Fixture board** — Grid view of fixtures with inline violation display
5. **Slot editor** — Pick main product, add/reorder alternates
6. **Rules settings** — Editable form for all rule values
7. **Alternates suggestion** — Auto-suggest by category + color/price proximity
