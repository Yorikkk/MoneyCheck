# MoneyCheck — Семейный учёт расходов

## Стек
- **React 19** + **TypeScript** (strict mode)
- **Vite 6** сборщик
- **Dexie.js 4** — IndexedDB обёртка (все данные в браузере)
- **Zustand 5** — UI-состояние (оверлей поверх Dexie)
- **TanStack React Query 5** — будущая синхронизация с бэкендом
- **React Router 7** — HashRouter (5 страниц)
- **Tailwind CSS 4** — CSS-first конфигурация (без tailwind.config.js)
- **Recharts** — графики
- **Dayjs** — даты
- **vite-plugin-pwa** — PWA (service worker, manifest)

## Архитектура

### База данных (Dexie) — `src/db/db.ts`
4 таблицы: `transactions`, `categories`, `budgets`, `familyMembers`
Версионирование схемы — `db.version(N).stores({...})`

### Data Access — `src/db/*.ts`
Раздельные файлы для каждой таблицы с CRUD-функциями
Все экспорты через `src/db/index.ts`

### Хуки — `src/hooks/useDb.ts`
`useLiveQuery` для реактивности — компоненты перерендериваются при изменении данных в IndexedDB

### Страницы (5 штук) — `src/pages/`
Закрывают основной функционал:
- **Dashboard** — сводка за месяц
- **AddExpense** — форма добавления расхода
- **Transactions** — история транзакций
- **Reports** — графики и аналитика
- **Settings** — категории, члены семьи, бюджеты

### Навигация — `src/components/layout/AppShell.tsx`
Bottom Navigation (mobile-first), max-w-lg контейнер по центру

## Конвенции кода
- Путь `@/` → `src/` (Vite alias)
- Компоненты — `export default function PageName()`
- Layout-компоненты — именованный экспорт
- Типы данных — общие интерфейсы в `db.ts`
- Форматтеры — `src/lib/utils.ts`
- Минимум комментариев в коде
- Новые зависимости добавлять через `npm install <pkg>`

## Команды
```bash
npm run dev      # Dev-сервер
npm run build    # TypeCheck + Vite build
npm run preview  # Превью продакшн-сборки
```

## План на будущее
- Бэкенд-синхронизация (Dexie Observable + React Query)
- Возможна замена IndexedDB на SQLite через Opal если потребуется