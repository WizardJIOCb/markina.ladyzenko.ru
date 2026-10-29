#!/usr/bin/env bash
set -euo pipefail
if [[ "$(pwd -P)" != /var/www/markinai.ru ]]; then
    echo 'Run from /var/www/markinai.ru' >&2
    exit 1
fi
source=deploy/nginx-farformer-http.conf
if [[ -f /etc/letsencrypt/live/farformer.ru/fullchain.pem ]]; then
    source=deploy/nginx-farformer.conf
fi
available=/etc/nginx/sites-available/farformer.ru.conf
enabled=/etc/nginx/sites-enabled/farformer.ru.conf
install -d -m 0700 /var/backups/markinai.ru
backup=/var/backups/markinai.ru/farformer-$(date -u +%Y%m%dT%H%M%SZ).conf
if [[ -f "$available" ]]; then cp "$available" "$backup"; fi
install -m 0644 "$source" "$available"
ln -sfn "$available" "$enabled"
if ! nginx -t; then
    if [[ -f "$backup" ]]; then cp "$backup" "$available"; else rm "$enabled" "$available"; fi
    echo 'Alias config restored; reload was not performed.' >&2
    exit 1
fi
systemctl reload nginx
