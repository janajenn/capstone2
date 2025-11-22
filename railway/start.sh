#!/bin/bash

set -e

echo "🚀 Starting application setup (Apache)..."

# 1. Safety Check: Ensure .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env found, creating empty file..."
    touch .env
fi

# 2. Database Connection Check
if [ ! -z "$DB_HOST" ] && [ ! -z "$DB_PORT" ]; then
    echo "Waiting for database at $DB_HOST:$DB_PORT..."
    
    counter=0
    while ! nc -z $DB_HOST $DB_PORT; do
        sleep 1
        counter=$((counter + 1))
        if [ $counter -gt 30 ]; then
            echo "⚠️  Database connection timeout after 30 seconds"
            break
        fi
    done
    echo "✅ Database is ready!"
else
    echo "⚠️  DB_HOST or DB_PORT not set, skipping database check."
fi

# 3. Cache Configuration
echo "Caching configuration..."
php artisan config:cache
php artisan event:cache
php artisan route:cache
php artisan view:cache

# 4. Run Migrations
echo "Running database migrations..."
php artisan migrate --force

echo "✅ Setup complete. Starting Supervisor..."

# 5. Start Supervisor (Runs Apache + Scheduler)
exec supervisord -c /etc/supervisor/conf.d/supervisor.conf