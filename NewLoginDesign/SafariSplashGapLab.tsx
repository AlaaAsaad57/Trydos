'use client';

import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { followTopTint, type TintHome } from 'components/DemoApp/topTint';
import { COLUMN_W, SAFARI_BAND, UNDER_BAR, isFloatingBarSafari } from 'components/DemoApp1/demo1Layout';
import SequencedLogo from './useLogoSequence';
import { AUTH_LOGO_SIZE } from './AuthLogoSlot';
import type { LogoSlotConfig } from './logoScreenConfig';

/**
 * Safari 26 splash bottom-logo gap lab & fix strategies.
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
 * Previous 4 attempts (NOT repeated here):
 *  - Attempt 1 (437a40577): 24px white fade + lifting peek 24px (exposed "try").
 *  - Attempt 2 (e75ea48a8): revert to baseline.
 *  - Attempt 3 (cbacc6fe4): absolute widget inside .site-container + clip-path +
 *    body overflow:hidden still active.
 *  - Attempt 4 (43b028b55): html:has(...) + overflow-x:hidden/overflow-y:visible
 *    (= overflow-y:auto!) + AuthLogoLayer still inside transformed #master-canvas.
 *
 * This module provides 6 genuinely distinct, architecturally clean strategies
 * plus a compact refresh-surviving debug menu (persisted in localStorage) and
 * visual pixel rulers + hit-test diagnostics so all approaches can be verified
 * on a real iPhone Safari 26 in one deploy.
 */

export type SafariSplashMode =
    | 'off'
    | 'in-flow'
    | 'fixed-0w'
    | 'body-layer'
    | 'scroll-nudge'
    | 'sticky-0w'
    | 'lvh-canvas';

export interface SafariSplashModeInfo {
    id: SafariSplashMode;
    short: string;
    title: string;
    desc: string;
}

export const SAFARI_SPLASH_MODES: readonly SafariSplashModeInfo[] = [
    {
        id: 'off',
        short: '0 Off',
        title: '0. Off (Baseline)',
        desc: 'Untouched development behavior for A/B comparison.',
    },
    {
        id: 'in-flow',
        short: '1 Flow',
        title: '1. Pure In-Flow Doc',
        desc: 'Normal document flow (like /demo Home), zero fixed/scale/overflow clip, direct CSS-px badge in flow.',
    },
    {
        id: 'fixed-0w',
        short: '2 Fix0w',
        title: '2. Fixed 0w Portal',
        desc: 'Body-portaled width:0 EDGE_ANCHOR fixed bottom badge + tall doc + multiply top strip (1dfc910bf).',
    },
    {
        id: 'body-layer',
        short: '3 Layer',
        title: '3. Body Layer Portal',
        desc: 'Exact /demo Sheet Layer portal on body (0x0 absolute anchor + demo-doc-room + bottom:-120).',
    },
    {
        id: 'scroll-nudge',
        short: '4 Scr2px',
        title: '4. In-Flow + Scroll 2px',
        desc: 'Tall 200dvh in-flow doc + programmatic scrollTo(0, 2) to bypass Safari scrollY===0 bottom latch.',
    },
    {
        id: 'sticky-0w',
        short: '5 Stick0',
        title: '5. Sticky 0w Anchor',
        desc: 'Document-layer position:sticky; bottom:0; width:0; height:0 inside tall flow doc + multiply strip.',
    },
    {
        id: 'lvh-canvas',
        short: '6 LVH',
        title: '6. 100lvh + Edge Clear',
        desc: 'Full 100lvh non-fixed canvas, html/body owns #fff, plus 1-frame fixedContainerEdges clear pulse.',
    },
] as const;

export interface SafariSplashSettings {
    /** Explicitly picked mode, or null to use browser default (`in-flow` on Safari 26, `off` elsewhere). */
    mode: SafariSplashMode | null;
    /** Extra drop in CSS px below window.innerHeight to reach Safari 26's floating bar top edge. */
    bandPx: number;
    /** SVG design-px y (out of 150) below which the waiting badge is clipped (66 = 5px tuck, above "try" at 69.37). */
    clipDesignY: number;
    /** Pause the 8-second auto-expand timer while testing (survives refresh). */
    pauseSplash: boolean;
    /** Show 3-layer diagnostic pixel rulers (FLOW / ABS / FIX0) across innerHeight..innerHeight+100. */
    showRuler: boolean;
}

export const SAFARI_SPLASH_STORAGE_KEY = 'trydos.safariSplashLogoLab.v1';
export const SAFARI_SPLASH_STYLE_ID = 'safari-splash-frame0';
export const DEFAULT_BAND_PX = Math.round(SAFARI_BAND);
export const DEFAULT_CLIP_DESIGN_Y = 66;

