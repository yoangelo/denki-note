#!/bin/bash

# フロントエンド初回セットアップスクリプト

echo "フロントエンドの初回セットアップを開始します..."

# Node.js Dockerイメージを使用して直接Viteプロジェクトを作成
echo "Viteプロジェクトを作成中..."
docker run --rm -it \
  -v $(pwd)/front:/app \
  -w /app \
  node:20-alpine \
  sh -c "npm create vite@latest . -- --template react-ts && npm i"

echo "セットアップが完了しました！"
echo ""
echo "開発サーバーを起動するには以下のコマンドを実行してください："
echo "docker compose up front"