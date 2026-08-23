#!/usr/bin/env node
/**
 * Report the compressed size of the built Worker against Cloudflare's limits.
 *
 * A Cloudflare Worker may not exceed 3 MiB gzipped on the free plan or 10 MiB
 * on the paid plan, and OpenNext packs this entire app -- every page, every
 * route handler, every dependency -- into one Worker. That makes size a
 * pass/fail gate on whether this app can be deployed to Workers at all, and it
 * is the one thing no amount of code review can answer.
 *
 * Run `pnpm cf:build` first, then `pnpm cf:size`.
 *
 * Exit code is 1 when the bundle exceeds the paid-plan limit, so CI can gate on
 * it. Being over the free-plan limit is reported but not fatal.
 */
import { gzipSync } from "node:zlib";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const FREE_LIMIT = 3 * 1024 * 1024;
const PAID_LIMIT = 10 * 1024 * 1024;
const WORKER = ".open-next/worker.js";

function mib(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
}

/** Total on-disk size of a directory tree, for context only. */
function treeSize(dir) {
  if (!existsSync(dir)) return 0;
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    total += entry.isDirectory() ? treeSize(path) : statSync(path).size;
  }
  return total;
}

if (!existsSync(WORKER)) {
  console.error(
    `No Worker bundle at ${WORKER}. Run \`pnpm cf:build\` before \`pnpm cf:size\`.`,
  );
  process.exit(1);
}

const raw = readFileSync(WORKER);

// A failed build can leave the entry file behind at zero bytes. Measuring that
// reports "0.00 MiB — fits on every plan", which is the most dangerous thing
// this script could say: a green tick for a bundle that does not exist. Anything
// this small is a failed build, not a small app -- the smallest real Next.js
// Worker is megabytes.
const PLAUSIBLE_MINIMUM = 64 * 1024;
if (raw.length < PLAUSIBLE_MINIMUM) {
  console.error(
    `The bundle at ${WORKER} is ${raw.length} bytes, which is not a real build.`,
  );
  console.error(
    "`pnpm cf:build` failed and left an empty entry file behind. Read its output — the size below would be meaningless.",
  );
  process.exit(1);
}

const compressed = gzipSync(raw, { level: 9 }).length;

console.log("");
console.log("Cloudflare Worker size");
console.log("----------------------");
console.log(`  bundle (uncompressed) : ${mib(raw.length)}`);
console.log(`  bundle (gzip)         : ${mib(compressed)}   <-- this is what counts`);
console.log(`  static assets         : ${mib(treeSize(".open-next/assets"))} (not counted; served separately)`);
console.log("");
console.log(`  free plan limit       : ${mib(FREE_LIMIT)}`);
console.log(`  paid plan limit       : ${mib(PAID_LIMIT)}`);
console.log("");

if (compressed > PAID_LIMIT) {
  const over = compressed - PAID_LIMIT;
  console.error(
    `FAIL: the Worker is ${mib(over)} over the paid-plan limit and cannot be deployed.`,
  );
  console.error(
    "Analyze .open-next/server-functions/default/handler.mjs.meta.json with an esbuild bundle analyzer to find the weight.",
  );
  process.exit(1);
}

if (compressed > FREE_LIMIT) {
  console.log(
    `OK on the paid plan (${mib(PAID_LIMIT - compressed)} of headroom). Too large for the free plan.`,
  );
} else {
  console.log(`OK on both plans (${mib(FREE_LIMIT - compressed)} of headroom on free).`);
}
