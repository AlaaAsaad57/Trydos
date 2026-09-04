// The arithmetic behind the design canvas, on its own.
//
// The fault this file guards: on an iPhone in Safari the browser bars take
// about 190 px of the screen, so the page is ~745 px tall, not 932. The old
// rule (fit the whole 932 px artboard) then drew everything at 80% — the
// buttons were narrow, the logo small, and a 43 px white margin sat on each
// side. The client compared that against the full-screen design and saw a
// different app.
//
// The rule now: the artboard always fills the WIDTH. The height the page does
// not have is published as `--xd-flex-deficit` (design px), and the screens
// move their bottom cluster up by that amount. Only when the page is shorter
// than the artboard minus MAX_DEFICIT does the canvas shrink as well.
import { describe, expect, it } from 'vitest';

import { canvasFit, keyboardLift } from 'scaling/canvasFit';
import { DESIGN_H, DESIGN_W, KEYBOARD_GAP, MAX_DEFICIT, MAX_SCALE } from 'scaling/scale.config';

/** What the page offers in design px once the artboard fills the width. */
const pageDesignH = (vw: number, vh: number) => vh / Math.min(vw / DESIGN_W, MAX_SCALE);

/**
 * `vh` is the height the PAGE gets, not the height of the screen. On iOS the
 * browser bars take about 190 px of a 932 px screen.
 */
const DEVICES = [
  { name: 'the artboard itself', vw: 430, vh: 932, scale: 1, deficit: 0 },
  {
    name: 'iPhone 15 Pro Max in Safari',
    vw: 430,
    vh: 745,
    scale: 1,
    deficit: DESIGN_H - 745,
  },
  {
    name: 'iPhone 15 Pro in Safari',
    vw: 393,
    vh: 682,
    scale: 393 / DESIGN_W,
    deficit: DESIGN_H - pageDesignH(393, 682),
  },
  {
    name: 'iPhone 13 in Safari',
    vw: 390,
    vh: 675,
    scale: 390 / DESIGN_W,
    deficit: DESIGN_H - pageDesignH(390, 675),
  },
  {
    // Full screen, but 390 wide: at scale 0.907 the 844 px page is 930.6 design px.
    name: 'iPhone 13 full screen',
    vw: 390,
    vh: 844,
    scale: 390 / DESIGN_W,
    deficit: DESIGN_H - pageDesignH(390, 844),
  },
  {
    // Too short even after the gaps give up MAX_DEFICIT: the canvas shrinks too.
    name: 'iPhone SE',
    vw: 375,
    vh: 534,
    scale: 534 / (DESIGN_H - MAX_DEFICIT),
    deficit: MAX_DEFICIT,
  },
  {
    name: 'iPad mini portrait',
    vw: 744,
    vh: 1020,
    scale: MAX_SCALE,
    deficit: DESIGN_H - pageDesignH(744, 1020),
  },
  { name: 'iPad Pro 12.9 portrait', vw: 1024, vh: 1229, scale: MAX_SCALE, deficit: 0 },
  {
    name: 'iPad Air landscape',
    vw: 1180,
    vh: 738,
    scale: 738 / (DESIGN_H - MAX_DEFICIT),
    deficit: MAX_DEFICIT,
  },
  {
    name: 'a laptop window',
    vw: 1440,
    vh: 810,
    scale: 810 / (DESIGN_H - MAX_DEFICIT),
    deficit: MAX_DEFICIT,
  },
  {
    name: 'a desktop window',
    vw: 1920,
    vh: 972,
    scale: MAX_SCALE,
    deficit: DESIGN_H - pageDesignH(1920, 972),
  },
  { name: 'a large desktop window', vw: 2560, vh: 1296, scale: MAX_SCALE, deficit: 0 },
  { name: 'a narrow window', vw: 320, vh: 932, scale: 320 / DESIGN_W, deficit: 0 },
] as const;

