// The compare page: two search boxes and a table that puts two products side
// by side. The products come from the market backend (globalDetails +
// qtyPriceDetails, through fetchData) and the search goes to our own
// /api/products/searchInCatalog route.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const jar = vi.hoisted(() => ({
  values: {} as Record<string, string>,
  set: vi.fn(),
  del: vi.fn(),
}));
const spies = vi.hoisted(() => ({ logError: vi.fn(), notifyError: vi.fn() }));
const backend = vi.hoisted(() => ({
  products: {} as Record<string, any>,
  qtyFails: new Set<string>(),
  hold: null as null | Promise<void>,
}));

vi.mock("utils/cookies/cookie-manager", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  getCookie: (name: string) => jar.values[name] ?? null,
  setCookie: (name: string, value: string) => {
    jar.set(name, value);
    jar.values[name] = value;
  },
  deleteCookie: (name: string) => {
    jar.del(name);
    delete jar.values[name];
  },
}));
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  LogError: spies.logError,
}));
vi.mock("store/notifications/reducer", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  showErrorNotification: spies.notifyError,
}));
vi.mock("components/global/NextLink", () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));
vi.mock("utils/fetchData", () => ({
  fetchData: vi.fn(async ({ url }: { url: string }) => {
    if (backend.hold) await backend.hold;
    const slug = url.split("/").pop()!.split("?")[0];
    const product = backend.products[slug];
    if (!product) return { success: false, message: "not found" };
    if (url.includes("/globalDetails/")) {
      const { price, ...rest } = product;
      return { success: true, data: rest };
    }
    if (backend.qtyFails.has(slug)) return { success: false };
    return { success: true, data: { price: product.price } };
  }),
}));

import ComparePage from "components/global/compare";
import { fetchData } from "utils/fetchData";

import { renderWithProviders, screen, userEvent, waitFor, within } from "../../render";

const shirt = {
  name: "Shirt",
  slug: "shirt",
  price: 10,
  offer_price: 8,
  images: [{ file_path: "s.jpg" }],
  colors: [{ option: "red", code: "#ff0000", name: "Red" }],
  sizes: ["M", "L"],
  details: "<b>Cotton</b>",
};
const hat = {
  name: "Hat",
  slug: "hat",
  price: 5,
  sync_color_images: [{ images: [{ file_path: "h.jpg" }] }],
  colors: [{ code: "#0000ff", name: "Blue" }],
  details: [{ title: "Material", value: "Wool" }],
};
const cap = { name: "Cap", slug: "cap", price: 3 };

const cell = (row: string, slot: 1 | 2) =>
  document.querySelector(`[data-pw="compare-row-${row}"] [data-pw="compare-cell-${slot}"]`) as HTMLElement;
const box = (slot: 1 | 2) =>
  document.querySelector(`[data-pw="compare-search-${slot}-input"]`) as HTMLInputElement;

const searchReply = vi.fn();

beforeEach(() => {
  jar.values = {};
  jar.set.mockClear();
  jar.del.mockClear();
  spies.logError.mockClear();
  spies.notifyError.mockClear();
  backend.products = { shirt, hat, cap };
  backend.qtyFails = new Set();
  backend.hold = null;
  vi.mocked(fetchData).mockClear();
  searchReply.mockReset();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: any) => searchReply(url, init)),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const open = (search = "", options: Record<string, any> = {}) =>
  renderWithProviders(<ComparePage />, {
    path: "/compare",
    search,
    country: "sy",
    store: { isNavigating: true, currency: { symbol: "SYP" } },
    ...options,
  });

