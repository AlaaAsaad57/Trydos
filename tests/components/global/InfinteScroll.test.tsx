// Loads more boutiques on the home page as the shopper scrolls.
import { beforeEach, describe, expect, it, vi } from "vitest";

const spies = vi.hoisted(() => ({ next: vi.fn(), ga: vi.fn(), logError: vi.fn() }));
vi.mock("serverRequests/home", () => ({ GetNextBoutiques: spies.next }));
vi.mock("utils/gtag", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  GAevent: spies.ga,
}));
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  LogError: spies.logError,
}));

import InfinteScroll from "components/global/InfinteScroll";

import { act, renderWithProviders, screen, waitFor } from "../../render";

const scroll = async () => {
  await act(async () => {
    window.dispatchEvent(new Event("scroll"));
  });
};

beforeEach(() => {
  spies.next.mockReset();
  spies.ga.mockClear();
  spies.logError.mockClear();
});

describe("the home boutique infinite scroll", () => {
  it("reports the home screen view and clears the navigation loader on mount", async () => {
    const { store } = await renderWithProviders(<InfinteScroll offsetVariable={[0]} />, {
      store: { isNavigating: true },
    });
    expect(spies.ga, "the home screen view event was not sent").toHaveBeenCalledWith({
      action: "screen_view_event",
      params: { screen_name: "home_screen", screen_path: "/gb-en" },
    });
    expect((store.getState() as any).isNavigating, "the home page must clear the navigation loader").toBe(null);
  });

  it("names the category screen when the path is a category page", async () => {
    await renderWithProviders(<InfinteScroll offsetVariable={[0]} />, { path: "/categories/shoes" });
    expect(spies.ga.mock.calls[0][0].params.screen_name, "a category page must be reported as the category screen").toBe(
      "home_category_screen",
    );
  });

  it("asks for the next page on scroll, shows it, and asks again with the new offset", async () => {
    spies.next
      .mockResolvedValueOnce({ boutiques: [<p key="1">boutique one</p>], offset: [10] })
      .mockResolvedValueOnce({ boutiques: [<p key="2">boutique two</p>], offset: [20] });
    await renderWithProviders(<InfinteScroll offsetVariable={[0]} mainCategory="men" />, { country: "sy" });

    await scroll();
    expect(await screen.findByText("boutique one"), "the first loaded boutiques were not shown").toBeInTheDocument();
    expect(spies.next, "the first request must carry the page's country, language, category and offset").toHaveBeenCalledWith({
      category: "men",
      language: "en",
      country: "sy",
      offset: "[0]",
    });

    await scroll();
    expect(await screen.findByText("boutique two"), "the second page was not added").toBeInTheDocument();
    expect(screen.getByText("boutique one"), "the first page must stay when the second is added").toBeInTheDocument();
    expect(spies.next.mock.calls[1][0].offset, "the second request must use the offset the first answer gave").toBe("[10]");
  });

  it("stops asking once a page comes back empty", async () => {
    spies.next.mockResolvedValueOnce({ boutiques: [], offset: [5] });
    await renderWithProviders(<InfinteScroll offsetVariable={[0]} />);

    await scroll();
    await waitFor(() => expect(spies.next, "the first scroll must ask for a page").toHaveBeenCalledTimes(1));
    await scroll();
    expect(spies.next, "after an empty page the list is at its end and must not ask again").toHaveBeenCalledTimes(1);
  });

  it("stops asking once an answer has no offset", async () => {
    spies.next.mockResolvedValueOnce({ boutiques: [<p key="1">last boutique</p>] });
    await renderWithProviders(<InfinteScroll offsetVariable={[0]} />);

    await scroll();
    expect(await screen.findByText("last boutique"), "the last page must still be shown").toBeInTheDocument();
    await scroll();
    expect(spies.next, "with no offset to continue from, it must not ask again").toHaveBeenCalledTimes(1);
  });

  it("logs a failed request and stops asking", async () => {
    const failure = new Error("home backend down");
    spies.next.mockRejectedValueOnce(failure);
    await renderWithProviders(<InfinteScroll offsetVariable={[3]} mainCategory="kids" />);

    await scroll();
    await waitFor(() =>
      expect(spies.logError, "a failed boutique request must be logged with its offset and category").toHaveBeenCalledWith({
        error: failure,
        scenario: "get Next Boutiques in Home Page",
        offset: [3],
        category: "kids",
      }),
    );
    await scroll();
    expect(spies.next, "after a failure it must not keep asking").toHaveBeenCalledTimes(1);
  });

  it("shows a spinner while a page is loading", async () => {
    let finish: (value: any) => void = () => {};
    spies.next.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));
    const { container } = await renderWithProviders(<InfinteScroll offsetVariable={[0]} />);

    await scroll();
    expect(container.querySelector(".spinner-container"), "a spinner must show while the next page loads").toBeInTheDocument();

    await scroll();
    expect(spies.next, "a second scroll during a load must not send a second request").toHaveBeenCalledTimes(1);

    await act(async () => finish({ boutiques: [], offset: null }));
    expect(container.querySelector(".spinner-container"), "the spinner must go once the page is loaded").toBeNull();
  });
});