const DEFAULT_SETTINGS: SafariSplashSettings = {
    mode: null,
    bandPx: DEFAULT_BAND_PX,
    clipDesignY: DEFAULT_CLIP_DESIGN_Y,
    pauseSplash: false,
    showRuler: false,
};

const VALID_MODES = new Set<string>(SAFARI_SPLASH_MODES.map((m) => m.id));

const isValidMode = (value: unknown): value is SafariSplashMode =>
    typeof value === 'string' && VALID_MODES.has(value);

/** Read saved settings from localStorage (with optional `?safariFix=<mode>` query override). */
export function readSafariSplashSettings(): SafariSplashSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    let parsed: Partial<SafariSplashSettings> = {};
    try {
        const raw = window.localStorage.getItem(SAFARI_SPLASH_STORAGE_KEY);
        if (raw) parsed = JSON.parse(raw) as Partial<SafariSplashSettings>;
    } catch {
        // Private browsing or blocked storage — fall back to defaults.
    }
    let queryMode: SafariSplashMode | null = null;
    try {
        const q = new URLSearchParams(window.location.search).get('safariFix');
        if (isValidMode(q)) queryMode = q;
    } catch {
        // Ignore malformed URL.
    }
    return {
        mode: queryMode ?? (isValidMode(parsed.mode) ? parsed.mode : null),
        bandPx:
            typeof parsed.bandPx === 'number' && Number.isFinite(parsed.bandPx)
                ? Math.min(48, Math.max(0, Math.round(parsed.bandPx)))
                : DEFAULT_BAND_PX,
        clipDesignY:
            typeof parsed.clipDesignY === 'number' && Number.isFinite(parsed.clipDesignY)
                ? Math.min(100, Math.max(55, Math.round(parsed.clipDesignY)))
                : DEFAULT_CLIP_DESIGN_Y,
        pauseSplash: Boolean(parsed.pauseSplash),
        showRuler: Boolean(parsed.showRuler),
    };
}

export function writeSafariSplashSettings(next: SafariSplashSettings): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(SAFARI_SPLASH_STORAGE_KEY, JSON.stringify(next));
    } catch {
        // Ignore storage errors.
    }
}

/** Resolve the effective mode for the current browser. */
export function resolveSafariSplashMode(
    settings: SafariSplashSettings,
    ua: string,
): SafariSplashMode {
    if (settings.mode !== null) return settings.mode;
    return isFloatingBarSafari(ua) ? 'in-flow' : 'off';
}

/**
 * Generates the exact frame-0 stylesheet for a given active mode.
 *
 * Critical rules honored across EVERY mode:
 *  - ZERO `overflow-x: hidden; overflow-y: visible;` (CSS computes that to `overflow-y: auto`!).
 *  - ZERO `html:has(...)` selectors (which can miss WebKit root invalidation).
 *  - ZERO `position: fixed` on `<main>` or `#app-outer` from frame 0.
 *  - Scoped to `[data-pw="new-login-widget"][data-splash-waiting]` AND removed completely
 *    the instant the splash finishes (`previewExpanded` turns true) or mode is `off`.
 */
