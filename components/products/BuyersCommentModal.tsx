import React, { useState, useEffect, useRef } from "react";
import BottomSheet from "components/global/BottomSheet";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import Skeleton from "react-loading-skeleton";
import { useAppStore } from "store";
import { LogError, translateFunction } from "utils/functions";

import auth from "services/auth";
import { BuyersCommentItem } from "components/Server/product/ProductBuyersComment/BuyerCommentItem";
import { RatingCommentOptions } from "components/Server/product/ProductBuyersComment/RatingCommentOptions";

function BuyersCommentModal({
  filters_key,
  productId,
  deleteComment,
  editComment,
}) {
  const {
    ColorBottomSheet,
    setColorBottomSheet,
    language,
    BuyerCommentModalOption,
    setBuyerCommentModalOption,
  } = useAppStore();

  const activeTabRef = useRef<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [commentsData, setCommentsData] = useState([]);
  const OffsetRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);

  const isRtl = language === "ar" || language === "ku";

  // ✅ Stable loadMore function — fetches the buyers-comments data page from the
  // internal Next route (same-origin); renders items from data, never JSX.
  const loadMore = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ product_id: String(productId) });
      const userId = auth.UserID();
      if (userId) params.set("user_id", String(userId));
      if (activeTabRef.current && activeTabRef.current !== 0)
        params.set("filter", String(activeTabRef.current));
      if (OffsetRef.current)
        params.set(
          "offset",
          encodeURIComponent(JSON.stringify(OffsetRef.current)),
        );
      const res = await fetch(
        `/api/products/comments/buyers_comments?${params.toString()}`,
        { headers: { language: language ?? "en" } },
      );
      const json = await res.json();
      setCommentsData((prev) => [
        ...(prev as any),
        ...(json?.data?.buyers_comments ?? []),
      ]);
      OffsetRef.current = json?.data?.offset ?? null;
    } catch (err) {
      LogError({
        error: err,
        scenario: "Error In loadMore in BuyersCommentModal",
      });
    } finally {
      setLoading(false);
    }
  };
  // ✅ Handle filter toggle
  const handleFilter = async (id) => {
    if (loading) return;
    setCommentsData([]);
    OffsetRef.current = null;
    if (activeTabRef.current === id) {
      // Unselect filter → restore original comments
      activeTabRef.current = 0;
    } else {
      activeTabRef.current = id;
    }

    await loadMore();
  };
  useEffect(() => {
    if (ColorBottomSheet?.is_buyers_comments) handleFilter(0);
    else {
      setCommentsData([]);
      OffsetRef.current = null;
      activeTabRef.current = null;
    }
  }, [ColorBottomSheet?.is_buyers_comments]);
  return (
    <>
      {ColorBottomSheet?.is_buyers_comments && (
        <BottomSheet
          height={90}
          isOpen={ColorBottomSheet?.is_buyers_comments}
          onClose={() => setColorBottomSheet(false)}
        >
          <div className="w-full h-auto pb-[80px] flex-col">
            {/* Header */}
            <div className="flex-col px-[12px] gap-[6px]">
              <img
                src="/icons/BuyersCommentsIcon.svg"
                className="w-[30px] h-[30px]"
              />
              <span className="flex text-[13px] text-[#1d1d1d] regular">
                {translateFunction("Buyers Comment", language)}
              </span>
              <p
                className={`${
                  isRtl ? "dir-rtl" : ""
                } text-[11px] text-[#1d1d1d] regular gap-[4px] inline`}
              >
                {translateFunction(
                  "All Comments Are Genuine From Customers Who Purchased And Actually Received The Product Through",
                  language,
                )}
                <span className="bold px-[4px]">trydos</span>
              </p>
            </div>

            <div className="w-full px-[12px] bg-[#FFFFFF] py-[11px]">
              <hr className="text-[#D3D3D37f] h-px bg-[#D3D3D37f] mt-0 w-full px-[10px]" />
            </div>

            {/* Filters */}
            <div className="flex-col gap-[2px]">
              <HortiznalScrollBar
                id="product-properties-general-modal"
                className={`${
                  loading ? "opacity-65" : ""
                } flex-row product-properties px-[12px] items-center justify-start w-full gap-[4px]`}
              >
                {filters_key.map((type) => (
                  <div
                    key={type}
                    onClick={() => handleFilter(type)}
                    className={`pl-[8px] cursor-pointer pr-[12px] rounded-[15px] h-[31px] ${
                      activeTabRef.current === type
                        ? "bg-[#bdd3ff]"
                        : "bg-[#F8F8F8]"
                    } flex-row justify-center items-center regular text-[#505050] text-[11px] medium`}
                  >
                    {type}
                  </div>
                ))}
              </HortiznalScrollBar>

              {/* Comments List */}
              <div className="flex-col gap-[12px] mt-[10px] min-h-[372px] buers-modal-container">
                {!loading && commentsData.length === 0 && (
                  <span className="w-full justify-center items-center flex py-4 light text-[#1d1d1d]">
                    {translateFunction("There is No Comments Yet..", language)}
                  </span>
                )}

                {loading &&
                  Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="w-full h-[122px]">
                      <Skeleton
                        className="w-full h-[112px] rounded-[15px]"
                        width="100%"
                        height={112}
                        borderRadius={15}
                      />
                    </div>
                  ))}

                {!loading &&
                  commentsData?.map((comment: any) => (
                    <BuyersCommentItem
                      key={comment.id}
                      id={comment.id}
                      comment={comment}
                      language={language}
                    />
                  ))}
                {!loading && OffsetRef.current && (
                  <div
                    className="w-full flex justify-center items-center"
                    onClick={() => loadMore()}
                  >
                    <div className="bg-[#f8f8f8] text-[#1d1d1d] light text-[14px] rounded-md h-[40px] flex justify-center items-center px-3 pt-2">
                      {translateFunction("Load More", language)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </BottomSheet>
      )}
      {ColorBottomSheet?.is_buyers_comments &&
        BuyerCommentModalOption &&
        BuyerCommentModalOption?.comment_type === "review" && (
          <RatingCommentOptions
            language={language}
            is_update={BuyerCommentModalOption.option === "Update"}
            is_delete={BuyerCommentModalOption.option === "Delete"}
            comment={BuyerCommentModalOption}
            deleteAction={async (id) => {
              setActionLoading(true);
              const comment_id = await deleteComment(id);
              if (comment_id)
                setCommentsData((prev: any) =>
                  prev.filter((c: any) => c.id !== comment_id),
                );
              setActionLoading(false);
            }}
            updateAction={async (comment) => {
              setActionLoading(true);
              const res = await editComment(comment);
              if (res)
                setCommentsData((prev: any) =>
                  prev?.map((c: any) => (c.id === res.id ? res.comment : c)),
                );
              setActionLoading(false);
            }}
            handleCloseModal={() => {
              setBuyerCommentModalOption(null);
            }}
            loading={actionLoading}
          />
        )}
    </>
  );
}

export default BuyersCommentModal;
