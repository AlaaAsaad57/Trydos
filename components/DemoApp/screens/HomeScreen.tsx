"use client";

import type { DemoKey } from "../demoKeys";
import React, { useState } from "react";
import { motion } from "framer-motion";
import XdIcon from "../XdIcon";
import { useDemoNav } from "../DemoShell";
import { C, headerTop } from "../demoLayout";
import { TRAVEL } from "components/NavigationDemo/BottomNav";

/**
 * Home — XD `Home Page`.
 *
 * A white 50 px header (shadow 0 0 3, black at 10%) over a `#FCFCFC` page.
 * On the left the categories mark (21 x 21 at 15.5, 64.5), then the category
 * chips: 32 tall at y 59, 12 px of padding, 13 px text. The picked chip is
 * `#F8F7FF` with a 0.3 `#707070` line and Medium text; the rest are bare
 * Regular text. The page under it is empty in the file.
 *
 * The chips are a row that scrolls sideways, starting at x 60. Each chip is a
 * slot as wide as the file's step to the next chip (the words start at x 72,
 * 128, 204, 283 and 348), so in English every word lands on the file's x in
 * any browser, whatever width the browser gives the word. The picked pill
 * hugs its word (12 px each side). A longer word in another language makes
 * its slot wider, keeps 4 px before the next pill, and the row scrolls.
 */
const CATEGORIES = ["Man", "Women", "Children", "Home", "Electronic"] as const;

/** Slot widths: the file's distance from one chip's left edge to the next. */
const SLOTS = [56, 76, 79, 65, undefined] as const;

export default function HomeScreen() {
  const { t, navigate } = useDemoNav();
  const [picked, setPicked] = useState<(typeof CATEGORIES)[number]>(
    CATEGORIES[0],
  );

  return (
    <div
      data-pw="demo-home"
      className="absolute inset-0 font-quicksand"
      style={{ background: C.page }}
    >
      <header
        className="absolute left-0 w-full"
        style={{
          top: headerTop(50),
          height: 50,
          background: C.white,
          boxShadow: "0 0 3px rgba(0,0,0,0.1)",
        }}
      >
        <button
          type="button"
          aria-label={t("Search")}
          data-pw="demo-home-search"
          onClick={() => navigate("search")}
          className="absolute cursor-pointer active:opacity-60"
          style={{ left: 15.5 - 8, top: 14.5 - 8, width: 37, height: 37 }}
        >
          <XdIcon
            name="homeLogo"
            style={{ position: "absolute", left: 8, top: 8 }}
          />
        </button>

        <div
          className="absolute flex items-center overflow-x-auto"
          // The row scrolls sideways, and a scroll box clips at its edges. It
          // starts 2 px early and 2 px higher, with the same padding inside, so
          // the picked chip's 0.3 line sits inside the box instead of on its
          // edge, where it was cut off.
          style={{
            left: 58,
            right: 0,
            top: 7,
            height: 36,
            padding: "2px 11px 2px 2px",
            scrollbarWidth: "none",
          }}
        >
          {CATEGORIES.map((name, i) => {
            const on = name === picked;
            return (
              <button
                key={name}
                type="button"
                data-pw={`demo-category-${name}`}
                aria-pressed={on}
                onClick={() => setPicked(name)}
                className={`relative shrink-0 cursor-pointer whitespace-nowrap text-left ${on ? "font-medium" : "font-normal"}`}
                style={{
                  height: 32,
                  minWidth: SLOTS[i],
                  paddingRight: 4,
                  fontSize: 13,
                  color: C.ink,
                  lineHeight: "32px",
                }}
              >
                <span
                  className="relative inline-block"
                  style={{ height: 32, padding: "0 12px" }}
                >
                  {on && (
                    <motion.span
                      layoutId="demo-home-chip"
                      transition={TRAVEL}
                      className="absolute inset-0"
                      style={{
                        borderRadius: 12,
                        background: "#F8F7FF",
                        boxShadow: "inset 0 0 0 0.3px #707070",
                      }}
                    />
                  )}
                  <span className="relative">{t(name)}</span>
                </span>
              </button>
            );
          })}
        </div>
      </header>
    </div>
  );
}
