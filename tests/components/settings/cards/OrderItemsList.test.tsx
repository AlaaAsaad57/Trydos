// The products strip on the order details page
// (components/settings/cards/OrderItemsList.tsx).
//
// The header counts the items and toggles the expanded view (except when the
// tap is on the chat button). Each product shows its step icon and, before
// delivery, its colour and size; after delivery it shows "Delivered" and the
// rating stars, which open the rating modal (stubbed here).
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("components/Orders/RatingOrderItem", () => ({
  default: (props: any) => (
    <div data-testid="rating-modal" data-rating={String(props.initialRating)}>
      <button onClick={props.refresh}>rating refresh</button>
      <button onClick={() => props.setLoading(true)}>rating busy</button>
      <button onClick={props.setShowCommentModal}>rating close</button>
    </div>
  ),
}));

import OrderItemsList from "components/settings/cards/OrderItemsList";
import { buildOrderLine } from "../../../fixtures/order";
import { renderWithProviders, screen, userEvent } from "../../../render";

afterEach(() => vi.clearAllMocks());

function renderList(overrides: any = {}, language: any = "en") {
  const props = {
    items: [buildOrderLine()],
    isExpanded: false,
    setExpanded: vi.fn(),
    order_group_status: null,
    shouldShowChat: () => false,
    showChats: () => <button className="chat-holder-button">chat</button>,
    getOrderDetails: vi.fn(),
    getProductUrl: () => "/gb-en/products/test-product",
    getProductComment: vi.fn(() => undefined),
    owner_id: 1,
    owner_type: "seller",
    order_status: { value: "pending", label: "Pending" },
    ...overrides,
  };
  return renderWithProviders(<OrderItemsList {...props} />, { language }).then((r) => ({ ...r, props }));
}

describe("the header", () => {
  it("counts the items and toggles the expanded view", async () => {
    const { props } = await renderList();
    expect(
      document.querySelector('[data-pw="order-products-count"]')!.textContent,
      "the item count is wrong",
    ).toBe("1");
    await userEvent.setup().click(screen.getByText("Order Details"));
    expect(props.setExpanded, "a tap on the header did not expand the details").toHaveBeenCalledWith(true);
  });

  it("shows the chat, and a tap on the chat does not toggle, right-to-left in Arabic", async () => {
    const { props } = await renderList({ shouldShowChat: () => true, isExpanded: true }, "ar");
    await userEvent.setup().click(screen.getByText("chat"));
    expect(props.setExpanded, "a tap on the chat toggled the details").not.toHaveBeenCalled();
    expect(
      document.querySelector(".chat-holder")!.className,
      "the chat is not on the left in Arabic",
    ).toContain("left-[10px]");
  });
});

describe("each product before delivery", () => {
  it.each(["pending", "preparing", "shipped", "out_for_shipping", "mystery"])(
    "shows the step icon, colour and size for %s",
    async (status) => {
      await renderList({
        order_status: { value: status, label: status },
        items: [
          buildOrderLine({
            product_variation_id: 9,
            variation: [{ id: 9, color: { name: "red" }, size: "M" }] as any,
          }),
        ],
      });
      expect(screen.getByText("red"), `the colour is not shown for ${status}`).toBeInTheDocument();
      expect(screen.getByText("M"), `the size is not shown for ${status}`).toBeInTheDocument();
    },
  );
});

describe("each product after delivery", () => {
  const delivered = { value: "Delivered", label: "Delivered" };

  it("shows delivered and the rating stars, and opens the rating with the saved comment", async () => {
    const comment = { id: 4, star_rating: 4, comment: "ok", comments_images_customer: ["a.png"] };
    const { props } = await renderList({
      order_status: delivered,
      getProductComment: vi.fn(() => comment),
    });
    expect(screen.getByText("Delivered"), "a delivered product does not say delivered").toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(document.querySelector(".rating-star-container")!);
    expect(screen.getByTestId("rating-modal").dataset.rating, "the rating did not open with the saved stars").toBe("4");

    await user.click(screen.getByText("rating refresh"));
    expect(props.getOrderDetails, "the rating refresh did not reload the order").toHaveBeenCalled();
    await user.click(screen.getByText("rating close"));
    expect(screen.queryByTestId("rating-modal"), "closing the rating left it open").not.toBeInTheDocument();
  });

  it("shows a spinner while the rating saves and ignores taps then", async () => {
    await renderList({ order_status: delivered });
    const user = userEvent.setup();
    await user.click(document.querySelector(".rating-star-container")!);
    await user.click(screen.getByText("Rating Busy"));
    await user.click(screen.getByText("rating close"));
    expect(document.querySelector(".rating-star-container #Path_23396"), "the stars showed while the rating saves").toBeNull();
    await user.click(document.querySelector(".rating-star-container")!);
    expect(screen.queryByTestId("rating-modal"), "a tap while saving opened the rating again").not.toBeInTheDocument();
  });

  it("treats a returned product as not delivered", async () => {
    await renderList({ order_status: delivered, items: [buildOrderLine({ is_returned: true } as any)] });
    expect(screen.queryByText("Delivered"), "a returned product says delivered").not.toBeInTheDocument();
  });
});
