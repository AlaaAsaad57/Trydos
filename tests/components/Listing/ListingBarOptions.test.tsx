// The right-hand cluster of the listing bar: search box + the sort/filter/share
// actions. Its only job is how wide it is, and there are two independent reasons
// to be wide — the shopper opened the search box (store.searchExpanded), or the
// page arrived from a shared link that already carries a `?search=`.
//
// The second reason is the one worth a test. The store starts closed on every
// fresh render, so a shared search link would collapse the bar over a search box
// that is holding a word, if the component read the store alone.
//
// THE WIDTH CLASS IS THE ASSERTION HERE, on purpose. This component renders no
// text and no role of its own — it sets one width and passes its children
// through. There is nothing else to read, so the class is the behaviour, not a
// styling detail. Every other component in this phase is asserted by role and
// by visible text.
import { describe, expect, it } from "vitest";

import ListingBarOptions from "components/Listing/ListingBarOptions";

import { renderWithProviders, screen } from "../../render";

/** The element the component owns, found the way the browser suite finds it. */
function theOptionsBar() {
  return document.querySelector('[data-pw="filter_bar_options"]');
}

async function renderBar({
  serverSearch = "",
  searchExpanded = false,
  isRtl = false,
}: {
  serverSearch?: string;
  searchExpanded?: boolean;
  isRtl?: boolean;
} = {}) {
  await renderWithProviders(
    <ListingBarOptions serverSearch={serverSearch} isRtl={isRtl}>
      <button type="button">Sort products</button>
    </ListingBarOptions>,
    { store: { searchExpanded }, path: "/filters" },
  );
}

describe("the listing bar's options cluster", () => {
  it("stays narrow when the search box is closed and the page carries no search", async () => {
    await renderBar();

    expect(
      theOptionsBar()?.className,
      "a listing with no search and a closed search box should leave room for the boutique logo, so the cluster should be the fixed 170px width",
    ).toContain("w-[170px]");
  });

  it("goes full width when the shopper opens the search box", async () => {
    await renderBar({ searchExpanded: true });

    expect(
      theOptionsBar()?.className,
      "opening the search box should widen the cluster to the full bar, so the input has room to type in",
    ).toContain("w-full");
  });

  it("goes full width for a shared link that already carries a search, even though the store starts closed", async () => {
    await renderBar({ serverSearch: "blue shirt", searchExpanded: false });

    expect(
      theOptionsBar()?.className,
      "a shared `?search=` link server-renders with the search box holding a word, so the cluster must be wide from the first paint — reading store.searchExpanded alone would collapse it over the word",
    ).toContain("w-full");
  });

  it("is not made wide by an empty search string", async () => {
    await renderBar({ serverSearch: "" });

    expect(
      theOptionsBar()?.className,
      "an empty `?search=` is the same as no search at all and must not widen the cluster",
    ).toContain("w-[170px]");
  });

  it("passes its server-rendered children straight through", async () => {
    await renderBar({ searchExpanded: true });

    expect(
      screen.getByRole("button", { name: "Sort products" }),
      "the cluster wraps the server-rendered search container and actions trio — it must render them, not replace them",
    ).toBeInTheDocument();
  });
});
