"use client";

import type { DemoKey } from "../../DemoApp/demoKeys";
import React, { useState } from "react";
import { motion } from "framer-motion";
import XdIcon from "../../DemoApp/XdIcon";
import { useDemoNav } from "../Demo1Shell";
import { C, fill } from "../demo1Layout";
import { Icon, ScreenPage, Stroke } from "../ui";
import { XD_ICON_SIZE } from "../../DemoApp/xdIcons";
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
 *
 * On /demo the header is the sticky head of a fluid page (`ScreenPage`). The
 * field keeps 12 px to both edges of the screen; the text box takes the room
 * the screen gives, and voice and scan keep the file's gap to the field's
 * right edge.
 */
const CHIPS = ["For you", "Empty", "Empty", "Empty", "Empty", "Empty"] as const;

export default function SearchScreen() {
  const { t } = useDemoNav();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState(0);

  const header = (
    <header
      className="relative w-full flex flex-col"
      style={{
        height: 94,
        background: C.white,
        boxShadow: "0 0 3px rgba(0,0,0,0.1)",
      }}
    >
      <div
        className="flex items-start shrink-0"
        style={{
          marginLeft: 12,
          marginTop: 6,
          width: fill(12),
          height: 38,
          borderRadius: 12,
          background: C.field,
        }}
      >
        <Icon name="searchGlass" ml={9.5} mt={9.5} />
        <input
          data-pw="demo-search-input"
          type="search"
          enterKeyHint="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("Search anything…")}
          aria-label={t("Search anything…")}
          className="block bg-transparent outline-none font-normal placeholder:text-[#8D8D8D]"
          // Text left 52 on the artboard; baseline 80 → box top 66 at 14 px.
          // 280 wide on a 430 px screen: it takes what voice and scan leave.
          style={{
            marginLeft: 40 - (9.5 + XD_ICON_SIZE.searchGlass.w),
            marginTop: 7,
            flex: "1 1 0",
            minWidth: 0,
            height: 24,
            fontSize: 14,
            color: C.ink,
            padding: 0,
            border: 0,
          }}
        />
        {/* Voice at x 349.5 and scan at 387.5 on the artboard, 9.5 down. Scan
            keeps the file's 11.5 px to the field's right edge. */}
        <button
          type="button"
          aria-label={t("Voice search")}
          className="shrink-0 cursor-pointer active:opacity-60"
          style={{ marginLeft: 337.5 - (40 + 280), marginTop: 9.5 }}
        >
          <XdIcon name="searchVoice" />
        </button>
        <button
          type="button"
          aria-label={t("Scan")}
          className="shrink-0 cursor-pointer active:opacity-60"
          style={{
            marginLeft: 375.5 - (337.5 + XD_ICON_SIZE.searchVoice.w),
            marginRight: 406 - (375.5 + XD_ICON_SIZE.searchScan.w),
            marginTop: 9.5,
          }}
        >
          <XdIcon name="searchScan" />
        </button>
      </div>

      <div
        className="flex shrink-0 items-center overflow-x-auto"
        style={{
          // 2 px of room above and below (the chips are at y 103), so the
          // chips' 0.3 lines are not cut by the scroll box's edge.
          marginTop: 51 - (6 + 38),
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
                // The file draws "For you" 70 wide and the others 63 wide
                // round a 38 px word, whatever width the browser gives the word.
                minWidth: i === 0 ? 70 : 63,
                marginLeft: i === 0 ? 0 : i === 1 ? 12 : 4,
                fontSize: 13,
                color: C.inkSoft,
                lineHeight: "32px",
                borderRadius: 12,
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
              <Stroke color={C.line} width={0.3} radius={12} visible={!on} />
            </button>
          );
        })}
      </div>
    </header>
  );

  return (
    <ScreenPage testId="demo-search" bg={C.page} header={header} tabBar>
      {null}
    </ScreenPage>
  );
}
