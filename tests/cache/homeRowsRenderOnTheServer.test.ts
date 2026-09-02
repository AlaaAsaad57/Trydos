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
// HOW TO RUN THE SERVER CASE
//
//   pnpm build && pnpm start -p 3111
//   pnpm test:run -- tests/cache/homeRowsRenderOnTheServer.test.ts
//
// With no server on that port that case skips with a message naming those two
// commands. It skips rather than fails because this file sits in the unit suite,
// which CI runs on every pull request with no server up. The source check above
// it needs no server and always runs.
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";

import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { http, passthrough } from "msw";

import { server } from "../msw/server";

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

// The same thing again, but asked of a running server. The check above reads the
// source; this one reads what the browser is actually sent.
const BASE = process.env.CACHE_CHECK_BASE ?? "http://localhost:3111";
const PATH = "/sy-en";

const NO_SERVER =
  `no server answered at ${BASE}${PATH}. Run \`pnpm build && pnpm start -p 3111\` ` +
  `first — this check cannot run against \`next dev\`, which does not prerender ` +
  `a shell and so cannot show this fault at all`;

let serverIsUp = false;
let html = "";

beforeEach(() => {
  // The unit suite runs behind msw with `onUnhandledRequest: "error"`, so a real
  // request would be refused before it left the process. Registered per test
  // because tests/setup.ts resets the handlers after each one.
  server.use(http.all(`${BASE}/*`, () => passthrough()));
});

beforeAll(async () => {
  server.use(http.all(`${BASE}/*`, () => passthrough()));
  try {
    const response = await fetch(`${BASE}${PATH}`, {
      signal: AbortSignal.timeout(90_000),
    });
    serverIsUp = response.ok;
    html = await response.text();
  } catch {
    serverIsUp = false;
  }
}, 200_000);

/** How many times a literal appears. Written out rather than using a regular
 *  expression so the attribute's quotes are matched exactly: the HTML form is
 *  `data-pw="product-name"`, while the same value inside the streaming payload
 *  is `\"data-pw\":\"product-name\"`. Only the first is markup the browser
 *  paints, and only the first is counted here. */
const occurrences = (haystack: string, needle: string): number => {
  let count = 0;
  let at = -1;
  while ((at = haystack.indexOf(needle, at + 1)) !== -1) count++;
  return count;
};

const ROW_SKELETON = 'data-pw="featured-products-container"';
const A_CARD = 'data-pw="product-name"';

/**
 * Product rows that showed a skeleton and were then replaced by nothing.
 *
 * React writes a pending boundary as `<!--$?--><template id="B:n"></template>`
 * followed by its fallback, and later `<div hidden id="S:m">…</div>` plus a
 * `$RC("B:n","S:m")` call that swaps the one for the other. So a skeleton that
 * is replaced by nothing is a boundary whose fallback draws a product row and
 * whose content carries no card.
 *
 * ONLY THE ROWS ABOVE THE BOUTIQUES SECTION are looked at, and that is the
 * point rather than a shortcut. Those two — featured and flash deals — read
 * data that is cached, so the shell can ask in advance whether they will have
 * anything in them. The recommendations row below the boutiques reads the
 * shopper's own cookie, so no shell shared by every visitor can know its answer;
 * it is a different problem and is not claimed to be covered here.
 */
function unfilledProductRows(document: string): string[] {
  const boutiques = document.indexOf('data-pw="boutiques"');
  const limit = boutiques === -1 ? document.length : boutiques;
  const unfilled: string[] = [];

  for (const match of document.matchAll(/<template id="(B:[0-9a-f]+)">/g)) {
    const at = match.index ?? 0;
    if (at > limit) continue;

    const closed = document.indexOf("<!--/$-->", at);
    const fallback = document.slice(at, closed === -1 ? at : closed);
    if (!fallback.includes(ROW_SKELETON)) continue;

    const swap = document.match(
      new RegExp(`\\$RC\\("${match[1]}","(S:[0-9a-f]+)"\\)`),
    );
    if (!swap) {
      unfilled.push(`${match[1]} (never resolved on the server)`);
      continue;
    }

    const opens = document.indexOf(`<div hidden id="${swap[1]}">`);
    const ends = document.indexOf("<script>$RC(", opens);
    const content = opens === -1 ? "" : document.slice(opens, ends);

    if (!content.includes(A_CARD)) {
      unfilled.push(`${match[1]} (replaced by ${content.length} bytes, no card)`);
    }
  }
  return unfilled;
}

