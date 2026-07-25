# story: e01s01
# bigbase-canary-node — AI Agents

> **Multi-agent context** — This file is the canonical project context for **Cline**, **Aider**, **OpenCode**, and other AGENTS.md-native tools. Claude Code and Cursor read it via the `CLAUDE.md` symlink.

Read CONVENTIONS.md before any GitHub or git operation.

<!-- BEGIN bigpowers:context-routing -->
## Context Routing

| Glob / trigger | Load first |
|-----------------|------------|
| `specs/epics/**` | Capsule `epic.yaml` + active story `-tasks.yaml` |
| `specs/tech-architecture/**` | `tech-stack.md` |
| Default / session start | This file → `CONVENTIONS.md` → `specs/state.yaml` |
<!-- END bigpowers:context-routing -->

<!-- BEGIN bigpowers:learned-preferences -->
## Learned User Preferences

- (none yet — updated via `session-state`)

## Workspace Facts

- (none yet — durable facts discovered across sessions)
<!-- END bigpowers:learned-preferences -->

<!-- BEGIN bigpowers:project -->
## Project

A minimal Node HTTP canary site whose sole job is to be a regression signal proving that [big-release](https://github.com/danielvm-git/big-release) and the [bigbase-deploy](https://github.com/danielvm-git/.github) GitHub Action still work together end-to-end. Not a product — deliberately as small as possible.
Stack: Node 22, Express, no other dependencies.

## Commands

| Action | Command |
|--------|---------|
| Run | `npm start` |
| Test | `npm test` |
| Build | `npm run build --if-present` (no build step needed) |
| Lint | `npm run lint --if-present` |
| Preflight | `npm test` |
| CI | `gh pr checks` (when a PR is open) |

## Test

`npm test`

## Lint

N/A — no lint script configured (kept deliberately minimal)

## Build

N/A — plain CommonJS, no build step

## Architecture

`server.js`: one Express route reads the `VERSION` file at request time and renders it into an HTML footer. `server.test.js` covers it. No routing layer beyond the one route, no persistence.

## Observability

| What | Command |
|------|---------|
| Is the pipeline green? | `gh run list -R danielvm-git/bigbase-canary-node --limit 2` |
| Is the site live and on the expected version? | `curl -s https://node.bigbase.click` (footer shows the deployed `VERSION`) |
| Did the last deploy pass its health check? | Check the `Health check` step log in the `Deploy` workflow run — `✅ Site LIVE (HTTP 200)` or an `::error::` line |

No structured logging is wired in — the app has no logic worth logging beyond serving one static-ish response.

## Conventions

- Keep `server.js` a single minimal file — no premature route/module split.
- **Must read `process.env.PORT`, falling back to 8080 for local dev** — bigbase's deploy engine runs `npm start` and injects `PORT`; the app is entirely responsible for binding to it (confirmed the hard way on the Go canary, which shipped without this and failed every real deploy).
- `VERSION` file is the only source of the running version at runtime; the real, authoritative version lives in git tags cut by `big-release` — never hand-edit `CHANGELOG.md`.
- Conventional Commits on every commit; no `Co-Authored-By:` trailers (CI rejects them).

## Never

- Never dismiss reproducible gate failures as pre-existing or out of scope
- Never proceed on red Preflight or red CI — invoke quick-fix or fix-bug first
- Never push directly to `main` — every change starts with `kickoff-branch` and lands via `release-branch` (solo-git `land-branch.sh`)
- Never add real product features (auth, persistence, routing, UI) — this repo exists only to exercise the release→deploy pipeline

## Agent Rules

- **Workflow Mandate:** Use bigpowers skills (e.g. `plan-work`, `develop-tdd`) for structured work.
- **Always Green:** Preflight and CI must be green before forward work.
- Read specs/ and CONVENTIONS.md before writing code.
- Write the minimum code that solves the stated problem.
- Run tests after every change. Show evidence before declaring done.
- All planning output goes in specs/.
<!-- END bigpowers:project -->
