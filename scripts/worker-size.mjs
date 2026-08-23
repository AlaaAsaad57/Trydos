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
 * WHAT IS MEASURED, AND WHY IT IS NOT `worker.js`
 * `.open-next/worker.js` is a ~2 KB entry shim; the real code lives in
 * `.open-next/server-functions/**`. Measuring the shim reports a couple of
 * kilobytes and looks like a comfortable pass -- the worst possible answer.
 * So this asks wrangler to assemble the real deployable bundle
 * (`wrangler deploy --dry-run`) and reports the "Total Upload ... gzip" figure
 * it prints, which is the number Cloudflare itself enforces.
 *
 * Static assets under `.open-next/assets` are NOT part of that budget -- they
 * are uploaded separately and served from Cloudflare's edge -- so they are
 * reported for context only.
 *
 * Run `pnpm cf:build` first, then `pnpm cf:size`.
 *
 * Exits non-zero when the bundle is over the paid-plan limit, or when the size
 * could not be established at all. It never reports a pass it cannot prove.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const FREE_LIMIT = 3 * 1024 * 1024;
const PAID_LIMIT = 10 * 1024 * 1024;

const mib = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MiB`;

function treeSize(dir) {
  if (!existsSync(dir)) return 0;
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    total += entry.isDirectory() ? treeSize(path) : statSync(path).size;
  }
  return total;
}

function die(...lines) {
  for (const line of lines) console.error(line);
  process.exit(1);
}

if (!existsSync(".open-next/worker.js")) {
  die(
    "No Worker bundle at .open-next/worker.js.",
    "Run `pnpm cf:build` before `pnpm cf:size`.",
  );
}

// Let wrangler assemble exactly what it would upload. `--dry-run` talks to
// nothing and needs no credentials.
let output = "";
try {
  output = execFileSync(
    "pnpm",
    ["exec", "wrangler", "deploy", "--dry-run", "--outdir", ".open-next/.size"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], shell: true },
  );
} catch (error) {
  output = `${error.stdout ?? ""}${error.stderr ?? ""}`;
  if (!/Total Upload/i.test(output)) {
    die(
      "wrangler could not assemble the bundle, so its size is unknown.",
      "This is NOT a pass -- treat it as a failed measurement.",
      "",
      output.trim().split("\n").slice(-25).join("\n"),
    );
  }
}

// e.g. "Total Upload: 12345.67 KiB / gzip: 3456.78 KiB"
const match = output.match(
  /Total Upload:\s*([\d.]+)\s*(\w+)\s*\/\s*gzip:\s*([\d.]+)\s*(\w+)/i,
);
if (!match) {
  die(
    "wrangler ran but printed no 'Total Upload' line, so the size is unknown.",
    "This is NOT a pass -- the output format may have changed.",
    "",
    output.trim().split("\n").slice(-25).join("\n"),
  );
}

const unit = (value, name) =>
  Number(value) * (/^mib$/i.test(name) ? 1024 * 1024 : 1024);
const rawBytes = unit(match[1], match[2]);
const gzipBytes = unit(match[3], match[4]);

console.log("");
console.log("Cloudflare Worker size");
console.log("----------------------");
console.log(`  bundle (uncompressed) : ${mib(rawBytes)}`);
console.log(`  bundle (gzip)         : ${mib(gzipBytes)}   <-- this is what counts`);
console.log(
  `  static assets         : ${mib(treeSize(".open-next/assets"))} (not counted; served separately)`,
);
console.log("");
console.log(`  free plan limit       : ${mib(FREE_LIMIT)}`);
console.log(`  paid plan limit       : ${mib(PAID_LIMIT)}`);
console.log("");

if (gzipBytes > PAID_LIMIT) {
  die(
    `FAIL: the Worker is ${mib(gzipBytes - PAID_LIMIT)} over the paid-plan limit and cannot be deployed.`,
    "Analyze .open-next/server-functions/default/handler.mjs.meta.json with an esbuild bundle analyzer to find the weight.",
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
