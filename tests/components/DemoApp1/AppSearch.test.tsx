import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../render";

// ---- The two search reads (market backend, through server actions) ----------
const GetSearchData = vi.fn();
const GetSearchSuggestion = vi.fn();
vi.mock("serverRequests/Search", () => ({
  GetSearchData: (...a: any[]) => GetSearchData(...a),
  GetSearchSuggestion: (...a: any[]) => GetSearchSuggestion(...a),
}));
const getTrendingSearch = vi.fn();
vi.mock("services/search", () => ({ default: { getTrendingSearch: () => getTrendingSearch() } }));
vi.mock("services/auth", () => ({ default: { UserID: () => "u-1" } }));

// The voice and image search are their own units: here they show the mark and
// the label the page gives them, and a button that hands back a word.
vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<any>) => {
    loader();
    return ({ setSearchValue, icon, label }: any) => (
      <span data-pw={`media-${label}`}>
        {icon}
        <button onClick={() => setSearchValue(`${label} words`)}>{label}</button>
      </span>
    );
  },
}));
vi.mock("components/Home/Search/SearchVoice", () => ({ default: () => null }));
vi.mock("components/Home/Search/SearchImage", () => ({ default: () => null }));
vi.mock("components/Home/Search/SearchHistory", () => ({ default: () => <div data-testid="history" /> }));
vi.mock("components/Home/Search/SearchTrending", () => ({ default: () => <div data-testid="trending" /> }));

const page = vi.hoisted(() => ({ lang: "sy-en" }));
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  useParams: () => ({ lang: page.lang }),
  usePathname: () => `/${page.lang}/search`,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
}));

import AppSearch from "components/DemoApp1/screens/AppSearch";

const empty = { brands: [], categories: [], boutiques: [], products: [], total_size: 0, related_categories: [] };

const open = (lang = "sy-en", dictionary = {}) => {
  page.lang = lang;
  return renderWithProviders(<AppSearch lang={lang} dictionary={dictionary} />);
};
const input = () => document.querySelector('[data-pw="demo-search-input"]') as HTMLInputElement;

beforeEach(() => {
  GetSearchData.mockReset().mockResolvedValue(empty);
  GetSearchSuggestion.mockReset().mockResolvedValue({ suggestion: "" });
  getTrendingSearch.mockReset().mockResolvedValue({ popular_search_terms: [] });
  localStorage.clear();
});

describe("AppSearch (the search page /[lang]/search)", () => {
  it("shows only the 'For you' chip, picked (S7-6)", async () => {
    await open();
    expect(
      document.querySelector('[data-pw="demo-search-chip-0"]')?.textContent,
      "the first chip is not 'For You'",
    ).toBe("For You");
    expect(
      document.querySelector('[data-pw="demo-search-chip-0"]')?.getAttribute("aria-pressed"),
      "the 'For you' chip is not picked",
    ).toBe("true");
    expect(
      document.querySelector('[data-pw="demo-search-chip-1"]'),
      "the file's 'Empty' chips must not be drawn",
    ).toBeNull();
  });

  it("writes the English placeholder in sentence style (D-4)", async () => {
    await open();
    expect(input().placeholder, "the placeholder is not in sentence style").toBe("Search anything…");
  });

  it("uses the server's words for another language", async () => {
    await open("sy-ar", { "Search anything…": "ابحث", "For you": "لك" });
    expect(input().placeholder, "the Arabic placeholder did not come from the dictionary").toBe("ابحث");
  });

  it("puts the old voice search in the Voice place, with its label and the design's mark", async () => {
    await open();
    const voice = document.querySelector('[data-pw="media-Voice Search"]');
    expect(voice, "the voice search is not in the header").not.toBeNull();
  });

  it("puts the old image search in the Scan place, with its label", async () => {
    await open();
    expect(
      document.querySelector('[data-pw="media-Scan"]'),
      "the image search is not in the header",
    ).not.toBeNull();
  });

  it("writes what the voice search heard into the field", async () => {
    await open();
    fireEvent.click(screen.getByRole("button", { name: "Voice Search" }));
    expect(input().value, "the heard words did not reach the search field").toBe("Voice Search words");
  });

  it("reads trending and the first state from the market backend when it opens", async () => {
    await open();
    await waitFor(() => expect(getTrendingSearch, "trending was not read when the search page opened").toHaveBeenCalled());
  });

  it("searches what the shopper types, after the wait, with the products asked for", async () => {
    vi.useFakeTimers();
    try {
      await open();
      GetSearchData.mockClear();
      fireEvent.change(input(), { target: { value: "dress" } });
      await act(async () => {
        vi.advanceTimersByTime(1600);
      });
      const call = GetSearchData.mock.calls.find((c) => c[0].filters.search_text === "dress");
      expect(call, "the typed word never reached the market backend's search").toBeDefined();
      expect(call![0].noProducts, "a typed search must ask for products").toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  // The old results body translates with the client translateFunction, which
  // answers English on the server (its cache is empty there) and the page's
  // language in the browser. Drawn on the server, an Arabic page showed
  // "Reset" in the HTML and "إعادة تعيين" in the browser: a hydration error.
  // The old overlay never rendered on the server, so it never met this.
  it("draws the results body only in the browser, with a skeleton in the server's HTML", () => {
    const html = renderToString(<AppSearch lang="sy-ar" dictionary={{}} />);
    expect(
      html.includes('data-pw="searchContainer"'),
      "the server drew the results body, whose words differ between server and browser",
    ).toBe(false);
    expect(
      html.includes('data-pw="search-results-skeleton"'),
      "the server's HTML has no skeleton where the results body comes",
    ).toBe(true);
  });

  it("draws the old results body in the page, not over the old header", async () => {
    await open();
    const box = document.querySelector('[data-pw="searchContainer"]') as HTMLElement;
    expect(box, "the results body is missing from the search page").not.toBeNull();
    expect(box.style.position, "the results body is not in the page's flow").toBe("relative");
  });
});
