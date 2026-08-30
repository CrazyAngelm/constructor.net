#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
preview_require_environment

output_file="${1:?Usage: PREVIEW_ENV_FILE=/absolute/path/.env.preview bash scripts/preview/backup.sh /absolute/path/preview.sql.gz}"
[[ "${output_file}" = /* ]] || { echo "Backup output path must be absolute." >&2; exit 1; }
[[ "${output_file}" == *.sql.gz ]] || { echo "Backup output must end in .sql.gz." >&2; exit 1; }
[[ ! -e "${output_file}" ]] || { echo "Refusing to overwrite existing backup: ${output_file}" >&2; exit 1; }
[[ -d "$(dirname "${output_file}")" ]] || { echo "Backup parent directory does not exist." >&2; exit 1; }

umask 077
{
  printf -- '-- LABSTUDIO_PREVIEW_BACKUP:%s\n' "${PREVIEW_DB_NAME}"
  preview_compose exec -T -e MYSQL_PWD="${PREVIEW_DB_PASSWORD}" db \
    mysqldump --single-transaction --no-tablespaces --set-gtid-purged=OFF -u "${PREVIEW_DB_USER}" "${PREVIEW_DB_NAME}"
} | gzip -c > "${output_file}"
echo "Preview backup created: ${output_file}"
