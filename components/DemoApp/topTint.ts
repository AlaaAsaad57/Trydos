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

/**
 * The colours of the open layers; the last one opened is on top. `null`
 * hides the strip. `follow`: the colour follows a fade run in script, so the
 * strip has no fade of its own while it is on top (see followTopTint).
 * `blend`: the strip is drawn with `mix-blend-mode: multiply` while it is on
 * top (see followTopTint). `mix`: the strip shows the colour under it mixed
 * toward `rgb` by `amount`, as one opaque colour (see followTopTint).
 */
type Held = {
  color: string | null;
  follow?: boolean;
  blend?: boolean;
  mix?: { rgb: number[]; amount: number };
};
const held: Held[] = [];

/**
 * A colour as an opaque `[r, g, b]`: a see-through one is read over the white
 * page, and none (a hidden strip, the page shows) is the white page.
 */
function overWhite(color: string | null): number[] {
  if (!color) return [255, 255, 255];
  const hex = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(color);
  if (hex) return hex.slice(1).map((h) => parseInt(h, 16));
  const [r, g, b, a = 1] = (color.match(/[\d.]+/g) ?? []).map(Number);
  return [r, g, b].map((v) => 255 + (v - 255) * a);
}

/** The opaque colour the strip shows for `held[at]`, or for no layer when `at` is -1. */
function shown(at: number, home: TintHome): number[] {
  const entry = held[at];
  if (!entry) return overWhite(home.rest);
  if (!entry.mix) return overWhite(entry.color);
  const { rgb, amount } = entry.mix;
  return shown(at - 1, home).map((v, k) => v + (rgb[k] - v) * amount);
}

/** The same 0.25 s as the backdrops, so the bar fades with the page. */
const FADE = "background-color 0.25s ease, visibility 0.25s";

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
      // One under the highest value: the product page's bag lies over this
      // strip. On a tie the later box wins, and this strip is made late, when a
      // layer first opens, so it would cut the bag's top 12 px.
      zIndex: "2147483646",
      visibility: "hidden",
      backgroundColor: "transparent",
      // `visibility` stays visible for the whole fade, both ways.
      transition: FADE,
    } satisfies Partial<CSSStyleDeclaration>);
    host.appendChild(strip);
  }
  // A `mix` layer at 0 has not started its fade (or has ended it): the one
  // under it still shows, so opening and closing it changes nothing.
  let at = held.length - 1;
  while (at >= 0 && held[at].mix?.amount === 0) at--;
  const top = held[at];
  strip.style.transition = top?.follow ? "none" : FADE;
  strip.style.mixBlendMode = top?.blend ? "multiply" : "";
  const color = top?.mix
    ? `rgb(${shown(at, home).map(Math.round).join(", ")})`
    : top
      ? top.color
      : home.rest;
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

/**
 * The top for a layer whose page fades in script (the chat's wash, a framer
 * motion value). A CSS fade starts on the next frame the browser draws, and
 * the frame a menu opens on is a slow one, so the top came in late, as a
 * piece of its own. Here the strip has no fade of its own: call `set` on
 * every frame of the page's fade with how far it is (0 to 1), and `release`
 * when the layer closes. `color` is an `rgb(r, g, b)` colour.
 *
 * `blend`: for a strip that lies over a page's own header of the same
 * colour. The strip is on top of everything, so it covered what the header
 * draws in its top 12 px (on Home, the top of the picked chip). With
 * `multiply`, white over a colour shows that colour, so the strip cannot be
 * seen over the header. Its own colour, which Safari reads, does not change.
 * Only for white: another colour would tint the header.
 *
 * `mix`: for a layer whose backdrop fades over the page (a sheet). The strip
 * lies over that backdrop, so a see-through strip would darken the page
 * twice. Instead it shows one opaque colour: the colour the strip showed
 * before this layer, mixed toward `color` by `amount`. That is what the page
 * under the backdrop looks like at that moment, and Safari reads an opaque
 * colour as it is. At 0 the colour under it shows, so the layer can open and
 * close with no jump.
 */
export function followTopTint(
  color: string,
  home: TintHome,
  { blend = false, mix = false } = {},
) {
  const [r, g, b] = overWhite(color);
  const entry: Held = mix
    ? { color: null, follow: true, mix: { rgb: [r, g, b], amount: 0 } }
    : { color: null, follow: true, blend };
  held.push(entry);
  paint(home);
  return {
    set(amount: number) {
      if (entry.mix) {
        entry.mix.amount = Math.min(1, Math.max(0, amount));
        paint(home);
        return;
      }
      entry.color = amount > 0 ? `rgba(${r}, ${g}, ${b}, ${amount})` : null;
      if (held.at(-1) === entry) paint(home);
    },
    release() {
      const at = held.indexOf(entry);
      if (at !== -1) held.splice(at, 1);
      paint(home);
    },
  };
}
