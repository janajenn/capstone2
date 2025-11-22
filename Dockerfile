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

# Copy project files (EXCLUDE .env if you have one)
COPY . .

# Remove any existing .env file to prevent conflicts


# Install composer dependencies
RUN composer install --no-dev --optimize-autoloader

# Fix Laravel permissions
RUN chown -R www-data:www-data storage bootstrap/cache

# Clear any cached config
RUN php artisan config:clear

# Expose port
EXPOSE 8080

# Supervisor config
RUN mkdir -p /etc/supervisor/conf.d
COPY ./railway/supervisor.conf /etc/supervisor/conf.d/supervisor.conf

# Create a startup script that handles database connection issues
COPY railway/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

CMD ["/bin/bash", "/usr/local/bin/start.sh"]