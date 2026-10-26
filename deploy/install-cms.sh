#!/usr/bin/env bash
set -euo pipefail
site=/var/www/markina.ladyzenko.ru
if [[ "$(pwd -P)" != "$site" || ! -f server/app.py ]]; then
  echo "Run from $site" >&2
  exit 1
fi
id markina-cms >/dev/null 2>&1 || useradd --system --home-dir /var/lib/markina-cms --shell /usr/sbin/nologin markina-cms
[[ -x /opt/markina-cms-venv/bin/python ]] || python3 -m venv /opt/markina-cms-venv
/opt/markina-cms-venv/bin/pip install -r server/requirements.txt
install -d -o markina-cms -g markina-cms -m 0750 /var/lib/markina-cms
install -m 0644 deploy/markina-cms.service /etc/systemd/system/markina-cms.service
install -m 0644 deploy/markina-cms-backup.service /etc/systemd/system/markina-cms-backup.service
install -m 0644 deploy/markina-cms-backup.timer /etc/systemd/system/markina-cms-backup.timer
systemctl daemon-reload
systemctl enable --now markina-cms
systemctl restart markina-cms
for attempt in {1..15}; do
  if curl --fail --silent http://127.0.0.1:8320/api/content >/dev/null; then break; fi
  sleep 1
done
curl --fail --silent http://127.0.0.1:8320/api/content >/dev/null
install -d -m 0700 /var/backups/markina.ladyzenko.ru
backup=/var/backups/markina.ladyzenko.ru/nginx-before-cms-$(date -u +%Y%m%dT%H%M%SZ).conf
cp /etc/nginx/sites-available/markina.ladyzenko.ru.conf "$backup"
install -m 0644 deploy/nginx.conf /etc/nginx/sites-available/markina.ladyzenko.ru.conf
if ! nginx -t; then
  cp "$backup" /etc/nginx/sites-available/markina.ladyzenko.ru.conf
  echo 'Nginx config restored; reload was not performed.' >&2
  exit 1
fi
systemctl reload nginx
systemctl enable --now markina-cms-backup.timer
systemctl start markina-cms-backup.service
systemctl is-active markina-cms nginx
