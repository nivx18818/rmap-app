# Roadmaps Backend Architecture

The `roadmaps` NestJS module stays plural because it represents the `/roadmaps` collection
resource and owns the existing `RoadmapsModule` and `@Controller('roadmaps')` route.

`roadmaps.service.ts` is the public facade used by `RoadmapsController`. It preserves the existing
API method names and delegates to focused internal providers.

`services/` contains internal domain providers for generation, queries, progress, quizzes, and
milestones. These providers are registered inside `RoadmapsModule`; only `RoadmapsService` is
exported.

`utils/` contains pure helper logic such as formatting, decimal/date conversion, timeline math,
markdown fence stripping, roadmap AI output parsing, quiz validation, and milestone output parsing.
