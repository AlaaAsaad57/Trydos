// The product page's story row borrows the shared story list.
//
// `store.storiesData` is one key, and two different lists use it: the home
// stories bar and this row. ProductStories writes its own stories there on
// mount, because the store helpers the story viewer uses — SelectStory, next,
// previous, watchStory — all read that key.
//
// A product opens as an INTERCEPTED MODAL over the homepage, so the home bar is
// still mounted underneath while this row holds the key. Whatever this row
// borrows, it has to give back when it goes — otherwise the home bar is left
// showing the product's stories, or is repaired by a route-change reset that
// throws away every page after the first.
//
// See _specs/home-stories-pagination-reset/.
import { describe, it, expect, vi, beforeEach } from "vitest";

import ProductStories from "components/products/ProductStories";
import { useAppStore } from "store";

import { renderWithProviders, waitFor } from "../../render";

const getProductStoriesData = vi.fn();
vi.mock("serverRequests/product", () => ({
  GetProductStoriesData: (...args: any[]) => getProductStoriesData(...args),
}));

vi.mock("react-intersection-observer", () => ({
  InView: () => <div data-testid="product-stories-sentinel" />,
}));

/** One person in a stories list, with one unwatched story. */
const person = (id: number, name: string) => ({
  id,
  name,
  photo_path: null,
  stories: [{ id: id * 100, is_seen: false, created_at: "2026-08-31T00:00:00Z" }],
});

/** What the home bar had loaded before the shopper opened a product. */
const HOME_LIST = [person(1, "Rana"), person(2, "Omar"), person(3, "Layla")];

/** The product's own stories. */
const PRODUCT_LIST = [person(90, "Boutique Nine")];
const PRODUCT_THUMBS = [{ id: 9000, thumb: "/thumb.jpg", has_new: true }];

const ids = (list: any[] | null | undefined) =>
  (list ?? []).map((entry: any) => entry.id);

describe("ProductStories — borrowing the shared story list", () => {
  beforeEach(() => {
    getProductStoriesData.mockReset();
    getProductStoriesData.mockResolvedValue({ data: [], stories: [] });
  });

  it("takes the shared story list over while the product page is open", async () => {
    const { unmount } = await renderWithProviders(
      <ProductStories
        id={7}
        initialStories={PRODUCT_THUMBS}
        InitialStoriesData={PRODUCT_LIST}
      />,
      { store: { storiesData: HOME_LIST }, path: "/products/some-product" },
    );

    await waitFor(() =>
      expect(
        ids(useAppStore.getState().storiesData),
        "the product story row did not put its own stories in the shared list, so opening one from the row would show the wrong story",
      ).toEqual(ids(PRODUCT_LIST)),
    );

    unmount();
  });

  it("puts the home stories back when the product modal closes", async () => {
    const { unmount } = await renderWithProviders(
      <ProductStories
        id={7}
        initialStories={PRODUCT_THUMBS}
        InitialStoriesData={PRODUCT_LIST}
      />,
      { store: { storiesData: HOME_LIST }, path: "/products/some-product" },
    );

    await waitFor(() =>
      expect(
        ids(useAppStore.getState().storiesData),
        "the product story row never took the shared list over, so this test cannot prove it gives it back",
      ).toEqual(ids(PRODUCT_LIST)),
    );

    // The shopper closes the modal. The homepage underneath was never unmounted
    // and is about to be on screen again.
    unmount();

    expect(
      ids(useAppStore.getState().storiesData),
      "the product story row kept the shared story list after it closed, so the home stories bar is left showing the product's stories instead of its own",
    ).toEqual(ids(HOME_LIST));
  });
});
