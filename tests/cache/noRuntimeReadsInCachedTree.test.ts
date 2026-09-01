// What can a cached scope on the home page reach that reads a cookie, a header
// or the clock?
//
// MECHANISM: a source scan, not a runtime check.
//
// It reads the files, follows their `import` statements and looks for the reads
// a `use cache` scope must not make. It does NOT execute anything, so it cannot
// see a read reached through a dynamic import or a runtime string. It is a
// tripwire for the ordinary case, not a proof.
//
// Resolution follows this repo's tsconfig, where "*": ["./*"] makes `utils/x`,
// `store` and `serverRequests/x` resolve from the repo root. A walker that only
// understands "./" and "@/" skips every one of those WITHOUT SAYING SO, and
// reports a clean graph for a tree full of cookie reads. The self-checks in the
// first block exist because of exactly that (finding 17).
//
// WHAT IS AN ENTRY POINT, AND WHAT IS NOT
//
// Only a module that declares `"use cache"` is walked. Nothing in this repo is
// a cached *component*: the four home wrappers (FeaturedProduct and the rest)
// CALL a cached reader and render its answer, so their own output is not
// stored. They get a narrower check further down — no request-bound read of
// their own, and no `"use cache"` of their own. The last block keeps the entry
// list honest: it finds every `"use cache"` in the repository and fails if one
// lives somewhere this file does not walk.
//
// WHY THE ANSWER IS A REVIEWED LIST AND NOT "NOTHING"
//
// The walk follows imports, not calls. `serverRequests/home.tsx` imports
// `components/ServerWrapper/BoutiqueWrapper`, and from there the walk reaches
// the product tree and the auth helpers. Those modules are loaded, not called,
// on the cached path. Demanding an empty result would therefore mean weakening
// the walk until it stopped looking, which is the failure this whole check
// exists to avoid.
//
// So each read the walk can reach carries the reason it is safe, checked by
// hand against the file and the line. A read that is NOT on the list fails the
// test and names the file. That is the signal worth having: somebody pulled a
// new cookie or clock read into reach of a cached scope.
//
// WHAT THE BUILD ALREADY PROVES, SO THIS DOES NOT HAVE TO
//
// Under Cache Components, `cookies()` and `headers()` throw during a prerender.
// A cached scope that really called one fails `pnpm build`. So the build is the
// proof for that half, and it is a stronger proof than this file could give.
//
// The clock and the random number are the half the framework does NOT catch.
// They do not throw. They are read once, when the entry is filled, and every
// later response repeats that one value until the entry expires.
import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";

const ROOT = resolve(__dirname, "../..");
const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

/** A path as this file prints it, whatever the operating system uses. */
const asPosix = (path: string): string => path.split(sep).join("/");

