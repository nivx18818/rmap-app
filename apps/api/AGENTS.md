# API — NestJS (apps/api)

Extends root AGENTS.md rules.

## Stack

- NestJS 11, TypeScript, Express platform.
- Database access via @repo/prisma (Prisma ORM).
- Jest for unit tests, Supertest for e2e.

## Module conventions

- One directory per domain module: `src/modules/users/`, `src/modules/roadmaps/`.
- Each module contains:
  - `<domain>.module.ts`
  - `<domain>.controller.ts`
  - `<domain>.service.ts`
  - `<domain>.dto.ts`
- Use `@Controller()` with explicit route prefixes (no root-level controllers for domain logic).

## Using Prisma in a module

Import and register PrismaModule globally once in AppModule, then inject PrismaService wherever needed:

```ts
// app.module.ts
import { PrismaModule } from '@repo/prisma';

@Module({
  imports: [PrismaModule],
})
export class AppModule {}
```

```ts
// roadmaps.service.ts
import { PrismaService } from '@repo/prisma';

@Injectable()
export class RoadmapsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.roadmap.findMany();
  }
}
```

- Never instantiate PrismaClient directly in app code — always inject PrismaService.
- Never import from `@prisma/client` directly — always use `@repo/prisma`.
- Never write raw SQL unless a Prisma query genuinely cannot express it, and document why with a comment.

## DTO conventions

- DTOs live in the module folder, not a global `dto/` dir.
- Use `class-validator` decorators for request validation.
- Separate `CreateXDto` and `UpdateXDto` per resource.
- `UpdateXDto` should extend `PartialType(CreateXDto)` from `@nestjs/mapped-types`.
- Never use Prisma model types as DTOs — keep the API contract decoupled from the schema.

## Dependency injection

- Always inject via constructor, never call `new Service()` directly.
- Scope services as `Injectable()` with default (singleton) scope unless you have a specific reason for request scope.

## Testing

- `pnpm --filter api test` for unit tests.
- `pnpm --filter api test:e2e` for e2e tests.
- Unit test folders mirror the `src/modules/` module structure exactly.
- A service at `src/roadmaps/roadmaps.service.ts` gets a test at `test/unit/roadmaps/roadmaps.service.spec.ts`.
- Mock PrismaService in unit tests using Jest mock or a test module with a fake PrismaService — never hit a real database in unit tests.
- e2e tests may use a test database; set `DATABASE_URL` to a separate test DB.

## Port

API listens on PORT env var, defaults to 3001.

## Do not

- Do not run Prisma migrations from this app — use `packages/prisma`.
- Do not import `@prisma/client` directly — use `@repo/prisma`.
- Do not put schema changes in this directory.
