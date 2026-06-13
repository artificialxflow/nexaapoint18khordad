#!/bin/sh
set -e

PORT="${PORT:-3000}"
HOSTNAME="${HOSTNAME:-0.0.0.0}"

echo "[entrypoint] nexaapp starting (NODE_ENV=${NODE_ENV:-unset} PORT=${PORT} HOSTNAME=${HOSTNAME})"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[entrypoint] ERROR: DATABASE_URL is not set (Coolify → Environment → Runtime)" >&2
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

echo "[entrypoint] prisma migrate deploy..."
npx prisma migrate deploy

echo "[entrypoint] starting Next.js standalone on ${HOSTNAME}:${PORT}..."
cd /app
exec su nextjs -s /bin/sh -c "exec node server.js"
