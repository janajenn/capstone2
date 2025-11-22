# Use PHP 8.3 with FPM
FROM php:8.3-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    zip unzip git curl \
    libpng-dev libjpeg-dev libfreetype6-dev libwebp-dev \
    libonig-dev libxml2-dev libzip-dev \
    supervisor

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install gd

RUN docker-php-ext-install pdo pdo_mysql mbstring exif bcmath zip

# Install Composer
COPY --from=composer:2.6 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy project files
COPY . .

# Install composer dependencies
RUN composer install --no-dev --optimize-autoloader

# Fix Laravel permissions
RUN chown -R www-data:www-data storage bootstrap/cache

# Expose port (Railway uses PORT environment variable)
EXPOSE 8080

# Supervisor config
RUN mkdir -p /etc/supervisor/conf.d
COPY ./railway/supervisor.conf /etc/supervisor/conf.d/supervisor.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start command optimized for Railway
CMD php artisan migrate --force && supervisord -c /etc/supervisor/conf.d/supervisor.conf