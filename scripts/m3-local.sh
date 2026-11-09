#!/bin/sh
set -eu
umask 077
root="$(pwd)/.m3-local"
if [ "${1:-}" = "--integration" ]; then
 root="$root/qa"
 export SASA_LOCAL_INTEGRATION=1
fi
db_port=54839
db_name=temple_test
if [ "${1:-}" = "--standalone" ]; then
 root="$root/standalone"
 db_port=54840
 db_name=temple_candidate
fi
if [ "${1:-}" = "--standalone" ] || [ "${1:-}" = "--integration" ]; then
 export SASA_STATE_DIR="$root" SASA_DB_HOST="$root/socket" SASA_DB_PORT="$db_port" SASA_DB_NAME="$db_name"
fi
mkdir -p "$root/socket" "$root/mail"
if [ ! -f "$root/db/PG_VERSION" ]; then
 initdb -D "$root/db" --encoding=UTF8 --locale=C --auth-local=peer --auth-host=reject >/dev/null
fi
if ! pg_ctl -D "$root/db" status >/dev/null; then
 pg_ctl -D "$root/db" -l "$root/postgres.log" -o "-c listen_addresses='' -k '$root/socket' -p $db_port" -w start
fi
if ! psql -h "$root/socket" -p "$db_port" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$db_name'" | grep -qx 1; then
 createdb -h "$root/socket" -p "$db_port" "$db_name"
fi
if [ "${1:-}" = "--integration" ] || [ "${1:-}" = "--standalone" ]; then
 ./node_modules/.bin/vite build --mode service --outDir "$root/web"
 if [ "${1:-}" = "--integration" ]; then export SASA_HTTP_PORT=4341; fi
 exec node server/candidate.mjs
fi
if [ "${1:-}" = "--candidate" ]; then
 ./node_modules/.bin/vite build --mode service --outDir "$root/candidate"
 exec ./node_modules/.bin/vite preview --mode service --outDir "$root/candidate" --host 127.0.0.1 --port 4340 --strictPort
fi
if [ -n "${M3_WEB_RELEASE:-}" ]; then
 case "$M3_WEB_RELEASE" in *[!A-Za-z0-9_-]*|'') exit 2;; web-release-*) ;; *) exit 2;; esac
 dir="$root/$M3_WEB_RELEASE/dist"
 test -f "$dir/index.html"
 exec ./node_modules/.bin/vite preview --mode service --outDir "$dir" --host 127.0.0.1 --port 4330 --strictPort
fi
exec ./node_modules/.bin/vite --mode service --host 127.0.0.1 --port 4330 --strictPort
