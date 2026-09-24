import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";
import { routerSpies } from "../../../mocks/nextNavigation";

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

const showSuccessNotification = vi.fn();
vi.mock("store/notifications/reducer", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  showSuccessNotification: (...a: any[]) => showSuccessNotification(...a),
}));
const LogError = vi.fn();
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  LogError: (...a: any[]) => LogError(...a),
  onClickSearchHistory: (v: string) => [v, "older"],
}));
const scroll = vi.hoisted(() => ({ DisableScroll: vi.fn(), EnableScroll: vi.fn() }));
vi.mock("utils/tinyUtils", async (importOriginal) => ({ ...(await importOriginal<any>()), ...scroll }));

// ---- Children: each is its own unit, so here they only expose their callbacks
vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<any>, options: any) => {
    loader();
    return ({ setSearchValue }: any) => (
      <span>
        {options.loading()}
        <button onClick={() => setSearchValue("heard words")}>media value</button>
        <button onClick={() => setSearchValue("")}>media empty</button>
      </span>
    );
  },
}));
vi.mock("components/Home/Search/SearchVoice", () => ({ default: () => null }));
vi.mock("components/Home/Search/SearchImage", () => ({ default: () => null }));
vi.mock("components/skeleton/IconSkeleton", () => ({ default: () => <i data-testid="icon-skeleton" /> }));
vi.mock("components/Home/Search/SearchHistory", () => ({
  default: ({ options, setOptions, deleteOption }: any) => (
    <div data-testid="history" data-options={JSON.stringify(options)}>
      <button onClick={() => setOptions(options[0])}>history pick</button>
      <button onClick={() => deleteOption(options[0])}>history delete</button>
    </div>
  ),
}));
vi.mock("components/Home/Search/SearchTrending", () => ({
  default: ({ trending, setValue, clearAll }: any) => (
    <div data-testid="trending" data-count={trending.length}>
      <button onClick={() => setValue("trend word")}>trend pick</button>
      <button onClick={clearAll}>trend clear</button>
    </div>
  ),
}));
vi.mock("components/Home/Search/Results/ProductItem", () => ({
  default: ({ product, onClick }: any) => <button onClick={() => onClick(product.name)}>product {product.name}</button>,
}));
vi.mock("components/Home/Search/Results/BrandItem", () => ({
  default: ({ brand, onClick, isActive }: any) => (
    <button data-active={String(isActive)} onClick={onClick}>
      brand {brand.slug}
    </button>
  ),
}));
vi.mock("components/Home/Search/Results/BoutiqueItem", () => ({
  default: ({ boutique, onClick, isActive }: any) => (
    <button data-active={String(isActive)} onClick={onClick}>
      boutique {boutique.slug}
    </button>
  ),
}));
vi.mock("components/Home/Search/Results/CategoryItem", () => ({
  default: ({ category, onClick, isActive }: any) => (
    <span>
      <button data-active={String(isActive)} onClick={() => onClick(category)}>
        category {category.slug}
      </button>
      {category.childes?.map((c: any) => (
        <button key={c.slug} onClick={() => onClick(c)}>
          child {c.slug}
        </button>
      ))}
    </span>
  ),
}));
vi.mock("components/Home/Search/ActiveSearchFilterBar", () => ({
  default: ({ reset, appliedFilters }: any) => (
    <button data-filters={JSON.stringify(appliedFilters)} onClick={reset} data-testid="filter-bar">
      bar reset
    </button>
  ),
}));
vi.mock("components/global/HortiznalScrollBar", () => ({ default: ({ children }: any) => <div>{children}</div> }));
vi.mock("components/global/NextLink", () => ({
  default: ({ href, onClick, children }: any) => (
    <a
      href={href}
      data-testid="apply-search"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      {children}
    </a>
  ),
}));

import SearchIcon from "components/Home/Search/SearchIcon";

// ---- helpers -----------------------------------------------------------------
const input = () => document.querySelector<HTMLInputElement>('[data-pw="inputField"]')!;
const open = async () => {
  await act(async () => fireEvent.click(document.querySelector('[data-pw="searchIcon_mainPage"]')!));
};
/** Let the 1.5 s debounce run and every reply land. */
const settle = async (ms = 1600) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};
const type = async (text: string) => {
  fireEvent.change(input(), { target: { value: text } });
  await settle();
};
const filtersSent = () => GetSearchData.mock.calls.at(-1)![0].filters;
const filterBar = () => JSON.parse(screen.getByTestId("filter-bar").dataset.filters!);
const many = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => ({ slug: `${prefix}${i}` }));

