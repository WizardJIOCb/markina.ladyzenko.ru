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
