import React, { useEffect, useRef, useState } from "react";
import { LogError, translateFunction } from "utils/functions";
import CommentBar from "./CommentBar";
import { useParams } from "next/navigation";

import Spinner from "components/global/Spinner";
import { GAevent } from "utils/gtag";
import auth from "services/auth";
import { useAppStore } from "store";
import { GA_EVENT_NAMES } from "utils/GAEvents";
import Skeleton from "react-loading-skeleton";
import { GetProductFaqQuestions } from "serverRequests/product";

function CommentSection({ product_data }) {
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const {
    user,

    shouldUpdateComment,
    setShouldUpdateComment,
  } = useAppStore();
  const [commentsData, setCommentsData] = useState([]);
  const OffsetRef = useRef(null);
  const TotalRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    GAevent({
      action: GA_EVENT_NAMES.VIEW_COMMENTS,
      params: {
        user_id_custom: auth.UserID(),
        item_id: product_data?.id,
        item_name: product_data?.name,
        brand_id: product_data?.brand?.id,
        category: product_data?.categories?.[0]?.name,
        category_id: product_data?.categories?.[0]?.id,
        brand: product_data?.brand?.name,
        price: product_data?.offer_price,
      },
    });
    getMoreComments();
  }, []);
  const getMoreComments = async (reset = false) => {
    try {
      setIsLoading(true);
      let res = await GetProductFaqQuestions({
        language: languageVariable,
        productId: product_data?.id,
        userId: auth.UserID(),
        offset: OffsetRef.current,
      });
      if (reset) setCommentsData(res.comments);
      else setCommentsData([...commentsData, ...res.comments]);
      OffsetRef.current = res.offset;
      TotalRef.current = res.total;
      setLoading(false);
      setIsLoading(false);
    } catch (error) {
      LogError({
        error: error,
        scenario: "Error In getMoreComments in CommentSection",
      });
      setIsLoading(false);
      setLoading(false);
    }
  };
  useEffect(() => {
    if (shouldUpdateComment) {
      OffsetRef.current = null;
      setLoading(true);
      setCommentsData([]);
      getMoreComments(true);
      setShouldUpdateComment(null);
    }
  }, [shouldUpdateComment]);
  return (
    <div
      className="extended-section items-center justify-center"
      data-cy="ExtendCoomentSection"
    >
      {(!user || user?.phone === "0") && (
        <span className="text-red-500">
          {translateFunction("Please Login so You Can Add a comment")}
        </span>
      )}
      <div className="extended-bar-top m-0">
        <svg
          id="_20x20"
          data-name="20x20"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          width="20"
          height="20"
          viewBox="0 0 20 20"
        >
          <g id="Mask_Group_366" data-name="Mask Group 366">
            <path
              id="comm-16_chat"
              d="M10.353.353A9.971,9.971,0,0,0,1.726,15.371L.371,19.438a.333.333,0,0,0,.422.422l3.889-1.3A9.991,9.991,0,1,0,10.353.353Zm-3.342,9a1,1,0,1,1-1,1,1,1,0,0,1,1-1Zm3.342,0a1,1,0,1,1-1,1,1,1,0,0,1,1-1Zm3.325,0a1,1,0,1,1-1,1,1,1,0,0,1,1-1Z"
              transform="translate(-0.353 -0.344)"
              fill="#505050"
            />
          </g>
        </svg>

        <span>
          {translateFunction("Comment About This Product", languageVariable)}
        </span>
        {loading && (
          <span className="ml-2">
            <Spinner />
          </span>
        )}
      </div>

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
          commentsData
        )}
        {TotalRef.current > commentsData?.length && !loading && (
          <div className="p-2 flex w-full items-center justify-center">
            <div
              className="flex p-2 rounded-md bg-[#f8f8f8] light text-[#1d1d1d] text-center justify-center"
              onClick={() => {
                if (!isLoading && !loading) {
                  setLoading(true);
                  getMoreComments();
                }
              }}
            >
              {isLoading ? <Spinner /> : translateFunction("Load More")}
            </div>
          </div>
        )}
      </div>
      {user && user?.phone !== "0" && (
        <CommentBar
          product_data={product_data}
          setCommentsData={(e) => {
            setCommentsData([e, ...commentsData]);
          }}
        />
      )}
    </div>
  );
}

export default CommentSection;
