// The listing bar's actions are gated on how many results the listing found, and
// the two actions are gated differently:
//
//   sort + filter  show only when there is MORE THAN ONE result
//   share          shows when there is at least one
//
// Reordering or narrowing a single result does nothing, but sharing one product
// is useful. The split is the behaviour this file protects — one shared ">0"
// gate would put a sort sheet on a page with a single card.
//
// The search box is deliberately NOT in this group. It stays on the page so a
// shopper who searched for nothing can fix the word they typed. A test here
// would not see it (it is a sibling, not a child), so the guard is that this
// component only ever renders what it is handed.
import { describe, expect, it } from "vitest";

import ListingBarActionsClient from "components/Listing/ListingBarActionsClient";
import { useAppStore } from "store";

import { renderWithProviders, screen } from "../../render";

async function renderActions({
  serverHasResults,
  serverHasMultipleResults,
}: {
  serverHasResults: boolean;
  serverHasMultipleResults: boolean;
}) {
  return renderWithProviders(
    <ListingBarActionsClient
      serverHasResults={serverHasResults}
      serverHasMultipleResults={serverHasMultipleResults}
      share={<button type="button">Share this page</button>}
    >
      <button type="button">Sort products</button>
    </ListingBarActionsClient>,
    {
      // Seeded the wrong way round on purpose: the component must overwrite both
      // verdicts from what the server just counted, not trust what the store was
      // left holding by the listing before this one.
      store: { searchHasResults: false, searchHasMultipleResults: false },
      path: "/filters",
    },
  );
}

const sortButton = () => screen.queryByRole("button", { name: "Sort products" });
const shareButton = () =>
  screen.queryByRole("button", { name: "Share this page" });

describe("the listing bar's actions gate", () => {
  it("shows sort and share when the listing found several products", async () => {
    await renderActions({
      serverHasResults: true,
      serverHasMultipleResults: true,
    });

    expect(
      sortButton(),
      "a listing with several results can be reordered, so sort and filter belong on the bar",
    ).toBeInTheDocument();
    expect(
      shareButton(),
      "a listing with results is worth sharing, so share belongs on the bar",
    ).toBeInTheDocument();
  });

  it("keeps share but drops sort when the listing found exactly one product", async () => {
    await renderActions({
      serverHasResults: true,
      serverHasMultipleResults: false,
    });

    expect(
      sortButton(),
      "there is nothing to reorder on a single-result listing, so sort and filter must be gated on MORE THAN ONE result — a shared >0 gate would open a sort sheet over one card",
    ).not.toBeInTheDocument();
    expect(
      shareButton(),
      "share keeps the >0 gate, because sharing the page that holds one product is exactly what somebody would want to do",
    ).toBeInTheDocument();
  });

  it("drops both when the listing found nothing", async () => {
    await renderActions({
      serverHasResults: false,
      serverHasMultipleResults: false,
    });

    expect(
      sortButton(),
      "an empty listing has nothing to reorder",
    ).not.toBeInTheDocument();
    expect(
      shareButton(),
      "an empty listing is not worth sharing, so share's own >0 gate must close too",
    ).not.toBeInTheDocument();
  });

  it("writes both of the server's verdicts into the store, so a later client-side search can change them", async () => {
    await renderActions({
      serverHasResults: true,
      serverHasMultipleResults: true,
    });

    const state = useAppStore.getState();
    expect(
      state.searchHasResults,
      "the server's has-results count must be seeded into the store on every real render; the client-side search updates the same value later, and it can only update what is there",
    ).toBe(true);
    expect(
      state.searchHasMultipleResults,
      "the server's has-more-than-one count must be seeded too — it is a separate verdict from has-results and gates a different pair of buttons",
    ).toBe(true);
  });

  it("re-seeds both verdicts when the server re-renders with a new count", async () => {
    const { rerender } = await renderActions({
      serverHasResults: true,
      serverHasMultipleResults: true,
    });

    // A path-filter change re-renders the server component with a new count.
    rerender(
      <ListingBarActionsClient
        serverHasResults={false}
        serverHasMultipleResults={false}
        share={<button type="button">Share this page</button>}
      >
        <button type="button">Sort products</button>
      </ListingBarActionsClient>,
    );

    expect(
      sortButton(),
      "narrowing the filters down to zero results must take sort off the bar — the verdict is re-seeded on every server render, not only on the first mount",
    ).not.toBeInTheDocument();
    expect(
      shareButton(),
      "the same re-seed must take share off the bar too",
    ).not.toBeInTheDocument();
  });
});
