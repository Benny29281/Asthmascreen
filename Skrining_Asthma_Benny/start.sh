#!/bin/sh
set -eu

exec gunicorn \
  --chdir backend \
  server:app \
  --bind "0.0.0.0:${PORT:-8080}" \
  --timeout 120
