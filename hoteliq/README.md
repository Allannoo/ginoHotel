# HotelIQ — Hotel Management Platform

Современная PMS-платформа для отелей и арендодателей. Дашборд, шахматка, каналы, гости, финансы, задачи и настройки.

## Стек
- React 18 + TypeScript + Vite 5
- TailwindCSS 3.4 (CSS-variable tokens, light/dark)
- Framer Motion 11 · Recharts 2.12 · @dnd-kit · Zustand · React Router 6

## Запуск
```bash
npm install
npm run dev
```

Откройте http://localhost:5173.

## Скрипты
- `npm run dev` — разработка
- `npm run build` — production-сборка
- `npm run preview` — превью сборки
- `npm run lint` — type-check (tsc --noEmit)

## Структура
```
src/
  components/    # UI + Layout
  pages/         # Дашборд, Шахматка, Объекты, Каналы, Гости, Финансы, Задачи, Настройки
  store/         # Zustand (theme, ui)
  mock/          # Моковые данные (детерминированно через seed)
  types/         # TS-типы
  utils/         # format helpers
```

Все данные моковые. Комментарии в коде на русском.
