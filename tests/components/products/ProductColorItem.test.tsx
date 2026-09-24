// One colour thumbnail on a product page. The colour in the live color param
// is marked and is not a link; every other colour links to its own URL.
import { describe, expect, it, vi } from "vitest";

import ProductColorItem from "components/products/ProductColorItem";

import { renderWithProviders } from "../../render";

vi.mock("components/global/NextLink", () => ({
  default: ({ href, children, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const PROPS = {
  colorKeys: ["red", "Red"],
  href: "/sy-en/products/shoe?color=red",
  imgSrc: "https://example.com/red.jpg",
  alt: "Red",
};

describe("ProductColorItem", () => {
  it("is not a link when it is the live colour, and shows the trend mark", async () => {
    const { container } = await renderWithProviders(
      <ProductColorItem {...PROPS} serverColor="blue" trend />,
      { search: "color=red" },
    );
    expect(container.querySelector("a"), "the active colour is a link").toBeNull();
    expect(container.querySelector('img[src="/icons/TrendColorIcon.svg"]'), "the trend mark is missing").not.toBeNull();
  });

  it("links to another colour, without the trend mark, and with an empty alt by default", async () => {
    const { container } = await renderWithProviders(
      <ProductColorItem {...PROPS} alt={undefined} serverColor="blue" trend={false} />,
    );
    expect(container.querySelector("a")!.getAttribute("href"), "the colour does not link to its URL").toBe(PROPS.href);
    expect(container.querySelector('img[src="/icons/TrendColorIcon.svg"]'), "a trend mark showed").toBeNull();
    expect(container.querySelector('img[alt=""]'), "the default alt is not empty").not.toBeNull();
  });
});
