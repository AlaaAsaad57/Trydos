// Naming and bookkeeping shared by the two collectors.
//
// One rule sits behind all of it: **a summary is never edited and never
// overwritten**. The skill may run several times in one day, and each run leaves
// its own file. So the day's second run is `-2`, the third `-3`, and the run
// before this one is simply the newest file on disk — today's runs included.

import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const SUMMARY_DIR = join(process.cwd(), "docs", "testing", "summaries");

/** Today, as YYYY-MM-DD. */
export const today = () => new Date().toISOString().slice(0, 10);

/**
 * Every summary of one kind, oldest first.
 *
 * `run` is 1 for the day's first file (no suffix), 2 for `-2`, and so on. The
 * sort is on (date, run) rather than the file name, because a plain string sort
 * puts `…-19-2.md` *before* `…-19.md` and would pick the wrong previous run.
 */
export function listSummaries(prefix) {
  if (!existsSync(SUMMARY_DIR)) return [];
  const re = new RegExp("^" + prefix + "-(\\d{4}-\\d{2}-\\d{2})(?:-(\\d+))?\\.md$");
  return readdirSync(SUMMARY_DIR)
    .map((name) => {
      const m = re.exec(name);
      return m ? { name, date: m[1], run: m[2] ? Number(m[2]) : 1 } : null;
    })
    .filter(Boolean)
    .sort((a, b) => (a.date === b.date ? a.run - b.run : a.date < b.date ? -1 : 1));
}

/** The newest summary of one kind, today's own runs included, or null. */
export function latestSummary(prefix) {
  const all = listSummaries(prefix);
  if (all.length === 0) return null;
  const f = all[all.length - 1];
  const path = join(SUMMARY_DIR, f.name);
  return { ...f, path, body: readFileSync(path, "utf8") };
}

/** The name this run must write. Never one that already exists. */
export function nextSummaryName(prefix, date = today()) {
  const runs = listSummaries(prefix)
    .filter((f) => f.date === date)
    .map((f) => f.run);
  const run = runs.length ? Math.max(...runs) + 1 : 1;
  return run === 1 ? `${prefix}-${date}.md` : `${prefix}-${date}-${run}.md`;
}

/** The hidden id list a previous summary carries, or null when it has none. */
export function readIndex(body, marker) {
  const start = body.indexOf(marker);
  if (start === -1) return null;
  const end = body.indexOf("-->", start);
  return new Set(
    body
      .slice(start + marker.length, end === -1 ? undefined : end)
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
  );
}
