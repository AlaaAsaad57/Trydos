import React, { useState, useCallback, useEffect, useRef } from "react";
import BottomSheet from "components/global/BottomSheet";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import Skeleton from "react-loading-skeleton";

import { useAppStore } from "store";
import { LogError, translateFunction } from "utils/functions";

import auth from "services/auth";
import FaqItemComponent from "./FaqItemComponent";
import { FaqItemOptions } from "./FaqItemOptions";

function FaqSectionModal({
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
    setShouldUpdateComment,
  } = useAppStore();

  const activeTabRef = useRef<any>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [commentsData, setCommentsData] = useState([]);
  const OffsetRef = useRef<any>(null);

  const [loading, setLoading] = useState(false);

  const isRtl = language === "ar" || language === "ku";

  // ✅ Stable loadMore function — fetches the FAQ-comments data page from the
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
        `/api/products/comments/fqa_comments?${params.toString()}`,
        { headers: { language: language ?? "en" } },
      );
      const json = await res.json();
      setCommentsData((prev) => [
        ...(prev as any),
        ...(json?.data?.fqa_comments ?? []),
      ]);
      OffsetRef.current = json?.data?.offset ?? null;
    } catch (err) {
      LogError({
        error: err,
        scenario: "Error In loadMore Faq Questions in FaqSectionModal",
      });
    } finally {
      setLoading(false);
    }
  };
  // ✅ Handle filter toggle — always reset the list/cursor before (re)loading so
  // switching filters replaces results instead of appending, and clicking the
  // active filter deselects it (mirrors BuyersCommentModal).
  const handleFilter = async (id) => {
    if (loading) return;
    setCommentsData([]);
    OffsetRef.current = null;
    if (activeTabRef.current === id) {
      activeTabRef.current = 0;
    } else {
      activeTabRef.current = id;
    }
    await loadMore();
  };
  useEffect(() => {
    if (ColorBottomSheet?.is_for_faq) handleFilter(0);
    else {
      setCommentsData([]);
      OffsetRef.current = null;
    }
  }, [ColorBottomSheet?.is_for_faq]);
  return (
    <>
      {ColorBottomSheet?.is_for_faq && (
        <BottomSheet
          height={90}
          isOpen={ColorBottomSheet?.is_for_faq}
          onClose={() => setColorBottomSheet(false)}
        >
          <div className="w-full h-auto pb-[80px] flex-col">
            {/* Header */}
            <div className="flex-col px-[12px] gap-[6px]">
              <img src="/icons/FAQIcon.svg" className="w-[30px] h-[30px]" />
              <span className="flex text-[13px] text-[#1d1d1d] regular">
                {translateFunction("FAQ Buyer & Seller", language)}
              </span>
              <p
                className={`${
                  isRtl && "dir-rtl"
                } text-[11px] text-[#1d1d1d]  regular gap-[4px] inline`}
              >
                {translateFunction(
                  "All The Questions Below Are From",
                  language,
                )}
                <span className="bold px-[4px]">
                  trydos {translateFunction("Visitors", language)}
                </span>
                <span>
                  {translateFunction(
                    "And Not Necessarily From Customers Who Have Purchased The Product Before. These Are Pre-Purchase Questions, And They Are Answered Directly By The Seller",
                    language,
                  )}
                </span>
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
                    <FaqItemComponent
                      key={comment.id}
                      id={comment.id}
                      comment={comment}
                      isRtl={isRtl}
                      language={language}
                      seller_name={comment.seller_name}
                      width={100}
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
      {ColorBottomSheet?.is_for_faq &&
        BuyerCommentModalOption &&
        BuyerCommentModalOption?.comment_type === "faq" && (
          <FaqItemOptions
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
              setShouldUpdateComment({ fromComments: true });
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

export default FaqSectionModal;
