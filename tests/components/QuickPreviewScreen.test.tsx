import React from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import QuickPreviewScreen from '../../NewLoginDesign/QuickPreviewScreen';
import { LogoAnimationProvider } from '../../NewLoginDesign/LogoAnimationContext';
import { LOGO_GEOMETRY } from '../../NewLoginDesign/animations/geometry';
import { SAFARI_BAND } from '../../components/DemoApp1/demo1Layout';

/**
 * What this test is for.
 *
 * On a phone in Safari the browser bars take about 187 px of the 932 px
 * artboard, so AppScaler draws the canvas 745 design px tall. Every other
 * screen gives that height up from its empty space. The quick preview column
 * used to keep its full 932 px and then scale the whole column down to fit,
 * so the pill, the mark, the title, the card and the button all came out 20%
 * smaller than the design.
 *
 * The rule now: the card (the slider) gives up the missing height and nothing
 * is scaled. The card is the only block on the screen with room to spare.
 *
 * jsdom has no layout, so the canvas height is written onto the element and
 * the screen's own ResizeObserver callback is fired by hand.
 */

const DESIGN_H = 932;
const CARD_H = 473;
const CARD_W = 390;
/** Design px of empty space between one slide's card and the next. */
const SLIDE_GAP = 20;
/** The design's gap under the button, and the least it may shrink to. */
const BELOW_BUTTON = 35;
const BELOW_BUTTON_MIN = 35;

/**
 * The rule under test. The gap under the button gives up first, down to the
 * floor, and the card gives up the rest. The floor is now the design's own
 * 35, so the card gives up the whole deficit and the button keeps its place.
 */
const expected = (canvasHeight: number) => {
    const deficit = Math.max(0, DESIGN_H - canvasHeight);
    const belowButton = Math.max(BELOW_BUTTON_MIN, BELOW_BUTTON - deficit);
    return { belowButton, cardHeight: CARD_H - (deficit - (BELOW_BUTTON - belowButton)) };
};

type Observed = { callback: ResizeObserverCallback };
let observed: Observed[] = [];

class FakeResizeObserver {
    constructor(callback: ResizeObserverCallback) {
        observed.push({ callback });
    }
    observe() {}
    unobserve() {}
    disconnect() {}
}

/** Embla asks for one on mount; jsdom has none. It never fires here. */
class FakeIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
        return [];
    }
}

function renderOnCanvas(canvasHeight: number) {
    const view = render(
        <LogoAnimationProvider>
            <QuickPreviewScreen onComplete={() => {}} />
        </LogoAnimationProvider>,
    );
    const canvas = view.container.querySelector<HTMLElement>('[data-pw="quick-preview-screen"]');
    expect(canvas, 'the quick preview screen did not render its canvas').not.toBeNull();

    // The column is the second child of the canvas: the centre wordmark is
    // the first. jsdom reports 0 for every size, so the numbers a browser
    // would give are set here.
    const column = canvas!.children[1] as HTMLElement;
    Object.defineProperty(canvas, 'clientHeight', { value: canvasHeight, configurable: true });
    Object.defineProperty(column, 'offsetHeight', { value: DESIGN_H, configurable: true });

    act(() => {
        for (const { callback } of observed) callback([], {} as ResizeObserver);
    });

    // The card is the box around the Embla viewport (the `cursor-grab` area).
    // It is found this way, and not by a class or size, so the same test reads
    // the old and the new markup alike.
    const card = canvas!.querySelector<HTMLElement>('.cursor-grab')?.parentElement ?? null;
    expect(card, 'the quick preview screen did not render its slider card').not.toBeNull();
    // The spacer under the button is the last thing in the column.
    // The space under the button is the last box of the part under the badge.
    // That part is its own box now (it slides in after the country picker),
    // so the column's own last child is that box, not the space.
    const body = canvas!.querySelector<HTMLElement>('[data-pw="quick-preview-body"]');
    expect(body, 'the quick preview screen did not render its part under the badge').not.toBeNull();
    const belowButton = body!.lastElementChild as HTMLElement;
    return { canvas: canvas!, column, card: card!, belowButton };
}

