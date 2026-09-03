import { DESIGN_H, DESIGN_W, MAX_SCALE } from './scale.config';

/**
 * canvasFit — where the design canvas goes, and how big it is drawn.
 *
 * The rule is one line: draw the whole 430 x 932 artboard, at one scale, in the
 * middle of the window. Nothing is ever cut off and nothing is ever reshaped, so
 * every element stays exactly where the XD file puts it, whatever the screen.
 *
 * Why it is a plain function and not part of the component: this is the only
 * arithmetic in the scaling system, and the fault it replaced (a two-phase
 * engine that squeezed the layout on a short screen) was impossible to check
 * without a browser. A function takes two numbers and returns three, so
 * `tests/scaling/canvasFit.test.ts` can walk real device sizes in a few
 * milliseconds.
 *
 * The three limits, in order:
 *   - vw / DESIGN_W  — the artboard must fit the width
 *   - vh / DESIGN_H  — and the height
 *   - MAX_SCALE      — and it never grows past 500 px wide, however big the
 *                      screen, because the design is a phone layout
 *
 * `vh` is the page height the browser reports, not the height of the phone
 * screen. On iOS the browser bars take about 190 px of a 932 px screen, and the
 * decision (with the designer) is to fit what the page really has rather than
 * draw part of the design behind a bar.
 */
export type CanvasFit = {
  /** The single `transform: scale()` factor for the canvas. */
  scale: number;
  /** Left offset in real px that centres the drawn canvas. */
  left: number;
  /** Top offset in real px. Zero unless the window is taller than the canvas. */
  top: number;
};

export function canvasFit(vw: number, vh: number): CanvasFit {
  const scale = Math.min(vw / DESIGN_W, vh / DESIGN_H, MAX_SCALE);

  return {
    scale,
    left: Math.max(0, (vw - DESIGN_W * scale) / 2),
    // Centred against the real window height. Clamping the height first would
    // centre a tall desktop window against the clamp instead of the window.
    top: Math.max(0, (vh - DESIGN_H * scale) / 2),
  };
}
