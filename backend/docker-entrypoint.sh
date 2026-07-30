#!/bin/sh

echo "Waiting for database connection..."
MAX_RETRIES=30
RETRY_COUNT=0
until npx prisma db push --accept-data-loss --skip-generate 2>/dev/null || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "Attempt $RETRY_COUNT/$MAX_RETRIES: database not ready, retrying in 2s..."
  sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "WARNING: Could not connect to database after $MAX_RETRIES attempts. Continuing..."
fi

echo "Applying pending Prisma migrations..."
npx prisma migrate deploy || echo "WARNING: Migration failed, attempting to start anyway..."

echo "Starting backend..."
exec node dist/index.js
