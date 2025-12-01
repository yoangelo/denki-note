#!/usr/bin/env bash
set -e

# dev/prod 分岐
if [ "${RAILS_ENV}" = "production" ] || [ "${RAILS_ENV}" = "staging" ]; then
  echo "==> Starting Rails (${RAILS_ENV})"
  exec bundle exec rails server -b 0.0.0.0 -p 3000
else
  echo "==> Starting Rails (development)"
  # DBがまだなら作る（初回）
  bundle check || bundle install
  bundle exec rails db:prepare || true
  exec bundle exec rails server -b 0.0.0.0 -p 3000
fi