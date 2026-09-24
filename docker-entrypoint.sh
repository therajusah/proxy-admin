#!/bin/sh
set -e
printf 'window.__API_BASE__ = "%s";\n' "${API_BASE:-}" > /srv/config.js
exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
