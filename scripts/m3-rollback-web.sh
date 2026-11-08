#!/bin/sh
# Build a known M3 web revision into a new local directory; the live DB stays at its current migration.
set -eu
umask 077
candidate=${1:?provide a tested M3 commit}
revision=$(git rev-parse --verify --end-of-options "$candidate^{commit}")
git merge-base --is-ancestor 26f8b36 "$revision"
root=$(pwd)
version_dir=$(mktemp -d "$root/.m3-local/web-release-XXXXXX")
git archive "$revision" > "$version_dir/source.tar"
tar -xf "$version_dir/source.tar" -C "$version_dir"
ln -s "$root/node_modules" "$version_dir/node_modules"
(cd "$version_dir" && "$root/node_modules/.bin/vite" build --mode service >&2)
printf '%s\n' "$version_dir/dist"
