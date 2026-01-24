import React, { useState, useEffect, useRef } from "react";
import BottomSheet from "components/global/BottomSheet";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import Skeleton from "react-loading-skeleton";
import { useAppStore } from "store";
import { LogError, translateFunction } from "utils/functions";

import { GetProductBuyersComment } from "serverRequests/product";
import auth from "services/auth";
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

  // ✅ Stable loadMore function
  const loadMore = async () => {
    setLoading(true);
    try {
      const data = await GetProductBuyersComment({
        language: language,
        productId: productId,
        userId: auth.UserID(),
        filter: activeTabRef.current,
        offset: OffsetRef.current,
      });

      setCommentsData((prev) => [...(prev as any), ...data.comments]);
      OffsetRef.current = data.offset;
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
              <hr className="text-[#D3D3D37f] h-[1px] bg-[#D3D3D37f] mt-0 w-full px-[10px]" />
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

                {!loading && commentsData}
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
              let comment_id = await deleteComment(id);
              setCommentsData(
                commentsData.filter((node) => node.key !== comment_id),
              );
              setActionLoading(false);
            }}
            updateAction={async (comment) => {
              setActionLoading(true);
              let { commentElement, id } = await editComment(comment);
              setCommentsData(
                commentsData?.map((node) =>
                  node.key === id ? commentElement : node,
                ),
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
