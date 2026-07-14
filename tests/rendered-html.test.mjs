import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the AFFL annual archive", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /AFFL History/);
  assert.match(html, /Every season/);
  assert.match(html, /The annuals/);
  assert.match(html, /2025[\s\S]{0,40}Wrapped/);
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview/);
});

test("server-renders a complete season annual", async () => {
  const response = await render("/wrapped/2025");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /2025 AFFL Wrapped/);
  assert.match(html, /San Diego Shadowc/);
  assert.match(html, /Power and luck/);
  assert.match(html, /Matchup awards/);
  assert.match(html, /Player impact/);
  assert.match(html, /Team roll call/);
});
