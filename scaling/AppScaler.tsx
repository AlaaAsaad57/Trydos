'use client';

import React, { useEffect, useRef } from 'react';

import { canvasFit } from './canvasFit';
import {
  DESIGN_H,
  DESIGN_W,
  MAX_SCALE,
  MIN_SCALE,
  OUTER_BG,
} from './scale.config';

/**
 * AppScaler — draws the design canvas.
 *
 * The canvas is always the full 430 x 932 artboard. One `transform: scale()`
 * fits it to the window, and it is centred in whatever room is left. There is
 * one code path: no portrait branch, no landscape branch, no threshold to fall
 * either side of.
 *
 * What this replaced, and why
 * ---------------------------
 * The old engine had two phases and two branches. On a screen shorter than the
 * design it kept the full width and handed the missing height to a CSS variable
 * (`--xd-flex-deficit`); every `FlexibleSpace` on the page then gave up its own
 * `share` of that number. On an iPhone in Safari the page is about 745 px tall,
 * the deficit reached its 182 px cap, and the layout ended up roughly 110 design
 * px away from the XD file. The designer was looking at that phone.
 *
 * A second branch scaled by height alone once the window got wide, with no
 * MAX_SCALE cap, so a large desktop drew the canvas past the 500 px width the
 * rest of the system promises.
 *
 * `--xd-flex-deficit` is still set, and is now always `0px`. `FlexibleSpace`
 * keeps its API and simply returns its `size`, so every `share=` value on every
 * screen stops mattering without a single call site changing.
 *
 * Only one `<Page variant="scaled">` may be mounted at a time: the element ids
 * and the `:root` variables below are fixed names, and nothing counts copies.
 */
export default function AppScaler({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    document.body.style.overflow = 'hidden';
    document.body.style.background = 'transparent';

    // Inject --xd-unit on :root from scale.config.ts (overrides CSS SSR fallback)
    document.documentElement.style.setProperty(
      '--xd-unit',
      `clamp(${MIN_SCALE}px, calc(100vw / ${DESIGN_W}), ${MAX_SCALE}px)`,
    );

    // Inject outer-background CSS rules from OUTER_BG config
    const styleId = 'xd-outer-bg';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = Object.entries(OUTER_BG)
        .map(([key, color]) => `#app-outer:has(.outer-bg-${key}) { background: ${color}; }`)
        .join('\n');
      document.head.appendChild(style);
    }

    let debounceTimer: ReturnType<typeof setTimeout>;

    const compute = () => {
      const { scale, left, top } = canvasFit(window.innerWidth, window.innerHeight);

      el.style.width = `${DESIGN_W}px`;
      el.style.height = `${DESIGN_H}px`;
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
      el.style.transform = `scale(${scale})`;

      const root = document.documentElement;
      root.style.setProperty('--app-scale', String(scale));
      // Where the drawn canvas actually is, in real px. Anything portaled out of
      // #master-canvas (the QR sheet) needs this: the canvas no longer fills the
      // window, so `100dvh` is not the canvas height any more.
      root.style.setProperty('--app-canvas-top', `${top}px`);
      root.style.setProperty('--app-canvas-height', `${DESIGN_H * scale}px`);
      // The layout is never squeezed now. Kept so FlexibleSpace keeps working.
      root.style.setProperty('--xd-flex-deficit', '0px');
    };

    const onWindowResize = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(compute);
    };

    compute();
    window.addEventListener('resize', onWindowResize, { passive: true });

    return () => {
      clearTimeout(debounceTimer);
      window.removeEventListener('resize', onWindowResize);
      document.body.style.overflow = '';
      document.body.style.background = '';
    };
  }, []);

  return (
    <div id="app-outer" style={{ position: 'fixed', inset: 0 }}>
      <div
        ref={canvasRef}
        id="master-canvas"
        style={{
          position: 'absolute',
          top: 0,
          left: `calc((100vw - ${DESIGN_W}px) / 2)`,
          width: DESIGN_W,
          height: DESIGN_H,
          transformOrigin: 'top left',
          transform: 'scale(1)',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}
