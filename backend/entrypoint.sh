#!/bin/sh
set -e

echo "=== Starting TutorMe Backend Services ==="

# Wait for MariaDB/MySQL database to become reachable
echo "Syncing database schema with Prisma..."
MAX_RETRIES=30
RETRY_COUNT=0

until bunx prisma db push || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
  RETRY_COUNT=$((RETRY_COUNT+1))
  echo "Waiting for database connection... Attempt ($RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "Error: Could not connect to the database after $MAX_RETRIES attempts."
  exit 1
fi

echo "Database schema sync complete."

echo "Starting Elysia web server..."
exec "$@"
