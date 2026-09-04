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
/** The design's gap under the button, and the least it may shrink to. */
const BELOW_BUTTON = 35;
const BELOW_BUTTON_MIN = 25;

/**
 * The rule under test. The 35 px below the button is the artboard's home
 * indicator zone; a browser bar already covers that zone, so on a short page
 * this gap gives up first, down to the floor, and the card gives up the rest.
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
            'the card is not 473 less the deficit that remains after the bottom gap gave up its 10 px',
        ).toBe(`${expected(745).cardHeight}px`);
    });

    it('closes the gap under the button to the 25 px floor on a 745 px canvas', () => {
        const { belowButton } = renderOnCanvas(745);
        expect(
            belowButton.style.height,
            'the space under the button did not shrink on a short page, so the button sits 35 px above the browser bar',
        ).toMatch(new RegExp(`^calc\\(${expected(745).belowButton}px`));
    });

    it('keeps the full 35 px under the button on a full-height canvas', () => {
        const { belowButton } = renderOnCanvas(DESIGN_H);
        expect(
            belowButton.style.height,
            'the space under the button changed on a canvas that has the whole artboard',
        ).toMatch(new RegExp(`^calc\\(${BELOW_BUTTON}px`));
    });

    it('gives up only part of the bottom gap on a canvas that is 10 px short', () => {
        const { card, belowButton } = renderOnCanvas(DESIGN_H - 10);
        expect(belowButton.style.height, 'a 10 px deficit should come off the bottom gap alone').toMatch(
            /^calc\(25px/,
        );
        expect(card.style.height, 'the card should not shrink while the bottom gap can still give').toBe(
            `${CARD_H}px`,
        );
    });

    // A guard, not a proof: it was green before the fix too (the old markup
    // set the height with the `h-xd-473` class). The two tests around it are
    // what went red.
    it('keeps the card at its full 473 px on a full-height canvas', () => {
        const { card } = renderOnCanvas(DESIGN_H);
        const height = card.style.height || (card.classList.contains('h-xd-473') ? `${CARD_H}px` : '');
        expect(height, 'the card lost height on a canvas that has the whole artboard').toBe(`${CARD_H}px`);
    });

    // The border is a 0.5 px SVG stroke drawn 0 to 0.5 px inside the card's
    // edge. A clip on the card box sits exactly on that edge, and on a real
    // phone (transform scale 0.958, GPU raster) it eats part of the stroke: the
    // right border came out cut. The Next button draws the same SVG with no
    // clip and is never cut. jsdom cannot rasterize, so the check is the
    // class itself: the box that holds the border must not clip. The Embla
    // viewport inside the padding keeps its own clip for the slides.
    it('does not clip its own border with an overflow rule on the card box', () => {
        const { card } = renderOnCanvas(745);
        expect(
            card.querySelector('svg')?.parentElement,
            'the card border svg is not a direct child of the card box',
        ).toBe(card);
        expect(
            card.classList.contains('overflow-hidden'),
            'the card box clips its content, so its own 0.5 px border is cut at the edge on a phone',
        ).toBe(false);
    });

    it('draws the card border at the same height as the card', () => {
        const { card } = renderOnCanvas(745);
        const border = card.querySelector('svg');
        expect(border, 'the card has no border svg').not.toBeNull();
        expect(
            border!.getAttribute('height'),
            'the card border is drawn at a different height than the card box',
        ).toBe(String(expected(745).cardHeight));
    });
});
