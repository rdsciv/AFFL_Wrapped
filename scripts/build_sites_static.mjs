#!/usr/bin/env node

import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(projectRoot, "out");
const distDir = path.join(projectRoot, "dist");
const clientDir = path.join(distDir, "client");
const serverDir = path.join(distDir, "server");

await rm(distDir, { recursive: true, force: true });
await mkdir(serverDir, { recursive: true });
await cp(outputDir, clientDir, { recursive: true });

await writeFile(
  path.join(serverDir, "index.js"),
  `export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
`,
  "utf8",
);

await writeFile(
  path.join(serverDir, "wrangler.json"),
  JSON.stringify({
    name: "affl-wrapped-sites",
    main: "index.js",
    compatibility_date: "2026-05-15",
    compatibility_flags: ["nodejs_compat"],
    assets: {
      directory: "../client",
      binding: "ASSETS",
      html_handling: "auto-trailing-slash",
    },
  }),
  "utf8",
);

console.log(`Prepared static Sites bundle in ${distDir}`);