export function buildSafariSplashCss(mode: SafariSplashMode): string {
    if (mode === 'off') return '';

    const docTall = mode === 'scroll-nudge' ? '200dvh' : 'calc(100lvh + 220px)';
    const commonBase =
        'html,body{overflow:visible!important;overflow-x:visible!important;overflow-y:visible!important;background-color:#ffffff!important;}' +
        '.site-container,.main-content,[data-pw="demo1-app"],[data-pw="demo-intro-blank"]{overflow:visible!important;overflow-x:visible!important;overflow-y:visible!important;background-color:#ffffff!important;}' +
        '.home-navbar{display:none!important;}' +
        // Lower `<main>` from z-[99999999999] (clamped to 2147483647) while splash waiting is active
        // so body-portaled layers (topTint 2147483646, fixed-0w/body-layer badges, rulers, lab) sit above it.
        '[data-pw="new-login-widget"][data-splash-waiting]{z-index:100!important;}' +
        '[data-pw="new-login-widget"][data-splash-waiting] #master-canvas,' +
        '[data-pw="new-login-widget"][data-splash-waiting] [data-pw="login-stage"]{contain:none!important;isolation:auto!important;overflow:visible!important;}';

    if (mode === 'in-flow' || mode === 'scroll-nudge' || mode === 'sticky-0w') {
        return (
            commonBase +
            `body,.site-container,.main-content{min-height:${docTall}!important;height:auto!important;}` +
            '[data-pw="demo1-app"],[data-pw="demo-intro-blank"]{min-height:0!important;height:0!important;}' +
            `[data-pw="new-login-widget"][data-splash-waiting]{position:relative!important;inset:auto!important;width:100%!important;height:${docTall}!important;overflow:visible!important;}` +
            '[data-pw="new-login-widget"][data-splash-waiting] #app-outer{position:relative!important;inset:auto!important;width:100%!important;height:100dvh!important;overflow:visible!important;}'
        );
    }

    if (mode === 'lvh-canvas') {
        return (
            commonBase +
            `body,.site-container,.main-content{min-height:${docTall}!important;height:auto!important;}` +
            '[data-pw="demo1-app"],[data-pw="demo-intro-blank"]{min-height:0!important;height:0!important;}' +
            '[data-pw="new-login-widget"][data-splash-waiting]{position:relative!important;inset:auto!important;width:100%!important;height:100lvh!important;background-color:transparent!important;overflow:visible!important;}' +
            '[data-pw="new-login-widget"][data-splash-waiting] #app-outer{position:relative!important;inset:auto!important;width:100%!important;height:100lvh!important;background:transparent!important;overflow:visible!important;}'
        );
    }

    // `fixed-0w` and `body-layer`: underlying document runs tall in normal flow,
    // widget sits as absolute at top:0 (never fixed on frame 0), and the waiting
    // badge is portaled directly onto `document.body`.
    return (
        commonBase +
        `body,.site-container,.main-content,[data-pw="demo1-app"],[data-pw="demo-intro-blank"]{min-height:${docTall}!important;height:auto!important;}` +
        '[data-pw="new-login-widget"][data-splash-waiting]{position:absolute!important;inset:auto!important;top:0!important;left:0!important;width:100%!important;height:100dvh!important;overflow:visible!important;}' +
        '[data-pw="new-login-widget"][data-splash-waiting] #app-outer{position:absolute!important;inset:0!important;overflow:visible!important;}'
    );
}

/**
 * Synchronous pre-paint script placed ahead of `<main>` so Safari 26 NEVER paints
 * a `position: fixed` bottom box on frame 0 when any mode 1–6 is active.
 * Injects only a `<style>` in `<head>` (React 19 hydration-safe).
 */
export function buildSafariSplashPrepaintScript(): string {
    const cssByMode: Record<SafariSplashMode, string> = {
        off: '',
        'in-flow': buildSafariSplashCss('in-flow'),
        'fixed-0w': buildSafariSplashCss('fixed-0w'),
        'body-layer': buildSafariSplashCss('body-layer'),
        'scroll-nudge': buildSafariSplashCss('scroll-nudge'),
        'sticky-0w': buildSafariSplashCss('sticky-0w'),
        'lvh-canvas': buildSafariSplashCss('lvh-canvas'),
    };
    return (
        '(function(){try{' +
        `var k=${JSON.stringify(SAFARI_SPLASH_STORAGE_KEY)};` +
        `var id=${JSON.stringify(SAFARI_SPLASH_STYLE_ID)};` +
        `var map=${JSON.stringify(cssByMode)};` +
        'var m=null;' +
        'try{var q=new URLSearchParams(location.search).get("safariFix");if(q&&Object.prototype.hasOwnProperty.call(map,q))m=q;}catch(e){}' +
        'if(!m){try{var r=localStorage.getItem(k);if(r){var p=JSON.parse(r);if(p&&p.mode&&Object.prototype.hasOwnProperty.call(map,p.mode))m=p.mode;}}catch(e){}}' +
        'if(!m){var u=navigator.userAgent;var v=u.match(/Version\\/(\\d+)[^ ]* Mobile\\/\\S+ Safari/);m=(/iPhone|iPod/.test(u)&&v&&Number(v[1])>=26)?"in-flow":"off";}' +
        'var css=map[m]||"";' +
        'var el=document.getElementById(id);' +
        'if(!css){if(el)el.remove();return;}' +
        'if(!el){el=document.createElement("style");el.id=id;document.head.appendChild(el);}' +
        'el.textContent=css;' +
        '}catch(e){}})()'
    );
}

const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const BODY_TINT_HOME: TintHome = { host: () => document.body, rest: null };

/** True when `el` is a scrollable box that still has room in the gesture's direction. */
function canScrollElement(el: Element, dy: number): boolean {
    const s = getComputedStyle(el);
    if (!/auto|scroll/.test(s.overflowY)) return false;
    if (el.scrollHeight <= el.clientHeight) return false;
    if (dy > 0) return el.scrollTop + el.clientHeight < el.scrollHeight - 1;
    if (dy < 0) return el.scrollTop > 0;
    return true;
}

