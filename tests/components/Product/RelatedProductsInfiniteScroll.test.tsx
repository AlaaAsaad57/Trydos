// "Show More" at the end of the related-products row on a product page. Each
// tap loads the next page (3 products), shows only products not shown before,
// and stops at the end of the list.
import { beforeEach, describe, expect, it, vi } from "vitest";

const GetRelatedProducts = vi.fn();

vi.mock("serverRequests/listing", () => ({
  GetRelatedProducts: (...args: any[]) => GetRelatedProducts(...args),
}));
vi.mock("components/products/ProductCard", () => ({
  default: ({ product }: any) => <div data-pw="card">{product.name}</div>,
}));

import RelatedProductsInfiniteScroll from "components/Product/RelatedProductsInfiniteScroll";

import { renderWithProviders, screen, userEvent, waitFor } from "../../render";

const page = (ids: (number | undefined)[], offset: number[], pit_id: string | null = "pit-2") => ({
  products: ids.map((id) => ({ product_id: id, name: `P${id}` })),
  productIds: ids,
  offset,
  pit_id,
});

const cards = () => Array.from(document.querySelectorAll('[data-pw="card"]')).map((c) => c.textContent);
const showMore = () => userEvent.click(screen.getByText("Show More"));

const renderRow = (props: Record<string, any> = {}) =>
  renderWithProviders(
    <RelatedProductsInfiniteScroll productId={9} currency="$" offset={[1]} pit_id="pit-1" {...props} />,
  );

describe("the related-products Show More", () => {
  beforeEach(() => {
    GetRelatedProducts.mockReset();
  });

  it("loads the next page with the product, cursor and snapshot id", async () => {
    GetRelatedProducts.mockResolvedValue(page([1, 2, 3], [4]));
    await renderRow();
    await showMore();
    await waitFor(() => expect(cards(), "the next three products should be added").toEqual(["P1", "P2", "P3"]));
    expect(GetRelatedProducts, "the page must be asked for this product from the server's cursor").toHaveBeenCalledWith(
      expect.objectContaining({ productId: 9, offset: [1], pit_id: "pit-1", country: "gb", language: "en" }),
    );
    expect(screen.getByText("Show More"), "a full page means more may follow").toBeInTheDocument();
  });

  it("leaves out products already shown and stops on a short page", async () => {
    GetRelatedProducts.mockResolvedValue({ ...page([1, 5], [4], null), productIds: [1, 5, undefined] });
    await renderRow({ initialProductIds: ["1"], pit_id: null });
    await showMore();
    await waitFor(() => expect(screen.getByText("Reach End"), "a short page means the end").toBeInTheDocument());
    expect(cards(), "only the product not shown before, with an id, should be added").toEqual(["P5"]);
  });

  it("stops when the cursor does not move", async () => {
    GetRelatedProducts.mockResolvedValue(page([7, 8, 9], [1]));
    await renderRow();
    await showMore();
    await waitFor(() => expect(screen.getByText("Reach End"), "an unchanged cursor means the end").toBeInTheDocument());
  });

  it("stops when the backend sends no cursor back", async () => {
    GetRelatedProducts.mockResolvedValue({ products: [], productIds: undefined, offset: undefined });
    await renderRow();
    await showMore();
    await waitFor(() => expect(screen.getByText("Reach End"), "an empty page means the end").toBeInTheDocument());
  });

  it("treats a cursor of another length as a new cursor", async () => {
    GetRelatedProducts.mockResolvedValue(page([1, 2, 3], [4, 5]));
    await renderRow();
    await showMore();
    await waitFor(() => expect(cards(), "a longer cursor is still a new page").toEqual(["P1", "P2", "P3"]));
    expect(screen.getByText("Show More"), "more may follow").toBeInTheDocument();
  });

  it("fetches on by itself past a full page of repeats, then gives up after five", async () => {
    let n = 0;
    GetRelatedProducts.mockImplementation(async () => page([1, 2, 3], [++n + 10]));
    await renderRow({ initialProductIds: ["1", "2", "3"] });
    await showMore();
    await waitFor(() => expect(screen.getByText("Reach End"), "five pages of repeats should end the row").toBeInTheDocument());
    expect(GetRelatedProducts, "the row should try exactly five pages of repeats").toHaveBeenCalledTimes(5);
    expect(cards(), "repeats must never be shown").toEqual([]);
  });

  it("resets the repeat count after a page with something new", async () => {
    GetRelatedProducts.mockResolvedValueOnce(page([1, 2, 3], [11]))
      .mockResolvedValueOnce(page([4, 5, 6], [12]));
    await renderRow({ initialProductIds: ["1", "2", "3"] });
    await showMore();
    await waitFor(() => expect(cards(), "the next new products should load by themselves").toEqual(["P4", "P5", "P6"]));
  });

  it("ignores a tap while a page is loading", async () => {
    GetRelatedProducts.mockReturnValue(new Promise(() => {}));
    const { container } = await renderRow();
    const button = container.querySelector(".product-container") as HTMLElement;
    await userEvent.click(button);
    await userEvent.click(button);
    expect(GetRelatedProducts, "a second tap during a load must not load again").toHaveBeenCalledTimes(1);
  });

  it("tries again three seconds after the backend answered with nothing", async () => {
    GetRelatedProducts.mockResolvedValueOnce(undefined).mockResolvedValueOnce(page([3, 4, 5], [2]));
    await renderRow();
    await showMore();
    await waitFor(() => expect(cards(), "the retry should load the products").toEqual(["P3", "P4", "P5"]), {
      timeout: 6000,
    });
  });

  it("BUG-server-31: stops retrying once the row has left the page", async () => {
    GetRelatedProducts.mockResolvedValue(undefined);
    const { unmount } = await renderRow();
    await showMore();
    await waitFor(() => expect(GetRelatedProducts, "the first load should run").toHaveBeenCalledTimes(1));
    unmount();
    await new Promise((r) => setTimeout(r, 3300));
    expect(
      GetRelatedProducts,
      "a row that is no longer on the page must not keep asking the backend every 3 seconds",
    ).toHaveBeenCalledTimes(1);
  });
});
