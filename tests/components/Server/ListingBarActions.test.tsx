// The sort / filter / share trio in the listing bar. Sort and filter need more
// than one result; share needs at least one. The server seeds both verdicts.
import { describe, expect, it, vi } from "vitest";

const barClient = vi.fn();

vi.mock("components/Listing/ListingBarActionsClient", () => ({
  default: (props: any) => {
    barClient(props);
    return <div data-pw="bar">{props.children}</div>;
  },
}));
vi.mock("components/Listing/ListingSortControl", () => ({ default: () => <span>sort</span> }));
vi.mock("components/Listing/ListingShareControl", () => ({ default: () => <span>share</span> }));
vi.mock("components/filterPage/FilterBoutiquePageButton", () => ({ default: () => <span>filter</span> }));

import ListingBarActions from "components/Server/ListingBarActions";

import { renderWithProviders, screen } from "../../render";

// The inner part is an async Server Component, which the test renderer cannot
// mount, so the test awaits it the way the server does and renders its output.
const renderBar = async (products: unknown[] | undefined) => {
  barClient.mockClear();
  const outer: any = ListingBarActions({
    filtersPromise: Promise.resolve({ products }),
    language: "en",
    isRtl: false,
  });
  const inner = outer.props.children;
  await renderWithProviders(await inner.type(inner.props));
  expect(screen.getByText("sort"), "the sort control is missing from the bar").toBeInTheDocument();
  return barClient.mock.calls.at(-1)[0];
};

describe("the listing bar actions", () => {
  it("allows share, sort and filter when there are several results", async () => {
    const props = await renderBar([1, 2]);
    expect(props.serverHasResults, "several results should allow sharing").toBe(true);
    expect(props.serverHasMultipleResults, "several results should allow sort and filter").toBe(true);
  });

  it("allows share only for a single result", async () => {
    const props = await renderBar([1]);
    expect(props.serverHasResults, "one result should still allow sharing").toBe(true);
    expect(props.serverHasMultipleResults, "one result must not offer sort and filter").toBe(false);
  });

  it("allows nothing when the backend returned no product list", async () => {
    const props = await renderBar(undefined);
    expect(props.serverHasResults, "no results must not allow sharing").toBe(false);
  });
});