/** Hook that manages persisted settings + resolved mode (SSR/hydration safe). */
export function useSafariSplashLab() {
    const [settings, setSettings] = useState<SafariSplashSettings>(DEFAULT_SETTINGS);
    const [effectiveMode, setEffectiveMode] = useState<SafariSplashMode>('off');
    const [isSafari26, setIsSafari26] = useState<boolean>(false);
    const [hydrated, setHydrated] = useState<boolean>(false);

    useBrowserLayoutEffect(() => {
        const loaded = readSafariSplashSettings();
        const ua = navigator.userAgent;
        const safari = isFloatingBarSafari(ua);
        setSettings(loaded);
        setIsSafari26(safari);
        setEffectiveMode(resolveSafariSplashMode(loaded, ua));
        setHydrated(true);
    }, []);

    const updateSettings = useCallback((patch: Partial<SafariSplashSettings>) => {
        setSettings((prev) => {
            const next = { ...prev, ...patch };
            writeSafariSplashSettings(next);
            const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
            setEffectiveMode(resolveSafariSplashMode(next, ua));
            return next;
        });
    }, []);

    return { settings, effectiveMode, isSafari26, hydrated, updateSettings };
}

/**
 * Manages the active DOM side-effects (stylesheet, scroll lock, multiply top strip,
 * scroll-nudge, fixedContainerEdges clear pulse, and clean restore on exit).
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

        // Modes 2, 5, 6 use the proven multiply top strip (`1dfc910bf`).
        const useTopStrip = mode === 'fixed-0w' || mode === 'sticky-0w' || mode === 'lvh-canvas';
        const topStrip = useTopStrip ? followTopTint('#ffffff', BODY_TINT_HOME, { blend: true }) : null;
        topStrip?.set(1);

        // Mode 4: programmatic 2px scroll nudge to bypass Safari 26's scrollY===0 latch.
        let scrollRaf = 0;
        if (mode === 'scroll-nudge') {
            scrollRaf = requestAnimationFrame(() => {
                window.scrollTo(0, 2);
            });
        } else if (window.scrollY !== 0) {
            window.scrollTo(0, 0);
        }

        // Mode 6: 1-frame fixed bottom pulse to force WebKit Page::updateFixedContainerEdges()
        // to re-sample and drop any stale _bottomColorExtensionView.
        let pulseEl: HTMLDivElement | null = null;
        let pulseRaf1 = 0;
        let pulseRaf2 = 0;
        if (mode === 'lvh-canvas') {
            pulseEl = document.createElement('div');
            pulseEl.setAttribute('aria-hidden', 'true');
            pulseEl.dataset.pw = 'safari-edge-pulse';
            Object.assign(pulseEl.style, {
                position: 'fixed',
                left: '0',
                bottom: '0',
                width: '100vw',
                height: '12px',
                backgroundColor: 'rgba(255,255,255,0.01)',
                pointerEvents: 'none',
                zIndex: '1',
            } satisfies Partial<CSSStyleDeclaration>);
            document.body.appendChild(pulseEl);
            pulseRaf1 = requestAnimationFrame(() => {
                if (pulseEl) {
                    pulseEl.style.transform = 'translateY(80px)';
                    pulseEl.style.visibility = 'hidden';
                }
                pulseRaf2 = requestAnimationFrame(() => {
                    pulseEl?.remove();
                    pulseEl = null;
                });
            });
        }

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
            if (scrollRaf) cancelAnimationFrame(scrollRaf);
            if (pulseRaf1) cancelAnimationFrame(pulseRaf1);
            if (pulseRaf2) cancelAnimationFrame(pulseRaf2);
            pulseEl?.remove();
            topStrip?.release();
            document.removeEventListener('touchstart', onTouchStart);
            document.removeEventListener('touchmove', holdScroll);
            document.removeEventListener('wheel', holdScroll);
            document.getElementById(SAFARI_SPLASH_STYLE_ID)?.remove();
            if (prevOverscroll) html.style.setProperty('overscroll-behavior', prevOverscroll, prevOverscrollPrio);
            else html.style.removeProperty('overscroll-behavior');
            if (prevHtmlOverflowX) html.style.setProperty('overflow-x', prevHtmlOverflowX, prevHtmlOverflowXPrio);
            else html.style.removeProperty('overflow-x');
            if (mode === 'scroll-nudge' && window.scrollY !== 0) {
                window.scrollTo(0, 0);
            }
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
    bandPx: number;
    clipDesignY: number;
    stageRef: React.RefObject<HTMLDivElement | null>;
    dotColor: string;
    ringColor: string;
    slot: LogoSlotConfig;
}

/**
 * Renders the waiting bottom badge using the selected non-clipping architecture
 * (`in-flow`, `fixed-0w`, `body-layer`, `scroll-nudge`, `sticky-0w`, or `lvh-canvas`).
 *
 * Uses SVG-internal `<clipPath>` (`clipBottomY`) computed dynamically against
 * `innerHeight + bandPx + (clipDesignY - 61) * scale`, so:
 *  - During the 0.8s entrance slide, nothing peeks below Safari's floating bar.
 *  - At rest, the dotted ring reaches cleanly across the strip and tucks behind
 *    Safari's floating bar top edge, while cutting strictly above "try" (69.37).
 */
