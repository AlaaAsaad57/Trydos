"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "store";
import { isCrawlerAgent } from "utils/botAgent";
import StartCover from "./StartCover";

/**
 * The start flow's white, in the page's first HTML (Stage 7e part 2, AC-3,
 * review finding S-5).
 *
 * Init draws the start flow, but Init sits in a Suspense (it reads the
 * query), so its own cover arrives in a later piece of the stream: measured
 * on a production build, the page painted at 420 ms and the cover came at
 * 650 ms. On a `gb-` address the [lang] layout already knows the flow will
 * show, so it draws this cover outside any Suspense, in the first piece.
 *
 * It goes away once the flow's login layer is up (`loginLayerOpen`), and at
 * once for a crawler, which never gets the flow. `?no-country` and
 * `?changed-country` on another country's address are only known from the
 * query, so there Init's own cover is the first one.
 */
export default function ShellStartCover() {
  const flowUp = useAppStore((s) => s.loginLayerOpen);
  const [crawler, setCrawler] = useState(false);
  useEffect(() => {
    if (isCrawlerAgent(navigator.userAgent)) setCrawler(true);
  }, []);
  if (flowUp || crawler) return null;
  return <StartCover />;
}
