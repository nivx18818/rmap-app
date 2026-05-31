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

## GitHub Project to Google Sheets sync

The repository includes a GitHub Actions automation package at `packages/sheets-sync` that syncs the user Project v2 board `https://github.com/users/nivx18818/projects/1/` into the Google Sheets tab `Sprint Backlog Tracker`.

The workflow runs on issue, pull request, push, manual dispatch, and every 5 minutes on a schedule. Issue, pull request, and push events run quickly; Project-only field changes or card moves are picked up by scheduled polling and can be delayed by GitHub schedule timing. The sync script creates required visible and metadata columns automatically; metadata columns can be hidden manually in Google Sheets.

Required repository secrets:

- `GH_PROJECT_TOKEN` - a PAT or GitHub App token that can read the user-owned Project v2 and related repository issue and pull request data.
- `GOOGLE_SERVICE_ACCOUNT_KEY` - the full Google service account JSON key.
- `SHEET_ID` - the target spreadsheet ID.

Optional repository variables:

- `SHEET_TAB_NAME` - overrides the default `Sprint Backlog Tracker` tab.
- `SYNC_DRY_RUN=true` - logs planned changes without writing to Google Sheets.

Google setup:

1. Enable the Google Sheets API for the Google Cloud project.
2. Create a service account and JSON key.
3. Store the full JSON key in `GOOGLE_SERVICE_ACCOUNT_KEY`.
4. Share the spreadsheet with the service account email.

Manual run:

```bash
pnpm --filter @repo/sheets-sync sync
```

## Project structure

- `apps/` — application code (frontend and backend)
- `packages/` — shared packages and configuration
- `docker/` — Docker-related files

## License

This project is available under the terms of the LICENSE file in the repository root.

---

For more details about running and developing within this monorepo, see the project docs and package READMEs.
