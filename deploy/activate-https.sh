#!/usr/bin/env bash
set -euo pipefail
if [[ "$(pwd -P)" != /var/www/markinai.ru ]]; then
  echo 'Run from /var/www/markinai.ru' >&2
  exit 1
fi
for domain in markinai.ru www.markinai.ru; do
  if ! dig +time=2 +tries=1 +short A "$domain" @1.1.1.1 | grep -Fxq '82.146.42.213'; then
    echo "Public DNS for $domain does not yet point to 82.146.42.213. No certificate request was made." >&2
    exit 75
  fi
done
certbot certonly --webroot \
  -w /var/www/markinai.ru/public \
  -d markinai.ru -d www.markinai.ru --cert-name markinai.ru \
  --non-interactive --keep-until-expiring \
  --deploy-hook 'nginx -t && systemctl reload nginx'
bash deploy/install-cms.sh
curl --fail --silent --show-error https://markinai.ru/api/content >/dev/null
echo 'HTTPS is active for markinai.ru and www.markinai.ru.'
