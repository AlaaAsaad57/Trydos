// The arithmetic behind the design canvas, on its own.
//
// This is a regression guard, not the proof. The fault it protects — a short
// screen reshaping the layout instead of shrinking it, and a wide window
// over-scaling past MAX_SCALE — was confirmed by
// tests/scaling/appScaler.test.tsx, which was seen red against the old
// two-phase engine. This file locks the numbers for the real devices the app
// runs on, so a change to the maths names the device it broke.
import { describe, expect, it } from 'vitest';

import { canvasFit } from 'scaling/canvasFit';
import { DESIGN_H, DESIGN_W, MAX_SCALE } from 'scaling/scale.config';

/**
 * `vh` is the height the PAGE gets, not the height of the screen. On iOS the
 * browser bars take about 190 px of a 932 px screen, and the design decision is
 * to fit the page, so nothing is ever drawn behind a bar.
 */
const DEVICES = [
  { name: 'the artboard itself', vw: 430, vh: 932, scale: 1 },
  { name: 'iPhone SE', vw: 375, vh: 534, scale: 534 / DESIGN_H },
  { name: 'iPhone 13 in Safari', vw: 390, vh: 675, scale: 675 / DESIGN_H },
  { name: 'iPhone 15 Pro in Safari', vw: 393, vh: 682, scale: 682 / DESIGN_H },
  { name: 'iPhone 15 Pro Max in Safari', vw: 430, vh: 745, scale: 745 / DESIGN_H },
  { name: 'iPad mini portrait', vw: 744, vh: 1020, scale: 1020 / DESIGN_H },
  { name: 'iPad Air portrait', vw: 820, vh: 1062, scale: 1062 / DESIGN_H },
  { name: 'iPad Pro 12.9 portrait', vw: 1024, vh: 1229, scale: MAX_SCALE },
  { name: 'iPad Air landscape', vw: 1180, vh: 738, scale: 738 / DESIGN_H },
  { name: 'a laptop window', vw: 1440, vh: 810, scale: 810 / DESIGN_H },
  { name: 'a desktop window', vw: 1920, vh: 972, scale: 972 / DESIGN_H },
  { name: 'a large desktop window', vw: 2560, vh: 1296, scale: MAX_SCALE },
  { name: 'a narrow window', vw: 320, vh: 932, scale: 320 / DESIGN_W },
] as const;

describe('canvasFit draws the whole artboard at one scale', () => {
  for (const device of DEVICES) {
    it(`${device.name} (${device.vw} x ${device.vh})`, () => {
      const fit = canvasFit(device.vw, device.vh);

      expect(
        fit.scale,
        `${device.name} (${device.vw} x ${device.vh}): the scale must be ${device.scale.toFixed(4)}, it is ${fit.scale.toFixed(4)}`,
      ).toBeCloseTo(device.scale, 4);

      expect(
        DESIGN_W * fit.scale,
        `${device.name} (${device.vw} x ${device.vh}): the drawn canvas is ${(DESIGN_W * fit.scale).toFixed(1)} px wide and must not be wider than the ${device.vw} px window`,
      ).toBeLessThanOrEqual(device.vw + 0.001);

      expect(
        DESIGN_H * fit.scale,
        `${device.name} (${device.vw} x ${device.vh}): the drawn canvas is ${(DESIGN_H * fit.scale).toFixed(1)} px tall and must not be taller than the ${device.vh} px page, or the bottom of the design is cut off`,
      ).toBeLessThanOrEqual(device.vh + 0.001);

      expect(
        fit.left,
        `${device.name} (${device.vw} x ${device.vh}): the canvas must be centred, so its left must be ${((device.vw - DESIGN_W * fit.scale) / 2).toFixed(1)}, it is ${fit.left.toFixed(1)}`,
      ).toBeCloseTo((device.vw - DESIGN_W * fit.scale) / 2, 3);

      expect(
        fit.top,
        `${device.name} (${device.vw} x ${device.vh}): the canvas must be centred in the real window height, so its top must be ${((device.vh - DESIGN_H * fit.scale) / 2).toFixed(1)}, it is ${fit.top.toFixed(1)}`,
      ).toBeCloseTo((device.vh - DESIGN_H * fit.scale) / 2, 3);
    });
  }

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

  it('does not reshape a short screen — every design px keeps its place', () => {
    // The old engine kept the full 430 width here and handed the missing 187 px
    // of height to --xd-flex-deficit, which squeezed the layout by 182 px.
    const fit = canvasFit(430, 745);

    expect(
      DESIGN_H * fit.scale,
      `430 x 745: the whole 932 design px must be drawn inside the 745 px page, so the canvas must be ${(745).toFixed(1)} px tall, it is ${(DESIGN_H * fit.scale).toFixed(1)}`,
    ).toBeCloseTo(745, 3);

    expect(
      DESIGN_W * fit.scale,
      `430 x 745: the width must shrink with the height, so the canvas must be ${(DESIGN_W * (745 / DESIGN_H)).toFixed(1)} px wide, not the full 430`,
    ).toBeCloseTo(DESIGN_W * (745 / DESIGN_H), 3);
  });
});
