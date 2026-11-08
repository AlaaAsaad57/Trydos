"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Illustration from "public/images/notifications.png";
import { useAppStore } from "store";
import { C, CTA, UNDER_BAR, fill, lineBox } from "components/DemoApp1/demo1Layout";
import { Sheet, Txt, useCanvasEnd } from "components/DemoApp1/ui";

/** The highest a prompt starts (design y). A taller prompt scrolls from here. */
const TOP_LIMIT = 90;

/**
 * The bottom sheet of the notification prompt, in the new design. The XD file
 * has no board for it, so it uses the rules of the file's other sheets: the
 * dimmed page, a white sheet with 30 px top corners, and 60 px buttons 20 px
 * from both edges.
 *
 * `height` is how much of the screen the sheet takes (in px). A longer text, or
 * a short screen, scrolls inside the sheet. So the buttons can always be reached.
 */
export function NotificationPromptSheet({
  label,
  title,
  height,
  onClose,
  className = "",
  testId,
  children,
}: {
  label: string;
  title: string;
  height: number;
  onClose: () => void;
  className?: string;
  testId?: string;
  children: React.ReactNode;
}) {
  const language = useAppStore((s) => s.language);
  const end = useCanvasEnd(true);

  return (
    <Sheet open fit onClose={onClose} y={Math.max(TOP_LIMIT, end - height)}>
      <div
        role="dialog"
        aria-label={label}
        aria-live="polite"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        className="outline-none shrink-0"
      >
        {/* Arabic and Kurdish read right to left. The sheet can open on any
            page, so the card says its direction itself. */}
        <div
          dir={language === "ar" || language === "ku" ? "rtl" : "ltr"}
          data-pw={testId}
          className={`flex flex-col ${className}`}
          // The sheet runs on under Safari's bar, so its end needs this room
          // to scroll up into view.
          style={{ paddingBottom: 36 + UNDER_BAR }}
        >
          <Image
            src={Illustration.src}
            width={180}
            height={180}
            alt=""
            className="shrink-0 self-center"
            style={{ marginTop: 8 }}
          />
          <Txt center as="h2" size={16} weight="medium" mt={8}>
            {title}
          </Txt>
          {children}
        </div>
      </div>
    </Sheet>
  );
}

/** A centred 14 px paragraph under the title. It wraps, which `Txt` does not. */
export function PromptText({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="regular shrink-0 text-center"
      style={{
        marginTop: 6,
        marginInline: CTA.x,
        fontSize: 14,
        lineHeight: `${lineBox(14)}px`,
        color: C.label,
      }}
    >
      {children}
    </p>
  );
}

/** The sheet's button: purple for the main action, the card grey for the other. */
export function PromptButton({
  label,
  ariaLabel,
  onClick,
  primary = false,
  mt,
}: {
  label: string;
  ariaLabel: string;
  onClick: () => void;
  primary?: boolean;
  mt: number;
}) {
  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className="shrink-0 cursor-pointer"
      style={{
        marginTop: mt,
        marginInlineStart: CTA.x,
        width: fill(CTA.x),
        height: CTA.height,
        borderRadius: CTA.radius,
        background: primary ? C.purple : C.card,
      }}
    >
      <Txt center size={16} weight="medium" color={primary ? C.white : C.ink}>
        {label}
      </Txt>
    </motion.button>
  );
}
