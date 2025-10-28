import React, { useState } from "react";
import CommentItem from "./CommentItem";
import Skeleton from "react-loading-skeleton";
import profilePng from "public/images/profileNo.png";
import { formatTime, GetImageUrl } from "utils/tinyUtils";
import { CommentsPropsType } from "models/componentType/CommentsPropsType";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import { showErrorNotification } from "store/notifications/reducer";
import { translateFunction } from "utils/functions";
import Spinner from "components/global/Spinner";
import { useAppStore } from "store";

function Comments({
  productId,
  CommentsData,

  loading,
  shouldShowMore,
}: CommentsPropsType) {
  return (
    <div className="content-extended comments-extended" data-cy="CommentArea">
      {loading ? (
        <>
          {" "}
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
      ) : (
        CommentsData.map((s, i) => {
          if (s && s?.comment)
            return (
              <CommentItem
                comment={s}
                isPending={s?.id}
                isFull={true}
                isError={s?.isError}
                key={i}
                date={formatTime(s?.created_at)}
                name={s?.customer?.name}
                text={s?.comment}
                photo={GetImageUrl(s?.customer?.image) ?? profilePng}
                custmerId={s?.customer?.id}
              />
            );
        })
      )}
      {shouldShowMore && <LoadMoreComments product_id={productId} />}
    </div>
  );
}

export default Comments;

const LoadMoreComments = ({ product_id }) => {
  const [loading, setLoading] = useState(false);

  const getMoreComments = async () => {
    const { SelectedProduct, editInfo } = useAppStore.getState();
    try {
      setLoading(true);

      let data = await fetchData({
        url: `/api/products/comments/fqa_comments?product_id=${product_id}&offset=${JSON.stringify(
          SelectedProduct?.fqa_questions?.offset
        )}`,
        server: "local",
        method: "GET",
        reqTitle: REQUESTS_DATA.COMMENT_DATA_REQUEST,
      });
      editInfo({
        fqa_questions: {
          ...SelectedProduct?.fqa_questions,
          comments: [
            ...SelectedProduct.fqa_questions.comments,
            ...data.data?.fqa_comments,
          ],
          offset: data.data.offset,
        },
      });

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
