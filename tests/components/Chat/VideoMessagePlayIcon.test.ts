// The play icon on a video message has to be the thing you click.
//
// WHAT BROKE
// A video message paints a play icon over the video (`.play-vid-icon`) and
// gives it its own click handler with `e.stopPropagation()`: it opens the
// video in the preview, the same thing the eye button in the options menu
// does (VideoMessage.tsx). A click anywhere else on the bubble is meant to
// open the options menu instead.
//
// The play icon never got its click. `.message-img-body::after` is a
// decoration — an inset shadow that darkens the bottom of the bubble so the
// white timestamp stays readable on a light photo. It is placed over the
// WHOLE bubble at z-index 9999, far above the play icon at 99, and a
// pseudo-element takes pointer events like any other box. So the browser gave
// the click to the bubble, and the options menu opened every time.
//
// HOW THAT WAS CONFIRMED
// The markup of VideoMessage was rendered in Chromium with this stylesheet,
// and `document.elementFromPoint` was asked what sits at the centre of the
// play icon:
//   before: "DIV.message-element-body message-body message-img-body"
//           -> only the bubble handler ran, so the options menu opened
//   after:  "IMG.play-vid-icon"
//           -> the play icon handler ran, so the video preview opened
// A click on the video away from the icon answered the bubble both times, so
// the options menu still opens there.
//
// WHY THE SHADE WAS NOT THE THING CHANGED
// Making the shade ignore clicks would have worked too, but the same shade is
// drawn over a PHOTO message, which has no play icon. Clicking a photo would
// then have stopped opening the options menu. Raising the play icon touches
// video messages only.
//
// WHY THE CHECK BELOW READS THE STYLESHEET
// jsdom has no layout and no painting, so it cannot answer "what covers what",
// and it does not apply this stylesheet at all. What it can prove is the one
// thing the browser result depends on: which of the two boxes asks for the
// higher level. The paint itself was proved in the browser, as recorded above.
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const STYLESHEET = path.join(
  process.cwd(),
  "public",
  "styles",
  "ChatWindow.css",
);

/** The play icon drawn over the video of a video message. */
const PLAY_ICON = ".play-vid-icon";
/** The shade drawn over the whole bubble of a photo or video message. */
const SHADE = ".message-img-body::after";

/**
 * The stacking level one rule asks for. Comments are dropped first, so a level
 * that is only mentioned in a comment cannot pass for a real declaration.
 */
function stackingLevelOf(selector: string): number {
  const css = readFileSync(STYLESHEET, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const at = css.indexOf(selector);
  if (at === -1) {
    throw new Error(
      `${STYLESHEET} has no "${selector}" rule any more. If it was renamed, ` +
        "point this test at the new name — do not delete the test: the play " +
        "icon still has to sit above the shade to be clickable.",
    );
  }
  const open = css.indexOf("{", at);
  const close = css.indexOf("}", open);
  const found = /z-index\s*:\s*(\d+)/.exec(css.slice(open + 1, close));
  if (!found) {
    throw new Error(
      `"${selector}" no longer declares a z-index, so which box the browser ` +
        "puts on top is left to document order. Give it one.",
    );
  }
  return Number(found[1]);
}

describe("the play icon on a video message", () => {
  it("sits above the shade that covers the bubble, so a click reaches it", () => {
    const playIcon = stackingLevelOf(PLAY_ICON);
    const shade = stackingLevelOf(SHADE);

    expect(
      playIcon > shade,
      `the play icon asks for level ${playIcon} and the shade over the whole ` +
        `bubble asks for ${shade}. The shade is on top, so the browser gives ` +
        "the click to the bubble and the options menu opens instead of the " +
        "video preview.",
    ).toBe(true);
  });

  it("does not raise the shade instead, which would break photo messages", () => {
    const shade = stackingLevelOf(SHADE);

    expect(
      shade,
      `the shade "${SHADE}" is no longer at 9999. It is shared with photo ` +
        "messages, where clicking the picture is supposed to keep opening " +
        "the options menu. Raise the play icon, not the shade.",
    ).toBe(9999);
  });
});
