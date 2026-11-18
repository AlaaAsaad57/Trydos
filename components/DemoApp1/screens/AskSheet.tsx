"use client";

import React from "react";
import { motion } from "framer-motion";
import { C, SHEET, lineBox, textTop } from "../demo1Layout";
import { Sheet, useCanvasEnd } from "../ui";

/**
 * A question in the new design's style (Stage 7d, S7d-11): the old prompts
 * (the price change, the cart lock, Notify Me) redrawn with the design's own
 * parts. The file has no board for them, so the sheet is built from the
 * boards it has:
 *
 *  - the bottom sheet with its handle (`Sheet`, the wallet sheet's corners);
 *  - the title and the line under it, centred, in the ink and grey of the
 *    sheets' titles;
 *  - the main answer: the sheets' dark "Done" button (188 x 45, top corners
 *    22.5, bottom corners 14, `Home Page – 72`);
 *  - the other answer: a word under it, as the policies sheet's "Cancel".
 *
 * It lies over every other layer of the page (the buy bar, the checkout's
 * sheets), because it answers something one of them did.
 */

/** Over the buy bar (40) and the checkout's sheets (50). */
export const ASK_Z = 60;

/** The sheet's height in design px: the handle, the words and the two answers. */
const ASK_H = 300;

/** The main answer: the sheets' "Done" (`Home Page – 72`). */
const MAIN = { width: 188, height: 45 } as const;

const LINE_13 = { fontSize: 13, lineHeight: `${lineBox(13)}px` } as const;

export type AskAnswer = {
  label: string;
  onPress: () => void;
  /** Its request is on its way: the answer waits, and says so with its look. */
  busy?: boolean;
  /** Not ready yet (grey, no tap), but the sheet can still close. */
  disabled?: boolean;
  /** The other answer in red (it takes something away). */
  danger?: boolean;
  testId: string;
};

/**
 * The main answer: the sheets' dark "Done" (`Home Page – 72`). Grey and with
 * no tap while it is busy or not ready. `waiting` stops the tap while another
 * answer of the same question is busy.
 */
export function MainAnswer({ answer, waiting = false, mt }: { answer: AskAnswer; waiting?: boolean; mt: number }) {
  const off = waiting || answer.busy || answer.disabled;
  return (
    <motion.button
      type="button"
      data-pw={answer.testId}
      disabled={off}
      aria-busy={answer.busy || undefined}
      onClick={answer.onPress}
      whileTap={off ? undefined : { scale: 0.98 }}
      className="flex justify-center shrink-0 self-center font-normal whitespace-nowrap [-webkit-tap-highlight-color:transparent]"
      style={{
        marginTop: mt,
        minWidth: MAIN.width,
        height: MAIN.height,
        paddingTop: textTop(28, 13),
        paddingInline: 20,
        borderRadius: `${MAIN.height / 2}px ${MAIN.height / 2}px 14px 14px`,
        background: answer.busy || answer.disabled ? C.hint : C.ink,
        color: C.white,
        cursor: off ? "default" : "pointer",
        transition: "background-color 0.2s",
        ...LINE_13,
      }}
    >
      {answer.label}
    </motion.button>
  );
}

export default function AskSheet({
  open,
  title,
  text,
  note,
  main,
  other,
  onClose,
  testId,
  z = ASK_Z,
}: {
  /** The layer's z: higher for a question that can open over the old pages' own sheets. */
  z?: number;
  open: boolean;
  title: string;
  text: string;
  /** A third line, in blue (the cart lock's "already paid"). */
  note?: string | null;
  main: AskAnswer;
  other?: AskAnswer;
  onClose: () => void;
  testId: string;
}) {
  const end = useCanvasEnd(open);
  const waiting = Boolean(main.busy || other?.busy);
  // Escape is the same as a tap on the dimmed page (the old prompts kept it).
  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !waiting) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, waiting, onClose]);
  return (
    <Sheet
      open={open}
      onClose={() => !waiting && onClose()}
      y={end - ASK_H}
      fit
      radius={SHEET.radiusWallet}
      z={z}
      testId={testId}
    >
      <div role="dialog" aria-modal="true" aria-label={title} className="flex flex-col items-center w-full shrink-0" style={{ paddingInline: 30 }}>
        <h2
          data-pw={`${testId}-title`}
          className="m-0 text-center font-bold"
          style={{ marginTop: textTop(70, 18) - 20, fontSize: 18, lineHeight: `${lineBox(18)}px`, color: C.ink }}
        >
          {title}
        </h2>
        <p
          data-pw={`${testId}-message`}
          className="m-0 text-center font-normal"
          style={{ marginTop: 10, color: C.grey, ...LINE_13 }}
        >
          {text}
        </p>
        {note && (
          <p data-pw={`${testId}-note`} className="m-0 text-center font-normal" style={{ marginTop: 8, color: C.blue, ...LINE_13 }}>
            {note}
          </p>
        )}
        <MainAnswer answer={main} waiting={waiting} mt={28} />
        {other && (
          <button
            type="button"
            data-pw={other.testId}
            disabled={waiting}
            onClick={other.onPress}
            className="shrink-0 font-normal whitespace-nowrap bg-transparent [-webkit-tap-highlight-color:transparent] enabled:cursor-pointer enabled:active:opacity-60"
            style={{
              marginTop: 18,
              padding: "6px 20px",
              color: other.danger ? C.red : C.grey,
              opacity: other.busy ? 0.5 : 1,
              transition: "opacity 0.2s",
              ...LINE_13,
            }}
          >
            {other.label}
          </button>
        )}
      </div>
    </Sheet>
  );
}
