// @vitest-environment node
//
// serverRequests/cached/home.ts carries `import "server-only"`, so it can only
// be loaded from a server-like test environment. See tests/mocks/serverOnly.ts.
import { describe, it, expect, vi, beforeEach } from "vitest";

const getCategories = vi.fn();

vi.mock("services/elastic/elasticsearch-reader.service", () => ({
  ElasticsearchReader: class {
    getCategories = getCategories;
  },
}));

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

function hit(categories: any[]) {
  return { _source: { custom_categories: categories } };
}

describe("getCachedCategories", () => {
  beforeEach(() => {
    getCategories.mockReset();
  });

  it("returns only the six fields the navbar renders", async () => {
    getCategories.mockResolvedValue({
      hits: {
        hits: [
          hit([
            {
              id: 7,
              language_code: "en",
              name: "Shoes",
              slug: "shoes",
              flat_photo_path: { file_path: "/f.png" },
              outline_photo_path: { file_path: "/o.png" },
              fill_photo_path: { file_path: "/x.png" },
              position: 3,
              category_id: 99,
              description: "a long description nobody renders",
            },
          ]),
        ],
      },
    });

    const { getCachedCategories } = await import("serverRequests/cached/home");
    const categories = await getCachedCategories("sy", "en");

    expect(
      Object.keys(categories[0]).sort(),
      "the cached category carries fields the navbar never renders, so every cache entry stores more than it needs (finding 12)",
    ).toEqual([
      "fill_photo_path",
      "flat_photo_path",
      "id",
      "name",
      "outline_photo_path",
      "slug",
    ]);
  });

  it("keeps only the requested language", async () => {
    getCategories.mockResolvedValue({
      hits: {
        hits: [
          hit([
            { id: 7, language_code: "en", name: "Shoes", slug: "shoes" },
            { id: 7, language_code: "ar", name: "أحذية", slug: "shoes" },
          ]),
        ],
      },
    });

    const { getCachedCategories } = await import("serverRequests/cached/home");
    const categories = await getCachedCategories("sy", "ar");

    expect(
      categories.map((c) => c.name),
      "asking for Arabic returned a name in another language, so the navbar would render the wrong words",
    ).toEqual(["أحذية"]);
  });

  it("matches the language case-insensitively", async () => {
    getCategories.mockResolvedValue({
      hits: {
        hits: [
          hit([{ id: 7, language_code: "EN", name: "Shoes", slug: "shoes" }]),
        ],
      },
    });

    const { getCachedCategories } = await import("serverRequests/cached/home");
    const categories = await getCachedCategories("sy", "en");

    expect(
      categories.map((c) => c.slug),
      "a category whose language_code is upper-case was dropped, so the navbar renders empty for that index",
    ).toEqual(["shoes"]);
  });

  it("returns each category once even when many products share it", async () => {
    const shoes = { id: 7, language_code: "en", name: "Shoes", slug: "shoes" };
    getCategories.mockResolvedValue({
      hits: { hits: [hit([shoes]), hit([shoes]), hit([shoes])] },
    });

    const { getCachedCategories } = await import("serverRequests/cached/home");
    const categories = await getCachedCategories("sy", "en");

    expect(
      categories.map((c) => c.slug),
      "the same category came back more than once, so the navbar would show a duplicate tab",
    ).toEqual(["shoes"]);
  });

  it("returns an empty list rather than throwing when the search engine answers nothing", async () => {
    getCategories.mockResolvedValue({ hits: { hits: [] } });

    const { getCachedCategories } = await import("serverRequests/cached/home");

    await expect(
      getCachedCategories("sy", "en"),
      "an empty answer from the search engine threw instead of returning an empty list, which would blank the whole page rather than the navbar",
    ).resolves.toEqual([]);
  });
});
