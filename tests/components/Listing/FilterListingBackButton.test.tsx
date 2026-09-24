// The back control at the left of the listing bar. It has to do two different
// things, because the listing is reachable two different ways.
//
// Opened normally, the listing is a page and "back" means the home page — a real
// link, so it prefetches and a crawler can follow it.
//
// Opened as an intercepted overlay (the `@modal/(.)filters` slot), the listing
// is drawn on top of whatever the shopper was already looking at. "Back" there
// means close the overlay and return to that page. A link to the home page would
// throw away the page underneath instead of uncovering it.
import { describe, expect, it } from "vitest";

import FilterListingBackButton from "components/Listing/FilterListingBackButton";
import { routerSpies } from "tests/mocks/nextNavigation";

import { renderWithProviders, screen, userEvent } from "../../render";

async function renderBackButton(isModalRoute: boolean) {
  return renderWithProviders(
    <FilterListingBackButton lang="gb-en" />,
    { path: "/filters", isModalRoute },
  );
}

const theControl = () =>
  document.querySelector('[data-pw="BackIcon_boutique"]') as HTMLElement;

describe("the listing's back control", () => {
  describe("on a listing opened as its own page", () => {
    it("is a real link to the home page", async () => {
      await renderBackButton(false);

      expect(
        theControl(),
        "a page's back control has somewhere definite to go, and a link is what lets the browser prefetch it and a crawler follow it",
      ).toHaveAttribute("href", "/gb-en");
    });

    it("goes to the home page of the locale being browsed", async () => {
      await renderWithProviders(<FilterListingBackButton lang="sy-ar" />, {
        country: "sy",
        language: "ar",
        path: "/filters",
      });

      expect(
        theControl(),
        "the locale is the first part of every address in this app, so a back link that drops it sends an Arabic shopper in Syria to the English home page",
      ).toHaveAttribute("href", "/sy-ar");
    });
  });

  describe("on a listing opened as an overlay", () => {
    it("is a button, not a link", async () => {
      await renderBackButton(true);

      expect(
        screen.getByRole("button", { name: "Back" }),
        "there is no address that means 'close this overlay', so the control has to be a button — a link would navigate somewhere instead of uncovering the page underneath",
      ).toBeInTheDocument();
    });

    it("closes the overlay rather than navigating to the home page", async () => {
      await renderBackButton(true);

      await userEvent.click(screen.getByRole("button", { name: "Back" }));

      expect(
        routerSpies.back,
        "going back uncovers the page the shopper opened the listing from; sending them to the home page instead loses where they were",
      ).toHaveBeenCalled();
      expect(
        theControl().getAttribute("href"),
        "and it must not also be a link, or the overlay closes and the browser navigates at the same time",
      ).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// The control is an arrow and nothing else — no text, and the image's alt is
// empty on purpose because the image is decorative. So the label is the only
// name it can have, in either of its two forms.
describe("what the back control is called", () => {
  it("names the page link, which holds nothing but an arrow", async () => {
    await renderBackButton(false);

    expect(
      theControl(),
      "an icon-only link with no label reaches a screen reader as just 'link' — there is nothing else inside it to name it",
    ).toHaveAccessibleName("Back to Home");
  });

  it("names the overlay button too", async () => {
    await renderBackButton(true);

    expect(
      screen.getByRole("button"),
      "the overlay form is the same arrow with a different job, and it needs a name just as much",
    ).toHaveAccessibleName("Back");
  });

  it("says it in the language the shopper is reading", async () => {
    await renderWithProviders(<FilterListingBackButton lang="sy-ar" />, {
      country: "sy",
      language: "ar",
      path: "/filters",
      isModalRoute: true,
    });

    expect(
      screen.getByRole("button"),
      "a label is copy a shopper hears; leaving it in English reads the one English word on an otherwise Arabic page",
    ).toHaveAccessibleName("رجوع");
  });
});
