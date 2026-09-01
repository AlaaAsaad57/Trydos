// The homepage metadata builder, and the category slug it is handed.
//
// The bug this file was written for: `?mainCategory=<anything>` reaches
// generateMetadata in app/(client)/[lang]/page.tsx and is passed straight into
// GetHomeMetaData. Nothing checked it, so a stranger's text:
//
//   - became part of the Redis key `meta-obj-<slug>-<lang>-<country>`, so every
//     distinct value they sent created another cache entry that never expires
//     under a bounded key space;
//   - became the page <title> whenever Elasticsearch had no such category,
//     because the code fell back to the raw slug;
//   - was written into the OpenGraph url, which crawlers and link previews read.
//
// A valid slug still has to work exactly as before, so every check below has a
// positive control with a real slug next to it.

import { beforeEach, describe, expect, it, vi } from "vitest";

const redisGet = vi.fn();
const redisSet = vi.fn();
const elasticSearch = vi.fn();
const cacheLife = vi.fn();
const cacheTag = vi.fn();

vi.mock("serverRequests/radis", () => ({
  RedisGet: (...args: unknown[]) => redisGet(...args),
  RedisSet: (...args: unknown[]) => redisSet(...args),
}));
vi.mock("services/elastic/elasticsearch.config", () => ({
  elasticSearchComment: { search: (...args: unknown[]) => elasticSearch(...args) },
  elasticSearchClient: {},
}));
vi.mock("utils/server", () => ({
  getRobotsConfig: () => ({ index: false, follow: false }),
}));
vi.mock("utils/serverErrorReporter", () => ({ LogServerError: vi.fn() }));
vi.mock("next/cache", () => ({
  cacheLife: (...args: unknown[]) => cacheLife(...args),
  cacheTag: (...args: unknown[]) => cacheTag(...args),
}));

import { GetHomeMetaData, isValidCategorySlug } from "serverRequests/meta/home";

/** Elasticsearch answering "no category matches that slug". */
const noCategoryFound = { hits: { hits: [] } };

/** Elasticsearch answering with a real category. */
const categoryFound = {
  hits: {
    hits: [
      {
        _source: {
          custom_categories: [
            { id: 12, name: "Shoes", language_code: "en" },
          ],
        },
      },
    ],
  },
};

const HOSTILE = "Buy cheap pills at evil.example";

const keysWrittenToRedis = () => redisSet.mock.calls.map((call) => String(call[0]));

beforeEach(() => {
  vi.clearAllMocks();
  redisGet.mockResolvedValue(null);
  redisSet.mockResolvedValue(undefined);
});

describe("GetHomeMetaData category slug", () => {
  it("keeps building category metadata for a real slug", async () => {
    elasticSearch.mockResolvedValue(categoryFound);

    const meta: any = await GetHomeMetaData({ local: "sy-en", category: "shoes" });

    expect(
      String(meta.title),
      "a real category slug no longer produces its own title, so every category " +
        "page would share the plain homepage metadata",
    ).toContain("Shoes");
    expect(
      keysWrittenToRedis().join(" "),
      "a real category slug was not cached under its own key",
    ).toContain("meta-obj-shoes-en-sy");
  });

  it("does not open a Redis key for a slug that is not a slug", async () => {
    elasticSearch.mockResolvedValue(noCategoryFound);

    await GetHomeMetaData({ local: "sy-en", category: HOSTILE });

    const keys = keysWrittenToRedis();
    expect(
      keys.filter((key) => key.includes("evil.example")),
      `the raw query value became a Redis key (${keys.join("; ")}), so anyone ` +
        `can create an unbounded number of cache entries by changing ?mainCategory=`,
    ).toEqual([]);
  });

  it("does not put a stranger's text in the page title", async () => {
    elasticSearch.mockResolvedValue(noCategoryFound);

    const meta: any = await GetHomeMetaData({ local: "sy-en", category: HOSTILE });

    expect(
      String(meta.title),
      `the page title carried text taken straight from the query string: ` +
        `${String(meta.title)}`,
    ).not.toContain("evil.example");
  });

  it("does not put a stranger's text in the OpenGraph url", async () => {
    elasticSearch.mockResolvedValue(noCategoryFound);

    const meta: any = await GetHomeMetaData({ local: "sy-en", category: HOSTILE });

    expect(
      String(meta.openGraph?.url),
      `the OpenGraph url a crawler reads carried query-string text: ` +
        `${String(meta.openGraph?.url)}`,
    ).not.toContain("evil.example");
  });

  it("does not accept a repeated ?mainCategory=, which arrives as an array", async () => {
    elasticSearch.mockResolvedValue(noCategoryFound);

    const meta: any = await GetHomeMetaData({
      local: "sy-en",
      category: ["shoes", HOSTILE] as unknown as string,
    });

    expect(
      keysWrittenToRedis().join(" ") + String(meta.openGraph?.url),
      "?mainCategory=a&mainCategory=b gives an array, and it was joined into " +
        "the cache key and the url instead of being refused",
    ).not.toContain("evil.example");
  });
});

