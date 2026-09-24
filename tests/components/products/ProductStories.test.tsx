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

import { fireEvent, renderWithProviders, screen, waitFor } from "../../render";

const getProductStoriesData = vi.fn();
vi.mock("serverRequests/product", () => ({
  GetProductStoriesData: (...args: any[]) => getProductStoriesData(...args),
}));

// The sentinel is a button here, so a case can say "it came into view".
vi.mock("react-intersection-observer", () => ({
  InView: ({ onChange }: any) => (
    <button data-testid="product-stories-sentinel" onClick={() => onChange(true)} />
  ),
}));

const selectStory = vi.fn();
vi.mock("store/homepage/actions", () => ({ SelectStory: (...a: any[]) => selectStory(...a) }));
vi.mock("services/story", () => ({
  default: { configureStory: (story: any) => ({ configured: story?.id }) },
}));
vi.mock("components/Home/Stories/NewStories", () => ({
  default: ({ selectedStory }: any) => <div data-testid="story-viewer">{selectedStory.id}</div>,
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

/** Ten people, so the row thinks there may be a next page. */
const TEN = Array.from({ length: 10 }, (_, i) => person(200 + i, `P${i}`));
const TEN_THUMBS = TEN.map((p) => ({ id: p.id, thumb: `/t${p.id}.jpg`, has_new: false }));

describe("ProductStories — the row itself", () => {
  beforeEach(() => {
    getProductStoriesData.mockReset();
    selectStory.mockReset();
  });

  it("renders nothing for a product with no stories", async () => {
    const { container } = await renderWithProviders(
      <ProductStories id={7} initialStories={[]} InitialStoriesData={[]} />,
    );
    expect(container.innerHTML, "an empty story row rendered markup").toBe("");
  });

  it("opens the tapped story, and ignores a tap between stories", async () => {
    await renderWithProviders(
      <ProductStories
        id={7}
        initialStories={[{ id: 90, thumb: "/t.jpg", has_new: true }]}
        InitialStoriesData={PRODUCT_LIST}
      />,
      { language: "ar" },
    );
    const story = document.querySelector('[data-id="90"]') as HTMLElement;
    fireEvent.click(story.querySelector("img") as HTMLElement);
    expect(selectStory, "the tapped story was not opened").toHaveBeenCalledWith({ configured: 90 });
    selectStory.mockReset();
    fireEvent.click(document.querySelector("#product-stories-scroll-bar") as HTMLElement);
    expect(selectStory, "a tap between stories opened one").not.toHaveBeenCalled();
  });

  it("shows the story viewer when a story is selected on the product page", async () => {
    await renderWithProviders(
      <ProductStories id={7} initialStories={PRODUCT_THUMBS} InitialStoriesData={PRODUCT_LIST} />,
      { store: { selectedStory: { id: 90 }, isProductPage: true } },
    );
    expect((await screen.findByTestId("story-viewer")).textContent, "the viewer did not open").toBe("90");
  });

  it("loads the next page when the end comes into view, and stops at a short page", async () => {
    getProductStoriesData.mockResolvedValue({
      data: [person(300, "Late")],
      stories: [{ id: 30000, thumb: "/late.jpg", has_new: true }],
    });
    await renderWithProviders(
      <ProductStories id={7} initialStories={TEN_THUMBS} InitialStoriesData={TEN} />,
    );
    fireEvent.click(screen.getByTestId("product-stories-sentinel"));
    await waitFor(() =>
      expect(document.querySelector('[data-id="30000"]'), "the next page was not added").not.toBeNull(),
    );
    expect(getProductStoriesData, "page 2 was not asked for this product").toHaveBeenCalledWith({
      page: 2,
      productId: 7,
    });
    expect(
      screen.queryByTestId("product-stories-sentinel"),
      "a short page did not end the loading",
    ).not.toBeInTheDocument();
  });

  it("keeps loading after a full page, and handles an empty answer", async () => {
    getProductStoriesData.mockResolvedValueOnce({ data: TEN, stories: TEN_THUMBS }).mockResolvedValueOnce({});
    await renderWithProviders(
      <ProductStories id={7} initialStories={TEN_THUMBS} InitialStoriesData={TEN} />,
    );
    fireEvent.click(screen.getByTestId("product-stories-sentinel"));
    await waitFor(() => expect(getProductStoriesData, "page 2 was not loaded").toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByTestId("product-stories-sentinel"), "a full page ended the loading").toBeInTheDocument(),
    );
    fireEvent.click(screen.getByTestId("product-stories-sentinel"));
    await waitFor(() =>
      expect(getProductStoriesData, "page 3 was not asked for").toHaveBeenCalledWith({ page: 3, productId: 7 }),
    );
  });

  it("ends at once when the row started short but the sentinel still fired", async () => {
    await renderWithProviders(
      <ProductStories id={7} initialStories={PRODUCT_THUMBS} InitialStoriesData={TEN} />,
    );
    fireEvent.click(screen.getByTestId("product-stories-sentinel"));
    await waitFor(() =>
      expect(screen.queryByTestId("product-stories-sentinel"), "a short row did not end the loading").not.toBeInTheDocument(),
    );
    expect(getProductStoriesData, "a short row asked for another page").not.toHaveBeenCalled();
  });
});