describe("the home document the server sends", () => {
  // The control for the last case in this file. It reads React's streaming
  // markup, so it has to be shown a document where the answer is known: one row
  // that is filled with a card and one that is replaced by nothing.
  it("can tell a filled product row from an empty one", () => {
    const filled =
      `<!--$?--><template id="B:0"></template><div ${ROW_SKELETON}></div><!--/$-->`;
    const emptied =
      `<!--$?--><template id="B:4"></template><div ${ROW_SKELETON}></div><!--/$-->`;
    const swaps =
      `<div hidden id="S:0"><span ${A_CARD}>Solara</span></div>` +
      `<script>$RC("B:0","S:0")</script>` +
      `<div hidden id="S:4"></div><script>$RC("B:4","S:4")</script>` +
      `<div data-pw="boutiques"></div>`;

    const found = unfilledProductRows(filled + emptied + swaps);

    expect(
      found.join(", "),
      "the reader did not report the row that was replaced by nothing, so the " +
        "check below would pass on a page where a skeleton collapses",
    ).toContain("B:4");
    expect(
      found.join(", "),
      "the reader reported the row that WAS filled with a card, so the check " +
        "below would fail on a page that is already correct",
    ).not.toContain("B:0");
  });

  it("is the home page, with a featured row on it", (ctx) => {
    if (!serverIsUp) return ctx.skip(NO_SERVER);

    // The positive control. Without it, a 404 body or a redirect page would make
    // every check below vacuous.
    expect(
      occurrences(html, 'data-pw="featured-products-container"'),
      `the document from ${BASE}${PATH} has no featured row at all ` +
        `(${html.length} bytes), so the checks below have nothing to look at`,
    ).toBeGreaterThan(0);
  });

  it("resolved the featured row on the server", (ctx) => {
    if (!serverIsUp) return ctx.skip(NO_SERVER);

    // The row's real header carries the translated words; the skeleton draws a
    // grey box there instead. Seeing the words means the boundary resolved on
    // the server rather than timing out or erroring.
    expect(
      html.includes(">Featured Products<"),
      "the featured row's own header is not in the document, so the boundary " +
        "never resolved on the server and the next check would be measuring " +
        "the wrong failure",
    ).toBe(true);
  });

  it("carries the product cards as HTML, not only as streaming payload", (ctx) => {
    if (!serverIsUp) return ctx.skip(NO_SERVER);

    expect(
      occurrences(html, 'data-pw="product-name"'),
      `the home document (${html.length} bytes) contains no product card in its ` +
        `HTML. The products are in it only as streaming payload, so the browser ` +
        `has to render the rows itself: the skeleton is removed, the section ` +
        `collapses to its header, and everything below it moves when the cards ` +
        `finally paint`,
    ).toBeGreaterThan(0);
  });

  it("fills every product-row skeleton it puts above the boutiques", (ctx) => {
    if (!serverIsUp) return ctx.skip(NO_SERVER);

    const empty = unfilledProductRows(html);

    expect(
      empty,
      `these product rows reserved 457px in the shell and were then replaced by ` +
        `nothing: ${empty.join(", ")}. A skeleton is a promise about the final ` +
        `size, so a row that ends up empty pulls everything below it up the ` +
        `moment the boundary resolves — measured at 467px on the flash-deal row ` +
        `with no deal running. CategoryHomeView asks the cached reader whether ` +
        `the row will have anything in it and renders the <Suspense> only then`,
    ).toEqual([]);
  });
});
