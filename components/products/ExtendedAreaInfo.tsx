import React, { useEffect } from "react";
import Animated from "react-mount-animation";
import CommentSection from "./CommentSection";
import ShareSection from "./ShareSection";
import MoreOptionsSection from "./MoreOptionsSection";
import { ProductInterface } from "models/product";
import SelectSize from "./SelectSize";
import { getContacts } from "store/chat/actions";
import Skeleton from "react-loading-skeleton";

function ExtendedAreaInfo({
  option,
  active,
  sharedContacts,
  setShareContacts,
  comments,
  increase_comments,
  product,
  CommentsData,
  setComments,
  Render,
  setRender,
  ErrorAccure,
  resendComment,
  verifyCommentAction,
  colors,
  loading,
}: {
  option: string;
  loading: boolean;
  active: boolean;
  sharedContacts: Array<number>;
  setShareContacts: (e: Array<number>) => void;
  comments: any;
  colors: any[];
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
        {option === "AddToCart" &&
          product?.choice_options?.filter((s) => s.title == "Size")[0]
            ?.options &&
          (loading ? (
            <>
              <div className="flex-row justify-center w-full h-[235px] items-center">
                <Skeleton
                  containerClassName="h-20 items-center flex-row"
                  className="w-20 h-20 rounded-full ml-2 items-center flex-row"
                />
                <Skeleton
                  containerClassName="h-20 items-center flex-row"
                  className="w-20 h-20 rounded-full ml-2 flex-row"
                />
                <Skeleton
                  containerClassName="h-20 items-center flex-row"
                  className="w-20 h-20 rounded-full ml-2 flex-row"
                />
                <Skeleton
                  containerClassName="h-20 items-center flex-row"
                  className="w-20 h-20 rounded-full ml-2 flex-row"
                />
                <Skeleton
                  containerClassName="h-20 items-center flex-row"
                  className="w-20 h-20 rounded-full ml-2 flex-row"
                />
                <Skeleton
                  containerClassName="h-20 items-center flex-row"
                  className="w-20 h-20 rounded-full ml-2 flex-row"
                />
              </div>
            </>
          ) : (
            <SelectSize
              sizes={
                product?.choice_options?.filter((s) => s.title == "Size")[0]
                  ?.options || []
              }
              variants={product.variation}
            />
          ))}
      </Animated.div>
    </>
  );
}

export default ExtendedAreaInfo;
