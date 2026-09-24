// The search box in the listing bar. Typing in it narrows the listing without
// leaving the page: the words are committed to `?search=` and the grid refetches.
//
// The box is locally controlled and the URL is the source of truth, which is two
// places holding the same value. Everything that can go wrong here comes from
// those two disagreeing:
//
//   • committing on every keystroke would fire a request per letter;
//   • committing with `push` instead of `replace` would fill the back button
//     with one entry per word the shopper typed;
//   • mirroring the URL back into the box while they are still typing would move
//     the caret or blank a half-typed word;
//   • NOT mirroring it would leave a word in the box after the shopper cleared
//     the search somewhere else.
//
// The spinner has its own rule and it is easy to get wrong: it belongs to the
// request, not to the typing. Turning it on at the first keystroke leaves it
// spinning through the whole 1.5s wait, before anything has been asked for.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SearchBoutiquePage from "components/filterPage/SearchBoutiquePage";
import { routerSpies } from "tests/mocks/nextNavigation";
import { useAppStore } from "store";

import { renderWithProviders, screen, userEvent, waitFor } from "../../render";

const GetSearchSuggestion = vi.fn();
const LogError = vi.fn();

vi.mock("serverRequests/Search", () => ({
  GetSearchSuggestion: (...args: any[]) => GetSearchSuggestion(...args),
}));

vi.mock("utils/functions", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  LogError: (...args: any[]) => LogError(...args),
}));

/** How long the box waits after the last keystroke before it commits. */
const COMMIT_DEBOUNCE_MS = 1500;
/** How long it waits before asking for an inline suggestion. */
const SUGGESTION_DEBOUNCE_MS = 600;

const theInput = () =>
  document.querySelector("#filter-search") as HTMLInputElement;

async function renderSearchBox({
  serverSearch = "",
  search = "",
}: { serverSearch?: string; search?: string } = {}) {
  return renderWithProviders(
    <SearchBoutiquePage
      serverSearch={serverSearch}
      parsedFilters={{ categories: ["shoes"] }}
      country="gb"
      language="en"
    />,
    { path: "/filters/categories/shoes", search },
  );
}

