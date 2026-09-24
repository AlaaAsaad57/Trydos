// The window-scroll bookkeeping behind intercepted routes
// (`components/ModalRoute/overlayScroll.ts`).
//
// What this module is for: a product or a boutique opened from the home page is
// an intercepted route. It renders in the *same document* as the home page,
// which is only `display:none` underneath it, so the two share one window
// scroll. Nothing in the browser or the router puts the home page back where it
// was — this module does, by hand.
//
// ---------------------------------------------------------------------------
// Why this file models the browser instead of using jsdom as it comes
//
// The bug these cases guard against is entirely about **when** things happen, so
// a test that cannot lose a scroll position cannot see it. Three browser rules
// matter and jsdom implements none of them:
//
//   1. `window.scrollTo` moves the window. jsdom's throws "not implemented".
//   2. The position can never be below the bottom of the document. Hide the
//      page body and the document shrinks, so the browser drags the position up
//      to the new bottom — and the old value is gone.
//   3. Going back is a history traversal, and unless `scrollRestoration` is
//      "manual" the browser puts the window where *it* recorded that entry,
//      after the page's own code has run and without calling any scroll API.
//
// Rules 2 and 3 are what broke it, and the numbers below are the measured ones.
// In Chromium, on this journey: a home page parked at 11625px was already at 2px
// by the time the module read it, because the in-flow loader had hidden the page
// body one commit earlier and the document had fallen from 12525px to 902px.
// Then, once that was fixed, the window was at 11625px when the restore returned
// and back at 0px on the very next animation frame — rule 3.
//
// ---------------------------------------------------------------------------
// What proved the bug, and what this file is
//
// The confirming test is the browser one — `GUEST-42` in
// `tests/e2e/guest.live.spec.ts`. It was run against the unfixed app and failed
// there, on a real home page, with the position coming back at 0px instead of
// the 25724px it was left at.
//
// This file is the regression guard for that already-proved fix, which is why it
// is expected to be green from the moment it was written. It lives in the unit
// suite because that is the one that gates a pull request; the browser suite
// never does, so a fix proved only there is unguarded the day it lands.

import { beforeEach, describe, expect, it, vi } from "vitest";

/** The window's scroll, with the browser's rules. */
let position = 0;
let bottom = 0;
let scrollRestoration: "auto" | "manual" = "auto";

/** How far the document can be scrolled. Setting it applies the clamp, which is
 *  what hiding the page body does to a position further down than the new
 *  bottom. */
const setDocumentBottom = (value: number): void => {
  bottom = value;
  if (position > bottom) position = bottom;
};

/** The last thing a history traversal does: unless the page has taken the job
 *  over, the browser puts the window back where it recorded this entry.
 *
 *  `recorded` is 0 in every case here, and that is not a simplification — it is
 *  what the browser really has. The page body is hidden before the address
 *  changes, so the position it saw at that moment was already the top. */
const browserFinishesTraversal = (recorded: number): void => {
  if (scrollRestoration === "auto") position = Math.min(recorded, bottom);
};

/** Let the queued hand-back of `scrollRestoration` run. */
const settleFrames = async (): Promise<void> => {
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  await new Promise((resolve) => setTimeout(resolve, 0));
};

/** The address the overlay journeys below open. Intercepted, so opening it takes
 *  the browser's scroll restoration over for the page it is opened from. */
const OVERLAY_ADDRESS = "/sy-en/products/a-thing";

const loadModule = () => import("components/ModalRoute/overlayScroll");

beforeEach(() => {
  // Module-level state, so every case needs its own copy of the module.
  vi.resetModules();

  position = 0;
  bottom = 0;
  scrollRestoration = "auto";

  Object.defineProperty(window, "scrollY", {
    configurable: true,
    get: () => position,
  });
  window.scrollTo = ((_x: number, y: number) => {
    position = Math.min(Math.max(y, 0), bottom);
  }) as typeof window.scrollTo;

  // jsdom has no `scrollRestoration`, so the module would skip taking it over
  // and every case below would pass without testing anything.
  Object.defineProperty(window.history, "scrollRestoration", {
    configurable: true,
    get: () => scrollRestoration,
    set: (value: "auto" | "manual") => {
      scrollRestoration = value;
    },
  });

  // The page the journeys below start on. `rememberBaseScroll` reads it, so a
  // case that leaves jsdom's default "/" here is testing a path mismatch by
  // accident.
  window.history.replaceState({}, "", "/sy-en");
});

