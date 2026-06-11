"use client";
import React, { useState, useEffect } from "react";
import sellerCommentsService from "services/sellerDashboard/comments";
import { translateFunction } from "utils/functions";
import { DashIcon } from "components/SellerDashboard/ui/icons";
import {
  DashCard,
  DashButton,
  LoadingState,
  EmptyState,
  Segmented,
} from "components/SellerDashboard/ui";

interface CommentsTabProps {
  sellerId: string;
  language: string;
  isRtl: boolean;
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
}

export default function CommentsTab({ sellerId, language, isRtl }: CommentsTabProps) {
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
      console.error("Failed to load comments:", error);
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
      if (selectedComment.has_reply) {
        await sellerCommentsService.EditReplyForFqaComment(sellerId, selectedComment.comment_id, replyText);
      } else {
        await sellerCommentsService.ReplyToFQAComment(sellerId, selectedComment.comment_id, replyText);
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
      console.error("Failed to submit reply:", error);
    } finally {
      setSubmittingReply(false);
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
        <div className="space-y-5">
          {/* Comments Table */}
          <div
            className="overflow-x-auto bg-white rounded-[15px] border border-[#ededed]"
            style={{ boxShadow: "0 3px 10px rgba(0,0,0,0.1)" }}
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f8f8] border-b border-[#ededed] text-[12px] semibold text-[#8e8e8e]">
                  <th className="py-3.5 px-5">{translateFunction("Comment ID", language)}</th>
                  <th className="py-3.5 px-5">{translateFunction("Customer", language)}</th>
                  <th className="py-3.5 px-5">{translateFunction("Comment", language)}</th>
                  {subTab === "reviews" ? (
                    <th className="py-3.5 px-5">{translateFunction("Rating", language)}</th>
                  ) : (
                    <th className="py-3.5 px-5">{translateFunction("Product ID", language)}</th>
                  )}
                  <th className="py-3.5 px-5">{translateFunction("Variant", language)}</th>
                  <th className="py-3.5 px-5">{translateFunction("Date", language)}</th>
                  <th className="py-3.5 px-5">{translateFunction("Reply Status", language)}</th>
                  <th className="py-3.5 px-5">{translateFunction("Actions", language)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f2f2] text-[14px]">
                {comments.map((comment) => (
                  <tr key={comment.comment_id} className="hover:bg-[#f8f8f8] transition-colors">
                    <td className="py-4 px-5 text-[#b8b8b8] font-mono text-[12px]">{comment.comment_id}</td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#f2f2f2] overflow-hidden shrink-0">
                          {comment.user_avatar ? (
                            <img
                              src={comment.user_avatar}
                              alt={comment.user_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#8e8e8e] text-[12px] bold">
                              {comment.user_name?.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="medium text-[#3c3c3c]">{comment.user_name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 max-w-xs truncate text-[#505050]" title={comment.text}>
                      {comment.text}
                    </td>
                    {subTab === "reviews" ? (
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1 text-[#e6b400]">
                          <span className="semibold">{comment.rating ?? "-"}</span>
                          {comment.rating && (
                            <DashIcon name="star" size={15} strokeWidth={1.4} />
                          )}
                        </div>
                      </td>
                    ) : (
                      <td className="py-4 px-5 text-[#8e8e8e] font-mono text-[12px]">{comment.product_id}</td>
                    )}
                    <td className="py-4 px-5 text-[#8e8e8e]">{comment.variant || "-"}</td>
                    <td className="py-4 px-5 text-[#b8b8b8] text-[12px]">
                      {new Date(comment.created_at).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-4 px-5">
                      {comment.has_reply ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] semibold bg-[#eaf7ef] text-[#2ea84f]">
                            {translateFunction("Replied", language)}
                          </span>
                          <p className="text-[12px] text-[#8e8e8e] italic max-w-xs truncate" title={comment.seller_reply}>
                            {comment.seller_reply}
                          </p>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] semibold bg-[#fbf6e6] text-[#b8860b]">
                          {translateFunction("Pending", language)}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      {subTab === "faq" && (
                        <button
                          onClick={() => openReplyModal(comment)}
                          className={`inline-flex items-center gap-1.5 text-[13px] semibold transition-colors ${
                            comment.has_reply
                              ? "text-[#388CFF] hover:opacity-80"
                              : "text-[#5d5d5d] hover:opacity-80"
                          }`}
                        >
                          <DashIcon
                            name={comment.has_reply ? "edit" : "reply"}
                            size={15}
                          />
                          {comment.has_reply
                            ? translateFunction("Edit Reply", language)
                            : translateFunction("Reply", language)}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
                    <span className="text-[12px] text-[#b8b8b8] font-mono">({selectedComment.comment_id})</span>
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
