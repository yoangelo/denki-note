#!/usr/bin/env bash
set -e

# tmp/pids ディレクトリを作成（Puma の pidfile 用）
mkdir -p tmp/pids

# dev/prod 分岐
if [ "${RAILS_ENV}" = "production" ]; then
  echo "==> Starting Puma (production)"
  # 本番はプリコンパイル前提（CIでやる想定）
  # bundle exec rails db:migrate は CI/リリース時に実行推奨
  exec bundle exec puma -C config/puma.rb
else
  echo "==> Starting Rails (development)"
  # DBがまだなら作る（初回）
  bundle check || bundle install
  bundle exec rails db:prepare || true
  # ホットリロード用にバインド
  exec bundle exec rails server -b 0.0.0.0 -p 3000
fi