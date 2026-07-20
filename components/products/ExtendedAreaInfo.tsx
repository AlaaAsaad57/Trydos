import CommentSection from "./CommentSection";
import MoreOptionsSection from "./MoreOptionsSection";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import ShareSectionSkeleton from "components/skeleton/ShareSectionSkeleton";

// Lazy: the share sheet pulls react-share; it only renders when the user
// opens the "shares" option, so keep it out of the product-page bundle.
const ShareSection = dynamic(() => import("./ShareSection"), {
  ssr: false,
  loading: () => <ShareSectionSkeleton />,
});
// ...other imports

function ExtendedAreaInfo({ option, active, product_data }) {
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
          w-full z-99999999999999
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
              <CommentSection product_data={product_data} />
            )}

            {option === "shares" && <ShareSection product={product_data} />}

            {option === "More" && <MoreOptionsSection product={product_data} />}
          </>
        )}
      </div>
    </>
  );
}

export default ExtendedAreaInfo;
