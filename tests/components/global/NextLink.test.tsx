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
import { describe, expect, it, vi } from "vitest";

// next/link only runs `onNavigate` inside a mounted App Router, which a unit
// test does not have. The stand-in keeps the real order — the caller's
// `onClick` first, then `onNavigate` — and stops jsdom from leaving the page.
vi.mock("next/link", () => ({
  default: ({ href, onClick, onNavigate, prefetch, children, ...rest }: any) => (
    <a
      href={href}
      {...rest}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
        onNavigate?.({ preventDefault: () => {} });
      }}
    >
      {children}
    </a>
  ),
}));

const spies = vi.hoisted(() => ({ ga: vi.fn(), remember: vi.fn() }));
vi.mock("utils/gtag", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  GAevent: spies.ga,
}));
vi.mock("components/ModalRoute/overlayScroll", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  rememberBaseScroll: spies.remember,
}));

import NextLink from "components/global/NextLink";

import { fireEvent, renderWithProviders, screen } from "../../render";

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

describe.each([
  { branch: "the normal link", ignoreConditionCase: false },
  { branch: "the link that skips the navigation conditions", ignoreConditionCase: true },
])("what a click on $branch does", ({ ignoreConditionCase }) => {
  it("records the click, saves the scroll and marks the navigation as started", async () => {
    spies.ga.mockClear();
    spies.remember.mockClear();
    const onClick = vi.fn();
    const { store } = await renderWithProviders(
      <NextLink
        href="/gb-en/products/shoe"
        data="product"
        onClick={onClick}
        fromRecomended={{ id: 3 }}
        ignoreConditionCase={ignoreConditionCase}
        data-pw="the-link"
      >
        Shoe
      </NextLink>,
      { path: "/cart", store: { ColorBottomSheet: { id: 1 }, isNavigating: false } },
    );

    fireEvent.click(screen.getByText("Shoe"));

    expect(spies.ga, "a click on a recommended product must send the 'recommended' analytics event").toHaveBeenCalledWith({
      action: "recommended",
      params: { id: 3 },
    });
    expect(onClick, "the caller's own click handler did not run").toHaveBeenCalled();
    expect(spies.remember, "the base page scroll must be saved before the page is hidden").toHaveBeenCalledWith(
      "/gb-en/products/shoe",
    );
    const state = store.getState() as any;
    expect(state.ColorBottomSheet, "an open colour sheet must close when the shopper leaves").toBe(null);
    expect(state.lastPathname, "the page the shopper came from must be remembered").toBe("/gb-en/cart");
    expect(state.isNavigating, "the loader must start with the data the link carries").toBe("product");
  });

  it("from settings, only marks the settings screen as loading", async () => {
    const onClick = vi.fn();
    const { store } = await renderWithProviders(
      <div className="setting-screen">
        <NextLink href="/gb-en/settings/orders" isFromSetting ignoreConditionCase={ignoreConditionCase} onClick={onClick}>
          Orders
        </NextLink>
      </div>,
      { store: { ColorBottomSheet: { id: 1 }, isNavigating: false } },
    );

    fireEvent.click(screen.getByText("Orders"));

    expect(document.querySelector(".setting-screen"), "the settings screen must show its own loading state").toHaveClass(
      "loading-page-class",
    );
    expect(onClick, "a settings link must stop before the caller's handler").not.toHaveBeenCalled();
    expect((store.getState() as any).isNavigating, "a settings link must not start the page-wide loader").toBe(false);
    expect((store.getState() as any).ColorBottomSheet, "a settings link must stop before touching the colour sheet").toEqual({
      id: 1,
    });
  });

  it("from settings but with no settings screen on the page, navigates as usual", async () => {
    const { store } = await renderWithProviders(
      <NextLink href="/gb-en/cart" isFromSetting ignoreConditionCase={ignoreConditionCase} data="cart">
        Cart
      </NextLink>,
      { store: { isNavigating: false } },
    );

    fireEvent.click(screen.getByText("Cart"));
    expect((store.getState() as any).isNavigating, "with no settings screen the normal loader must start").toBe("cart");
  });
});

describe("a link to the page the shopper is already on", () => {
  it("draws a plain box that only runs the caller's handler", async () => {
    const onClick = vi.fn();
    const { store } = await renderWithProviders(
      <NextLink href="/gb-en" sameHref onClick={onClick} data-pw="the-link">
        Home
      </NextLink>,
      { store: { isNavigating: false } },
    );

    expect(screen.queryByRole("link"), "a same-page link must not draw an anchor").not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Home"));
    expect(onClick, "the caller's handler must run on the same-page box").toHaveBeenCalled();
    expect((store.getState() as any).isNavigating, "staying on the page must not start the loader").toBe(false);
  });

  it("does nothing on a click when there is no handler", async () => {
    await renderWithProviders(
      <NextLink href="/gb-en" sameHref>
        Home
      </NextLink>,
    );
    expect(() => fireEvent.click(screen.getByText("Home")), "a click with no handler must not throw").not.toThrow();
  });
});
