#!/bin/sh

echo "Waiting for database connection..."
MAX_RETRIES=30
RETRY_COUNT=0
# Migrations go through DIRECT_URL (set in schema.prisma) to bypass the
# connection pooler. `prisma migrate deploy` applies only unapplied migrations,
# so it is safe to retry on connection failures.
until npx prisma migrate deploy 2>/dev/null || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "Attempt $RETRY_COUNT/$MAX_RETRIES: database not ready, retrying in 2s..."
  sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "WARNING: Could not apply migrations after $MAX_RETRIES attempts. Continuing..."
fi

echo "Starting backend..."
exec node dist/index.js
