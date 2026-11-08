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
cleanup(){
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
