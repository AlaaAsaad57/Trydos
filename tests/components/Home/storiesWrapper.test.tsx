// The home stories bar: does it keep what it has loaded when the route changes?
//
// The bar accumulates into one shared place — `store.storiesData`. Three things
// write there while the shopper is on the homepage: the first page from
// StoriesBarClient, each further page from StoriesPaginationWrapper, and the
// seen mark from watchStory. The page counter that asks for the next page lives
// somewhere else again, in StoriesPaginationWrapper's own state.
//
// A product opens as an INTERCEPTED MODAL, so the homepage — and that counter —
// stay mounted underneath. Only the pathname changes. So a route change must not
// throw the accumulator away: if it does, the counter and the list disagree and
// a whole page of people is skipped and can never be reached again.
//
// See _specs/home-stories-pagination-reset/.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";

import StoriesWrapper from "components/clientWrapper/StoriesWrapper";
import { useAppStore } from "store";

import { renderWithProviders, screen, waitFor } from "../../render";
import { setRoute } from "../../mocks/nextNavigation";

const fetchData = vi.fn();
vi.mock("utils/fetchData", () => ({
  fetchData: (...args: any[]) => fetchData(...args),
}));

// The sentinel that asks for the next page. Stubbing the library rather than
// emulating IntersectionObserver makes "the shopper scrolled to the end of the
// bar" an explicit step in the test, so a failure can never be a timing accident
// in jsdom — which has no IntersectionObserver at all.
let sentinelOnChange: ((inView: boolean) => void) | null = null;
vi.mock("react-intersection-observer", () => ({
  InView: ({ onChange }: any) => {
    sentinelOnChange = onChange;
    return <div data-testid="stories-sentinel" />;
  },
}));

/** One person in the bar, with one unwatched story. */
const person = (id: number, name: string) => ({
  id,
  name,
  photo_path: null,
  stories: [{ id: id * 100, is_seen: false, created_at: "2026-08-31T00:00:00Z" }],
});

const PAGE_1 = [person(1, "Rana"), person(2, "Omar")];
const PAGE_2 = [person(3, "Layla"), person(4, "Karim")];

const NEXT_PAGE_URL = "https://stories.example/api/v1/stories/users_stories?page=2";

/** The address of the homepage, and of a product opened over it. */
const HOME = "/gb-en";
const PRODUCT_MODAL = "/gb-en/products/some-product";

/** Put the bar on screen with page 1 already loaded. */
async function renderBar(store: Record<string, any> = {}) {
  return renderWithProviders(
    <StoriesWrapper
      stories={PAGE_1}
      next_page_url={NEXT_PAGE_URL}
      isRtl={false}
      userData={null}
    />,
    { path: "/", store },
  );
}

/** The bar, re-rendered at `pathname` — what a route change looks like here. */
function goTo(rerender: (ui: React.ReactElement) => void, pathname: string) {
  setRoute({ pathname });
  act(() => {
    rerender(
      <StoriesWrapper
        stories={PAGE_1}
        next_page_url={NEXT_PAGE_URL}
        isRtl={false}
        userData={null}
      />,
    );
  });
}

/** The shopper scrolls to the end of the bar. */
async function scrollToEndOfBar() {
  await act(async () => {
    sentinelOnChange?.(true);
  });
}

/** The page number the stories service was asked for, on call number `nth`. */
const pageAskedFor = (nth: number): string => {
  const call = fetchData.mock.calls[nth]?.[0];
  return String(call?.url ?? "");
};

