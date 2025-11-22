#!/bin/bash

set -e

echo "Starting application on Railway..."

# 1. Create a dummy .env file
# Laravel needs this file to exist, even if it is empty, 
# so it knows to look at system environment variables.
if [ ! -f /var/www/.env ]; then
    touch /var/www/.env
    echo "Created empty .env file for Laravel"
fi

# 2. Wait for database
if [ ! -z "$DB_HOST" ] && [ ! -z "$DB_PORT" ]; then
    echo "Waiting for database at $DB_HOST:$DB_PORT..."
    
    # We need to make sure netcat is installed in Dockerfile for this to work
    while ! nc -z $DB_HOST $DB_PORT; do
        sleep 1
    done
    echo "✅ Database is ready!"
fi

# 3. Clear caches
# IMPORTANT: Do this at runtime, not build time
echo "Clearing caches..."
php artisan config:clear
php artisan cache:clear
php artisan view:clear
php artisan route:clear

# 4. Run Migrations
# We skip key:generate because you defined APP_KEY in Railway variables
echo "Running database migrations..."
php artisan migrate --force

# 5. Cache Config for Production Speed
# Now that the .env file exists (even if empty) and env vars are injected,
# this will cache the Railway variables into PHP.
echo "Caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "✅ Application setup complete!"
echo "Starting supervisor..."

exec supervisord -c /etc/supervisor/conf.d/supervisor.conf