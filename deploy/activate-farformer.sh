#!/usr/bin/env bash
set -euo pipefail
cd /var/www/markinai.ru

dns_ready() {
    local resolver domain records ipv6
    for resolver in 1.1.1.1 8.8.8.8; do
        for domain in farformer.ru www.farformer.ru; do
            records=$(dig +time=2 +tries=1 +short A "$domain" @"$resolver" | grep -E '^[0-9]+(\.[0-9]+){3}$' | sort -u || true)
            if [[ "$records" != 82.146.42.213 ]]; then
                echo "DNS not ready: $domain via $resolver = ${records:-no A record}" >&2
                return 75
            fi
            ipv6=$(dig +time=2 +tries=1 +short AAAA "$domain" @"$resolver" | grep ':' || true)
            if [[ -n "$ipv6" ]]; then
                echo "Check/remove the AAAA record for $domain before this IPv4-only alias deployment." >&2
                return 75
            fi
        done
    done
}

activate() {
    bash deploy/install-farformer.sh
    certbot certonly --webroot -w /var/www/markinai.ru/public \
        -d farformer.ru -d www.farformer.ru --cert-name farformer.ru \
        --non-interactive --keep-until-expiring \
        --deploy-hook 'nginx -t && systemctl reload nginx'
    bash deploy/install-farformer.sh
    local domain target
    for domain in farformer.ru www.farformer.ru; do
        target=$(curl --fail --silent --show-error --max-time 20 -o /dev/null -w '%{redirect_url}' "https://$domain/")
        [[ "$target" == https://markinai.ru/ ]]
    done
    install -d -m 0750 /var/lib/farformer-redirect
    install -m 0640 /dev/null /var/lib/farformer-redirect/https.ready
    echo 'FARFORMER.RU HTTP and HTTPS aliases are active.'
}

case "${1:-activate}" in
    --check-dns) dns_ready ;;
    --wait)
        deadline=$(( $(date +%s) + 86400 ))
        echo 'Waiting up to 24 hours for FARFORMER.RU DNS. No certificate requests until DNS is ready.'
        while (( $(date +%s) < deadline )); do
            if dns_ready; then activate; exit 0; fi
            sleep 120
        done
        echo 'DNS did not become ready within 24 hours.' >&2
        exit 1
        ;;
    activate) dns_ready; activate ;;
    *) echo 'Usage: activate-farformer.sh [--check-dns|--wait]' >&2; exit 1 ;;
esac
