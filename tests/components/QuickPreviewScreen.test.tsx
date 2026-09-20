import React from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import QuickPreviewScreen from '../../NewLoginDesign/QuickPreviewScreen';
import { LogoAnimationProvider } from '../../NewLoginDesign/LogoAnimationContext';

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
    const belowButton = column.lastElementChild as HTMLElement;
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
