#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/lint-server"

docker rm -f lint-api >/dev/null 2>&1 || true

cd "$SERVER_DIR"
docker build -t lint-server:latest .

docker run -d --name lint-api -p 127.0.0.1:3310:3310 lint-server:latest