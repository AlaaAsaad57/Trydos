// AppScaler must fill the width of every viewport with the 430-wide artboard,
// and hand the height the page does not have to the screens.
//
// The client's complaint: on an iPhone in Safari (430 x 745 of visible page)
// the whole app looked smaller than the design. The canvas was fitting the
// full 932 px artboard into the 745 px page, so everything was drawn at 80%
// with a 43 px white margin on each side. Two things are checked here:
//
//   1. The canvas is always the full width (up to MAX_SCALE). The missing
//      height goes to `--xd-flex-deficit`, capped at MAX_DEFICIT, and the
//      canvas box is `932px - deficit` tall so it still fits the page.
//   2. On a tall wide window the canvas is never drawn wider than the 500 px
//      limit the rest of the system promises.
//
// Everything AppScaler decides is written straight onto element styles and onto
// two :root variables, so jsdom can read the answer without any real layout.
import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';

import AppScaler from 'scaling/AppScaler';
import { CANVAS_FIT_STYLE_ID, canvasFit } from 'scaling/canvasFit';
import { DESIGN_H, DESIGN_W, MAX_DEFICIT, MAX_SCALE } from 'scaling/scale.config';

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
    // The canvas reads its place from these two variables (see the
    // pre-hydration test below), so they are the answer, not the element style.
    left: Number.parseFloat(root.getPropertyValue('--app-canvas-left')),
    top: Number.parseFloat(root.getPropertyValue('--app-canvas-top') || '0'),
  };
}

afterEach(() => {
  document.documentElement.style.removeProperty('--app-scale');
  document.documentElement.style.removeProperty('--xd-flex-deficit');
  document.documentElement.style.removeProperty('--app-canvas-left');
  document.documentElement.style.removeProperty('--app-canvas-top');
  document.documentElement.style.removeProperty('--app-canvas-height');
  document.getElementById('xd-outer-bg')?.remove();
  document.getElementById(CANVAS_FIT_STYLE_ID)?.remove();
});

/** Serve AppScaler at one viewport and run its pre-hydration script, as a browser would. */
function runFitScript(vw: number, vh: number) {
  setViewport(vw, vh);
  const html = renderToString(
    <AppScaler>
      <div />
    </AppScaler>,
  );
  const scriptAt = html.indexOf('<script');
  if (scriptAt < 0) return { html, rule: '' };
  new Function(html.slice(html.indexOf('>', scriptAt) + 1, html.indexOf('</script>')))();
  return { html, rule: document.getElementById(CANVAS_FIT_STYLE_ID)?.textContent ?? '' };
}

/** One variable out of the rule the script wrote. */
const fromRule = (rule: string, name: string) =>
  rule.match(new RegExp(`${name}:([^;}]+)`))?.[1] ?? '';

/**
 * One row per real device. `scale` is min(vw/430, MAX_SCALE) — the full width —
 * unless the page is shorter than `932 - MAX_DEFICIT` design px, when the canvas
 * shrinks as well. `deficit` is the design px the screens give up.
 */
const VIEWPORTS = [
  {
    name: 'a window the exact size of the artboard',
    vw: 430,
    vh: 932,
    scale: 1,
    deficit: 0,
    why: 'the design canvas must render 1:1',
  },
  {
    name: 'iPhone Pro Max in Safari',
    vw: 430,
    vh: 745,
    scale: 1,
    deficit: DESIGN_H - 745,
    why: 'the client sees the full-width design, and the screens give up the 187 px Safari took',
  },
  {
    name: 'iPhone 13',
    vw: 390,
    vh: 844,
    scale: 390 / DESIGN_W,
    deficit: DESIGN_H - (844 * DESIGN_W) / 390,
    why: 'the width sets the scale, and the page is 1.4 design px short',
  },
  {
    name: 'iPhone SE',
    vw: 375,
    vh: 534,
    scale: 534 / (DESIGN_H - MAX_DEFICIT),
    deficit: MAX_DEFICIT,
    why: 'the shortest phone hits MAX_DEFICIT, so the canvas shrinks as well',
  },
  {
    name: 'a laptop window',
    vw: 1440,
    vh: 900,
    scale: MAX_SCALE,
    deficit: DESIGN_H - 900 / MAX_SCALE,
    why: 'a wide window is drawn at MAX_SCALE and gives up what its height lacks',
  },
  {
    name: 'a large desktop window',
    vw: 2000,
    vh: 3000,
    scale: MAX_SCALE,
    deficit: 0,
    why: 'the canvas must stop at MAX_SCALE and never over-scale',
  },
] as const;

