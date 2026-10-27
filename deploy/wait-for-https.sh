#!/usr/bin/env bash
# One-off deployment step, not a recurring certificate scheduler.
set -euo pipefail
cd /var/www/markinai.ru
deadline=$(( $(date +%s) + 86400 ))
echo 'Waiting for both new-domain A records to become public (up to 24 hours).'
while (( $(date +%s) < deadline )); do
  ready=true
  for resolver in 1.1.1.1 8.8.8.8; do
    for domain in markinai.ru www.markinai.ru; do
      if ! dig +time=2 +tries=1 +short A "$domain" @"$resolver" | grep -Fxq '82.146.42.213'; then
        ready=false
      fi
    done
  done
  if [[ "$ready" == true ]]; then
    echo 'Both domains resolve through both public resolvers. Activating HTTPS.'
    # Certificate issuance is attempted once. A failure is visible in systemd;
    # do not repeatedly spend ACME validation attempts while DNS is settling.
    bash deploy/activate-https.sh
    install -m 0640 /dev/null /var/lib/markina-cms/markinai-https.ready
    exit 0
  fi
  sleep 120
done
echo 'Public DNS did not become ready within 24 hours; HTTPS was not activated.' >&2
exit 1
