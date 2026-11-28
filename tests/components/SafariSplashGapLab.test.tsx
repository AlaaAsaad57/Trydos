import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import NewLoginWidget from 'NewLoginDesign/NewLoginWidget';
import {
    DEFAULT_BAND_PX,
    DEFAULT_CLIP_DESIGN_Y,
    SAFARI_SPLASH_MODES,
    SAFARI_SPLASH_STORAGE_KEY,
    SAFARI_SPLASH_STYLE_ID,
    buildSafariSplashCss,
    buildSafariSplashPrepaintScript,
    readSafariSplashSettings,
    resolveSafariSplashMode,
    writeSafariSplashSettings,
    type SafariSplashMode,
} from 'NewLoginDesign/SafariSplashGapLab';
import { LOGO_GEOMETRY } from 'NewLoginDesign/animations/geometry';
import { TOP_TINT_TEST_ID } from 'components/DemoApp/topTint';
import { CANVAS_FIT_STYLE_ID } from 'scaling/canvasFit';

vi.mock('next/navigation', () => ({
    useParams: () => ({ lang: 'sy-en' }),
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

vi.mock('embla-carousel-react', () => ({
    default: () => [
        () => {},
        { selectedScrollSnap: () => 0, on() {}, off() {}, scrollTo() {}, scrollNext() {} },
    ],
}));

class FakeResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}

const SAFARI_26 =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';
const CHROME_IOS =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1';
const CHROME_ANDROID =
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';

describe('SafariSplashGapLab — Safari 26 splash bottom-logo strategies', () => {
    const originalInnerHeight = window.innerHeight;

    beforeEach(() => {
        vi.stubGlobal('ResizeObserver', FakeResizeObserver);
        Object.defineProperty(window, 'innerHeight', {
            configurable: true,
            writable: true,
            value: 858,
        });
        window.localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        Object.defineProperty(window, 'innerHeight', {
            configurable: true,
            writable: true,
            value: originalInnerHeight,
        });
        window.localStorage.clear();
        document.getElementById(SAFARI_SPLASH_STYLE_ID)?.remove();
        document.getElementById(CANVAS_FIT_STYLE_ID)?.remove();
        document.getElementById('xd-outer-bg')?.remove();
        document.body.querySelector(`[data-pw="${TOP_TINT_TEST_ID}"]`)?.remove();
        document.documentElement.removeAttribute('style');
        document.body.removeAttribute('style');
    });

    it('defaults clipDesignY strictly between the 61px bar edge and "try" wordmark top (69.37px)', () => {
        const wordTop = LOGO_GEOMETRY['badge-ring'].wordmark.y;
        expect(DEFAULT_CLIP_DESIGN_Y).toBeGreaterThan(61);
        expect(DEFAULT_CLIP_DESIGN_Y).toBeLessThan(wordTop);
    });

    it('generates clean frame-0 CSS for every active mode without overflow-x:hidden/overflow-y:visible or html:has()', () => {
        expect(buildSafariSplashCss('off')).toBe('');
        for (const info of SAFARI_SPLASH_MODES) {
            if (info.id === 'off') continue;
            const css = buildSafariSplashCss(info.id);
            expect(css.length).toBeGreaterThan(0);
            expect(css).not.toContain('overflow-x:hidden');
            expect(css).not.toContain('html:has(');
            expect(css).toContain('[data-pw="new-login-widget"][data-splash-waiting]');
            expect(css).not.toContain('position:fixed');
        }
    });

    it('puts every frame-0 rule inside @layer utilities, so position:relative beats the layered .fixed !important of Tailwind', () => {
        // Tailwind 4 with `important: true` writes `.fixed { position: fixed !important }`
        // inside `@layer utilities`. For !important rules a layered rule beats an
        // unlayered one, so an unlayered override never takes <main> out of
        // `fixed`. Safari 26 then finds a viewport-sized fixed white box at the
        // bottom edge and paints its solid colour view over the room under its
        // bar (seen on the iPhone in all six modes, 2026-11-28). Inside the same
        // layer, the higher specificity of the lab's selector wins.
        for (const info of SAFARI_SPLASH_MODES) {
            if (info.id === 'off') continue;
            const css = buildSafariSplashCss(info.id);
            expect(css.startsWith('@layer utilities{'), `${info.id}: CSS must open with @layer utilities{`).toBe(true);
            expect(css.endsWith('}'), `${info.id}: CSS must close the layer block`).toBe(true);
            const inner = css.slice('@layer utilities{'.length, -1);
            expect(inner, `${info.id}: no rule may sit outside the layer block`).not.toContain('@layer');
            expect(inner, `${info.id}: the widget's position override must be in the layer`).toMatch(
                /\[data-pw="new-login-widget"\]\[data-splash-waiting\]\{position:(relative|absolute)!important/,
            );
        }
    });

    it('persists lab settings across reloads and resolves browser defaults safely', () => {
        expect(resolveSafariSplashMode(readSafariSplashSettings(), SAFARI_26)).toBe('in-flow');
        expect(resolveSafariSplashMode(readSafariSplashSettings(), CHROME_ANDROID)).toBe('off');
        expect(resolveSafariSplashMode(readSafariSplashSettings(), CHROME_IOS)).toBe('off');

        writeSafariSplashSettings({
            mode: 'fixed-0w',
            bandPx: 20,
            clipDesignY: 67,
            pauseSplash: true,
            showRuler: true,
        });
        const reloaded = readSafariSplashSettings();
        expect(reloaded).toEqual({
            mode: 'fixed-0w',
            bandPx: 20,
            clipDesignY: 67,
            pauseSplash: true,
            showRuler: true,
        });
        expect(resolveSafariSplashMode(reloaded, SAFARI_26)).toBe('fixed-0w');
    });

    it('renders the synchronous pre-paint script ahead of <main> and injects frame-0 styles on Safari 26 only', () => {
        const html = renderToString(<NewLoginWidget />);
        const scriptAt = html.indexOf(SAFARI_SPLASH_STYLE_ID);
        const mainAt = html.indexOf('data-pw="new-login-widget"');
        expect(scriptAt).toBeGreaterThan(-1);
        expect(scriptAt).toBeLessThan(mainAt);

        vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(CHROME_ANDROID);
        new Function(buildSafariSplashPrepaintScript())();
        expect(document.getElementById(SAFARI_SPLASH_STYLE_ID)).toBeNull();

        vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(SAFARI_26);
        new Function(buildSafariSplashPrepaintScript())();
        const styleEl = document.getElementById(SAFARI_SPLASH_STYLE_ID);
        expect(styleEl).not.toBeNull();
        expect(styleEl!.textContent).toBe(buildSafariSplashCss('in-flow'));
    });

    it('activates in-flow Safari 26 mode during splash and restores fixed scaler cleanly on Get Started without remounting', () => {
        vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(SAFARI_26);
        const { container, unmount } = render(<NewLoginWidget />);

        const widget = container.querySelector<HTMLElement>('[data-pw="new-login-widget"]')!;
        const appOuter = container.querySelector<HTMLElement>('#app-outer')!;
        const stageBefore = container.querySelector<HTMLElement>('[data-pw="login-stage"]')!;

        expect(widget.hasAttribute('data-splash-waiting')).toBe(true);
        expect(widget.getAttribute('data-safari-splash-mode')).toBe('in-flow');
        expect(appOuter.style.position).toBe('relative');
        expect(document.body.style.overflow).toBe('');
        expect(document.getElementById(SAFARI_SPLASH_STYLE_ID)?.textContent).toBe(
            buildSafariSplashCss('in-flow'),
        );

        // Advance to Get Started: splash mode turns off cleanly without remounting the stage.
        fireEvent.click(container.querySelector('[data-pw="demo-flow-steps"]')!);
        fireEvent.click(container.querySelector('[data-pw="demo-step-get-started"]')!);

        expect(container.querySelector('[data-pw="login-stage"]')).toBe(stageBefore);
        expect(widget.hasAttribute('data-splash-waiting')).toBe(false);
        expect(widget.getAttribute('data-safari-splash-mode')).toBeNull();
        expect(appOuter.style.position).toBe('fixed');
        expect(document.body.style.overflow).toBe('hidden');
        expect(document.getElementById(SAFARI_SPLASH_STYLE_ID)).toBeNull();

        unmount();
    });

    for (const mode of ['fixed-0w', 'body-layer', 'scroll-nudge', 'sticky-0w', 'lvh-canvas'] as SafariSplashMode[]) {
        it(`activates and cleanly tears down mode "${mode}"`, () => {
            vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(SAFARI_26);
            writeSafariSplashSettings({
                mode,
                bandPx: DEFAULT_BAND_PX,
                clipDesignY: DEFAULT_CLIP_DESIGN_Y,
                pauseSplash: false,
                showRuler: false,
            });
            const { container, unmount } = render(<NewLoginWidget />);
            const widget = container.querySelector<HTMLElement>('[data-pw="new-login-widget"]')!;
            expect(widget.getAttribute('data-safari-splash-mode')).toBe(mode);
            expect(document.getElementById(SAFARI_SPLASH_STYLE_ID)?.textContent).toBe(
                buildSafariSplashCss(mode),
            );
            if (mode === 'fixed-0w' || mode === 'sticky-0w' || mode === 'lvh-canvas') {
                const strip = document.body.querySelector<HTMLElement>(`[data-pw="${TOP_TINT_TEST_ID}"]`);
                expect(strip?.style.visibility).toBe('visible');
                expect(strip?.style.mixBlendMode).toBe('multiply');
            }
            unmount();
            expect(document.getElementById(SAFARI_SPLASH_STYLE_ID)).toBeNull();
        });
    }

    for (const [label, ua] of [
        ['Chrome on iPhone', CHROME_IOS],
        ['Chrome on Android', CHROME_ANDROID],
    ] as const) {
        it(`leaves ${label} completely untouched by default`, () => {
            vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ua);
            const { container, unmount } = render(<NewLoginWidget />);
            const widget = container.querySelector<HTMLElement>('[data-pw="new-login-widget"]')!;
            const appOuter = container.querySelector<HTMLElement>('#app-outer')!;
            expect(widget.getAttribute('data-safari-splash-mode')).toBeNull();
            expect(appOuter.style.position).toBe('fixed');
            expect(document.getElementById(SAFARI_SPLASH_STYLE_ID)).toBeNull();
            unmount();
        });
    }
});
