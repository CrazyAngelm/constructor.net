# Передача проекта в поддержку

Минимальная документация для сопровождения и поддержки.

## Общее описание
- Монорепозиторий: `frontend/` (Next.js + API routes) и `common/` (общий TS-пакет, сейчас минимальный).
- Бэкенд реализован как API routes в `frontend/pages/api`.
- Есть публичные страницы, авторизация, админка, подписки/платежи, справочники курсов/задач/мануалов.
- Проект находится на стадии MVP.

## Технологический стек
- Next.js 12, React 18, TypeScript.
- Prisma ORM + MySQL.
- NextAuth (логин по паролю и Yandex OAuth).
- YooKassa для платежей.
- Nodemailer для email.

## Структура проекта
- `frontend/pages`: страницы и API routes.
- `frontend/components`: UI-компоненты (admin, auth, home, controls).
- `frontend/lib`: утилиты API, DTO, запросы, mailer, платежи.
- `frontend/prisma/schema.prisma`: схема БД.
- `common/`: общий пакет (по факту сейчас один `src/index.ts`).
- `docker-compose*.yml`, `Makefile`: локальная разработка через Docker.

## Локальный запуск (Docker)
Из корня репозитория:
- `make build`
- `make up`

Сервисы:
- `frontend` доступен на `127.0.0.1:80`
- `db` MySQL 8 (учетки в `docker-compose.development.yml`)
- `adminer` на `http://localhost:8080` если включить профиль `tools`

## Текущее развертывание
- На сервере проект запущен не через Docker.
- Используется `pm2`, запуск напрямую из `frontend/`.

## Переменные окружения
По `env.org` и коду:
- `DATABASE_URL` (Prisma/MySQL)
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- `MAILER_USER`, `MAILER_PASS` (SMTP, `frontend/lib/mailer/mailer.ts`)
- `YOOCHECKOUT_SHOP_ID`, `YOOCHECKOUT_KEY` (YooKassa)
- `UPLOAD_IMAGE_TASK`, `DOWNLOAD_IMAGE_TASK` (хранение картинок задач)
- `SC_SERVER_SIDE_API_URL` (опционально, для server-side запросов)

Важно: `clientId`/`clientSecret` для Yandex OAuth жестко прописаны в
`frontend/pages/api/auth/[...nextauth].ts`. Лучше вынести в env.

## База данных (Prisma)
Ключевые модели в `frontend/prisma/schema.prisma`:
- Авторизация: `User`, `Account`, `Session`, `VerificationToken`, `Scope`, `ScopeJoin`
- Курсы и задачи: `Course`, `TaskCategory`, `Task`, таблицы связей
- Мануалы: `Manual`, `ManualToManula` (самосвязь)
- Версии и лицензии: `Version`, `License`, `Subscription`, `Payment`
- Ворклисты и папки: `Worklist`, `Folder`, таблицы связей

## API (Next.js routes)
Каталог `frontend/pages/api`:
- `auth/*`: регистрация, логин, подтверждение email, восстановление пароля, NextAuth
- `users/*`: пользователи и назначение прав
- `course/*`: курсы, категории, ворклисты
- `task/*`, `task-category/*`: задачи и категории (включая загрузку изображений)
- `manuals/*`: мануалы и иерархия
- `versions/*`: версии релизов
- `subscription/*`: подписки, платежи, лицензии
- `folder/*`, `worklist/*`: дерево папок и ворклистов

## UI-страницы
Основные роуты:
- `/` главная, `/auth` авторизация, `/lk` личный кабинет
- `/adm` админ-панель (пользователи, мануалы, курсы, задачи, ворклисты)
- `/docs`, `/license`, `/confirmemail`, `/reset-password`

## Платежи и email
- YooKassa: `frontend/lib/yookassa/*` и API подписок.
- Шаблоны писем: `frontend/assets/mailer/*.html`.
- SMTP: `frontend/lib/mailer/mailer.ts`.

## Планировщик задач
- `frontend/lib/crone.ts` содержит логику продления подписок, но `CroneClass.Check()` пустой.
- Если нужен автоплатеж, подключить `CheckSubscribtion` к cron/worker.

