#!/bin/sh
set -eu
npm run check
export SASA_LOCAL_INTEGRATION=1
if [ -z "${PLAYWRIGHT_MODULE:-}" ] && ! node -e "require.resolve('playwright')" 2>/dev/null; then
 PLAYWRIGHT_MODULE="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs"
 export PLAYWRIGHT_MODULE
fi
node --input-type=module -e "await import(process.env.PLAYWRIGHT_MODULE || 'playwright')"
if curl -s --max-time 1 http://127.0.0.1:4341/ >/dev/null; then
 echo "로컬 검수 포트 4341이 사용 중입니다." >&2
 exit 1
fi
sh scripts/m3-local.sh --integration &
server=$!
trap 'kill "$server" 2>/dev/null || true; wait "$server" 2>/dev/null || true' EXIT
trap 'exit 1' INT TERM
attempt=0
until curl -fsS --max-time 1 http://127.0.0.1:4341/health/ready >/dev/null 2>&1; do
 kill -0 "$server" && [ "$attempt" -lt 120 ] || exit 1
 attempt=$((attempt+1))
 sleep 1
done
npm run check:journeys
node server/service/check-trade.mjs
node server/service/check-lifecycle.mjs
node server/service/check-staff.mjs
node server/service/check-operations.mjs
