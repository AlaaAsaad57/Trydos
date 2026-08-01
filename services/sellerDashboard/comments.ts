// Seller-dashboard comments service.
//
// All read/reply/edit/delete operations now go straight to Elasticsearch via the
// secure server actions in `services/elastic/sellerComments.ts` — the Python
// comments backend is no longer used for the dashboard. The `sellerId` passed
// here is only a hint: the server action re-verifies shop ownership and the
// required permission against the market backend before touching any document,
// so a forged sellerId/commentId can never read or mutate another shop's data.
import {
  getSellerComments,
  replyToComment,
  editReply,
  deleteReply,
  getSellerProductsSocial,
} from "services/elastic/sellerComments";

const MEDIA_SERVER_BASE_URL =
  process.env.NEXT_PUBLIC_MEDIA_SERVER_BASE_URL?.replace(/\/$/, "") ?? "";
const MEDIA_API_KEY = process.env.NEXT_PUBLIC_MEDIA_API_KEY ?? "";

class SellerCommentsService {
  async GetFQAComments(sellerId: string, page: number = 1): Promise<any> {
    return getSellerComments({ sellerId, isReview: false, page });
  }

  async GetReviewComments(sellerId: string, page: number = 1): Promise<any> {
    return getSellerComments({ sellerId, isReview: true, page });
  }

  async ReplyToFQAComment(
    sellerId: string,
    commentId: string,
    replyText: string,
  ): Promise<any> {
    return replyToComment({ sellerId, commentId, replyText });
  }

  async EditReplyForFqaComment(
    sellerId: string,
    commentId: string,
    replyText: string,
  ): Promise<any> {
    return editReply({ sellerId, commentId, replyText });
  }

  async DeleteReplyForFqaComment(
    sellerId: string,
    commentId: string,
  ): Promise<any> {
    return deleteReply({ sellerId, commentId });
  }

  // Per-product social counts (reactions / FAQ / reviews / shares). Permission
  // gating + Elasticsearch live in the server action; sellerId is only a hint.
  async GetProductsSocial(
    sellerId: string,
    productIds: Array<string | number>,
  ): Promise<any> {
    return getSellerProductsSocial({ sellerId, productIds });
  }
}

const sellerCommentsService = new SellerCommentsService();
export default sellerCommentsService;
