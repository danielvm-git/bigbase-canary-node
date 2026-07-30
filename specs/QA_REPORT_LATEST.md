# QA Audit Report — bigbase-canary-node

**Date:** 2026-07-30
**Auditor:** MiMo Code Agent
**Repo:** bigbase-canary-node (68 LOC)

---

## Run Config

- **`<N>` (ceiling):** 15 — repo <5k LOC
- **`<FROZEN>`:** Entire codebase — `server.js`, `server.test.js`, `.github/workflows/*`, `scripts/*`, `package.json`, `VERSION`. Source: AGENTS.md "Never" rules ("never add real product features", "keep server.js a single minimal file") + CONVENTIONS.md defensive code section ("None apply"). Boundary contract: the canary must read `process.env.PORT`, read `VERSION` at request time, and serve `<footer>v{version}</footer>`.
- **Hotspots:** `.github/workflows/test-build-release.yml` (4 touches), `VERSION` (3 touches), `.github/workflows/deploy.yml` (2 touches)
- **Open bugs (floor):** 0 — no open issues at audit start, registry empty, all CI green
- **Closed issues:** #1 (VERSION stale, resolved 2026-07-30)
- **Preflight:** PASS (2/2 tests, 198ms)
- **CI:** All green (latest deploy success 2026-07-30T12:03:31Z)
- **Live site:** https://node.bigbase.click — HTTP 200, footer v0.1.2

### Per-Module Risk Levels

| Module | Risk | Rationale |
|--------|------|-----------|
| `server.js` | P2 | Single route, VERSION file read, port binding — crash risk if VERSION missing |
| `server.test.js` | P2 | Only 2 tests, no edge-case coverage |
| `.github/workflows/test-build-release.yml` | P1 | Release pipeline, highest churn (4 touches), drives versioning |
| `.github/workflows/deploy.yml` | P1 | Production deploy, health check logic |
| `scripts/preflight.sh` | P2 | Gate script, runs on every commit |
| `scripts/land-branch.sh` | P3 | Solo-git landing, low frequency |
| `package.json` | P2 | Dependency declarations, script definitions |
| `VERSION` | P1 | Runtime version source, 3 historical touches |

### Seeded Issues

- #1 (closed) — VERSION file stale at runtime. Seeded from GitHub. Cross-linked to BUG-2026-07-30T090000.

---

## Audit Findings

### BUG-2026-07-30T160000: server.js crashes if VERSION file is missing or unreadable

**Severity:** critical | **Priority:** p0 | **Scope:** server/runtime
**Status:** open

**What happened:** `fs.readFileSync(path.join(__dirname, "VERSION"), "utf8")` in the request handler throws an unhandled exception if the VERSION file is deleted, empty after a failed CI write, or unreadable. Every `GET /` then crashes the process.

**What I expected:** The canary should return a 500 error gracefully or serve a fallback, not crash the entire process. A canary that crashes is a false negative — it looks like a deploy failure when the real problem is a missing file.

**Steps to reproduce:**
1. `rm VERSION`
2. `npm start`
3. `curl http://localhost:8080/`
4. Process crashes with `ENOENT: no such file or directory`

**Root cause:** No error handling around `fs.readFileSync` in the request handler.

**Risk level:** high — the canary's entire purpose is being a regression signal; a crash defeats that.

---

### BUG-2026-07-30T160001: listenPort crashes on malformed PORT env var

**Severity:** high | **Priority:** p1 | **Scope:** server/runtime
**Status:** open

**What happened:** `parseInt(process.env.PORT, 10)` returns `NaN` for non-numeric strings. Express throws `RangeError: "port" argument must be >= 0 and < 65536` when calling `.listen(NaN)`, crashing the process on startup.

**What I expected:** Invalid PORT values should fall back to 8080, matching the documented behavior ("falling back to 8080 for local dev").

**Steps to reproduce:**
1. `PORT=abc npm start`
2. Process crashes with `RangeError`

**Root cause:** No validation after `parseInt`. NaN and negative values are not caught.

**Risk level:** high — deploy engine injects PORT; a malformed value kills the canary before it can serve anything.

---

### BUG-2026-07-30T160002: CI release job race condition with cancel-in-progress

**Severity:** medium | **Priority:** p2 | **Scope:** ci/workflows
**Status:** open

**What happened:** The `test-build-release.yml` workflow uses `cancel-in-progress: true` for the entire pipeline, including the release job. If two commits land on main in quick succession, the second run cancels the first mid-release, potentially leaving a git tag without a corresponding VERSION commit, or corrupting the push.

**What I expected:** The release job should complete uninterrupted once started. Test/build jobs can be cancelled safely.

**Steps to reproduce:**
1. Push commit A to main
2. Immediately push commit B to main
3. Run A's release job gets cancelled mid-execution by Run B

**Root cause:** Single concurrency group covers all jobs including release.

**Risk level:** medium — low frequency on a canary repo, but a real data-corruption risk.

---

### BUG-2026-07-30T160003: Test suite lacks error-path and assertion rigor

**Severity:** medium | **Priority:** p2 | **Scope:** tests
**Status:** open

**What happened:** `server.test.js` has 2 tests covering happy paths only. Missing: HTTP status code assertion, VERSION-missing error path, malformed PORT edge cases, structural HTML assertion. Test 1 uses `body.includes(version)` which would pass on a 500 error page containing the version string.

**What I expected:** A canary whose purpose is proving the deploy pipeline works should have tests that catch regressions in error handling, not just happy-path behavior.

**Steps to reproduce:**
1. Delete VERSION file
2. Run `npm test`
3. Tests pass (they don't test the error path)

**Root cause:** Tests written for the initial feature; edge-case coverage not added.

**Risk level:** medium — false-positive test results undermine the canary's reliability signal.

---

## Verification Evidence

### Preflight (pre-audit)
```
> bigbase-canary-node@0.1.0 test
> node --test server.test.js

✔ GET / returns footer containing VERSION (15.169166ms)
✔ listenPort reads PORT env var, falls back to 8080 (0.17975ms)
ℹ tests 2, pass 2, fail 0, duration 198ms
```

### Live site (pre-audit)
```
$ curl -s https://node.bigbase.click
<script>window.__BIGBASE_METADATA__ = {"deployedAt":"2026-07-30T12:03:40Z","version":"6d1a28e..."}</script>
<h1>bigbase canary (Node)</h1><footer>v0.1.2</footer>
```

### CI status (pre-audit)
All green. Latest deploy: success at 2026-07-30T12:03:31Z.

---

## Fix Plan

| Bug | Branch | Fix Strategy | TDD? |
|-----|--------|-------------|------|
| BUG-2026-07-30T160000 | fix/version-read-error-handling | Wrap readFileSync in try/catch, return 500 on error | Yes |
| BUG-2026-07-30T160001 | fix/port-parsing-validation | Validate parseInt result, fallback to 8080 | Yes |
| BUG-2026-07-30T160002 | fix/ci-release-concurrency | Split concurrency group for release job | No (config) |
| BUG-2026-07-30T160003 | (addressed by fix/ branches above) | Tests added alongside each fix | Yes |
