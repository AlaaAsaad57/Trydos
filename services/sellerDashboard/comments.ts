import { fetchData } from "utils/fetchData";

const MEDIA_SERVER_BASE_URL =
  process.env.NEXT_PUBLIC_MEDIA_SERVER_BASE_URL?.replace(/\/$/, "") ?? "";
const MEDIA_API_KEY = process.env.NEXT_PUBLIC_MEDIA_API_KEY ?? "";

const REQ_GET_FQA_COMMENTS = { reqTitle: "Get FQA Comments", code: 250 };
const REQ_GET_REVIEW_COMMENTS = { reqTitle: "Get Review Comments", code: 251 };
const REQ_REPLY_TO_FQA = { reqTitle: "Reply to FQA Comment", code: 252 };
const REQ_EDIT_REPLY_FOR_FQA = { reqTitle: "Edit Reply For Fqa Comment", code: 253 };

class SellerCommentsService {
  async GetFQAComments(sellerId: string, page: number = 1) {
    try {
      const res = await fetchData({
        url: `/shop/comments?is_review=0&page=${page}`,
        method: "GET",
        server: "market-dashboard",
        reqTitle: REQ_GET_FQA_COMMENTS,
        sellerId,
      });
      return res;
    } catch (error) {
      throw error;
    }
  }

  async GetReviewComments(sellerId: string, page: number = 1) {
    try {
      const res = await fetchData({
        url: `/shop/comments?is_review=1&page=${page}`,
        method: "GET",
        server: "market-dashboard",
        reqTitle: REQ_GET_REVIEW_COMMENTS,
        sellerId,
      });
      return res;
    } catch (error) {
      throw error;
    }
  }

  async ReplyToFQAComment(
    sellerId: string,
    commentId: string,
    replyText: string
  ) {
    try {
      const res = await fetchData({
        url: `/shop/comments/${commentId}/reply`,
        method: "POST",
        server: "market-dashboard",
        reqTitle: REQ_REPLY_TO_FQA,
        body: JSON.stringify({ seller_reply: replyText }),
        sellerId,
      });
      return res;
    } catch (error) {
      throw error;
    }
  }

  async EditReplyForFqaComment(
    sellerId: string,
    commentId: string,
    replyText: string
  ) {
    try {
      const res = await fetchData({
        url: `/shop/comments/${commentId}/reply`,
        method: "PUT",
        server: "market-dashboard",
        reqTitle: REQ_EDIT_REPLY_FOR_FQA,
        body: JSON.stringify({ seller_reply: replyText }),
        sellerId,
      });
      return res;
    } catch (error) {
      throw error;
    }
  }

  async UploadExcel(file: File) {
    if (!MEDIA_SERVER_BASE_URL || !MEDIA_API_KEY) {
      throw new Error("Media server upload is not configured");
    }

    const form = new FormData();
    form.append("file", file);

    const response = await fetch(`${MEDIA_SERVER_BASE_URL}/upload-excel`, {
      method: "POST",
      headers: {
        "x-api-key": MEDIA_API_KEY,
      },
      body: form,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || "Failed to upload excel file");
    }

    return response.json();
  }
}

const sellerCommentsService = new SellerCommentsService();
export default sellerCommentsService;