export function SafariSplashBadgeRenderer({
    active,
    mode,
    bandPx,
    clipDesignY,
    stageRef,
    dotColor,
    ringColor,
    slot,
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

    const badgeSvg = (
        <SequencedLogo
            slot={slot}
            variant="badge-ring"
            dotColor={dotColor}
            ringColor={ringColor}
            width={metrics.sizeCss}
            height={metrics.sizeCss}
            clipBottomY={dynamicClipDesignY}
        />
    );

    // MODE 1 (`in-flow`), MODE 4 (`scroll-nudge`):
    // Pure in-flow normal document block (NO position:fixed, NO position:absolute, NO transform, NO overflow clip).
    if (mode === 'in-flow' || mode === 'scroll-nudge') {
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
                <div style={{ width: metrics.sizeCss, height: metrics.sizeCss }}>{badgeSvg}</div>
            </div>
        );
    }

    // MODE 6 (`lvh-canvas`):
    // Full 100lvh non-fixed canvas: badge sits inside the 100lvh `<main>` at exact docTop with no transform.
    if (mode === 'lvh-canvas') {
        return (
            <div
                data-pw="safari-splash-badge-lvh"
                data-safari-badge-mode={mode}
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    top: Math.max(0, metrics.docTop),
                    left: 0,
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    zIndex: 50,
                }}
            >
                <div style={{ width: metrics.sizeCss, height: metrics.sizeCss }}>{badgeSvg}</div>
            </div>
        );
    }

    // MODE 5 (`sticky-0w`):
    // Document-layer 0x0 `position: sticky; bottom: 0` anchor inside the tall flow document.
    if (mode === 'sticky-0w') {
        const belowWindowBottom = metrics.viewportTop + metrics.sizeCss - metrics.innerH;
        return (
            <div
                data-pw="safari-splash-badge-sticky0w"
                data-safari-badge-mode={mode}
                aria-hidden="true"
                style={{
                    position: 'sticky',
                    bottom: 0,
                    width: 0,
                    height: 0,
                    margin: '0 auto',
                    pointerEvents: 'none',
                    zIndex: 50,
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        left: -metrics.sizeCss / 2,
                        bottom: -belowWindowBottom,
                        width: metrics.sizeCss,
                        height: metrics.sizeCss,
                    }}
                >
                    {badgeSvg}
                </div>
            </div>
        );
    }

    // MODE 2 (`fixed-0w`):
    // Body-portaled 0x0 `position: fixed; bottom: 0; left: 50%` anchor (exact 1dfc910bf proof).
    if (mode === 'fixed-0w') {
        const belowWindowBottom = metrics.viewportTop + metrics.sizeCss - metrics.innerH;
        return createPortal(
            <div
                data-pw="safari-splash-badge-fixed0w"
                data-safari-badge-mode={mode}
                aria-hidden="true"
                style={{
                    position: 'fixed',
                    left: '50%',
                    bottom: 0,
                    width: 0,
                    height: 0,
                    zIndex: 2147483640,
                    pointerEvents: 'none',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        left: -metrics.sizeCss / 2,
                        bottom: -belowWindowBottom,
                        width: metrics.sizeCss,
                        height: metrics.sizeCss,
                    }}
                >
                    {badgeSvg}
                </div>
            </div>,
            document.body,
        );
    }

    // MODE 3 (`body-layer`):
    // Exact `/demo` `Layer` portal directly on `document.body` (`demo-doc-room` + 0x0 absolute anchor).
    return createPortal(
        <>
            <div
                aria-hidden="true"
                data-pw="safari-splash-doc-room"
                style={{
                    flex: '0 0 0px',
                    width: 0,
                    height: metrics.scrollY + metrics.innerH + UNDER_BAR + 100,
                    pointerEvents: 'none',
                }}
            />
            <div
                data-pw="safari-splash-badge-layer"
                data-safari-badge-mode={mode}
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    top: metrics.scrollY,
                    left: '50%',
                    width: 0,
                    height: 0,
                    zIndex: 2147483050,
                    pointerEvents: 'none',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: `calc(${COLUMN_W} / -2)`,
                        width: COLUMN_W,
                        height: metrics.innerH + UNDER_BAR,
                        pointerEvents: 'none',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            top: metrics.viewportTop,
                            left: '50%',
                            marginLeft: -metrics.sizeCss / 2,
                            width: metrics.sizeCss,
                            height: metrics.sizeCss,
                        }}
                    >
                        {badgeSvg}
                    </div>
                </div>
            </div>
        </>,
        document.body,
    );
}

