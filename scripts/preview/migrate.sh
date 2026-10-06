#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
preview_require_environment

preview_compose up -d db
preview_compose run --rm --no-deps app npx prisma migrate deploy --schema prisma/schema.prisma
echo "Committed preview migrations applied."
