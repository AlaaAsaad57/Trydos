"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import XdIcon from "../../DemoApp/XdIcon";
import { useDemoNav } from "../screenNav";
import {
  C,
  SHEET,
  fill,
  gapTo,
  isFloatingBarSafari,
  paraTop,
  textBottom,
} from "../demo1Layout";
import { FileLines, Sheet, Stroke, Txt } from "../ui";
import { Rich } from "./ListingParts";
import SignInSlides from "./SignInSlides";

/**
 * The sheet that asks the shopper to sign in: XD `Sign In request`. The shell
 * opens it 4 seconds after the app opens from the country picker.
 *
 * The page dims to `#1D1D1D` at 90% and a white sheet comes up from y 285,
 * with radius 50 on its top corners and a shadow of 0 -3 10 `#000` at 10%.
 * From the top (design y):
 *  - the handle, 40 x 2 `#C4C2C2` at y 297 (every sheet's);
 *  - the logo, all dark, 150 x 150 at (140, 327);
 *  - two centred lines of 14 (baselines 521 and 541): "Please Get Started"
 *    Medium, "More Info" `#388CFF`;
 *  - a white card, 390 x 186 at (20, 565), radius 20, a 0.5 px `#4A31E7`
 *    line, and the page dots at y 761. The file leaves the card empty; it
 *    holds the quick preview's slides, as its slider (SignInSlides);
 *  - "Get Started", 390 x 60 at (20, 789), radius 20, `#FAFAFA` with a 0.5 px
 *    `#5D5C5D` dashed line (3 on, 3 off), the words 16 Regular `#3C3C3C`;
 *  - "Later, Take A Look At The App", 14 Regular `#4D84FF`, baseline 893,
 *    and the white under it (END_GAP; none in iPhone Safari 26).
 *
 * "Get Started" opens the new login design (/loginDemo). "Later", the dimmed
 * page and a drag down close the sheet. "More Info" calls `onMoreInfo` when the
 * host gives one (the real app says "Soon available"); /demo gives none.
 */

/** The file's sheet: its top, and the shadow on its top edge. */
const TOP = 285;
const SHADOW = "0 -3px 10px rgba(0, 0, 0, 0.1)";

/** The least white under "Later" on a short window, in px. */
const BOTTOM_MIN = 16;

/**
 * The file's white under "Later": 35 px from the line's box to the SCREEN's
 * end, where the file has the home bar. In iPhone Safari 26 the window ends
 * above Safari's floating bar, and the bar and the room under it already take
 * about 98 px. The 35 px then stood on top of that (seen on the client's
 * iPhone): about 130 px of white lay under "Later", and the sheet, which rests
 * on the window's end, sat that much higher than the file. So there the white
 * goes, and "Later" rests on the window's end, as the address and delivery
 * sheets' buttons do (CartAddressSheet END_GAP). Everywhere else the window
 * ends at the screen's end, and the file's 35 px stay.
 */
const END_GAP = 932 - textBottom(893, 14);

/** The handle line's box ends here (it is 2 px tall, centred on y 297). */
const HANDLE_END = TOP + SHEET.handle.top + SHEET.handle.height / 2;

/** The marks of a key, taken away: the words as the file prints them. */
const plain = (text: string) => text.replace(/<\/?(b|m|a|c)>/g, "");

export default function SignInRequestSheet({
  open,
  onClose,
  onStart,
  onMoreInfo,
}: {
  open: boolean;
  onClose: () => void;
  onStart: () => void;
  /** A tap on "More Info"; without it the words are only drawn blue. */
  onMoreInfo?: () => void;
}) {
  const { t } = useDemoNav();
  // Read once, in the browser: the sheet shows only after a tap, never in the
  // server's HTML, so the server's answer here never reaches the page.
  const [gap] = useState(() =>
    typeof navigator !== "undefined" && isFloatingBarSafari(navigator.userAgent)
      ? 0
      : END_GAP,
  );
  const words = t(
    "To Access All Features, <m>Please Get Started</m>, Where You’ll Find Great Features And The Full Version. <a>More Info</a>",
  );
  return (
    <Sheet
      open={open}
      onClose={onClose}
      y={TOP}
      keepHeight
      radius={SHEET.radiusWallet}
      shadow={SHADOW}
      testId="demo-sign-in-request"
    >
      <XdIcon
        name="signInLogo"
        className="self-center shrink-0"
        style={{ marginTop: 327 - HANDLE_END }}
      />

      <FileLines
        testId="demo-sign-in-request-text"
        text={plain(words)}
        lines={[
          {
            x: 20.45,
            text: "To Access All Features, Please Get Started, Where You’ll Find ",
            node: (
              <>
                To Access All Features,{" "}
                <span className="font-medium">Please Get Started</span>, Where
                You’ll Find
              </>
            ),
          },
          {
            x: 65.54,
            text: "Great Features And The Full Version. More Info",
            node: (
              <>
                Great Features And The Full Version.{" "}
                <span
                  role={onMoreInfo ? "button" : undefined}
                  tabIndex={onMoreInfo ? 0 : undefined}
                  onClick={onMoreInfo}
                  onKeyDown={
                    onMoreInfo
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onMoreInfo();
                          }
                        }
                      : undefined
                  }
                  style={{ color: C.blue, cursor: onMoreInfo ? "pointer" : undefined }}
                >
                  More Info
                </span>
              </>
            ),
          },
        ]}
        // The file's box is 390 wide from x 20, and its first line 389 wide.
        // The browser draws that line about 1 px wider, so the box gets 2 px
        // more on each side; the lines are centred, so nothing moves.
        left={18}
        ml={18}
        width={fill(18)}
        size={14}
        lineHeight={20}
        mt={paraTop(521, 14, 20) - (327 + 150)}
      >
        <Rich text={words} keepLinks onLink={onMoreInfo} />
      </FileLines>

      {/* The card and its dots: the quick preview's slider (SignInSlides). */}
      <SignInSlides mt={565 - (paraTop(521, 14, 20) + 40)} />

      <motion.button
        type="button"
        data-pw="demo-sign-in-request-start"
        whileTap={{ scale: 0.98 }}
        onClick={onStart}
        className="relative flex items-center justify-center shrink-0 cursor-pointer"
        style={{
          marginTop: 789 - (761 + 8),
          // Logical, as the card above: equal sides on an RTL page too.
          marginInlineStart: 20,
          width: fill(20),
          height: 60,
          borderRadius: 20,
          background: "#FAFAFA",
        }}
      >
        <Txt size={16} color="#3C3C3C">
          {t("Get Started")}
        </Txt>
        <Stroke color={C.lineDark} radius={20} dash="3 3" />
      </motion.button>

      <button
        type="button"
        data-pw="demo-sign-in-request-later"
        onClick={onClose}
        className="self-center shrink-0 cursor-pointer"
        // The file centres the line on x 216, 1 px right of the screen's centre.
        style={{ marginTop: gapTo(789 + 60, 893, 14), marginLeft: 2 }}
      >
        <Txt size={14} color="#4D84FF">
          {t("Later, take a look at the app")}
        </Txt>
      </button>

      {/* The white under "Later", to the artboard's end (END_GAP; none in
          iPhone Safari 26). On a short window it shrinks with the card, and
          keeps BOTTOM_MIN. */}
      <div
        aria-hidden="true"
        data-pw="demo-sign-in-request-end"
        style={{
          flexGrow: 0,
          flexShrink: 1,
          flexBasis: gap,
          minHeight: gap > 0 ? BOTTOM_MIN : 0,
        }}
      />
    </Sheet>
  );
}
