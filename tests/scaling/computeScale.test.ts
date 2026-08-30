import { describe, expect, it } from 'vitest';

import { computeScale } from 'scaling/computeScale';
import { DESIGN_H, DESIGN_W, FLEX_RANGE } from 'scaling/scale.config';

/**
 * The scale engine decides, for one viewport, how big the 430x932 design canvas
 * is drawn and how much vertical space the gaps inside a screen have to give
 * up. Every screen in the auth flow is laid out in design px inside that
 * canvas, so a wrong answer here moves every element on every screen at once.
 *
 * It is pure arithmetic, which is why it is tested here rather than in a
 * browser: these are the exact viewports the bugs were found on.
 */
describe('computeScale', () => {
    it('draws the design canvas 1:1 at the artboard size, with nothing squeezed', () => {
        const r = computeScale(DESIGN_W, DESIGN_H);
        expect(r.scale, `at the 430x932 artboard size the canvas must not be scaled, got ${r.scale}`).toBeCloseTo(1, 5);
        expect(r.flexDeficit, `at the artboard size no gap may be asked to give up space, got ${r.flexDeficit}px`).toBe(0);
        expect(r.offsetY, `at the artboard size the canvas must sit flush at the top, got ${r.offsetY}px`).toBeCloseTo(0, 5);
        expect(r.offsetX, `at the artboard size the canvas must sit flush at the left, got ${r.offsetX}px`).toBeCloseTo(0, 5);
    });

    it('does not jump as the browser bar slides in and out', () => {
        // A 375px phone crosses the old 1.7 ratio rule at about 638px tall,
        // which is inside the range the Safari bottom bar sweeps through as it
        // hides and shows. One pixel either side of it, the old code switched
        // between two different layouts and the canvas snapped from 375px wide
        // to 255px.
        const above = computeScale(375, 638);
        const below = computeScale(375, 637);
        const jump = Math.abs(above.scale - below.scale);
        expect(jump, `one pixel of height changed the scale by ${jump.toFixed(3)}, so the layout snaps as the browser bar moves`).toBeLessThan(0.01);
    });

    it('keeps a short phone using most of its width', () => {
        // 375x553 is an iPhone SE with the Safari bottom bar showing. The old
        // code read its 1.47 ratio as "landscape" and shrank the canvas to
        // 255px, leaving 60px of bare background down each side.
        const r = computeScale(375, 553);
        expect(r.canvasWidth / 375, `the canvas uses only ${((r.canvasWidth / 375) * 100).toFixed(0)}% of a 375px phone's width`).toBeGreaterThan(0.72);
    });

    it('never asks the gaps to give up more than the share the layout can spare', () => {
        // A screen's spacers add up to less than FLEX_RANGE. When the engine
        // asked for the whole range, every gap on the Quick Preview screen hit
        // zero at once: the pagination dots landed on the card border and the
        // Next button landed on the dots.
        const r = computeScale(375, 667);
        expect(r.flexDeficit, `the gaps were asked for ${r.flexDeficit}px, which is more than the ${FLEX_RANGE}px range can spare`).toBeLessThan(FLEX_RANGE * 0.75);
    });

    it('always leaves the canvas fitting inside the viewport height', () => {
        for (const [w, h] of [[430, 932], [393, 852], [375, 667], [375, 553], [360, 800]] as const) {
            const r = computeScale(w, h);
            const drawn = r.canvasHeight * r.scale;
            expect(drawn, `at ${w}x${h} the canvas is drawn ${drawn.toFixed(1)}px tall, taller than the ${h}px viewport, so its bottom is cut off`).toBeLessThanOrEqual(h + 0.5);
        }
    });

    it('centres the canvas on a tall tablet instead of leaving a strip at the bottom', () => {
        // 1024x1366 is an iPad Pro 12.9". The old code capped the height at
        // 1200 and pinned the canvas to the top, leaving 166px of bare
        // background below it.
        const r = computeScale(1024, 1366);
        const drawn = r.canvasHeight * r.scale;
        expect(r.offsetY, `the canvas is pinned to the top of a 1366px screen, leaving ${(1366 - drawn).toFixed(0)}px bare at the bottom`).toBeCloseTo((1366 - drawn) / 2, 0);
    });

    it('does not blow the phone design up without limit on a large tablet', () => {
        const r = computeScale(1024, 1366);
        expect(r.scale, `the 430px design is drawn at ${r.scale.toFixed(2)}x on an iPad Pro, which is larger than the design is meant to go`).toBeLessThanOrEqual(1.2);
    });

    it('keeps the tablet canvas at design proportions', () => {
        for (const [w, h] of [[834, 1194], [1024, 1366], [744, 1133]] as const) {
            const r = computeScale(w, h);
            expect(r.flexDeficit, `at ${w}x${h} a tablet squeezed the gaps by ${r.flexDeficit}px; a tablet has room, so it must scale evenly instead`).toBe(0);
            expect(r.canvasWidth / (r.canvasHeight * r.scale), `at ${w}x${h} the canvas is not the 430:932 shape of the design`).toBeCloseTo(DESIGN_W / DESIGN_H, 3);
        }
    });
});
