// The compact boutique logo in the sticky listing bar hides while the search box
// is open, so the input has the whole bar to itself.
//
// This replaced a `querySelector(".boutique-logo-container").style.display`
// hack. The point of the component is that the logo is now absent from the tree,
// not merely invisible — a hidden-by-style logo still took its width, which was
// the whole problem.
import { describe, expect, it } from "vitest";

import BoutiqueLogoCollapse from "components/Listing/BoutiqueLogoCollapse";

import { renderWithProviders, screen } from "../../render";

async function renderWithSearch(searchExpanded: boolean) {
  await renderWithProviders(
    <BoutiqueLogoCollapse>
      <img alt="Blue Boutique" src="/logo.png" />
    </BoutiqueLogoCollapse>,
    { store: { searchExpanded }, path: "/filters/boutique/blue-boutique" },
  );
}

describe("the compact boutique logo in the listing bar", () => {
  it("is shown while the search box is closed", async () => {
    await renderWithSearch(false);

    expect(
      screen.getByAltText("Blue Boutique"),
      "with the search box closed there is room for the logo, so it should be on the page",
    ).toBeInTheDocument();
  });

  it("is taken off the page while the search box is open", async () => {
    await renderWithSearch(true);

    expect(
      screen.queryByAltText("Blue Boutique"),
      "the logo must be removed from the tree while the search box is open, not merely hidden — a hidden logo still takes its width, which is the hack this component replaced",
    ).not.toBeInTheDocument();
  });
});
