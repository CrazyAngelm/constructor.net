#!/usr/bin/env bash
set -euo pipefail

preview_repo_root() {
  cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd
}

preview_require_environment() {
  : "${PREVIEW_ENV_FILE:?Set PREVIEW_ENV_FILE to an absolute path for the preview environment file.}"
  [[ "${PREVIEW_ENV_FILE}" = /* ]] || { echo "PREVIEW_ENV_FILE must be an absolute path." >&2; exit 1; }
  [[ -f "${PREVIEW_ENV_FILE}" ]] || { echo "PREVIEW_ENV_FILE does not exist: ${PREVIEW_ENV_FILE}" >&2; exit 1; }

  set -a
  # shellcheck disable=SC1090
  source "${PREVIEW_ENV_FILE}"
  set +a

  local required
  for required in PREVIEW_APP_PORT PREVIEW_DB_PORT PREVIEW_DB_NAME PREVIEW_DB_USER PREVIEW_DB_HOST PREVIEW_DB_PASSWORD PREVIEW_DB_ROOT_PASSWORD PREVIEW_NEXTAUTH_URL PREVIEW_NEXTAUTH_SECRET PREVIEW_DEPLOYMENT_MODE PREVIEW_RESTRICT_EXTERNAL_FLOWS PREVIEW_CATALOG_SNAPSHOT_DIR PREVIEW_BACKUP_DIR; do
    [[ -n "${!required:-}" && "${!required}" != CHANGE_ME* ]] || { echo "${required} must be set to a non-placeholder value in PREVIEW_ENV_FILE." >&2; exit 1; }
  done
  [[ "${PREVIEW_DB_NAME}" == *preview* ]] || { echo "PREVIEW_DB_NAME must include 'preview' to prevent a production database target." >&2; exit 1; }
  [[ "${PREVIEW_DB_NAME}" =~ ^[A-Za-z0-9_]+$ ]] || { echo "PREVIEW_DB_NAME may contain only letters, numbers, and underscores." >&2; exit 1; }
  [[ "${PREVIEW_DB_USER}" =~ ^[A-Za-z0-9_]+$ ]] || { echo "PREVIEW_DB_USER may contain only letters, numbers, and underscores." >&2; exit 1; }
  [[ "${PREVIEW_DB_HOST}" == db ]] || { echo "PREVIEW_DB_HOST must be the isolated Compose service 'db'." >&2; exit 1; }
  [[ "${PREVIEW_DEPLOYMENT_MODE}" == isolated-preview ]] || { echo "PREVIEW_DEPLOYMENT_MODE must be isolated-preview." >&2; exit 1; }
  [[ "${PREVIEW_RESTRICT_EXTERNAL_FLOWS}" == true ]] || { echo "External signup, mail, and payment flows must remain disabled in the public preview." >&2; exit 1; }
  [[ "${BILLING_CRON_ENABLED:-false}" == false ]] || { echo "BILLING_CRON_ENABLED must be false in preview." >&2; exit 1; }
  [[ "${PREVIEW_APP_PORT}" != 80 && "${PREVIEW_APP_PORT}" != 443 ]] || { echo "PREVIEW_APP_PORT must not use 80 or 443." >&2; exit 1; }
  [[ "${PREVIEW_DB_PORT}" != 3306 ]] || { echo "PREVIEW_DB_PORT must not use 3306." >&2; exit 1; }
  [[ "${PREVIEW_APP_PORT}" != "${PREVIEW_DB_PORT}" ]] || { echo "Preview app and database ports must differ." >&2; exit 1; }
  [[ "${PREVIEW_CATALOG_SNAPSHOT_DIR}" = /* && -d "${PREVIEW_CATALOG_SNAPSHOT_DIR}" ]] || { echo "PREVIEW_CATALOG_SNAPSHOT_DIR must be an existing absolute directory." >&2; exit 1; }
  [[ "${PREVIEW_BACKUP_DIR}" = /* ]] || { echo "PREVIEW_BACKUP_DIR must be an absolute path." >&2; exit 1; }
  mkdir -p -- "${PREVIEW_BACKUP_DIR}"
}

preview_compose() {
  docker compose --env-file "${PREVIEW_ENV_FILE}" -f "$(preview_repo_root)/docker-compose.preview.yml" "$@"
}
