#!/bin/sh
set -e

PORT="${PORT:-3000}"
HOSTNAME="${HOSTNAME:-0.0.0.0}"
PRISMA_CLI="/prisma-cli/node_modules/prisma/build/index.js"
SHIM_PID=""

truthy() {
  case "${1:-}" in
    1 | true | TRUE | yes | YES | on | ON) return 0 ;;
    *) return 1 ;;
  esac
}

cleanup() {
  if [ -n "$SHIM_PID" ]; then
    kill "$SHIM_PID" 2>/dev/null || true
    wait "$SHIM_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

start_nextjs() {
  echo "[entrypoint] starting Next.js standalone on ${HOSTNAME}:${PORT}..."
  cd /app
  if command -v runuser >/dev/null 2>&1; then
    exec runuser -u nextjs -- node server.js
  fi
  if command -v su >/dev/null 2>&1; then
    exec su nextjs -s /bin/sh -c "exec node server.js"
  fi
  echo "[entrypoint] ERROR: cannot drop privileges (runuser/su missing)" >&2
  exit 1
}

run_migrate() {
  echo "[entrypoint] prisma migrate deploy..."
  if ! node /migrate-deploy.js; then
    echo "[entrypoint] ERROR: prisma migrate deploy failed — see [migrate] lines above" >&2
    return 1
  fi
  echo "[entrypoint] prisma migrate deploy OK"
  return 0
}

echo "[entrypoint] nexaapp starting (NODE_ENV=${NODE_ENV:-unset} PORT=${PORT} HOSTNAME=${HOSTNAME})"
node --version 2>/dev/null || true

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[entrypoint] ERROR: DATABASE_URL is not set (Runflare → Environment → Runtime)" >&2
  exit 1
fi

if [ -z "${DIRECT_URL:-}" ]; then
  echo "[entrypoint] ERROR: DIRECT_URL is not set (required by prisma/schema.prisma)" >&2
  exit 1
fi

if [ ! -f /app/server.js ]; then
  echo "[entrypoint] ERROR: /app/server.js missing — standalone build failed?" >&2
  exit 1
fi

if [ ! -f "$PRISMA_CLI" ]; then
  echo "[entrypoint] ERROR: Prisma CLI missing at $PRISMA_CLI" >&2
  exit 1
fi

if [ ! -f /preflight.js ] || [ ! -f /startup-shim.js ] || [ ! -f /migrate-deploy.js ]; then
  echo "[entrypoint] ERROR: missing /preflight.js, /startup-shim.js, or /migrate-deploy.js — rebuild image" >&2
  exit 1
fi

# One-off: set MIGRATE_ONLY=1 in Runflare, restart pod → runs migrate and exits (check logs).
if truthy "${MIGRATE_ONLY:-}"; then
  echo "[entrypoint] MIGRATE_ONLY=1 — running preflight + migrate then exit"
  node /preflight.js
  run_migrate || exit 1
  echo "[entrypoint] MIGRATE_ONLY complete"
  exit 0
fi

echo "[entrypoint] starting HTTP shim on ${HOSTNAME}:${PORT} (keeps ingress alive during migrate)..."
node /startup-shim.js &
SHIM_PID=$!
sleep 1

echo "[entrypoint] running database preflight (TCP + env)..."
node /preflight.js

if truthy "${SKIP_MIGRATE:-}"; then
  echo "[entrypoint] WARNING: SKIP_MIGRATE=1 — skipping prisma migrate deploy"
  echo "[entrypoint] Run once with MIGRATE_ONLY=1 or unset SKIP_MIGRATE after fixing DB"
else
  run_migrate || exit 1
fi

echo "[entrypoint] stopping startup shim..."
cleanup
SHIM_PID=""

start_nextjs
