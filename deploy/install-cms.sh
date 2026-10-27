#!/usr/bin/env bash
set -euo pipefail
site=/var/www/markinai.ru
if [[ "$(pwd -P)" != "$site" || ! -f server/app.py ]]; then
  echo "Run from $site" >&2
  exit 1
fi
mode=${1:-https}
case "$mode" in
  --http-only) nginx_source=deploy/nginx-http.conf ;;
  https)
    nginx_source=deploy/nginx.conf
    if [[ ! -f /etc/letsencrypt/live/markinai.ru/fullchain.pem ]]; then
      echo 'Issue the markinai.ru certificate first, or use --http-only to stage.' >&2
      exit 1
    fi
    ;;
  *) echo 'Usage: bash deploy/install-cms.sh [--http-only]' >&2; exit 1 ;;
esac
id markina-cms >/dev/null 2>&1 || useradd --system --home-dir /var/lib/markina-cms --shell /usr/sbin/nologin markina-cms
[[ -x /opt/markina-cms-venv/bin/python ]] || python3 -m venv /opt/markina-cms-venv
/opt/markina-cms-venv/bin/pip install -r server/requirements.txt
install -d -o markina-cms -g markina-cms -m 0750 /var/lib/markina-cms
install -m 0644 deploy/markinai-cms.service /etc/systemd/system/markinai-cms.service
install -m 0644 deploy/markina-cms-backup.service /etc/systemd/system/markina-cms-backup.service
install -m 0644 deploy/markina-cms-backup.timer /etc/systemd/system/markina-cms-backup.timer
systemctl daemon-reload
systemctl enable --now markinai-cms
systemctl restart markinai-cms
for attempt in {1..15}; do
  if curl --fail --silent http://127.0.0.1:8322/api/content >/dev/null; then break; fi
  sleep 1
done
curl --fail --silent http://127.0.0.1:8322/api/content >/dev/null
install -d -m 0700 /var/backups/markinai.ru
backup=/var/backups/markinai.ru/nginx-before-cms-$(date -u +%Y%m%dT%H%M%SZ).conf
if [[ -f /etc/nginx/sites-available/markinai.ru.conf ]]; then
  cp /etc/nginx/sites-available/markinai.ru.conf "$backup"
fi
install -m 0644 "$nginx_source" /etc/nginx/sites-available/markinai.ru.conf
ln -sfn /etc/nginx/sites-available/markinai.ru.conf /etc/nginx/sites-enabled/markinai.ru.conf
if ! nginx -t; then
  if [[ -f "$backup" ]]; then
    cp "$backup" /etc/nginx/sites-available/markinai.ru.conf
  else
    rm /etc/nginx/sites-enabled/markinai.ru.conf /etc/nginx/sites-available/markinai.ru.conf
  fi
  echo 'Nginx config restored; reload was not performed.' >&2
  exit 1
fi
systemctl reload nginx
systemctl enable --now markina-cms-backup.timer
systemctl start markina-cms-backup.service
systemctl is-active markinai-cms nginx
