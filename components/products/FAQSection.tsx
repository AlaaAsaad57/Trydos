"use client";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import Image from "next/image";
import React, { useState } from "react";
import { translateFunction } from "utils/functions";
import { convertTextToXFormat, formatTime, GetImageUrl } from "utils/tinyUtils";
import profilePng from "public/images/profileNo.png";
import FAQIcon from "public/svg/FAQIcon.svg";
import FAQInputIcon from "public/svg/FAQInputIcon.svg";
import { useAppStore } from "store";
import FAQModal from "./FAQModal";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import Spinner from "components/global/Spinner";
import auth from "services/auth";
import { showErrorNotification } from "store/notifications/reducer";
import { COOKIE_NAMES, getCookie } from "utils/cookies/cookie-manager";
import CommentItem from "./CommentItem";
function FAQSection({ lang, comments, product_id }) {
  const [country, language] = lang.split("-");
  const { setColorBottomSheet, editInfo, SelectedProduct } = useAppStore();
  const isRtl = language === "ar" || language === "ku";

  const AllComments =
    SelectedProduct?.fqa_questions?.comments ?? comments.comments;
  const [loading, setLoading] = useState(false);
  const loadMore = async () => {
    try {
      setLoading(true);
      let data = await fetchData({
        url: `/api/products/comments/fqa_comments?product_id=${product_id}&offset=${JSON.stringify(
          SelectedProduct?.fqa_questions?.offset
        )}`,
        method: "GET",
        server: "local",
        reqTitle: REQUESTS_DATA.COMMENT_DATA_REQUEST,
      });
      editInfo({
        fqa_questions: {
          ...SelectedProduct.fqa_questions,
          comments: [
            ...SelectedProduct.fqa_questions?.comments,
            ...data?.data?.fqa_comments,
          ],
          offset: data.data.offset,
        },
      });

      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };
  return (
    <>
      <FAQModal
        comments={comments.comments}
        total={comments?.total}
        offset={comments?.offset}
      />
      <div className="w-full flex-col mt-[12px]">
        <div
          className={`flex-col px-[10px] ${isRtl && "items-end"}`}
          onClick={() => {
            setColorBottomSheet({
              is_for_faq: true,
            });
          }}
        >
          <FAQIcon />
          <div className="flex-row gap-[11px] items-baseline text-[#1d1d1d] regular text-[11px] mt-[5px]">
            <span>{translateFunction("FAQ Buyer & Seller", language)}</span>
            <svg
              id="Group_14553"
              data-name="Group 14553"
              xmlns="http://www.w3.org/2000/svg"
              width="9.996"
              height="9.996"
              viewBox="0 0 9.996 9.996"
            >
              <path
                id="Subtraction_1"
                data-name="Subtraction 1"
                d="M.218,8.027a.215.215,0,0,1-.13-.045A.242.242,0,0,1,.009,7.73L.562,5.907A3.992,3.992,0,0,1,0,3.862,3.794,3.794,0,0,1,3.713,0,3.793,3.793,0,0,1,7.425,3.862,3.794,3.794,0,0,1,3.713,7.724,3.616,3.616,0,0,1,1.63,7.063L.341,7.987A.2.2,0,0,1,.218,8.027ZM3.679,5.816a.476.476,0,1,0,.468.476A.465.465,0,0,0,3.679,5.816Zm.1-3.79a.732.732,0,0,1,.795.733c0,.36-.152.583-.582.852a1.194,1.194,0,0,0-.68,1.073v.085c0,.266.142.431.372.431.213,0,.335-.135.355-.391.017-.371.151-.557.6-.83a1.4,1.4,0,0,0-.822-2.632,1.5,1.5,0,0,0-1.464.818.988.988,0,0,0-.1.431.321.321,0,0,0,.344.361c.187,0,.29-.09.358-.31A.792.792,0,0,1,3.775,2.025Z"
                transform="translate(0 1.969)"
                fill="#c4c2c2"
              />
              <path
                id="Path_21380"
                data-name="Path 21380"
                d="M9.417,8.061a.216.216,0,0,1-.131.045.2.2,0,0,1-.122-.039l-1.29-.924-.015.009a4.426,4.426,0,0,0,.335-1.7A4.239,4.239,0,0,0,4.045,1.14a3.935,3.935,0,0,0-.911.106A3.6,3.6,0,0,1,5.792.079,3.794,3.794,0,0,1,9.5,3.941a3.98,3.98,0,0,1-.562,2.045L9.5,7.81a.239.239,0,0,1-.079.251Z"
                transform="translate(-0.332 0.375)"
                fill="#c4c2c2"
              />
              <rect
                id="Rectangle_4714"
                data-name="Rectangle 4714"
                width="9.61"
                height="9.996"
                transform="translate(0.386)"
                fill="none"
              />
            </svg>
          </div>
        </div>
        <HortiznalScrollBar
          id="faq-buyers-bar"
          className="flex-row w-full gap-[4px]"
        >
          {AllComments?.map((s, i) => {
            if (s && s.comment && !s.isError)
              return (
                <CommentItem
                  isPending={s?.id}
                  isFull={false}
                  isError={s?.isError}
                  key={i}
                  date={formatTime(s?.created_at)}
                  name={s?.customer?.name}
                  text={s?.comment}
                  photo={GetImageUrl(s?.customer?.image) ?? profilePng}
                  custmerId={s?.customer?.id}
                  comment={s}
                />
              );
          })}
          {comments.total > AllComments?.length && (
            <div
              className={`comment-item rounded-[15px] flex-col justify-between min-w-[330px] max-w-[100px] w-full bg-[#F8F8F8] min-h-[111px] py-[8px] px-[10px]`}
              style={{
                position: "relative",
              }}
              onClick={() => {
                if (!loading) loadMore();
              }}
            >
              <div className="w-full flex-col h-full justify-center items-center text-[#1d1d1d] light">
                {loading ? <Spinner /> : translateFunction("Load More")}
              </div>
            </div>
          )}
        </HortiznalScrollBar>
        <AskInput
          language={language}
          setCommentsData={(e) => {
            editInfo({
              fqa_questions: {
                ...SelectedProduct.fqa_questions,
                comments: [e, ...SelectedProduct.fqa_questions.comments],
                total: SelectedProduct.fqa_questions.total + 1,
              },
            });
          }}
        />
      </div>
    </>
  );
}

export default FAQSection;

export const FaqItem = ({
  language,
  comment,
  isFull = false,
  isError = false,
}) => {
  let has_reply = comment.has_reply;
  return (
    <div
      className={`flex-col ${
        isFull ? "min-w-full" : "min-w-[85vw]"
      } ${"max-w-full w-full"}`}
    >
      <div
        className={`comment-item  ${
          has_reply ? "rounded-t-[15px] rounded-b-[0px]" : "rounded-[15px]"
        } flex-col justify-between max-w-full w-full  min-h-[111px] py-[8px] px-[10px]`}
        style={{
          position: "relative",
          backgroundColor: isError ? "#ffd6d6" : "#F8F8F8",
        }}
      >
        <div className="w-full flex-col">
          <div className="flex-row items-center">
            <div className="comment-photo">
              <Image
                src={GetImageUrl(comment?.customer?.image) ?? profilePng}
                width={20}
                height={20}
                alt={convertTextToXFormat(comment?.customer?.name)}
              />
            </div>
            <div className="comment-content capitalize">
              <div
                className="comment-source text-[#1D1D1D] text-[9px] regular"
                data-cy="Source-Of-Comment"
              >
                <span className="bold pr-[4px]">A</span>{" "}
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
                clipPath="url(#clip-path)"
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
                    src={GetImageUrl(comment?.customer?.image) ?? profilePng}
                    width={20}
                    height={20}
                    alt={convertTextToXFormat(comment?.customer?.name)}
                  />
                </div>
                <div className="comment-content capitalize">
                  <div
                    className="comment-source text-[#1D1D1D] text-[9px] regular"
                    data-cy="Source-Of-Comment"
                  >
                    <span className="bold pr-[4px]">A</span>
                    {convertTextToXFormat(comment?.customer?.name)}
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
                    clipPath="url(#clip-path)"
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

const AskInput = ({ language, setCommentsData }) => {
  const { user } = useAppStore();
  const renderBorderSvg = () => {
    return (
      <svg
        className="absolute top-0 left-0 z-20"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="40"
      >
        <rect
          x="0.25"
          y="0.25"
          width="100%"
          height="39.5"
          stroke="#513aaf"
          strokeWidth="0.5"
          rx="14.75"
          fill="none"
        />
      </svg>
    );
  };
  const isRtl = language === "ar" || language === "ku";
  const [loading, setLoading] = useState(false);
  const { SelectedProduct, country, editInfo } = useAppStore();
  const [comment, setComment] = useState("");
  const addComment = async () => {
    try {
      let userData: any = getCookie(COOKIE_NAMES.USER_DATA);
      if (userData.need_auth) {
        showErrorNotification(
          translateFunction("Please Verify Your Phone Number")
        );
        return null;
      }
      setLoading(true);
      let response = await fetchData({
        url: "/public_comment/comments/create",
        method: "POST",
        body: JSON.stringify({
          text: comment,
          //   @ts-ignore
          product_id: String(SelectedProduct?.id),
          user_id: String(auth.UserID()),
          user_name: auth.User()?.name,
          user_avatar: auth.User().image,
          user_type: "customer",
          phone: auth?.User()?.phone,
        }),
        reqTitle: REQUESTS_DATA.ADD_COMMENT_FOR_PRODUCT,
        server: "comments",
      });

      // @ts-ignore
      if (!response.success) {
        // @ts-ignore
        throw new Error(response.message);
      }
      if (response.data.comment_id) {
        let newComment = {
          id: response.data.comment_id,
          customer: {
            id: response?.data.user_id,
            name: response?.data.user_name,
            image: response?.data.user_avatar,
          },
          order_details_id: response?.data?.order_details_id,
          star_rating: response?.data?.rating,
          comment: response?.data?.text,
          variant: response?.data?.variant,
          created_at: response?.data?.created_at,
          product_id: String(SelectedProduct?.id),
        };
        // setCommentsData(newComment);
        editInfo({
          fqa_questions: {
            ...SelectedProduct?.fqa_questions,
            comments: [newComment, ...SelectedProduct?.fqa_questions?.comments],
            comments_count: SelectedProduct?.fqa_questions?.total + 1,
            total: SelectedProduct?.fqa_questions?.total + 1,
          },
        });
      }
      fetch(
        `/api/editSocialProduct?pid=${SelectedProduct.id}&slug=${SelectedProduct.slug}&language=${language}&country=${country}`
      );
      setComment("");
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };
  return (
    <div
      className={`${
        loading && "opacity-80"
      } flex mt-[9px] w-full relative h-[40px] rounded-[15px] bg-[#FFFFFF]`}
    >
      {
        <span
          className={`absolute top-[10px] ${
            isRtl ? "right-[10px]" : "left-[10px]"
          } z-10`}
        >
          <FAQInputIcon />
        </span>
      }
      {loading && (
        <span
          className={`absolute top-[10px] ${
            isRtl ? "left-[10px]" : "right-[10px]"
          }`}
        >
          <Spinner />
        </span>
      )}
      {renderBorderSvg()}
      <input
        placeholder={translateFunction(
          "Ask Seller Your Question About This Product …",
          language
        )}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !loading) {
            if (comment.length > 0) addComment();
          }
        }}
        value={comment}
        onChange={(e) => {
          setComment(e.target.value);
        }}
        onMouseDown={() => {
          if (user?.phone === "0" || !user)
            showErrorNotification(translateFunction("Please log in first"));
        }}
        readOnly={loading || user?.phone === "0" || !user}
        className="outline-none w-full bg-transparent z-40 rounded-[15px] text-[#1d1d1d] placeholder:text-[#C4C2C2] placeholder:text-center px-[40px] flex items-center"
      />
    </div>
  );
};
