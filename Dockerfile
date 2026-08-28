# Stage 1: Build API contract (TypeSpec -> OpenAPI)
FROM node:22-bookworm-slim AS contract
WORKDIR /workspace/api-contract
COPY api-contract/package.json api-contract/package-lock.json ./
RUN npm ci
COPY api-contract/ .
RUN npm run build

# Stage 2: Build shared logic package (@moodly/shared)
FROM node:22-bookworm-slim AS shared-build
WORKDIR /workspace/shared
COPY shared/package.json shared/package-lock.json ./
RUN npm ci
COPY shared/ .
RUN npm run build

# Stage 3: Generate API types + build frontend
FROM node:22-bookworm-slim AS frontend-build
# Публичный VAPID-ключ для push-уведомлений — задаётся в build-переменных
# DockHost. Vite инлайнит VITE_* на этапе сборки, поэтому ключ должен быть
# доступен здесь, а не в runtime.
ARG VITE_VAPID_PUBLIC_KEY
ENV VITE_VAPID_PUBLIC_KEY=$VITE_VAPID_PUBLIC_KEY
WORKDIR /workspace
COPY --from=shared-build /workspace/shared /workspace/shared
WORKDIR /workspace/frontend
COPY frontend/package.json frontend/package-lock.json ./
COPY frontend/scripts ./scripts
RUN npm ci
# Playwright/Chromium нужен только для пререндера статического HTML
# (frontend/scripts/prerender.mjs) на этапе сборки. В runtime-образ не копируется.
# Best-effort: если установка браузера не удалась, пререндер будет пропущен,
# а деплой уедет как классический SPA.
RUN npx playwright install --with-deps chromium || echo "WARN: playwright chromium не установлен — prerender пропущен"
COPY frontend/ .
COPY --from=contract /workspace/api-contract/generated /workspace/api-contract/generated
RUN npm run generate:api
RUN npm run build

# Stage 4: Compile backend
FROM node:22-bookworm-slim AS backend-build
WORKDIR /workspace
COPY --from=shared-build /workspace/shared /workspace/shared
WORKDIR /workspace/backend
# Билд-окружение CI не имеет маршрута до зеркал Debian вовсе (ни http, ни
# https — только npm/GitHub/CDN, см. соседние стадии), поэтому apt-get здесь
# ненадёжен. openssl нигде в коде бэкенда не используется — он нужен был
# только чтобы `prisma generate` мог определить версию OpenSSL для
# binaryTarget "native"; без него Prisma просто выводит warning и берёт
# версию по умолчанию, а "native"-движок в этой стадии всё равно не попадает
# в рантайм-образ (там musl/alpine, см. binaryTargets в schema.prisma и
# apk-установку openssl в рантайм-стадии ниже).
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/prisma ./prisma
RUN npx prisma generate
COPY backend/tsconfig.json backend/tsconfig.build.json ./
COPY backend/src ./src
# Шрифт + emoji-PNG для OG-карточек шеринга (services/og-card.ts) — статические
# ассеты, не проходят через tsc, читаются в рантайме по относительному пути.
COPY backend/assets ./assets
COPY backend/docker-entrypoint.sh ./
RUN npm run build

# Stage 5: Runtime — Caddy serves frontend, proxies /api to backend
FROM node:22-alpine
# libcap — setcap для не-root привязки Caddy к привилегированному порту 80
RUN apk add --no-cache caddy openssl libcap \
 && setcap cap_net_bind_service=+ep /usr/sbin/caddy

COPY --from=frontend-build /workspace/frontend/dist /srv
COPY --from=backend-build /workspace/backend/dist /app/dist
COPY --from=backend-build /workspace/backend/node_modules /app/node_modules
COPY --from=backend-build /workspace/backend/prisma /app/prisma
COPY --from=backend-build /workspace/backend/assets /app/assets
COPY --from=backend-build /workspace/backend/docker-entrypoint.sh /app/entrypoint.sh
COPY --from=backend-build /workspace/backend/package.json /workspace/backend/package-lock.json /app/
COPY --from=shared-build /workspace/shared /app/shared
# Удаляем dev-зависимости из прод-образа (prisma CLI — регулярная зависимость,
# остаётся доступным для `prisma migrate deploy`), затем кладём @moodly/shared
# поверх установленного file:-пакета.
RUN cd /app && npm prune --omit=dev \
 && rm -f /app/node_modules/@moodly/shared && ln -s /app/shared /app/node_modules/@moodly/shared
COPY infra/Caddyfile /etc/caddy/Caddyfile

ENV BACKEND_UPSTREAM=127.0.0.1:3001
ENV PORT=3000

EXPOSE 3000

RUN chmod +x /app/entrypoint.sh \
 && chown -R node:node /app

# Здоровье проверяется по внутреннему эндпоинту бэкенда (health_uri Caddy = /health)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/health >/dev/null 2>&1 || exit 1

# Контейнер не работает от root: Caddy получает порт 80 через file-capability,
# бэкенд слушает непривилегированный порт 3001
USER node
WORKDIR /app

CMD (cd /app && PORT=3001 /app/entrypoint.sh) & caddy run --config /etc/caddy/Caddyfile
