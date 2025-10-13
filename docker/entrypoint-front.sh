#!/usr/bin/env sh
set -e

if [ "$NODE_ENV" = "production" ]; then
  echo "==> Building front (production) and starting nginx"
  npm ci
  npm run build
  # dist を nginx のドキュメントルートに配置
  rm -rf /var/www && mkdir -p /var/www && cp -r dist/* /var/www/
  exec nginx -g 'daemon off;'
else
  echo "==> Starting Vite dev server"
  npm ci
  exec npm run dev -- --host 0.0.0.0 --port 5173
fi
