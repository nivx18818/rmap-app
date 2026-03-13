# base
FROM node:20-alpine AS base
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
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=installer /app .

ARG APP

EXPOSE 3000

CMD ["sh", "-c", "pnpm --filter $APP start"]
