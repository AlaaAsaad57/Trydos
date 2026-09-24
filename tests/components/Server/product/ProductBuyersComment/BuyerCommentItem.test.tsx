// One buyer's comment card. It reads the shared comment store, so an edit or
// delete made in another widget shows here too.
import { describe, expect, it, vi } from "vitest";

const menu = vi.fn();

vi.mock("components/Server/product/ProductBuyersComment/BuyersCommentMenu", () => ({
  default: (p: any) => {
    menu(p);
    return (
      <button onClick={() => p.setDisplayText("translated text")}>translate</button>
    );
  },
}));
vi.mock("components/Server/product/ProductBuyersComment/BuyerCommentRateInfo", () => ({
  BuyerCommentRateInfo: ({ rating }: any) => <span>rating {rating}</span>,
}));

import { BuyersCommentItem } from "components/Server/product/ProductBuyersComment/BuyerCommentItem";

import { renderWithProviders, screen, userEvent } from "../../../../render";

const comment = {
  id: 21,
  comment: "nice fit",
  star_rating: 4,
  variant: "Red / M",
  customer: { name: "Sara", image: "/upload/s.png" },
  isOwner: true,
  ownerId: 2,
  ownerType: "user",
  created_at: "2026-01-01T10:00:00Z",
};

const store = (over: Record<string, any> = {}) => ({
  commentEntities: {},
  deletedCommentIds: {},
  ...over,
});

describe("a buyer's comment card", () => {
  it("shows the comment and lets the menu swap in a translation", async () => {
    const { container } = await renderWithProviders(
      <BuyersCommentItem id={21} comment={comment} language="en" />,
      { store: store() },
    );
    expect(screen.getByText("nice fit"), "the comment text is missing").toBeInTheDocument();
    expect(screen.getByText("Red / M"), "the variant is missing").toBeInTheDocument();
    expect(screen.getByText("rating 4"), "the rating line is missing").toBeInTheDocument();
    expect(menu.mock.calls[0][0], "the menu should know this is a review by its owner").toEqual(
      expect.objectContaining({ comment_type: "review", isOwner: true, ownerID: 2, id: 21 }),
    );
    expect((container.firstElementChild as HTMLElement).style.direction, "English is left to right").toBe("ltr");
    await userEvent.click(screen.getByText("translate"));
    expect(screen.getByText("translated text"), "the translation should replace the text").toBeInTheDocument();
  });

  it("shows the text from the shared store when another widget edited it, right to left in Arabic", async () => {
    const { container } = await renderWithProviders(
      <BuyersCommentItem id={21} comment={{ ...comment, customer: null }} language="ar" />,
      { store: store({ commentEntities: { 21: { comment: "edited elsewhere" } } }) },
    );
    expect(screen.getByText("edited elsewhere"), "the shared edit should be shown").toBeInTheDocument();
    expect((container.firstElementChild as HTMLElement).style.direction, "Arabic is right to left").toBe("rtl");
  });

  it("disappears when the comment was deleted", async () => {
    const { container } = await renderWithProviders(
      <BuyersCommentItem id={21} comment={comment} language="en" />,
      { store: store({ deletedCommentIds: { 21: true } }) },
    );
    expect(container.innerHTML, "a deleted comment must not be shown").toBe("");
  });
});
