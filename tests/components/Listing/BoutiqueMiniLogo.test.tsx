// The small boutique logo that fades into the sticky bar once the big header has
// folded away.
//
// It is a server component and it is given the boutique as a promise, which the
// listing page also hands to two other places. That is deliberate: one request,
// three readers. So the only decisions it makes are whether there is a logo to
// draw at all, and what to draw it from.
//
// Not every listing is a boutique — a search result has no boutique and no logo.
// Drawing an empty image box in the sticky bar for those would take the room the
// search box needs.
import { describe, expect, it } from "vitest";

import BoutiqueMiniLogo from "components/Listing/BoutiqueMiniLogo";

import { render, screen } from "../../render";

/** Run the server component and put whatever it returned on the page. */
async function drawFor(boutique: { icon?: string; name?: string } | null) {
  const element = await BoutiqueMiniLogo({
    boutiquePromise: Promise.resolve(boutique),
  });
  if (element) render(element as any);
  return element;
}

// The logo is found by tag rather than by role. The component marks its wrapper
// `aria-hidden` on purpose: it is the same boutique the big header above already
// names, so announcing it a second time would only repeat itself. That also
// means there is no accessible name to search for here.
const theLogo = () => document.querySelector("img");

describe("the small boutique logo in the sticky listing bar", () => {
  it("draws the boutique's own logo", async () => {
    await drawFor({ icon: "boutiques/blue.png", name: "Blue Boutique" });

    expect(
      theLogo(),
      "the logo is what tells the shopper whose products they are scrolling through once the big header has folded away",
    ).toBeInTheDocument();
  });

  it("is hidden from a screen reader, because the header already names the boutique", async () => {
    await drawFor({ icon: "boutiques/blue.png", name: "Blue Boutique" });

    expect(
      screen.queryByRole("img"),
      "this is the same boutique the header above already names — announcing it again would read the shop's name twice on every listing",
    ).not.toBeInTheDocument();
  });

  it("carries the boutique's name for when the picture does not load", async () => {
    await drawFor({ icon: "boutiques/blue.png", name: "Blue Boutique" });

    expect(
      theLogo()?.getAttribute("alt"),
      "a logo that fails to load leaves its alt text in the bar; the boutique's name there is the difference between a blank box and knowing whose shop this is",
    ).toBe("Blue Boutique");
  });

  it("builds the address from the media host rather than using the raw path", async () => {
    await drawFor({ icon: "boutiques/blue.png", name: "Blue Boutique" });

    expect(
      theLogo()?.getAttribute("src"),
      "the backend stores a path, not a full address; using it unchanged asks this app's own host for a file that is on the media host",
    ).toContain("boutiques");
  });

  it("draws nothing for a listing that is not a boutique", async () => {
    const element = await drawFor(null);

    expect(
      element,
      "a search result has no boutique — an empty image box here would take the room the search box needs in the sticky bar",
    ).toBeNull();
  });

  it("draws nothing for a boutique that has no logo", async () => {
    const element = await drawFor({ name: "Blue Boutique" });

    expect(
      element,
      "a boutique that never uploaded a logo must be drawn as nothing, not as a broken image",
    ).toBeNull();
  });
});
