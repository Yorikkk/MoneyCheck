# MoneyCheck

Full client-side PWA. All data in IndexedDB (Dexie). No backend, no API keys, no env.

## Commands

```bash
npm run dev       # Vite dev server
npm run build     # tsc -b + vite build (typecheck then bundle)
npm run preview   # preview production build
```

No test, lint, or format commands exist. No CI.

## Stack quirks

- **React 19 + TypeScript strict** — `noUnusedLocals`, `noUnusedParameters` on in `tsconfig.app.json`
- **Vite 6** — `@/` → `src/` alias
- **Tailwind CSS 4** — CSS-first: `@import "tailwindcss"` in `src/index.css`, no config file
- **Dexie 4** — 8 tables (schema v2): `transactions`, `categories`, `budgets`, `familyMembers`, `accountTypes`, `accounts`, `debts`, `debtPayments`
- **Reactivity** — `useLiveQuery` from `dexie-react-hooks` in `src/hooks/useDb.ts` (re-renders on IndexedDB change)
- **HashRouter** — not BrowserRouter
- **PWA** — `vite-plugin-pwa` with auto-update service worker
- **React Router v7** — 5 pages: Dashboard, AddExpense, Transactions, Reports, Settings
- **Zustand 5** — UI state overlay (not data)
- **TanStack Query 5** — wired in `App.tsx` but unused (planned for future sync)

## DB

Schema versioning in `src/db/db.ts`. All CRUD functions in `src/db/*.ts`, re-exported from `src/db/index.ts`. `seedDefaults()` in `src/db/seed.ts` runs idempotently on every app mount (checks count then bulk-adds if empty).

## Conventions

- Components: `export default function PageName()` (pages), named exports (layout)
- Types: shared interfaces in `src/db/db.ts`
- Formatters: `src/lib/utils.ts` — ru-RU locale, RUB currency
- `AppShell` is mobile-first (`h-dvh`, `max-w-lg`, bottom nav)
- No comments in code