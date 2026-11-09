#!/bin/sh
set -eu
umask 077
root="$(pwd)/.m3-local"
if [ "${1:-}" = "--integration" ]; then
 root="$root/qa"
 export SASA_LOCAL_INTEGRATION=1
fi
mkdir -p "$root/socket" "$root/mail"
if [ ! -f "$root/db/PG_VERSION" ]; then
 initdb -D "$root/db" --encoding=UTF8 --locale=C --auth-local=peer --auth-host=reject >/dev/null
fi
if ! pg_ctl -D "$root/db" status >/dev/null; then
 pg_ctl -D "$root/db" -l "$root/postgres.log" -o "-c listen_addresses='' -k '$root/socket' -p 54839" -w start
fi
if ! psql -h "$root/socket" -p 54839 -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='temple_test'" | grep -qx 1; then
 createdb -h "$root/socket" -p 54839 temple_test
fi
if [ "${1:-}" = "--integration" ]; then
 ./node_modules/.bin/vite build --mode service --outDir "$root/integration"
 exec ./node_modules/.bin/vite preview --mode service --outDir "$root/integration" --host 127.0.0.1 --port 4341 --strictPort
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
