"use client";

import { Skeleton } from "components/Server/Skeleton";
import { PAGE_MAX } from "components/DemoApp1/demo1Layout";
import { CoverBox } from "components/global/PageCover";

/**
 * What a bottom sheet shows while its code loads: the page goes dark and the
 * sheet's panel comes up. It uses the page cover's box, because a fixed box at
 * the bottom edge breaks Safari's bar (see CoverBox).
 */
export default function SheetSkeleton() {
  return (
    <CoverBox clear>
      <div
        data-pw="sheet-skeleton"
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: "rgba(0, 0, 0, 0.4)" }}
      >
        <div
          className="absolute inset-x-0 bottom-0 flex flex-col mx-auto bg-white"
          style={{
            maxWidth: PAGE_MAX,
            height: "75%",
            gap: 16,
            padding: 20,
            borderRadius: "20px 20px 0 0",
          }}
        >
          <div className="flex justify-center">
            <Skeleton width={60} height={5} borderRadius={3} />
          </div>
          <div className="flex items-center" style={{ gap: 12 }}>
            <Skeleton
              className="shrink-0"
              width={84}
              height={84}
              borderRadius={15}
            />
            <div className="flex flex-col flex-1" style={{ gap: 10 }}>
              <Skeleton width="70%" height={16} borderRadius={8} />
              <Skeleton width="40%" height={14} borderRadius={7} />
            </div>
          </div>
          <Skeleton height={44} borderRadius={12} />
          <Skeleton height={44} borderRadius={12} />
          <Skeleton height={48} borderRadius={12} />
        </div>
      </div>
    </CoverBox>
  );
}
