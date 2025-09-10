# Book Rating (Node.js + PostgreSQL)

Продакшн-деплой: [book-rating.onrender.com](https://book-rating.onrender.com/)

## Возможности
- Публикация книги с названием и картинкой (хранится в PostgreSQL как BYTEA)
- Оценка книги по 5-балльной шкале (один голос на пользователя/устройство)
- Просмотр статистики: средняя оценка и количество голосов
- i18n: KK (по умолчанию) / RU / EN, переключатель языка в шапке

## Локальный запуск
1) Установите зависимости:
```bash
npm install
```
2) Создайте БД PostgreSQL и задайте переменную окружения (или отдельные PG-переменные). Пример `.env`:
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
```
3) Запустите сервер разработки:
```bash
npm run dev
```
Откройте http://localhost:3000

## Переменные окружения
- `DATABASE_URL` — полная строка подключения к PostgreSQL (на Render используйте External Database URL + `?sslmode=require`).

## Скрипты
- `npm run dev` — запуск с nodemon
- `npm start` — обычный запуск

## Лицензия
MIT
