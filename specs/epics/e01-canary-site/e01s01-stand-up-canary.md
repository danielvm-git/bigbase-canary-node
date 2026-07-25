# e01s01 — Stand up the Node canary site end-to-end

## Story

As the bigbase platform maintainer, I want a minimal Node site deployed through the real
big-release + bigbase-deploy pipeline, so that any future change to either tool has an
immediate, low-noise regression signal.

## Acceptance criteria

1. `GET /` on the running app returns HTML containing the exact contents of `VERSION`.
2. `.github/workflows/test-build-release.yml` test job passes on a push to `main`.
3. The `release` job runs `big-release release --verbose` and produces a real git tag (`v0.1.0`) + `CHANGELOG.md` entry from Conventional Commits.
4. `.github/workflows/deploy.yml` fires via `workflow_run` and its `bigbase-deploy@v1` step returns HTTP 2xx.
5. The deploy job's health-check step logs `✅ Site LIVE`.
6. `curl https://node.bigbase.click` returns the footer with the deployed `VERSION` (content verified, not just HTTP status — see plan § Learnings on the now-fixed port-allocator bug).
7. `GET /api/sites/{id}` shows `status: "running"` and the correct `commit_sha`.
8. A second Conventional Commit produces `v0.1.1` and a fresh deploy.

## Out of scope

Anything in `specs/product/SCOPE_LATEST.yaml`'s `out_of_scope` list.
