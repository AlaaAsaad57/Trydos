'use client';

import React, { useEffect, useRef, useState } from 'react';
import { computeScale } from './computeScale';
import {
  DESIGN_W,
  DESIGN_H,
  MAX_SCALE,
  MIN_SCALE,
  OUTER_BG,
} from './scale.config';

/**
 * AppScaler — draws the 430x932 design canvas into the real viewport.
 *
 * This component only does the DOM work: it measures the viewport, hands the
 * numbers to `computeScale`, and writes the result onto the canvas element and
 * onto two CSS variables that every screen reads —
 *
 *   --app-scale         the uniform scale the canvas is drawn at
 *   --xd-flex-deficit   design px the screen's FlexibleSpace gaps must give up
 *
 * The arithmetic itself lives in `computeScale.ts` so it can be tested without a
 * browser; see `tests/scaling/computeScale.test.ts`.
 */
export default function AppScaler({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [debug, setDebug] = useState({ vw: 0, vh: 0, rt: 0, sw: 0, sh: 0 });

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
      const vw = window.innerWidth;
      const rawVh = window.innerHeight;

      // When the on-screen keyboard opens, the visual viewport collapses to a
      // fraction of the screen. Re-scaling the whole canvas for that would make
      // the page lurch every time a field is tapped, so a viewport that small is
      // read as "the keyboard is up" and the screen height is used instead.
      const screenVh =
        (window.screen.availHeight || window.screen.height) /
        (window.devicePixelRatio || 1);
      const vh = rawVh < screenVh * 0.7 ? screenVh : rawVh;

      const root = document.documentElement;
      setDebug({ vw, vh, rt: vh / vw, sw: window.screen.width, sh: window.screen.height });

      // All of the arithmetic lives in computeScale, which is unit-tested
      // against the viewports the layout bugs were found on.
      const { scale, canvasHeight, offsetX, offsetY, flexDeficit } = computeScale(vw, vh);

      el.style.height = `${canvasHeight}px`;
      el.style.left = `${offsetX}px`;
      el.style.top = `${offsetY}px`;
      el.style.transform = `scale(${scale})`;

      root.style.setProperty('--app-scale', String(scale));
      root.style.setProperty('--xd-flex-deficit', `${flexDeficit}px`);
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
          // Server-side default, replaced on mount by computeScale. It is the
          // full design height rather than a guess short of it, so the first
          // paint is the design and not a squeezed version of it.
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
