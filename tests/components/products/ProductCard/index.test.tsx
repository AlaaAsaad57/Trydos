// AC-9 — the card behaves the same before and after the flash-deal rule was
// moved out of it.
//
// This file is a characterization test. It was written and seen **green against
// the old code**, where the rule still sat inline in `index.tsx:91-121`, and it
// has to stay green after the move. That order is the whole point: a test written
// after the move could only say the new code agrees with itself.
//
// THREE THINGS IT WATCHES, because the moved rule feeds three places:
//   1. the price in the footer            — `RenderPrice` -> `OfferPrice`
//   2. the countdown banner               — `FlashDealBanner`, `initial` prop
//   3. the orange border on the picture   — `shouldShowOrangeBorder()`
//
// WHY `RenderPrice` IS NOT STUBBED (FA-2). It re-applies the same fallback the
// card does — `flash_price ?? offer_price ?? price`. So a moved rule that
// returned `undefined` would still put the right number on screen and a stubbed
// assertion would stay green while proving nothing. Every live-deal case below
// therefore uses a deal price that **differs** from the offer price, so a wrong
// return is visible in the text.
//
// WHY `FlashDealBanner` IS STUBBED (FA-3, FA-4). The real banner recomputes the
// countdown from `end_data` on mount, so it would paper over a wrong `initial`.
// It also builds an `IntersectionObserver` and a 1s `setInterval`, and jsdom has
// neither. The stub records the props it was handed, which is what the card
// actually decided.
//
// TIMEZONE (FA-5). The clock is pinned. The dates are also kept more than a day
// away from any end-of-day boundary, so no runner's timezone can turn a live deal
// into an ended one. The boundary itself is checked in `flashPrice.test.ts`,
// where the date can be written in local form.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";
import { buildListingProduct } from "../../../fixtures/product";

/** What the card handed to the countdown banner on the last render. */
let bannerProps: Record<string, any> | null = null;

vi.mock("components/products/FlashDealBanner", () => ({
  default: (props: any) => {
    bannerProps = props;
    return <div data-testid="flash-banner" />;
  },
}));

vi.mock("hooks/useLuckTimer", () => ({
  useLuckTimer: () => ({ luckActive: false, secondsLeft: 0 }),
}));

vi.mock("components/ServerWrapper/ProductWrapper/ProductPhotosWrapper", () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));
vi.mock("components/global/NextLink", () => ({
  default: ({ children, ...rest }: any) => <a {...rest}>{children}</a>,
}));
vi.mock("components/products/ProductLabelsAnimated", () => ({
  ProductLabelsAnimated: () => null,
}));
vi.mock("components/ServerWrapper/ProductWrapper/ProductButtonWrapper", () => ({
  default: () => null,
}));
vi.mock("components/clientWrapper/product/ProductColorsWrapper", () => ({
  default: () => null,
}));
vi.mock("components/ListingPage/ImageAvatar", () => ({
  default: () => null,
}));
vi.mock("components/ServerWrapper/ProductWrapper/StackedColors", () => ({
  default: () => null,
}));
vi.mock("components/ServerWrapper/ProductWrapper/ProductColorsBottomSheet", () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));
vi.mock("components/ServerWrapper/ProductWrapper/ProductColorsCards", () => ({
  // Reports whether the card asked for the deal border, so the slider case can
  // read it.
  default: ({ shouldShowOrangeBorder }: any) => (
    <span data-testid="colors-cards" data-orange={String(shouldShowOrangeBorder?.())} />
  ),
}));

const { default: ProductCard } = await import(
  "components/products/ProductCard"
);

/** One unit to the pound and no decimals, so a drawn price reads as its number. */
const CURRENCY = { exchange_rate: 1, decimal_digits: 0, symbol: "£" };

/** The orange the card draws around a product whose deal is still running. */
const DEAL_BORDER = "rgb(255, 98, 0)";

/** Midday, far from any end-of-day boundary in any timezone. */
const NOW = new Date(2026, 7, 26, 12, 0, 0);

function renderCard(product: any) {
  return renderWithProviders(
    <ProductCard
      product={product}
      currency={CURRENCY}
      country="gb"
      language="en"
      sliders={false}
      sizesFilters={null}
      fromRecomended={null}
    />,
  );
}

