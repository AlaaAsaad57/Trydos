// Do the home page's product rows reach the browser as HTML?
//
// THE BUG THIS FILE EXISTS FOR
//
// The home view is partially prerendered: a shared static shell plus dynamic
// holes. Each product row sits in its own `<Suspense>` and the shell carries a
// 457px skeleton for it. Measured on a production build before the fix, the
// featured row's boundary resolved on the server with its header link and
// NOTHING else — no wrapper, no cards:
//
//     <div hidden id="S:0"><a href="/sy-en/featured">Featured Products</a></div>
//
// So the 457px skeleton was replaced by a 50px header, the section below it
// jumped 884px up, and the cards only appeared once React had hydrated and
// rendered them in the browser. The product data was in the document the whole
// time — as flight payload, never as HTML.
//
// The cause: nothing in that boundary asked for the request. React cannot
// prerender the cards, and with no request-time point to stop at, it gives up on
// server-rendering the boundary and leaves it to the browser. `connection()` is
// the point to stop at (see the Next guide on migrating to Cache Components,
// "Fix synchronous IO. It can't be deferred.").
//
// WHAT THIS FILE READS
//
// The source only. It walks the home view's imports and asks whether every row
// that can render a product card also asks for the request. It needs no server
// and always runs.
//
// This file used to hold a second half that asked a production server on port
// 3111 for the home document and read React's streaming markup in it. Those
// cases skipped on every run that had no such server, which was every run, so
// they were removed rather than kept as a green tick that saw nothing.
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

/** A path as this file prints it, whatever the operating system uses. */
const asPosix = (path: string): string => path.split(sep).join("/");

/** The view both the home page and /categories/{slug} render. */
const HOME_VIEW = "components/Home/CategoryHomeView.tsx";

/** The card. A row that can reach this module renders products. */
const PRODUCT_CARD = "components/products/ProductCard/index.tsx";

// The ways a component can say "wait for the request before rendering me".
// Each one is an async call React can stop a prerender at, which is what lets
// the rest of the row be rendered on the server at request time.
const REQUEST_ANCHORS = [
  { pattern: /await\s+connection\s*\(/, what: "await connection()" },
  { pattern: /await\s+getCookieServer\s*\(/, what: "await getCookieServer()" },
  { pattern: /await\s+cookies\s*\(/, what: "await cookies()" },
  { pattern: /await\s+headers\s*\(/, what: "await headers()" },
];

/** Take the comments out before looking at anything, so a call named in a
 *  comment is not read back as evidence that the call is there. */
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/.*$/gm, "$1");

// `existsSync` alone is not enough: it answers true for a directory, and a
// walker that trusts it hands a directory to `readFileSync` and dies with
// EISDIR. Ask whether it is a file.
const isFile = (candidate: string): boolean => {
  try {
    return existsSync(candidate) && statSync(candidate).isFile();
  } catch {
    return false;
  }
};

function resolveImport(specifier: string, fromFile: string): string | null {
  const bases = specifier.startsWith(".")
    ? [join(dirname(fromFile), specifier)]
    : [
        join(ROOT, specifier.replace(/^@\//, "")),
        join(ROOT, specifier), // the "*": ["./*"] mapping in tsconfig
      ];

  for (const base of bases) {
    for (const ext of ["", ...EXTENSIONS]) {
      if (isFile(base + ext)) return base + ext;
    }
    for (const ext of EXTENSIONS) {
      const candidate = join(base, "index" + ext);
      if (isFile(candidate)) return candidate;
    }
  }
  return null;
}

/** Every repo module this file imports, resolved to a path. */
function importsOf(file: string): string[] {
  const source = stripComments(readFileSync(file, "utf8"));
  const out: string[] = [];

  for (const match of source.matchAll(/from\s+["']([^"']+)["']/g)) {
    const specifier = match[1];
    if (specifier.startsWith("next/") || !/^[.@a-z]/i.test(specifier)) continue;
    const resolved = resolveImport(specifier, file);
    if (resolved && !resolved.includes("node_modules")) out.push(resolved);
  }
  return out;
}

/**
 * Can `entry` render `target`?
 *
 * Unlike the walk in noRuntimeReadsInCachedTree.ts this one does NOT stop at a
 * `use client` module. The card IS a client component, and a client component
 * still renders on the server — that server render is the whole subject here.
 */
function reaches(entry: string, target: string): boolean {
  const wanted = join(ROOT, target);
  const seen = new Set<string>();
  const queue = [join(ROOT, entry)];

  while (queue.length) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    if (file === wanted) return true;
    if (!isFile(file)) continue;
    queue.push(...importsOf(file));
  }
  return false;
}

const anchorIn = (source: string): string | null =>
  REQUEST_ANCHORS.find(({ pattern }) => pattern.test(stripComments(source)))
    ?.what ?? null;

/** The modules CategoryHomeView renders, each as a repo-relative path. */
const homeViewChildren = (): string[] =>
  importsOf(join(ROOT, HOME_VIEW)).map((file) =>
    asPosix(file.slice(ROOT.length + 1)),
  );

describe("the home view's product rows are rendered on the server", () => {
  it("asks for the request in every row that can render a product card", () => {
    const rows = homeViewChildren().filter((child) =>
      reaches(child, PRODUCT_CARD),
    );

    const unanchored = rows.filter(
      (row) => anchorIn(readFileSync(join(ROOT, row), "utf8")) === null,
    );

    expect(
      unanchored,
      `these home rows render product cards with nothing in them that asks for ` +
        `the request: ${unanchored.join(", ")}. React cannot prerender a product ` +
        `card, and with no request-time call to stop at it stops server-rendering ` +
        `the whole <Suspense> boundary and leaves it to the browser. The skeleton ` +
        `is then swapped for an almost empty section and the cards only appear ` +
        `after hydration, which moves everything below them. Add ` +
        `\`await connection()\` (from "next/server") before the row renders`,
    ).toEqual([]);
  });

  // The three self-checks below are what stop the case above passing for the
  // wrong reason.

  it("finds at least one row that renders product cards", () => {
    const rows = homeViewChildren().filter((child) =>
      reaches(child, PRODUCT_CARD),
    );

    expect(
      rows,
      `the walk found no home row that renders ${PRODUCT_CARD}, so the check ` +
        `above compared two empty lists and could never fail. Either the view ` +
        `moved (${HOME_VIEW}) or the card did`,
    ).not.toEqual([]);
  });

  it("does not report the skeleton as a row that renders product cards", () => {
    // The skeleton copies the card's own `data-pw` markers, so a check that
    // matched it would pass on a page that shows nothing but skeletons.
    const skeleton = "components/skeleton/loaders/FeaturedProductsSkeleton.tsx";

    expect(
      isFile(join(ROOT, skeleton)),
      `${skeleton} is gone, so this self-check no longer proves anything`,
    ).toBe(true);
    expect(
      reaches(skeleton, PRODUCT_CARD),
      `the walk says the featured skeleton renders product cards. It does not — ` +
        `it draws grey boxes — so the walk is matching far more than it should`,
    ).toBe(false);
  });

  it("does not accept a request-time call that is only written in a comment", () => {
    expect(
      anchorIn("// await connection() belongs here one day\nexport const a = 1;"),
      "a call named in a comment counted as a real one, so the check above " +
        "would pass for a row that only talks about asking for the request",
    ).toBeNull();
    expect(
      anchorIn("export async function Row() { await connection(); }"),
      "a real `await connection()` was not recognised, so the check above " +
        "would fail for a row that is already correct",
    ).toBe("await connection()");
  });
});
