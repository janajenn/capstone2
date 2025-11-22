# Use PHP 8.3 with FPM
FROM php:8.3-fpm

# Install system dependencies
# ADDED: netcat-openbsd (required for the 'nc' command in start.sh)
RUN apt-get update && apt-get install -y \
    zip unzip git curl \
    libpng-dev libjpeg-dev libfreetype6-dev libwebp-dev \
    libonig-dev libxml2-dev libzip-dev \
    supervisor \
    netcat-openbsd

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

# REMOVED: php artisan config:clear 
# (Do not run artisan commands during build time, variables aren't ready yet)

# Expose port
EXPOSE 8080

# Supervisor config
RUN mkdir -p /etc/supervisor/conf.d
COPY ./railway/supervisor.conf /etc/supervisor/conf.d/supervisor.conf

# Copy start script
COPY railway/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

CMD ["/bin/bash", "/usr/local/bin/start.sh"]