# RMap

RMap is an open-source project inspired by [roadmap.sh](https://roadmap.sh) that collects and displays developer career roadmaps.

## Getting started

Prerequisites:

- Node.js (recommended LTS)
- pnpm (preferred package manager)

Install dependencies:

```bash
pnpm install
```

Run the development stack (starts apps in dev mode):

```bash
pnpm dev
```

Run only the web frontend (example):

```bash
pnpm --filter web dev
```

Build all projects:

```bash
pnpm build
```

## Project structure

- `apps/` — application code (frontend and backend)
- `packages/` — shared packages and configuration
- `docker/` — Docker-related files

## License

This project is available under the terms of the LICENSE file in the repository root.

---

For more details about running and developing within this monorepo, see the project docs and package READMEs.
