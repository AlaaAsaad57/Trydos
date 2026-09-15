// The app's own link. Every internal navigation goes through it.
//
// It accepts an `ariaLabel` prop and used to drop it on the floor: declared,
// destructured, never rendered. That left the links that have nothing but an
// icon inside them — the listing's colour circles, the back arrows, the
// clear-filters cross — with no accessible name at all.
//
// The other half of the rule matters just as much. An `aria-label` REPLACES a
// link's own content in the accessible name, so one added to a link that already
// reads "Blue Shirt, £80, Nike" would leave a screen reader announcing only the
// label. That is why this component must add nothing when it was not asked to,
// and why the call sites whose links name themselves no longer pass a label.
import { describe, expect, it } from "vitest";

import NextLink from "components/global/NextLink";

import { renderWithProviders, screen } from "../../render";

const theLink = () => document.querySelector('[data-pw="the-link"]');

describe("the app's internal link", () => {
  describe("when it is given a label", () => {
    it("puts the label on the link", async () => {
      await renderWithProviders(
        <NextLink href="/gb-en/filters" ariaLabel="Clear filters" data-pw="the-link">
          <img src="/icons/CloseIcon.svg" alt="" />
        </NextLink>,
      );

      expect(
        screen.getByRole("link", { name: "Clear filters" }),
        "a link holding nothing but an icon has no name of its own, so a dropped label leaves it announced as just 'link'",
      ).toBeInTheDocument();
    });

    it("puts the label on a link that skips the navigation conditions too", async () => {
      await renderWithProviders(
        <NextLink
          href="/gb-en"
          ariaLabel="Back to Home"
          ignoreConditionCase={true}
          data-pw="the-link"
        >
          <img src="/icons/backIcon.svg" alt="" />
        </NextLink>,
      );

      expect(
        screen.getByRole("link", { name: "Back to Home" }),
        "the two branches draw the same link for different navigation rules; a label honoured by only one of them is dropped on whichever half the caller happens to use",
      ).toBeInTheDocument();
    });
  });

  describe("when it is given no label", () => {
    it("adds none, so the link keeps the name its own content gives it", async () => {
      await renderWithProviders(
        <NextLink href="/gb-en/products/blue-shirt" data-pw="the-link">
          <span>Blue Shirt</span>
          <span>£80</span>
        </NextLink>,
      );

      expect(
        theLink()?.hasAttribute("aria-label"),
        "an aria-label replaces a link's content in its accessible name; an empty one added by default would leave a rich product card announced as nothing at all",
      ).toBe(false);
      expect(
        theLink(),
        "a link that names itself through its content must keep that name",
      ).toHaveAccessibleName(/Blue Shirt/);
    });
  });
});
