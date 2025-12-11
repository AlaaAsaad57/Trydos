import BottomSheet from "components/global/BottomSheet";
import profilePng from "public/images/profileNo.png";

import React, { useCallback, useMemo, useState } from "react";
import { useAppStore } from "store";
import { translateFunction } from "utils/functions";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import Skeleton from "react-loading-skeleton";
import FAQIcon from "public/svg/FAQIcon";
import Image from "next/image";
import { convertTextToXFormat, formatTime, GetImageUrl } from "utils/tinyUtils";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import { LikeButton } from "./FAQSection";
import auth from "services/auth";
import CommentItem from "./CommentItem";

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
      const url = `/api/products/comments/fqa_comments?user_id=${auth.UserID()}&product_id=${
        SelectedProduct.id
      }${offsetValue ? `&offset=${JSON.stringify(offsetValue)}` : ""}${
        filterId ? `&filter=${filterId}` : ""
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
  const seller_name = useMemo(() => {
    return SelectedProduct?.seller?.f_name ?? "Admin";
  }, []);
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
                {SelectedProduct?.fqa_questions?.filters_key?.map((s) => (
                  <div
                    onClick={() => {
                      if (loading) return;
                      handleFilter(s);
                    }}
                    className={`pl-[8px] cursor-pointer pr-[12px] rounded-[15px] h-[31px] ${
                      activeType === s ? "bg-[#bdd3ff]" : "bg-[#F8F8F8]"
                    } flex-row justify-center items-center regular text-[#505050] text-[11px] medium`}
                  >
                    {s}
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
                    //  <></>   <FaqItem
                    //       comment={s}
                    //       language={language}
                    //       width={100}
                    //       seller_name={seller_name}
                    //     />
                    <CommentItem
                      isPending={s?.id}
                      seller_name={seller_name}
                      isFull={true}
                      isError={s?.isError}
                      key={s?.id}
                      date={formatTime(s?.created_at)}
                      name={s?.customer?.name}
                      text={s?.comment}
                      photo={GetImageUrl(s?.customer?.image) ?? profilePng}
                      custmerId={s?.customer?.id}
                      comment={s}
                    />
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

const FaqItem = ({ language, comment, width, seller_name }) => {
  const renderTextWithLinks = (text) => {
    if (!text) return null;

    const urlRegex = /(https?:\/\/[^\s]+)/g;

    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline break-all"
          >
            {part}
          </a>
        );
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };
  let has_reply = comment.has_reply;
  const isRtl = language === "ar" || language === "ku";

  return (
    <div className="flex-col min-w-[100%] max-w-[100%]">
      <div
        className={`comment-item rounded-t-[15px] rounded-b-[0px] flex-col justify-between max-w-full w-full bg-[#F8F8F8] min-h-[111px] py-[8px] px-[10px]`}
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
            {comment?.variant}
          </span>
          <div className="comment-date text-[9px]" data-cy="Date-Of-Comment">
            {formatTime(comment?.created_at)}
          </div>
          <div
            className={`${
              !isRtl ? "pr-[27px]" : "pl-[27px]"
            } comment-text max-h-[100px] overflow-auto regular text-[#1d1d1d] text-[11px] mt-[0px]`}
          >
            {renderTextWithLinks(comment?.comment)}
          </div>
        </div>
        <div className="flex-row pl-[10px] pr-[3px] justify-between w-full items-center">
          <LikeButton comment={{ ...comment, target_type: "comment" }} />
        </div>
      </div>
      {has_reply ? (
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
                    {convertTextToXFormat(seller_name)}
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
              <div className="comment-text max-h-[100px] overflow-auto regular text-[#1d1d1d] text-[11px] mt-[0px]">
                {renderTextWithLinks(comment?.seller_reply)}
              </div>
            </div>
            <div className="flex-row pl-[10px] pr-[3px] justify-between w-full items-center">
              <LikeButton
                comment={{
                  ...comment,
                  target_type: "seller_reply",
                  total_likes: comment?.reply_total_likes,
                  is_liked: comment?.reply_is_liked,
                }}
                disabled={true}
              />
            </div>
            <span className="absolute bottom-[8px] right-[9px] text-[#8D8D8D] regular text-[9px] ">
              {13} {translateFunction("Minutes Answered", language)}
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="px-[10px] w-full bg-[#F8F8F8]">
            <hr className="text-[#D3D3D37f] h-[1px] bg-[#D3D3D37f] mt-0 w-full px-[10px]" />
          </div>
          <div
            className="comment-item text-[#1d1d1d] regular items-start flex-col rounded-t-none mt-0 rounded-b-[15px] justify-start max-w-full w-full bg-[#F8F8F8] min-h-[111px] py-[8px] px-[10px]"
            style={{
              position: "relative",
              direction: isRtl ? "rtl" : "ltr",
            }}
          >
            <svg
              fill="#3C3C3C"
              version="1.1"
              id="Capa_1"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              width="15px"
              height="15px"
              viewBox="0 0 473.068 473.068"
              xmlSpace="preserve"
              className="w-[15px] h-[15px] mb-[5px]"
            >
              <g>
                <g id="Layer_2_31_">
                  <g>
                    <path
                      d="M355.507,181.955c8.793-6.139,29.39-20.519,29.39-55.351v-71.77h9.814c4.49,0,8.17-3.679,8.17-8.169v-38.5
				c0-4.49-3.681-8.165-8.17-8.165H78.351c-4.495,0-8.165,3.675-8.165,8.165v38.5c0,4.491,3.67,8.169,8.165,8.169h9.82v73.071
				c0,34.499,10.502,42.576,29.074,53.89l80.745,49.203v20.984c-20.346,12.23-73.465,44.242-80.434,49.107
				c-8.793,6.135-29.384,20.51-29.384,55.352v61.793h-9.82c-4.495,0-8.165,3.676-8.165,8.166v38.498c0,4.49,3.67,8.17,8.165,8.17
				h316.361c4.49,0,8.17-3.68,8.17-8.17V426.4c0-4.49-3.681-8.166-8.17-8.166h-9.814v-63.104c0-34.493-10.508-42.572-29.069-53.885
				l-80.745-49.202v-20.987C295.417,218.831,348.537,186.822,355.507,181.955z M252.726,272.859l87.802,53.5
				c6.734,4.109,10.333,6.373,12.001,9.002c1.991,3.164,2.963,9.627,2.963,19.768v63.104H117.574v-61.793
				c0-19.507,9.718-26.289,16.81-31.242c5.551-3.865,54.402-33.389,85.878-52.289c4.428-2.658,7.135-7.441,7.135-12.611v-37.563
				c0-5.123-2.671-9.883-7.053-12.55l-87.54-53.339l-0.265-0.165c-6.741-4.105-10.336-6.369-11.998-9.009
				c-1.992-3.156-2.968-9.626-2.968-19.767V54.835h237.918v71.77c0,19.5-9.718,26.288-16.814,31.235
				c-5.546,3.872-54.391,33.395-85.869,52.295c-4.427,2.658-7.134,7.442-7.134,12.601v37.563
				C245.675,265.431,248.346,270.188,252.726,272.859z"
                      fill="#1d1d1d"
                    />
                    <path
                      d="M331.065,154.234c0,0,5.291-4.619-2.801-3.299c-19.178,3.115-53.079,15.133-92.079,15.133s-57-11-82.507-11.303
				c-5.569-0.066-5.456,3.629,0.937,7.391c6.386,3.758,63.772,35.681,71.671,40.08c7.896,4.389,12.417,4.05,20.786,0
				C259.246,196.334,331.065,154.234,331.065,154.234z"
                      fill="#1d1d1d"
                    />
                    <path
                      d="M154.311,397.564c-6.748,6.209-9.978,10.713,5.536,10.713c12.656,0,139.332,0,155.442,0
				c16.099,0,9.856-5.453,2.311-12.643c-14.576-13.883-45.416-23.566-82.414-23.566
				C196.432,372.068,169.342,383.723,154.311,397.564z"
                      fill="#1d1d1d"
                    />
                  </g>
                </g>
              </g>
            </svg>
            {translateFunction("Waiting Seller Reply...")}
          </div>
        </>
      )}
    </div>
  );
};
