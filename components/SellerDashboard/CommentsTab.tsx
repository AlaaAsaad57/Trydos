"use client";
import React, { useState, useEffect } from "react";
import sellerCommentsService from "services/sellerDashboard/comments";
import { translateFunction, LogError } from "utils/functions";
import { DashIcon } from "components/SellerDashboard/ui/icons";
import {
  DashButton,
  LoadingState,
  EmptyState,
  Segmented,
} from "components/SellerDashboard/ui";
import RatingStars from "components/settings/cards/RatingStars";
import "styles/comment.css";

const FALLBACK_AVATAR = "/images/profileNo.png";

interface CommentsTabProps {
  sellerId: string;
  language: string;
  isRtl: boolean;
  // Permission flags (UX only — the server actions re-enforce them).
  canReply: boolean;
  canEditReply: boolean;
  canDelete: boolean;
}

interface CommentData {
  comment_id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  text: string;
  rating: number | null;
  variant: string;
  created_at: string;
  seller_reply: string;
  has_reply: boolean;
  seller_name: string;
  reply_created_at: string | null;
  // Heart/reaction counts (enriched server-side from the reactions index).
  total_likes: number;
  reply_total_likes: number;
}

function formatDate(value: string | null, language: string) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(
    language === "ar" ? "ar-EG" : "en-US",
    { year: "numeric", month: "short", day: "numeric" },
  );
}

