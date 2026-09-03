'use client';

import React, { useEffect, useRef } from 'react';

import { CANVAS_FIT_SCRIPT, canvasFit } from './canvasFit';
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
 * The canvas is the 430-wide artboard, always filling the width of the window
 * (capped at MAX_SCALE), and it is centred in whatever room is left. Its height
 * is `932 - deficit` design px, where `deficit` is the height the page does not
 * have — see canvasFit.ts for the rule and the reason.
 *
 * `--xd-flex-deficit` carries that number to the screens. An element placed
 * with `fromBottom(y)` (authLayout.ts) keeps its distance from the bottom of the
 * real page instead of the bottom of the artboard, so on an iPhone in Safari
 * the buttons sit above the browser bar and the empty space above the mark is
 * what gets shorter. A plain `top: y` is unaffected. `FlexibleSpace` reads the
 * same variable through its `share=`, and every call site today passes 0.
 *
 * What this replaced, and why
 * ---------------------------
 * The previous rule fitted the whole 932 px artboard into the page. On a phone
 * in Safari (about 745 px of page) that drew everything at 80% with a 43 px
 * white margin on each side, and the client saw a smaller app than the design.
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
      const { scale, deficit, height, left, top } = canvasFit(
        window.innerWidth,
        window.innerHeight,
      );

      // The canvas element reads its scale and its place from these variables
      // (see the style below). Nothing is written onto the element itself: the
      // script served ahead of it has already set the same four values before
      // the first paint, so this write is the same numbers again, and
      // hydration moves nothing. CANVAS_FIT_SCRIPT explains why.
      const root = document.documentElement;
      root.style.setProperty('--app-scale', String(scale));
      root.style.setProperty('--app-canvas-left', `${left}px`);
      // Where the drawn canvas actually is, in real px. Anything portaled out of
      // #master-canvas (the QR sheet) needs this: the canvas no longer fills the
      // window, so `100dvh` is not the canvas height any more.
      root.style.setProperty('--app-canvas-top', `${top}px`);
      root.style.setProperty('--app-canvas-height', `${height * scale}px`);
      // The height the page does not have, in design px. The canvas box and
      // every `fromBottom()` position read it.
      root.style.setProperty('--xd-flex-deficit', `${deficit}px`);
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
      {/*
        * Runs as the browser parses the html, ahead of the canvas, so the
        * canvas is scaled before it is ever painted. The browser does not run
        * a script React inserts on a client-side navigation; there the effect
        * above does the same work.
        */}
      <script dangerouslySetInnerHTML={{ __html: CANVAS_FIT_SCRIPT }} />
      <div
        ref={canvasRef}
        id="master-canvas"
        style={{
          position: 'absolute',
          // The fallbacks are the unscaled artboard, centred, for the one case
          // where no script ran at all.
          top: 'var(--app-canvas-top, 0px)',
          left: `var(--app-canvas-left, calc((100vw - ${DESIGN_W}px) / 2))`,
          width: DESIGN_W,
          height: `calc(${DESIGN_H}px - var(--xd-flex-deficit, 0px))`,
          transformOrigin: 'top left',
          transform: 'scale(var(--app-scale, 1))',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}
