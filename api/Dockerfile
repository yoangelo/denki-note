# syntax=docker/dockerfile:1

ARG RUBY_VERSION=3.3.4
ARG BUNDLER_VERSION=2.5.15
FROM ruby:${RUBY_VERSION}-slim AS base

ENV GEM_HOME=/usr/local/bundle \
  BUNDLE_PATH=/usr/local/bundle \
  BUNDLE_BIN=/usr/local/bundle/bin \
  BUNDLE_WITHOUT="test"
ENV PATH="${BUNDLE_BIN}:${GEM_HOME}/bin:${PATH}"

RUN apt-get update -qq && apt-get install -y --no-install-recommends \
  build-essential git curl libpq-dev nodejs default-mysql-client \
  && rm -rf /var/lib/apt/lists/*

ARG BUNDLER_VERSION
RUN gem install bundler:${BUNDLER_VERSION}

WORKDIR /app

# Gem の依存関係をインストール
COPY api/Gemfile* ./
RUN bundle install

# アプリ配置
COPY api/ /app

# Puma 設定
EXPOSE 3000

# エントリポイントをコンテナ内に配置
COPY docker/entrypoint-api.sh /entrypoint-api.sh
RUN chmod +x /entrypoint-api.sh

CMD ["/entrypoint-api.sh"]