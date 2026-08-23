#!/usr/bin/env node
/**
 * Report the compressed size of the built Worker against Cloudflare's limits.
 *
 * A Cloudflare Worker may not exceed 3 MiB gzipped on the free plan or 10 MiB on
 * the paid plan, and OpenNext packs this entire app -- every page, every route
 * handler, every dependency -- into one Worker. That makes size a pass/fail gate
 * on whether this app can be deployed to Workers at all, and it is the one thing
 * no amount of code review can answer.
 *
 * WHAT IS MEASURED, AND WHY IT IS NOT `worker.js` ALONE
 * `.open-next/worker.js` is a ~2 KB entry shim; the real code lives under
 * `.open-next/server-functions/**`. Measuring the shim reports a couple of
 * kilobytes and reads as a comfortable pass -- the worst answer a size gate can
 * give. So this sums every executable module the Worker is built from.
 *
 * This is an UPPER BOUND: it counts every module present, while wrangler ships
 * only what is reachable. Erring high is the safe direction for a limit check --
 * it can warn about a bundle that would have squeezed in, but it cannot tell you
 * a bundle fits when it does not.
 *
 * It deliberately does NOT shell out to `wrangler deploy --dry-run`. That reads
 * the full wrangler config, and this repo intentionally ships an empty D1
 * `database_id` so a real deploy fails loudly -- which makes wrangler prompt,
 * and a prompt with no stdin hangs the job. Measuring from disk needs no
 * config, no credentials and no network.
 *
 * Static assets under `.open-next/assets` are NOT part of the budget -- they are
 * uploaded separately and served from the edge -- so they are context only.
 *
 * Run `pnpm cf:build` first, then `pnpm cf:size`.
 *
 * Exits non-zero when the bundle is over the paid-plan limit, or when the size
 * cannot be established. It never reports a pass it cannot prove.
 */
import { gzipSync } from "node:zlib";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const FREE_LIMIT = 3 * 1024 * 1024;
const PAID_LIMIT = 10 * 1024 * 1024;
const WORKER = ".open-next/worker.js";
const FUNCTIONS = ".open-next/server-functions";

// What Cloudflare counts as Worker code.
const CODE = new Set([".js", ".mjs", ".cjs", ".wasm"]);

const mib = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MiB`;

function die(...lines) {
  for (const line of lines) console.error(line);
  process.exit(1);
}

/** Every file under `dir` matching `keep`, as [path, size] pairs. */
function walk(dir, keep, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, keep, out);
    else if (keep(path)) out.push([path, statSync(path).size]);
  }
  return out;
}

function treeSize(dir) {
  return walk(dir, () => true).reduce((total, [, size]) => total + size, 0);
}

if (!existsSync(WORKER)) {
  die(
    `No Worker bundle at ${WORKER}.`,
    "Run `pnpm cf:build` before `pnpm cf:size`.",
  );
}

const modules = [
  [WORKER, statSync(WORKER).size],
  ...walk(FUNCTIONS, (p) => CODE.has(extname(p))),
];

// A finished build has hundreds of modules. A handful means the build died
// partway and left the entry shim behind -- reporting its size as a pass is
// exactly the false green this script exists to prevent.
if (modules.length < 5) {
  die(
    `Only ${modules.length} module(s) found under ${FUNCTIONS}, which is not a finished build.`,
    "`pnpm cf:build` did not complete. Read its output — any size here would be meaningless.",
  );
}

let rawBytes = 0;
let gzipBytes = 0;
const perModule = [];
for (const [path, size] of modules) {
  const compressed = gzipSync(readFileSync(path), { level: 9 }).length;
  rawBytes += size;
  gzipBytes += compressed;
  perModule.push([path, compressed]);
}

console.log("");
console.log("Cloudflare Worker size");
console.log("----------------------");
console.log(`  modules counted       : ${modules.length}`);
console.log(`  bundle (uncompressed) : ${mib(rawBytes)}`);
console.log(`  bundle (gzip)         : ${mib(gzipBytes)}   <-- this is what counts`);
console.log(
  `  static assets         : ${mib(treeSize(".open-next/assets"))} (not counted; served separately)`,
);
console.log("");
console.log(`  free plan limit       : ${mib(FREE_LIMIT)}`);
console.log(`  paid plan limit       : ${mib(PAID_LIMIT)}`);
console.log("");

console.log("  ten heaviest modules (gzip):");
for (const [path, size] of perModule.sort((a, b) => b[1] - a[1]).slice(0, 10)) {
  console.log(`    ${mib(size).padStart(9)}  ${path}`);
}
console.log("");

if (gzipBytes > PAID_LIMIT) {
  die(
    `FAIL: the Worker is ${mib(gzipBytes - PAID_LIMIT)} over the paid-plan limit and cannot be deployed.`,
    "The heaviest modules are listed above; the esbuild metafile in the run artifact has the full breakdown.",
  );
}

if (gzipBytes > FREE_LIMIT) {
  console.log(
    `OK on the paid plan (${mib(PAID_LIMIT - gzipBytes)} of headroom). Too large for the free plan.`,
  );
} else {
  console.log(
    `OK on both plans (${mib(FREE_LIMIT - gzipBytes)} of headroom on free).`,
  );
}
console.log("");
console.log(
  "Note: an upper bound — every module on disk is counted, while wrangler ships only what is reachable.",
);
