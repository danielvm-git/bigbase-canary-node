// story: e01s01
"use strict";

const express = require("express");
const fs = require("fs");
const path = require("path");

function createApp(opts) {
  const versionPath = (opts && opts.versionPath) || path.join(__dirname, "VERSION");
  const app = express();
  app.get("/", (_req, res) => {
    try {
      const version = fs.readFileSync(versionPath, "utf8").trim();
      res.send(`<h1>bigbase canary (Node)</h1><footer>v${version}</footer>`);
    } catch {
      res.status(500).send("VERSION file unreadable");
    }
  });
  return app;
}

// bigbase's deploy engine injects PORT and expects the process to bind to
// it directly — see components/deploy/node_pm.go's NodeStartCommand, which
// just runs `npm start`, nothing else tells the app what port to use.
function listenPort() {
  const port = process.env.PORT;
  if (!port) return 8080;
  const parsed = parseInt(port, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 8080;
}

if (require.main === module) {
  createApp().listen(listenPort());
}

module.exports = { createApp, listenPort };