describe('canvasFit fills the width and hands the missing height to the screens', () => {
  for (const device of DEVICES) {
    it(`${device.name} (${device.vw} x ${device.vh})`, () => {
      const fit = canvasFit(device.vw, device.vh);

      expect(
        fit.scale,
        `${device.name} (${device.vw} x ${device.vh}): the scale must be ${device.scale.toFixed(4)}, it is ${fit.scale.toFixed(4)}`,
      ).toBeCloseTo(device.scale, 4);

      expect(
        fit.deficit,
        `${device.name} (${device.vw} x ${device.vh}): the screens must move their bottom cluster up by ${device.deficit.toFixed(1)} design px, the deficit is ${fit.deficit.toFixed(1)}`,
      ).toBeCloseTo(device.deficit, 2);

      expect(
        fit.height,
        `${device.name} (${device.vw} x ${device.vh}): the canvas must be ${(DESIGN_H - device.deficit).toFixed(1)} design px tall (the artboard minus the deficit), it is ${fit.height.toFixed(1)}`,
      ).toBeCloseTo(DESIGN_H - device.deficit, 2);

      expect(
        DESIGN_W * fit.scale,
        `${device.name} (${device.vw} x ${device.vh}): the drawn canvas is ${(DESIGN_W * fit.scale).toFixed(1)} px wide and must not be wider than the ${device.vw} px window`,
      ).toBeLessThanOrEqual(device.vw + 0.001);

      expect(
        fit.height * fit.scale,
        `${device.name} (${device.vw} x ${device.vh}): the drawn canvas is ${(fit.height * fit.scale).toFixed(1)} px tall and must not be taller than the ${device.vh} px page, or the bottom of the design is cut off`,
      ).toBeLessThanOrEqual(device.vh + 0.001);

      expect(
        fit.left,
        `${device.name} (${device.vw} x ${device.vh}): the canvas must be centred, so its left must be ${((device.vw - DESIGN_W * fit.scale) / 2).toFixed(1)}, it is ${fit.left.toFixed(1)}`,
      ).toBeCloseTo((device.vw - DESIGN_W * fit.scale) / 2, 3);

      expect(
        fit.top,
        `${device.name} (${device.vw} x ${device.vh}): the canvas must be centred in the real window height, so its top must be ${Math.max(0, (device.vh - fit.height * fit.scale) / 2).toFixed(1)}, it is ${fit.top.toFixed(1)}`,
      ).toBeCloseTo(Math.max(0, (device.vh - fit.height * fit.scale) / 2), 3);
    });
  }

  it('fills the whole width of a phone in Safari, so nothing is drawn smaller than the design', () => {
    // The client's screenshot: 430 wide, ~745 tall once Safari's bars are out.
    const fit = canvasFit(430, 745);

    expect(
      DESIGN_W * fit.scale,
      `430 x 745: the canvas must be the full 430 px wide (no white margin at the sides), it is ${(DESIGN_W * fit.scale).toFixed(1)}`,
    ).toBeCloseTo(430, 3);
    expect(
      fit.left,
      `430 x 745: there must be no white margin at the left, it is ${fit.left.toFixed(1)} px`,
    ).toBe(0);
  });

  it('never grows past MAX_SCALE, however big the screen', () => {
    const fit = canvasFit(5000, 5000);

    expect(
      fit.scale,
      `a 5000 x 5000 window: the scale must stop at MAX_SCALE (${MAX_SCALE.toFixed(4)}), it is ${fit.scale.toFixed(4)}`,
    ).toBeCloseTo(MAX_SCALE, 6);

    expect(
      DESIGN_W * fit.scale,
      `a 5000 x 5000 window: the canvas must never be drawn wider than 500 px, it is ${(DESIGN_W * fit.scale).toFixed(1)}`,
    ).toBeCloseTo(500, 6);
  });

  it('never asks the screens for more than MAX_DEFICIT, so the bottom cluster cannot climb into the head', () => {
    const fit = canvasFit(430, 300);

    expect(
      fit.deficit,
      `430 x 300: the deficit must stop at MAX_DEFICIT (${MAX_DEFICIT}), it is ${fit.deficit.toFixed(1)}`,
    ).toBe(MAX_DEFICIT);
    expect(
      fit.height * fit.scale,
      `430 x 300: past the cap the canvas must shrink to the 300 px page, it is drawn ${(fit.height * fit.scale).toFixed(1)} px tall`,
    ).toBeCloseTo(300, 3);
  });
});

describe('keyboardLift: how far the canvas moves up so a focused field clears the keyboard', () => {
  // A web page cannot shrink the phone's keyboard, so the canvas slides up
  // instead. Every number is real px of the layout viewport: the field's
  // bottom edge, and the bottom of what the keyboard leaves visible
  // (visualViewport.offsetTop + visualViewport.height).
  it('lifts by the overlap plus the gap when the field sits under the keyboard', () => {
    // iPhone 15 Pro Max in Safari: field box ends at 563, keyboard leaves 445.
    expect(
      keyboardLift(563, 445),
      `field bottom 563 with 445 px visible must lift by 563 + ${KEYBOARD_GAP} - 445 = ${563 + KEYBOARD_GAP - 445}`,
    ).toBe(563 + KEYBOARD_GAP - 445);
  });

  it('does not lift when the field is already above the keyboard', () => {
    expect(keyboardLift(300, 445), 'a field ending at 300 with 445 px visible needs no lift').toBe(0);
  });

  it('does not lift when there is no keyboard (desktop, or the field is already clear by the gap)', () => {
    expect(keyboardLift(563, 932), 'the full 932 px page is visible, so the lift must be 0').toBe(0);
    expect(
      keyboardLift(563, 563 + KEYBOARD_GAP),
      'the field clears the keyboard by exactly the gap, so the lift must be 0',
    ).toBe(0);
  });
});
