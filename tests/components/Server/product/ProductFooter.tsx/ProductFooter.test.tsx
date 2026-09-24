// The product page footer: add to bag, like, comment, share and more. Each tab
// button opens its tab in the extended area, and the dimmed overlay closes it.
// While the shopper is picking contacts to share with, the bar turns into the
// share button.
import { describe, expect, it, vi } from "vitest";

const extended = vi.fn();
const shareButton = vi.fn();

vi.mock("components/products/ExtendedAreaInfo", () => ({
  default: (props: any) => {
    extended(props);
    return null;
  },
}));
vi.mock("components/products/AddToCartButton", () => ({ default: () => <div data-pw="add-to-cart" /> }));
vi.mock("components/products/ShareButton", () => ({
  default: (props: any) => {
    shareButton(props);
    return <button type="button" onClick={props.close}>send share</button>;
  },
}));
vi.mock("components/Server/product/ProductFooter.tsx/ProductLikeButton", () => ({ default: () => <div data-pw="like" /> }));
vi.mock("components/Server/product/ProductFooter.tsx/ProductCommentButton", () => ({
  default: ({ setActive }: any) => <button type="button" onClick={setActive}>comment</button>,
}));
vi.mock("components/Server/product/ProductFooter.tsx/ProductShareButton", () => ({
  default: ({ setActive }: any) => <button type="button" onClick={setActive}>share</button>,
}));
vi.mock("components/Server/product/ProductFooter.tsx/ProductMoreButton", () => ({
  default: ({ setActive }: any) => <button type="button" onClick={setActive}>more</button>,
}));

import ProductFooter from "components/Server/product/ProductFooter.tsx/ProductFooter";

import { fireEvent, renderWithProviders, screen } from "../../../../render";

const product = { id: 9, name: "Shoe", brand: { name: "Nike", id: 1 }, category: { name: "Men", id: 2 } };
const lastTab = () => extended.mock.calls.at(-1)[0].option;

describe("the product page footer", () => {
  it("draws nothing while the sign-in window is open", async () => {
    const { container } = await renderWithProviders(<ProductFooter isRtl={false} productLightData={product} />, {
      store: { loginOpen: true },
    });
    expect(container.innerHTML, "the footer must hide under the sign-in window").toBe("");
  });

  it.each([
    ["comment", "Comment"],
    ["share", "shares"],
    ["more", "More"],
  ])("tapping %s opens the %s tab, and the overlay closes it", async (button, tab) => {
    const setSelectedContactsForShare = vi.fn();
    await renderWithProviders(<ProductFooter isRtl productLightData={product} />, {
      store: { setSelectedContactsForShare },
    });
    fireEvent.click(screen.getByText(button));
    expect(lastTab(), `tapping ${button} should open its tab`).toBe(tab);
    fireEvent.click(document.querySelector('[data-pw="close_extended_area"]') as HTMLElement);
    expect(lastTab(), "the overlay should close the tab").toBe(false);
    expect(setSelectedContactsForShare, "closing should clear any chosen contacts").toHaveBeenCalledWith([]);
  });

  it("shows the share button while contacts are chosen, and it closes the tab when done", async () => {
    await renderWithProviders(<ProductFooter isRtl={false} productLightData={{ ...product, slug: "shoe", offer_price: 5 }} />, {
      store: { selectedContactsForShare: [{ id: 1 }] },
    });
    expect(shareButton.mock.calls.at(-1)[0].slug, "the share button should get the product").toBe("shoe");
    fireEvent.click(screen.getByText("send share"));
    expect(lastTab(), "sending the share should close the tab").toBe(false);
  });
});
