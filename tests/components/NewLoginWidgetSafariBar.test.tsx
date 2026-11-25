import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import NewLoginWidget, {
    SAFARI_BADGE_CLIP_DESIGN,
    SAFARI_BAR_CSS,
} from 'NewLoginDesign/NewLoginWidget';
import { LOGO_GEOMETRY } from 'NewLoginDesign/animations/geometry';
import { TOP_TINT_TEST_ID } from 'components/DemoApp/topTint';
import { UNDER_BAR } from 'components/DemoApp1/demo1Layout';
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

describe("NewLoginWidget — round logo reaches Safari 26's floating bar without breaking other steps", () => {
    const originalInnerHeight = window.innerHeight;

    beforeEach(() => {
        vi.stubGlobal('ResizeObserver', FakeResizeObserver);
        Object.defineProperty(window, 'innerHeight', {
            configurable: true,
            writable: true,
            value: 858,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        Object.defineProperty(window, 'innerHeight', {
            configurable: true,
            writable: true,
            value: originalInnerHeight,
        });
        document.getElementById(CANVAS_FIT_STYLE_ID)?.remove();
        document.getElementById('xd-outer-bg')?.remove();
        document.body.querySelector(`[data-pw="${TOP_TINT_TEST_ID}"]`)?.remove();
        document.documentElement.removeAttribute('style');
        document.body.removeAttribute('style');
    });

    it('clips the waiting badge in design coordinates past Safari bar top (61 px) and strictly above "try" (69.37 px)', () => {
        const badgeGeo = LOGO_GEOMETRY['badge-ring'];
        expect(SAFARI_BADGE_CLIP_DESIGN).toBeGreaterThan(61);
        expect(SAFARI_BADGE_CLIP_DESIGN).toBeLessThan(badgeGeo.wordmark.y);
    });

    it('renders synchronous <style> ahead of <main> and #app-outer as absolute on frame 0 (even on client Suspense mount)', () => {
        vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(SAFARI_26);
        const html = renderToString(<NewLoginWidget />);

        const styleAt = html.indexOf('@supports (-webkit-touch-callout: none)');
        const mainAt = html.indexOf('data-pw="new-login-widget"');
        expect(styleAt, 'frame-0 iOS column <style> was not rendered').toBeGreaterThan(-1);
        expect(
            styleAt,
            'frame-0 iOS column <style> must precede <main> so WebKit never sees a fixed bottom box on frame 0',
        ).toBeLessThan(mainAt);
        expect(
            html,
            '#app-outer rendered as position:fixed on frame 0, which latches Safari 26 fixedContainerEdges',
        ).toMatch(/id="app-outer"[^>]*position:absolute/);
    });

    it('activates Safari 26 compositing (blended top strip, unclipped document room, badge clip, no body overflow:hidden) on column steps and restores fixed mode on Get Started without remounting', () => {
        vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(SAFARI_26);
        const { container, unmount } = render(<NewLoginWidget />);

        const widget = container.querySelector<HTMLElement>('[data-pw="new-login-widget"]')!;
        const appOuter = container.querySelector<HTMLElement>('#app-outer')!;
        const stageBefore = container.querySelector<HTMLElement>('[data-pw="login-stage"]')!;

        // 1. Column step (`quick-preview`) in iPhone Safari 26:
        expect(widget.hasAttribute('data-safari-column')).toBe(true);
        expect(widget.hasAttribute('data-safari-under-bar')).toBe(true);
        expect(appOuter.style.position).toBe('absolute');
        expect(
            document.body.style.overflow,
            'AppScaler set overflow:hidden on <body>, which stops Safari 26 drawing below innerHeight',
        ).toBe('');
        expect(SAFARI_BAR_CSS).toContain(`calc(var(--app-canvas-height, 100dvh) + ${UNDER_BAR}px)`);

        // Blended white top strip (`1dfc910bf`): required on a headerless white
        // screen so WebKit isolates the root group and paints below innerHeight.
        const topStrip = document.body.querySelector<HTMLElement>(`[data-pw="${TOP_TINT_TEST_ID}"]`);
        expect(topStrip, 'missing blended white top strip on <body>').not.toBeNull();
        expect(topStrip!.style.visibility).toBe('visible');
        expect(topStrip!.style.mixBlendMode).toBe('multiply');

        // Document room block on <body> reaching UNDER_BAR past innerHeight.
        const room = document.body.querySelector<HTMLElement>('[data-pw="login-doc-room"]');
        expect(room).not.toBeNull();
        expect(room!.parentElement).toBe(document.body);
        expect(room!.style.height).toBe(`${858 + UNDER_BAR}px`);

        // 2. Step forward to Get Started: Safari under-bar mode turns off
        //    cleanly and the stage DOM node is NOT remounted.
        fireEvent.click(container.querySelector('[data-pw="demo-flow-steps"]')!);
        fireEvent.click(container.querySelector('[data-pw="demo-step-get-started"]')!);

        const stageAfter = container.querySelector<HTMLElement>('[data-pw="login-stage"]');
        expect(stageAfter, 'moving to Get Started remounted the login stage').toBe(stageBefore);
        expect(widget.hasAttribute('data-safari-column')).toBe(false);
        expect(widget.hasAttribute('data-safari-under-bar')).toBe(false);
        expect(appOuter.style.position).toBe('fixed');
        expect(document.body.style.overflow).toBe('hidden');
        expect(document.body.querySelector('[data-pw="login-doc-room"]')).toBeNull();
        expect(topStrip!.style.visibility).toBe('hidden');

        unmount();
    });

    for (const [label, ua] of [
        ['Chrome on iPhone', CHROME_IOS],
        ['Chrome on Android', CHROME_ANDROID],
    ] as const) {
        it(`does not turn on Safari 26 under-bar mode in ${label}`, () => {
            vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ua);
            const { container, unmount } = render(<NewLoginWidget />);
            const widget = container.querySelector<HTMLElement>('[data-pw="new-login-widget"]')!;
            expect(widget.hasAttribute('data-safari-under-bar')).toBe(false);
            expect(document.body.querySelector('[data-pw="login-doc-room"]')).toBeNull();
            expect(document.body.querySelector(`[data-pw="${TOP_TINT_TEST_ID}"]`)).toBeNull();
            unmount();
        });
    }
});
