import React from "react";
import Animated from "react-mount-animation";
import CommentSection from "./CommentSection";
import ShareSection from "./ShareSection";
import MoreOptionsSection from "./MoreOptionsSection";
function ExtendedAreaInfo({
  option,
  active,
  sharedContacts,
  setShareContacts,
}: {
  option: string;
  active: boolean;
  sharedContacts: Array<number>;
  setShareContacts: (e: Array<number>) => void;
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

  return (
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
      {option === "Comment" && <CommentSection />}
      {option === "Share" && (
        <ShareSection
          sharedContacts={sharedContacts}
          setShareContacts={setShareContacts}
        />
      )}
      {option === "More" && <MoreOptionsSection />}
    </Animated.div>
  );
}

export default ExtendedAreaInfo;
