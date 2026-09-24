// Walking a paged list until a card is found — the decision, with no browser.
//
// ---------------------------------------------------------------------------
// Why this is a separate module
//
// The seller dashboard's product grid pages one screen at a time. The QA shop
// has **one** product today, so `last_page` is 1, no pagination control is even
// drawn, and a walk written only in the browser action would never execute a
// single step of itself. `AC-11` would then report "found by walking the pages"
// having walked none — a check passing for a case it cannot see.
//
// So the decision lives here, as a pure function, and `tests/harness/gridWalk.test.ts`
// drives it over the shapes the environment cannot produce yet. The browser
// action keeps only the clicking and the reading.
//
// It imports nothing — not even `@playwright/test` — because the unit project
// excludes `tests/e2e/**` from test *discovery* while still being able to
// import a module from it. A Playwright import here would pull the whole
// browser runner into `pnpm test:run`.
//
// ---------------------------------------------------------------------------
// The shapes it has to get right
//
//   * one page, card on it            -> found, having looked at 1 of 1
//   * one page, card absent           -> exhausted after 1 of 1
//   * several pages, card on the last -> next, next, ... then found
//   * `last` unknown or nonsense      -> treated as one page, never as "keep
//                                        pressing Next for ever"
//
// The last one is not defensive noise. `Pagination` renders only when
// `last_page > 1`, so a one-page grid gives the action **no control to read**
// and `last` arrives as `undefined`. Reading that as "unbounded" would press a
// button that is not there.

/** What the walker knows after looking at the page it is on. */
export type WalkState = {
  /** The page currently on screen, 1-based. */
  current: number;
  /** The last page the list says it has. `undefined` when no control is drawn. */
  last?: number;
  /** Is the card being looked for on this page? */
  foundHere: boolean;
};

/** What to do next. Exactly one of three things. */
export type WalkStep =
  | { action: "found"; page: number; of: number }
  | { action: "next"; from: number; to: number; of: number }
  | { action: "exhausted"; walked: number; of: number };

/** A missing or unusable `last` means one page — never "unbounded".
 *
 *  Exported because the action reads the same value off the page and has to
 *  normalise it the same way. */
export const pageCount = (last?: number): number => {
  if (typeof last !== "number" || !Number.isFinite(last) || last < 1) return 1;
  return Math.floor(last);
};

/** The one decision this walk makes. Pure: same input, same answer, no clock,
 *  no page, no network. */
export const nextWalkStep = (state: WalkState): WalkStep => {
  const of = pageCount(state.last);
  const current = Math.max(1, Math.floor(state.current));

  if (state.foundHere) return { action: "found", page: current, of };
  if (current >= of) return { action: "exhausted", walked: current, of };
  return { action: "next", from: current, to: current + 1, of };
};

/** The sentence a failure carries.
 *
 *  "walked 3 of 7 pages" is the whole point: a reader learns both that the walk
 *  ran and where it stopped, without opening the test. */
export const walkedSentence = (walked: number, of: number): string =>
  `walked ${walked} of ${of} ${of === 1 ? "page" : "pages"}`;
