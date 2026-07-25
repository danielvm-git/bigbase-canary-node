// story: e01s01
"use strict";

const express = require("express");
const fs = require("fs");
const path = require("path");

function createApp() {
  const app = express();
  app.get("/", (_req, res) => {
    const version = fs.readFileSync(path.join(__dirname, "VERSION"), "utf8").trim();
    res.send(`<h1>bigbase canary (Node)</h1><footer>v${version}</footer>`);
  });
  return app;
}

// bigbase's deploy engine injects PORT and expects the process to bind to
// it directly — see components/deploy/node_pm.go's NodeStartCommand, which
// just runs `npm start`, nothing else tells the app what port to use.
function listenPort() {
  const port = process.env.PORT;
  return port ? parseInt(port, 10) : 8080;
}

if (require.main === module) {
  createApp().listen(listenPort());
}

module.exports = { createApp, listenPort };
