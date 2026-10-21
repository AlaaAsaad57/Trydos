"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { CHAT } from "../../DemoApp/demoChat";
import { C, EDGE_ANCHOR, SAFE_BOTTOM, SF_ROUNDED } from "../demo1Layout";

/** How long a toast stays, in ms. */
export const TOAST_MS = 1800;

/**
 * A short word of confirmation ("Copied", "Archived"), in the dark pill of
 * the menu's tooltip (`– 44`: `#404040`, radius 8, SF Pro Rounded, white).
 * It rises from below, stays TOAST_MS, and sinks away.
 *
 * `fixed` hangs it from the bottom of the window on a 0 x 0 anchor (see
 * EDGE_ANCHOR), for a page the document scrolls; otherwise it sits at
 * `bottom` inside a positioned parent (the conversation's page).
 */
export default function Toast({
  text,
  bottom,
  fixed = false,
}: {
  text: string | null;
  /** Its distance from the bottom of its parent (or of the window, when `fixed`). */
  bottom: number | string;
  fixed?: boolean;
}) {
  const pill = (
    <AnimatePresence>
      {text && (
        <motion.span
          key={text}
          data-pw="demo-toast"
          role="status"
          className="block whitespace-nowrap"
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.18 } }}
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          style={{
            position: "absolute",
            left: "50%",
            x: "-50%",
            bottom: fixed ? 0 : bottom,
            padding: "6px 14px",
            borderRadius: 8,
            background: CHAT.tooltip,
            boxShadow: "0 3px 3px rgba(0,0,0,0.2)",
            fontFamily: SF_ROUNDED,
            fontSize: 12,
            lineHeight: "15px",
            letterSpacing: "0.01em",
            color: C.white,
            zIndex: 25,
          }}
        >
          {text}
        </motion.span>
      )}
    </AnimatePresence>
  );
  if (!fixed) return pill;
  return (
    <div
      aria-hidden={text ? undefined : true}
      style={{
        ...EDGE_ANCHOR,
        top: undefined,
        bottom: `calc(${typeof bottom === "number" ? `${bottom}px` : bottom} + ${SAFE_BOTTOM})`,
        zIndex: 40,
      }}
    >
      {pill}
    </div>
  );
}

/** A toast's text and the hand that shows one: it goes away by itself. */
export function useToast(): [string | null, (text: string) => void] {
  const [text, setText] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const show = (next: string) => {
    if (timer.current) clearTimeout(timer.current);
    setText(next);
    timer.current = setTimeout(() => setText(null), TOAST_MS);
  };
  return [text, show];
}
