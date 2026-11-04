import React from "react";
import { Skeleton } from "components/Server/Skeleton";
import { HEADER } from "../DemoApp/demoLayout";
import { SAFE_TOP } from "./demo1Layout";

/**
 * What a new screen shows while its code loads (Demo1ScreenView loads each
 * screen with next/dynamic). It has the screen's shape, so nothing jumps when
 * the screen comes:
 *
 *  - "inner": an inner screen — the 50 px head under the status bar with its
 *    title, then 60 px rows, radius 15, 12 px from both edges, 4 px apart
 *    (the shape of ScreenHeader and MenuRow in ui.tsx).
 *  - "tab": a tab screen — no head; a 140 px card and a 108 px card, then
 *    the same rows (the shape of the profile tab, XD `Home Page – 9`).
 */
export default function ScreenSkeleton({
  kind = "inner",
}: {
  kind?: "inner" | "tab";
}) {
  const card = (height: number, mt: number) => (
    <div style={{ margin: `${mt}px 12px 0`, height }}>
      <Skeleton height={height} borderRadius={15} />
    </div>
  );
  return (
    <div
      data-pw="app-screen-skeleton"
      aria-hidden
      className="relative flex flex-col w-full bg-white"
      style={{ minHeight: "100dvh", paddingTop: SAFE_TOP }}
    >
      {kind === "inner" ? (
        <div
          className="flex items-center justify-center"
          style={{ height: HEADER.height }}
        >
          <Skeleton width={96} height={16} borderRadius={8} />
        </div>
      ) : (
        <>
          {card(44, 19.5)}
          {card(140, 10.5)}
          {card(108, 4)}
        </>
      )}
      {[20, 4, 4, 4].map((mt, i) => (
        <React.Fragment key={i}>{card(60, mt)}</React.Fragment>
      ))}
    </div>
  );
}
