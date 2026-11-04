import { beforeEach, describe, expect, it, vi } from "vitest";

const spies = vi.hoisted(() => ({
  lang: "sy-en",
  getCachedCategories: vi.fn(),
  getCachedBoutiques: vi.fn(),
}));

vi.mock("next/root-params", () => ({ lang: async () => spies.lang }));
vi.mock("serverRequests/cached/home", () => ({
  getCachedCategories: (...a: unknown[]) => spies.getCachedCategories(...a),
  getCachedBoutiques: (...a: unknown[]) => spies.getCachedBoutiques(...a),
}));
// A stand-in table: the word with the language in front.
vi.mock("utils/server", () => ({
  translateFunction: (key: string, language: string) => `${language}:${key}`,
}));
vi.mock("components/Home", () => ({ default: () => null }));
const connection = vi.hoisted(() => vi.fn(async () => {}));
vi.mock("next/server", () => ({ connection }));
vi.mock("components/DemoApp1/screens/AppHome", () => ({ default: () => null }));

import AppHome from "components/DemoApp1/screens/AppHome";
import Home from "components/Home";
import AppHomeView from "components/DemoApp1/screens/AppHomeView";

const MEDIA = "https://media.test";
const boutiques = Array.from({ length: 11 }, (_, i) => ({
  slug: `b${i + 1}`,
  name: `B${i + 1}`,
  icon: null,
}));

/** The props the view gives the client screen, and the other children. */
async function view(slug: string | null) {
  const tree: any = await AppHomeView({ slug });
  const children: any[] = tree.props.children;
  const screen = children.find((c) => c?.type === AppHome);
  return { screen: screen?.props, children };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_BASE_MEDIA_URL = MEDIA;
  spies.lang = "sy-en";
  spies.getCachedCategories.mockResolvedValue([
    { slug: "men", name: "Men" },
    { slug: "women", name: "Women" },
  ]);
  spies.getCachedBoutiques.mockResolvedValue({ boutiques, offset: [11, "b11"] });
});

describe("AppHomeView (the new home on the server)", () => {
  it("reads 21 boutiques of the page's category from the search engine (S7-7)", async () => {
    await view("women");
    expect(
      spies.getCachedBoutiques,
      "the first read must be 21 boutiques of this country, language and category",
    ).toHaveBeenCalledWith("sy", "en", "women", 21);
  });

  it("reads the main categories of the page's country and language", async () => {
    await view(null);
    expect(
      spies.getCachedCategories,
      "the chips must be the main categories of sy / en",
    ).toHaveBeenCalledWith("sy", "en");
  });

  it("gives the first 9 boutiques to the Brand Stores carousel (S7-3)", async () => {
    const { screen } = await view(null);
    expect(
      screen.brands.map((b: any) => b.slug),
      "the carousel must get the first 9 boutiques, in the backend's order",
    ).toEqual(["b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8", "b9"]);
  });

  it("gives the boutiques after the 9th to the Stores grid (S7-3)", async () => {
    const { screen } = await view(null);
    expect(
      screen.stores.map((b: any) => b.slug),
      "the grid must start with the boutiques after the first 9",
    ).toEqual(["b10", "b11"]);
  });

  it("gives the grid the search engine's offset for its next read", async () => {
    const { screen } = await view(null);
    expect(screen.storesOffset, "the grid's next read must start after the server's read").toEqual([
      11,
      "b11",
    ]);
  });

  it("picks no chip on the home (S7-8)", async () => {
    const { screen } = await view(null);
    expect(
      screen.chips.filter((c: any) => c.picked),
      "no chip may be picked on /[lang]",
    ).toEqual([]);
  });

  it("picks the page's chip on a category's page (S7-4)", async () => {
    const { screen } = await view("women");
    expect(
      screen.chips.find((c: any) => c.picked)?.slug,
      "on /categories/women the women chip must be picked",
    ).toBe("women");
  });

  it("tells the screen the category, so the grid's next reads stay in it", async () => {
    const { screen } = await view("women");
    expect(screen.category, "the screen must know the page's category").toBe("women");
  });

  it("sends no dictionary for English (the screen writes the keys in title style, D-4)", async () => {
    const { screen } = await view(null);
    expect(screen.words.dictionary, "English must not carry a dictionary").toEqual({});
  });

  it("sends the home's words in the page's language", async () => {
    spies.lang = "sy-ar";
    const { screen } = await view(null);
    expect(
      screen.words.dictionary["Brand Stores"],
      "an Arabic page must get the Arabic 'Brand Stores'",
    ).toBe("ar:Brand Stores");
  });

  it("sends the add-story card's label in the page's language (S7-5)", async () => {
    spies.lang = "sy-ar";
    const { screen } = await view(null);
    expect(screen.words.addStory, "the add-story card's label must be translated").toBe(
      "ar:Add Story",
    );
  });

  // The home's metadata (GetHomeMetaData) reads Redis at request time. The old
  // home had a request-time part (the recommended row reads a cookie), so Next
  // allowed that. The new home has none, and Next then stops on the metadata
  // ("uncached data in generateMetadata()"). An empty part that waits for the
  // request, in its own Suspense, keeps the page as it was: static content,
  // metadata at request time.
  it("keeps one request-time part, so the metadata may read Redis", async () => {
    const { children } = await view(null);
    const marker = children.find(
      (c) => c?.props?.children?.type?.name === "RequestTime",
    );
    expect(
      marker,
      "the new home has no request-time part, so Next stops on its Redis metadata",
    ).toBeDefined();
    await marker.props.children.type();
    expect(connection, "the request-time part must wait for the request (connection())").toHaveBeenCalled();
  });

  it("keeps the home's message toasts and name prompt (components/Home)", async () => {
    const { children } = await view(null);
    const suspense = children.find((c) => c?.props?.children?.type === Home);
    expect(
      suspense,
      "<Home /> (the ?message= toasts and the name prompt) is missing from the new home",
    ).toBeDefined();
  });
});
