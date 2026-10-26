# Фарфория — Ирина Маркина

Сайт-портфолио авторских украшений: **https://markina.ladyzenko.ru/**.

HTML/CSS/JavaScript без сборки и небольшой CMS на Python/Flask/SQLite. Nginx отдаёт `public/`, а системная служба `markina-cms` обслуживает `/api/` и фотографии `/uploads/` на loopback `127.0.0.1:8320`. Фильтры, просмотр украшений и подготовка обращения работают в браузере. Сообщение нужно самостоятельно скопировать и отправить Ирине; сайт не отправляет и не хранит заявки.

## Локальный просмотр

```sh
python -m venv .venv
# Windows: .venv\Scripts\python.exe вместо .venv/bin/python
.venv/bin/python -m pip install -r server/requirements.txt
.venv/bin/python server/app.py serve
```

Открыть http://localhost:8320/ и http://localhost:8320/admin/. Без `MARKINA_DATA` база хранится в игнорируемой `.cms-data/`. Для другого адреса указать `MARKINA_ORIGIN`; для другого порта также `PORT`.

Создать персональную ссылку первого входа (не выводится в журнал):

```sh
.venv/bin/python server/app.py setup-link --output /private/path/setup-link.txt
```

Открыть ссылку из файла, придумать пароль от 12 символов и войти. Ссылка одноразовая и действует 24 часа. После настройки открыть `/admin/` и использовать пароль. Для смены пароля есть раздел «Пароль и вход». Сеанс длится 8 часов; выход и смена пароля отзывают сеансы на сервере.

## Что редактируется

- Карточки: название, фото, категория, подпись, описание, публикация, подборки, видимость, порядок, добавление и удаление.
- Тексты первого экрана, галереи, блока об Ирине, образов, заказа, вопросов, контактов и подвала.
- Фотографии об Ирине и трёх образов, три фотокомпозиции первого экрана.
- Вопросы и ответы, три шага заказа, телефон и ссылки на социальные сети.

Изменения остаются в редакторе до кнопки «Сохранить на сайте». Одновременное сохранение старой вкладки отклоняется, чтобы не затереть новую версию. Можно скачать JSON копию текстов и карточек. История хранит 100 версий; восстановление сначала загружает копию в редактор и требует сохранения. Загруженные фото сохраняются отдельно, автоматически преобразуются в WebP с ограничением 2400×2400; JPEG/PNG/WebP до 12 МБ и 24 МП. Изображения не удаляются при удалении карточек, чтобы восстановление истории оставалось рабочим.

Основной сайт загружает опубликованное содержимое из `/api/content`. `public/content.json` — исходное наполнение и аварийный запас при недоступном API. Архив `/old/` остаётся статическим. Фотоистории первого экрана редактируются отдельно от карточек галереи.

## Установка CMS на VPS

Из корня checkout от root:

```sh
bash deploy/install-cms.sh
runuser -u markina-cms -- env MARKINA_DATA=/var/lib/markina-cms MARKINA_ORIGIN=https://markina.ladyzenko.ru /opt/markina-cms-venv/bin/python server/app.py setup-link --output /var/lib/markina-cms/setup-link.txt
```

Скрипт создаёт непривилегированного пользователя, venv `/opt/markina-cms-venv`, постоянную папку `/var/lib/markina-cms`, устанавливает systemd API и ежедневный снимок базы, проверяет и перечитывает Nginx только для этого сайта. База, сеансы, пароль и загрузки не попадают в Git. Первый пароль не задан заранее. Файл ссылки настройки передать владельцу приватно и удалить после использования.

Проверки: `systemctl is-active markina-cms`, `curl -f https://markina.ladyzenko.ru/api/content`, `systemctl list-timers markina-cms-backup.timer`. Тесты: `.venv/bin/python -m unittest discover -s server -v`; они используют временную базу, а не production.

Восстановление доступа из SSH (интерактивно, пароль не передавать аргументом):