describe("StoriesWrapper — the home stories bar across a route change", () => {
  beforeEach(() => {
    fetchData.mockReset();
    sentinelOnChange = null;
  });

  it("asks the stories service for page 2 first, and stops paging when it sends no next page", async () => {
    fetchData.mockResolvedValue({
      success: true,
      data: { data: PAGE_2, next_page_url: null },
    });

    await renderBar();
    await scrollToEndOfBar();

    await waitFor(() =>
      expect(
        fetchData,
        "the shopper scrolled to the end of the stories bar and the bar never asked the stories service for another page",
      ).toHaveBeenCalled(),
    );
    expect(
      pageAskedFor(0),
      `the bar asked the stories service for the wrong page after page 1; it asked for "${pageAskedFor(0)}"`,
    ).toContain("page=2");

    // The service said there is no page 3, so the sentinel must be gone.
    await waitFor(() =>
      expect(
        screen.queryByTestId("stories-sentinel"),
        "the stories service returned no next_page_url, but the bar kept its load-more sentinel on screen and will keep asking for pages that do not exist",
      ).toBeNull(),
    );
  });

  it("keeps the pages it already loaded when the route changes and comes back", async () => {
    fetchData.mockResolvedValue({
      success: true,
      data: {
        data: PAGE_2,
        next_page_url: NEXT_PAGE_URL.replace("page=2", "page=3"),
      },
    });

    const { rerender } = await renderBar();
    await scrollToEndOfBar();

    await waitFor(() =>
      expect(
        screen.queryByText("Layla"),
        "the stories service returned page 2 but the bar never showed those people",
      ).not.toBeNull(),
    );

    // The shopper opens a product. It is an intercepted modal, so the bar stays
    // mounted and only the pathname changes. Then they close it again.
    goTo(rerender, PRODUCT_MODAL);
    goTo(rerender, HOME);

    expect(
      screen.queryByText("Rana"),
      "opening a product and closing it emptied the stories bar of page 1 as well",
    ).not.toBeNull();
    expect(
      screen.queryByText("Layla"),
      "opening a product and closing it threw away the second page of stories the shopper had already loaded; those people cannot be reached again without a full page reload",
    ).not.toBeNull();
  });

  it("does not ask the stories service for page 3 while page 2 is missing from the bar", async () => {
    fetchData.mockResolvedValue({
      success: true,
      data: {
        data: PAGE_2,
        next_page_url: NEXT_PAGE_URL.replace("page=2", "page=3"),
      },
    });

    const { rerender } = await renderBar();
    await scrollToEndOfBar();
    await waitFor(() => expect(fetchData).toHaveBeenCalledTimes(1));

    goTo(rerender, PRODUCT_MODAL);
    goTo(rerender, HOME);

    // The bar is what the shopper can see. If page 2 is not in it, asking for
    // page 3 skips those people for good — the counter and the list disagree.
    expect(
      screen.queryByText("Karim"),
      "the bar lost page 2 after the route change, so the next page it asks for will skip those people entirely",
    ).not.toBeNull();

    await scrollToEndOfBar();
    await waitFor(() => expect(fetchData).toHaveBeenCalledTimes(2));
    expect(
      pageAskedFor(1),
      `after loading page 2 the bar asked the stories service for the wrong page; it asked for "${pageAskedFor(1)}"`,
    ).toContain("page=3");
  });

  it("does not overwrite a watched ring when the route changes", async () => {
    fetchData.mockResolvedValue({ success: true, data: { data: [] } });

    const { rerender } = await renderBar();

    await waitFor(() =>
      expect(
        useAppStore.getState().storiesData?.length,
        "the bar never seeded the shared story list from the page it was given",
      ).toBe(PAGE_1.length),
    );

    // The shopper watches Rana's story. watchStory writes the seen mark into the
    // shared list and nowhere else. `id` is the person, `pid` is the story item
    // — see watchStory in store/homepage/reducer.ts.
    act(() => {
      useAppStore.getState().watchStory({ id: 1, pid: 100 });
    });
    expect(
      useAppStore.getState().storiesData?.[0]?.stories?.[0]?.is_seen,
      "watching a story did not mark it seen in the shared story list, so this test cannot prove anything about keeping the mark",
    ).toBe(true);

    goTo(rerender, PRODUCT_MODAL);
    goTo(rerender, HOME);

    expect(
      useAppStore.getState().storiesData?.[0]?.stories?.[0]?.is_seen,
      "opening a product and closing it put the watched ring back to unwatched; a story the shopper has already seen looks unseen again",
    ).toBe(true);
  });

  it("still clears the add-story refreshing flag on a route change", async () => {
    fetchData.mockResolvedValue({ success: true, data: { data: [] } });

    const { rerender } = await renderBar({ storiesRefreshing: true });

    goTo(rerender, PRODUCT_MODAL);

    expect(
      useAppStore.getState().storiesRefreshing,
      "the bar left storiesRefreshing on after a route change; the add-story button stays stuck as a spinner (components/Home/AddStory.tsx)",
    ).toBe(false);
  });
});
