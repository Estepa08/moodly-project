#!/bin/sh
set -e
echo "Applying pending Prisma migrations..."
npx prisma migrate deploy
echo "Starting backend..."
exec node dist/index.js
