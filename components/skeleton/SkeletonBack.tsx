"use client";

import { useParams } from "next/navigation";
import XdIcon from "components/DemoApp/XdIcon";
import { mirrorFor, usePageDir } from "components/DemoApp1/rtl";
import { translateFunction } from "utils/functions";

/**
 * The back mark of a page that was opened directly, while its skeleton shows.
 * The real mark comes with the page's data, so until then the shopper had a
 * back mark that did nothing. Same place and size as the real one.
 *
 * It is a plain link on purpose. A skeleton in a Suspense fallback is not
 * hydrated while its page streams, and the app's JavaScript may not be here at
 * all, and a link needs neither. Once the app is alive, PageCover takes the tap
 * and goes through the router (`data-skeleton-back`), with the slide.
 *
 * Only a direct landing has one: there the back mark goes to Home. After a tap
 * in the app, Back and the bar are the way out.
 */
export default function SkeletonBack() {
  const params = useParams();
  const dir = usePageDir();
  const locale = typeof params?.lang === "string" ? params.lang : "sy-en";
  return (
    <a
      href={`/${locale}`}
      dir={dir}
      aria-label={translateFunction("Back", locale.split("-")[1])}
      data-pw="skeleton-back"
      data-skeleton-back=""
      className="absolute flex items-start cursor-pointer active:opacity-60 [-webkit-tap-highlight-color:transparent]"
      style={{
        // Not insetInlineStart: that follows the box around the mark, and a
        // skeleton of a direct landing has no `dir` around it.
        [dir === "rtl" ? "right" : "left"]: 0,
        top: 0,
        width: 34,
        height: 50,
        paddingTop: 14,
        paddingInlineStart: 14,
      }}
    >
      <span
        className="block"
        style={{ transform: "translate(0.5px, 0.5px)", ...mirrorFor(dir) }}
      >
        <XdIcon name="back" />
      </span>
    </a>
  );
}
