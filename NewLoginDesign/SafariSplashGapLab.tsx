'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { SAFARI_BAND, isFloatingBarSafari } from 'components/DemoApp1/demo1Layout';
import SequencedLogo from './useLogoSequence';
import { AUTH_LOGO_SIZE } from './AuthLogoSlot';
import type { LogoSlotConfig } from './logoScreenConfig';

/**
 * The Safari 26 fix for the splash's bottom logo.
 *
 * Why the gap happens in iPhone Safari 26 (Liquid Glass floating bar):
 *  1. `window.innerHeight` / `100dvh` ends ~15.5–19px ABOVE Safari 26's floating
 *     URL pill. Any element clipped at `100dvh` stops at that line, leaving a
 *     white strip above the floating pill.
 *  2. WebKit (`LocalFrameView::fixedContainerEdges` / `WKColorExtensionView`)
 *     paints solid white over that strip whenever it sees a screen-wide
 *     `position: fixed` or `sticky` box at the bottom edge (even on frame 0!),
 *     or when the document itself ends at `innerHeight`, or when a scroll/clip
 *     container (`overflow-x: hidden; overflow-y: visible;` -> computes to
 *     `overflow-y: auto`) / `transform: scale()` canvas cuts below `innerHeight`.
 *
 * The fix (`in-flow`): while the splash waits, the login leaves `position:
 * fixed` and runs in the normal document flow, the document is taller than the
 * window, and the waiting badge is drawn in flow with a white half-disc over
 * the part under Safari's bar. iPhone Safari 26 and later get it; every other
 * browser gets `off` (the login as before).
 *
 * On `development` this file was a lab with six strategies, a debug menu and
 * rulers. Only the strategy shoppers got by default is kept here (Stage 7e,
 * S7e-4 in UI-MIGRATION-PLAN.md): no menu, no rulers, no hand switch.
 */

export type SafariSplashMode = 'off' | 'in-flow';

export const SAFARI_SPLASH_STYLE_ID = 'safari-splash-frame0';
/** Drop in CSS px below window.innerHeight to reach Safari 26's floating bar top edge. */
export const DEFAULT_BAND_PX = Math.round(SAFARI_BAND);
/** SVG design-px y (out of 150) below which the waiting badge is covered (66 = 5px tuck, above "try" at 69.37). */
export const DEFAULT_CLIP_DESIGN_Y = 66;

/** The mode for a browser: the fix on iPhone Safari 26 and later, `off` elsewhere. */
export function resolveSafariSplashMode(ua: string): SafariSplashMode {
    return isFloatingBarSafari(ua) ? 'in-flow' : 'off';
}

/**
 * The frame-0 stylesheet for a mode.
 *
 * Rules honored:
 *  - ZERO `overflow-x: hidden; overflow-y: visible;` (CSS computes that to `overflow-y: auto`!).
 *  - ZERO `html:has(...)` selectors (which can miss WebKit root invalidation).
 *  - ZERO `position: fixed` on `<main>` or `#app-outer` from frame 0.
 *  - Scoped to `[data-pw="new-login-widget"][data-splash-waiting]` AND removed completely
 *    the instant the splash finishes (`previewExpanded` turns true) or mode is `off`.
 *  - Every rule lives INSIDE `@layer utilities`. Tailwind 4 (`important: true`)
 *    writes `.fixed { position: fixed !important }` in that layer, and for
 *    `!important` rules a layered rule beats an unlayered one, whatever its
 *    specificity. An unlayered sheet therefore never took `<main>` out of
 *    `fixed`: Safari 26 found a viewport-sized fixed white box at the bottom
 *    edge and painted its solid colour view over the room under its bar
 *    (WebKit `LocalFrameView::fixedContainerEdges`). Inside the same layer the
 *    two-attribute selector outranks `.fixed`.
 */
export function buildSafariSplashCss(mode: SafariSplashMode): string {
    const rules = buildSafariSplashRules(mode);
    return rules ? `@layer utilities{${rules}}` : '';
}

function buildSafariSplashRules(mode: SafariSplashMode): string {
    if (mode === 'off') return '';

    const docTall = 'calc(100lvh + 220px)';
    return (
        'html,body{overflow:visible!important;overflow-x:visible!important;overflow-y:visible!important;background-color:#ffffff!important;}' +
        '.site-container,.main-content,[data-pw="demo1-app"],[data-pw="demo-intro-blank"]{overflow:visible!important;overflow-x:visible!important;overflow-y:visible!important;background-color:#ffffff!important;}' +
        '.home-navbar{display:none!important;}' +
        // Lower `<main>` from z-[99999999999] (clamped to 2147483647) while the
        // splash waits, so the top tint (2147483646) sits above it.
        '[data-pw="new-login-widget"][data-splash-waiting]{z-index:100!important;}' +
        '[data-pw="new-login-widget"][data-splash-waiting] #master-canvas,' +
        '[data-pw="new-login-widget"][data-splash-waiting] [data-pw="login-stage"]{contain:none!important;isolation:auto!important;overflow:visible!important;}' +
        `body,.site-container,.main-content{min-height:${docTall}!important;height:auto!important;}` +
        '[data-pw="demo1-app"],[data-pw="demo-intro-blank"]{min-height:0!important;height:0!important;}' +
        `[data-pw="new-login-widget"][data-splash-waiting]{position:relative!important;inset:auto!important;width:100%!important;height:${docTall}!important;overflow:visible!important;}` +
        '[data-pw="new-login-widget"][data-splash-waiting] #app-outer{position:relative!important;inset:auto!important;width:100%!important;height:100dvh!important;overflow:visible!important;}'
    );
}

