import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const out = new URL("../out/", import.meta.url);

test("exports the archive and all twelve season annuals", async () => {
  const home = await readFile(new URL("index.html", out), "utf8");
  assert.match(home, /Every season/);
  assert.match(home, /The annuals/);
  assert.match(home, /The transaction lab/);
  assert.match(home, /\/AFFL_Wrapped\/wrapped\/2025/);
  assert.match(home, /\/AFFL_Wrapped\/transactions/);

  await Promise.all(
    Array.from({ length: 12 }, (_, index) =>
      access(new URL(`wrapped/${2014 + index}/index.html`, out)),
    ),
  );
});

test("uses repository-safe assets and preserves the season story", async () => {
  const annual = await readFile(new URL("wrapped/2025/index.html", out), "utf8");
  assert.match(annual, /2025 AFFL Wrapped/);
  assert.match(annual, /Power and luck/);
  assert.match(annual, /Matchup awards/);
  assert.match(annual, /Player impact/);
  assert.match(annual, /Moves with receipts/);
  assert.match(annual, /The decision room/);
  assert.match(annual, /Chaos theory/);
  assert.match(annual, /\/AFFL_Wrapped\/_next\//);
  await access(new URL(".nojekyll", out));
});

test("exports the full transaction explorer", async () => {
  const ledger = await readFile(new URL("transactions/index.html", out), "utf8");
  assert.match(ledger, /Every move/);
  assert.match(ledger, /The complete ledger/);
  assert.match(ledger, /xFP added/);
  assert.match(ledger, /Inferred moves/);
});
