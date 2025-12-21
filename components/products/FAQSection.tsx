"use client";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import Image from "next/image";
import React, { useState, useMemo } from "react";
import { translateFunction } from "utils/functions";
import {
  convertTextToXFormat,
  formatTime,
  getFirstLetterLang,
  GetImageUrl,
} from "utils/tinyUtils";
import profilePng from "public/images/profileNo.png";
import FAQIcon from "public/svg/FAQIcon";
import FAQInputIcon from "public/svg/FAQInputIcon";
import { useAppStore } from "store";
import FAQModal from "./FAQModal";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import Spinner from "components/global/Spinner";
import auth from "services/auth";
import { showErrorNotification } from "store/notifications/reducer";
import { COOKIE_NAMES, getCookie } from "utils/cookies/cookie-manager";
import CommentPost from "public/svg/CommentPost";
import CommentItem from "./CommentItem";
import home from "services/home";

function FAQSection({ lang, comments, product_id, seller_name }) {
  const [country, language] = lang.split("-");
  const { setColorBottomSheet, editInfo, SelectedProduct } = useAppStore();
  const isRtl = language === "ar" || language === "ku";

  // Make AllComments reactive to SelectedProduct changes
  // This ensures it updates when likes are changed via editInfo
  // The array reference changes when editInfo updates comments, triggering recalculation
  const AllComments = useMemo(() => {
    return SelectedProduct?.fqa_questions?.comments ?? comments.comments;
  }, [SelectedProduct?.fqa_questions?.comments, comments.comments]);

  const [loading, setLoading] = useState(false);
  const loadMore = async () => {
    try {
      setLoading(true);
      let data = await fetchData({
        url: `/api/products/comments/fqa_comments?user_id=${auth.UserID()}&product_id=${product_id}&offset=${JSON.stringify(
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
                  seller_name={seller_name}
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
  seller_name,
  isCommentTranslated = false,
  isReplyTranslated = false,
  translatedComment = null,
  translatedReply = null,
  onTranslateComment = null,
  onTranslateReply = null,
  translateLoading = false,
}) => {
  let has_reply = comment.has_reply;

  const renderTextWithLinks = (text) => {
    if (!text) return null;
    return <React.Fragment key={text}>{text}</React.Fragment>;
  };
  const isRtl = language === "ar" || language === "ku";

  return (
    <>
      <div
        className={`flex-col ${
          isFull ? "min-w-full" : "min-w-[85vw]"
        } ${"max-w-full w-full"}`}
      >
        <div
          className={`comment-item  rounded-t-[15px] rounded-b-[0px] flex-col justify-between max-w-full w-full  min-h-[111px] py-[8px] px-[10px]`}
          style={{
            position: "relative",
            backgroundColor: isError ? "#ffd6d6" : "#F8F8F8",
            direction: language === "ar" || language === "ku" ? "rtl" : "ltr",
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
              <div className="comment-content capitalize mx-[10px]">
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
            <div
              className="comment-date text-[9px]"
              data-cy="Date-Of-Comment"
              style={{
                right: isRtl ? "initial" : "10px",
                left: isRtl ? "10px" : "initial",
              }}
            >
              {formatTime(comment?.created_at)}
            </div>
            <div
              className={`${
                !isRtl ? "pr-[27px]" : "pl-[27px]"
              } comment-text max-h-[100px] overflow-auto regular text-[#1d1d1d] text-[11px] mt-[0px]`}
            >
              {renderTextWithLinks(
                isCommentTranslated && translatedComment
                  ? translatedComment
                  : comment?.comment
              )}
            </div>
          </div>
          <div className="flex-row pl-[10px] pr-[3px] justify-between w-full items-center">
            <LikeButton
              key={`${comment.total_likes}-${comment.reply_total_likes}`}
              comment={{ ...comment, target_type: "comment" }}
            />
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
                direction: isRtl ? "rtl" : "ltr",
              }}
            >
              <div className="w-full flex-col">
                <div className="flex-row items-center">
                  <div className="comment-photo">
                    <Image
                      src={profilePng}
                      width={20}
                      height={20}
                      alt={convertTextToXFormat(seller_name)}
                    />
                  </div>
                  <div className="comment-content capitalize mx-[10px]">
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
                  style={{
                    right: isRtl ? "initial" : "10px",
                    left: isRtl ? "10px" : "initial",
                  }}
                >
                  {formatTime(comment?.reply_created_at)}
                </div>
                <div className="comment-text max-h-[100px] overflow-auto regular text-[#1d1d1d] text-[11px] mt-[0px]">
                  {renderTextWithLinks(
                    isReplyTranslated && translatedReply
                      ? translatedReply
                      : comment?.seller_reply
                  )}
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
    </>
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
      const variant =
        [SelectedProduct?.ActiveColor, SelectedProduct?.ActiveSize]
          ?.filter((s) => Boolean(s))
          ?.join("-") ?? null;
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
          owner_id: String(SelectedProduct?.owner_id),
          owner_type: SelectedProduct?.owner_type,
          variant,
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
        `/api/editSocialProduct?pid=${SelectedProduct.id}&slug=${SelectedProduct.slug}&language=${language}&country=${country}`,
        {
          credentials: "omit",
        }
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
      <span
        className={`absolute top-[10px] ${
          isRtl ? "right-[10px]" : "left-[10px]"
        } z-10`}
      >
        <FAQInputIcon />
      </span>

      {loading && (
        <span
          className={`absolute top-[10px] ${
            isRtl ? "left-[10px]" : "right-[10px]"
          }`}
        >
          <Spinner />
        </span>
      )}
      {!loading && comment.length > 0 && (
        <span
          className={`absolute top-[0px] cursor-pointer z-50 flex items-center justify-center h-full w-[50px] ${
            isRtl ? "left-[5px] rotate-180" : "right-[5px]"
          }`}
          onClick={() => {
            addComment();
          }}
        >
          <CommentPost className="[&>path]:fill-[#f0ecff] [&>path]:stroke-[#513aaf]" />
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
        value={comment.slice(0, 200)}
        style={{
          textAlign: getFirstLetterLang(comment),
        }}
        onChange={(e) => {
          setComment(e.target.value);
        }}
        onMouseDown={() => {
          if (user?.phone === "0" || !user)
            showErrorNotification(translateFunction("Please log in first"));
        }}
        readOnly={loading || user?.phone === "0" || !user}
        className={`outline-none w-full bg-transparent z-40 rounded-[15px] text-[#1d1d1d] placeholder:text-[#C4C2C2] placeholder:text-center pl-[40px] pr-[45px] flex items-center`}
      />
    </div>
  );
};

export function LikeButton({ comment, disabled = false }) {
  const [isLiked, setIsLiked] = useState(comment?.is_liked || false);
  const [loading, setLoading] = useState(false);
  const [likes, setLikes] = useState(comment?.total_likes || 0);
  const [animating, setAnimating] = useState(false);
  const { setLoginOpen, editInfo, SelectedProduct } = useAppStore();
  const ReactOnComment = async () => {
    let user_cookies = getCookie(COOKIE_NAMES.USER_ID_HASH);
    if (!user_cookies) {
      setLoginOpen(true);
      showErrorNotification(translateFunction("Please Login First"));
      return;
    }
    if (animating) return;
    setAnimating(true);
    const previousIsLiked = isLiked;
    const previousLikes = likes;
    setIsLiked(!isLiked);
    setLikes((prev) => (isLiked ? prev - 1 : prev + 1));

    try {
      setLoading(true);
      if (isLiked) {
        await home.UnLikeComment({
          comment_id: comment.id,
          target_type: comment.target_type,
          product_id: comment.product_id,
        });
      } else {
        await home.LikeComment({
          comment_id: comment.id,
          target_type: comment.target_type,
          product_id: comment.product_id,
        });
      }
      handleLikeAction(!isLiked, isLiked ? likes - 1 : likes + 1);
      setLoading(false);
    } catch (error) {
      // Revert to previous state if error occurred
      setLoading(false);
      setIsLiked(previousIsLiked);
      setLikes(previousLikes);
    } finally {
      setLoading(false);
      // small delay to allow the animation to finish
      setTimeout(() => setAnimating(false), 400);
    }
  };
  const handleLikeAction = (isLikedVar, likesVar) => {
    const isReply = comment?.target_type === "seller_reply";

    // Find which array contains the comment
    const fqaComment = SelectedProduct?.fqa_questions?.comments?.find(
      (s) => s.id === comment?.id
    );
    const buyerComment = SelectedProduct?.buyers_comment?.comments?.find(
      (s) => s.id === comment?.id
    );

    if (fqaComment) {
      // Update FAQ comment
      const updatedComments = SelectedProduct.fqa_questions.comments.map(
        (c) => {
          if (c.id === comment?.id) {
            if (isReply) {
              // Update reply fields
              return {
                ...c,
                reply_is_liked: isLikedVar,
                reply_total_likes: likesVar,
              };
            } else {
              // Update comment fields
              return {
                ...c,
                is_liked: isLikedVar,
                total_likes: likesVar,
              };
            }
          }
          return c;
        }
      );

      editInfo({
        fqa_questions: {
          ...SelectedProduct.fqa_questions,
          comments: updatedComments,
        },
      });
    } else if (buyerComment) {
      // Update buyer comment
      const updatedComments = SelectedProduct.buyers_comment.comments.map(
        (c) => {
          if (c.id === comment?.id) {
            if (isReply) {
              // Update reply fields
              return {
                ...c,
                reply_is_liked: isLikedVar,
                reply_total_likes: likesVar,
              };
            } else {
              // Update comment fields
              return {
                ...c,
                is_liked: isLikedVar,
                total_likes: likesVar,
              };
            }
          }
          return c;
        }
      );

      editInfo({
        buyers_comment: {
          ...SelectedProduct.buyers_comment,
          comments: updatedComments,
        },
      });
    }
  };
  return (
    <div
      className={`${
        loading && "opacity-65 scale-90"
      } flex items-center gap-[4px] text-[#1d1d1d] text-[9px] regular cursor-pointer select-none`}
      onClick={ReactOnComment}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="11"
        height="11"
        viewBox="0 0 11 11"
        className={`heart ${isLiked ? "liked" : ""} ${
          animating ? "pop" : ""
        } scale-[1.2]`}
      >
        <defs>
          <linearGradient
            id={`heartGradient-${comment.id}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#FF6B6B" />
            <stop offset="100%" stopColor="#FF1E56" />
          </linearGradient>
        </defs>
        <path
          d="M5.5 9.79L4.85 9.24C2.43 7.13 1 5.66 1 3.94
       1 2.51 2.02 1.46 3.45 1.46
       c0.8 0 1.57.37 2.05.95
       0.48-.58 1.25-.95 2.05-.95
       1.43 0 2.45 1.05 2.45 2.48
       0 1.72-1.43 3.19-3.85 5.3L5.5 9.79z"
          strokeWidth={"0.5"}
          stroke={isLiked ? "transparent" : "#1d1d1d"}
          fill={isLiked ? "" : "transparent"}
        />
      </svg>
      <span>{likes.toLocaleString()}</span>

      <style jsx>{`
        .heart {
          fill: transparent;
          transition: fill 0.3s ease, transform 0.3s ease;
        }
        .heart.liked {
          fill: url(#${`heartGradient-${comment.id}`});
        }
        .heart.pop {
          transform: scale(1.3);
        }
        .heart:not(.pop) {
          transform: scale(1);
        }

        /* Define gradient inside the same component */
        .heart defs,
        .heart linearGradient {
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