/**
 * Synchronous pre-paint script placed ahead of `<main>` so Safari 26 NEVER paints
 * a `position: fixed` bottom box on frame 0. Injects only a `<style>` in `<head>`
 * (React 19 hydration-safe). The mode comes from the user agent only.
 */
export function buildSafariSplashPrepaintScript(): string {
    return (
        '(function(){try{' +
        `var id=${JSON.stringify(SAFARI_SPLASH_STYLE_ID)};` +
        `var css=${JSON.stringify(buildSafariSplashCss('in-flow'))};` +
        'var u=navigator.userAgent;var v=u.match(/Version\\/(\\d+)[^ ]* Mobile\\/\\S+ Safari/);' +
        'var on=/iPhone|iPod/.test(u)&&v&&Number(v[1])>=26;' +
        'var el=document.getElementById(id);' +
        'if(!on){if(el)el.remove();return;}' +
        'if(!el){el=document.createElement("style");el.id=id;document.head.appendChild(el);}' +
        'el.textContent=css;' +
        '}catch(e){}})()'
    );
}

const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** True when `el` is a scrollable box that still has room in the gesture's direction. */
function canScrollElement(el: Element, dy: number): boolean {
    const s = getComputedStyle(el);
    if (!/auto|scroll/.test(s.overflowY)) return false;
    if (el.scrollHeight <= el.clientHeight) return false;
    if (dy > 0) return el.scrollTop + el.clientHeight < el.scrollHeight - 1;
    if (dy < 0) return el.scrollTop > 0;
    return true;
}

/** The mode for this browser, `off` until the first layout (SSR/hydration safe). */
export function useSafariSplashMode(): SafariSplashMode {
    const [mode, setMode] = useState<SafariSplashMode>('off');
    useBrowserLayoutEffect(() => {
        setMode(resolveSafariSplashMode(navigator.userAgent));
    }, []);
    return mode;
}

/**
 * The fix's DOM side-effects while it is active: the stylesheet, the scroll
 * hold, and a clean restore on exit.
 */
export function useSafariSplashRuntime(active: boolean, mode: SafariSplashMode) {
    useBrowserLayoutEffect(() => {
        if (!active || mode === 'off') {
            document.getElementById(SAFARI_SPLASH_STYLE_ID)?.remove();
            return;
        }

        const css = buildSafariSplashCss(mode);
        let styleEl = document.getElementById(SAFARI_SPLASH_STYLE_ID) as HTMLStyleElement | null;
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = SAFARI_SPLASH_STYLE_ID;
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = css;

        const html = document.documentElement;
        const prevOverscroll = html.style.getPropertyValue('overscroll-behavior');
        const prevOverscrollPrio = html.style.getPropertyPriority('overscroll-behavior');
        html.style.setProperty('overscroll-behavior', 'none');

        const prevHtmlOverflowX = html.style.getPropertyValue('overflow-x');
        const prevHtmlOverflowXPrio = html.style.getPropertyPriority('overflow-x');
        html.style.setProperty('overflow-x', 'visible', 'important');

        if (window.scrollY !== 0) window.scrollTo(0, 0);

        // Hold page scroll still while the tall document is active (never via body overflow:hidden!).
        let lastY = 0;
        const onTouchStart = (e: TouchEvent) => {
            lastY = e.touches[0]?.clientY ?? 0;
        };
        const holdScroll = (e: Event) => {
            const target = e.target instanceof Element ? e.target : null;
            let dy = 0;
            if (e instanceof WheelEvent) dy = e.deltaY;
            else if (typeof TouchEvent !== 'undefined' && e instanceof TouchEvent) {
                const cy = e.touches[0]?.clientY ?? lastY;
                dy = lastY - cy;
            }
            for (let el = target; el && el !== document.body; el = el.parentElement) {
                if (canScrollElement(el, dy)) return;
            }
            if (e.cancelable) e.preventDefault();
        };

        document.addEventListener('touchstart', onTouchStart, { passive: true });
        document.addEventListener('touchmove', holdScroll, { passive: false });
        document.addEventListener('wheel', holdScroll, { passive: false });

        return () => {
            document.removeEventListener('touchstart', onTouchStart);
            document.removeEventListener('touchmove', holdScroll);
            document.removeEventListener('wheel', holdScroll);
            document.getElementById(SAFARI_SPLASH_STYLE_ID)?.remove();
            if (prevOverscroll) html.style.setProperty('overscroll-behavior', prevOverscroll, prevOverscrollPrio);
            else html.style.removeProperty('overscroll-behavior');
            if (prevHtmlOverflowX) html.style.setProperty('overflow-x', prevHtmlOverflowX, prevHtmlOverflowXPrio);
            else html.style.removeProperty('overflow-x');
        };
    }, [active, mode]);
}

