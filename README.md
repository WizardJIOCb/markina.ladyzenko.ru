# Фарфория — Ирина Маркина

Сайт-портфолио авторских украшений: **https://markina.ladyzenko.ru/**.

Статический HTML/CSS/JavaScript, без сборки и серверных зависимостей. В `public/` находятся все публикуемые файлы. Фильтры галереи, просмотр украшений и подготовка обращения работают в браузере. Сообщение нужно самостоятельно скопировать и отправить Ирине в диалоге VK; сайт не отправляет заявки и не хранит их на сервере.

## Локальный просмотр

```sh
python -m http.server 8317 --directory public
```

Открыть http://localhost:8317/.

## Размещение

- Сервер: `82.146.42.213`.
- Git checkout: `/var/www/markina.ladyzenko.ru`.
- Корень Nginx: `/var/www/markina.ladyzenko.ru/public`.
- Конфигурация: `/etc/nginx/sites-available/markina.ladyzenko.ru.conf`, ссылка в `sites-enabled/`.
- HTTPS: Let's Encrypt / Certbot, webroot `public/`.

При первом размещении клонировать репозиторий в указанный каталог, установить `deploy/nginx-http.conf` под именем `markina.ladyzenko.ru.conf`, создать ссылку в `sites-enabled`, выполнить `nginx -t` и `systemctl reload nginx`. Выпустить сертификат:

```sh
certbot certonly --webroot \
  -w /var/www/markina.ladyzenko.ru/public \
  -d markina.ladyzenko.ru --cert-name markina.ladyzenko.ru \
  --non-interactive --deploy-hook 'nginx -t && systemctl reload nginx'
```

Затем заменить конфигурацию на `deploy/nginx.conf`, повторно выполнить `nginx -t` и `systemctl reload nginx`. На сервере должен быть настроен автоматический запуск `certbot renew`.

## Обновление

После публикации изменений в `main`:

```sh
cd /var/www/markina.ladyzenko.ru
git status --short
git pull --ff-only origin main
```

Перед обновлением рабочий каталог должен быть чистым. Для правок только HTML/CSS/JS перезагрузка Nginx не требуется. Изменения `deploy/nginx.conf` устанавливаются отдельно с проверкой `nginx -t` и последующим `systemctl reload nginx`.

## Источники

Фотографии и сведения о работах взяты из авторского канала [Фарфория](https://t.me/farfforija). Публикации: [цветочные серьги](https://t.me/farfforija/555), [винтажная роза](https://t.me/farfforija/561), [лисички](https://t.me/farfforija/515), [мальтийские кресты](https://t.me/farfforija/534), [матрёшка](https://t.me/farfforija/524), [жуки и мухи](https://t.me/farfforija/558). Исходники сайта не включают лицензию на фотографии; права на материалы принадлежат их правообладателям.

Шрифты Cormorant Garamond и Manrope загружаются из Google Fonts; при недоступности сервиса используются системные шрифты.
