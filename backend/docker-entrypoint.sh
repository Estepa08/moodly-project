#!/bin/sh

echo "Waiting for database connection..."
MAX_RETRIES=30
RETRY_COUNT=0
# Migrations go through DATABASE_URL (direct connection, no pooler currently).
# If a pooled provider (Neon/Supabase) is used, add directUrl to schema.prisma
# and `prisma migrate deploy` will use DIRECT_URL to bypass the pooler.
# `prisma migrate deploy` applies only unapplied migrations,
# so it is safe to retry on connection failures.
until npx prisma migrate deploy || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "Attempt $RETRY_COUNT/$MAX_RETRIES: database not ready, retrying in 2s..."
  sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "WARNING: Could not apply migrations after $MAX_RETRIES attempts. Continuing..."
fi

# Тестовый стенд (e2e): наполняем справочники (тесты, параметры, онбординг).
# Активируется только env E2E_SEED=1 на стенде moodly-e2e — прод не затрагивается.
if [ "$E2E_SEED" = "1" ]; then
  echo "Seeding reference data (E2E_SEED=1)..."
  PROD_SEED=1 SEED_CONTENT_ONLY=1 node dist/seed.js || echo "WARNING: seed failed (non-fatal)"
fi

echo "Starting backend..."
exec node dist/index.js
