#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
preview_require_environment

preview_compose up -d --wait db
backup_path="${PREVIEW_BACKUP_DIR}/labstudio-preview-before-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
"$(dirname "${BASH_SOURCE[0]}")/backup.sh" "${backup_path}"
preview_compose build app
"$(dirname "${BASH_SOURCE[0]}")/migrate.sh"
preview_compose run --rm --no-deps -e PREVIEW_CATALOG_IMPORT_CONFIRMED=YES app npm run db:seed:catalog
preview_compose run --rm --no-deps -e PREVIEW_USER_SEED_CONFIRMED=YES app npm run db:seed:preview-users
preview_compose up -d --wait app
preview_compose ps
echo "Pre-deploy preview backup: ${backup_path}"
