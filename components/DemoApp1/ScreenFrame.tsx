"use client";

import React, { useLayoutEffect, useRef } from "react";
import {
  motion,
  useIsPresent,
  usePresenceData,
  type Variants,
} from "framer-motion";
import {
  EDGE_ANCHOR,
  SCREEN_TRANSITION,
  STORE_GROW,
  STORE_SHRINK,
  columnBox,
  sliderMove,
} from "./demo1Layout";

/*
  One screen on stage, and the way it slides in and out. Shared by the two
  shells that draw new screens: the /demo preview (Demo1Shell) and the real
  app's screen mount (AppScreens). The real app uses only the plain slide and
  the fade; the grow, shrink and swipe moves are the preview's.
*/

/**
 * The card a store's page grows from: its box in px, from the page column's
 * left edge and the window's top, when it was tapped. `vh` is the window's
 * height then. Back to the same screen, the page shrinks into the same box:
 * that screen opens at the same scroll, so the card is in the same place.
 */
export type Origin = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  vh: number;
};

/**
 * What a change of screen needs: the way it goes and the scroll the old
 * screen had. `grow` and `shrink` are set for a store's page that grows out
 * of a card or shrinks back into it; `swipe` for a move that goes as one
 * Home slide (slidesLikeHome); `fade` replaces all three when the system
 * asks for less motion.
 */
export type Leave = {
  dir: 1 | -1;
  scrollY: number;
  grow?: Origin;
  shrink?: Origin;
  swipe?: boolean;
  fade?: boolean;
};

/**
 * A slide, as framer-motion gets it: the way the walk goes (`dir`, 1 = deeper)
 * and the side "deeper" comes in from (`side`, 1 = the right). On a
 * right-to-left page the side is mirrored: a deeper screen comes in from the
 * left, and going back slides it out to the left.
 */
export type Slide = Leave & { side: 1 | -1 };

/** The clip of a page cut to a card's box. `bottom` is the room under the box. */
const cutTo = (o: Origin, bottom: string) =>
  `inset(${o.top}px ${o.right}px ${bottom} ${o.left}px)`;

const slide: Variants = {
  enter: ({ dir, side, grow, shrink, swipe, fade }: Slide) => {
    if (fade) return { x: 0, opacity: 0 };
    if (swipe) return { x: `${dir * side * 100}%`, opacity: 1 };
    // The page in the document is as tall as all of it, so the room under
    // the card is counted from the page's end: 100% less the card's bottom.
    if (grow)
      return { x: 0, opacity: 0, clipPath: cutTo(grow, `calc(100% - ${grow.bottom}px)`) };
    // Back from a store: the screen under it is already in place.
    if (shrink) return { x: 0, opacity: 1 };
    return { x: `${dir * side * 100}%`, opacity: 0 };
  },
  center: ({ dir, side, grow, swipe }: Slide) =>
    swipe
      ? sliderMove((dir * side) as 1 | -1, false)
      : grow
      ? {
          x: 0,
          opacity: 1,
          // Open to the window's box (the same shape of value as the cut, so
          // it animates), then take the clip away.
          clipPath: `inset(0px 0px calc(100% - ${grow.vh}px) 0px)`,
          transitionEnd: { clipPath: "none" },
          transition: {
            clipPath: STORE_GROW,
            opacity: { duration: STORE_GROW.duration * 0.4, ease: "linear" },
          },
        }
      : { x: 0, opacity: 1 },
  exit: ({ dir, side, grow, shrink, swipe, fade }: Slide) => {
    if (fade) return { x: 0, opacity: 0 };
    if (swipe) return sliderMove((dir * side) as 1 | -1, true);
    // The screen under a growing page: it stays, and goes once it is covered.
    if (grow)
      return {
        x: 0,
        opacity: 0,
        transition: { duration: 0.15, delay: STORE_GROW.duration - 0.15 },
      };
    // The store's page leaving: it is a box the window's size now, so the
    // room under the card is the window's height less the card's bottom.
    if (shrink)
      return {
        x: 0,
        clipPath: [
          "inset(0px 0px 0px 0px)",
          cutTo(shrink, `${Math.max(0, shrink.vh - shrink.bottom)}px`),
        ],
        opacity: [1, 1, 0],
        transition: {
          clipPath: STORE_SHRINK,
          opacity: { duration: STORE_SHRINK.duration, times: [0, 0.6, 1] },
        },
      };
    return { x: `${-dir * side * 100}%`, opacity: 0 };
  },
};


/**
 * One screen on stage. In the document while it is on show; while it slides
 * out it is a layer the size of the window, fixed to it, that keeps the scroll
 * it had, so its sticky header stays where it was too.
 *
 * The fixed box is an anchor with no size and the screen hangs on it. A fixed
 * box the size of the screen is what Safari 26 reads at the bottom edge: it
 * painted the room under its bar in the leaving screen's colour, and kept it
 * after the slide (see EDGE_ANCHOR in demo1Layout.ts).
 */
export function ScreenFrame({
  id,
  move,
  children,
}: {
  id: string;
  move: Slide;
  children: React.ReactNode;
}) {
  const present = useIsPresent();
  // The scroll it had when it was left; given to the frame by AnimatePresence.
  const leaving = usePresenceData() as Slide | undefined;
  const frame = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!present && frame.current)
      frame.current.scrollTop = leaving?.scrollY ?? 0;
  }, [present, leaving]);

  // A store's page lies over the screen under it, both while it grows in and
  // while it shrinks out.
  const onTop = present ? !!move.grow : !!leaving?.shrink;

  return (
    <div
      style={{
        ...(present ? { position: "relative", width: "100%" } : EDGE_ANCHOR),
        zIndex: onTop ? 1 : undefined,
      }}
    >
      <motion.div
        ref={frame}
        data-demo-screen={id}
        custom={move}
        variants={slide}
        initial="enter"
        animate="center"
        exit="exit"
        transition={SCREEN_TRANSITION}
        style={
          present
            ? { position: "relative", width: "100%" }
            : {
                ...columnBox("100dvh"),
                overflow: "hidden",
                pointerEvents: "none",
              }
        }
      >
        {children}
      </motion.div>
    </div>
  );
}
