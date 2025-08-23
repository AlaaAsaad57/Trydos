import React, { useEffect, useState } from "react";
import { RoundPrice, translateFunction } from "utils/functions";
import Comments from "./Comments";
import CommentBar from "./CommentBar";
import { useParams } from "next/navigation";

import Spinner from "components/global/Spinner";
import { CommentSectionPropsType } from "models/componentType/CommentSectionPropsType";
import { GAevent } from "utils/gtag";
import auth from "services/auth";
import { useAppStore } from "store";
import { GA_EVENT_NAMES } from "utils/GAEvents";

function CommentSection({
  comments,
  product,
  increase_comments,
  CommentsData,
  setComments,
  ErrorAccure,
  Render,
  setRender,
  resendComment,
  verifyCommentAction,
  getComments,
}: CommentSectionPropsType) {
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const { currency } = useAppStore();
  useEffect(() => {
    if (comments) {
      setComments(
        comments.map((s) => ({ ...s, is_verfied: s?.is_verfied === undefined }))
      );
    }
  }, [comments]);
  const [loading, setLoading] = useState(true);
  const Init = async () => {
    GAevent({
      action: GA_EVENT_NAMES.VIEW_COMMENTS,
      params: {
        user_id_custom: auth.UserID(),
        item_id: product.id,
        item_name: product?.name,
        brand: product?.brand?.name,
        brand_id: product?.brand?.id,
        category: product?.category?.name || product?.categories?.[0]?.name,
        category_id: product?.category?.id || product?.categories?.[0]?.id,
        price: RoundPrice({
          num: product?.offer_price,
          rate: currency?.exchange_rate,
          returnNumber: true,
          language: "en",
        }),
      },
    });
    await getComments();
    setLoading(false);
  };
  useEffect(() => {
    Init();
  }, []);
  return (
    <div className="extended-section" data-cy="ExtendCoomentSection">
      <div className="extended-bar-top">
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

      <Comments
        CommentsData={CommentsData}
        ErrorAccure={(s) => ErrorAccure(s)}
        increase_comments={() => increase_comments()}
        productId={product.id}
        setComments={(s) => setComments(s)}
        setRender={(s) => setRender(s)}
        Render={Render}
        comments={CommentsData}
        resendComment={(s) => resendComment(s)}
        verifyCommentAction={(mid) => verifyCommentAction(mid)}
      />
      {
        <CommentBar
          CommentsData={CommentsData}
          verifyCommentAction={(mid) => verifyCommentAction(mid)}
          Render={Render}
          increase_comments={increase_comments}
          setComments={(s) => setComments(s)}
          setRender={(e) => setRender(e)}
          product={product}
          ErrorAccure={(s) => ErrorAccure(s)}
        />
      }
    </div>
  );
}

export default CommentSection;