/** The number the footer is showing, without the currency symbol beside it. */
function shownPrice() {
  return document
    .querySelector('[data-pw="product-offer-price"]')
    ?.textContent?.trim();
}

/** The picture's inline border, which is orange only while a deal is live.
 *  jsdom reports an inline colour as `rgb(...)`, never as the hex in the source. */
function pictureBorder() {
  const img = document.querySelector("img");
  return img?.getAttribute("style") ?? "";
}

beforeEach(() => {
  bannerProps = null;
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("the product card while a flash deal is running (AC-9)", () => {
  it("shows the deal price, the countdown and the deal border", async () => {
    await renderCard(
      buildListingProduct({
        price: 100,
        offer_price: 80,
        flash_deal_price: 60,
        // Tomorrow: live in every timezone at the pinned moment.
        flash_deal_end_date: "2026-08-27",
      }),
    );

    expect(
      shownPrice(),
      "a live deal did not put the deal price in the card's footer — the deal price is 60 and the offer price is 80, so this is the case that would hide a rule returning nothing",
    ).toBe("60");

    expect(
      bannerProps,
      "the countdown banner was not rendered while the deal was still running",
    ).not.toBeNull();
    expect(
      bannerProps?.initial,
      "the card handed the countdown banner no time left, so the banner had nothing to count down from",
    ).toEqual(
      expect.objectContaining({
        days: expect.any(Number),
        hours: expect.any(Number),
        minutes: expect.any(Number),
        seconds: expect.any(Number),
      }),
    );
    expect(
      bannerProps?.end_data,
      "the card handed the countdown banner the wrong end date",
    ).toBe("2026-08-27");

    expect(
      pictureBorder(),
      "the picture did not carry the orange deal border while the deal was running",
    ).toContain(DEAL_BORDER);
  });
});

describe("the product card once the deal has ended (AC-9)", () => {
  it("falls back to the ordinary price, and drops the countdown and the border", async () => {
    await renderCard(
      buildListingProduct({
        price: 100,
        offer_price: 80,
        flash_deal_price: 60,
        // Last week: ended in every timezone at the pinned moment.
        flash_deal_end_date: "2026-08-20",
      }),
    );

    expect(
      shownPrice(),
      "an ended deal still showed the deal price instead of the offer price",
    ).toBe("80");

    expect(
      bannerProps,
      "the countdown banner was still rendered after the deal had ended",
    ).toBeNull();

    expect(
      pictureBorder(),
      "the picture kept the orange deal border after the deal had ended",
    ).not.toContain(DEAL_BORDER);
  });
});

// _specs/round-price-convert-then-round, AC-9. The listing card is a display
// screen: it keeps today's rule — round up to the currency's decimals first,
// then multiply by the rate — even where the bag shows the charged figure.
describe("the product card's price rule", () => {
  it("at rate 100 shows 7000 for 69.9998, the display figure", async () => {
    await renderWithProviders(
      <ProductCard
        product={buildListingProduct({
          price: 69.9998,
          offer_price: 69.9998,
          flash_deal_price: null,
          flash_deal_end_date: null,
        })}
        currency={{ exchange_rate: 100, decimal_digits: 2, symbol: "£" }}
        country="gb"
        language="en"
        sliders={false}
        sizesFilters={null}
        fromRecomended={null}
      />,
    );

    expect(
      shownPrice(),
      "the listing card no longer shows the display figure (7000) for 69.9998 at rate 100",
    ).toBe("7000");
  });
});

describe("the product card with no deal at all (AC-9)", () => {
  it("shows the offer price and nothing about a deal", async () => {
    await renderCard(
      buildListingProduct({
        price: 100,
        offer_price: 80,
        flash_deal_price: null,
        flash_deal_end_date: null,
      }),
    );

    expect(
      shownPrice(),
      "a product with no deal did not show its offer price",
    ).toBe("80");

    expect(
      bannerProps,
      "a product with no deal was given a countdown banner",
    ).toBeNull();

    expect(
      pictureBorder(),
      "a product with no deal carried the orange deal border",
    ).not.toContain(DEAL_BORDER);
  });
});

// ---------------------------------------------------------------------------
// Phase 25 — the card as the last step of the listing journey.
//
// Everything above is about the flash-deal rule. The cases below are about the
// one thing the listing needs from a card that nothing else in the listing can
// check: that tapping it reaches the right product page.
//
// A listing is only useful if its cards lead somewhere, and both parts of that
// address are built here from the listing's own context — the locale the shopper
// is browsing in, and the colour the card happens to be showing.
describe("the product card as a way into the product (phase 25)", () => {
  /** The link the whole card is wrapped in. */
  const cardLink = () => document.querySelector('[data-pw="product_link"]');

  it("leads to the product page", async () => {
    await renderCard(buildListingProduct({ slug: "blue-shirt" }));

    expect(
      cardLink(),
      "a listing whose cards do not link anywhere is a catalogue the shopper cannot buy from",
    ).toHaveAttribute("href", "/gb-en/products/blue-shirt");
  });

  it("stays in the locale the shopper is browsing", async () => {
    await renderWithProviders(
      <ProductCard
        product={buildListingProduct({ slug: "blue-shirt" })}
        currency={CURRENCY}
        country="sy"
        language="ar"
        sliders={false}
        sizesFilters={null}
        fromRecomended={null}
      />,
      { country: "sy", language: "ar" },
    );

    expect(
      cardLink(),
      "the country and the language are the first segment of every address in this app; a card that drops them sends an Arabic shopper in Syria to the English product page",
    ).toHaveAttribute("href", "/sy-ar/products/blue-shirt");
  });

  it("opens the product on the colour the card was showing", async () => {
    await renderCard(
      buildListingProduct({
        slug: "blue-shirt",
        sync_color_images: [
          {
            color_name: "navy blue",
            images: [{ file_path: "/product/navy.jpg" }],
          },
        ] as any,
      }),
    );

    expect(
      cardLink(),
      "the card shows one colour out of several; opening the product on a different one shows the shopper a garment they did not tap",
    ).toHaveAttribute(
      "href",
      "/gb-en/products/blue-shirt?color=navy%20blue",
    );
  });

  it("asks for no colour when the card was not showing one", async () => {
    await renderCard(
      buildListingProduct({ slug: "blue-shirt", sync_color_images: [] }),
    );

    expect(
      cardLink()?.getAttribute("href"),
      "an empty `?color=` asks the product page for a colour that does not exist, and makes a second address for one product",
    ).not.toContain("color=");
  });
});

describe("the product card with its sliders (listing pages)", () => {
  function renderSliderCard(product: any) {
    return renderWithProviders(
      <ProductCard
        product={product}
        currency={CURRENCY}
        country="gb"
        language="en"
        sliders={true}
        sizesFilters={null}
        fromRecomended={null}
      />,
    );
  }

  it("plays the product videos instead of the photos", async () => {
    const { container } = await renderSliderCard(
      buildListingProduct({ videos: ["/v/one.mp4", "/v/two.mp4"] as any }),
    );
    expect(container.querySelectorAll("video").length === 2, "the two videos are not both shown").toBe(true);
    expect(
      container.querySelector('[data-testid="colors-cards"]')?.getAttribute("data-orange"),
      "a card with no deal asked for the deal border",
    ).toBe("false");
  });

  it("shows the photos when there are no videos", async () => {
    const { container } = await renderSliderCard(
      buildListingProduct({ images: [{ file_path: "/p/a.jpg" }, { file_path: "/p/b.jpg" }] as any }),
    );
    expect(container.querySelector("video"), "a card without videos showed a video").toBeNull();
    expect(container.querySelectorAll(".embla__slide").length === 2, "the two photos are not both shown").toBe(true);
  });
});

describe("a luck product card", () => {
  it("watches whether it is on screen, and stops watching when it goes", async () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    let report: (entries: any[]) => void = () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: any) {
          report = cb;
        }
        observe = observe;
        disconnect = disconnect;
      },
    );
    const { unmount } = await renderCard(buildListingProduct({ is_luck: true, luck_price: 5 } as any));
    expect(observe, "a luck card did not watch its visibility").toHaveBeenCalled();
    report([{ isIntersecting: false }]);
    unmount();
    expect(disconnect, "the luck card kept watching after it went").toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
