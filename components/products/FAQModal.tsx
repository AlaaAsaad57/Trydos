import BottomSheet from "components/global/BottomSheet";
import profilePng from "public/images/profileNo.png";

import React, { useCallback, useState } from "react";
import { useAppStore } from "store";
import { translateFunction } from "utils/functions";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import Skeleton from "node_modules/react-loading-skeleton/dist";
import FAQIcon from "public/svg/FAQIcon.svg";
import Image from "node_modules/next/image";
import { convertTextToXFormat, formatTime, GetImageUrl } from "utils/tinyUtils";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";

function FAQModal({ comments, total, offset: initialOffset }) {
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
      const url = `/api/products/comments/fqa_comments?product_id=${
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
          ? data?.data?.fqa_comments ?? []
          : [...prev, ...data?.data?.fqa_comments]
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
      {ColorBottomSheet && ColorBottomSheet?.is_for_faq && (
        <BottomSheet
          height={90}
          isOpen={ColorBottomSheet?.is_for_faq}
          onClose={() => {
            setColorBottomSheet(false);
          }}
        >
          <div className="w-full h-auto pb-[80px] flex-col">
            <div className="flex-col px-[12px] gap-[6px]">
              <FAQIcon />
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
                  language
                )}
                <span className="bold px-[4px]">
                  trydos {translateFunction("Visitors", language)}
                </span>
                <span>
                  {translateFunction(
                    "And Not Necessarily From Customers Who Have Purchased The Product Before. These Are Pre-Purchase Questions, And They Are Answered Directly By The Seller",
                    language
                  )}
                </span>
              </p>
            </div>
            <div className="w-full px-[12px] bg-[#FFFFFF] py-[11px]">
              <hr className="text-[#D3D3D37f] h-[1px] bg-[#D3D3D37f] mt-0 w-full px-[10px]" />
            </div>
            <div className="flex-col gap-[2px]">
              <HortiznalScrollBar
                id="product-properties-general-modal"
                className={`${
                  loading && "opacity-65"
                } flex-row  product-properties px-[12px] items-center justify-start w-full gap-[4px]`}
              >
                {commentTypes.map((s) => (
                  <div
                    onClick={() => {
                      if (loading) return;
                      handleFilter(s.id);
                    }}
                    className={`pl-[8px] cursor-pointer pr-[12px] rounded-[15px] h-[31px] ${
                      activeType === s.id ? "bg-[#bdd3ff]" : "bg-[#F8F8F8]"
                    } flex-row justify-center items-center regular text-[#505050] text-[11px] medium`}
                  >
                    {translateFunction(s.name)}
                  </div>
                ))}
              </HortiznalScrollBar>
              <div className="flex-col gap-[12px] mt-[10px]  min-h-[372px]">
                {!loading && comments?.length === 0 && (
                  <span className="w-full justify-center items-center flex py-4 light text-[#1d1d1d] ">
                    {translateFunction("There is No Comments Yet..", language)}
                  </span>
                )}
                {loading &&
                  Array(6)
                    .fill("")
                    .map((s) => (
                      <div className="w-full h-[122px]">
                        <Skeleton
                          className="w-full h-[112px] rounded-[15px]"
                          width={"100%"}
                          height={112}
                          borderRadius={15}
                        />
                      </div>
                    ))}
                {!loading &&
                  commentsData.map((s) => (
                    <FaqItem comment={s} language={language} width={100} />
                  ))}
                {!loading && offset && (
                  <div
                    className="w-full flex justify-center items-center"
                    onClick={() => {
                      loadMore(activeType, offset);
                    }}
                  >
                    <div className="bg-[#f8f8f8] text-[#1d1d1d] light text-[14px] rounded-md h-[40px] flex justify-center items-center px-3 pt-2">
                      {translateFunction("Load More")}
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

export default FAQModal;

const ReviewProgress = ({ value, title }) => {
  return (
    <div className="flex-row gap-[14px] min-w-[280px] w-full">
      <div className="flex-row  w-[72%] max-w-[72%] h-[14px] rounded-[5px] bg-[#FCFCFC] relative flex-1 ">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="14"
          viewBox="0 0 100% 14"
          className="absolute top-0 left-0"
        >
          <rect
            x="0.25"
            y="0.25"
            width="calc(100%)"
            height="13.5"
            rx="2.25"
            fill="none"
            stroke="#d3d3d3"
            strokeWidth="0.5"
          />
        </svg>
        <div
          className={`h-[14px] rounded-[5px] flex bg-[#1d1d1d]`}
          style={{
            width: `${value}%`,
          }}
        />
      </div>
      <div className="flex-row items-center text-[#1d1d1d] text-[11px] regular gap-[6px] whitespace-nowrap">
        {value}%
      </div>
      <span className="bold">{title}</span>
    </div>
  );
};

const FaqItem = ({ language, comment, width }) => {
  let has_reply = comment.has_reply;
  return (
    <div className="flex-col min-w-[100%] max-w-[100%]">
      <div
        className={`comment-item ${
          has_reply ? "rounded-t-[15px] rounded-b-[0px]" : "rounded-[15px]"
        } flex-col justify-between max-w-full w-full bg-[#F8F8F8] min-h-[111px] py-[8px] px-[10px]`}
        style={{
          position: "relative",
        }}
      >
        <div className="w-full flex-col">
          <div className="flex-row items-center">
            <div className="comment-photo">
              <Image
                src={GetImageUrl(comment?.customer?.image) ?? profilePng}
                width={20}
                height={20}
                alt={comment?.customer?.name}
              />
            </div>
            <div className="comment-content capitalize">
              <div
                className="comment-source text-[#1D1D1D] text-[9px] regular"
                data-cy="Source-Of-Comment"
              >
                <span className="bold pr-[4px]">Q</span>{" "}
                {convertTextToXFormat(comment?.customer?.name)}
              </div>
            </div>
          </div>
          <span className="medium text-[#1d1d1d] text-[9px] mt-[5px]">
            Blue | Meduim
          </span>
          <div className="comment-date text-[9px]" data-cy="Date-Of-Comment">
            {formatTime(comment?.created_at)}
          </div>
          <div className="comment-text regular text-[#1d1d1d] text-[11px] mt-[0px]">
            {comment?.comment}
          </div>
        </div>
        <div className="flex-row pl-[10px] pr-[3px] justify-between w-full items-center">
          <div className="flex-row  gap-[4px] text-[#1d1d1d] text-[9px] regular">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              width="11"
              height="11"
              viewBox="0 0 11 11"
            >
              <g
                id="Mask_Group_285"
                data-name="Mask Group 285"
                transform="translate(0 -0.251)"
                clip-path="url(#clip-path)"
              >
                <g id="Love" transform="translate(0 0.718)">
                  <path
                    id="Path_21279"
                    data-name="Path 21279"
                    d="M11.68,4.522a3.179,3.179,0,0,0-2.489-2A2.975,2.975,0,0,0,6.453,3.7,2.974,2.974,0,0,0,3.712,2.528,3.175,3.175,0,0,0,1.227,4.522a3.209,3.209,0,0,0,.741,3.456l4.359,4.273a.182.182,0,0,0,.254,0l4.359-4.273a3.209,3.209,0,0,0,.741-3.456Zm-1,3.2L6.453,11.868,2.222,7.719a2.846,2.846,0,0,1-.657-3.066,2.807,2.807,0,0,1,2.2-1.766,2.5,2.5,0,0,1,.334-.023A2.756,2.756,0,0,1,6.308,4.106a.188.188,0,0,0,.292,0A2.687,2.687,0,0,1,9.143,2.885a2.812,2.812,0,0,1,2.2,1.768,2.846,2.846,0,0,1-.657,3.066Z"
                    transform="translate(-1.007 -2.499)"
                    fill="#1d1d1d"
                  />
                </g>
              </g>
            </svg>

            <span>110k</span>
          </div>
        </div>
      </div>
      {has_reply && (
        <>
          <div className="px-[10px] w-full bg-[#F8F8F8]">
            <hr className="text-[#D3D3D37f] h-[1px] bg-[#D3D3D37f] mt-0 w-full px-[10px]" />
          </div>
          <div
            className="comment-item flex-col rounded-t-none mt-0 rounded-b-[15px] justify-between max-w-full w-full bg-[#F8F8F8] min-h-[111px] py-[8px] px-[10px]"
            style={{
              position: "relative",
            }}
          >
            <div className="w-full flex-col">
              <div className="flex-row items-center">
                <div className="comment-photo">
                  <Image
                    src={profilePng}
                    width={20}
                    height={20}
                    alt={"seller-name"}
                  />
                </div>
                <div className="comment-content capitalize">
                  <div
                    className="comment-source text-[#1D1D1D] text-[9px] regular"
                    data-cy="Source-Of-Comment"
                  >
                    <span className="bold pr-[4px]">A</span>
                    {convertTextToXFormat(comment?.seller_name)}
                  </div>
                </div>
              </div>
              <span className="medium text-[#1d1d1d] text-[9px] mt-[5px]">
                {translateFunction("Dear", language)}{" "}
                {convertTextToXFormat(comment?.customer?.name)}
              </span>
              <div
                className="comment-date text-[9px]"
                data-cy="Date-Of-Comment"
              >
                {formatTime(comment?.reply_created_at)}
              </div>
              <div className="comment-text regular text-[#1d1d1d] text-[11px] mt-[0px]">
                {comment?.seller_reply}
              </div>
            </div>
            <div className="flex-row pl-[10px] pr-[3px] justify-between w-full items-center">
              <div className="flex-row  gap-[4px] text-[#1d1d1d] text-[9px] regular">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  width="11"
                  height="11"
                  viewBox="0 0 11 11"
                >
                  <g
                    id="Mask_Group_285"
                    data-name="Mask Group 285"
                    transform="translate(0 -0.251)"
                    clip-path="url(#clip-path)"
                  >
                    <g id="Love" transform="translate(0 0.718)">
                      <path
                        id="Path_21279"
                        data-name="Path 21279"
                        d="M11.68,4.522a3.179,3.179,0,0,0-2.489-2A2.975,2.975,0,0,0,6.453,3.7,2.974,2.974,0,0,0,3.712,2.528,3.175,3.175,0,0,0,1.227,4.522a3.209,3.209,0,0,0,.741,3.456l4.359,4.273a.182.182,0,0,0,.254,0l4.359-4.273a3.209,3.209,0,0,0,.741-3.456Zm-1,3.2L6.453,11.868,2.222,7.719a2.846,2.846,0,0,1-.657-3.066,2.807,2.807,0,0,1,2.2-1.766,2.5,2.5,0,0,1,.334-.023A2.756,2.756,0,0,1,6.308,4.106a.188.188,0,0,0,.292,0A2.687,2.687,0,0,1,9.143,2.885a2.812,2.812,0,0,1,2.2,1.768,2.846,2.846,0,0,1-.657,3.066Z"
                        transform="translate(-1.007 -2.499)"
                        fill="#1d1d1d"
                      />
                    </g>
                  </g>
                </svg>

                <span>110k</span>
              </div>
            </div>
            <span className="absolute bottom-[8px] right-[9px] text-[#8D8D8D] regular text-[9px] ">
              {13} {translateFunction("Minutes Answered", language)}
            </span>
          </div>
        </>
      )}
    </div>
  );
};
