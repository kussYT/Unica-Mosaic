#!/bin/bash
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo 'Lancer ce script avec sudo sur le VPS.'
  exit 1
fi

stamp=$(date +%Y%m%d%H%M%S)
mkdir -p /var/backups/unica-mosaic-preview
sudo -u postgres pg_dump unica_mosaic_preview | gzip > "/var/backups/unica-mosaic-preview/unica_mosaic_preview-${stamp}.sql.gz"
chmod 600 "/var/backups/unica-mosaic-preview/unica_mosaic_preview-${stamp}.sql.gz"

cd /var/www/unica-mosaic-preview/web
sudo -u unica env PATH=/opt/node-v24.22.2/bin:$PATH NODE_OPTIONS=--max-old-space-size=1536 npm ci
sudo -u unica env PATH=/opt/node-v24.22.2/bin:$PATH NODE_OPTIONS=--max-old-space-size=1536 npm run build
systemctl restart unica-mosaic-preview
sleep 3
systemctl is-active unica-mosaic-preview
curl -fsS -o /dev/null --max-time 20 http://127.0.0.1:3028/
echo 'Unica Mosaic redémarré'
