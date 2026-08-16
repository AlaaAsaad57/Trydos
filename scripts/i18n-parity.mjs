/**
 * i18n parity check (Problem C)
 * -----------------------------
 * The three translation files must stay key-parallel: every key present in one
 * of public/translations/translations.{ar,tr,ku}.js must exist in the other two
 * (CLAUDE.md). This catches drift that the ESLint rule can't — a key added to
 * `ar` but forgotten in `tr`/`ku` even if it is not yet used in code.
 *
 * Optionally (--unused) it also lists keys that exist in the files but are never
 * referenced via translateFunction("…") / t("…") in the source tree.
 *
 * Usage:
 *   node scripts/i18n-parity.mjs            # parity only (CI gate)
 *   node scripts/i18n-parity.mjs --unused   # + report unused keys (advisory)
 *
 * Exit code 1 when parity gaps exist, 0 otherwise.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TRANSLATIONS_DIR = path.join(ROOT, "public", "translations");
const LANGS = ["ar", "tr", "ku"];
const CALLEES = ["translateFunction", "t"];

function loadDict(lang) {
  const file = path.join(TRANSLATIONS_DIR, `translations.${lang}.js`);
  const code = readFileSync(file, "utf8");
  const body = code
    .replace(/export\s+default\s+translations\s*;?\s*$/m, "")
    .replace(/^\s*const\s+translations\s*=\s*/m, "return ");
  // eslint-disable-next-line no-new-func
  return new Function(body)();
}

const dicts = Object.fromEntries(LANGS.map((l) => [l, loadDict(l)]));
const keySets = Object.fromEntries(
  LANGS.map((l) => [l, new Set(Object.keys(dicts[l]))]),
);
const allKeys = new Set(LANGS.flatMap((l) => Object.keys(dicts[l])));

// ---- Parity: every key must be in all three files ----
let gaps = 0;
for (const key of allKeys) {
  const missing = LANGS.filter((l) => !keySets[l].has(key));
  if (missing.length) {
    gaps++;
    console.log(`  MISSING in [${missing.join(", ")}]  "${key}"`);
  }
}

if (gaps === 0) {
  console.log(`✓ i18n parity OK — ${allKeys.size} keys present in all three files.`);
} else {
  console.log(`\n✗ ${gaps} key(s) are not present in all three translation files.`);
}

// ---- Optional: unused keys (advisory, not a gate) ----
if (process.argv.includes("--unused")) {
  const SOURCE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);
  const IGNORE_DIRS = new Set([
    "node_modules",
    ".next",
    ".git",
    "out",
    "build",
    "public",
    "scripts",
    "eslint-rules",
    "docs",
    "_specs",
  ]);
  const usedKeys = new Set();
  const callRe = new RegExp(
    `(?:${CALLEES.join("|")})\\(\\s*(["'\\\`])((?:\\\\.|(?!\\1).)*)\\1`,
    "g",
  );

  function walk(dir) {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      const rel = path.relative(ROOT, full);
      if (statSync(full).isDirectory()) {
        if (!IGNORE_DIRS.has(entry)) walk(full);
      } else if (SOURCE_EXT.has(path.extname(entry)) && !rel.includes("translations.")) {
        const text = readFileSync(full, "utf8");
        let m;
        while ((m = callRe.exec(text)) !== null) usedKeys.add(m[2]);
      }
    }
  }
  walk(ROOT);

  const unused = [...allKeys].filter((k) => !usedKeys.has(k));
  console.log(
    `\nℹ ${unused.length} key(s) defined but not referenced via a string-literal ${CALLEES.join("/")}() call (advisory — dynamic keys can't be detected):`,
  );
  for (const k of unused.slice(0, 200)) console.log(`  unused?  "${k}"`);
  if (unused.length > 200) console.log(`  … and ${unused.length - 200} more`);
}

process.exit(gaps === 0 ? 0 : 1);