/**
 * Visual 3-layer diagnostic rulers across `window.innerHeight - 20px .. +100px`.
 * One screenshot immediately reveals which compositing layer Safari 26 paints
 * across the strip and at what exact CSS px Safari's floating bar starts.
 */
function RulerTicks({ color, label }: { color: string; label: string }) {
    const marks = [-20, 0, 10, 16, 20, 30, 40, 60, 80];
    return (
        <div
            style={{
                position: 'relative',
                width: 30,
                height: 120,
                background: `${color}22`,
                borderLeft: `2px solid ${color}`,
                fontSize: 8,
                fontFamily: 'monospace',
                fontWeight: 700,
                color,
                lineHeight: 1,
                pointerEvents: 'none',
            }}
        >
            <div style={{ position: 'absolute', top: 0, left: 2, background: '#fff', padding: '0 1px' }}>
                {label}
            </div>
            {marks.map((m) => (
                <div
                    key={m}
                    style={{
                        position: 'absolute',
                        top: m + 20,
                        left: 0,
                        width: 28,
                        borderTop: `1px solid ${m === 0 ? '#000' : color}`,
                        paddingLeft: 2,
                    }}
                >
                    {m >= 0 ? `+${m}` : m}
                </div>
            ))}
        </div>
    );
}

function SafariRulerProbe({ show }: { show: boolean }) {
    const [innerH, setInnerH] = useState(0);
    useEffect(() => {
        if (!show) return;
        const update = () => setInnerH(window.innerHeight);
        update();
        window.addEventListener('resize', update);
        window.visualViewport?.addEventListener('resize', update);
        return () => {
            window.removeEventListener('resize', update);
            window.visualViewport?.removeEventListener('resize', update);
        };
    }, [show]);

    if (!show || !innerH || typeof document === 'undefined') return null;

    return createPortal(
        <>
            {/* Green: absolute on body (document layer) */}
            <div
                data-pw="safari-ruler-abs"
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    top: innerH - 20 + (window.scrollY || 0),
                    right: 4,
                    zIndex: 2147483647,
                    pointerEvents: 'none',
                }}
            >
                <RulerTicks color="#16a34a" label="ABS" />
            </div>
            {/* Red: 0-width fixed anchor on body */}
            <div
                data-pw="safari-ruler-fix0"
                aria-hidden="true"
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 4,
                    width: 0,
                    height: 0,
                    zIndex: 2147483647,
                    pointerEvents: 'none',
                }}
            >
                <div style={{ position: 'absolute', left: 0, bottom: -100 }}>
                    <RulerTicks color="#dc2626" label="FIX0" />
                </div>
            </div>
        </>,
        document.body,
    );
}

interface DiagnosticsSnapshot {
    isSafari26: boolean;
    innerH: number;
    outerH: number;
    scrollH: number;
    scrollY: number;
    lvh: number;
    dvh: number;
    svh: number;
    safeBottom: string;
    bodyOverflow: string;
    htmlOverflowX: string;
    fixedAtBottom: string[];
}

