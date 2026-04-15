# base
FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app

# builder
FROM base AS builder

RUN npm install -g turbo

COPY . .

ARG APP

RUN turbo prune --scope=$APP --docker

# installer
FROM base AS installer

COPY --from=builder /app/out/json/ .
RUN pnpm install --frozen-lockfile

COPY --from=builder /app/out/full/ .

ARG APP
RUN pnpm turbo run build --filter=$APP

# runner
FROM node:24-alpine AS runner
WORKDIR /app

ARG APP
ENV APP=$APP
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

COPY --from=installer /app .

EXPOSE 3000

CMD ["sh", "-c", "if [ \"$APP\" = \"api\" ]; then pnpm --filter api start:prod; elif [ \"$APP\" = \"web\" ] && [ -f apps/web/.next/standalone/server.js ]; then node apps/web/.next/standalone/server.js; else pnpm --filter $APP start; fi"]
