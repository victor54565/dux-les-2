FROM php:8.2-apache

# Включаем модуль mod_rewrite для работы .htaccess
RUN a2enmod rewrite

# Копируем все файлы проекта в веб-директорию Apache
COPY . /var/www/html/

# Даем права на запись для папок uploads и data
RUN chmod -R 777 /var/www/html/uploads /var/www/html/data

# Указываем порт, который слушает Render
EXPOSE 80
