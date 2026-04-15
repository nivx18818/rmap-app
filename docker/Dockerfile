# base
FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app

# builder
FROM base AS builder

RUN npm install -g turbo

COPY . .

ARG APP=api

RUN turbo prune "${APP:-api}" --docker

# installer
FROM base AS installer

COPY --from=builder /app/out/json/ .
RUN pnpm install --frozen-lockfile

COPY --from=builder /app/out/full/ .

ARG APP=api
RUN pnpm turbo run build --filter="${APP:-api}"

# runner
FROM node:24-alpine AS runner
WORKDIR /app

ARG APP=api
ENV APP=$APP
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

COPY --from=installer /app .

EXPOSE 3000

CMD ["sh", "-c", "APP_NAME=${APP:-api}; if [ \"$APP_NAME\" = \"api\" ]; then pnpm --filter api start:prod; elif [ \"$APP_NAME\" = \"web\" ] && [ -f apps/web/.next/standalone/server.js ]; then node apps/web/.next/standalone/server.js; else pnpm --filter \"$APP_NAME\" start; fi"]
