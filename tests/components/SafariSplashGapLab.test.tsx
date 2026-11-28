import React from 'react';
import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import NewLoginWidget from 'NewLoginDesign/NewLoginWidget';
import {
    DEFAULT_CLIP_DESIGN_Y,
    SAFARI_SPLASH_STYLE_ID,
    buildSafariSplashCss,
    buildSafariSplashPrepaintScript,
    resolveSafariSplashMode,
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

/** The key the lab on `development` saved its hand-picked mode under. */
const OLD_LAB_KEY = 'trydos.safariSplashLogoLab.v1';

describe('SafariSplashGapLab — the Safari 26 splash fix, with no debug tools (Stage 7e, S7e-4)', () => {
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
        window.history.replaceState(null, '', '/');
        document.getElementById(SAFARI_SPLASH_STYLE_ID)?.remove();
        document.getElementById(CANVAS_FIT_STYLE_ID)?.remove();
        document.getElementById('xd-outer-bg')?.remove();
        document.body.querySelector(`[data-pw="${TOP_TINT_TEST_ID}"]`)?.remove();
        document.documentElement.removeAttribute('style');
        document.body.removeAttribute('style');
    });

    it('defaults clipDesignY strictly between the 61px bar edge and "try" wordmark top (69.37px)', () => {
        const wordTop = LOGO_GEOMETRY['badge-ring'].wordmark.y;
        expect(DEFAULT_CLIP_DESIGN_Y, 'the cover line must sit under the bar edge (61)').toBeGreaterThan(61);
        expect(DEFAULT_CLIP_DESIGN_Y, 'the cover line must stay above the "try" wordmark').toBeLessThan(wordTop);
    });

    it('an iPhone Safari 26 user agent gets in-flow, any other gets off', () => {
        expect(resolveSafariSplashMode(SAFARI_26), 'iPhone Safari 26 must get the in-flow fix').toBe('in-flow');
        expect(resolveSafariSplashMode(CHROME_IOS), 'Chrome on iPhone must get no fix').toBe('off');
        expect(resolveSafariSplashMode(CHROME_ANDROID), 'Chrome on Android must get no fix').toBe('off');
    });

    it('only in-flow and off exist: off writes no CSS, in-flow writes clean frame-0 CSS', () => {
        expect(buildSafariSplashCss('off'), 'off must write no stylesheet').toBe('');
        const css = buildSafariSplashCss('in-flow');
        expect(css.length, 'in-flow must write a stylesheet').toBeGreaterThan(0);
        expect(css, 'overflow-x:hidden computes to overflow-y:auto and brings the cut back').not.toContain('overflow-x:hidden');
        expect(css, 'html:has() can miss the WebKit root update').not.toContain('html:has(');
        expect(css, 'the rules must be scoped to the waiting widget').toContain('[data-pw="new-login-widget"][data-splash-waiting]');
        expect(css, 'the fix must never put a fixed box back').not.toContain('position:fixed');
        expect(css, 'the fix must reach the login stage by its name').toContain('[data-pw="login-stage"]');
    });

    it('puts every frame-0 rule inside @layer utilities, so position:relative beats the layered .fixed !important of Tailwind', () => {
        // Tailwind 4 with `important: true` writes `.fixed { position: fixed !important }`
        // inside `@layer utilities`. For !important rules a layered rule beats an
        // unlayered one, so an unlayered override never takes <main> out of
        // `fixed`. Safari 26 then finds a viewport-sized fixed white box at the
        // bottom edge and paints its solid colour view over the room under its
        // bar (seen on the iPhone, 2026-11-28). Inside the same layer, the higher
        // specificity of the fix's selector wins.
        const css = buildSafariSplashCss('in-flow');
        expect(css.startsWith('@layer utilities{'), 'the CSS must open with @layer utilities{').toBe(true);
        expect(css.endsWith('}'), 'the CSS must close the layer block').toBe(true);
        const inner = css.slice('@layer utilities{'.length, -1);
        expect(inner, 'no rule may sit outside the layer block').not.toContain('@layer');
        expect(inner, "the widget's position override must be in the layer").toMatch(
            /\[data-pw="new-login-widget"\]\[data-splash-waiting\]\{position:relative!important/,
        );
    });

    it('renders the synchronous pre-paint script ahead of <main> and injects frame-0 styles on Safari 26 only', () => {
        const html = renderToString(<NewLoginWidget />);
        const scriptAt = html.indexOf(SAFARI_SPLASH_STYLE_ID);
        const mainAt = html.indexOf('data-pw="new-login-widget"');
        expect(scriptAt, 'the pre-paint script is missing from the server HTML').toBeGreaterThan(-1);
        expect(scriptAt, 'the pre-paint script must come before <main>').toBeLessThan(mainAt);

        vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(CHROME_ANDROID);
        new Function(buildSafariSplashPrepaintScript())();
        expect(document.getElementById(SAFARI_SPLASH_STYLE_ID), 'Chrome on Android got the frame-0 style').toBeNull();

        vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(SAFARI_26);
        new Function(buildSafariSplashPrepaintScript())();
        const styleEl = document.getElementById(SAFARI_SPLASH_STYLE_ID);
        expect(styleEl, 'iPhone Safari 26 did not get the frame-0 style').not.toBeNull();
        expect(styleEl!.textContent, 'the frame-0 style must be the in-flow CSS').toBe(buildSafariSplashCss('in-flow'));
    });

    it('a safariFix parameter and a saved setting do not change the mode', () => {
        window.localStorage.setItem(OLD_LAB_KEY, JSON.stringify({ mode: 'fixed-0w', bandPx: 20 }));
        window.history.replaceState(null, '', '/sy-en/login?safariFix=off');

        vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(SAFARI_26);
        new Function(buildSafariSplashPrepaintScript())();
        expect(
            document.getElementById(SAFARI_SPLASH_STYLE_ID)?.textContent,
            '?safariFix=off or the saved setting changed the frame-0 style',
        ).toBe(buildSafariSplashCss('in-flow'));

        const { container, unmount } = render(<NewLoginWidget />);
        const widget = container.querySelector<HTMLElement>('[data-pw="new-login-widget"]')!;
        expect(widget.getAttribute('data-safari-splash-mode'), 'the widget took a mode from the address or the saved setting').toBe('in-flow');
        unmount();

        vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(CHROME_ANDROID);
        window.history.replaceState(null, '', '/sy-en/login?safariFix=in-flow');
        new Function(buildSafariSplashPrepaintScript())();
        expect(document.getElementById(SAFARI_SPLASH_STYLE_ID), '?safariFix=in-flow turned the fix on in Chrome').toBeNull();
    });

    it('no debug menu, ruler or badge is rendered', () => {
        vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(SAFARI_26);
        const { unmount } = render(<NewLoginWidget />);
        expect(document.querySelector('[data-pw="safari-splash-debug"]'), 'the debug menu is on the login').toBeNull();
        expect(document.querySelector('[data-pw="safari-debug-toggle"]'), 'the debug toggle is on the login').toBeNull();
        expect(document.querySelector('[data-pw^="safari-ruler"]'), 'a ruler is on the login').toBeNull();
        unmount();
    });

    it('activates in-flow on Safari 26 while the splash waits, and tears down cleanly', () => {
        vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(SAFARI_26);
        const { container, unmount } = render(<NewLoginWidget />);

        const widget = container.querySelector<HTMLElement>('[data-pw="new-login-widget"]')!;
        const appOuter = container.querySelector<HTMLElement>('#app-outer')!;

        expect(widget.hasAttribute('data-splash-waiting'), 'the widget is not marked as waiting').toBe(true);
        expect(widget.getAttribute('data-safari-splash-mode'), 'the widget did not take in-flow').toBe('in-flow');
        expect(container.querySelector('[data-pw="login-stage"]'), 'the stage lost its name: the fix CSS cannot reach it').not.toBeNull();
        expect(appOuter.style.position, '#app-outer must leave fixed while the splash waits').toBe('relative');
        expect(document.body.style.overflow, 'the body must stay scrollable while the splash waits').toBe('');
        expect(document.getElementById(SAFARI_SPLASH_STYLE_ID)?.textContent, 'the in-flow stylesheet is not in the head').toBe(
            buildSafariSplashCss('in-flow'),
        );

        unmount();
        expect(document.getElementById(SAFARI_SPLASH_STYLE_ID), 'the stylesheet stayed after the login closed').toBeNull();
    });

    for (const [label, ua] of [
        ['Chrome on iPhone', CHROME_IOS],
        ['Chrome on Android', CHROME_ANDROID],
    ] as const) {
        it(`leaves ${label} completely untouched`, () => {
            vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ua);
            const { container, unmount } = render(<NewLoginWidget />);
            const widget = container.querySelector<HTMLElement>('[data-pw="new-login-widget"]')!;
            const appOuter = container.querySelector<HTMLElement>('#app-outer')!;
            expect(widget.getAttribute('data-safari-splash-mode'), `${label} got a splash mode`).toBeNull();
            expect(appOuter.style.position, `${label}: #app-outer must stay fixed`).toBe('fixed');
            expect(document.getElementById(SAFARI_SPLASH_STYLE_ID), `${label} got the frame-0 style`).toBeNull();
            unmount();
        });
    }
});
