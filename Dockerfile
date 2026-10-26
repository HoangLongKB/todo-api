# syntax=docker/dockerfile:1.7
# ===== base: nền chung, user không phải root =====
FROM node:22-alpine AS base
RUN addgroup -S -g 1001 nestjs && adduser -S -u 1001 -G nestjs nestjs
WORKDIR /app

# ===== with-pnpm: bật pnpm 9 qua corepack =====
FROM base AS with-pnpm
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# ===== deps: cài ĐỦ thư viện (kể cả dev) để build =====
# Chỉ copy 2 file manifest trước: sửa code không làm cài lại thư viện (tận dụng layer cache)
FROM with-pnpm AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ===== build: biên dịch TypeScript -> dist/ =====
FROM deps AS build
COPY . .
RUN pnpm build && test -f dist/main.js

# ===== prod-deps: chỉ thư viện production, không có typescript/jest/eslint =====
FROM with-pnpm AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod

# ===== production: image cuối, nhỏ, không có source .ts =====
FROM base AS production
ENV NODE_ENV=production
# dumb-init: làm PID 1 đúng cách, chuyển tín hiệu SIGTERM cho node để Cloud Run tắt instance sạch
RUN apk add --no-cache dumb-init
COPY --from=prod-deps --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nestjs /app/dist ./dist
COPY --chown=nestjs:nestjs package.json ./
USER nestjs
EXPOSE 8080
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