describe("the listing's search box", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    GetSearchSuggestion.mockReset();
    GetSearchSuggestion.mockResolvedValue({ suggestion: "" });
    LogError.mockReset();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("committing what was typed", () => {
    it("does not ask for anything while the shopper is still typing", async () => {
      await renderSearchBox();

      await user.type(theInput(), "shirt");

      expect(
        routerSpies.replace,
        "committing on each keystroke would fire one request per letter — five for the word 'shirt' — against a search backend that is rate limited",
      ).not.toHaveBeenCalled();
    });

    it("commits once the shopper has stopped typing", async () => {
      await renderSearchBox();

      await user.type(theInput(), "shirt");
      await vi.advanceTimersByTimeAsync(COMMIT_DEBOUNCE_MS);

      await waitFor(() =>
        expect(
          routerSpies.replace,
          "the typed words have to reach `?search=`, because that is what makes the narrowed listing server-rendered and shareable",
        ).toHaveBeenCalledWith("/gb-en/filters/categories/shoes?search=shirt", {
          scroll: false,
        }),
      );
    });

    it("restarts the wait on each further keystroke rather than committing part of a word", async () => {
      await renderSearchBox();

      await user.type(theInput(), "shi");
      await vi.advanceTimersByTimeAsync(COMMIT_DEBOUNCE_MS - 200);
      await user.type(theInput(), "rt");
      await vi.advanceTimersByTimeAsync(COMMIT_DEBOUNCE_MS);

      await waitFor(() => expect(routerSpies.replace).toHaveBeenCalled());
      expect(
        routerSpies.replace.mock.calls.length,
        "a wait that is not restarted commits 'shi' and then 'shirt', which is two searches and a listing that visibly jumps",
      ).toBe(1);
      expect(
        routerSpies.replace.mock.calls[0][0],
        "and the one search it does run must be the whole word",
      ).toContain("search=shirt");
    });

    it("commits at once on Enter instead of making the shopper wait", async () => {
      await renderSearchBox();

      await user.type(theInput(), "shirt");
      await user.keyboard("{Enter}");

      await waitFor(() =>
        expect(
          routerSpies.replace,
          "pressing Enter is the shopper saying they have finished typing; making them wait another 1.5s after it reads as the box having ignored them",
        ).toHaveBeenCalledWith("/gb-en/filters/categories/shoes?search=shirt", {
          scroll: false,
        }),
      );
    });

    it("does not spend the history on a search", async () => {
      await renderSearchBox();

      await user.type(theInput(), "shirt");
      await user.keyboard("{Enter}");

      await waitFor(() => expect(routerSpies.replace).toHaveBeenCalled());
      expect(
        routerSpies.push,
        "each committed word would otherwise become its own back-button entry, so leaving the listing would mean pressing back once per search",
      ).not.toHaveBeenCalled();
    });

    it("takes the search out of the address when the box is emptied", async () => {
      await renderSearchBox({ serverSearch: "shirt", search: "search=shirt" });

      await user.clear(theInput());
      await vi.advanceTimersByTimeAsync(COMMIT_DEBOUNCE_MS);

      await waitFor(() =>
        expect(
          routerSpies.replace,
          "an empty box means no search, and that is an absent `?search=` — an empty one would ask the backend to match the empty string",
        ).toHaveBeenCalledWith("/gb-en/filters/categories/shoes", {
          scroll: false,
        }),
      );
    });

    it("ignores surrounding spaces when deciding what to send", async () => {
      await renderSearchBox();

      await user.type(theInput(), "  shirt  ");
      await user.keyboard("{Enter}");

      await waitFor(() => expect(routerSpies.replace).toHaveBeenCalled());
      expect(
        routerSpies.replace.mock.calls[0][0],
        "a trailing space is not part of what the shopper meant, and sending it makes two different addresses for one search",
      ).toContain("search=shirt");
    });
  });

  describe("the spinner in the search box", () => {
    it("stays off while the shopper is still typing", async () => {
      await renderSearchBox();

      await user.type(theInput(), "shirt");

      expect(
        useAppStore.getState().searchLoading,
        "nothing has been asked for yet — a spinner here turns for the whole 1.5s wait and says the app is working when it is waiting",
      ).toBe(false);
    });

    it("starts when the request is actually dispatched", async () => {
      await renderSearchBox();

      await user.type(theInput(), "shirt");
      await vi.advanceTimersByTimeAsync(COMMIT_DEBOUNCE_MS);

      await waitFor(() =>
        expect(
          useAppStore.getState().searchLoading,
          "the spinner marks a request in flight, so it starts the moment the refetch is dispatched",
        ).toBe(true),
      );
    });

    it("stops itself when the commit would change nothing", async () => {
      await renderSearchBox({ serverSearch: "shirt", search: "search=shirt" });
      useAppStore.getState().setListingSearchLoading(true);

      // Typing the same word back is a commit that matches the address.
      await user.type(theInput(), "!{backspace}");
      await vi.advanceTimersByTimeAsync(COMMIT_DEBOUNCE_MS);

      await waitFor(() =>
        expect(
          useAppStore.getState().searchLoading,
          "a commit that matches the address fires no refetch, so nothing downstream will ever clear the spinner — the box has to clear it here or it turns for ever",
        ).toBe(false),
      );
      expect(
        routerSpies.replace,
        "and it must not navigate to the address it is already on",
      ).not.toHaveBeenCalled();
    });
  });

  describe("how wide the bar is", () => {
    it("reports the box as open while it holds a word", async () => {
      await renderSearchBox({ serverSearch: "shirt", search: "search=shirt" });

      await waitFor(() =>
        expect(
          useAppStore.getState().searchExpanded,
          "a box holding a word must stay open, or the word is hidden behind a collapsed search icon and the shopper cannot see what the listing is narrowed to",
        ).toBe(true),
      );
    });

    it("reports the box as open while it has focus, even when empty", async () => {
      await renderSearchBox();

      await user.click(theInput());

      await waitFor(() =>
        expect(
          useAppStore.getState().searchExpanded,
          "the box has to open before there is anything in it, or there is nowhere to type",
        ).toBe(true),
      );
    });

    it("reports the box as closed once it is empty and left alone", async () => {
      await renderSearchBox();

      await user.click(theInput());
      await waitFor(() =>
        expect(useAppStore.getState().searchExpanded).toBe(true),
      );
      await user.tab();

      await waitFor(() =>
        expect(
          useAppStore.getState().searchExpanded,
          "an empty box that has been left alone gives its width back to the boutique logo and the other actions",
        ).toBe(false),
      );
    });
  });

  describe("mirroring the address back into the box", () => {
    it("empties the box when the search is cleared somewhere else", async () => {
      const { rerender } = await renderSearchBox({
        serverSearch: "shirt",
        search: "search=shirt",
      });

      // The shopper clears the search from the filter chips, which re-renders
      // this page with no `?search=` at all.
      const { setRoute } = await import("tests/mocks/nextNavigation");
      setRoute({ search: "" });
      rerender(
        <SearchBoutiquePage
          serverSearch=""
          parsedFilters={{ categories: ["shoes"] }}
          country="gb"
          language="en"
        />,
      );

      await waitFor(() =>
        expect(
          theInput().value,
          "the search was cleared elsewhere, so the box must follow — a word left behind in it says the listing is narrowed when it is not",
        ).toBe(""),
      );
    });

    it("leaves the box alone while the shopper is typing in it", async () => {
      await renderSearchBox({ serverSearch: "shirt", search: "search=shirt" });

      await user.click(theInput());
      await user.type(theInput(), " blue");

      expect(
        theInput().value,
        "mirroring the committed word back over a half-typed one would move the caret and lose what was being typed",
      ).toBe("shirt blue");
    });
  });

  describe("the inline suggestion", () => {
    it("asks for one once typing has paused", async () => {
      await renderSearchBox();

      await user.type(theInput(), "shi");
      await vi.advanceTimersByTimeAsync(SUGGESTION_DEBOUNCE_MS);

      await waitFor(() => expect(GetSearchSuggestion).toHaveBeenCalled());
      expect(
        GetSearchSuggestion.mock.calls[0][0].search_text,
        "the suggestion completes what has been typed, so the typed part has to be what is sent",
      ).toBe("shi");
    });

    it("asks within the filters the listing already has applied", async () => {
      await renderSearchBox();

      await user.type(theInput(), "shi");
      await vi.advanceTimersByTimeAsync(SUGGESTION_DEBOUNCE_MS);

      await waitFor(() => expect(GetSearchSuggestion).toHaveBeenCalled());
      expect(
        GetSearchSuggestion.mock.calls[0][0].filters.categories,
        "suggesting a word that returns nothing inside the current filters would complete the shopper's typing into an empty listing",
      ).toEqual(["shoes"]);
    });

    it("shows the rest of the suggested word after what was typed", async () => {
      GetSearchSuggestion.mockResolvedValue({ suggestion: "shirts" });
      await renderSearchBox();

      await user.click(theInput());
      await user.type(theInput(), "shi");
      await vi.advanceTimersByTimeAsync(SUGGESTION_DEBOUNCE_MS);

      await waitFor(() =>
        expect(
          screen.getByText("rts"),
          "the shopper sees only the part they have not typed, greyed out after their own letters — showing the whole word would double the letters they typed",
        ).toBeInTheDocument(),
      );
    });

    it("shows nothing when the suggestion does not continue what was typed", async () => {
      GetSearchSuggestion.mockResolvedValue({ suggestion: "trousers" });
      await renderSearchBox();

      await user.click(theInput());
      await user.type(theInput(), "shi");
      await vi.advanceTimersByTimeAsync(SUGGESTION_DEBOUNCE_MS);

      expect(
        screen.queryByText("trousers"),
        "a suggestion that is not a continuation cannot be drawn after the typed letters — it would read as a different word spliced onto theirs",
      ).not.toBeInTheDocument();
    });

    it("takes the suggestion on Tab", async () => {
      GetSearchSuggestion.mockResolvedValue({ suggestion: "shirts" });
      await renderSearchBox();

      await user.click(theInput());
      await user.type(theInput(), "shi");
      await vi.advanceTimersByTimeAsync(SUGGESTION_DEBOUNCE_MS);
      await waitFor(() => expect(screen.getByText("rts")).toBeInTheDocument());

      await user.keyboard("{Tab}");

      expect(
        theInput().value,
        "Tab is what accepts an inline completion everywhere else, and here it must put the whole suggested word in the box",
      ).toBe("shirts");
    });

    it("keeps only the newest suggestion when two answers cross", async () => {
      let resolveFirst: (value: any) => void = () => {};
      GetSearchSuggestion.mockImplementationOnce(
        () => new Promise((resolve) => (resolveFirst = resolve)),
      ).mockResolvedValue({ suggestion: "shirts" });

      await renderSearchBox();
      await user.click(theInput());
      await user.type(theInput(), "sh");
      await vi.advanceTimersByTimeAsync(SUGGESTION_DEBOUNCE_MS);
      await user.type(theInput(), "i");
      await vi.advanceTimersByTimeAsync(SUGGESTION_DEBOUNCE_MS);
      await waitFor(() => expect(screen.getByText("rts")).toBeInTheDocument());

      // The older request finally answers, with a stale word.
      resolveFirst({ suggestion: "shoes" });

      await waitFor(() =>
        expect(
          screen.getByText("rts"),
          "a slow earlier request must not overwrite the answer to the newer one, or the shopper watches the grey completion change back to a word that does not match what they typed",
        ).toBeInTheDocument(),
      );
    });

    it("reports a refused suggestion and shows none", async () => {
      GetSearchSuggestion.mockRejectedValue(new Error("search backend is down"));
      await renderSearchBox();

      await user.click(theInput());
      await user.type(theInput(), "shi");
      await vi.advanceTimersByTimeAsync(SUGGESTION_DEBOUNCE_MS);

      await waitFor(() => expect(LogError).toHaveBeenCalled());
      expect(
        LogError.mock.calls[0][0].scenario,
        "a failing suggestion is invisible to the shopper — typing simply stops completing — so it has to reach Sentry naming this box",
      ).toContain("SearchBoutiquePage");
      expect(
        theInput().value,
        "and a refused suggestion must leave what the shopper typed exactly as it was",
      ).toBe("shi");
    });
  });
});
