// The rating line under a buyer's comment, and the recommend / don't
// recommend bar above the list.
import { describe, expect, it, vi } from "vitest";

const likeButton = vi.fn();

vi.mock("components/Server/product/LikeButtton", () => ({
  LikeButton: (p: any) => {
    likeButton(p);
    return null;
  },
}));
vi.mock("components/settings/cards/RatingStars", () => ({
  default: ({ initialRating }: any) => <span>{initialRating} stars</span>,
}));

import {
  BuyerCommentRateInfo,
  BuyersRatingBar,
} from "components/Server/product/ProductBuyersComment/BuyerCommentRateInfo";

import { render, screen } from "../../../../render";

describe("the rating line under a comment", () => {
  it("shows the stars, the quality tags and the recommendation, with a like button for the comment", () => {
    render(
      <BuyerCommentRateInfo
        language="en"
        rating={4}
        recommendation
        comment={{
          id: 3,
          is_liked: true,
          product_id: 9,
          total_likes: 2,
          good_quality_comment: true,
          true_size: true,
        }}
      />,
    );
    expect(screen.getByText("4 stars"), "the stars should be shown").toBeInTheDocument();
    expect(screen.getByText("Good Quality"), "the good quality tag is missing").toBeInTheDocument();
    expect(screen.getByText("True Size"), "the true size tag is missing").toBeInTheDocument();
    expect(screen.getByText("Recommend It"), "the recommendation is missing").toBeInTheDocument();
    expect(likeButton.mock.calls[0][0], "the like button should be for this comment").toEqual(
      expect.objectContaining({ comment_id: 3, productId: 9, total_likes: 2, target_type: "comment" }),
    );
  });

  it("leaves out tags and recommendation the buyer did not give", () => {
    render(<BuyerCommentRateInfo language="en" rating={1} recommendation={false} comment={{ id: 4 }} />);
    expect(screen.queryByText("Good Quality"), "no tag was given").toBeNull();
    expect(screen.queryByText("Recommend It"), "no recommendation was given").toBeNull();
  });
});

describe("the recommend bar", () => {
  it("shows both counts and fills the green part to the recommend share", () => {
    const { container } = render(
      <BuyersRatingBar
        language="ar"
        recommendation_stats={[
          { category: "recommend", count: 7, percentage: 70 },
          { category: "not_recommend", count: 3, percentage: 30 },
        ]}
      />,
    );
    expect(screen.getByText("7"), "the recommend count is missing").toBeInTheDocument();
    expect(screen.getByText("3"), "the do-not-recommend count is missing").toBeInTheDocument();
    expect(
      (container.querySelector(".bg-\\[\\#068D06\\]") as HTMLElement).style.width,
      "the green part should be the recommend share",
    ).toBe("70%");
    expect(
      container.querySelector(".flex-row-reverse"),
      "the bar should be mirrored in Arabic",
    ).not.toBeNull();
  });

  it("draws without stats, left to right in English", () => {
    const { container } = render(<BuyersRatingBar language="en" recommendation_stats={undefined} />);
    expect(container.querySelector(".flex-row-reverse"), "English must not be mirrored").toBeNull();
  });
});
