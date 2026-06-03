# base
FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app

# builder
FROM base AS builder

RUN npm install -g turbo

COPY . .

ARG APP=all

RUN APP_SCOPE="${APP:-all}"; \
  if [ "$APP_SCOPE" = "all" ]; then \
    mkdir -p /tmp/prune/json /tmp/prune/full; \
    cp package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json /tmp/prune/json/; \
    find apps packages -name package.json -exec sh -c 'for file do mkdir -p "/tmp/prune/json/$(dirname "$file")"; cp "$file" "/tmp/prune/json/$file"; done' sh {} +; \
    tar -cf - . | tar -xf - -C /tmp/prune/full; \
    mv /tmp/prune out; \
  else \
    turbo prune "$APP_SCOPE" --docker; \
  fi

# installer
FROM base AS installer

COPY --from=builder /app/out/json/ .
RUN pnpm install --frozen-lockfile

COPY --from=builder /app/out/full/ .

ARG APP=all
ARG DIRECT_URL=postgresql://postgres:postgres@localhost:5432/rmap?schema=public
ENV DIRECT_URL=$DIRECT_URL
RUN APP_SCOPE="${APP:-all}"; \
  if [ "$APP_SCOPE" = "all" ]; then \
    pnpm turbo run build; \
  else \
    pnpm turbo run build --filter="$APP_SCOPE"; \
  fi

# runner
FROM node:24-alpine AS runner
WORKDIR /app

ARG APP=all
ENV APP=$APP
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
RUN APP_SCOPE="${APP:-all}"; \
  if [ "$APP_SCOPE" = "evaluator" ] || [ "$APP_SCOPE" = "all" ]; then \
    apk add --no-cache git; \
  fi

COPY --from=installer /app .

EXPOSE 3000 3001 3002

CMD ["sh", "-c", "set -eu; APP_NAME=${APP:-all}; start_web() { if [ -f apps/web/.next/standalone/apps/web/server.js ]; then node apps/web/.next/standalone/apps/web/server.js; else pnpm --filter web start; fi; }; if [ \"$APP_NAME\" = \"api\" ]; then pnpm --filter api start:prod; elif [ \"$APP_NAME\" = \"web\" ]; then start_web; elif [ \"$APP_NAME\" = \"evaluator\" ]; then pnpm --filter evaluator start:prod; elif [ \"$APP_NAME\" = \"all\" ]; then (PORT=${API_PORT:-3001}; export PORT; pnpm --filter api start:prod) & (PORT=${EVALUATOR_PORT:-3002}; export PORT; pnpm --filter evaluator start:prod) & (PORT=${WEB_PORT:-3000}; export PORT; start_web) & wait -n; exit $?; else echo \"Unsupported APP '$APP_NAME'. Use api, web, evaluator, or all.\" >&2; exit 1; fi"]
