/**
 * The colour of Safari's top area (the clock and the battery) while a layer
 * of the demo is open.
 *
 * How Safari 26 on the iPhone picks that colour
 * ---------------------------------------------
 * From WebKit's own code (LocalFrameView::fixedContainerEdges and
 * Page::updateFixedContainerEdges). `theme-color` is not read at all.
 *
 *  1. It hit-tests one point 4 px under the top edge, in the middle, and
 *     walks up to the first `fixed` or `sticky` box.
 *  2. If that box is about as big as the screen (90 to 105 % both ways), or
 *     is a "dimming layer" (a see-through backdrop with no children), Safari
 *     KEEPS the colour it already shows. It does not read the box's colour.
 *     On /demo the box at the top is the screen-sized #app-outer, so the bar
 *     stayed grey after a sheet closed. On /demo the box is the sheet's
 *     backdrop, a dimming layer, so the bar never went grey at all.
 *  3. A box 10 px tall or less gives no colour of its own either.
 *  4. Safari looks again only when a fixed or sticky layer repaints or moves.
 *     Taking a box away is not enough.
 *
 * So the demo puts ONE strip of its own at the top: fixed, full width, more
 * than 10 px tall, with an opaque colour. Safari reads its colour directly
 * every time it changes, and it is never taken away while the demo is open,
 * so every change is a repaint that Safari sees. While no layer is open the
 * strip is the app's `rest` colour, or hidden (`null`): then Safari looks
 * through it to what is under it, as if it were not there.
 */

export const TOP_TINT_TEST_ID = "demo-top-tint";

/** Where the strip lives, and what it shows while no layer is open. */
export type TintHome = {
  host: () => HTMLElement;
  /** The colour with no layer open, or null to hide the strip. */
  rest: string | null;
};

/** The colours of the open layers; the last one opened is on top. */
const held: { color: string }[] = [];

function paint(home: TintHome) {
  const host = home.host();
  let strip = host.querySelector<HTMLElement>(
    `:scope > [data-pw="${TOP_TINT_TEST_ID}"]`,
  );
  if (!strip) {
    strip = document.createElement("div");
    strip.dataset.pw = TOP_TINT_TEST_ID;
    strip.setAttribute("aria-hidden", "true");
    Object.assign(strip.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      // 12 px: Safari reads the colour of a box taller than 10 px. In a
      // home-screen app it also covers the device's own top inset.
      height: "max(12px, env(safe-area-inset-top, 0px))",
      pointerEvents: "none",
      zIndex: "2147483647",
      visibility: "hidden",
      backgroundColor: "transparent",
      // The same 0.25 s as the backdrops, so the bar fades with the page.
      // `visibility` stays visible for the whole fade, both ways.
      transition: "background-color 0.25s ease, visibility 0.25s",
    } satisfies Partial<CSSStyleDeclaration>);
    host.appendChild(strip);
  }
  const color = held.at(-1)?.color ?? home.rest;
  if (color) {
    strip.style.visibility = "visible";
    strip.style.backgroundColor = color;
  } else {
    strip.style.visibility = "hidden";
    strip.style.backgroundColor = "transparent";
  }
}

/**
 * Shows `color` at the top while a layer is open. Returns the function that
 * gives the top back when the layer closes.
 */
export function holdTopTint(color: string, home: TintHome): () => void {
  const entry = { color };
  held.push(entry);
  paint(home);
  return () => {
    const at = held.indexOf(entry);
    if (at !== -1) held.splice(at, 1);
    paint(home);
  };
}
