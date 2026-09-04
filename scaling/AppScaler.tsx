'use client';

import React, { useEffect, useRef } from 'react';

import { CANVAS_FIT_SCRIPT, canvasFit, keyboardLift } from './canvasFit';
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
 * The virtual keyboard
 * --------------------
 * The page cannot make the phone's keyboard smaller, so two rules keep the
 * focused field usable without changing the size of anything:
 *
 *   1. While a text field has focus the fit above is frozen. Android shrinks
 *      `innerHeight` when the keyboard opens; re-fitting on that drew the whole
 *      canvas at ~61% while the shopper typed, then grew it back on close.
 *   2. The canvas slides up by `--app-keyboard-lift`: the overlap between the
 *      field's bottom and the bottom of what `visualViewport` says is visible,
 *      plus KEYBOARD_GAP. iOS keeps `innerHeight` as it was and moves only the
 *      visual viewport, so this is the one signal that works on both. The
 *      phone and OTP screens focus an `sr-only` input beside their visible
 *      box, so a 1 px field is measured by its parent instead.
 *   3. On a touch device those two screens open the app's own keypad
 *      (`ui/NumericKeypad`) instead: a portal on <body>, fixed to the bottom,
 *      that no viewport reports. The keypad marks itself
 *      `data-keyboard-overlay` and the input marks the box to keep visible
 *      `data-keyboard-anchor` while it is up; a MutationObserver on the
 *      anchor attribute re-measures, and the keypad's `offsetHeight` (never
 *      affected by its slide-in transform) says where its top will be.
 *
 * Only one `<Page variant="scaled">` may be mounted at a time: the element ids
 * and the `:root` variables below are fixed names, and nothing counts copies.
 */
const LIFT_VAR = '--app-keyboard-lift';

const isTextField = (el: Element | null): el is HTMLElement =>
  !!el &&
  (el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    (el as HTMLElement).isContentEditable === true);

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
    let blurTimer: ReturnType<typeof setTimeout>;

    const compute = () => {
      // The keyboard changed the window, not the device. Keep the fit the
      // shopper was looking at; the resize after the keyboard closes re-fits.
      if (isTextField(document.activeElement)) return;

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

    const updateLift = () => {
      const root = document.documentElement;
      const active = document.activeElement;
      const field =
        document.querySelector<HTMLElement>('[data-keyboard-anchor]') ??
        (isTextField(active) ? active : null);
      if (!field) {
        root.style.setProperty(LIFT_VAR, '0px');
        return;
      }
      const vv = window.visualViewport;
      let visibleBottom = vv ? vv.offsetTop + vv.height : window.innerHeight;
      const overlay = document.querySelector<HTMLElement>('[data-keyboard-overlay]');
      if (overlay) visibleBottom = Math.min(visibleBottom, window.innerHeight - overlay.offsetHeight);
      let rect = field.getBoundingClientRect();
      // An sr-only field is a 1 px dot; its parent is the box the shopper sees.
      if (rect.height <= 1 && field.parentElement) {
        rect = field.parentElement.getBoundingClientRect();
      }
      // The rect moves with the current lift. Measure the field against the
      // canvas element and add the canvas's unlifted top, so a second keyboard
      // event neither stacks the lift nor drops it.
      const canvasTop = Number.parseFloat(root.style.getPropertyValue('--app-canvas-top')) || 0;
      const inCanvas = rect.bottom - el.getBoundingClientRect().top;
      root.style.setProperty(LIFT_VAR, `${keyboardLift(inCanvas + canvasTop, visibleBottom)}px`);
    };

    const onWindowResize = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        compute();
        updateLift();
      });
    };
    // On focusout `activeElement` is not settled yet; read it a tick later.
    const onFocusOut = () => {
      clearTimeout(blurTimer);
      blurTimer = setTimeout(updateLift);
    };

    compute();
    window.addEventListener('resize', onWindowResize, { passive: true });
    document.addEventListener('focusin', updateLift);
    document.addEventListener('focusout', onFocusOut);
    const vv = window.visualViewport;
    vv?.addEventListener('resize', updateLift);
    vv?.addEventListener('scroll', updateLift);
    // The app's own keypad: re-measure when an input marks or unmarks its box.
    const anchors = new MutationObserver(updateLift);
    anchors.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['data-keyboard-anchor'],
    });

    return () => {
      clearTimeout(debounceTimer);
      clearTimeout(blurTimer);
      window.removeEventListener('resize', onWindowResize);
      document.removeEventListener('focusin', updateLift);
      document.removeEventListener('focusout', onFocusOut);
      vv?.removeEventListener('resize', updateLift);
      vv?.removeEventListener('scroll', updateLift);
      anchors.disconnect();
      document.documentElement.style.removeProperty(LIFT_VAR);
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
          // Minus the keyboard lift, 0 unless a focused field would sit
          // under the virtual keyboard.
          top: 'calc(var(--app-canvas-top, 0px) - var(--app-keyboard-lift, 0px))',
          // So the lift follows the keypad's slide instead of jumping.
          transition: 'top 0.25s ease-out',
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
