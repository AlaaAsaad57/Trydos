import { DESIGN_H, DESIGN_W, KEYBOARD_GAP, MAX_DEFICIT, MAX_SCALE } from './scale.config';

/**
 * canvasFit — where the design canvas goes, and how big it is drawn.
 *
 * The rule: the 430-wide artboard always fills the width of the window, at one
 * scale, capped at MAX_SCALE. Nothing is ever drawn smaller than the design
 * because the page is short.
 *
 * The height is the part the window decides. On an iPhone in Safari the
 * browser bars take about 190 px of a 932 px screen, so the page is ~745 px
 * tall. Fitting the whole 932 px artboard into that drew everything at 80%,
 * with a 43 px white margin on each side — the client saw a smaller app. So the
 * canvas is now `DESIGN_H - deficit` design px tall, where `deficit` is the
 * height the page does not have. AppScaler publishes it as `--xd-flex-deficit`
 * and every bottom-anchored element (`fromBottom()` in authLayout) moves up by
 * it, so the buttons stay at the bottom of the real page and the empty space
 * above the mark is what gets shorter.
 *
 * `deficit` stops at MAX_DEFICIT. Past that (iPhone SE, a laptop in landscape)
 * the bottom cluster would climb into the head block, so the canvas shrinks as
 * well, the way it used to for every short page.
 *
 * Why it is a plain function and not part of the component: this is the only
 * arithmetic in the scaling system, and `tests/scaling/canvasFit.test.ts` walks
 * real device sizes through it in a few milliseconds.
 */
export type CanvasFit = {
  /** The single `transform: scale()` factor for the canvas. */
  scale: number;
  /** Design px the screens must give up from their vertical gaps. 0 on a full screen. */
  deficit: number;
  /** The canvas height in design px: DESIGN_H - deficit. */
  height: number;
  /** Left offset in real px that centres the drawn canvas. */
  left: number;
  /** Top offset in real px. Zero unless the window is taller than the canvas. */
  top: number;
};

export function canvasFit(vw: number, vh: number): CanvasFit {
  const widthScale = Math.min(vw / DESIGN_W, MAX_SCALE);
  // What the page offers in design px once the artboard fills the width.
  const pageH = vh / widthScale;
  const deficit = Math.min(Math.max(0, DESIGN_H - pageH), MAX_DEFICIT);
  const height = DESIGN_H - deficit;
  // Equal to widthScale unless the deficit hit its cap.
  const scale = Math.min(widthScale, vh / height);

  return {
    scale,
    deficit,
    height,
    left: Math.max(0, (vw - DESIGN_W * scale) / 2),
    // Centred against the real window height. Clamping the height first would
    // centre a tall desktop window against the clamp instead of the window.
    top: Math.max(0, (vh - height * scale) / 2),
  };
}

/**
 * The same fit, as a script the browser runs while it is still parsing the
 * html — before React, and before the canvas below it is painted.
 *
 * Why it exists: AppScaler's effect runs after hydration, and on a phone that
 * is late. The first paint was the server html, a 932 px canvas at scale 1
 * drawn off the bottom of the screen, and when React mounted the canvas shrank
 * and everything on it jumped. On a 430 x 745 phone the centre logo moved 85 px.
 *
 * It writes the five `:root` variables the canvas and the effect read, as one
 * `<style>` rule appended to `<head>`, and nothing else. The effect then sets
 * the same numbers inline on `:root`, which is not a visible change.
 *
 * A stylesheet rule, not an inline style on `<html>`: React owns the `<html>`
 * element and reports a hydration mismatch when its `style` attribute holds
 * something React did not render. An extra `<style>` in `<head>` is a node
 * React 19 skips over, so nothing is reported.
 *
 * It repeats the arithmetic of `canvasFit` on purpose: the function above is
 * a module import and cannot run before the bundle. The two are held together
 * by `tests/scaling/appScaler.test.tsx`, which runs this script and compares.
 */
export const CANVAS_FIT_STYLE_ID = 'app-canvas-fit';

export const CANVAS_FIT_SCRIPT =
  '(function(){' +
  'var w=window.innerWidth,h=window.innerHeight;' +
  `var ws=Math.min(w/${DESIGN_W},${MAX_SCALE});` +
  `var d=Math.min(Math.max(0,${DESIGN_H}-h/ws),${MAX_DEFICIT});` +
  `var ch=${DESIGN_H}-d;` +
  'var s=Math.min(ws,h/ch);' +
  `var e=document.getElementById('${CANVAS_FIT_STYLE_ID}');` +
  `if(!e){e=document.createElement('style');e.id='${CANVAS_FIT_STYLE_ID}';document.head.appendChild(e);}` +
  "e.textContent=':root{--app-scale:'+s+';" +
  `--app-canvas-left:'+Math.max(0,(w-${DESIGN_W}*s)/2)+'px;` +
  "--app-canvas-top:'+Math.max(0,(h-ch*s)/2)+'px;" +
  "--app-canvas-height:'+(ch*s)+'px;" +
  "--xd-flex-deficit:'+d+'px}';" +
  '})()';

/**
 * keyboardLift — how far the canvas moves up so a focused field clears the
 * keyboard.
 *
 * Both numbers are real px of the layout viewport: `fieldBottom` is the
 * field's bottom edge as if the canvas were NOT lifted, `visibleBottom` is the
 * bottom of what the keyboard leaves visible (`visualViewport.offsetTop +
 * visualViewport.height`, or `innerHeight` when there is no visualViewport).
 * The answer is 0 whenever the field already clears the keyboard by
 * KEYBOARD_GAP — so on a desktop, or with no keyboard, nothing moves.
 */
export function keyboardLift(fieldBottom: number, visibleBottom: number): number {
  return Math.max(0, fieldBottom + KEYBOARD_GAP - visibleBottom);
}
