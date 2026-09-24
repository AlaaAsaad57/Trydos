// One row in the notifications panel. The backend sends the details as a JSON
// string in `description`; the row picks its picture, its text and where a
// click goes from that.
import { describe, expect, it, vi } from "vitest";

vi.mock("components/global/NextLink", () => ({
  default: ({ href, data, children }: any) => (
    <a
      href={href}
      data-link-data={JSON.stringify(data)}
      onClick={(event) => event.preventDefault()}
    >
      {children}
    </a>
  ),
}));

import NotificationItem from "components/Notifications/NotificationItem";

import { fireEvent, renderWithProviders, screen } from "../../render";

const setup = async (description: unknown, extra: Record<string, any> = {}) => {
  const onClose = vi.fn();
  const closeWindow = vi.fn();
  const enableCart = vi.fn();
  const disableAddToCartOption = vi.fn();
  const result = await renderWithProviders(
    <NotificationItem
      notification={{
        title: "A title",
        updated_at: "2026-01-01T10:00:00Z",
        description: typeof description === "string" ? description : JSON.stringify(description),
        ...extra,
      }}
      onClose={onClose}
      closeWindow={closeWindow}
    />,
    { country: "sy", store: { enableCart, disableAddToCartOption } },
  );
  const link = () => result.container.querySelector("a");
  return { onClose, closeWindow, enableCart, disableAddToCartOption, link, ...result };
};

describe("a notification row", () => {
  it("opens the boutique of a 'boutique created' notice and closes the panel", async () => {
    const { link, onClose, closeWindow, container } = await setup({
      type: "boutique created",
      description: "New boutique",
      boutique_slug: "zara",
      boutique_icon: { file_path: "/icons/zara.png" },
      boutique_description: "<b>Fashion</b><script>alert(1)</script>",
    });

    expect(link()?.getAttribute("href"), "a boutique notice must link to the boutique page").toBe(
      "/sy-en/filters/boutiques/zara",
    );
    expect(JSON.parse(link()?.getAttribute("data-link-data") || "{}").is_boutique, "the loader must know a boutique is opening").toBe(
      true,
    );
    expect(screen.getByRole("img"), "the boutique icon must be the row picture").toHaveAttribute(
      "src",
      "https://example.com/icons/zara.png",
    );
    expect(container.querySelector('[data-pw="tester-not-know"]')?.innerHTML, "the boutique text must be shown without its script").toBe(
      "<b>Fashion</b>",
    );

    fireEvent.click(screen.getByText("New boutique"));
    expect(closeWindow, "a click must close the notifications window").toHaveBeenCalled();
    expect(onClose, "a click must close the notifications panel").toHaveBeenCalled();
  });

  it("opens the cart for a 'product hurry up' notice", async () => {
    const { enableCart, disableAddToCartOption, onClose, link } = await setup({
      type: "product hurry up now",
      description: "Hurry",
      image: { file_path: "products/shoe.png" },
    });

    expect(link(), "a hurry-up notice opens the cart, not a page").toBeNull();
    expect(screen.getByRole("img"), "the product image must be the row picture").toHaveAttribute(
      "src",
      "https://example.com/products/shoe.png",
    );
    fireEvent.click(screen.getByText("Hurry"));
    expect(enableCart, "a hurry-up notice must open the cart").toHaveBeenCalledWith(true);
    expect(disableAddToCartOption, "a hurry-up notice must close the add-to-cart option").toHaveBeenCalled();
    expect(onClose, "the panel must close after the click").toHaveBeenCalled();
  });

  it("opens the product page of a product notice, by product_slug or slug", async () => {
    const first = await setup({ type: "product discount", description: "Sale", product_slug: "shoe", image: "https://cdn.test/a.png" });
    expect(first.link()?.getAttribute("href"), "a product notice must link to its product by product_slug").toBe(
      "/sy-en/products/shoe",
    );
    expect(screen.getByRole("img"), "a plain image address must be used as it is").toHaveAttribute("src", "https://cdn.test/a.png");
    fireEvent.click(screen.getByText("Sale"));
    expect(first.onClose, "a click on a product notice must close the panel").toHaveBeenCalled();
    first.unmount();

    const second = await setup({ type: "product back", description: "Back", slug: "hat", boutique_icon: "https://cdn.test/b.png" });
    expect(second.link()?.getAttribute("href"), "with no product_slug the plain slug must be used").toBe("/sy-en/products/hat");
    expect(screen.getByRole("img"), "a plain boutique icon address must be used").toHaveAttribute("src", "https://cdn.test/b.png");
  });

  it("opens the category page of a 'category created' notice", async () => {
    const first = await setup({ type: "category created", description: "New category", category_slug: "men", image_svg: "https://cdn.test/c.svg" });
    expect(first.link()?.getAttribute("href"), "a category notice must link to /categories/<slug>").toBe(
      "/sy-en/categories/men",
    );
    expect(screen.getByRole("img"), "the category svg must be the row picture").toHaveAttribute("src", "https://cdn.test/c.svg");
    fireEvent.click(screen.getByText("New category"));
    expect(first.onClose, "a click on a category notice must close the panel").toHaveBeenCalled();
    first.unmount();

    const second = await setup({ type: "category created", description: "Other", slug: "kids" });
    expect(second.link()?.getAttribute("href"), "with no category_slug the plain slug must be used").toBe(
      "/sy-en/categories/kids",
    );
  });

  it("opens the order page of an order notice", async () => {
    const { link, onClose } = await setup({ type: "order shipped", description: "Shipped", order_group_id: 42 });
    expect(link()?.getAttribute("href"), "an order notice must link to the order in settings").toBe(
      "/sy-en/settings/orders/42",
    );
    expect(document.querySelector('[data-pw="svg-notification"]'), "with no image the bell icon must be shown").toBeInTheDocument();
    fireEvent.click(screen.getByText("Shipped"));
    expect(onClose, "a click on an order notice must close the panel").toHaveBeenCalled();
  });

  it("shows a plain-text notice with no link", async () => {
    const { link, enableCart } = await setup("Welcome to Trydos");
    expect(screen.getByText("Welcome to Trydos"), "a plain-text notice must show its text").toBeInTheDocument();
    expect(link(), "a plain-text notice has nowhere to go").toBeNull();
    fireEvent.click(screen.getByText("Welcome to Trydos"));
    expect(enableCart, "a plain-text notice must not open the cart").not.toHaveBeenCalled();
  });

  it(
    "BUG-global-4: a JSON notice with no type does not open the cart",
    async () => {
      const { enableCart } = await setup({ description: "System message" });
      fireEvent.click(screen.getByText("System message"));
      expect(enableCart, "a notice with no type must not open the cart").not.toHaveBeenCalled();
    },
  );
});
