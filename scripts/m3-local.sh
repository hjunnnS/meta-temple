#!/bin/sh
set -eu
umask 077
root="$(pwd)/.m3-local"
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
exec ./node_modules/.bin/vite --mode service --host 127.0.0.1 --port 4330 --strictPort