describe("the compare page", () => {
  it("loads both products named in the address and puts them side by side", async () => {
    const { store } = await open("f_p=shirt&s_p=hat");

    expect(store.getState().isNavigating, "the page must clear the navigation loader once it mounts").toBe(false);
    await waitFor(() => expect(within(cell("name", 1)).getByText("Shirt"), "product 1 was not loaded from the market backend").toBeInTheDocument());
    await waitFor(() => expect(within(cell("name", 2)).getByText("Hat"), "product 2 was not loaded from the market backend").toBeInTheDocument());

    expect(within(cell("name", 1)).getByText("Shirt").closest("a"), "the name must link to the product page").toHaveAttribute(
      "href",
      "/sy-en/products/shirt",
    );
    expect(cell("image", 1).querySelector("img"), "product 1 must show its picture").toHaveAttribute("alt", "Shirt");
    expect(cell("image", 2).querySelector("img"), "product 2 must show its colour picture").toHaveAttribute("alt", "Hat");
    expect(cell("colors", 1).querySelector('[title="Red"]'), "product 1 must show its red colour").toBeInTheDocument();
    expect(cell("colors", 2).querySelector('[title="Blue"]'), "product 2 must show its blue colour").toBeInTheDocument();
    expect(cell("sizes", 1), "product 1 must list its sizes").toHaveTextContent("ML");
    expect(cell("sizes", 2), "a product with no sizes must show a dash").toHaveTextContent("-");
    expect(cell("price", 1), "the price must show with the shopper's currency").toHaveTextContent("SYP");
    expect(cell("offer_price", 1), "an offer price must be shown").toHaveTextContent("SYP");
    expect(cell("offer_price", 2), "a product with no offer must show a dash").toHaveTextContent("-");
    expect(cell("details", 1).querySelector("b"), "string details must be shown as sanitised HTML").toHaveTextContent("Cotton");
    expect(cell("details", 2), "list details must show title and value").toHaveTextContent("Material:Wool");

    expect(jar.set, "product 1 must be remembered in the f_p cookie").toHaveBeenCalledWith("f_p", "shirt");
    expect(jar.set, "product 2 must be remembered in the s_p cookie").toHaveBeenCalledWith("s_p", "hat");
    expect(window.location.search, "the address must keep both products").toContain("f_p=shirt");
    expect(window.location.search, "the address must keep both products").toContain("s_p=hat");
    expect(box(1).value, "search box 1 must show the loaded product").toBe("Shirt");
  });

  it("loads only product 1 when only it is in the address", async () => {
    await open("f_p=cap");
    await waitFor(() => expect(within(cell("name", 1)).getByText("Cap"), "product 1 was not loaded").toBeInTheDocument());
    expect(cell("name", 2), "slot 2 must stay empty").toHaveTextContent("-");
    expect(cell("details", 1), "a product with no details must show a dash").toHaveTextContent("-");
    expect(cell("price", 1), "the price must show with the shopper's currency").toHaveTextContent("SYP");
  });

  it("loads only product 2 when only it is in the address, with a dollar sign when no currency is set", async () => {
    await open("s_p=cap", { store: { isNavigating: true, currency: null } });
    await waitFor(() => expect(within(cell("name", 2)).getByText("Cap"), "product 2 was not loaded").toBeInTheDocument());
    expect(cell("price", 2), "with no currency set the price must use '$'").toHaveTextContent("$");
    expect(cell("name", 1), "slot 1 must stay empty").toHaveTextContent("-");
  });

  it("brings back both products from the cookies when the address names none", async () => {
    jar.values = { f_p: "shirt", s_p: "hat" };
    await open();
    await waitFor(() => expect(within(cell("name", 1)).getByText("Shirt"), "product 1 was not restored from its cookie").toBeInTheDocument());
    await waitFor(() => expect(within(cell("name", 2)).getByText("Hat"), "product 2 was not restored from its cookie").toBeInTheDocument());
  });

  it("brings back product 2 alone from its cookie", async () => {
    jar.values = { s_p: "hat" };
    await open();
    await waitFor(() => expect(within(cell("name", 2)).getByText("Hat"), "product 2 was not restored from its cookie").toBeInTheDocument());
    expect(cell("name", 1), "slot 1 must stay empty").toHaveTextContent("-");
  });

  it("shows an empty table when nothing is in the address or the cookies", async () => {
    await open();
    expect(cell("name", 1), "slot 1 must be empty").toHaveTextContent("-");
    expect(cell("name", 2), "slot 2 must be empty").toHaveTextContent("-");
    expect(fetchData, "no product must be asked for").not.toHaveBeenCalled();
  });

  it("shows a loading cell while a product is on its way", async () => {
    let release = () => {};
    backend.hold = new Promise<void>((resolve) => (release = resolve));
    await open("f_p=shirt");
    expect(cell("name", 1).querySelector('[data-pw="compare-cell-loading"]'), "a loading row must show while product 1 loads").toBeInTheDocument();
    release();
    await waitFor(() => expect(within(cell("name", 1)).getByText("Shirt"), "product 1 did not replace the loading row").toBeInTheDocument());
  });

  it("drops a product the market backend does not know and tells the shopper", async () => {
    jar.values = { f_p: "gone" };
    await open("f_p=gone&s_p=missing");

    await waitFor(() => expect(spies.notifyError, "the shopper must be told a product was not found").toHaveBeenCalledTimes(2));
    expect(jar.del, "the dead product 1 must be removed from its cookie").toHaveBeenCalledWith("f_p");
    expect(jar.del, "the dead product 2 must be removed from its cookie").toHaveBeenCalledWith("s_p");
    expect(window.location.search, "the dead products must be removed from the address").not.toContain("gone");
    expect(window.location.search, "the dead products must be removed from the address").not.toContain("missing");
    expect(spies.logError, "the failed load must be logged").toHaveBeenCalledWith(
      expect.objectContaining({ scenario: "GetProductData in Compare Page", slug: "gone" }),
    );
  });

  it("drops a product whose live price cannot be read", async () => {
    backend.qtyFails.add("shirt");
    await open("f_p=shirt");
    await waitFor(() => expect(spies.notifyError, "a product with no live price must be reported as not found").toHaveBeenCalled());
    expect(cell("name", 1), "the product must not be shown").toHaveTextContent("-");
  });

  it("finds products by search and loads the picked one into slot 2", async () => {
    searchReply.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          products: [
            { name: "Hat", slug: "hat", price: 5, sync_color_images: [{ images: [{ file_path: "h.jpg" }] }] },
            { name: "Cap", slug: "cap", price: 3, images: [{ file_path: "c.jpg" }] },
            { name: "Shirt", slug: "shirt", price: 10, thumbnail: { file_path: "t.jpg" } },
            { name: "Sock", slug: "sock", price: 1 },
          ],
        },
      }),
    });
    await open();

    await userEvent.type(box(2), "ha");
    await waitFor(() => expect(screen.getAllByText("Hat").length > 0, "the search results never showed").toBe(true), { timeout: 2000 });

    const [url, init] = searchReply.mock.calls[0];
    expect(searchReply, "two quick key presses must lead to one search, not two").toHaveBeenCalledTimes(1);
    expect(url, "the search must send the typed text").toContain("search_text=ha");
    expect(init.headers, "the search must send the page's country and language").toEqual({ country: "sy", language: "en" });
    expect(screen.getByAltText("Cap"), "a result with a plain picture must show it").toBeInTheDocument();
    expect(screen.getByAltText("Shirt"), "a result with only a thumbnail must show it").toBeInTheDocument();
    expect(screen.queryByAltText("Sock"), "a result with no picture must not draw a broken image").toBeNull();

    await userEvent.click(within(document.querySelector('[data-pw="compare-search-2-options"]') as HTMLElement).getByText("Cap"));
    await waitFor(() => expect(within(cell("name", 2)).getByText("Cap"), "the picked product was not loaded into slot 2").toBeInTheDocument());
    expect(jar.set, "the picked product must be remembered in the s_p cookie").toHaveBeenCalledWith("s_p", "cap");
  });

  it("shows no results when the search route fails, answers with nothing, or answers badly", async () => {
    await open();

    searchReply.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    await userEvent.type(box(1), "x");
    await waitFor(() => expect(spies.logError, "a failed search must be logged").toHaveBeenCalledWith(
      expect.objectContaining({ scenario: "searchFunction in Compare Page" }),
    ), { timeout: 2000 });

    searchReply.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    await userEvent.type(box(1), "y");
    await waitFor(() => expect(searchReply, "the second search never ran").toHaveBeenCalledTimes(2), { timeout: 2000 });

    searchReply.mockResolvedValueOnce({ ok: true, json: async () => ({ data: { products: "bad" } }) });
    await userEvent.type(box(1), "z");
    await waitFor(() => expect(spies.logError, "a search answer that is not a list must be logged").toHaveBeenCalledWith(
      expect.objectContaining({ scenario: "debouncedChangeHandler in Compare Page" }),
    ), { timeout: 2000 });
    await waitFor(() => expect(document.querySelector('[data-pw="compare-search-1-no-options"]'), "a failed search must show no results").toHaveTextContent("No options found"));
  });

  it("does not search for spaces only", async () => {
    await open();
    await userEvent.type(box(1), "  ");
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(searchReply, "a box holding only spaces must not reach the search route").not.toHaveBeenCalled();
  });

  it("empties each slot with its cross and forgets it in the cookie and the address", async () => {
    await open("f_p=shirt&s_p=hat");
    await waitFor(() => expect(within(cell("name", 2)).getByText("Hat"), "product 2 was not loaded").toBeInTheDocument());
    await waitFor(() => expect(within(cell("name", 1)).getByText("Shirt"), "product 1 was not loaded").toBeInTheDocument());

    await userEvent.click(document.querySelector('[data-pw="compare-search-1-clear"]') as HTMLElement);
    expect(cell("name", 1), "clearing slot 1 must empty its column").toHaveTextContent("-");
    expect(jar.del, "clearing slot 1 must forget its cookie").toHaveBeenCalledWith("f_p");
    expect(window.location.search, "clearing slot 1 must remove it from the address").not.toContain("f_p");

    await userEvent.click(document.querySelector('[data-pw="compare-search-2-clear"]') as HTMLElement);
    expect(cell("name", 2), "clearing slot 2 must empty its column").toHaveTextContent("-");
    expect(jar.del, "clearing slot 2 must forget its cookie").toHaveBeenCalledWith("s_p");
    expect(window.location.search, "clearing slot 2 must remove it from the address").not.toContain("s_p");
  });

  it("lays the table out right to left in Arabic", async () => {
    await open("", { language: "ar" });
    expect(document.querySelector('[data-pw="compare-table"]'), "an Arabic compare table must be right-to-left").toHaveAttribute("dir", "rtl");
  });

  it(
    "BUG-global-100: a product whose sync_color_images list is empty still loads",
    async () => {
      backend.products = { ...backend.products, bare: { ...cap, slug: "bare", name: "Bare", sync_color_images: [] } };
      await open("f_p=bare");
      await waitFor(() => expect(within(cell("name", 1)).getByText("Bare"), "a product with an empty colour-image list must still load into slot 1").toBeInTheDocument());
      expect(spies.notifyError, "a product that exists must not be reported as not found").not.toHaveBeenCalled();
    },
  );
});