// The slug rule itself. The app serves Arabic, Turkish and Kurdish, so a rule
// that only allowed a-z would quietly drop every non-Latin category.
describe("isValidCategorySlug", () => {
  it.each(["shoes", "blue-shirt", "men_bags", "أحذية", "çocuk", "kürt2"])(
    "accepts %s, which is the shape a real category slug has",
    (slug) => {
      expect(
        isValidCategorySlug(slug),
        `${slug} looks like a real category slug and was refused, so that ` +
          `category page would lose its own title and canonical url`,
      ).toBe(true);
    },
  );

  it.each([
    "Buy cheap pills at evil.example",
    "shoes?x=1",
    "../../etc/passwd",
    "<script>alert(1)</script>",
    "-leading-hyphen",
    "",
  ])("refuses %s", (slug) => {
    expect(
      isValidCategorySlug(slug),
      `${slug} is not a category slug and was accepted, so it would reach the ` +
        `Redis key, the page title and the OpenGraph url`,
    ).toBe(false);
  });

  it("refuses a value longer than a slug ever is", () => {
    expect(
      isValidCategorySlug("a".repeat(65)),
      "a 65-character value was accepted, so the Redis key length is unbounded",
    ).toBe(false);
  });

  it.each([[null], [undefined], [["shoes", "boots"]], [{}], [7]])(
    "refuses the non-string value %s",
    (slug) => {
      expect(
        isValidCategorySlug(slug),
        "a value that is not a string was accepted as a slug",
      ).toBe(false);
    },
  );
});

// What a unit test can and cannot see here.
//
// `use cache` is a Next.js compiler feature. Vitest has no runtime for it, so
// the memoization itself is invisible to this suite: with next/cache mocked the
// directive is an inert string, and without the mock cacheLife() throws because
// there is no cache scope to configure. Measured both ways while writing this.
// The proof that a second identical request does not query the search engine is
// therefore a runtime measurement on a real build — see the commit for Task 17.
//
// What is provable here is the part that decides WHICH entry a request lands in:
// the cache key. A cached function is keyed on the arguments it actually reads,
// and the tag is what a revalidation later names. Both are ordinary values.
describe("the cached metadata reader's key", () => {
  it("puts the country, the language and the slug in the tag", async () => {
    elasticSearch.mockResolvedValue(categoryFound);

    await GetHomeMetaData({ local: "sy-en", category: "shoes" });

    expect(
      cacheTag.mock.calls.map((call) => String(call[0])).join(" "),
      "the category metadata was tagged without one of the three values that " +
        "make it different from another page's metadata, so a revalidation " +
        "would clear the wrong entry",
    ).toContain("meta-sy-en-shoes");
  });

  it("gives the plain homepage its own tag instead of an empty one", async () => {
    elasticSearch.mockResolvedValue(noCategoryFound);

    await GetHomeMetaData({ local: "sy-en", category: null });

    const tags = cacheTag.mock.calls.map((call) => String(call[0])).join(" ");
    expect(
      tags,
      "the homepage metadata was not tagged meta-sy-en-home",
    ).toContain("meta-sy-en-home");
    expect(
      tags,
      "the homepage tag was built from the empty category value, so the tag " +
        "reads meta-sy-en-null and no one revalidating the homepage would guess it",
    ).not.toMatch(/null|undefined/);
  });

  it("asks for the homepage cache window, not the framework default", async () => {
    elasticSearch.mockResolvedValue(noCategoryFound);

    await GetHomeMetaData({ local: "sy-en", category: null });

    expect(
      cacheLife.mock.calls[0]?.[0],
      "the metadata reader did not ask for the `homepage` profile, so its " +
        "entry would live for the framework default instead of the window " +
        "HOMEPAGE_CACHE_SECONDS sets (D-3, D-4)",
    ).toBe("homepage");
  });

  it("keeps a slug a stranger chose out of the cache tag", async () => {
    elasticSearch.mockResolvedValue(noCategoryFound);

    await GetHomeMetaData({ local: "sy-en", category: HOSTILE });

    const tags = cacheTag.mock.calls.map((call) => String(call[0])).join(" ");
    expect(
      tags,
      "text from the URL reached the cache tag; every distinct value a stranger " +
        "sends would then open another cache entry",
    ).not.toContain("evil.example");
    expect(
      tags,
      "a rejected slug did not fall back to the homepage tag",
    ).toContain("meta-sy-en-home");
  });

  it("still lets a real slug through to the tag", async () => {
    // The positive control for the check above: if nothing ever reached the tag,
    // "does not contain evil.example" would pass while proving nothing.
    elasticSearch.mockResolvedValue(categoryFound);

    await GetHomeMetaData({ local: "sy-en", category: "boots" });

    expect(
      cacheTag.mock.calls.map((call) => String(call[0])).join(" "),
      "a valid slug never reached the cache tag, so every category page would " +
        "share the homepage's metadata entry",
    ).toContain("meta-sy-en-boots");
  });
});
