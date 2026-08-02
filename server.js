// story: e01s01
"use strict";

const express = require("express");
const fs = require("fs");
const path = require("path");

function createApp(opts) {
  const versionPath = (opts && opts.versionPath) || path.join(__dirname, "VERSION");
  const htmlPath = (opts && opts.htmlPath) || path.join(__dirname, "index.html");

  // Cache the HTML template at startup — it's a static file that only changes
  // on deploy, so reading it once avoids a file-system hit on every request.
  const htmlTemplate = fs.readFileSync(htmlPath, "utf8");

  const app = express();
  app.get("/", (_req, res) => {
    try {
      const version = fs.readFileSync(versionPath, "utf8").trim();
      const body = htmlTemplate.split("{{VERSION}}").join(version);
      res.send(body);
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
