"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import XdIcon from "../../DemoApp/XdIcon";
import { C } from "../demo1Layout";
import { Stroke } from "../ui";
import { TRAVEL } from "../barMotion";

/*
  The Home header — XD `Home Page`. A white 50 px header (shadow 0 0 3, black
  at 10%). On the left the search mark (21 x 21 at 15.5, 64.5), then the
  category chips: 32 tall at y 59, 12 px of padding, 13 px text. The picked
  chip is `#F8F7FF` with a 0.3 `#707070` line and Medium text; the rest are
  bare Regular text. The chips are a row that scrolls sideways, from x 60.
  Every x is from the start edge (the left in English, the right in Arabic
  and Kurdish, A-13); the search mark points no way, so it is not mirrored.

  Its own file, with no mock data in it, so the app's home page can draw it
  (A-16). /demo draws it from HomeScreen.tsx.
*/

/** One chip of the home header. */
export type HeaderChip = {
  /** A stable key: the category slug on the app, the word on /demo. */
  key: string;
  label: string;
  picked: boolean;
  /** The category's page. With it the chip is a link; without it a button (/demo). */
  href?: string;
  /** The file's slot width for this chip (/demo only). */
  slot?: number;
};

/**
 * The home header: the search mark, then the category chips (see the file
 * notes at the top). The app passes real categories as links (S7-4, S7-8);
 * /demo passes the file's five words as buttons.
 */
export function HomeHeader({
  searchLabel,
  searchHref,
  onSearch,
  chips,
  onPick,
}: {
  searchLabel: string;
  /** The search page. With it the mark is a link. */
  searchHref?: string;
  onSearch?: () => void;
  chips: HeaderChip[];
  onPick?: (key: string) => void;
}) {
  // The mark at (15.5, 64.5), in a 37 px target 8 px round it.
  const markStyle: React.CSSProperties = {
    marginInlineStart: 15.5 - 8,
    marginTop: 14.5 - 8,
    width: 37,
    height: 37,
    padding: 8,
  };
  return (
    <header
      className="relative w-full flex items-start"
      style={{
        height: 50,
        background: C.white,
        boxShadow: "0 0 3px rgba(0,0,0,0.1)",
      }}
    >
      {searchHref ? (
        <Link
          href={searchHref}
          aria-label={searchLabel}
          data-pw="demo-home-search"
          className="block shrink-0 cursor-pointer active:opacity-60"
          style={markStyle}
        >
          <XdIcon name="homeLogo" />
        </Link>
      ) : (
        <button
          type="button"
          aria-label={searchLabel}
          data-pw="demo-home-search"
          onClick={onSearch}
          className="shrink-0 cursor-pointer active:opacity-60"
          style={markStyle}
        >
          <XdIcon name="homeLogo" />
        </button>
      )}

      <div
        data-pw="demo-home-chips"
        className="flex flex-1 min-w-0 items-center overflow-x-auto"
        // The row scrolls sideways, and a scroll box clips at its edges. It
        // starts 2 px early (x 58) and 2 px higher (y 57), with the same
        // padding inside, so the picked chip's 0.3 line sits inside the box
        // instead of on its edge, where it was cut off.
        style={{
          marginInlineStart: 58 - (15.5 - 8 + 37),
          marginTop: 7,
          height: 36,
          paddingBlock: 2,
          paddingInlineStart: 2,
          paddingInlineEnd: 11,
          scrollbarWidth: "none",
        }}
      >
        {chips.map((chip) => {
          const on = chip.picked;
          const className = `relative block shrink-0 cursor-pointer whitespace-nowrap text-start ${on ? "font-medium" : "font-normal"}`;
          const style: React.CSSProperties = {
            height: 32,
            minWidth: chip.slot,
            paddingInlineEnd: 4,
            fontSize: 13,
            color: C.ink,
            lineHeight: "32px",
          };
          const inside = (
            <span
              className="relative inline-block"
              style={{ height: 32, padding: "0 12px" }}
            >
              {on && (
                <motion.span
                  layoutId="demo-home-chip"
                  transition={TRAVEL}
                  className="absolute inset-0"
                  style={{ borderRadius: 12, background: "#F8F7FF" }}
                >
                  <Stroke color="#707070" width={0.3} radius={12} />
                </motion.span>
              )}
              <span className="relative">{chip.label}</span>
            </span>
          );
          return chip.href ? (
            <Link
              key={chip.key}
              href={chip.href}
              data-pw={`demo-category-${chip.key}`}
              aria-current={on ? "page" : undefined}
              className={className}
              style={style}
            >
              {inside}
            </Link>
          ) : (
            <button
              key={chip.key}
              type="button"
              data-pw={`demo-category-${chip.key}`}
              aria-pressed={on}
              onClick={() => onPick?.(chip.key)}
              className={className}
              style={style}
            >
              {inside}
            </button>
          );
        })}
      </div>
    </header>
  );
}
