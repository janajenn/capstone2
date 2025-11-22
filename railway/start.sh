#!/bin/bash

set -e

echo "Starting application on Railway..."

# Wait a moment for environment variables to be injected
sleep 2

# Display database connection info for debugging
echo "Database Configuration:"
echo "DB_HOST: $DB_HOST"
echo "DB_PORT: $DB_PORT" 
echo "DB_DATABASE: $DB_DATABASE"
echo "DB_USERNAME: $DB_USERNAME"

# Wait for database to be ready (max 30 seconds)
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
fi

# Clear any cached configuration
php artisan config:clear
php artisan cache:clear

# Generate app key if not exists
if [ -z "$(grep APP_KEY=.base64 .env 2>/dev/null)" ]; then
    php artisan key:generate --force
fi

# Run database migrations
echo "Running database migrations..."
php artisan migrate --force

echo "✅ Application setup complete!"
echo "Starting supervisor..."

exec supervisord -c /etc/supervisor/conf.d/supervisor.conf