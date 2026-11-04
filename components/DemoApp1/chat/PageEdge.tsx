"use client";

import React, { useEffect, useRef } from "react";

/** How near the edge comes, in px, before the next page is asked for. */
const AHEAD = 400;

/**
 * An empty line at the end (or the top) of a list that loads a page at a
 * time: when it comes near the screen, `onReach` asks for the next page.
 * The XD file draws no loader, so nothing shows.
 *
 * `count` is how many rows the list holds. When it changes the line is
 * watched again, so a list still too short to fill the screen asks for one
 * more page.
 */
export default function PageEdge({
  onReach,
  count,
  root,
  testId,
}: {
  onReach: () => void;
  count: number;
  /** The box that scrolls, when it is not the page. */
  root?: React.RefObject<HTMLElement | null>;
  testId: string;
}) {
  const line = useRef<HTMLDivElement>(null);
  const reach = useRef(onReach);
  useEffect(() => {
    reach.current = onReach;
  });

  useEffect(() => {
    const el = line.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const watcher = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) reach.current();
      },
      { root: root?.current ?? null, rootMargin: `${AHEAD}px 0px` },
    );
    watcher.observe(el);
    return () => watcher.disconnect();
  }, [count, root]);

  return <div ref={line} data-pw={testId} aria-hidden className="w-full shrink-0" style={{ height: 1 }} />;
}
