# story: e01s02
# Adapt CI/CD to Centralized Template Repository Pattern (v4.1.0)

**type:** chore  
**risk:** P2  
**context:** infra  
**Context:** Adapt `bigbase-canary-node`'s CI/CD workflows to match the updated v4.1.0 centralized template pattern from `danielvm-git/.github` (Discussion #32). Ensures zero-duplication mental model compliance, explicit `deploy-meta.json` boundary schema (`{sha, ref, app_type}`), explicit `release_tool: "big-release"` configuration for canary testing, and post-deploy body-content health checks.

## Requirements

#### MODIFIED: Adapt `.github/workflows/test-build-release.yml` to v4.1.0 standard
**Before:** CI workflow (v3.0.1) hardcoded `big-release` without explicit `release_tool` parameter tag or v4.1.0 header annotations.  
**After:** Workflow matches v4.1.0 specification with `release_tool: "big-release"` parameter documentation, standard `deploy-meta.json` artifact export, and Conventional Commits / AI-attribution checks.

#### MODIFIED: Adapt `.github/workflows/deploy.yml` to v4.1.0 standard
**Before:** Deploy workflow (v3.0.1) only checked HTTP status code on health check without verifying response body content.  
**After:** Workflow matches v4.1.0 specification, using `SITE_URL` env variable, verifying `deploy-meta.json` payload, and asserting that the live response body contains the canary site's footer content (`bigbase canary (Node)`).

## Implementation Steps

1. Update `.github/workflows/test-build-release.yml` header and structure to v4.1.0 standard → verify: `grep -q "version: 4.1.0" .github/workflows/test-build-release.yml`
2. Update `.github/workflows/deploy.yml` to v4.1.0 standard with body content assertion → verify: `grep -q "bigbase canary (Node)" .github/workflows/deploy.yml`
3. Verify preflight baseline passes → verify: `bash scripts/preflight.sh`

## Verification Script (Step-by-Step)

1. Run `bash scripts/preflight.sh` to confirm unit tests pass.
2. Check workflow files in `.github/workflows/` for v4.1.0 version headers and `deploy-meta.json` boundary fields.
3. Validate that no `CHANGE-ME` placeholders remain in `.github/workflows/`.

## Out of scope

- Migration away from `big-release` (this canary site must retain `big-release` to test `big-release` + `bigbase-deploy` end-to-end).
- Adding complex application routes (the site remains a minimal HTTP canary).

## Risks

- Health check failure if `SITE_URL` or body expectation string mismatch (mitigated by setting `SITE_URL: "https://node.bigbase.click"` and matching `server.js` output).
