#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
preview_require_environment

input_file="${1:?Usage: PREVIEW_ENV_FILE=/absolute/path/.env.preview PREVIEW_IMPORT_CONFIRM=<preview DB name> bash scripts/preview/import.sh /absolute/path/preview-backup.sql.gz}"
[[ -f "${input_file}" ]] || { echo "Import file does not exist: ${input_file}" >&2; exit 1; }
[[ "${input_file}" == *.sql.gz ]] || { echo "Only .sql.gz backups created by preview/backup.sh are accepted." >&2; exit 1; }
[[ "${PREVIEW_IMPORT_CONFIRM:-}" == "${PREVIEW_DB_NAME}" ]] || { echo "Set PREVIEW_IMPORT_CONFIRM exactly to PREVIEW_DB_NAME to confirm importing into this isolated preview database." >&2; exit 1; }

first_line="$(gzip -cd -- "${input_file}" | sed -n '1p')"
[[ "${first_line}" == "-- LABSTUDIO_PREVIEW_BACKUP:${PREVIEW_DB_NAME}" ]] || { echo "Backup marker does not match this isolated preview database." >&2; exit 1; }

preview_compose stop app >/dev/null 2>&1 || true
preview_compose exec -T -e MYSQL_PWD="${PREVIEW_DB_ROOT_PASSWORD}" db mysql -uroot -e \
  "DROP DATABASE IF EXISTS \`${PREVIEW_DB_NAME}\`; CREATE DATABASE \`${PREVIEW_DB_NAME}\`; GRANT ALL PRIVILEGES ON \`${PREVIEW_DB_NAME}\`.* TO '${PREVIEW_DB_USER}'@'%';"
gzip -cd -- "${input_file}" | preview_compose exec -T -e MYSQL_PWD="${PREVIEW_DB_PASSWORD}" db \
  mysql --one-database -u "${PREVIEW_DB_USER}" "${PREVIEW_DB_NAME}"
preview_compose up -d --wait app

echo "Preview-only restore completed for database: ${PREVIEW_DB_NAME}"
