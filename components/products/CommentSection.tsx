import React, { Suspense, useEffect, useState } from "react";
import { getUser, translate } from "utils/functions";
import Comments from "./Comments";
import { useSelector } from "react-redux";
import CommentBar from "./CommentBar";

function CommentSection({ comments, product, increase_comments }) {
  const user = useSelector((state: any) => state.auth.user);
  const [Render, setRender] = useState(false);

  var language = "en";
  const [CommentsData, setComments] = useState(null);
  const addComment = (s) => {
    console.log(s);
    setComments([...CommentsData, { ...s, is_verfied: false }]);
    setRender(!Render);
  };
  const verifyComment = (mid, newComent) => {
    let s = CommentsData.filter((m) => m.mid === mid)[0];
    setComments([...CommentsData, { ...s, is_verfied: true }]);
    increase_comments();
    setRender(!Render);
  };
  const isError = (mid) => {
    let s = CommentsData.filter((m) => m.mid === mid)[0];
    if (s) {
      setComments([
        ...CommentsData,
        { ...s, is_verfied: false, isError: true },
      ]);
      setRender(!Render);
    }
  };
  useEffect(() => {
    if (comments)
      setComments(
        comments.map((s) => ({ ...s, is_verfied: s.is_verfied === null }))
      );
    console.log(comments);
  }, [comments]);
  useEffect(() => {
    console.log(CommentsData);
  }, [CommentsData, Render]);
  return (
    <div className="extended-section">
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

        <span>{translate("Comment About This Product", language)}</span>
      </div>

      <Comments Render={Render} comments={CommentsData} />
      {user?.id && (
        <CommentBar
          addCommentAction={(s) => addComment(s)}
          verifyComment={(mid, s) => verifyComment(mid, s)}
          isError={(s) => isError(s)}
          product={product}
        />
      )}
    </div>
  );
}

export default CommentSection;
