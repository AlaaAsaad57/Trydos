"use client";
import React, { useState, useEffect } from "react";
import sellerCommentsService from "services/sellerDashboard/comments";
import { translateFunction } from "utils/functions";
import Spinner from "components/global/Spinner";

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
    <div className="w-full space-y-6">
      {/* Sub-tab Switcher */}
      <div className="flex border-b border-gray-100 pb-px">
        <button
          onClick={() => setSubTab("faq")}
          className={`pb-4 px-6 text-[15px] font-semibold transition-all relative ${
            subTab === "faq"
              ? "text-blue-600 font-bold"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          {translateFunction("FAQ", language)}
          {subTab === "faq" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full animate-fade-in" />
          )}
        </button>
        <button
          onClick={() => setSubTab("reviews")}
          className={`pb-4 px-6 text-[15px] font-semibold transition-all relative ${
            subTab === "reviews"
              ? "text-blue-600 font-bold"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          {translateFunction("Reviewing", language)}
          {subTab === "reviews" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full animate-fade-in" />
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner />
          <span className="ml-3 text-[14px] text-gray-500">
            {translateFunction("Loading...", language)}
          </span>
        </div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
          <p className="text-[16px] font-semibold text-gray-800">
            {translateFunction("No comments found.", language)}
          </p>
          <p className="text-[13px] text-gray-400">
            {translateFunction("Check back later for comments from customers.", language)}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Comments Table */}
          <div className="overflow-x-auto bg-white rounded-2xl border border-gray-100 shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-4 px-6 font-medium">{translateFunction("Comment ID", language)}</th>
                  <th className="py-4 px-6 font-medium">{translateFunction("Customer", language)}</th>
                  <th className="py-4 px-6 font-medium">{translateFunction("Comment", language)}</th>
                  {subTab === "reviews" ? (
                    <th className="py-4 px-6 font-medium">{translateFunction("Rating", language)}</th>
                  ) : (
                    <th className="py-4 px-6 font-medium">{translateFunction("Product ID", language)}</th>
                  )}
                  <th className="py-4 px-6 font-medium">{translateFunction("Variant", language)}</th>
                  <th className="py-4 px-6 font-medium">{translateFunction("Date", language)}</th>
                  <th className="py-4 px-6 font-medium">{translateFunction("Reply Status", language)}</th>
                  <th className="py-4 px-6 font-medium">{translateFunction("Actions", language)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-[14px]">
                {comments.map((comment) => (
                  <tr key={comment.comment_id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="py-4 px-6 text-gray-400 font-mono text-[12px]">{comment.comment_id}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                          {comment.user_avatar ? (
                            <img
                              src={comment.user_avatar}
                              alt={comment.user_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-[12px] font-bold">
                              {comment.user_name?.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-gray-800">{comment.user_name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 max-w-xs truncate text-gray-700" title={comment.text}>
                      {comment.text}
                    </td>
                    {subTab === "reviews" ? (
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-1">
                          <span className="font-semibold text-yellow-600">{comment.rating ?? "-"}</span>
                          {comment.rating && (
                            <span className="text-yellow-400 text-[16px]">&#9733;</span>
                          )}
                        </div>
                      </td>
                    ) : (
                      <td className="py-4 px-6 text-gray-500 font-mono text-[12px]">{comment.product_id}</td>
                    )}
                    <td className="py-4 px-6 text-gray-500">{comment.variant || "-"}</td>
                    <td className="py-4 px-6 text-gray-400 text-[12px]">
                      {new Date(comment.created_at).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-4 px-6">
                      {comment.has_reply ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
                            {translateFunction("Replied", language)}
                          </span>
                          <p className="text-[12px] text-gray-500 italic max-w-xs truncate" title={comment.seller_reply}>
                            {comment.seller_reply}
                          </p>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-100">
                          {translateFunction("Pending", language)}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {subTab === "faq" && (
                        <button
                          onClick={() => openReplyModal(comment)}
                          className={`text-[13px] font-semibold transition-colors ${
                            comment.has_reply
                              ? "text-blue-600 hover:text-blue-800"
                              : "text-green-600 hover:text-green-800"
                          }`}
                        >
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
              <button
                onClick={() => fetchComments(false)}
                disabled={loadingMore}
                className="px-6 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-400 transition-colors flex items-center space-x-2"
              >
                {loadingMore ? (
                  <>
                    <Spinner />
                    <span>{translateFunction("Loading...", language)}</span>
                  </>
                ) : (
                  <span>{translateFunction("Load More", language)}</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reply Modal */}
      {replyModalOpen && selectedComment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity">
          <div
            className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 animate-scale-up"
            style={{ direction: isRtl ? "rtl" : "ltr" }}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-gray-900">
                {selectedComment.has_reply
                  ? translateFunction("Edit Reply", language)
                  : translateFunction("Reply to FQA Comment", language)}
              </h3>
              <button
                onClick={() => setReplyModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleReplySubmit}>
              <div className="p-6 space-y-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-left space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-800">{selectedComment.user_name}</span>
                    <span className="text-[12px] text-gray-400 font-mono">({selectedComment.comment_id})</span>
                  </div>
                  <p className="text-[14px] text-gray-600 italic">"{selectedComment.text}"</p>
                </div>

                <div className="space-y-2 text-left">
                  <label className="block text-[14px] font-semibold text-gray-700">
                    {translateFunction("Reply Text", language)}
                  </label>
                  <textarea
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={translateFunction("Write a reply...", language)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[14px] resize-none"
                    required
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setReplyModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {translateFunction("Cancel", language)}
                </button>
                <button
                  type="submit"
                  disabled={submittingReply || !replyText.trim()}
                  className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed shadow-xs transition-colors flex items-center space-x-2"
                >
                  {submittingReply ? (
                    <>
                      <Spinner />
                      <span>{translateFunction("Submitting...", language)}</span>
                    </>
                  ) : (
                    <span>{translateFunction("Submit Reply", language)}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
