# AGENTS instructions

## Project overview

RMap is a monorepo platform that helps learners map current skills to career goals and generate personalized developer learning roadmaps.

## Development Environment

- Package manager: `pnpm`
- Install dependencies: `pnpm install`
- Start all apps in development mode: `pnpm dev`
- Start API only: `pnpm dev:api`
- Start Web only: `pnpm --filter web dev`
- Build all packages/apps: `pnpm build`
- Lint all packages/apps: `pnpm lint`
- Type-check all packages/apps: `pnpm check-types`
- Docker local stack: `pnpm docker:dev`
- Stop Docker stack: `pnpm docker:down`

## Codebase Structure

```
apps/                — Runnable applications
  api/               — Backend (NestJS) API app
    src/             — API source files (controllers, modules, main)
    test/            — API tests (unit/e2e)
      unit/          — Unit tests, mirroring src/modules/ structure
  web/               — Frontend (Next.js) app
    app/             — Next 16 app directory (pages/layouts/components)
    public/          — Static assets

packages/            — Shared packages and configs
  design-system/     — UI components, styles, and design utilities
    components/
    lib/
    styles/
  eslint-config/     — Shared ESLint configs
  prettier-config/   — Shared Prettier configs
  typescript-config/ — Shared TS configs

docs/                — Project documentation (SRS, etc.)
```

## Code Style & Conventions

- Use TypeScript across apps/packages.
- Follow Prettier config (2 spaces, single quotes, semicolons, trailing commas, 100-char line width, LF).
- Use ESLint from shared configs in `@repo/eslint-config`; fix warnings/errors before submitting.
- Keep imports/exports sorted (perfectionist plugin warns on ordering issues, and can be autofixed with ESLint).
- Prefer type-only imports where applicable (`@typescript-eslint/consistent-type-imports`).
- For frontend code, follow Next.js + React Hooks lint rules and Core Web Vitals rules.
- For backend code, follow NestJS patterns and keep async calls handled (floating promises are warned).
- Keep changes scoped and consistent with existing folder boundaries: `apps/*` for runnable apps, `packages/*` for shared code/config.
- Use Conventional Commits (configured with `@commitlint/config-conventional`).

### TypeScript

- Keep strict typing and avoid introducing `any` unless unavoidable.
- Clear type definitions
- Proper error handling with type guards
- Zod for runtime type validation

### Naming Conventions

- Folders/Files: kebab-case
- Components: PascalCase
- Variables/Functions: camelCase
- Types/Interfaces: PascalCase
- Constants: UPPER_SNAKE_CASE

## Testing instructions

- Run tests: `pnpm test`
- Add/update tests for behavior changes; do not ship logic-only changes without test coverage updates.
- API tests:
  - Unit/integration: `pnpm --filter api test`
  - Coverage: `pnpm --filter api test:cov`
  - e2e: `pnpm --filter api test:e2e`
- For frontend and shared packages, at minimum run lint + typecheck for impacted scopes:
  - Web: `pnpm --filter web lint` and `pnpm --filter web check-types`
  - Design system: `pnpm --filter @repo/design-system lint` and `pnpm --filter @repo/design-system check-types`
- Before creating a PR, run at repo level: `pnpm lint`, `pnpm check-types`, `pnpm test`, and `pnpm build`.

## Security considerations

- Treat authentication and account flows as sensitive (SRS FR-01): never log credentials, tokens, or secrets.
- Store passwords only as secure hashes (SRS NFR-05, e.g., bcrypt/argon2) and never persist plaintext passwords.
- Enforce HTTPS/TLS for client-server communication in all environments where possible (SRS NFR-04).
- Validate and sanitize all API inputs; reject malformed payloads early in controllers/DTO validation.
- Use least-privilege access for database and external services; keep secrets in environment variables, never hardcode.
- Add security-relevant logs (auth failures, permission denials, abnormal errors) without leaking sensitive data.
- Review third-party resource links/content before exposing them to users in learning resources.

## Do not

- Do not leave `console.log` in committed code.
