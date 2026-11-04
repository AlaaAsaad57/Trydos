"use client";

import React, { useState } from "react";
import XdIcon from "../../DemoApp/XdIcon";
import type { XdIconName } from "../../DemoApp/xdIcons";

/**
 * A heart that a tap likes, with the "pop" most apps use (Instagram, X):
 *
 *  1. The filled heart grows out of the middle of the outline heart: 0 → 125 %
 *     → 90 % → 100 % in 450 ms. So it seems to jump and land.
 *  2. At the same time a thin ring grows from the heart and fades out
 *     (400 ms), and six small dots fly out of it and fade (500 ms).
 *  3. A second tap takes the like back: the filled heart shrinks into the
 *     outline in 150 ms, with no ring and no dots.
 *
 * The XD file has no liked heart, so the filled heart is the outline heart's
 * outer line, filled in the like red of social apps (LIKE_RED, Instagram's
 * #FF3040). The ring and the dots are the same red. The dark outline heart
 * stays in place, so the heart's size never changes. It fades out once the
 * red heart has grown over it (OUTLINE_FADE), so no dark edge shows around
 * the red one. On a second tap it comes back at once.
 *
 * CSS keyframes, not JavaScript: the animation starts in the same frame as
 * the tap, and the server HTML (outline only) is the same as the first
 * render in the browser. React puts the <style> in the head once, however
 * many hearts the page has (`href` + `precedence`).
 */

/** The red of a liked heart, its ring and its dots (Instagram's like red). */
export const LIKE_RED = "#FF3040";

/**
 * The outline fades in 0.1 s, 0.2 s after the tap. By then the pop has grown
 * the red heart past full size (45 % of 0.45 s), so it covers the outline.
 */
const OUTLINE_FADE = "opacity 0.1s linear 0.2s";

/** The six dots of the burst: one every 60°, the first one straight up. */
const DOTS = [0, 60, 120, 180, 240, 300];

const KEYFRAMES = `
@keyframes demo-like-pop {
  0% { transform: scale(0); }
  45% { transform: scale(1.25); }
  75% { transform: scale(0.9); }
  100% { transform: scale(1); }
}
@keyframes demo-like-ring {
  from { transform: scale(0.3); opacity: 0.6; }
  to { transform: scale(1.9); opacity: 0; }
}
@keyframes demo-like-dot {
  from { transform: translate(0, 0) scale(1); opacity: 1; }
  to { transform: translate(var(--dot-x), var(--dot-y)) scale(0.4); opacity: 0; }
}`;

/** The ring and the dots, drawn once for each like (a new `key` starts them again). */
function Burst({ size }: { size: number }) {
  const dot = Math.max(2, Math.round(size / 6));
  const far = size * 0.95;
  return (
    <span aria-hidden="true" data-pw="demo-like-burst" className="absolute inset-0 pointer-events-none">
      <span
        className="absolute inset-0 rounded-full"
        // The rest opacity is inline, not the class: this repo's Tailwind
        // classes are !important, and an !important opacity stops the animation's.
        style={{ border: `1px solid ${LIKE_RED}`, opacity: 0, animation: "demo-like-ring 0.4s ease-out" }}
      />
      {DOTS.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <span
            key={deg}
            className="absolute rounded-full"
            style={
              {
                left: (size - dot) / 2,
                top: (size - dot) / 2,
                width: dot,
                height: dot,
                background: LIKE_RED,
                opacity: 0,
                "--dot-x": `${(Math.sin(rad) * far).toFixed(2)}px`,
                "--dot-y": `${(-Math.cos(rad) * far).toFixed(2)}px`,
                animation: "demo-like-dot 0.5s ease-out",
              } as React.CSSProperties
            }
          />
        );
      })}
    </span>
  );
}

export function LikeHeart({
  liked,
  burst,
  outline,
  filled,
  size,
}: {
  liked: boolean;
  /** Goes up by one on each like; each new value plays the burst once. 0: no burst yet. */
  burst: number;
  outline: XdIconName;
  filled: XdIconName;
  /** The heart's width and height in design px. */
  size: number;
}) {
  return (
    <span className="relative block shrink-0" style={{ width: size, height: size }}>
      <style href="demo-like-heart" precedence="default">
        {KEYFRAMES}
      </style>
      <span
        data-pw="demo-like-outline"
        className="block"
        style={liked ? { opacity: 0, transition: OUTLINE_FADE } : { opacity: 1 }}
      >
        <XdIcon name={outline} />
      </span>
      <span
        data-pw="demo-like-filled"
        data-on={liked}
        className="absolute inset-0"
        style={
          liked
            ? { transform: "scale(1)", animation: "demo-like-pop 0.45s ease-out" }
            : { transform: "scale(0)", transition: "transform 0.15s ease-in" }
        }
      >
        <XdIcon name={filled} />
      </span>
      {liked && burst > 0 && <Burst key={burst} size={size} />}
    </span>
  );
}

/** The like state of one heart: `toggle` likes or takes the like back. */
export function useLike() {
  const [liked, setLiked] = useState(false);
  const [burst, setBurst] = useState(0);
  const toggle = () => {
    if (!liked) setBurst((n) => n + 1);
    setLiked(!liked);
  };
  return { liked, burst, toggle };
}
