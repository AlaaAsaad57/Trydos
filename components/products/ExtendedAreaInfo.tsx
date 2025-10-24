import CommentSection from "./CommentSection";
import ShareSection from "./ShareSection";
import MoreOptionsSection from "./MoreOptionsSection";
import { ExtendedAreaInfoPropsType } from "models/componentType/ExtendedAreaInfoPropsType";
import React, { useState, useEffect } from "react";
// ...other imports

function ExtendedAreaInfo({
  option,
  active,
  sharedContacts,
  setShareContacts,
  comments,
  increase_comments,
  setOption,
  product,
  CommentsData,
  setComments,
  Render,
  setRender,
  ErrorAccure,
  resendComment,
  verifyCommentAction,
  getComments,
}: ExtendedAreaInfoPropsType) {
  const [show, setShow] = useState(active);

  useEffect(() => {
    if (active) {
      setShow(true);
    } else {
      // Delay unmounting until animation finishes (300ms)
      const timeout = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [active]);

  return (
    <>
      <div
        className={`
          Extended-area-product
          overflow-hidden transition-all duration-300 ease-in-out
          ${active ? "max-h-[500px]" : "max-h-0"}
          w-full z-[99999999999999]
        `}
        style={{ animationFillMode: "forwards" }}
      >
        {show && (
          <>
            <svg
              className="border-svg"
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              height="1.7"
            >
              <line
                id="Line_1104"
                data-name="Line 1104"
                x2="100%"
                y2="1"
                transform="translate(0.001 0.35)"
                fill="none"
                stroke="#e6e6e6"
                strokeWidth="0.7"
              />
            </svg>

            {option === "Comment" && (
              <CommentSection
                getComments={getComments}
                increase_comments={increase_comments}
                product={product}
                Render={Render}
                setRender={setRender}
                comments={comments}
                CommentsData={CommentsData}
                setComments={setComments}
                ErrorAccure={ErrorAccure}
                resendComment={resendComment}
                verifyCommentAction={verifyCommentAction}
              />
            )}

            {option === "Share" && (
              <ShareSection
                sharedContacts={sharedContacts}
                product={product}
                setShareContacts={setShareContacts}
              />
            )}

            {option === "More" && <MoreOptionsSection />}

            {/* {active && (
              <div
                className="absolute shadow-md border cursor-pointer border-[#1a1a1a20] z-[9999] bg-[#fafafa] bottom-[5px] left-0 right-0 mx-auto w-[50px] h-[50px] rounded-full flex justify-center items-center"
                onClick={() => {
                  setOption("");
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="#000000"
                  height="30px"
                  width="30px"
                  viewBox="0 0 330 330"
                >
                  <path
                    fill="#5d5d5d"
                    d="M325.607,79.393c-5.857-5.857-15.355-5.858-21.213,0.001l-139.39,139.393L25.607,79.393
                  c-5.857-5.857-15.355-5.858-21.213,0.001c-5.858,5.858-5.858,15.355,0,21.213l150.004,150c2.813,2.813,6.628,4.393,10.606,4.393
                  s7.794-1.581,10.606-4.394l149.996-150C331.465,94.749,331.465,85.251,325.607,79.393z"
                  />
                </svg>
              </div>
            )} */}
          </>
        )}
      </div>
    </>
  );
}

export default ExtendedAreaInfo;
