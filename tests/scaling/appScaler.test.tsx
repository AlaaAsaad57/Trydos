// AppScaler must draw the 430 x 932 artboard whole, at one scale, on every
// viewport.
//
// The designer's complaint is that the new login does not respect his spaces.
// Two faults in this file cause it, and both are checked here:
//
//   1. On a short screen the canvas RESHAPES instead of shrinking. It keeps the
//      full width, then hands the missing height to `--xd-flex-deficit`, and
//      every FlexibleSpace on the page collapses by its own share. On an iPhone
//      running Safari (430 x 745 of visible page) the deficit reaches its 182
//      cap and the layout ends up about 110 design px away from the XD file.
//   2. On a tall wide window the landscape branch scales by height alone, with
//      no MAX_SCALE cap, so the canvas is drawn wider than the 500 px limit the
//      rest of the system promises.
//
// Everything AppScaler decides is written straight onto element styles and onto
// two :root variables, so jsdom can read the answer without any real layout.
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import AppScaler from 'scaling/AppScaler';
import { DESIGN_H, DESIGN_W, MAX_SCALE } from 'scaling/scale.config';

/** Put jsdom's window at a given size, plus the screen facts a phone reports. */
function setViewport(
  vw: number,
  vh: number,
  screen?: { availHeight: number; devicePixelRatio: number },
) {
  Object.defineProperty(window, 'innerWidth', { value: vw, configurable: true, writable: true });
  Object.defineProperty(window, 'innerHeight', { value: vh, configurable: true, writable: true });
  Object.defineProperty(window.screen, 'availHeight', {
    value: screen ? screen.availHeight : vh,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(window, 'devicePixelRatio', {
    value: screen ? screen.devicePixelRatio : 1,
    configurable: true,
    writable: true,
  });
}

/** Mount the scaler at one viewport and read back what it decided. */
function mountAt(
  vw: number,
  vh: number,
  screen?: { availHeight: number; devicePixelRatio: number },
) {
  setViewport(vw, vh, screen);
  const { container } = render(
    <AppScaler>
      <div data-testid="content" />
    </AppScaler>,
  );
  const canvas = container.querySelector<HTMLElement>('#master-canvas');
  if (!canvas) throw new Error('AppScaler rendered no #master-canvas element');
  const root = document.documentElement.style;
  return {
    canvas,
    scale: Number(root.getPropertyValue('--app-scale')),
    deficit: root.getPropertyValue('--xd-flex-deficit').trim(),
    canvasTop: root.getPropertyValue('--app-canvas-top').trim(),
    canvasHeight: root.getPropertyValue('--app-canvas-height').trim(),
    height: canvas.style.height,
    left: Number.parseFloat(canvas.style.left),
    top: Number.parseFloat(canvas.style.top || '0'),
  };
}

afterEach(() => {
  document.documentElement.style.removeProperty('--app-scale');
  document.documentElement.style.removeProperty('--xd-flex-deficit');
  document.documentElement.style.removeProperty('--app-canvas-top');
  document.documentElement.style.removeProperty('--app-canvas-height');
  document.getElementById('xd-outer-bg')?.remove();
});

/**
 * One row per real device. `scale` is min(vw/430, vh/932, MAX_SCALE) — the whole
 * artboard, shrunk to fit, never stretched past the 500 px width limit.
 */
const VIEWPORTS = [
  {
    name: 'a window the exact size of the artboard',
    vw: 430,
    vh: 932,
    scale: 1,
    why: 'the design canvas must render 1:1',
  },
  {
    name: 'iPhone Pro Max in Safari',
    vw: 430,
    vh: 745,
    scale: 745 / DESIGN_H,
    why: 'a short screen must shrink the whole artboard, not reshape it',
  },
  {
    name: 'iPhone 13',
    vw: 390,
    vh: 844,
    scale: 844 / DESIGN_H,
    why: 'height is the tighter limit here, so height must win',
  },
  {
    name: 'iPhone SE',
    vw: 375,
    vh: 534,
    scale: 534 / DESIGN_H,
    why: 'the shortest phone must still draw the whole artboard',
  },
  {
    name: 'a laptop window',
    vw: 1440,
    vh: 900,
    scale: 900 / DESIGN_H,
    why: 'a wide window is limited by its height',
  },
  {
    name: 'a large desktop window',
    vw: 2000,
    vh: 3000,
    scale: MAX_SCALE,
    why: 'the canvas must stop at MAX_SCALE and never over-scale',
  },
] as const;

describe('AppScaler draws the whole artboard at one scale', () => {
  for (const view of VIEWPORTS) {
    it(`${view.name} (${view.vw} x ${view.vh}): ${view.why}`, () => {
      const got = mountAt(view.vw, view.vh);

      expect(
        got.scale,
        `${view.name} (${view.vw} x ${view.vh}): ${view.why} — the scale must be ${view.scale.toFixed(4)}, it is ${got.scale.toFixed(4)}`,
      ).toBeCloseTo(view.scale, 4);

      expect(
        got.deficit,
        `${view.name} (${view.vw} x ${view.vh}): every FlexibleSpace must keep its full design size, so --xd-flex-deficit must be 0px, it is ${got.deficit}`,
      ).toBe('0px');

      expect(
        got.height,
        `${view.name} (${view.vw} x ${view.vh}): the canvas box must stay ${DESIGN_H} design px tall and be scaled, it is ${got.height}`,
      ).toBe(`${DESIGN_H}px`);
    });
  }

  it('centres the canvas horizontally, and vertically when the window is taller than the scaled artboard', () => {
    const got = mountAt(2000, 3000);
    const drawnW = DESIGN_W * MAX_SCALE;
    const drawnH = DESIGN_H * MAX_SCALE;

    expect(
      got.left,
      `2000 x 3000: the canvas is ${drawnW.toFixed(1)} px wide, so its left must be ${((2000 - drawnW) / 2).toFixed(1)}, it is ${got.left}`,
    ).toBeCloseTo((2000 - drawnW) / 2, 1);

    expect(
      got.top,
      `2000 x 3000: the canvas is ${drawnH.toFixed(1)} px tall in a 3000 px window, so its top must be ${((3000 - drawnH) / 2).toFixed(1)} — centring against a clamped height would put it at ${((1200 - drawnH) / 2).toFixed(1)}`,
    ).toBeCloseTo((3000 - drawnH) / 2, 1);
  });

  it('publishes where the drawn canvas is, for anything portaled out of it', () => {
    // The QR sheet is portaled to <body>, so it is outside #master-canvas. It
    // used to size itself with 100dvh, which was the canvas height only while
    // the canvas filled the window. It does not on a tall screen, so AppScaler
    // has to say where the canvas really is.
    const got = mountAt(1024, 1229);
    const drawnH = DESIGN_H * MAX_SCALE;

    expect(
      got.canvasHeight,
      `iPad Pro portrait (1024 x 1229): --app-canvas-height must be the drawn canvas height ${drawnH.toFixed(1)}px, it is ${got.canvasHeight}`,
    ).toBe(`${drawnH}px`);

    expect(
      got.canvasTop,
      `iPad Pro portrait (1024 x 1229): --app-canvas-top must be ${((1229 - drawnH) / 2).toFixed(1)}px, so a portaled sheet lands on the canvas and not on the window, it is ${got.canvasTop}`,
    ).toBe(`${(1229 - drawnH) / 2}px`);
  });

  it('ignores the phone screen height and uses the page the browser actually gives', () => {
    // A real iPhone Pro Max: the screen is 932 CSS px tall, Safari's bars leave
    // 745 for the page, and the device pixel ratio is 3. The old guard tried to
    // treat the screen height as the real one, but divided an already-CSS-px
    // number by the ratio, so it never fired. The design decision is to ignore
    // the bars entirely and fit what the page really has.
    const got = mountAt(430, 745, { availHeight: 932, devicePixelRatio: 3 });

    expect(
      got.scale,
      `430 x 745 with a 932 px screen: the fit must use the 745 px page, so the scale must be ${(745 / DESIGN_H).toFixed(4)}, it is ${got.scale.toFixed(4)}`,
    ).toBeCloseTo(745 / DESIGN_H, 4);
  });
});
