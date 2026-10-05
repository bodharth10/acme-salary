# Single image: React is built with Node, then served as static files by the
# Rails API from public/. One service, one URL, no CORS.

# --- 1. Build the React app ------------------------------------------------
FROM node:22-alpine AS frontend
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- 2. Install gems ---------------------------------------------------------
FROM ruby:3.4.6-slim AS gems
ENV BUNDLE_DEPLOYMENT=1 BUNDLE_WITHOUT="development:test" BUNDLE_PATH=/usr/local/bundle
RUN apt-get update -qq && apt-get install -y --no-install-recommends build-essential pkg-config libyaml-dev \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY backend/Gemfile backend/Gemfile.lock ./
RUN bundle install && rm -rf "${BUNDLE_PATH}"/ruby/*/cache

# --- 3. Runtime --------------------------------------------------------------
FROM ruby:3.4.6-slim
ENV RAILS_ENV=production BUNDLE_DEPLOYMENT=1 BUNDLE_WITHOUT="development:test" \
    BUNDLE_PATH=/usr/local/bundle RAILS_LOG_TO_STDOUT=1 DATABASE_PATH=/app/storage/production.sqlite3
RUN apt-get update -qq && apt-get install -y --no-install-recommends sqlite3 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=gems /usr/local/bundle /usr/local/bundle
COPY backend/ ./
COPY --from=frontend /frontend/dist/ ./public/

RUN useradd --create-home rails && mkdir -p storage tmp log && chown -R rails:rails storage tmp log
USER rails

EXPOSE 3000
# db:prepare creates/migrates; db:seed is a no-op when data already exists.
CMD ["sh", "-c", "bin/rails db:prepare && bin/rails db:seed && bin/rails server -b 0.0.0.0 -p ${PORT:-3000}"]
