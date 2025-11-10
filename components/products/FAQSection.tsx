"use client";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import Image from "next/image";
import React, { useState, useMemo } from "react";
import { translateFunction } from "utils/functions";
import { convertTextToXFormat, formatTime, GetImageUrl } from "utils/tinyUtils";
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
}) => {
  let has_reply = comment.has_reply;
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
          <div className="comment-text regular text-[#1d1d1d] text-[11px] mt-[0px]">
            {renderTextWithLinks(comment?.comment)}
          </div>
        </div>
        <div className="flex-row pl-[10px] pr-[3px] justify-between w-full items-center">
          <LikeButton
            key={`${comment.total_likes}-${comment.reply_total_likes}`}
            comment={{ ...comment, target_type: "comment" }}
          />
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
                    alt={convertTextToXFormat(seller_name)}
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
              <div className="comment-text regular text-[#1d1d1d] text-[11px] mt-[0px]">
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
        value={comment}
        onChange={(e) => {
          setComment(e.target.value);
        }}
        onMouseDown={() => {
          if (user?.phone === "0" || !user)
            showErrorNotification(translateFunction("Please log in first"));
        }}
        readOnly={loading || user?.phone === "0" || !user}
        className={`${
          isRtl ? "text-right" : "text-left"
        } outline-none w-full bg-transparent z-40 rounded-[15px] text-[#1d1d1d] placeholder:text-[#C4C2C2] placeholder:text-center px-[40px] flex items-center`}
      />
    </div>
  );
};

export function LikeButton({ comment, disabled = false }) {
  const [isLiked, setIsLiked] = useState(comment?.is_liked || false);
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
    } catch (error) {
      // Revert to previous state if error occurred
      setIsLiked(previousIsLiked);
      setLikes(previousLikes);
    } finally {
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
      className="flex items-center gap-[4px] text-[#1d1d1d] text-[9px] regular cursor-pointer select-none"
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
            id="heartGradient"
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
        />
      </svg>
      <span>{likes.toLocaleString()}</span>

      <style jsx>{`
        .heart {
          fill: transparent;
          transition: fill 0.3s ease, transform 0.3s ease;
        }
        .heart.liked {
          fill: url(#heartGradient);
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