const FORBIDDEN = [
  { pattern: /\bcookies\s*\(/, what: "cookies()" },
  { pattern: /\bheaders\s*\(/, what: "headers()" },
  { pattern: /getCookieServer\s*\(/, what: "getCookieServer()" },
  { pattern: /getRedeemedIds\s*\(/, what: "getRedeemedIds()" },
  { pattern: /new Date\s*\(\s*\)/, what: "new Date()" },
  { pattern: /Date\.now\s*\(/, what: "Date.now()" },
  { pattern: /Math\.random\s*\(/, what: "Math.random()" },
];

/** Take the comments out before looking at anything.
 *
 *  Without this the scan reads its own documentation back as evidence. Two real
 *  cases in this repo: `services/elastic/helpers.ts` explains in a comment why a
 *  `new Date()` on the flash-deal path would be wrong, and `utils/functions.tsx`
 *  line 1 is a commented-out import of a file that no longer exists. The first
 *  version of this walk reported both.
 *
 *  A line comment is only cut when the `//` starts a line or follows a space,
 *  so the `//` in an `https://` address inside a string survives. */
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/.*$/gm, "$1");

// `existsSync` alone is not enough. `utils/luck` is a DIRECTORY, so
// `existsSync` answers true for it, and a walker that trusts that hands a
// directory to `readFileSync` and dies with EISDIR. Ask whether it is a file.
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
        join(ROOT, specifier), // the "*": ["./*"] mapping
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

/** Every repo-root folder a bare specifier can start with. A specifier that
 *  starts with one of these and still does not resolve is a hole in the walk,
 *  not a package from node_modules. */
const REPO_PREFIXES =
  /^(utils|store|services|components|serverRequests|serverActions|hooks|types|styles|assets|scaling|app|public)\b/;

/** Every forbidden read in one file, without following its imports. */
function readsIn(file: string): string[] {
  const source = stripComments(readFileSync(file, "utf8"));
  const relative = asPosix(file.slice(ROOT.length + 1));

  return FORBIDDEN.filter(({ pattern }) => pattern.test(source)).map(
    ({ what }) => `${relative} -> ${what}`,
  );
}

function walk(entry: string) {
  const seen = new Set<string>();
  const unresolved: string[] = [];
  const found: string[] = [];
  const queue = [entry];

  while (queue.length) {
    const file = queue.pop()!;
    if (seen.has(file) || file.includes("node_modules")) continue;
    seen.add(file);

    const source = stripComments(readFileSync(file, "utf8"));

    // A "use client" module runs in the browser, where the clock and the
    // document cookie are the visitor's own. It is not part of the cached
    // server tree.
    if (/^\s*["']use client["']/m.test(source)) continue;

    found.push(...readsIn(file));

    for (const match of source.matchAll(/from\s+["']([^"']+)["']/g)) {
      const specifier = match[1];
      if (specifier.startsWith("next/") || !/^[.@a-z]/i.test(specifier))
        continue;

      const resolved = resolveImport(specifier, file);
      if (resolved) queue.push(resolved);
      else if (specifier.startsWith(".") || REPO_PREFIXES.test(specifier))
        unresolved.push(`${asPosix(file.slice(ROOT.length + 1))} -> ${specifier}`);
    }
  }

  return { seen, found: found.sort(), unresolved: unresolved.sort() };
}

// The modules that declare a `use cache` scope. The last test in this file
// proves this list is the whole of it.
const CACHED_MODULES = [
  "serverRequests/cached/home.ts",
  "serverRequests/cached/currency.ts",
  "serverRequests/meta/home.ts",
];

// The home wrappers. Each one calls a cached reader and renders the answer, so
// none of them is cached itself — see the note at the top.
const CACHED_READER_CALLERS = [
  "components/ServerWrapper/FeaturedProduct.tsx",
  "components/ServerWrapper/FlashDealsProduct.tsx",
  "components/ServerWrapper/BoutiquesListWrapper.tsx",
  "components/Server/MainCategories/index.tsx",
];

// Every read the walk can reach from a cached module, with the reason it is
// safe. Checked by hand, file and line. Adding a line here is a decision: say
// which function holds the read and why the cached path does not run it.
const REVIEWED: Record<string, string> = {
  "utils/server/index.tsx -> new Date()":
    "utils/server/index.tsx:55, inside the day-label helper that turns a message " +
    "timestamp into 'today' or 'yesterday'. The cached readers import this file " +
    "for translateFunction, a different export, and return product data that " +
    "carries no day label.",

  "utils/serverErrorReporter.ts -> new Date()":
    "utils/serverErrorReporter.ts:78, the timestamp on an error report. It only " +
    "runs when something already failed, on the request that filled the entry.",

  "utils/history.ts -> Date.now()":
    "utils/history.ts:40, inside setCookieClient, which returns straight away " +
    "when `document` is undefined. On the server it never reaches the clock.",

  "utils/cookies/server-cookie-fallback.ts -> cookies()":
    "the bare-require hatch for modules that also live in the client graph. Its " +
    "only caller is readServerCookies, which the page-history tracker uses. No " +
    "cached reader calls it — and if one did, the build would fail, because " +
    "cookies() throws during a prerender.",

  "services/elastic/helpers.ts -> headers()":
    "services/elastic/helpers.ts:2894, inside logSearchTerm, which records a " +
    "search term against the visitor's address. The home readers call " +
    "getProductsAndFiltersFromElastic and getCategories, not the search log.",

  "services/elastic/helpers.ts -> new Date()":
    "services/elastic/helpers.ts:2941, the timestamp on that same search-log " +
    "document. The flash-deal window is Elasticsearch date math ('now/d'), not " +
    "a clock read here — see the comment at helpers.ts:1476.",

  "serverRequests/products.ts -> cookies()":
    "serverRequests/products.ts:144, inside getProductDataForAddToCart, the " +
    "product page's add-to-cart loader. It is in reach only because " +
    "serverRequests/home.tsx imports BoutiqueWrapper, which reaches the product " +
    "tree. No cached home reader calls it.",

  "utils/server/tokenManager.ts -> cookies()":
    "the auth-token read and write helpers, used by HandleAuthedFetch. The " +
    "cached home readers talk to Elasticsearch directly and send no token.",

  "utils/server/tokenManager.ts -> new Date()":
    "utils/server/tokenManager.ts:395, a timestamp inside an error payload.",
};

/** Every source file under the folders this app's own code lives in. */
function everySourceFile(): string[] {
  const roots = [
    "app",
    "components",
    "hooks",
    "scaling",
    "serverActions",
    "serverRequests",
    "services",
    "store",
    "utils",
  ];
  const files: string[] = [];

  const descend = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const full = join(directory, entry.name);
      if (entry.isDirectory()) descend(full);
      else if (EXTENSIONS.some((ext) => entry.name.endsWith(ext))) files.push(full);
    }
  };

  for (const root of roots) descend(join(ROOT, root));
  return files;
}

describe("the scan can see what it claims to see", () => {
  it("resolves a bare repo-root import to a real file", () => {
    // The self-check finding 17 asks for. `utils/luck` is a bare specifier that
    // only resolves through tsconfig's "*": ["./*"] mapping, and it is a folder,
    // so it also proves the resolver reaches an index file rather than stopping
    // at the directory. If this is null, every `utils/...`, `store` and
    // `serverRequests/...` import in the scan below is skipped and a clean
    // result means nothing.
    const resolved = resolveImport(
      "utils/luck",
      join(ROOT, "serverRequests/cached/home.ts"),
    );

    expect(
      resolved,
      "the walker cannot resolve a bare repo-root import like `utils/luck`, so it skips most of this repo's imports and every result below is meaningless",
    ).not.toBeNull();

    expect(
      resolved !== null && statSync(resolved).isFile(),
      `the walker resolved \`utils/luck\` to ${resolved}, which is not a file — a directory here means the walk tries to read a folder and stops`,
    ).toBe(true);
  });

  it("finds a forbidden read when one is really there", () => {
    // The second half of the self-check: prove the matcher fires. This file
    // genuinely reads the profile cookie on purpose, and always will.
    const { found } = walk(
      join(ROOT, "components/ServerWrapper/RecommendedWrapper.tsx"),
    );

    expect(
      found.join(", "),
      "the scan reported no forbidden read in the recommendations component, which reads the User-Data cookie on purpose — so the matcher is broken and a clean report proves nothing",
    ).toContain("getCookieServer()");
  });

  it("reaches past the entry file instead of stopping at it", () => {
    // A walk that read only the file it was given would report a clean graph
    // for every entry point below, because none of them holds a read itself.
    const { seen } = walk(join(ROOT, "serverRequests/cached/home.ts"));

    expect(
      seen.size,
      `the walk visited ${seen.size} file(s) from the cached home readers, so it never followed an import and every result below describes one file, not a tree`,
    ).toBeGreaterThan(10);
  });

  it("does not read a comment back as evidence", () => {
    const stripped = stripComments(
      '// a new Date() here would be wrong\nconst url = "https://example.com";',
    );

    expect(
      stripped,
      "a `new Date()` written inside a comment is still being matched, so the scan reports its own documentation as a finding",
    ).not.toContain("new Date()");
    expect(
      stripped,
      "the comment stripper also cut the `//` out of a URL inside a string, so it is removing real code",
    ).toContain("https://example.com");
  });
});

describe.each(CACHED_MODULES)("the cached module %s", (entry) => {
  it("reaches no cookie, header or clock read that has not been reviewed", () => {
    const { found } = walk(join(ROOT, entry));
    const unreviewed = found.filter((read) => !(read in REVIEWED));

    expect(
      unreviewed,
      `${entry} can now reach a cookie, header or clock read that nobody has looked at. ` +
        `Inside a \`use cache\` scope a cookie or header read fails the build, and a clock ` +
        `read freezes one request's value into every later response. Check whether the ` +
        `cached path really calls it; if it does not, add it to REVIEWED with the reason.`,
    ).toEqual([]);
  });

  it("resolves every repo import it meets", () => {
    const { unresolved } = walk(join(ROOT, entry));

    expect(
      unresolved,
      `${entry}: the walk could not resolve these imports, so whatever they contain was never checked`,
    ).toEqual([]);
  });
});

// Finding 17's second requirement, in the form this codebase actually takes.
// There are no cached components here, only cached readers — so what matters
// about these four wrappers is that they add no request-bound read of their own
// to the values they hand the reader, and that they stay uncached. The moment
// one of them declares `"use cache"`, its props become stored data and it needs
// the full walk above instead.
describe.each(CACHED_READER_CALLERS)("the cached-reader caller %s", (caller) => {
  it("holds no cookie, header or clock read of its own", () => {
    expect(
      readsIn(join(ROOT, caller)),
      `${caller} calls a cached reader and now makes a request-bound read itself. Either move the read out, or pass its value in as an argument so it joins the cache key.`,
    ).toEqual([]);
  });

  it("is not itself a cached scope", () => {
    const source = stripComments(readFileSync(join(ROOT, caller), "utf8"));

    expect(
      /["']use cache["']/.test(source),
      `${caller} now declares "use cache", so its props are stored and shared. Add it to CACHED_MODULES so the full import walk covers it.`,
    ).toBe(false);
  });
});

describe("the reviewed list and the entry list describe the real tree", () => {
  it("has no reviewed entry that nothing reaches any more", () => {
    // A stale allowance is a hole. If a read is gone from the tree, the reason
    // written next to it is no longer checked by anything, and the next person
    // to reintroduce that read gets a green run.
    const reachable = new Set(
      CACHED_MODULES.flatMap((entry) => walk(join(ROOT, entry)).found),
    );
    const stale = Object.keys(REVIEWED).filter((read) => !reachable.has(read));

    expect(
      stale,
      "these reads are on the reviewed list but no cached module reaches them any more; delete them from REVIEWED so the list keeps describing the real tree",
    ).toEqual([]);
  });

  it("knows about every `use cache` scope in the repository", () => {
    // This is what stops the list above going quietly out of date. A new cached
    // scope anywhere in the app fails here by name, rather than being missed.
    const declared = everySourceFile()
      .filter((file) => /["']use cache["']/.test(stripComments(readFileSync(file, "utf8"))))
      .map((file) => asPosix(file.slice(ROOT.length + 1)))
      .filter((file) => !CACHED_MODULES.includes(file))
      .sort();

    expect(
      declared,
      'these files declare "use cache" but this test does not walk them, so nothing checks what their cached scopes can reach. Add each one to CACHED_MODULES.',
    ).toEqual([]);
  });
});