// Static heart + count — same look as the storefront's LikeButton, but
// display-only (the dashboard shows totals, it doesn't react).
function HeartCount({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-[4px] text-[#1d1d1d] text-[9px] regular select-none">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="11"
        height="11"
        viewBox="0 0 11 11"
        className="scale-[1.2]"
      >
        <path
          d="M5.5 9.79L4.85 9.24C2.43 7.13 1 5.66 1 3.94 1 2.51 2.02 1.46 3.45 1.46 c0.8 0 1.57.37 2.05.95 0.48-.58 1.25-.95 2.05-.95 1.43 0 2.45 1.05 2.45 2.48 0 1.72-1.43 3.19-3.85 5.3L5.5 9.79z"
          strokeWidth="0.5"
          stroke="#1d1d1d"
          fill="transparent"
        />
      </svg>
      <span>{(count ?? 0).toLocaleString()}</span>
    </div>
  );
}

export default function CommentsTab({
  sellerId,
  language,
  isRtl,
  canReply,
  canEditReply,
  canDelete,
}: CommentsTabProps) {
  const [subTab, setSubTab] = useState<"faq" | "reviews">("faq");
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);

  // Reply Modal State
  const [replyModalOpen, setReplyModalOpen] = useState<boolean>(false);
  const [selectedComment, setSelectedComment] = useState<CommentData | null>(null);
  const [replyText, setReplyText] = useState<string>("");
  const [submittingReply, setSubmittingReply] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchComments = async (resetPage = false) => {
    try {
      const nextPage = resetPage ? 1 : page;
      if (resetPage) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const res = subTab === "faq"
        ? await sellerCommentsService.GetFQAComments(sellerId, nextPage)
        : await sellerCommentsService.GetReviewComments(sellerId, nextPage);

      // fetchData returns { success: false } instead of throwing — treat that as
      // a failure so it flows into the catch and gets logged.
      if (!res?.success) {
        throw new Error(res?.message || "Failed to load comments");
      }

      // Adjust to support standard Paginated response structures:
      // e.g. { data: { comments: [...], meta: { has_more_pages, last_page } } }
      // Or { data: [...], has_more: boolean }
      // Or fallback array direct
      const responseData = res.data?.comments || res.data || [];
      const meta = res.data?.meta || res.meta || null;

      const items: CommentData[] = Array.isArray(responseData) ? responseData : [];
      
      if (resetPage) {
        setComments(items);
        setPage(2);
      } else {
        setComments((prev) => [...prev, ...items]);
        setPage((prev) => prev + 1);
      }

      // Check if more pages exist
      if (meta) {
        setHasMore(meta.current_page < meta.last_page || meta.has_more_pages === true);
      } else {
        setHasMore(items.length >= 10); // heuristic fallback
      }

    } catch (error) {
      LogError({
        scenario: "CommentsTab.fetchComments",
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchComments(true);
  }, [subTab, sellerId]);

  const openReplyModal = (comment: CommentData) => {
    setSelectedComment(comment);
    setReplyText(comment.seller_reply || "");
    setReplyModalOpen(true);
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComment || !replyText.trim()) return;

    try {
      setSubmittingReply(true);
      const res = selectedComment.has_reply
        ? await sellerCommentsService.EditReplyForFqaComment(sellerId, selectedComment.comment_id, replyText)
        : await sellerCommentsService.ReplyToFQAComment(sellerId, selectedComment.comment_id, replyText);
      if (!res?.success) {
        throw new Error(res?.message || "Failed to submit reply");
      }

      // Update local comment state
      setComments((prev) =>
        prev.map((c) =>
          c.comment_id === selectedComment.comment_id
            ? { ...c, has_reply: true, seller_reply: replyText }
            : c
        )
      );
      setReplyModalOpen(false);
      setSelectedComment(null);
      setReplyText("");
    } catch (error) {
      LogError({
        scenario: "CommentsTab.handleReplySubmit",
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteReply = async (comment: CommentData) => {
    if (!comment.has_reply || deletingId) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        translateFunction("Delete this reply?", language),
      )
    ) {
      return;
    }
    try {
      setDeletingId(comment.comment_id);
      const res = await sellerCommentsService.DeleteReplyForFqaComment(
        sellerId,
        comment.comment_id,
      );
      if (!res?.success) {
        throw new Error(res?.message || "Failed to delete reply");
      }
      setComments((prev) =>
        prev.map((c) =>
          c.comment_id === comment.comment_id
            ? { ...c, has_reply: false, seller_reply: "" }
            : c,
        ),
      );
    } catch (error) {
      LogError({
        scenario: "CommentsTab.handleDeleteReply",
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full space-y-5">
      {/* Sub-tab Switcher */}
      <Segmented
        value={subTab}
        onChange={(v) => setSubTab(v)}
        options={[
          { value: "faq", label: translateFunction("FAQ", language) },
          { value: "reviews", label: translateFunction("Reviewing", language) },
        ]}
      />

      {loading ? (
        <LoadingState label={translateFunction("Loading...", language)} />
      ) : comments.length === 0 ? (
        <EmptyState
          icon="comments"
          title={translateFunction("No comments found.", language)}
          subtitle={translateFunction(
            "Check back later for comments from customers.",
            language,
          )}
        />
      ) : (
        <div className="space-y-4 max-w-[640px]">
          {/* Cards mirror the storefront product page: BuyersCommentItem for
              reviews, FaqItemComponent (question + shop reply) for FAQ. No
              status badge / comment id / product id is surfaced here. */}
          {comments.map((comment) => {
            const isReview = subTab === "reviews";
            return (
              <div key={comment.comment_id} className="flex-col w-full">
                {/* Customer comment / review */}
                <div
                  className="comment-item rounded-[15px] flex-col justify-between max-w-full w-full bg-[#F8F8F8] min-h-[111px]"
                  style={{ direction: isRtl ? "rtl" : "ltr" }}
                >
                  <div className="w-full flex-col">
                    <div className="flex-row items-center">
                      <div className="comment-photo">
                        <img
                          src={comment.user_avatar || FALLBACK_AVATAR}
                          alt={comment.user_name}
                        />
                      </div>
                      <div className="comment-content capitalize mx-[10px]">
                        <div className="comment-source text-[#1D1D1D] text-[9px] regular">
                          {!isReview && <span className="bold pr-[4px]">Q</span>}
                          {comment.user_name}
                        </div>
                      </div>
                    </div>
                    {comment.variant && (
                      <span className="medium text-[#1d1d1d] text-[9px] mt-[5px]">
                        {comment.variant}
                      </span>
                    )}
                    <div
                      className="comment-date text-[9px] absolute text-[#1d1d1d]"
                      style={{
                        right: isRtl ? "initial" : "10px",
                        left: isRtl ? "10px" : "initial",
                      }}
                    >
                      {formatDate(comment.created_at, language)}
                    </div>
                    <div
                      className={`${
                        !isRtl ? "pr-[27px]" : "pl-[27px]"
                      } comment-text max-h-[100px] overflow-auto regular text-[#1d1d1d] text-[11px] mt-0`}
                    >
                      {comment.text}
                    </div>
                  </div>
                  <div className="flex-row pl-[10px] pr-[3px] justify-between w-full items-center mt-[8px]">
                    <HeartCount count={comment.total_likes} />
                    {isReview && comment.rating != null && (
                      <RatingStars
                        color="#1d1d1d"
                        initialRating={comment.rating}
                        readOnly
                      />
                    )}
                  </div>
                </div>

                {/* FAQ only: shop reply, or the waiting/reply affordance.
                    Reviews are display-only — they get no reply, matching the
                    storefront. */}
                {!isReview &&
                  (comment.has_reply ? (
                    <>
                      <div className="px-[10px] w-full bg-[#F8F8F8]">
                        <hr className="text-[#D3D3D37f] h-px bg-[#D3D3D37f] mt-0 w-full px-[10px]" />
                      </div>
                      <div
                        className="comment-item flex-col rounded-t-none mt-0 rounded-b-[15px] justify-between max-w-full w-full bg-[#F8F8F8] min-h-[111px]"
                        style={{ direction: isRtl ? "rtl" : "ltr" }}
                      >
                        <div className="w-full flex-col">
                          <div className="flex-row items-center">
                            <div className="comment-photo">
                              <img
                                src={FALLBACK_AVATAR}
                                alt={comment.seller_name}
                              />
                            </div>
                            <div className="comment-content capitalize mx-[10px]">
                              {/* Reply is attributed to the shop, never a user. */}
                              <div className="comment-source text-[#1D1D1D] text-[9px] regular">
                                <span className="bold pr-[4px]">A</span>
                                {comment.seller_name ||
                                  translateFunction("Your shop", language)}
                              </div>
                            </div>
                          </div>
                          <span className="medium text-[#1d1d1d] text-[9px] mt-[5px]">
                            {translateFunction("Dear", language)}{" "}
                            {comment.user_name}
                          </span>
                          <div
                            className="comment-date text-[9px]"
                            style={{
                              right: isRtl ? "initial" : "10px",
                              left: isRtl ? "10px" : "initial",
                            }}
                          >
                            {formatDate(comment.reply_created_at, language)}
                          </div>
                          <div className="comment-text max-h-[100px] overflow-auto regular text-[#1d1d1d] text-[11px] mt-0">
                            {comment.seller_reply}
                          </div>
                        </div>
                        <div className="flex-row pl-[10px] pr-[3px] gap-2 w-full items-center justify-between mt-[8px]">
                          <HeartCount count={comment.reply_total_likes} />
                          <div className="flex items-center gap-3">
                            {canEditReply && (
                              <button
                                onClick={() => openReplyModal(comment)}
                                className="inline-flex items-center gap-1 text-[12px] semibold text-[#388CFF] hover:opacity-80 transition-colors"
                              >
                                <DashIcon name="edit" size={14} />
                                {translateFunction("Edit Reply", language)}
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteReply(comment)}
                                disabled={deletingId === comment.comment_id}
                                className="inline-flex items-center gap-1 text-[12px] semibold text-[#f85555] hover:opacity-80 transition-colors disabled:opacity-50"
                              >
                                <DashIcon name="trash" size={14} />
                                {deletingId === comment.comment_id
                                  ? translateFunction("Deleting...", language)
                                  : translateFunction("Delete Reply", language)}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="px-[10px] w-full bg-[#F8F8F8]">
                        <hr className="text-[#D3D3D37f] h-px bg-[#D3D3D37f] mt-0 w-full px-[10px]" />
                      </div>
                      <div
                        className="comment-item text-[#1d1d1d] regular flex-row items-center rounded-t-none mt-0 rounded-b-[15px] justify-between max-w-full w-full bg-[#F8F8F8]"
                        style={{ direction: isRtl ? "rtl" : "ltr" }}
                      >
                        <span className="text-[11px] text-[#8d8d8d]">
                          {translateFunction("Waiting Seller Reply...", language)}
                        </span>
                        {canReply && (
                          <button
                            onClick={() => openReplyModal(comment)}
                            className="inline-flex items-center gap-1 text-[12px] semibold text-[#388CFF] hover:opacity-80 transition-colors"
                          >
                            <DashIcon name="reply" size={14} />
                            {translateFunction("Reply", language)}
                          </button>
                        )}
                      </div>
                    </>
                  ))}
              </div>
            );
          })}

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <DashButton
                variant="secondary"
                onClick={() => fetchComments(false)}
                loading={loadingMore}
              >
                {translateFunction("Load More", language)}
              </DashButton>
            </div>
          )}
        </div>
      )}

      {/* Reply Modal */}
      {replyModalOpen && selectedComment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs transition-opacity">
          <div
            className="w-full max-w-lg bg-white rounded-[20px] overflow-hidden animate-scale-up"
            style={{
              direction: isRtl ? "rtl" : "ltr",
              boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
            }}
          >
            <div className="p-5 lg:p-6 border-b border-[#ededed] flex items-center justify-between">
              <h3 className="text-[16px] bold text-[#3c3c3c]">
                {selectedComment.has_reply
                  ? translateFunction("Edit Reply", language)
                  : translateFunction("Reply to FQA Comment", language)}
              </h3>
              <button
                onClick={() => setReplyModalOpen(false)}
                aria-label={translateFunction("Cancel", language)}
                className="text-[#8e8e8e] hover:text-[#3c3c3c] transition-colors"
              >
                <DashIcon name="close" size={22} />
              </button>
            </div>

            <form onSubmit={handleReplySubmit}>
              <div className="p-5 lg:p-6 space-y-4">
                <div className="p-4 bg-[#f8f8f8] rounded-[12px] border border-[#ededed] text-left space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="semibold text-[#3c3c3c]">{selectedComment.user_name}</span>
                  </div>
                  <p className="text-[14px] text-[#505050] italic">"{selectedComment.text}"</p>
                </div>

                <div className="space-y-2 text-left">
                  <label className="block text-[13px] medium text-[#505050]">
                    {translateFunction("Reply Text", language)}
                  </label>
                  <textarea
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={translateFunction("Write a reply...", language)}
                    className="w-full px-4 py-3 bg-[#f8f8f8] border border-[#ededed] rounded-[12px] outline-none focus:border-[#388CFF] focus:bg-white text-[14px] text-[#3c3c3c] placeholder:text-[#b8b8b8] resize-none transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="p-5 lg:p-6 border-t border-[#ededed] bg-[#fafafa] flex items-center justify-end gap-3">
                <DashButton
                  type="button"
                  variant="ghost"
                  onClick={() => setReplyModalOpen(false)}
                >
                  {translateFunction("Cancel", language)}
                </DashButton>
                <DashButton
                  type="submit"
                  icon="reply"
                  loading={submittingReply}
                  disabled={!replyText.trim()}
                >
                  {translateFunction("Submit Reply", language)}
                </DashButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
