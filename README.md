# Оценка книг (Node.js + PostgreSQL)

Одностраничный сайт, где можно публиковать книги и голосовать за них по 5‑бальной шкале. Все данные хранятся в PostgreSQL.

## Стек
- Node.js (Express)
- PostgreSQL (Docker)
- Чистый HTML/CSS/JS (SPA без фреймворков)

## Быстрый запуск
1. Скопируйте `.env.example` в `.env` и при необходимости измените параметры.
2. Запустите PostgreSQL:
   ```bash
   docker compose up -d
   ```
3. Установите зависимости и запустите сервер:
   ```bash
   npm install
   npm run dev
   ```
4. Откройте `http://localhost:3000`.

## API
- GET `/api/books` — список книг.
- POST `/api/books` — создать книгу `{ title }`.
- POST `/api/books/:id/vote` — проголосовать `{ score: 1..5 }`.

## Структура проекта
- `src/server.js` — сервер и маршруты.
- `src/db.js` — подключение к БД и миграция.
- `public/` — фронтенд (статические файлы).
- `docker-compose.yml` — PostgreSQL.

## Примечания
- При первом запуске миграции создают таблицу `books`.
- В продакшене настройте переменные окружения и бэкапы БД.

"# book-rating" 
