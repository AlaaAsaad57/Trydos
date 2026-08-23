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
 * IT MUST NOT DOUBLE-COUNT. esbuild bundles most of the app INTO
 * `handler.mjs` -- 452 of the `.next/server/chunks/**` files in one measured
 * build were already inlined there. Counting those again alongside the bundle
 * they are part of inflated a 9 MiB Worker to 21 MiB and turned a pass into a
 * fail. So every `*.meta.json` esbuild leaves behind is read first, and anything
 * listed as an input to a bundle is excluded from the count.
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

/**
 * Every source file esbuild already inlined into a bundle.
 *
 * esbuild writes a `<output>.meta.json` beside each bundle listing its inputs.
 * Those inputs still sit on disk, but they ship as part of the bundle, not
 * beside it -- counting both is counting the same bytes twice.
 */
function bundledInputs() {
  const inputs = new Set();
  for (const [metaPath] of walk(".open-next", (p) => p.endsWith(".meta.json"))) {
    let meta;
    try {
      meta = JSON.parse(readFileSync(metaPath, "utf8"));
    } catch {
      continue;
    }
    for (const output of Object.values(meta.outputs ?? {})) {
      for (const input of Object.keys(output.inputs ?? {})) {
        inputs.add(input.replaceAll("\\", "/"));
      }
    }
  }
  return inputs;
}

const inlined = bundledInputs();
const normalize = (p) => p.replaceAll("\\", "/");

const modules = [
  [WORKER, statSync(WORKER).size],
  ...walk(FUNCTIONS, (p) => CODE.has(extname(p)) && !inlined.has(normalize(p))),
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
console.log(`  modules shipped       : ${modules.length}`);
console.log(`  inlined into a bundle : ${inlined.size} (excluded — they ship inside it)`);
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
  "Note: close to what wrangler uploads, but not identical — it ships only what is reachable.",
);
