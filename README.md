# bigbase-canary-node

Minimal Node HTTP canary site proving that [big-release](https://github.com/danielvm-git/big-release) and the [bigbase-deploy](https://github.com/danielvm-git/.github) GitHub Action still work together end-to-end. Not a product — deliberately as small as possible.

## Stack

Node 22, Express, no other runtime dependencies.

## Quick start

```bash
npm install
npm start        # http://localhost:8080
npm test         # run tests
```

## How it works

`server.js` serves a single route that reads the `VERSION` file at request time and renders it into an HTML footer. The CI pipeline (`test-build-release.yml` + `deploy.yml`) builds, releases via big-release, and deploys to https://node.bigbase.click.

## License

[ISC](LICENSE)
