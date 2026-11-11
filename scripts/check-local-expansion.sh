#!/bin/sh
# Run against the Mac's standalone candidate, after npm run candidate:local.
set -eu
export SASA_URL="${SASA_URL:-http://127.0.0.1:4342}"
export SASA_STATE_DIR="${SASA_STATE_DIR:-$PWD/.m3-local/standalone}"
export SASA_DB_HOST="${SASA_DB_HOST:-$SASA_STATE_DIR/socket}" SASA_DB_PORT="${SASA_DB_PORT:-54840}" SASA_DB_NAME="${SASA_DB_NAME:-temple_candidate}"
export SASA_TEST_MAIL="$SASA_STATE_DIR/mail"
if [ -z "${PLAYWRIGHT_MODULE:-}" ]; then
 PLAYWRIGHT_MODULE="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs"
 export PLAYWRIGHT_MODULE
fi
mkdir -p evidence/local-expansion
npm run check
node server/service/check-private-access.mjs
node server/service/check-operations.mjs
node scripts/check-access-return.mjs
node scripts/check-private-room.mjs
node scripts/check-private-display.mjs
node scripts/check-private-practice.mjs
node server/service/check-private-recovery.mjs
node scripts/check-expansion.mjs
node scripts/check-private-performance.mjs
SASA_BUILD="$SASA_STATE_DIR/web" SASA_EVIDENCE=evidence/local-expansion/performance node scripts/m4-web-performance.mjs
node scripts/report-local-expansion.mjs
