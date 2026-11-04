"use client";

import React from "react";
import { motion } from "framer-motion";
import { C, fill } from "../demo1Layout";
import { Icon, Stroke } from "../ui";
import { XD_ICON_SIZE } from "../../DemoApp/xdIcons";
import { TRAVEL } from "../barMotion";

/**
 * The search header — XD `Home Page – 1`.
 *
 * Header 50 .. 144, white, shadow 0 0 3 (black at 10%):
 *   - the field: 406 x 38 at (12, 56), radius 12, `#F8F8F8`; the glass
 *     (19 x 19 at 21.5, 65.5), the text from x 52 at 14 px `#8D8D8D` for the
 *     placeholder, voice (349.5) and scan (387.5) on the right;
 *   - the chips at y 103, 32 tall, radius 12: the picked one is `#F8F8F8` and
 *     Medium, the rest have a 0.3 `#D3D3D3` line and Regular text, all `#404040`.
 *     12 px after the first chip, 4 px between the others. The row scrolls
 *     sideways.
 *
 * The field keeps 12 px to both edges of the screen; the text box takes the
 * room the screen gives, and voice and scan keep the file's gap to the
 * field's end edge. Every x is from the start edge (the left in English, the
 * right in Arabic and Kurdish, A-13); no mark here points a way, so none is
 * mirrored.
 *
 * Its own file, with no mock data in it, so the app's search page draws it
 * (Stage 7, D-44). `voice` and `scan` are what those two places hold: the
 * old voice and image search on the app, plain marks on /demo. `ghost` is
 * the rest of the inline completion, drawn after the typed text.
 */
export function SearchHeader({
  placeholder,
  value,
  onChange,
  onKeyDown,
  ghost = "",
  voice,
  scan,
  chips,
  picked,
  onPick,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  ghost?: string;
  voice: React.ReactNode;
  scan: React.ReactNode;
  chips: string[];
  picked: number;
  onPick?: (index: number) => void;
}) {
  return (
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
          marginInlineStart: 12,
          marginTop: 6,
          width: fill(12),
          height: 38,
          borderRadius: 12,
          background: C.field,
        }}
      >
        <Icon name="searchGlass" ml={9.5} mt={9.5} />
        {/* Text left 52 on the artboard; baseline 80 → box top 66 at 14 px.
            280 wide on a 430 px screen: it takes what voice and scan leave. */}
        <div
          className="relative"
          style={{
            marginInlineStart: 40 - (9.5 + XD_ICON_SIZE.searchGlass.w),
            marginTop: 7,
            flex: "1 1 0",
            minWidth: 0,
            height: 24,
          }}
        >
          {ghost && (
            // The completion: the typed text is invisible (it only takes its
            // width), the rest shows grey after it, under the input's text.
            <div
              aria-hidden="true"
              data-pw="demo-search-ghost"
              className="absolute inset-0 overflow-hidden whitespace-pre pointer-events-none"
              style={{ fontSize: 14, lineHeight: "24px" }}
            >
              <span className="text-transparent">{value}</span>
              <span style={{ color: "#C4C2C2" }}>{ghost}</span>
            </div>
          )}
          <input
            data-pw="demo-search-input"
            type="search"
            enterKeyHint="search"
            maxLength={90}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            aria-label={placeholder}
            className="relative block w-full bg-transparent outline-none font-normal placeholder:text-[#8D8D8D]"
            style={{
              height: 24,
              fontSize: 14,
              lineHeight: "24px",
              color: C.ink,
              padding: 0,
              border: 0,
            }}
          />
        </div>
        {/* Voice at x 349.5 and scan at 387.5 on the artboard, 9.5 down. Scan
            keeps the file's 11.5 px to the field's right edge. */}
        <div
          className="shrink-0"
          style={{ marginInlineStart: 337.5 - (40 + 280), marginTop: 9.5 }}
        >
          {voice}
        </div>
        <div
          className="shrink-0"
          style={{
            marginInlineStart: 375.5 - (337.5 + XD_ICON_SIZE.searchVoice.w),
            marginInlineEnd: 406 - (375.5 + XD_ICON_SIZE.searchScan.w),
            marginTop: 9.5,
          }}
        >
          {scan}
        </div>
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
        {chips.map((name, i) => {
          const on = i === picked;
          return (
            <button
              key={i}
              type="button"
              data-pw={`demo-search-chip-${i}`}
              aria-pressed={on}
              onClick={() => onPick?.(i)}
              // The file starts each word 12 px in, it does not centre it.
              className={`relative shrink-0 cursor-pointer whitespace-nowrap text-start ${on ? "font-medium" : "font-normal"}`}
              style={{
                height: 32,
                padding: "0 12px",
                // The file draws "For you" 70 wide and the others 63 wide
                // round a 38 px word, whatever width the browser gives the word.
                minWidth: i === 0 ? 70 : 63,
                marginInlineStart: i === 0 ? 0 : i === 1 ? 12 : 4,
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
              <span className="relative">{name}</span>
              <Stroke color={C.line} width={0.3} radius={12} visible={!on} />
            </button>
          );
        })}
      </div>
    </header>
  );
}