describe('QuickPreviewScreen — the slider gives up the height the page does not have', () => {
    beforeEach(() => {
        observed = [];
        vi.stubGlobal('ResizeObserver', FakeResizeObserver);
        vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('shrinks the card by what is left of the deficit on a 745 px canvas (an iPhone in Safari)', () => {
        const { card } = renderOnCanvas(745);
        expect(
            card.style.height,
            'the card is not 473 less the whole deficit (the bottom gap keeps its 35)',
        ).toBe(`${expected(745).cardHeight}px`);
    });

    it('keeps the 35 px under the button on a 745 px canvas', () => {
        const { belowButton } = renderOnCanvas(745);
        expect(
            belowButton.style.height,
            'the space under the button is not the design 35 on a short page',
        ).toMatch(new RegExp(`^calc\\(${expected(745).belowButton}px`));
    });

    it('keeps the full 35 px under the button on a full-height canvas', () => {
        const { belowButton } = renderOnCanvas(DESIGN_H);
        expect(
            belowButton.style.height,
            'the space under the button changed on a canvas that has the whole artboard',
        ).toMatch(new RegExp(`^calc\\(${BELOW_BUTTON}px`));
    });

    it('takes a 10 px deficit off the card, not off the 35 under the button', () => {
        const { card, belowButton } = renderOnCanvas(DESIGN_H - 10);
        expect(belowButton.style.height, 'the bottom gap must stay at the design 35').toMatch(/^calc\(35px/);
        expect(card.style.height, 'the card must give up the 10 px').toBe(`${CARD_H - 10}px`);
    });

    // A guard, not a proof: it was green before the fix too (the old markup
    // set the height with the `h-xd-473` class). The two tests around it are
    // what went red.
    it('keeps the card at its full 473 px on a full-height canvas', () => {
        const { card } = renderOnCanvas(DESIGN_H);
        const height = card.style.height || (card.classList.contains('h-xd-473') ? `${CARD_H}px` : '');
        expect(height, 'the card lost height on a canvas that has the whole artboard').toBe(`${CARD_H}px`);
    });

    // The border belongs to the slide, not to the box around the slider. Each
    // preview is its own bordered card, so a swipe carries one card out and
    // brings the next one in with its own edge. A single border on the box
    // stayed put while only the contents moved, which is not what the design
    // draws.
    it('gives every slide its own border, and none to the box around them', () => {
        const { card } = renderOnCanvas(745);
        const viewport = card.querySelector<HTMLElement>('.cursor-grab')!;
        const slides = Array.from(viewport.firstElementChild!.children);

        expect(slides.length, 'the slider rendered no slides').toBeGreaterThan(0);
        for (const [index, slide] of slides.entries()) {
            expect(
                slide.querySelector('svg[aria-hidden="true"] rect'),
                `slide ${index + 1} has no border of its own`,
            ).not.toBeNull();
        }
        expect(
            Array.from(card.children).some((child) => child.tagName === 'svg'),
            'the box around the slider still draws a border of its own, so the border does not travel with the slide',
        ).toBe(false);
    });

    // Nothing may move at rest. The screen must look exactly as it did when a
    // single border sat on the box, so every card keeps the design's full 390
    // and the gap is made by widening the window instead of shrinking cards.
    it('keeps every slide at the design 390, so nothing moves at rest', () => {
        const { card } = renderOnCanvas(745);
        const viewport = card.querySelector<HTMLElement>('.cursor-grab')!;
        const slides = Array.from(viewport.firstElementChild!.children);

        expect(slides.length, 'the slider rendered no slides').toBeGreaterThan(0);
        for (const [index, slide] of slides.entries()) {
            const border = slide.querySelector('svg[aria-hidden="true"]')!;
            expect(
                Number(border.getAttribute('width')),
                `slide ${index + 1} is not the design 390 wide, so the card changed size at rest`,
            ).toBe(CARD_W);
        }
    });

    // The border is a 0.5 px SVG stroke drawn 0 to 0.5 px inside the slide's
    // edge. The Embla viewport clips at its own edge, and on a real phone
    // (transform scale 0.958, GPU raster) a clip sitting on that same edge ate
    // part of the stroke: the right border came out cut. jsdom cannot
    // rasterize, so the check is the geometry: the window runs SLIDE_GAP wider
    // than the card, so the clip is half a gap outside the stroke at any scale.
    // The same width is what puts the gap between two cards during a drag.
    it('runs the clipping window wider than the card, so no border is cut and the cards are spaced', () => {
        const { card } = renderOnCanvas(745);
        const viewport = card.querySelector<HTMLElement>('.cursor-grab')!;

        expect(
            viewport.style.width,
            'the window is the same width as the card, so the clip lands on the 0.5 px stroke and cuts it on a phone, and two cards touch during a drag',
        ).toBe(`${CARD_W + SLIDE_GAP}px`);
        expect(
            viewport.style.marginInline,
            'the wider window is not pulled back over the card box, so the card no longer sits where the design puts it',
        ).toBe(`${-SLIDE_GAP / 2}px`);
    });

    // The same clip, on the other axis. The window was exactly as tall as the
    // card, so the top and bottom strokes sat on the clip edge and the top
    // line came out cut on the real page. The window therefore runs SLIDE_GAP
    // taller than the card and is pulled back by half a gap, and each card
    // keeps its own height inside it, so the clip is half a gap away from the
    // stroke on every edge.
    it('runs the clipping window taller than the card, so the top and bottom borders are not cut', () => {
        const { card } = renderOnCanvas(745);
        const viewport = card.querySelector<HTMLElement>('.cursor-grab')!;
        const cardHeight = expected(745).cardHeight;

        expect(
            viewport.style.height,
            'the window is the same height as the card, so the clip lands on the 0.5 px top and bottom strokes and cuts them',
        ).toBe(`${cardHeight + SLIDE_GAP}px`);
        expect(
            viewport.style.marginBlock,
            'the taller window is not pulled back over the card box, so the card no longer sits where the design puts it',
        ).toBe(`${-SLIDE_GAP / 2}px`);

        const slides = Array.from(viewport.firstElementChild!.children);
        expect(slides.length, 'the slider rendered no slides').toBeGreaterThan(0);
        for (const [index, slide] of slides.entries()) {
            const box = slide.firstElementChild as HTMLElement;
            expect(
                box.style.height,
                `slide ${index + 1} stretches to the taller window instead of keeping the card height`,
            ).toBe(`${cardHeight}px`);
        }
    });

    it('draws every slide border at the same height as the card', () => {
        const { card } = renderOnCanvas(745);
        const viewport = card.querySelector<HTMLElement>('.cursor-grab')!;
        const slides = Array.from(viewport.firstElementChild!.children);

        expect(slides.length, 'the slider rendered no slides').toBeGreaterThan(0);
        for (const [index, slide] of slides.entries()) {
            const border = slide.querySelector('svg[aria-hidden="true"]');
            expect(border, `slide ${index + 1} has no border svg`).not.toBeNull();
            expect(
                border!.getAttribute('height'),
                `slide ${index + 1} draws its border at a different height than the card box`,
            ).toBe(String(expected(745).cardHeight));
        }
    });
});

/*
 * The round logo that peeks at the bottom during the start animation.
 *
 * The design (`Ramaaz pay signin - 14`) shows the pill and, under it, only the
 * ring's top and the two eyes: the pill's top is 103 px above the bottom, the
 * eyes end at 925, and the artboard at 932. The letters stay below the edge.
 *
 * In Chrome on Android (and other browsers) the window ends right at the
 * browser's bar, so 103 design px above `canvasH` puts 61 design px of the
 * round logo right above the bar with no gap.
 *
 * In iPhone Safari 26 the window ends SAFARI_BAND (15.5 CSS px) ABOVE Safari's
 * floating bar (`logo-bar-space.jpeg`), and NewLoginWidget lets the round logo
 * draw across that band to the bar. So the waiting column lowers by
 * `SAFARI_BAND / scale` design px there: the pill's top still sits 103 design
 * px above Safari's bar itself, keeping the exact same 61 design px of ring
 * and eyes above Safari's bar, touching the bar with no white gap, and keeping
 * the "try" glyphs below Safari's bar top.
 */
const SAFARI_26 =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';
const CHROME_ANDROID =
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';
/** The design's distance from the pill's top to the bottom bar edge. */
const PEEK_TAIL = 103;
/** Pill height (30) + pill-to-logo gap (12) = 42, leaving 61 design px of logo peek. */
const PILL_AND_GAP = 42;
/** The space over the pill, set on the pill box in place of a real layout. */
const PILL_TOP = 0;

describe('QuickPreviewScreen — the round logo peeks at the bottom as the design draws it', () => {
    beforeEach(() => {
        observed = [];
        vi.stubGlobal('ResizeObserver', FakeResizeObserver);
        vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    /** The column's y while it waits, read from its transform. */
    const peekY = (column: HTMLElement) => {
        const match = column.style.transform.match(/translateY\((-?[\d.]+)px\)/);
        return match ? Number(match[1]) : null;
    };

    it('puts the pill 103 px above the window bottom in Chrome on Android, where the window ends at the bar', async () => {
        vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(CHROME_ANDROID);
        const { column } = renderOnCanvas(745);
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 1200));
        });
        expect(
            peekY(column),
            'in Chrome on Android the pill is not 103 px above the bottom edge',
        ).toBe(745 - PEEK_TAIL - PILL_TOP);
    });

    it("lowers the waiting column by SAFARI_BAND / scale in iPhone Safari 26, so the exact same 61 design px of logo sits sticky above Safari's floating bar", async () => {
        vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(SAFARI_26);
        const scale = 440 / 430;
        const canvasH = 838;
        const { canvas, column } = renderOnCanvas(canvasH);
        canvas.getBoundingClientRect = () =>
            ({
                top: 0,
                bottom: canvasH * scale,
                left: 0,
                right: 440,
                width: 440,
                height: canvasH * scale,
                x: 0,
                y: 0,
                toJSON: () => ({}),
            }) as DOMRect;
        act(() => {
            for (const { callback } of observed) callback([], {} as ResizeObserver);
        });
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 1200));
        });

        const y = peekY(column);
        expect(y).not.toBeNull();
        expect(
            y!,
            "in iPhone Safari 26 the pill is not 103 design px above Safari's floating bar",
        ).toBeCloseTo(canvasH + SAFARI_BAND / scale - PEEK_TAIL - PILL_TOP, 3);

        // Above Safari's bar (`canvasH + SAFARI_BAND / scale`), the visible slice
        // of the 150x150 badge must still be 61 design px: eyes in view, "try" below.
        const logoTopDesign = y! + PILL_TOP + PILL_AND_GAP;
        const barTopDesign = canvasH + SAFARI_BAND / scale;
        const shownAboveBar = barTopDesign - logoTopDesign;
        const badgeGeo = LOGO_GEOMETRY['badge-ring'];
        const eyesBottom = badgeGeo.leftDot.y + badgeGeo.dotR;
        const wordTop = badgeGeo.wordmark.y;

        expect(shownAboveBar, 'the amount of logo above Safari bar changed from 61 design px').toBeCloseTo(61, 3);
        expect(eyesBottom, 'the two eyes no longer fit above Safari bar').toBeLessThan(shownAboveBar);
        expect(wordTop, 'the "try" letters crept above Safari bar').toBeGreaterThan(shownAboveBar);
    });

    it('keeps the expanded column at y = 0 and the 35 px below the button unchanged in iPhone Safari 26', async () => {
        vi.useFakeTimers();
        vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(SAFARI_26);
        const { card, belowButton } = renderOnCanvas(745);
        expect(card.style.height).toBe(`${expected(745).cardHeight}px`);
        expect(belowButton.style.height).toMatch(new RegExp(`^calc\\(${expected(745).belowButton}px`));
    });

    it('lays nothing over the bottom in iPhone Safari 26', () => {
        vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(SAFARI_26);
        const { canvas } = renderOnCanvas(745);
        expect(
            canvas.querySelector('[data-pw="quick-preview-bottom-fade"]'),
            'iPhone Safari 26 still gets the white fade over the bottom',
        ).toBeNull();
    });
});