interface SlotMetrics {
    /** Slot top relative to the viewport (CSS px). */
    viewportTop: number;
    /** Slot top relative to the document (CSS px). */
    docTop: number;
    /** Slot rendered width in CSS px (= 150 * scale). */
    sizeCss: number;
    /** Effective CSS-px per design-px scale. */
    scale: number;
    /** Current window.innerHeight. */
    innerH: number;
    /** Current window.scrollY. */
    scrollY: number;
}

/**
 * Tracks the QuickPreviewScreen's `[data-auth-logo-slot]` rect in real CSS px on
 * every animation frame while the splash column rises and rests.
 */
function useSlotMetrics(
    stageRef: React.RefObject<HTMLDivElement | null>,
    active: boolean,
): SlotMetrics | null {
    const [metrics, setMetrics] = useState<SlotMetrics | null>(null);
    const lastRef = useRef<SlotMetrics | null>(null);

    useEffect(() => {
        if (!active) {
            lastRef.current = null;
            setMetrics(null);
            return;
        }
        let raf = 0;
        const measure = () => {
            const stage = stageRef.current;
            const slot = stage?.querySelector<HTMLElement>('[data-auth-logo-slot]');
            if (slot) {
                const r = slot.getBoundingClientRect();
                if (r.width > 0) {
                    const scrollY = window.scrollY || 0;
                    const next: SlotMetrics = {
                        viewportTop: r.top,
                        docTop: r.top + scrollY,
                        sizeCss: r.width,
                        scale: r.width / AUTH_LOGO_SIZE,
                        innerH: window.innerHeight,
                        scrollY,
                    };
                    const prev = lastRef.current;
                    if (
                        !prev ||
                        Math.abs(prev.viewportTop - next.viewportTop) > 0.35 ||
                        Math.abs(prev.sizeCss - next.sizeCss) > 0.35 ||
                        Math.abs(prev.innerH - next.innerH) > 0.5 ||
                        Math.abs(prev.scrollY - next.scrollY) > 0.5
                    ) {
                        lastRef.current = next;
                        setMetrics(next);
                    }
                }
            }
            raf = requestAnimationFrame(measure);
        };
        raf = requestAnimationFrame(measure);
        return () => cancelAnimationFrame(raf);
    }, [stageRef, active]);

    return metrics;
}

interface SafariSplashBadgeRendererProps {
    active: boolean;
    mode: SafariSplashMode;
    stageRef: React.RefObject<HTMLDivElement | null>;
    dotColor: string;
    ringColor: string;
    slot: LogoSlotConfig;
    /** Defaults to DEFAULT_BAND_PX. */
    bandPx?: number;
    /** Defaults to DEFAULT_CLIP_DESIGN_Y. */
    clipDesignY?: number;
}

/**
 * Renders the waiting bottom badge in normal document flow (NO position:fixed,
 * NO position:absolute, NO transform, NO overflow clip).
 *
 * Paints a white half-disc inside the SVG (`coverBottomY`) from a line computed against
 * `innerHeight + bandPx + (clipDesignY - 61) * scale`, so:
 *  - During the 0.8s entrance slide, nothing peeks below Safari's floating bar.
 *  - At rest, the dotted ring reaches cleanly across the strip and tucks behind
 *    Safari's floating bar top edge, while cutting strictly above "try" (69.37).
 */
export function SafariSplashBadgeRenderer({
    active,
    mode,
    stageRef,
    dotColor,
    ringColor,
    slot,
    bandPx = DEFAULT_BAND_PX,
    clipDesignY = DEFAULT_CLIP_DESIGN_Y,
}: SafariSplashBadgeRendererProps) {
    const metrics = useSlotMetrics(stageRef, active && mode !== 'off');
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!active || mode === 'off' || !metrics || !mounted) return null;

    const tuckDesign = Math.max(0, clipDesignY - 61);
    const barClipViewportY = metrics.innerH + bandPx + tuckDesign * metrics.scale;
    const dynamicClipDesignY = Math.max(
        0,
        Math.min(clipDesignY, (barClipViewportY - metrics.viewportTop) / metrics.scale),
    );
    const topInFlow = Math.max(0, metrics.docTop);

    return (
        <div
            data-pw="safari-splash-badge-inflow"
            data-safari-badge-mode={mode}
            aria-hidden="true"
            style={{
                position: 'relative',
                width: '100%',
                marginTop: topInFlow - metrics.innerH,
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 50,
            }}
        >
            <div style={{ width: metrics.sizeCss, height: metrics.sizeCss }}>
                <SequencedLogo
                    slot={slot}
                    variant="badge-ring"
                    dotColor={dotColor}
                    ringColor={ringColor}
                    width={metrics.sizeCss}
                    height={metrics.sizeCss}
                    coverBottomY={dynamicClipDesignY}
                />
            </div>
        </div>
    );
}
