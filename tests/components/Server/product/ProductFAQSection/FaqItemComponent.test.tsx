// One FAQ question card, with the seller's answer under it or a
// "waiting for the seller" note.
import { describe, expect, it, vi } from "vitest";

const likeButton = vi.fn();
const menu = vi.fn();

vi.mock("components/Server/product/LikeButtton", () => ({
  LikeButton: (p: any) => {
    likeButton(p);
    return null;
  },
}));
vi.mock("components/Server/product/ProductBuyersComment/BuyersCommentMenu", () => ({
  default: (p: any) => {
    menu(p);
    return <button onClick={() => p.setDisplayText("question translated")}>translate question</button>;
  },
}));
vi.mock("components/Server/product/ProductBuyersComment/BuyersReplyMenu", () => ({
  default: (p: any) => (
    <button onClick={() => p.setDisplayReply("answer translated")}>translate answer</button>
  ),
}));

import FaqItemComponent from "components/Server/product/ProductFAQSection/FaqItemComponent";

import { renderWithProviders, screen, userEvent } from "../../../../render";

const question = {
  id: 31,
  comment: "does it run small?",
  customer: { name: "Omar" },
  product_id: 9,
  total_likes: 1,
  created_at: "2026-01-01T10:00:00Z",
};
const store = (over: Record<string, any> = {}) => ({
  commentEntities: {},
  deletedCommentIds: {},
  ...over,
});
const card = () => document.querySelector('[data-pw="faq-item"]') as HTMLElement;

describe("an FAQ question card", () => {
  it("shows the question and a waiting note when the seller has not answered", async () => {
    await renderWithProviders(
      <FaqItemComponent id={31} comment={question} language="en" isRtl={false} />,
      { store: store() },
    );
    expect(screen.getByText("does it run small?"), "the question text is missing").toBeInTheDocument();
    expect(screen.getByText("Waiting Seller Reply..."), "an unanswered question should say so").toBeInTheDocument();
    expect(card().getAttribute("data-has-reply"), "the card should say it has no answer").toBe("false");
    expect(menu.mock.calls[0][0].comment_type, "the menu should treat it as an FAQ").toBe("faq");
    expect(card().parentElement?.className, "a default-width card is 80% wide").toContain("min-w-[80%]");
    await userEvent.click(screen.getByText("translate question"));
    expect(screen.getByText("question translated"), "the question translation should show").toBeInTheDocument();
  });

  it("shows the seller's answer with its own like button and translate menu", async () => {
    await renderWithProviders(
      <FaqItemComponent
        id={31}
        comment={{ ...question, has_reply: true, seller_reply: "true to size", reply_total_likes: 4 }}
        language="ar"
        isRtl
        width={100}
        seller_name="Shop"
        isFromComments
      />,
      { store: store() },
    );
    expect(screen.getByText("true to size"), "the answer text is missing").toBeInTheDocument();
    expect(card().getAttribute("data-has-reply"), "the card should say it has an answer").toBe("true");
    expect(card().className, "a card from the comments tab gets its text class").toContain("comment-item-text");
    expect(card().style.direction, "Arabic is right to left").toBe("rtl");
    expect(
      likeButton.mock.calls.map(([p]) => p.target_type),
      "the question and the answer each get a like button",
    ).toEqual(expect.arrayContaining(["comment", "seller_reply"]));
    await userEvent.click(screen.getByText("translate answer"));
    expect(screen.getByText("answer translated"), "the answer translation should show").toBeInTheDocument();
  });

  it("disappears when the question was deleted", async () => {
    const { container } = await renderWithProviders(
      <FaqItemComponent id={31} comment={question} language="en" isRtl={false} />,
      { store: store({ deletedCommentIds: { 31: true } }) },
    );
    expect(container.innerHTML, "a deleted question must not be shown").toBe("");
  });
});
