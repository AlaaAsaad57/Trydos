// A sent text bubble (components/Chat/components/messages/Types/TextMessage.tsx):
// its width on a phone, so a swipe can show the dates.
//
// A swipe to the right moves a sent bubble 18 px (SNAP_OFFSET in
// useMessageSwipe.ts) and shows its dates 8 px to its left (SentMessage.tsx).
// The chat list (ConversationContainer.tsx, px-[20px], overflow-x hidden)
// cuts anything left of its own edge.
//
// A long text bubble is as wide as the row allows, up to 357.5 px. On a phone
// under 418 px it filled the row, so the dates did not fit on its left. The
// hook then pushed the bubble further right (33 px on a 375 px phone, measured
// in WebKit), so the dates showed but the list cut 13 px off the bubble's
// right side.
//
// jsdom does no layout, so this case reads the rules in ChatWindow.css and does
// the same sums a browser does. The dates box is 39-41 px wide (measured in
// Chromium and WebKit with three rows); 41 is used.
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const css = readFileSync(path.resolve(process.cwd(), "public/styles/ChatWindow.css"), "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
);
const LIST_PADDING = 20;
const DATES_GAP = 8;
const DATES_WIDTH = 41;
const NUDGE = 18;
const EDGE_GAP = 4;

/** Every top-level `@media (max-width: Npx)` block, with its N and body. */
const mediaBlocks = () => {
  const blocks: { max: number; body: string }[] = [];
  const re = /@media[^{]*max-width:\s*([\d.]+)px[^{]*\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css))) {
    let depth = 1;
    let i = re.lastIndex;
    while (depth > 0 && i < css.length) {
      if (css[i] === "{") depth++;
      if (css[i] === "}") depth--;
      i++;
    }
    blocks.push({ max: parseFloat(m[1]), body: css.slice(re.lastIndex, i - 1) });
  }
  return blocks;
};
const ruleIn = (body: string, selector: string) =>
  body
    .split("}")
    .map((chunk) => chunk.split("{"))
    .find(([sel]) => sel.split(",").some((s) => s.trim() === selector))?.[1] ?? "";
const value = (block: string, prop: string) =>
  block
    .split(";")
    .map((d) => d.split(":"))
    .find(([name]) => name.trim() === prop)
    ?.slice(1)
    .join(":")
    .trim();

/** A long sent text bubble's width at a screen `width`, from the rules in the file. */
const bubbleWidth = (width: number) => {
  let cap = parseFloat(value(ruleIn(css, ".message-body"), "max-width") ?? "");
  for (const block of mediaBlocks()) {
    if (width > block.max) continue;
    const w = value(ruleIn(block.body, ".self-align .message-body.text-body"), "max-width");
    const m = w?.match(/^calc\(100vw - ([\d.]+)px\)$/);
    if (m) cap = width - parseFloat(m[1]);
  }
  // The row is the list's width less its padding on both sides.
  return Math.min(cap, width - 2 * LIST_PADDING);
};

describe("TextMessage — a long sent bubble's width on a phone", () => {
  it("leaves room for the dates on the bubble's left at every phone width, 320 to 430 px", () => {
    const cut: string[] = [];
    for (let width = 320; width <= 430; width++) {
      const bubble = bubbleWidth(width);
      const bubbleLeft = width - LIST_PADDING - bubble;
      const datesLeft = bubbleLeft - DATES_GAP - DATES_WIDTH + NUDGE;
      if (datesLeft < EDGE_GAP) cut.push(`${width}px (bubble ${bubble}px, dates at x=${datesLeft})`);
    }
    expect(
      cut,
      `after the 18 px swipe the dates start left of the chat list's edge, so they are cut (or the bubble is pushed past the right edge) at: ${cut.slice(0, 3).join(", ")}${cut.length > 3 ? ", …" : ""}`,
    ).toEqual([]);
  });
});
