# API integration tests

The integration suite intentionally covers the primary API user journeys and the most
important system boundaries: authentication/session handling, access control, request
validation, onboarding, public templates, learner dashboard/activity, roadmap
generation/learning progress, roadmap ownership, and admin template management. Keep
detailed validation permutations and service-specific branches in focused unit or
controller tests.

The integration suite runs the Nest application through Supertest and uses a real
PostgreSQL database through Prisma. Use a disposable database only.

Required environment:

```bash
DATABASE_URL="postgres://USER:PASSWORD@localhost:5432/rmap_test"
JWT_SECRET="test-access-secret"
JWT_REFRESH_SECRET="test-refresh-secret"
JWT_REFRESH_TOKEN_HASH_SECRET="test-refresh-hash-secret"
CLIENT_URL="http://localhost:3000"
```

The cleanup helper refuses to reset data unless `NODE_ENV=test` and `DATABASE_URL`
contains `test`. For disposable databases with another name, set
`INTEGRATION_ALLOW_DB_RESET=true`. The legacy `E2E_ALLOW_DB_RESET=true` value is also
accepted while the old script alias remains.

The suite fails if the test database is not reachable. This is intentional: a passing
integration run means the DB-backed flows actually executed.

Run locally:

```bash
pnpm --filter @repo/db db:deploy
pnpm --filter api test:integration
```

CI runs unit tests, applies migrations to a disposable PostgreSQL service database,
then runs `pnpm --filter api test:integration`.
