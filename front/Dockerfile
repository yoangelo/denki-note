# syntax=docker/dockerfile:1

ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine AS base

WORKDIR /usr/src/app

# 依存のキャッシュ
# BuildKitを使用してオプショナルなCOPYを実現
COPY front/package*.json ./ 

# package.jsonが存在する場合のみnpm ciを実行
RUN if [ -f "package.json" ]; then npm ci; else echo "Skipping npm ci - no package.json"; fi

# アプリ配置
COPY front/ /usr/src/app/

# dev起動ポート
EXPOSE 5173

# nginx を同梱するための multi-stage
FROM base AS with-nginx
RUN apk add --no-cache nginx
COPY docker/nginx.conf /etc/nginx/nginx.conf
EXPOSE 8080

# エントリポイント
COPY docker/entrypoint-front.sh /entrypoint-front.sh
RUN chmod +x /entrypoint-front.sh

CMD ["/entrypoint-front.sh"]
