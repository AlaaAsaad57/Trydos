"use client";

import type { DemoKey } from "../demoKeys";
import React, { useState } from "react";
import { motion } from "framer-motion";
import XdIcon from "../XdIcon";
import { useDemoNav } from "../DemoShell";
import { C, headerTop } from "../demoLayout";
import { TRAVEL } from "components/NavigationDemo/BottomNav";

/**
 * Search — XD `Home Page – 1`. The file only has this first state; there is no
 * results design yet, so the field takes text and nothing is searched.
 *
 * Header 50 .. 144, white, shadow 0 0 3 (black at 10%):
 *   - the field: 406 x 38 at (12, 56), radius 12, `#F8F8F8`; the glass
 *     (19 x 19 at 21.5, 65.5), the text from x 52 at 14 px `#8D8D8D` for the
 *     placeholder, voice (349.5) and scan (387.5) on the right;
 *   - the chips at y 103, 32 tall, radius 12: the picked one is `#F8F8F8` and
 *     Medium, the rest have a 0.3 `#D3D3D3` line and Regular text, all `#404040`.
 *     12 px after "For you", 4 px between the others. The row scrolls sideways
 *     — the file runs it off the right edge.
 */
const CHIPS = ["For you", "Empty", "Empty", "Empty", "Empty", "Empty"] as const;

export default function SearchScreen() {
  const { t } = useDemoNav();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState(0);

  return (
    <div
      data-pw="demo-search"
      className="absolute inset-0 font-quicksand"
      style={{ background: C.page }}
    >
      <header
        className="absolute left-0 w-full"
        style={{
          top: headerTop(50),
          height: 94,
          background: C.white,
          boxShadow: "0 0 3px rgba(0,0,0,0.1)",
        }}
      >
        <div
          className="absolute"
          style={{
            left: 12,
            top: 6,
            width: 406,
            height: 38,
            borderRadius: 12,
            background: C.field,
          }}
        >
          <XdIcon
            name="searchGlass"
            style={{ position: "absolute", left: 9.5, top: 9.5 }}
          />
          <input
            data-pw="demo-search-input"
            type="search"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Search anything…")}
            aria-label={t("Search anything…")}
            className="absolute bg-transparent outline-none font-normal placeholder:text-[#8D8D8D]"
            // Text left 52 on the artboard; baseline 80 → box top 66 at 14 px.
            style={{
              left: 40,
              top: 7,
              width: 280,
              height: 24,
              fontSize: 14,
              color: C.ink,
              padding: 0,
              border: 0,
            }}
          />
          <button
            type="button"
            aria-label={t("Voice search")}
            className="absolute cursor-pointer active:opacity-60"
            style={{ left: 337.5, top: 9.5 }}
          >
            <XdIcon name="searchVoice" />
          </button>
          <button
            type="button"
            aria-label={t("Scan")}
            className="absolute cursor-pointer active:opacity-60"
            style={{ left: 375.5, top: 9.5 }}
          >
            <XdIcon name="searchScan" />
          </button>
        </div>

        <div
          className="absolute flex items-center overflow-x-auto"
          style={{
            left: 0,
            right: 0,
            // 2 px of room above and below, so the chips' 0.3 lines are not
            // cut by the scroll box's edge.
            top: 51,
            height: 36,
            padding: "2px 12px",
            scrollbarWidth: "none",
          }}
        >
          {CHIPS.map((name, i) => {
            const on = i === picked;
            return (
              <button
                key={i}
                type="button"
                data-pw={`demo-search-chip-${i}`}
                aria-pressed={on}
                onClick={() => setPicked(i)}
                // The file starts each word 12 px in, it does not centre it.
                className={`relative shrink-0 cursor-pointer whitespace-nowrap text-left ${on ? "font-medium" : "font-normal"}`}
                style={{
                  height: 32,
                  padding: "0 12px",
                  // The file draws the other chips 63 wide round a 38 px word.
                  minWidth: i === 0 ? undefined : 63,
                  marginLeft: i === 0 ? 0 : i === 1 ? 12 : 4,
                  fontSize: 13,
                  color: C.inkSoft,
                  lineHeight: "32px",
                  borderRadius: 12,
                  boxShadow: on ? undefined : "inset 0 0 0 0.3px #D3D3D3",
                }}
              >
                {on && (
                  <motion.span
                    layoutId="demo-search-chip"
                    transition={TRAVEL}
                    className="absolute inset-0"
                    style={{ borderRadius: 12, background: C.field }}
                  />
                )}
                <span className="relative">{t(name)}</span>
              </button>
            );
          })}
        </div>
      </header>
    </div>
  );
}
