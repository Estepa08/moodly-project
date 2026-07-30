# Stage 1: Build API contract (TypeSpec -> OpenAPI)
FROM node:22-bookworm-slim AS contract
WORKDIR /workspace/api-contract
COPY api-contract/package.json api-contract/package-lock.json ./
RUN npm ci
COPY api-contract/ .
RUN npm run build

# Stage 2: Generate API types + build frontend
FROM node:22-bookworm-slim AS frontend-build
WORKDIR /workspace/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
COPY --from=contract /workspace/api-contract/generated /workspace/api-contract/generated
RUN npm run generate:api
RUN npm run build

# Stage 3: Compile backend
FROM node:22-bookworm-slim AS backend-build
WORKDIR /workspace/backend
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/prisma ./prisma
RUN npx prisma generate
COPY backend/tsconfig.json ./
COPY backend/src ./src
COPY backend/docker-entrypoint.sh ./
RUN npm run build

# Stage 4: Runtime — Caddy serves frontend, proxies /api to backend
FROM node:22-alpine
RUN apk add --no-cache caddy openssl

COPY --from=frontend-build /workspace/frontend/dist /srv
COPY --from=backend-build /workspace/backend/dist /app/dist
COPY --from=backend-build /workspace/backend/node_modules /app/node_modules
COPY --from=backend-build /workspace/backend/prisma /app/prisma
COPY --from=backend-build /workspace/backend/docker-entrypoint.sh /app/entrypoint.sh
COPY infra/Caddyfile /etc/caddy/Caddyfile

ENV BACKEND_UPSTREAM=127.0.0.1:3000
ENV PORT=3000

EXPOSE 3000

RUN chmod +x /app/entrypoint.sh

CMD (cd /app && PORT=3000 /app/entrypoint.sh) & caddy run --config /etc/caddy/Caddyfile
