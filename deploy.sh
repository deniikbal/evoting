#!/bin/bash
# Deploy evoting: tarik kode terbaru lalu build + reload PM2.
set -euo pipefail
cd /www/wwwroot/evoting
git pull --ff-only origin main
npm install --no-audit --no-fund
npm run build
pm2 startOrReload ecosystem.config.cjs
sleep 8
curl -s -o /dev/null -w "health: %{http_code}\n" http://127.0.0.1:3003/api/health