```sh
cd /var/www/markina.ladyzenko.ru
runuser -u markina-cms -- env MARKINA_DATA=/var/lib/markina-cms MARKINA_ORIGIN=https://markina.ladyzenko.ru /opt/markina-cms-venv/bin/python server/app.py reset-password
```

База ежедневно копируется SQLite backup API в `/var/lib/markina-cms/backups/`, хранятся 14 дневных снимков. Фото находятся в `/var/lib/markina-cms/uploads/`; для переноса сайта нужны база и эта папка. Копии базы на том же VPS не заменяют внешнюю резервную копию. Перед ручным восстановлением остановить `markina-cms`, сохранить текущую базу вместе с `-wal`/`-shm`, восстановить снимок с владельцем `markina-cms`, убрать устаревшие sidecar файлы и запустить службу.

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

Перед обновлением рабочий каталог должен быть чистым. Для правок только HTML/CSS/JS перезагрузка Nginx не требуется. После обновления Python перезапустить `markina-cms`; зависимости зафиксированы в `server/requirements.txt`. Изменения конфигурации и службы применять через `bash deploy/install-cms.sh` с проверкой Nginx. Постоянное содержимое в `/var/lib/markina-cms` при обновлении не меняется.

## Версии сайта

Основная версия с анимациями находится по адресу **https://markina.ladyzenko.ru/**. Её HTML, CSS и JavaScript находятся непосредственно в `public/`. Предыдущий лендинг сохранён на **https://markina.ladyzenko.ru/old/**, исходники в `public/old/`. Общие фотографии находятся в `public/assets/`.

Адреса `/new` и `/new/` перенаправляются на главную с кодом 301. Прежние адреса ресурсов `/new/style.css`, `/new/app.js` и другие `/new/*` перенаправляются на соответствующий путь в корне. Главная открыта для индексации и имеет canonical на `/`; архивная `/old/` закрыта от индексации.

Дизайн построен по навыкам [landing-page-design](https://github.com/elayadesign/ai-design-skills/tree/main/skills/landing-page-design) и [design-to-motion](https://github.com/elayadesign/ai-design-skills/tree/main/skills/design-to-motion) из `elayadesign/ai-design-skills`, исходная ревизия `a2735a3eaf092eaaffb6dc17df25de33ef3bd048`.

Цветовая палитра, favicon и блок «Ваша история. Особенная деталь.» взяты из первой версии. На телефоне три образа можно листать горизонтально. Плашки на первом экране разделены зазором, увеличение и возврат изображений карточек выполняются плавно за 0,8 секунды.

Анимации: последовательное появление первого экрана, смена трёх фотокомпозиций с паузой и ручным выбором, появление карточек при прокрутке, проявление крупной фразы по словам, переходы в меню и карточках. Смена фотографий приостанавливается вне экрана и при скрытой вкладке; `prefers-reduced-motion` отключает движение и автопереключение. Сообщение для мастера формируется только в браузере, обязательные пожелания проверяются до подготовки текста.

Карточки, информационные диалоги и мобильное меню плавно закрываются по кнопке, Escape и, для небольших диалогов, клику снаружи. Окно остаётся модальным до завершения анимации, затем возвращаются фокус и прокрутка. При уменьшении движения закрытие происходит сразу.

Страница `public/404.html` используется для ошибок 404. Для применения маршрутов установить `deploy/nginx.conf` с проверкой `nginx -t` и последующим `systemctl reload nginx`.

## Источники материалов

Фотографии и сведения о работах взяты из авторского канала [Фарфория](https://t.me/farfforija). Публикации: [цветочные серьги](https://t.me/farfforija/555), [винтажная роза](https://t.me/farfforija/561), [лисички](https://t.me/farfforija/515), [мальтийские кресты](https://t.me/farfforija/534), [матрёшка](https://t.me/farfforija/524), [жуки и мухи](https://t.me/farfforija/558). Исходники сайта не включают лицензию на фотографии; права на материалы принадлежат их правообладателям.

Шрифты Cormorant Garamond и Manrope загружаются из Google Fonts; при недоступности сервиса используются системные шрифты.
