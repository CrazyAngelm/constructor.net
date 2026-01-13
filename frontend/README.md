# Frontend (Next.js + API routes)

Минимальная справка по фронтенду и API, которые живут в `frontend/`.

## Запуск локально (без Docker)
```bash
npm install
npm run dev
```

## Запуск локально (Docker)
Из корня репозитория:
```bash
make build
make up
```

## Основные каталоги
- `pages/` — страницы и API routes (`pages/api/*`).
- `components/` — UI-компоненты.
- `lib/` — утилиты API, DTO, mailer, платежи.
- `prisma/` — схема БД.
- `styles/` — стили.

## Переменные окружения
См. `../env.org` и `.env.frontend.dev` (создается `make dev-envs`).

Минимальный набор:
- `DATABASE_URL`
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- `MAILER_USER`, `MAILER_PASS`
- `YOOCHECKOUT_SHOP_ID`, `YOOCHECKOUT_KEY`
- `UPLOAD_IMAGE_TASK`, `DOWNLOAD_IMAGE_TASK`

## Примечания
- API реализовано как Next.js API routes в `pages/api`.
- В проде фронт сейчас запускается через `pm2`, а не Docker.
