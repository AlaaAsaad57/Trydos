// The main photo slider of the product page (server side). It builds one set of
// slides per colour, rounds the outer corners, draws an orange frame during a
// flash deal, and puts the flash-deal banner, the luck counter and the try-on
// button on the first photo.
import { afterEach, describe, expect, it, vi } from "vitest";

import { render } from "@testing-library/react";

const { getCookieServer, seen } = vi.hoisted(() => ({
  getCookieServer: vi.fn(),
  seen: {} as any,
}));

vi.mock("utils/cookies/server-cookie-manager", () => ({
  getCookieServer: (...a: any[]) => getCookieServer(...a),
}));
vi.mock("components/products/ActiveColorSlider", () => ({
  default: (p: any) => {
    seen.slider = p;
    return (
      <div>
        {p.slidesByColor.map((g: any, i: number) => (
          <div key={i} data-pw="group">
            {g.slides}
          </div>
        ))}
      </div>
    );
  },
}));
vi.mock("components/products/ProductImageIndicator", () => ({ default: () => null }));
vi.mock("components/products/VirtualTryOn", () => ({ default: () => <span data-pw="try-on" /> }));
vi.mock("components/products/FlashDealBanner", () => ({
  default: (p: any) => {
    seen.flash = p.initial;
    return <span data-pw="flash-banner" />;
  },
}));
vi.mock("components/products/ProductRedeemCounter", () => ({ default: () => <span data-pw="luck-counter" /> }));

import ProductPhotoSliderWrapper from "components/Server/product/ProductPhotoSliderWrapper";

const inDays = (days: number) => new Date(Date.now() + days * 86400000).toISOString();

async function renderSlider({
  language = "en",
  product = {},
  qty = {},
}: { language?: string; product?: any; qty?: any }) {
  const element = await ProductPhotoSliderWrapper({
    language,
    color: null,
    globalPromise: Promise.resolve({ id: 1, name: "Shoe", images: ["/upload/a.png"], ...product }),
    qtyPromise: Promise.resolve({ id: 1, offer_price: 9, ...qty }),
  });
  return render(element);
}

const frames = (container: HTMLElement) => container.querySelectorAll("svg.z-55");

describe("the product photo slider", () => {
  afterEach(() => getCookieServer.mockReset());

  it("with one photo during a flash deal: frames it, shows the deal banner, luck counter and try-on", async () => {
    getCookieServer.mockResolvedValue([{ id: 99 }]);
    const { container } = await renderSlider({
      language: "ar",
      product: { flash_deal_end_date: inDays(2), categories: [{ icon: "i", name: "Men", id: 3 }], brand: { id: 2, name: "Nike" } },
      qty: { is_luck: true },
    });
    expect(frames(container).length, "a flash-deal photo should get an orange frame").toBe(1);
    expect(container.querySelector('[data-pw="flash-banner"]'), "the flash-deal banner should show").not.toBeNull();
    expect(seen.flash.days, "the banner should start from the days left").toBeGreaterThanOrEqual(1);
    expect(container.querySelector('[data-pw="luck-counter"]'), "an unredeemed luck product should show the counter").not.toBeNull();
    expect(container.querySelector('[data-pw="try-on"]'), "a category with an icon should offer try-on").not.toBeNull();
    expect(container.querySelector("img")?.className, "a single photo should be rounded all round").toContain("rounded-[15px]");
    expect(seen.slider.productGA, "the analytics facts should come from the product").toEqual(
      expect.objectContaining({ item_id: 1, brand: "Nike", category: "Men", price: 9 }),
    );
  });

  it.each([
    ["en", "rounded-tl-[15px]", "rounded-tr-[15px]"],
    ["ar", "rounded-tr-[15px]", "rounded-tl-[15px]"],
  ])("with several photos in %s: rounds the outer corners and frames each photo", async (language, first, last) => {
    const { container } = await renderSlider({
      language,
      product: { flash_deal_end_date: inDays(1), images: ["/upload/a.png", "/upload/b.png", "/upload/c.png"] },
    });
    const imgs = container.querySelectorAll("img");
    expect(imgs[0].className, "the first photo should round its outer side").toContain(first);
    expect(imgs[2].className, "the last photo should round its outer side").toContain(last);
    expect(imgs[1].className, "a middle photo should not be rounded").not.toContain("rounded");
    expect(frames(container).length, "every photo should be framed during a flash deal").toBe(3);
  });

  it("shows no luck counter for a product the shopper already redeemed", async () => {
    getCookieServer.mockResolvedValue([{ id: "1" }]);
    const { container } = await renderSlider({ qty: { is_luck: true } });
    expect(container.querySelector('[data-pw="luck-counter"]'), "a redeemed product must not show the luck counter").toBeNull();
  });

  it("shows a luck counter when the shopper has no redeem cookie", async () => {
    getCookieServer.mockResolvedValue(null);
    const { container } = await renderSlider({ qty: { is_luck: true } });
    expect(container.querySelector('[data-pw="luck-counter"]'), "an unredeemed luck product should show the counter").not.toBeNull();
  });

  it("shows no banner and no frame once the deal has ended, or when there is no deal", async () => {
    const ended = await renderSlider({ product: { flash_deal_end_date: inDays(-3) } });
    expect(ended.container.querySelector('[data-pw="flash-banner"]'), "an ended deal must not show a banner").toBeNull();
    ended.unmount();
    const none = await renderSlider({ product: { images: ["/upload/a.png", "/upload/b.png"] } });
    expect(frames(none.container).length, "no deal means no frame").toBe(0);
    expect(getCookieServer, "a product without luck needs no cookie read").not.toHaveBeenCalled();
  });
});
