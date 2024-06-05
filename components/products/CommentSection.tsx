import React from "react";
import { translate } from "utils/functions";
import CommentItem from "./CommentItem";

function CommentSection() {
  var language = "en";
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
      <div className="content-extended comments-extended">
        <CommentItem
          date="18 feb"
          name="Yxxx Oxxx"
          text="Amazing Product I Buy It And I Saw It Is Good Quality Regarding Price"
          photo="https://res.cloudinary.com/dtcmozf4d/image/upload/h_100/f_avif/q_100/v1/product/thumbnail/2024-05-12-663fce81803c3.png"
        />
        <CommentItem
          date="18 feb"
          name="Yxxx Oxxx"
          text="Amazing Product I Buy It And I Saw It Is Good Quality Regarding Price"
          photo="https://res.cloudinary.com/dtcmozf4d/image/upload/h_100/f_avif/q_100/v1/product/thumbnail/2024-05-12-663fce81803c3.png"
        />
        <CommentItem
          date="18 feb"
          name="Yxxx Oxxx"
          text="Amazing Product I Buy It And I Saw It Is Good Quality Regarding Price"
          photo="https://res.cloudinary.com/dtcmozf4d/image/upload/h_100/f_avif/q_100/v1/product/thumbnail/2024-05-12-663fce81803c3.png"
        />
      </div>
    </div>
  );
}

export default CommentSection;
