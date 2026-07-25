# Tech Stack — bigbase-canary-node

- **Language/runtime:** Node 22, Express, no other dependencies.
- **Layout:** `server.js` — one route, reads `VERSION`, writes an HTML footer. `server.test.js`.
- **CI:** GitHub Actions, `.github/workflows/test-build-release.yml` + `.github/workflows/deploy.yml`, copied from `danielvm-git/.github`'s `test-build-release-node.yml`/`deploy-node.yml` templates.
- **Release:** [big-release](https://github.com/danielvm-git/big-release), replacing the template's default `semantic-release` step.
- **Deploy:** `danielvm-git/.github/actions/bigbase-deploy@v1` → bigbase site `node` → `https://node.bigbase.click`, `app_type: node`.
- **Critical:** server must read `process.env.PORT` — bigbase's deploy engine runs `npm start` and injects `PORT`, nothing else tells the app what port to bind.
