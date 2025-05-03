import React, { useEffect } from "react";
import Animated from "react-mount-animation";
import CommentSection from "./CommentSection";
import ShareSection from "./ShareSection";
import MoreOptionsSection from "./MoreOptionsSection";
import { ProductInterface } from "models/product";
import { getContacts } from "store/chat/actions";

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
}: {
  option: string;
  getComments: () => void;
  setOption: (e: string) => void;
  active: boolean;
  sharedContacts: Array<number>;
  setShareContacts: (e: Array<number>) => void;
  comments: any;

  product: ProductInterface;
  increase_comments: () => void;
  CommentsData: any;
  setComments: Function;
  ErrorAccure: Function;
  Render: boolean;
  setRender: Function;
  resendComment: Function;
  verifyCommentAction: Function;
}) {
  let height = 500;
  const mountAnim = ` 
  0% {max-height:0px}
  100% {max-height:${height}px}
`;
  const unmountAnim = `
0% {max-height:${height}px}
100% {max-height:0px}
`;
  useEffect(() => {
    setTimeout(() => {
      if (localStorage.getItem("USER-CHAT")) getContacts();
    }, 6000);
  }, []);

  return (
    <>
      <Animated.div
        className="Extended-area-product"
        show={active}
        time={0.3}
        mountAnim={mountAnim}
        style={{
          animationFillMode: "forwards",
          width: "100%",
          zIndex: "99999999999999",
        }}
        unmountAnim={unmountAnim}
      >
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
            getComments={async () => {
              await getComments();
            }}
            increase_comments={() => increase_comments()}
            product={product}
            Render={Render}
            setRender={(s) => setRender(s)}
            comments={comments}
            CommentsData={CommentsData}
            setComments={(s) => setComments(s)}
            ErrorAccure={(s) => ErrorAccure(s)}
            resendComment={(s) => resendComment(s)}
            verifyCommentAction={(mid) => verifyCommentAction(mid)}
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
        {active && (
          <div
            className="absolute shadow-md border cursor-pointer border-[#1a1a1a20] z-[9999] bg-[#fafafa] bottom-[5px] left-0 right-0 mx-auto w-[50px] h-[50px] rounded-full flex justify-center items-center"
            onClick={() => {
              setOption("");
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              fill="#000000"
              height="30px"
              width="30px"
              version="1.1"
              id="Layer_1"
              viewBox="0 0 330 330"
              xmlSpace="preserve"
            >
              <path
                xmlns="http://www.w3.org/2000/svg"
                fill="#5d5d5d"
                id="XMLID_225_"
                d="M325.607,79.393c-5.857-5.857-15.355-5.858-21.213,0.001l-139.39,139.393L25.607,79.393  c-5.857-5.857-15.355-5.858-21.213,0.001c-5.858,5.858-5.858,15.355,0,21.213l150.004,150c2.813,2.813,6.628,4.393,10.606,4.393  s7.794-1.581,10.606-4.394l149.996-150C331.465,94.749,331.465,85.251,325.607,79.393z"
              />
            </svg>
          </div>
        )}
      </Animated.div>
    </>
  );
}

export default ExtendedAreaInfo;
