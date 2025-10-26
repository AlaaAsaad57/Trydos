import React, { useState } from "react";
import CommentItem from "./CommentItem";
import Skeleton from "react-loading-skeleton";
import { AddComment } from "models/API/market/AddComment";
import auth from "services/auth";
import profilePng from "public/images/profileNo.png";
import { formatTime, GetImageUrl } from "utils/tinyUtils";
import { CommentsPropsType } from "models/componentType/CommentsPropsType";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import { showErrorNotification } from "store/notifications/reducer";
import { translateFunction } from "utils/functions";
import Spinner from "components/global/Spinner";
import { COOKIE_NAMES, getCookie } from "utils/cookies/cookie-manager";
import { useAppStore } from "store";

function Comments({
  comments,
  Render,

  productId,
  ErrorAccure,
  CommentsData,
  setComments,
  increase_comments,
  setRender,
  shouldShowMore,
  verifyCommentAction,
  comment_offset,
}: CommentsPropsType) {
  const resendCommentApi = async (mid, s) => {
    try {
      let userData: any = getCookie(COOKIE_NAMES.USER_DATA);
      if (userData.need_auth) {
        showErrorNotification(
          translateFunction("Please Verify Your Phone Number")
        );
        return null;
      }
      let response = await fetchData({
        url: "/public_comment/comments/create",
        method: "POST",
        body: JSON.stringify({
          text: s,
          //   @ts-ignore
          product_id: String(productId),
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
      fetch(`/api/editSocialProduct?pid=${productId}`);
      if (response.data?.comment_id) {
        // verifyCommentAction(mid);

        increase_comments();
        let { SelectedProduct, editInfo } = useAppStore.getState();
        let selected_comment = SelectedProduct.fqa_questions.comments.filter(
          (m) => m.mid === s.mid
        )[0];
        editInfo({
          fqa_questions: {
            ...SelectedProduct.fqa_questions,
            comments: [
              {
                ...selected_comment,
              },
              ...SelectedProduct.fqa_questions.comments?.filter(
                (comment) => comment.mid !== s.mid
              ),
            ],
          },
        });
        setRender(!Render);
      } else {
        ErrorAccure(mid);
      }
    } catch (e) {
      ErrorAccure(mid);
    }
  };

  return (
    <div className="content-extended comments-extended" data-cy="CommentArea">
      {/* <CommentItem
        date="18 feb"
        name="Yxxx Oxxx"   
        text="Amazing Product I Buy It And I Saw It Is Good Quality Regarding Price"
        photo="https://res.cloudinary.com/dtcmozf4d/image/upload/h_100/f_webp/q_100/v1/product/thumbnail/2024-05-12-663fce81803c3.png"
      /> */}
      {CommentsData !== null ? (
        <>
          {CommentsData.map((s, i) => {
            if (s && s?.comment)
              return (
                <CommentItem
                  comment={s}
                  isPending={s?.id}
                  resendComment={() => {
                    let { SelectedProduct, editInfo } = useAppStore.getState();
                    let selected_comment =
                      SelectedProduct.fqa_questions.comments.filter(
                        (m) => m.mid === s.mid
                      )[0];
                    editInfo({
                      fqa_questions: {
                        ...SelectedProduct.fqa_questions,
                        comments: [
                          {
                            ...selected_comment,
                            is_verfied: false,
                            isError: false,
                          },
                          ...SelectedProduct.fqa_questions.comments?.filter(
                            (comment) => comment.mid !== s.mid
                          ),
                        ],
                      },
                    });
                    resendCommentApi(s.mid, s.comment);
                  }}
                  isError={s?.isError}
                  key={i}
                  date={formatTime(s?.created_at)}
                  name={s?.customer?.name}
                  text={s?.comment}
                  photo={GetImageUrl(s?.customer?.image) ?? profilePng}
                  custmerId={s?.customer?.id}
                />
              );
          })}
          {shouldShowMore && (
            <LoadMoreComments
              offsetVar={comment_offset}
              product_id={productId}
              setComments={(new_comments) => {
                setComments([...comments, ...new_comments]);
              }}
            />
          )}
        </>
      ) : (
        <>
          <Skeleton
            width={"100%"}
            height={"100px"}
            borderRadius={20}
            className="comment-item"
          ></Skeleton>
          <Skeleton
            width={"100%"}
            height={"100px"}
            borderRadius={20}
            className="comment-item"
          ></Skeleton>
        </>
      )}
    </div>
  );
}

export default Comments;

const LoadMoreComments = ({ product_id, offsetVar, setComments }) => {
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(offsetVar);
  const getMoreComments = async () => {
    try {
      setLoading(true);
      console.log(offset);
      let data = await fetchData({
        url: `/api/products/comments/fqa_comments?product_id=${product_id}&offset=${JSON.stringify(
          offset
        )}`,
        server: "local",
        method: "GET",
        reqTitle: REQUESTS_DATA.COMMENT_DATA_REQUEST,
      });

      setComments(data?.data?.fqa_comments ?? []);
      setOffset(data.offset?.offset);
      setLoading(false);
    } catch (error) {
      showErrorNotification(
        translateFunction("Failed To Retrive Results Please Try Again")
      );
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <>
        <Skeleton
          width={"100%"}
          height={"100px"}
          borderRadius={20}
          className="comment-item"
        ></Skeleton>
        <Skeleton
          width={"100%"}
          height={"100px"}
          borderRadius={20}
          className="comment-item"
        ></Skeleton>
      </>
    );
  }
  return (
    <div className="p-2 flex w-full items-center justify-center">
      <div
        className="flex p-2 rounded-md bg-[#f8f8f8] light text-[#1d1d1d] text-center justify-center"
        onClick={() => {
          if (!loading) {
            setLoading(true);
            getMoreComments();
          }
        }}
      >
        {loading ? <Spinner /> : translateFunction("Load More")}
      </div>
    </div>
  );
};
