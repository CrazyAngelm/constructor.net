# LabStudio: изолированный preview-контур

Контур запускается параллельно с действующим сайтом и не заменяет его. Он использует отдельные Compose-проект, сеть, MySQL-базу, том изображений, loopback-порты и preview-домен. Переключение основного домена допускается только после отдельной приёмки.

## 1. Подготовка

Скопируйте `.env.preview.example` в неотслеживаемый файл вне репозитория и заполните все обязательные значения. В нём должны быть только preview-секреты и синтетические учётные записи. `PREVIEW_CATALOG_SNAPSHOT_DIR` указывает на подготовленный снимок публичных таблиц и каталог `uploads/task`; он монтируется в контейнер только для чтения.

```bash
export PREVIEW_ENV_FILE=/absolute/path/.env.preview
```

Защитные условия выполняются до любого изменения данных:

- имя БД содержит `preview`, а реальное подключение совпадает с этим именем;
- importer и seeder работают только через Compose-хост `db` в режиме `isolated-preview`;
- публичный preview не вызывает регистрацию, восстановление пароля, почту или оплату;
- billing-cron принудительно выключен, а платёжные реквизиты не передаются в preview-контейнер;
- в импорт входят только курсы, категории, задания, связи, руководства и публичные изображения заданий — без пользователей, сессий, подписок, платежей и токенов.

## 2. Сборка и запуск

```bash
bash scripts/preview/deploy.sh
docker compose --env-file "$PREVIEW_ENV_FILE" -f docker-compose.preview.yml ps
curl --fail http://127.0.0.1:18080/api/health
```

`deploy.sh` последовательно запускает отдельную БД, создаёт защищённую резервную копию текущего preview, собирает Node 22-образ, выполняет только зафиксированные Prisma-миграции, идемпотентно переносит публичный каталог и изображения, создаёт синтетические demo/admin-аккаунты и ждёт успешный healthcheck приложения и БД.

## 3. Резервная копия и откат preview

Резервные копии создаются только из preview-БД и получают внутренний маркер её имени:

```bash
bash scripts/preview/backup.sh /absolute/path/backups/labstudio-preview.sql.gz
```

Восстановление принимает только `.sql.gz` с маркером, созданным этим скриптом. Оно останавливает только preview-приложение, пересоздаёт только подтверждённую preview-БД, восстанавливает её и снова запускает preview:

```bash
PREVIEW_IMPORT_CONFIRM="$PREVIEW_DB_NAME" \
  bash scripts/preview/import.sh /absolute/path/backups/labstudio-preview.sql.gz
```

Производственный SQL-дамп этим путём не импортируется. Для обновления публичного каталога используется только allowlist-importer `frontend/scripts/import-catalog.ts`.

## 4. Домен

`ops/nginx/preview.labstudio-inc.ru.conf.example` — отдельный виртуальный хост для `preview.labstudio-inc.ru`, проксирующий на `127.0.0.1:18080`. Его можно включать лишь после создания DNS-записи и TLS-сертификата. Конфигурация действующего `labstudio-inc.ru`, его контейнеры, база и порты не изменяются.

## 5. Проверка перед показом

```bash
curl --fail https://preview.labstudio-inc.ru/api/health
docker compose --env-file "$PREVIEW_ENV_FILE" -f docker-compose.preview.yml exec -T db \
  mysql -u"$PREVIEW_DB_USER" -p"$PREVIEW_DB_PASSWORD" "$PREVIEW_DB_NAME" \
  -e "SELECT COUNT(*) AS courses FROM Course; SELECT COUNT(*) AS tasks FROM Task;"
```

Затем войдите синтетической demo-учётной записью и вручную проверьте: поиск в каталоге, два независимых листа, добавление/редактирование/перестановку/удаление заданий, сохранение и повторное открытие конспекта, печать/PDF и скрытие/возврат материалов администратором.
