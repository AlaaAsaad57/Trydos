import React, { useState, useCallback, useEffect } from "react";
import BottomSheet from "components/global/BottomSheet";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import Skeleton from "react-loading-skeleton";
import BuyersCommentIcon from "public/svg/product/BuyersCommentsIcon";

import { useAppStore } from "store";
import { translateFunction } from "utils/functions";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import { RateCommentItem } from "./ProductsBuyersComments";

function BuyersCommentModal({ comments = [], total, offset: initialOffset }) {
  const { ColorBottomSheet, setColorBottomSheet, language, SelectedProduct } =
    useAppStore();

  const [activeType, setActiveType] = useState(0);
  const [commentsData, setCommentsData] = useState(comments);
  const [offset, setOffset] = useState(initialOffset);
  const [loading, setLoading] = useState(false);

  const commentTypes = [
    { id: 1, name: "Size", value: "size" },
    { id: 2, name: "Quality", value: "quality" },
    { id: 3, name: "Color", value: "color" },
    { id: 4, name: "Shipping", value: "shipping" },
    { id: 5, name: "Complaint", value: "complaint" },
    { id: 6, name: "Recommendation", value: "recommend" },
  ];

  const isRtl = language === "ar" || language === "ku";

  // ✅ Stable loadMore function
  const loadMore = async (
    filterId = null,
    offsetValue = null,
    reset = false
  ) => {
    if (!SelectedProduct?.id) return;

    setLoading(true);
    try {
      const url = `/api/products/comments/buyers_comments?product_id=${
        SelectedProduct.id
      }${offsetValue ? `&offset=${JSON.stringify(offsetValue)}` : ""}${
        filterId
          ? `&filter=${commentTypes.find((c) => c.id === filterId)?.value}`
          : ""
      }`;

      const data = await fetchData({
        url,
        method: "GET",
        server: "local",
        reqTitle: REQUESTS_DATA.COMMENT_DATA_REQUEST,
      });

      setCommentsData((prev) =>
        reset
          ? data?.data?.buyers_comments ?? []
          : [...prev, ...data?.data?.buyers_comments]
      );
      setOffset(data?.data?.offset);
    } catch (err) {
      console.error("Error loading comments:", err);
    } finally {
      setLoading(false);
    }
  };
  // ✅ Handle filter toggle
  const handleFilter = useCallback(
    async (id) => {
      if (loading) return;

      if (activeType === id) {
        // Unselect filter → restore original comments
        setActiveType(0);
        setCommentsData(comments);
        setOffset(initialOffset);
        return;
      }

      setActiveType(id);
      await loadMore(id, null, true);
    },
    [activeType, loading, comments, initialOffset, loadMore]
  );

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
              <BuyersCommentIcon />
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
                  language
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
                {commentTypes.map((type) => (
                  <div
                    key={type.id}
                    onClick={() => handleFilter(type.id)}
                    className={`pl-[8px] cursor-pointer pr-[12px] rounded-[15px] h-[31px] ${
                      activeType === type.id ? "bg-[#bdd3ff]" : "bg-[#F8F8F8]"
                    } flex-row justify-center items-center regular text-[#505050] text-[11px] medium`}
                  >
                    {translateFunction(type.name, language)}
                  </div>
                ))}
              </HortiznalScrollBar>

              {/* Comments List */}
              <div className="flex-col gap-[12px] mt-[10px] min-h-[372px]">
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
                  commentsData.map((comment, idx) => (
                    <RateCommentItem
                      key={idx}
                      comment={comment}
                      language={language}
                      width={100}
                    />
                  ))}

                {!loading && offset && (
                  <div
                    className="w-full flex justify-center items-center"
                    onClick={() => loadMore(activeType, offset)}
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
    </>
  );
}

export default BuyersCommentModal;
