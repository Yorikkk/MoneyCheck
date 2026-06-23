# КРИТИЧЕСКИЙ ПРИКАЗ: РЕЖИМ ТРАНСПАРЕНТНОСТИ

1. **ЯЗЫК МЫШЛЕНИЯ**: Все внутренние рассуждения, Chain-of-Thought, промежуточные выводы, планирование шагов, анализ ошибок и логические цепочки ДОЛЖНЫ быть написаны ИСКЛЮЧИТЕЛЬНО на РУССКОМ языке. Это относится к тебе и ко всем твоим вложенным агентам/субмоделям.

2. **ПОЛНАЯ ВИДИМОСТЬ**: Никогда не скрывай и не сокращай свои рассуждения. Выводи каждый логический шаг, даже если он кажется очевидным. Я должен видеть ВСЮ цепочку мыслей от ввода до вывода.

3. **СТРУКТУРА ОТВЕТА**: Каждый ответ должен содержать явный раздел `[РАССУЖДЕНИЯ НА РУССКОМ]:` перед финальным ответом. В этом разделе расписывай:
   - Что ты понял из запроса.
   - Какие подзадачи выделил.
   - Какие альтернативы рассматривал и почему их отбросил.
   - Какие допущения сделал.
   - Пошаговый план действий.

4. **СУБМОДЕЛИ (агенты)**: Если ты вызываешь внутренние инструменты, под-агенты или API, ты ОБЯЗАН продублировать их "мысленный процесс" в текстовом виде на русском языке. Даже если субмодель возвращает результат на другом языке — ты переводишь её логику и рассуждения в русский текст перед тем, как дать финальный ответ.

5. **ЗАПРЕТЫ**:
   - Запрещено писать рассуждения на английском (кроме технических терминов, если нет аналога).
   - Запрещено использовать фразы "Я не могу показать свои рассуждения" или "Это внутренний процесс".
   - Запрещено давать голый ответ без пояснений.

6. **АЛЬТЕРНАТИВА**: Если прямое отображение CoT технически недоступно — ты ОБЯЗАН предоставить детализированную ретроспективную реконструкцию своих мыслей на русском языке, максимально приближенную к реальному процессу.

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
- **Dexie 4** — 9 tables (schema v9): `transactions`, `categories`, `budgets`, `familyMembers`, `accountTypes`, `banks`, `accounts`, `debts`, `debtPayments`
- **Reactivity** — `useLiveQuery` from `dexie-react-hooks` in `src/hooks/useDb.ts` (re-renders on IndexedDB change)
- **HashRouter** — not BrowserRouter
- **PWA** — `vite-plugin-pwa` with auto-update service worker
- **React Router v7** — 6 routes: Dashboard (`/`), AddExpense (`/add`), Balance (`/balance`), Transactions (`/transactions`), Reports (`/reports`), Settings (`/settings`)
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