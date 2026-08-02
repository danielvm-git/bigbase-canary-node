// story: e01s01
// scenario: SC-e01s01-P0-01, SC-e01s01-P0-02, SC-e01s01-P2-01
const assert = require("node:assert");
const test = require("node:test");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { createApp } = require("./server");

function getBody(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    }).on("error", reject);
  });
}

test("GET / returns 200 with body containing VERSION", async () => {
  const expectedVersion = fs.readFileSync(path.join(__dirname, "VERSION"), "utf8").trim();
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  const { status, body } = await getBody(`http://127.0.0.1:${port}/`);

  server.close();
  assert.strictEqual(status, 200);
  assert.ok(body.includes(expectedVersion), `expected version in body, got: ${body.slice(0, 200)}`);
});

test("GET / returns 500 when VERSION file is missing", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "canary-test-"));
  const app = createApp({ versionPath: path.join(tmpDir, "VERSION") });
  const server = app.listen(0);
  const { port } = server.address();

  const { status } = await getBody(`http://127.0.0.1:${port}/`);

  server.close();
  fs.rmSync(tmpDir, { recursive: true });
  assert.strictEqual(status, 500);
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

test("listenPort falls back to 8080 for malformed PORT", () => {
  const { listenPort } = require("./server");
  const original = process.env.PORT;

  process.env.PORT = "abc";
  assert.strictEqual(listenPort(), 8080);

  process.env.PORT = "";
  assert.strictEqual(listenPort(), 8080);

  process.env.PORT = "-1";
  assert.strictEqual(listenPort(), 8080);

  if (original !== undefined) process.env.PORT = original;
});

test("GET / body contains no raw {{VERSION}} placeholder", async () => {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  const { status, body } = await getBody(`http://127.0.0.1:${port}/`);

  server.close();
  assert.strictEqual(status, 200);
  assert.ok(!body.includes("{{VERSION}}"), `raw placeholder found in body`);
});
