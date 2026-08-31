// Hide the luck badges this browser has already redeemed.
//
// The server used to do this. It read the `redemed_ids` cookie and turned
// `is_luck` off before the markup was written. That cannot survive the cache
// conversion for two separate reasons: a `use cache` scope may not read a
// cookie at all, and one shopper's redemption record must never be baked into
// markup that every other shopper is served.
//
// So the server now states a fact about the PRODUCT — this product has a luck
// offer — and the browser applies the fact about the VISITOR. The visitor's
// record is in their own cookie, and it is applied here.
//
// The work is done twice, on purpose:
//
//  1. by the inline script below, which runs while the browser is still
//     parsing, so a badge the shopper cannot use is never painted; and
//  2. by React on hydration, where `useLuckTimer` reads the same cookie
//     through `startLuck` and stops rendering the badge at all.
//
// Only the first one is new. Without it the badge is drawn, and then removed a
// moment later — and a luck offer that appears and vanishes is worse than one
// that was never offered.

import { REDEEMED_IDS_COOKIE } from "utils/luck";

/** The attribute a luck badge carries, holding the product id it belongs to. */
export const LUCK_BADGE_MARKER = "data-luck-badge";

/**
 * Hide every luck badge whose product id appears in the redeemed cookie.
 *
 * Returns how many badges it hid, so a caller — and the browser check in the
 * ticket — can tell a working script from one that selected nothing.
 *
 * The body of this function is turned into source text and inlined into the
 * page (REDEEMED_LUCK_SCRIPT below), so the same two rules bind it as
 * `installImageFallback` in utils/imageFallback.ts:
 *
 *  1. It reads no module-level value. `LUCK_BADGE_MARKER` is written out as a
 *     literal here rather than referenced, because a closure does not travel
 *     with the source text. The test that asserts the script contains
 *     `LUCK_BADGE_MARKER` is what keeps the literal and the constant in step.
 *  2. It uses only syntax that compiles without helper functions — no `?.`, no
 *     `??`, no spread, no `async`. A helper the compiler adds outside this
 *     function would not be inlined with it, and the script would throw.
 *
 * It never throws. It runs before first paint, where a throw blanks the page.
 */
export function hideRedeemedLuck(doc: Document, cookieValue: string): number {
  if (!cookieValue) return 0;

  var entries: any;
  try {
    entries = JSON.parse(decodeURIComponent(cookieValue));
  } catch (e) {
    // A cookie we cannot read means we know nothing about this shopper. Hiding
    // nothing is the safe answer: a live offer stays, and the worst case is one
    // badge the shopper cannot use — never a missing one they could.
    return 0;
  }
  if (!Array.isArray(entries)) return 0;

  var redeemed: any = {};
  var found = false;
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    if (entry && entry.id !== undefined && entry.id !== null) {
      redeemed[String(entry.id)] = true;
      found = true;
    }
  }
  if (!found) return 0;

  var badges = doc.querySelectorAll("[data-luck-badge]");
  var hidden = 0;
  for (var j = 0; j < badges.length; j++) {
    var badge: any = badges[j];
    var id = badge.getAttribute("data-luck-badge");
    if (id !== null && redeemed[String(id)]) {
      // Both, and both are needed. `hidden` states the intent and takes the
      // badge out of the accessibility tree. The inline style is what actually
      // removes it: every badge carries a Tailwind `flex` class, and an author
      // `display:flex` beats the browser's own rule for the `hidden` attribute.
      badge.setAttribute("hidden", "");
      badge.style.display = "none";
      hidden++;
    }
  }
  return hidden;
}

/**
 * Turn a value into a JavaScript string literal that is safe inside a <script>.
 *
 * `<` is escaped HERE ONLY — inside the string literal — and never across the
 * surrounding code, which is real JavaScript where `<` is a legal operator.
 * The same reasoning, and the same production bug behind it, is written out in
 * full in utils/imageFallback.ts.
 */
const asScriptString = (value: string) =>
  JSON.stringify(value).replace(/</g, "\u003c");

/**
 * The same logic, as source text, for an inline <script> in the document.
 *
 * Built from the function above rather than written out a second time, so the
 * two cannot drift apart. Only the cookie read is extra: the function takes the
 * cookie value as an argument so it can be tested without a browser, and the
 * wrapper here is what fetches that value from `document.cookie`.
 *
 * It runs once straight away, for the markup already parsed above it, and once
 * more on `DOMContentLoaded` for the rest of the document. Anything that
 * arrives after that — a `<Suspense>` boundary that resolves late — is left to
 * React on hydration.
 *
 * Built once, at module load, not per render: the layout that emits it is the
 * hottest server path in the app.
 */
export const REDEEMED_LUCK_SCRIPT =
  "(function(){" +
  "var hide=" +
  hideRedeemedLuck +
  ";" +
  "var name=" +
  asScriptString(REDEEMED_IDS_COOKIE + "=") +
  ";" +
  "function read(){" +
  'var parts=document.cookie.split(";");' +
  "for(var i=0;i<parts.length;i++){" +
  "var p=parts[i];" +
  'while(p.charAt(0)===" "){p=p.substring(1);}' +
  "if(p.indexOf(name)===0){return p.substring(name.length);}" +
  "}" +
  'return "";' +
  "}" +
  "function apply(){try{hide(document,read());}catch(e){}}" +
  "apply();" +
  'document.addEventListener("DOMContentLoaded",apply);' +
  "})();";