describe('AppScaler fills the width and hands the missing height to the screens', () => {
  for (const view of VIEWPORTS) {
    it(`${view.name} (${view.vw} x ${view.vh}): ${view.why}`, () => {
      const got = mountAt(view.vw, view.vh);

      expect(
        got.scale,
        `${view.name} (${view.vw} x ${view.vh}): ${view.why} — the scale must be ${view.scale.toFixed(4)}, it is ${got.scale.toFixed(4)}`,
      ).toBeCloseTo(view.scale, 4);

      expect(
        Number.parseFloat(got.deficit),
        `${view.name} (${view.vw} x ${view.vh}): --xd-flex-deficit must be ${view.deficit.toFixed(1)}px so the bottom cluster moves up by exactly what the page lacks, it is ${got.deficit}`,
      ).toBeCloseTo(view.deficit, 2);

      expect(
        got.height,
        `${view.name} (${view.vw} x ${view.vh}): the canvas box must be ${DESIGN_H}px minus the deficit, read from --xd-flex-deficit, it is ${got.height}`,
      ).toBe(`calc(${DESIGN_H}px - var(--xd-flex-deficit, 0px))`);
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
    // 745 for the page, and the device pixel ratio is 3. An old guard tried to
    // treat the screen height as the real one, but divided an already-CSS-px
    // number by the ratio, so it never fired. The page height is what counts:
    // the deficit must be the 187 px the bars took, not 0.
    const got = mountAt(430, 745, { availHeight: 932, devicePixelRatio: 3 });

    expect(
      Number.parseFloat(got.deficit),
      `430 x 745 with a 932 px screen: the fit must use the 745 px page, so the deficit must be ${DESIGN_H - 745}, it is ${got.deficit}`,
    ).toBeCloseTo(DESIGN_H - 745, 2);
    expect(
      got.canvasHeight,
      `430 x 745 with a 932 px screen: the drawn canvas must be the 745 px page, it is ${got.canvasHeight}`,
    ).toBe('745px');
  });
});

describe('AppScaler applies the fit before React hydrates', () => {
  /**
   * The fit used to be computed in an effect only, so the first paint was the
   * server html: a 932 px canvas at scale 1, drawn off the bottom of a phone.
   * When React mounted, the canvas shrank and everything on it jumped. On a
   * 430 x 745 phone the centre logo moved 85 px up and the whole page changed
   * size in front of the shopper.
   *
   * The fix is a plain script served ahead of the canvas that writes the same
   * variables the effect writes, so the browser scales the canvas as it parses
   * the html and hydration changes nothing. The canvas must read those
   * variables, and the script and canvasFit must agree, or the jump comes back.
   */
  it('serves a script ahead of the canvas that writes the same fit the effect will write', () => {
    const { html, rule } = runFitScript(430, 745);

    const scriptAt = html.indexOf('<script');
    const canvasAt = html.indexOf('id="master-canvas"');
    expect(
      scriptAt,
      'AppScaler serves no inline script, so the first paint is the unscaled 932 px canvas and the whole page jumps when React mounts',
    ).toBeGreaterThan(-1);
    expect(
      scriptAt,
      'the fit script comes after the canvas in the html, so the browser can paint the canvas at scale 1 before the script has run',
    ).toBeLessThan(canvasAt);
    expect(
      html,
      'the canvas transform does not read --app-scale, so the script has nothing to scale',
    ).toMatch(/transform:\s*scale\(var\(--app-scale/);

    // The values go into a stylesheet rule, never onto the <html> element:
    // React owns <html> and reports any style it did not render itself.
    expect(
      document.documentElement.getAttribute('style') ?? '',
      'the script wrote onto the <html> element, which React owns — React reports a hydration mismatch for it on every load',
    ).not.toContain('--app-scale');
    expect(rule, 'the script wrote no :root rule into <head>, so the canvas has nothing to read before hydration').toContain(':root{');

    const fit = canvasFit(430, 745);
    expect(
      Number(fromRule(rule, '--app-scale')),
      `430 x 745: the script set --app-scale to ${fromRule(rule, '--app-scale')}, canvasFit says ${fit.scale}`,
    ).toBeCloseTo(fit.scale, 6);
    expect(
      fromRule(rule, '--app-canvas-left'),
      '430 x 745: the script and canvasFit disagree on where the canvas starts from the left',
    ).toBe(`${fit.left}px`);
    expect(
      fromRule(rule, '--app-canvas-top'),
      '430 x 745: the script and canvasFit disagree on where the canvas starts from the top',
    ).toBe(`${fit.top}px`);
    expect(
      fromRule(rule, '--app-canvas-height'),
      '430 x 745: the script and canvasFit disagree on the drawn canvas height',
    ).toBe(`${fit.height * fit.scale}px`);
    expect(
      fromRule(rule, '--xd-flex-deficit'),
      '430 x 745: the script and canvasFit disagree on the deficit, so the bottom cluster would jump at hydration',
    ).toBe(`${fit.deficit}px`);
  });

  it('the effect writes exactly what the script wrote, so hydration moves nothing', () => {
    // Run the script first, as the browser would, then mount. If the effect
    // wrote a different number the canvas would move at hydration.
    const { rule } = runFitScript(390, 844);
    const before = {
      scale: fromRule(rule, '--app-scale'),
      left: fromRule(rule, '--app-canvas-left'),
      top: fromRule(rule, '--app-canvas-top'),
    };

    const got = mountAt(390, 844);

    expect(
      String(got.scale),
      `390 x 844: the effect changed --app-scale from ${before.scale} to ${got.scale} after the script had set it`,
    ).toBe(before.scale);
    expect(
      `${got.left}px`,
      `390 x 844: the effect changed --app-canvas-left from ${before.left} after the script had set it`,
    ).toBe(before.left);
    expect(
      `${got.top}px`,
      `390 x 844: the effect changed --app-canvas-top from ${before.top} after the script had set it`,
    ).toBe(before.top);
  });
});
