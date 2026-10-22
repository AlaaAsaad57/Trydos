"use client";

import { motion } from "framer-motion";
import React from "react";
import { C, ROW, fill, textTop } from "../demo1Layout";
import { Sheet, Txt, Under } from "../ui";

/**
 * A short sheet of choices: the demo's bottom sheet (`Sheet`) with a title
 * 16 Medium centred and 60 px rows on the `#FCFCFC` card, 12 px from both
 * edges, 2 px apart — the "Forward to" and "New chat" sheets' manner. Each
 * row has a 44 x 44 box at its left (an icon, a colour, a picture) and its
 * words after it. Used by the Category, Remind me and Archived sheets.
 */
export default function PickSheet({
  open,
  title,
  y = 440,
  testId,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  /** The design y the sheet's top rests at. */
  y?: number;
  testId: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Sheet open={open} onClose={onClose} y={y} testId={testId}>
      <Txt center size={16} weight="medium" mt={textTop(30, 16) - 8}>
        {title}
      </Txt>
      <Under testId={`${testId}-list`}>{children}</Under>
    </Sheet>
  );
}

/** One row of a PickSheet. */
export function PickRow({
  testId,
  first = false,
  onClick,
  children,
}: {
  testId: string;
  first?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      data-pw={testId}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className="flex items-center shrink-0 cursor-pointer text-left"
      style={{
        marginTop: first ? 16 : 2,
        marginLeft: ROW.x,
        width: fill(ROW.x),
        height: 60,
        borderRadius: ROW.radius,
        background: C.card,
      }}
    >
      {children}
    </motion.button>
  );
}

/** The 44 x 44 box at a row's left, 8 px in. */
export function PickBox({
  background = C.field,
  children,
}: {
  background?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className="relative flex items-center justify-center shrink-0 overflow-hidden"
      style={{ marginLeft: 8, width: 44, height: 44, borderRadius: 15, background }}
    >
      {children}
    </span>
  );
}