describe("coming back from an intercepted overlay", () => {
  it("puts the page back where it was, though the body was hidden before the overlay was entered", async () => {
    const overlay = await loadModule();

    setDocumentBottom(11625);
    window.scrollTo(0, 11625);

    // The click. Nothing is hidden yet, so this is the last moment the real
    // position exists.
    overlay.rememberBaseScroll(OVERLAY_ADDRESS);

    // The in-flow loader hides the page body. The document collapses and the
    // browser drags the position to the new bottom — 11625px is gone.
    setDocumentBottom(2);
    expect(
      window.scrollY,
      "the model did not clamp, so this case cannot see the bug it exists for",
    ).toBe(2);

    // Both phases of the navigation: the loader, then the overlay itself.
    overlay.enterOverlay("/sy-en");
    overlay.enterOverlay("/sy-en");
    overlay.markOverlayShown();

    // The back-out. The body is still hidden at this point, which is why the
    // scroll is not done here.
    overlay.leaveOverlay("/sy-en");

    // The body is shown again, and only now is the position put back.
    setDocumentBottom(11625);
    overlay.restoreBaseScroll();
    browserFinishesTraversal(0);

    expect(
      window.scrollY,
      `the page came back at ${window.scrollY}px after being left at 11625px`,
    ).toBe(11625);
  });

  it("does not let the browser overwrite the restored position with its own", async () => {
    const overlay = await loadModule();

    setDocumentBottom(11625);
    window.scrollTo(0, 11625);
    overlay.rememberBaseScroll(OVERLAY_ADDRESS);

    // This is the whole case, and the moment matters: the page has to answer for
    // this entry's scroll position from the click onwards, because the value
    // belongs to whichever entry was current when it was set.
    expect(
      window.history.scrollRestoration,
      "the browser still owns history scroll restoration for this entry, so it will undo the restore",
    ).toBe("manual");

    setDocumentBottom(2);
    overlay.enterOverlay("/sy-en");
    overlay.markOverlayShown();

    overlay.leaveOverlay("/sy-en");
    setDocumentBottom(11625);
    overlay.restoreBaseScroll();
    browserFinishesTraversal(0);

    expect(
      window.scrollY,
      `the browser put the page back to ${window.scrollY}px over the restored 11625px`,
    ).toBe(11625);
  });

  it("gives history scroll restoration back to the browser once it is done", async () => {
    const overlay = await loadModule();

    setDocumentBottom(11625);
    window.scrollTo(0, 11625);
    overlay.rememberBaseScroll(OVERLAY_ADDRESS);
    setDocumentBottom(2);
    overlay.enterOverlay("/sy-en");
    overlay.markOverlayShown();
    overlay.leaveOverlay("/sy-en");
    setDocumentBottom(11625);
    overlay.restoreBaseScroll();

    await settleFrames();

    expect(
      window.history.scrollRestoration,
      "the browser was left without its own scroll restoration, so every later Back loses its place",
    ).toBe("auto");
  });

  it("never takes scroll restoration away for a navigation that shows no overlay", async () => {
    const overlay = await loadModule();

    setDocumentBottom(11625);
    window.scrollTo(0, 11625);

    // An ordinary page, not an intercepted one. The loader phase still runs —
    // it runs for every navigation — but the browser must keep its own job,
    // because nothing here will ever put this page back and the entry would be
    // left switched over for good.
    overlay.rememberBaseScroll("/sy-en/settings/orders");
    setDocumentBottom(2);
    overlay.enterOverlay("/sy-en");

    expect(
      window.history.scrollRestoration,
      "an ordinary navigation took the browser's scroll restoration away",
    ).toBe("auto");
  });

  it("lands the overlay itself at the top", async () => {
    const overlay = await loadModule();

    setDocumentBottom(11625);
    window.scrollTo(0, 11625);
    overlay.rememberBaseScroll(OVERLAY_ADDRESS);

    // The overlay's own content is tall enough to hold the old position, so
    // nothing but this module can bring it to the top.
    setDocumentBottom(11625);
    overlay.enterOverlay("/sy-en");

    expect(
      window.scrollY,
      `the overlay opened ${window.scrollY}px down, inheriting the page's scroll`,
    ).toBe(0);
  });

  it("leaves a different page at its top rather than at the old page's position", async () => {
    const overlay = await loadModule();

    setDocumentBottom(11625);
    window.scrollTo(0, 11625);
    overlay.rememberBaseScroll(OVERLAY_ADDRESS);

    setDocumentBottom(2);
    overlay.enterOverlay("/sy-en");
    overlay.markOverlayShown();

    // Forward to a different page — the cart, say — not back to the home page.
    overlay.leaveOverlay("/sy-en/cart");

    setDocumentBottom(11625);
    overlay.restoreBaseScroll();

    expect(
      window.scrollY,
      `the cart opened ${window.scrollY}px down, at the home page's old position`,
    ).toBe(0);

    await settleFrames();
    expect(
      window.history.scrollRestoration,
      "moving on to another page left the browser without its own scroll restoration",
    ).toBe("auto");
  });

  it("restores nothing when the loader showed but no overlay ever did", async () => {
    const overlay = await loadModule();

    setDocumentBottom(11625);
    window.scrollTo(0, 11625);
    overlay.rememberBaseScroll(OVERLAY_ADDRESS);

    setDocumentBottom(2);
    overlay.enterOverlay("/sy-en");

    // No `markOverlayShown` — the destination was an ordinary page.
    overlay.leaveOverlay("/sy-en");

    setDocumentBottom(11625);
    overlay.restoreBaseScroll();

    expect(
      window.scrollY,
      `an ordinary navigation was moved to ${window.scrollY}px instead of being left alone`,
    ).toBe(0);
  });

  it("ignores a remembered position that belongs to a different page", async () => {
    const overlay = await loadModule();

    setDocumentBottom(11625);
    window.scrollTo(0, 11625);

    // Remembered while on the home page, but the overlay is entered from
    // somewhere else — a click that never navigated, then a browser Forward.
    overlay.rememberBaseScroll(OVERLAY_ADDRESS);
    window.history.replaceState({}, "", "/sy-en/settings");
    window.scrollTo(0, 300);

    overlay.enterOverlay("/sy-en/settings");
    overlay.markOverlayShown();
    overlay.leaveOverlay("/sy-en/settings");

    setDocumentBottom(11625);
    overlay.restoreBaseScroll();

    expect(
      window.scrollY,
      `the settings page came back at ${window.scrollY}px, which is the home page's position and not its own`,
    ).toBe(300);
  });
});
