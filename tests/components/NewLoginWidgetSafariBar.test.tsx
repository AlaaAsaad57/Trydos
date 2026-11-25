import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import NewLoginWidget, {
    SAFARI_BAR_CSS,
    SAFARI_BAR_SCRIPT,
    SAFARI_BAR_STYLE_ID,
    SAFARI_LOGO_REACH,
} from 'NewLoginDesign/NewLoginWidget';
import { SAFARI_BAND, UNDER_BAR } from 'components/DemoApp1/demo1Layout';
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
        document.getElementById(SAFARI_BAR_STYLE_ID)?.remove();
        document.getElementById(CANVAS_FIT_STYLE_ID)?.remove();
        document.getElementById('xd-outer-bg')?.remove();
        document.documentElement.removeAttribute('style');
        document.body.removeAttribute('style');
    });

    it('reaches past SAFARI_BAND (15.5 px) to tuck behind Safari bar, while clipping before "try" and well inside Safari pill', () => {
        expect(SAFARI_LOGO_REACH).toBeGreaterThan(SAFARI_BAND);
        // On the narrowest phone (scale ~0.87), "try" starts 8.37 * 0.87 = 7.3 px
        // below Safari's bar top (15.5 + 7.3 = 22.8 CSS px). SAFARI_LOGO_REACH must
        // stay strictly above that so no dark glyph smudges behind the glass pill.
        expect(SAFARI_LOGO_REACH).toBeLessThan(SAFARI_BAND + 8.37 * 0.87);
    });

    it('serves a pre-paint script ahead of #master-canvas that avoids fixed bottom boxes from frame 0 in iPhone Safari 26', () => {
        vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(SAFARI_26);
        const html = renderToString(<NewLoginWidget />);

        const safariScriptAt = html.indexOf(SAFARI_BAR_STYLE_ID);
        const canvasAt = html.indexOf('id="master-canvas"');
        expect(safariScriptAt, 'pre-paint Safari bar script was not rendered').toBeGreaterThan(-1);
        expect(
            safariScriptAt,
            'pre-paint Safari bar script must run ahead of #master-canvas so frame 0 never paints a fixed bottom box',
        ).toBeLessThan(canvasAt);

        new Function(SAFARI_BAR_SCRIPT)();
        const styleEl = document.getElementById(SAFARI_BAR_STYLE_ID);
        expect(styleEl, 'pre-paint script did not inject #login-safari-bar into <head>').not.toBeNull();
        expect(styleEl!.textContent).toBe(SAFARI_BAR_CSS);
        expect(
            document.documentElement.getAttribute('style') ?? '',
            'pre-paint script mutated <html> inline style, which causes a React hydration mismatch',
        ).toBe('');
    });

    it('mounts document room and switches off fixed bottom containers on column steps in iPhone Safari 26, then restores fixed mode on Get Started without remounting', () => {
        vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(SAFARI_26);
        const { container, unmount } = render(<NewLoginWidget />);

        const widget = container.querySelector<HTMLElement>('[data-pw="new-login-widget"]');
        const stageBefore = container.querySelector<HTMLElement>('[data-pw="login-stage"]');
        expect(widget).not.toBeNull();
        expect(stageBefore).not.toBeNull();

        // 1. Column step (`quick-preview`): marked for Safari bar reach, style in <head>,
        //    and an in-flow `login-doc-room` child on <body> reaching under Safari's bar.
        expect(widget!.hasAttribute('data-safari-column')).toBe(true);
        const styleEl = document.getElementById(SAFARI_BAR_STYLE_ID);
        expect(styleEl?.textContent).toContain('position:absolute!important');
        expect(styleEl?.textContent).toContain(`calc(100dvh + ${SAFARI_LOGO_REACH}px)`);

        const room = document.body.querySelector<HTMLElement>('[data-pw="login-doc-room"]');
        expect(room, 'no document room block on <body>, so Safari 26 stops drawing at innerHeight').not.toBeNull();
        expect(room!.parentElement).toBe(document.body);
        expect(room!.style.position).toBe('');
        expect(room!.style.height).toBe(`${858 + UNDER_BAR}px`);

        // 2. Step forward to Get Started via the demo step bar: Safari column mode
        //    turns off cleanly and the stage DOM node is NOT remounted.
        fireEvent.click(container.querySelector('[data-pw="demo-flow-steps"]')!);
        fireEvent.click(container.querySelector('[data-pw="demo-step-get-started"]')!);

        const stageAfter = container.querySelector<HTMLElement>('[data-pw="login-stage"]');
        expect(stageAfter, 'moving to Get Started remounted the login stage').toBe(stageBefore);
        expect(widget!.hasAttribute('data-safari-column')).toBe(false);
        expect(
            document.body.querySelector('[data-pw="login-doc-room"]'),
            'login-doc-room stayed on <body> after leaving the column step',
        ).toBeNull();

        // 3. Unmount removes #login-safari-bar from <head>.
        unmount();
        expect(document.getElementById(SAFARI_BAR_STYLE_ID)).toBeNull();
    });

    for (const [label, ua] of [
        ['Chrome on iPhone', CHROME_IOS],
        ['Chrome on Android', CHROME_ANDROID],
    ] as const) {
        it(`touches nothing in ${label}`, () => {
            vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ua);
            new Function(SAFARI_BAR_SCRIPT)();
            expect(document.getElementById(SAFARI_BAR_STYLE_ID)).toBeNull();

            const { unmount } = render(<NewLoginWidget />);
            expect(document.getElementById(SAFARI_BAR_STYLE_ID)).toBeNull();
            expect(document.body.querySelector('[data-pw="login-doc-room"]')).toBeNull();
            unmount();
        });
    }
});