function measureUnitPx(unit: string): number {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;height:${unit};top:0;left:0;`;
    document.body.appendChild(el);
    const h = Math.round(el.getBoundingClientRect().height * 10) / 10;
    el.remove();
    return h;
}

function readDiagnostics(): DiagnosticsSnapshot {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;visibility:hidden;padding-bottom:env(safe-area-inset-bottom,0px)';
    document.body.appendChild(probe);
    const safeBottom = getComputedStyle(probe).paddingBottom;
    probe.remove();

    // Hit-test the exact point WebKit's LocalFrameView::fixedContainerEdges probes!
    const fixedFound = new Set<string>();
    const hits = document.elementsFromPoint(window.innerWidth / 2, Math.max(0, window.innerHeight - 4));
    for (const hit of hits) {
        for (let el: Element | null = hit; el && el !== document.documentElement; el = el.parentElement) {
            const st = getComputedStyle(el);
            if (st.position === 'fixed' || st.position === 'sticky') {
                const r = el.getBoundingClientRect();
                const tag = el.tagName.toLowerCase();
                const pw = el.getAttribute('data-pw') || el.id || '';
                fixedFound.add(`${st.position} ${tag}${pw ? `[${pw}]` : ''} w=${Math.round(r.width)} h=${Math.round(r.height)}`);
            }
        }
    }

    return {
        isSafari26: isFloatingBarSafari(navigator.userAgent),
        innerH: window.innerHeight,
        outerH: window.outerHeight,
        scrollH: document.documentElement.scrollHeight,
        scrollY: Math.round(window.scrollY),
        lvh: measureUnitPx('100lvh'),
        dvh: measureUnitPx('100dvh'),
        svh: measureUnitPx('100svh'),
        safeBottom,
        bodyOverflow: getComputedStyle(document.body).overflow,
        htmlOverflowX: getComputedStyle(document.documentElement).overflowX,
        fixedAtBottom: [...fixedFound],
    };
}

interface SafariSplashDebugMenuProps {
    settings: SafariSplashSettings;
    effectiveMode: SafariSplashMode;
    isSafari26: boolean;
    onUpdate: (patch: Partial<SafariSplashSettings>) => void;
    onReplay?: () => void;
}

/**
 * Compact, refresh-surviving debug pill tucked at the top-right of the splash
 * screen so testers can switch between all 6 approaches, adjust band offset,
 * pause the 8s timer, and inspect live WebKit diagnostics in one deploy.
 */
export function SafariSplashDebugMenu({
    settings,
    effectiveMode,
    isSafari26,
    onUpdate,
    onReplay,
}: SafariSplashDebugMenuProps) {
    const [open, setOpen] = useState(false);
    const [diag, setDiag] = useState<DiagnosticsSnapshot | null>(null);
    const [mounted, setMounted] = useState(false);
    const panelId = useId();

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (!open) return;
        const refresh = () => setDiag(readDiagnostics());
        refresh();
        const t = setInterval(refresh, 1000);
        return () => clearInterval(t);
    }, [open, effectiveMode, settings.bandPx]);

    // Never interfere with unit test snapshots/queries unless explicitly opened.
    if (!mounted || process.env.NODE_ENV === 'test') return null;

    const currentInfo = SAFARI_SPLASH_MODES.find((m) => m.id === effectiveMode) ?? SAFARI_SPLASH_MODES[0];

    const selectMode = (mode: SafariSplashMode, reload = false) => {
        const next: SafariSplashSettings = { ...settings, mode };
        writeSafariSplashSettings(next);
        onUpdate({ mode });
        if (reload) {
            window.location.reload();
        }
    };

    const ui = (
        <>
            <SafariRulerProbe show={settings.showRuler} />
            <div
                data-pw="safari-splash-debug"
                className="font-quicksand select-none"
                style={{
                    position: 'fixed',
                    top: 'calc(env(safe-area-inset-top, 0px) + 8px)',
                    right: 8,
                    zIndex: 2147483647,
                    width: open ? 'min(330px, calc(100vw - 16px))' : 'auto',
                }}
            >
                <div className="flex items-center justify-end gap-1.5">
                    {settings.pauseSplash && (
                        <button
                            type="button"
                            onClick={() => onUpdate({ pauseSplash: false })}
                            className="px-2 py-1 text-[11px] font-bold rounded-full bg-amber-500 text-white shadow cursor-pointer"
                            title="Splash 8s timer is paused — tap to resume"
                        >
                            Paused
                        </button>
                    )}
                    <button
                        type="button"
                        aria-expanded={open}
                        aria-controls={panelId}
                        data-pw="safari-debug-toggle"
                        onClick={() => setOpen((v) => !v)}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-[#141414]/90 text-white shadow-md border border-white/15 backdrop-blur-sm cursor-pointer flex items-center gap-1.5"
                    >
                        <span className="w-2 h-2 rounded-full bg-[#7C6BFF]" />
                        <span>{open ? 'Close Lab' : `Lab: ${currentInfo.short} (+${settings.bandPx})`}</span>
                    </button>
                </div>

                {open && (
                    <div
                        id={panelId}
                        data-pw="safari-debug-panel"
                        className="mt-1.5 rounded-2xl bg-[#141414]/95 text-white border border-white/15 shadow-2xl p-3 text-[11px] max-h-[75dvh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
                            <div>
                                <div className="font-bold text-[12px]">Safari 26 Bottom Logo Lab</div>
                                <div className="text-[10px] text-gray-400">
                                    Persists across refresh · {isSafari26 ? 'Safari 26 detected' : 'Non-Safari UA'}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                                className="px-2.5 py-1 rounded-lg bg-[#402CDD] text-white font-bold text-[11px] cursor-pointer"
                            >
                                Reload
                            </button>
                        </div>

                        {/* Strategy picker */}
                        <div className="mt-2.5">
                            <div className="text-[10px] uppercase tracking-wide text-gray-400 font-bold mb-1.5">
                                Fix Strategy (tap = live, ↻ = clean frame-0 reload)
                            </div>
                            <div className="flex flex-col gap-1">
                                {SAFARI_SPLASH_MODES.map((m) => {
                                    const selected = effectiveMode === m.id;
                                    return (
                                        <div
                                            key={m.id}
                                            className={`flex items-start gap-1.5 p-1.5 rounded-xl border ${
                                                selected
                                                    ? 'bg-[#402CDD]/30 border-[#7C6BFF]'
                                                    : 'bg-white/5 border-white/5'
                                            }`}
                                        >
                                            <button
                                                type="button"
                                                data-pw={`safari-mode-${m.id}`}
                                                onClick={() => selectMode(m.id, false)}
                                                className="flex-1 text-left cursor-pointer"
                                            >
                                                <div className="font-bold text-[11px] text-white">{m.title}</div>
                                                <div className="text-[10px] text-gray-300 leading-snug">{m.desc}</div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => selectMode(m.id, true)}
                                                title="Save mode and hard reload (tests frame 0)"
                                                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold cursor-pointer shrink-0"
                                            >
                                                ↻
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Band & Clip tuning */}
                        <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-gray-300 font-semibold">
                                    Bar drop: <strong className="text-white">{settings.bandPx}px</strong>
                                </span>
                                <div className="flex items-center gap-1">
                                    {[12, 16, 20, 24, 28].map((v) => (
                                        <button
                                            key={v}
                                            type="button"
                                            onClick={() => onUpdate({ bandPx: v })}
                                            className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer ${
                                                settings.bandPx === v
                                                    ? 'bg-[#402CDD] text-white font-bold'
                                                    : 'bg-white/10 text-gray-200'
                                            }`}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={40}
                                step={1}
                                value={settings.bandPx}
                                onChange={(e) => onUpdate({ bandPx: Number(e.target.value) })}
                                className="w-full accent-[#7C6BFF]"
                            />

                            <div className="flex items-center justify-between gap-2">
                                <span className="text-gray-300 font-semibold">
                                    SVG clip Y: <strong className="text-white">{settings.clipDesignY}</strong>{' '}
                                    <span className="text-gray-500">(&quot;try&quot;@69.4)</span>
                                </span>
                                <div className="flex items-center gap-1">
                                    {[61, 66, 68, 80].map((v) => (
                                        <button
                                            key={v}
                                            type="button"
                                            onClick={() => onUpdate({ clipDesignY: v })}
                                            className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer ${
                                                settings.clipDesignY === v
                                                    ? 'bg-[#402CDD] text-white font-bold'
                                                    : 'bg-white/10 text-gray-200'
                                            }`}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Toggles */}
                        <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap gap-2">
                            <label className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.pauseSplash}
                                    onChange={(e) => onUpdate({ pauseSplash: e.target.checked })}
                                    className="accent-[#7C6BFF]"
                                />
                                <span>Pause 8s splash</span>
                            </label>
                            <label className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.showRuler}
                                    onChange={(e) => onUpdate({ showRuler: e.target.checked })}
                                    className="accent-[#7C6BFF]"
                                />
                                <span>Pixel rulers</span>
                            </label>
                            {onReplay && (
                                <button
                                    type="button"
                                    onClick={onReplay}
                                    className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer"
                                >
                                    Replay splash
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    writeSafariSplashSettings(DEFAULT_SETTINGS);
                                    onUpdate(DEFAULT_SETTINGS);
                                    window.location.reload();
                                }}
                                className="px-2 py-1 rounded-lg bg-red-500/20 text-red-200 cursor-pointer"
                            >
                                Reset
                            </button>
                        </div>

                        {/* Live WebKit diagnostics */}
                        {diag && (
                            <div className="mt-2.5 pt-2 border-t border-white/10 text-[10px] font-mono text-gray-300 space-y-0.5">
                                <div>
                                    innerH={diag.innerH} outerH={diag.outerH} scrollH={diag.scrollH} y={diag.scrollY}
                                </div>
                                <div>
                                    lvh={diag.lvh} dvh={diag.dvh} svh={diag.svh} safeB={diag.safeBottom}
                                </div>
                                <div>
                                    body.ov={diag.bodyOverflow} html.ovX={diag.htmlOverflowX}
                                </div>
                                <div className="pt-1 text-gray-400">
                                    fixed/sticky @(50%, innerH-4):{' '}
                                    {diag.fixedAtBottom.length === 0 ? (
                                        <span className="text-emerald-400">NONE (clean)</span>
                                    ) : (
                                        <span className="text-amber-300">{diag.fixedAtBottom.join(' | ')}</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );

    return createPortal(ui, document.body);
}
