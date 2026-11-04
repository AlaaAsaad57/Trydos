// The search page /[lang]/search (Stage 7, S7-2): its metadata and the words
// it gives the screen.
import { beforeEach, describe, expect, it, vi } from "vitest";

const spies = vi.hoisted(() => ({ lang: "sy-en" }));
vi.mock("next/root-params", () => ({ lang: async () => spies.lang }));
vi.mock("utils/server", () => ({
  translateFunction: (key: string, language: string) => `${language}:${key}`,
}));
vi.mock("components/DemoApp1/screens/AppSearch", () => ({ default: () => null }));

import AppSearch from "components/DemoApp1/screens/AppSearch";
import SearchPage, { generateMetadata, instant } from "app/(client)/[lang]/search/page";

beforeEach(() => {
  spies.lang = "sy-en";
});

describe("the search page", () => {
  it("keeps search engines out: an empty field is nothing to index", async () => {
    const meta: any = await generateMetadata();
    expect(meta.robots, "the search page must be noindex, nofollow").toEqual({ index: false, follow: false });
  });

  it("titles the page with the translated word 'Search'", async () => {
    spies.lang = "sy-ar";
    const meta: any = await generateMetadata();
    expect(meta.title, "the title is not the Arabic 'Search'").toBe("ar:Search | Trydos");
  });

  it("turns instant validation off, as the cart page does", () => {
    expect(instant, "the shared [lang] layout cannot be validated yet").toBe(false);
  });

  it("draws the new search screen with the page's locale", async () => {
    const tree: any = await SearchPage();
    expect(tree.type, "the page did not draw the new search screen").toBe(AppSearch);
    expect(tree.props.lang, "the screen got the wrong locale").toBe("sy-en");
  });

  it("sends no dictionary for English (the screen applies the capital rules, D-4)", async () => {
    const tree: any = await SearchPage();
    expect(tree.props.dictionary, "English must not carry a dictionary").toEqual({});
  });

  it("sends the search page's words in the page's language", async () => {
    spies.lang = "sy-ar";
    const tree: any = await SearchPage();
    expect(tree.props.dictionary, "the Arabic page did not get its four words").toEqual({
      "Search anything…": "ar:Search anything…",
      "Voice search": "ar:Voice search",
      Scan: "ar:Scan",
      "For you": "ar:For you",
    });
  });
});
