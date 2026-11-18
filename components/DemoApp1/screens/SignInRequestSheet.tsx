"use client";

import React from "react";
import { motion } from "framer-motion";
import XdIcon from "../../DemoApp/XdIcon";
import { useDemoNav } from "../Demo1Shell";
import {
  C,
  SHEET,
  fill,
  gapTo,
  paraTop,
} from "../demo1Layout";
import { FileLines, Sheet, Stroke, Txt } from "../ui";
import { Rich } from "./ListingParts";

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
 *    line. The file leaves it empty: the slides are still to come;
 *  - the page dots at y 761: a 16 x 8 `#1D1D1D` pill, then two 8 px rings
 *    with a 1 px `#404040` line, 6 px apart (centred on the screen);
 *  - "Get Started", 390 x 60 at (20, 789), radius 20, `#FAFAFA` with a 0.5 px
 *    `#5D5C5D` dashed line (3 on, 3 off), the words 16 Regular `#3C3C3C`;
 *  - "Later, Take A Look At The App", 14 Regular `#4D84FF`, baseline 893.
 *
 * "Get Started" opens the new login design (/loginDemo). "Later", the dimmed
 * page and a drag down close the sheet.
 */

/** The file's sheet: its top, and the shadow on its top edge. */
const TOP = 285;
const SHADOW = "0 -3px 10px rgba(0, 0, 0, 0.1)";

/** The handle line's box ends here (it is 2 px tall, centred on y 297). */
const HANDLE_END = TOP + SHEET.handle.top + SHEET.handle.height / 2;

/** The marks of a key, taken away: the words as the file prints them. */
const plain = (text: string) => text.replace(/<\/?(b|m|a|c)>/g, "");

export default function SignInRequestSheet({
  open,
  onClose,
  onStart,
}: {
  open: boolean;
  onClose: () => void;
  onStart: () => void;
}) {
  const { t } = useDemoNav();
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
                <span style={{ color: C.blue }}>More Info</span>
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
        <Rich text={words} />
      </FileLines>

      {/* The slides' card. Empty in the file. */}
      <div
        data-pw="demo-sign-in-request-card"
        className="relative shrink-0"
        style={{
          marginTop: 565 - (paraTop(521, 14, 20) + 40),
          marginLeft: 20,
          width: fill(20),
          height: 186,
          borderRadius: 20,
          background: C.white,
        }}
      >
        <Stroke color={C.purple} radius={20} />
      </div>

      {/* The page dots: the pill on the first slide, 6 px between each. */}
      <div
        data-pw="demo-sign-in-request-dots"
        aria-hidden="true"
        className="flex self-center shrink-0"
        style={{ marginTop: 761 - (565 + 186), gap: 215 - (193 + 16) }}
      >
        <span
          className="block"
          style={{ width: 16, height: 8, borderRadius: 4, background: C.ink }}
        />
        {[0, 1].map((i) => (
          <span
            key={i}
            className="block"
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              boxSizing: "border-box",
              border: `1px solid ${C.inkSoft}`,
            }}
          />
        ))}
      </div>

      <motion.button
        type="button"
        data-pw="demo-sign-in-request-start"
        whileTap={{ scale: 0.98 }}
        onClick={onStart}
        className="relative flex items-center justify-center shrink-0 cursor-pointer"
        style={{
          marginTop: 789 - (761 + 8),
          marginLeft: 20,
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
    </Sheet>
  );
}
