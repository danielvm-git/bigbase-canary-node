// story: e01s01
// scenario: SC-e01s01-P0-01, SC-e01s01-P0-02
const assert = require("node:assert");
const test = require("node:test");
const http = require("node:http");
const { createApp } = require("./server");

test("GET / returns footer containing VERSION", async () => {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  const body = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });

  server.close();
  assert.ok(body.includes("0.1.0"), `expected footer to contain 0.1.0, got: ${body}`);
});

test("listenPort reads PORT env var, falls back to 8080", () => {
  const { listenPort } = require("./server");
  const original = process.env.PORT;

  process.env.PORT = "10004";
  assert.strictEqual(listenPort(), 10004);

  delete process.env.PORT;
  assert.strictEqual(listenPort(), 8080);

  if (original !== undefined) process.env.PORT = original;
});
