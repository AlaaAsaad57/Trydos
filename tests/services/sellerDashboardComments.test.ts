import { describe, expect, it, vi, beforeEach } from "vitest";
import sellerCommentsService from "services/sellerDashboard/comments";
import * as sellerCommentsElastic from "services/elastic/sellerComments";

vi.mock("services/elastic/sellerComments", () => ({
  getSellerComments: vi.fn(),
  replyToComment: vi.fn(),
  editReply: vi.fn(),
  deleteReply: vi.fn(),
  getSellerProductsSocial: vi.fn(),
}));

describe("SellerCommentsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GetFQAComments delegates to getSellerComments with isReview: false", async () => {
    vi.mocked(sellerCommentsElastic.getSellerComments).mockResolvedValueOnce({ items: [] } as any);

    await sellerCommentsService.GetFQAComments("seller-123", 2);

    expect(sellerCommentsElastic.getSellerComments, "should pass sellerId, page, and isReview false").toHaveBeenCalledWith({
      sellerId: "seller-123",
      isReview: false,
      page: 2,
    });
  });

  it("GetReviewComments delegates to getSellerComments with isReview: true", async () => {
    vi.mocked(sellerCommentsElastic.getSellerComments).mockResolvedValueOnce({ items: [] } as any);

    await sellerCommentsService.GetReviewComments("seller-123", 1);

    expect(sellerCommentsElastic.getSellerComments, "should pass sellerId, page, and isReview true").toHaveBeenCalledWith({
      sellerId: "seller-123",
      isReview: true,
      page: 1,
    });
  });

  it("ReplyToFQAComment delegates to replyToComment", async () => {
    vi.mocked(sellerCommentsElastic.replyToComment).mockResolvedValueOnce({ success: true } as any);

    await sellerCommentsService.ReplyToFQAComment("seller-123", "cmt-1", "Thanks!");

    expect(sellerCommentsElastic.replyToComment, "should pass sellerId, commentId, and replyText").toHaveBeenCalledWith({
      sellerId: "seller-123",
      commentId: "cmt-1",
      replyText: "Thanks!",
    });
  });

  it("DeleteReplyForFqaComment delegates to deleteReply", async () => {
    vi.mocked(sellerCommentsElastic.deleteReply).mockResolvedValueOnce({ success: true } as any);

    await sellerCommentsService.DeleteReplyForFqaComment("seller-123", "cmt-1");

    expect(sellerCommentsElastic.deleteReply, "should pass sellerId and commentId").toHaveBeenCalledWith({
      sellerId: "seller-123",
      commentId: "cmt-1",
    });
  });
});