const store = () => ({ setIsNavigating: vi.fn(), setEnableSearch: vi.fn() });

describe("SearchIcon", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    GetSearchData.mockReset().mockResolvedValue({ brands: [], categories: [], boutiques: [], products: [], total_size: 0 });
    GetSearchSuggestion.mockReset().mockResolvedValue({ suggestion: "" });
    getTrendingSearch.mockReset().mockResolvedValue({ popular_search_terms: [{ term: "shoes" }] });
    showSuccessNotification.mockReset();
    LogError.mockReset();
    scroll.DisableScroll.mockReset();
    scroll.EnableScroll.mockReset();
    localStorage.setItem("search-history", JSON.stringify(["bags"]));
  });
  afterEach(() => {
    vi.useRealTimers();
    localStorage.removeItem("search-history");
  });

  it("opens the overlay with history and trending words, and reads the initial results without products", async () => {
    const s = store();
    await renderWithProviders(<SearchIcon language="en" country="sy" />, { store: s });
    expect(input().disabled, "the closed search box took input").toBe(true);
    await open();
    await settle();
    expect(s.setEnableSearch, "the store was not told search is open").toHaveBeenCalledWith(true);
    expect(scroll.DisableScroll, "the page kept scrolling under the overlay").toHaveBeenCalled();
    expect(JSON.parse(screen.getByTestId("history").dataset.options!), "the stored history is not shown").toEqual(["bags"]);
    expect(screen.getByTestId("trending").dataset.count, "the trending words did not load").toBe("1");
    expect(GetSearchData.mock.calls[0][0].noProducts, "the first read asked for products").toBe(true);
    expect(screen.getAllByTestId("icon-skeleton").length > 0, "the image and voice buttons show no skeleton while loading").toBe(true);
    await open();
    expect(scroll.DisableScroll, "a second tap on the open bar locked the scroll again").toHaveBeenCalledTimes(1);
  });

  it("logs when the trending words cannot be read", async () => {
    getTrendingSearch.mockRejectedValue(new Error("core down"));
    await renderWithProviders(<SearchIcon language="en" country="sy" />, { store: store() });
    await open();
    await settle();
    expect(LogError.mock.calls.map((c) => c[0].scenario), "the failed trending read was not logged").toContain(
      "getInitialStaticData in SearchIcon",
    );
  });

  it("searches the typed word after the pause and shows the products and the analysis", async () => {
    GetSearchData.mockResolvedValue({ products: [{ product_id: 1, name: "Red shoe" }], total_size: 1, isAnalyzed: { a: 1 } });
    const { store: st } = await renderWithProviders(<SearchIcon language="en" country="sy" />, { store: store() });
    await open();
    await type("shoe");
    expect(filtersSent().search_text, "the typed word was not searched").toBe("shoe");
    expect(screen.getByText("product Red shoe"), "the product result is missing").toBeInTheDocument();
    expect(showSuccessNotification, "the analysis was not shown").toHaveBeenCalledWith('{"a":1}');
    expect(screen.getByTestId("apply-search").getAttribute("href"), "the Search button links to the wrong page").toBe(
      "/gb-en/filters?search=shoe",
    );
    fireEvent.click(screen.getByText("product Red shoe"));
    expect((st.getState() as any).setEnableSearch, "picking a product did not close search").toBeTruthy();
  });

  it("keeps only the newest search result when an older one lands later, and logs only the newest failure", async () => {
    let releaseOld: (v: any) => void = () => {};
    GetSearchData.mockImplementationOnce(() => Promise.resolve({ total_size: 0 })) // initial
      .mockImplementationOnce(() => new Promise((r) => (releaseOld = r)))
      .mockImplementationOnce(() => Promise.reject(new Error("new failed")));
    await renderWithProviders(<SearchIcon language="en" country="sy" />, { store: store() });
    await open();
    await settle();
    fireEvent.change(input(), { target: { value: "a" } });
    await settle();
    fireEvent.change(input(), { target: { value: "ab" } });
    await settle();
    await act(async () => releaseOld({ products: [{ product_id: 9, name: "Old" }], total_size: 1 }));
    expect(screen.queryByText("product Old"), "an older reply replaced the newer one").toBeNull();
    expect(LogError.mock.calls.map((c) => c[0].scenario), "the newest failure was not logged").toContain("performSearch in SearchIcon");
  });

  it("does not log a failure of a search that was already replaced", async () => {
    let failOld: (e: any) => void = () => {};
    GetSearchData.mockImplementationOnce(() => Promise.resolve({ total_size: 0 }))
      .mockImplementationOnce(() => new Promise((_r, rej) => (failOld = rej)))
      .mockImplementation(() => Promise.resolve({ total_size: 0 }));
    await renderWithProviders(<SearchIcon language="en" country="sy" />, { store: store() });
    await open();
    await settle();
    await type("a");
    await type("ab");
    await act(async () => failOld(new Error("old failed")));
    expect(LogError, "a replaced search's failure was logged").not.toHaveBeenCalled();
  });

  it("offers the rest of the word as grey text, accepted with Tab or with the right arrow at the end", async () => {
    GetSearchSuggestion.mockResolvedValue({ suggestion: "Shoes red" });
    await renderWithProviders(<SearchIcon language="ar" country="sy" />, { store: store() });
    await open();
    await type("sho");
    expect(screen.getByText("es red"), "the grey completion is missing").toBeInTheDocument();
    fireEvent.keyDown(input(), { key: "Tab", target: { selectionStart: 3, selectionEnd: 3 } });
    expect(input().value, "Tab did not accept the completion").toBe("shoes red");
    await type("sho");
    input().setSelectionRange(3, 3);
    fireEvent.keyDown(input(), { key: "ArrowRight" });
    expect(input().value, "the right arrow at the end did not accept the completion").toBe("shoes red");
    await type("sho");
    input().setSelectionRange(1, 1);
    fireEvent.keyDown(input(), { key: "ArrowRight" });
    expect(input().value, "the right arrow in the middle accepted the completion").toBe("sho");
  });

  it("clears the completion on a failed or empty suggestion, and ignores a replaced one", async () => {
    let releaseOld: (v: any) => void = () => {};
    let failOld: (e: any) => void = () => {};
    GetSearchSuggestion.mockImplementationOnce(() => new Promise((r) => (releaseOld = r)))
      .mockImplementationOnce(() => new Promise((_r, rej) => (failOld = rej)))
      .mockImplementationOnce(() => Promise.reject(new Error("suggest down")))
      .mockResolvedValue(null);
    await renderWithProviders(<SearchIcon language="en" country="sy" />, { store: store() });
    await open();
    await type("a");
    await type("ab");
    await act(async () => releaseOld({ suggestion: "abandon" }));
    await act(async () => failOld(new Error("old")));
    expect(screen.queryByText("andon"), "a replaced suggestion was shown").toBeNull();
    expect(LogError.mock.calls.map((c) => c[0].scenario), "the newest suggestion failure was not logged").toEqual([
      "fetchSuggestion in SearchIcon",
    ]);
    await type("abc");
    expect(document.querySelector('[aria-hidden="true"].absolute'), "an empty suggestion drew grey text").toBeNull();
  });

  it("opens the filter page with the chosen filters on Enter", async () => {
    GetSearchData.mockResolvedValue({
      brands: [{ slug: "nike" }],
      categories: [{ slug: "shoes" }],
      boutiques: [{ slug: "mona" }],
      total_size: 3,
    });
    const s = store();
    await renderWithProviders(<SearchIcon language="en" country="sy" />, { store: s });
    await open();
    await type("run");
    fireEvent.click(screen.getByText("brand nike"));
    fireEvent.click(screen.getByText("category shoes"));
    fireEvent.click(screen.getByText("boutique mona"));
    fireEvent.keyDown(input(), { key: "Enter" });
    const pushed: string = routerSpies.push.mock.calls[0][0];
    expect(pushed.startsWith("/gb-en/filters/"), "Enter did not open the filter page").toBe(true);
    for (const part of ["boutiques/mona", "categories/shoes", "brands/nike", "?search=run"]) {
      expect(pushed, `the filter page address is missing ${part}`).toContain(part);
    }
    fireEvent.click(screen.getByText("category shoes"));
    fireEvent.click(screen.getByText("boutique mona"));
    expect(s.setIsNavigating, "the page change was not announced").toHaveBeenCalledWith({ is_boutique: true });
    fireEvent.change(input(), { target: { value: "  " } });
    fireEvent.click(screen.getByText("brand nike"));
    fireEvent.keyDown(input(), { key: "Enter" });
    expect(routerSpies.push, "Enter with no word and no filter did not open the plain filter page").toHaveBeenLastCalledWith("/gb-en/filters");
    fireEvent.keyDown(input(), { key: "a" });
    expect(routerSpies.push, "a letter key opened a page").toHaveBeenCalledTimes(2);
  });

  it("adds and removes brand, boutique and category filters, and a parent replaces its children", async () => {
    GetSearchData.mockResolvedValue({
      brands: [{ slug: "nike" }],
      boutiques: [{ slug: "mona" }],
      categories: [{ slug: "shoes", childes: [{ slug: "boots" }] }, { slug: "hats" }],
      total_size: 4,
    });
    await renderWithProviders(<SearchIcon language="en" country="sy" />, { store: store() });
    await open();
    await type("x");
    fireEvent.click(screen.getByText("brand nike"));
    fireEvent.click(screen.getByText("boutique mona"));
    expect(filterBar().brands.map((b: any) => b.slug), "the brand filter was not added").toEqual(["nike"]);
    expect(screen.getByText("boutique mona").dataset.active, "the chosen boutique is not marked").toBe("true");
    fireEvent.click(screen.getByText("child boots"));
    expect(filterBar().categories.map((c: any) => c.slug), "the child category was not added").toEqual(["boots"]);
    fireEvent.click(screen.getByText("category shoes"));
    expect(filterBar().categories.map((c: any) => c.slug), "the parent did not replace its child").toEqual(["shoes"]);
    fireEvent.click(screen.getByText("child boots"));
    expect(filterBar().categories.map((c: any) => c.slug), "the child did not replace its parent").toEqual(["boots"]);
    fireEvent.click(screen.getByText("category hats"));
    fireEvent.click(screen.getByText("category hats"));
    fireEvent.click(screen.getByText("brand nike"));
    expect(filterBar().brands, "a second tap did not remove the brand").toEqual([]);
    await settle();
    expect(filtersSent().categories, "the search did not send the category slugs").toEqual(["boots"]);
    expect(filtersSent().boutiques, "the search did not send the boutique slugs").toEqual(["mona"]);
  });

  it("ignores a filter tap while a search is still loading", async () => {
    GetSearchData.mockResolvedValue({ brands: [{ slug: "nike" }], total_size: 1 });
    await renderWithProviders(<SearchIcon language="en" country="sy" />, { store: store() });
    await open();
    await settle();
    GetSearchData.mockImplementation(() => new Promise(() => {}));
    fireEvent.change(input(), { target: { value: "x" } });
    await settle();
    fireEvent.click(screen.getByText("brand nike"));
    expect(filterBar().brands, "a tap during loading changed the filters").toEqual([]);
  });

  it("shows related categories for an active category, and lets one be added", async () => {
    GetSearchData.mockResolvedValue({
      categories: [{ slug: "shoes" }],
      related_categories: [
        { slug: "boots", name: "Boots", realted: ["shoes"], flat_photo_path: { file_path: "b.png" } },
        { slug: "", icon: "i.png", realted: ["shoes"] },
        { slug: "hats", realted: ["other"] },
      ],
      total_size: 2,
    });
    await renderWithProviders(<SearchIcon language="ku" country="iq" />, { store: store() });
    await open();
    await type("x");
    expect(document.querySelector('[data-pw="ContainerOfRelatedCategories"]'), "related shown with no active category").toBeNull();
    fireEvent.click(screen.getByText("category shoes"));
    await settle();
    const related = document.querySelector('[data-pw="ContainerOfRelatedCategories"]')!;
    expect(related.textContent, "the related category is missing").toContain("Boots");
    expect(related.textContent, "an unrelated category was shown").not.toContain("hats");
    fireEvent.click(screen.getByText("Boots"));
    expect(filterBar().categories.map((c: any) => c.slug), "tapping a related category did not add it").toEqual(["shoes", "boots"]);
  });

  it("hides related categories when none relate to the active category", async () => {
    GetSearchData.mockResolvedValue({ categories: [{ slug: "shoes" }], related_categories: [{ slug: "hats", realted: [] }], total_size: 1 });
    await renderWithProviders(<SearchIcon language="en" country="sy" />, { store: store() });
    await open();
    await type("x");
    fireEvent.click(screen.getByText("category shoes"));
    await settle();
    expect(document.querySelector('[data-pw="ContainerOfRelatedCategories"]'), "an empty related section was drawn").toBeNull();
  });

  it.each(["brands", "categories", "boutiques"] as const)("loads more %s and hides Load More when a short page comes back", async (kind) => {
    GetSearchData.mockResolvedValue({ [kind]: many("a", 10), total_size: 10 });
    await renderWithProviders(<SearchIcon language="en" country="sy" />, { store: store() });
    await open();
    await type("x");
    let finish: (v: any) => void = () => {};
    GetSearchData.mockImplementationOnce(() => new Promise((r) => (finish = r)));
    fireEvent.click(screen.getByText("Load More"));
    expect(screen.queryByText("Load More"), "Load More stayed while loading").toBeNull();
    await act(async () => finish({ [kind]: many("b", 3) }));
    expect(GetSearchData.mock.calls.at(-1)![0].filters_offset, "the next page was not asked for").toBe(2);
    expect(screen.queryByText("Load More"), "Load More stayed after the last page").toBeNull();
  });

  it("keeps Load More after a full page, and logs a failed page", async () => {
    GetSearchData.mockResolvedValue({ brands: many("a", 10), total_size: 10 });
    await renderWithProviders(<SearchIcon language="en" country="sy" />, { store: store() });
    await open();
    await type("x");
    GetSearchData.mockResolvedValueOnce({ brands: many("b", 10) });
    await act(async () => fireEvent.click(screen.getByText("Load More")));
    expect(screen.getByText("Load More"), "Load More went away after a full page").toBeInTheDocument();
    GetSearchData.mockResolvedValueOnce({});
    await act(async () => fireEvent.click(screen.getByText("Load More")));
    GetSearchData.mockResolvedValue({ brands: many("a", 10), total_size: 10 });
    await type("y");
    GetSearchData.mockRejectedValueOnce(new Error("page failed"));
    await act(async () => fireEvent.click(screen.getByText("Load More")));
    expect(LogError.mock.calls.map((c) => c[0].scenario), "a failed page was not logged").toContain("handleLoadMore in SearchIcon");
  });

  it("offers the Search button with the count, closes on it, and resets everything", async () => {
    GetSearchData.mockResolvedValue({ products: [], total_size: 7 });
    await renderWithProviders(<SearchIcon language="en" country="sy" />, { store: store() });
    await open();
    await type("x");
    expect(screen.getByText(/Total Products:/).textContent, "the product count is missing").toContain("7");
    fireEvent.click(screen.getByTestId("apply-search"));
    expect(document.querySelector('[data-pw="searchContainer"]'), "the Search button did not close the overlay").toBeNull();
  });

  it("shows a loading Search button while searching", async () => {
    GetSearchData.mockResolvedValue({ total_size: 3 });
    await renderWithProviders(<SearchIcon language="en" country="sy" />, { store: store() });
    await open();
    await type("x");
    GetSearchData.mockImplementation(() => new Promise(() => {}));
    fireEvent.change(input(), { target: { value: "xy" } });
    await settle();
    expect(document.querySelector('div[data-pw="apply-filters-search"]'), "no loading Search button while searching").not.toBeNull();
    expect(document.querySelector('[data-pw="ContainerOfBrands"]'), "no brand spinner while searching").not.toBeNull();
  });

  it("resets the word and the filters from both reset controls", async () => {
    GetSearchData.mockResolvedValue({ brands: [{ slug: "nike" }], total_size: 0 });
    await renderWithProviders(<SearchIcon language="en" country="sy" />, { store: store() });
    await open();
    await type("x");
    fireEvent.click(screen.getByText("brand nike"));
    fireEvent.click(document.querySelector('[data-pw="reset-filters-search"]')!);
    expect(input().value, "Reset left the word").toBe("");
    expect(filterBar().brands, "Reset left the filters").toEqual([]);
    fireEvent.change(input(), { target: { value: "x" } });
    fireEvent.click(screen.getByText("bar reset"));
    expect(input().value, "the filter bar reset left the word").toBe("");
  });

  it("uses history, trending and media answers as the search word, and deletes a history word", async () => {
    await renderWithProviders(<SearchIcon language="en" country="sy" />, { store: store() });
    await open();
    fireEvent.click(screen.getByText("history delete"));
    expect(JSON.parse(localStorage.getItem("search-history")!), "the deleted word stayed in storage").toEqual([]);
    fireEvent.click(screen.getByText("trend clear"));
    expect(input().value, "clearing trending put something in the box").toBe("");
    fireEvent.click(screen.getAllByText("media empty")[0]);
    expect(input().value, "an empty media answer changed the box").toBe("");
    fireEvent.click(screen.getAllByText("media value")[0]);
    expect(input().value, "the picture answer did not fill the box").toBe("heard words");
    fireEvent.click(document.querySelector('[data-pw="SearchInputCloseIcon"]')!);
    fireEvent.click(screen.getAllByText("media empty")[1]);
    fireEvent.click(screen.getAllByText("media value")[1]);
    expect(input().value, "the voice answer did not fill the box").toBe("heard words");
    fireEvent.click(document.querySelector('[data-pw="SearchInputCloseIcon"]')!);
    fireEvent.click(screen.getByText("trend pick"));
    expect(input().value, "a trending word did not fill the box").toBe("trend word");
  });

  it("picks a history word", async () => {
    await renderWithProviders(<SearchIcon language="en" country="sy" />, { store: store() });
    await open();
    fireEvent.click(screen.getByText("history pick"));
    expect(input().value, "a history word did not fill the box").toBe("bags");
  });

  it("clears the word from the X first, then closes the overlay", async () => {
    await renderWithProviders(<SearchIcon language="en" country="sy" />, { store: store() });
    await open();
    fireEvent.focus(input());
    expect(document.querySelector('[data-pw="closeIcon_searchPage"]'), "the side close icon showed while typing").toBeNull();
    fireEvent.change(input(), { target: { value: "x" } });
    fireEvent.blur(input());
    fireEvent.click(document.querySelector('[data-pw="SearchInputCloseIcon"]')!);
    expect(input().value, "the X did not clear the word").toBe("");
    fireEvent.click(document.querySelector('[data-pw="SearchInputCloseIcon"]')!);
    expect(document.querySelector('[data-pw="searchContainer"]'), "the X on an empty box did not close").toBeNull();
    expect(scroll.EnableScroll, "closing did not give the page its scroll back").toHaveBeenCalled();
  });

  it("closes from the side close icon when the box is empty and not focused", async () => {
    await renderWithProviders(<SearchIcon language="en" country="sy" />, { store: store() });
    await open();
    fireEvent.focus(input());
    fireEvent.blur(input());
    fireEvent.click(document.querySelector('[data-pw="closeIcon_searchPage"]')!);
    expect(document.querySelector('[data-pw="searchContainer"]'), "the side close icon did not close").toBeNull();
  });

  it("opens with no stored history", async () => {
    localStorage.removeItem("search-history");
    await renderWithProviders(<SearchIcon language="en" country="sy" />, { store: store() });
    await open();
    expect(screen.queryByTestId("history"), "an empty history was drawn").toBeNull();
  });

  // BUG-home-7: SearchIcon.tsx:323-331 — handleLoadMore sends
  // `filters: { ...appliedFilters, search_text }`, the raw filter OBJECTS. The
  // first page (performSearch, line 176) sends `normalizeFilters(...)`, the
  // slugs. So "Load More" with any active filter asks the market backend with a
  // different, wrong filter shape.
  it("BUG-home-7: Load More sends filter slugs, like the first page", async () => {
    GetSearchData.mockResolvedValue({ brands: [{ slug: "nike" }, ...many("a", 9)], total_size: 10 });
    await renderWithProviders(<SearchIcon language="en" country="sy" />, { store: store() });
    await open();
    await type("x");
    fireEvent.click(screen.getByText("brand nike"));
    await settle();
    GetSearchData.mockResolvedValueOnce({ brands: [] });
    await act(async () => fireEvent.click(screen.getByText("Load More")));
    expect(filtersSent().brands, "Load More must send the brand slugs, like the first page").toEqual(["nike"]);
  });

  // BUG-home-8: SearchIcon.tsx:822-823 — the related-categories row filters with
  // `!applied_filter.categories.includes(s.slug)`, but applied categories are
  // objects, not slugs. `includes` is always false, so a related category the
  // shopper already added is still offered, and a second tap removes it.
  it("BUG-home-8: a related category already in the filter is not offered again", async () => {
    GetSearchData.mockResolvedValue({
      categories: [{ slug: "shoes" }],
      related_categories: [{ slug: "boots", name: "Boots", realted: ["shoes"] }],
      total_size: 2,
    });
    await renderWithProviders(<SearchIcon language="en" country="sy" />, { store: store() });
    await open();
    await type("x");
    fireEvent.click(screen.getByText("category shoes"));
    await settle();
    fireEvent.click(screen.getByText("Boots"));
    await settle();
    expect(screen.queryByText("Boots"), "a related category that is already applied must not be offered again").toBeNull();
  });
});
