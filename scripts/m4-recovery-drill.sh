#!/bin/sh
# Restore the daily archive into a temporary, socket-only cluster and replay test orders there.
set -eu
umask 077
repo=$(pwd)
node --experimental-strip-types server/service/backup.mjs verify
archive="$repo/.m3-local/backups/$(TZ=Asia/Seoul date +%F)/temple.dump"
work=$(mktemp -d /tmp/sasa-recovery.XXXXXX)
cluster="$work/.m3-local/db"
socket="$work/.m3-local/socket"
preview_pid=
cleanup(){
 if [ -n "$preview_pid" ]; then kill "$preview_pid" 2>/dev/null || true; wait "$preview_pid" 2>/dev/null || true; fi
 if [ -f "$cluster/postmaster.pid" ]; then pg_ctl -D "$cluster" -m fast -w stop >/dev/null || return; fi
 rm -rf "$work"
}
trap cleanup EXIT
trap 'exit 1' INT TERM
mkdir -p "$socket" "$work/.m3-local/mail"
initdb -D "$cluster" --encoding=UTF8 --locale=C --auth-local=peer --auth-host=reject >/dev/null
pg_ctl -D "$cluster" -l "$work/server.log" -o "-c listen_addresses='' -k '$socket' -p 54839" -w start >/dev/null
export PGHOST="$socket" PGPORT=54839
createdb temple_test
pg_restore --exit-on-error --single-transaction -d temple_test "$archive"
cd "$work"
# Hash only the persistent purchase rights, so the drill can run on any daily snapshot.
rights(){
 psql -d temple_test -XAt -v ON_ERROR_STOP=1 -c "SELECT count(*),md5(string_agg(md5(to_jsonb(i)::text),'' ORDER BY i.id)) FROM installations i"
}
initial=$(rights)
node --experimental-strip-types "$repo/server/service/check-lifecycle.mjs"
node --experimental-strip-types "$repo/server/service/check-trade.mjs"
node --experimental-strip-types "$repo/server/service/check-operations.mjs"
test "$(rights)" = "$initial"
echo "Recovered purchase rights match the archive after replay and operator acknowledgement."

# Serve the previous web bundle with the current API, pointed at the recovered cluster.
# The temporary port keeps the candidate at 4340 available to its visitors.
legacy=$(cd "$repo" && sh scripts/m3-rollback-web.sh 26f8b36)
"$repo/node_modules/.bin/vite" preview --mode service --config "$repo/vite.config.js" --outDir "$legacy" --host 127.0.0.1 --port 4341 --strictPort > "$work/preview.log" 2>&1 &
preview_pid=$!
for attempt in 1 2 3 4 5 6 7 8 9 10; do
 if curl -fsS -o "$work/entry.html" http://127.0.0.1:4341/ 2>/dev/null; then break; fi
 sleep 1
done
kill -0 "$preview_pid"
cmp "$work/entry.html" "$legacy/index.html"
for zone in Z02 Z03 Z06 Z07 Z08; do
 curl -fsS -H 'Host: 127.0.0.1:4340' "http://127.0.0.1:4341/api/service/temples/sample:sasa/zones/$zone/slots" > "$work/$zone.json"
 node -e "const rows=JSON.parse(require('fs').readFileSync(process.argv[1])).slots; for(const s of rows) console.log(s.slotId+'|'+(s.installationId??''));" "$work/$zone.json" >> "$work/api-slots"
done
LC_ALL=C sort "$work/api-slots" > "$work/api-sorted"
psql -d temple_test -XAt -v ON_ERROR_STOP=1 -c "SELECT s.id, i.id FROM slots s LEFT JOIN installations i ON s.id=i.slot_id AND i.removed_at IS NULL AND i.starts_at<=now() AND i.ends_at>now()" > "$work/db-slots"
LC_ALL=C sort "$work/db-slots" > "$work/db-sorted"
cmp "$work/api-sorted" "$work/db-sorted"
echo "Previous web build and recovered API verified against each slot and installation."
