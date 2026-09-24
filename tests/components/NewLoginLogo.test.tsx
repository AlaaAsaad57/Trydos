import { readFileSync } from 'node:fs';
import path from 'node:path';
import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import NewLoginLogo from '../../NewLoginDesign/NewLoginLogo';
import {
    LogoAnimationProvider,
    LOGO_ANIMATION_PRESETS,
    type LogoAnimationType,
} from '../../NewLoginDesign/LogoAnimationContext';
import {
    BADGE_DOT_PATH,
    BADGE_LETTERS,
    BADGE_RING_PATH,
    BADGE_WORDMARK_PATH,
    HEADER_DOT_PATH,
    HEADER_LETTERS,
    HEADER_WORDMARK_PATH,
    type WordmarkLetter,
} from '../../NewLoginDesign/logoPaths';

/**
 * What these tests are for.
 *
 * The eight logo patterns share one promise: they move things around the mark
 * without ever changing the mark. That promise is easy to break by accident and
 * almost impossible to spot by eye — a 1.5px stroke added to the wordmark to
 * make a "draw on" effect work looks fine in a screenshot and quietly fattens
 * every letter. So the checks below compare what is rendered against the path
 * data generated from the design files, for every pattern and both variants,
 * and they say which property of which part of the mark changed.
 *
 * They also check the mark lands where the design file puts it. The component
 * adds the design file's nested translates into one, which is exact for pure
 * translates but is arithmetic a person did, so the last block re-does that sum
 * straight from `logo.svg` and `QuickPreviewBottomLogo.svg` and compares.
 */

const DOT_COLOR = '#402CDD';
const RING_COLOR = '#28C452';
const WORDMARK_FILL = '#1d1d1d';

interface VariantFixture {
    variant: 'header' | 'badge-ring';
    label: string;
    viewBox: string;
    wordmarkPath: string;
    letters: WordmarkLetter[];
    wordmarkTransform: string;
    dotPath: string;
    leftDotTransform: string;
    rightDotTransform: string;
    sourceFile: string;
}

const VARIANTS: VariantFixture[] = [
    {
        variant: 'header',
        label: 'header lockup',
        viewBox: '0 0 176.18 87.574',
        wordmarkPath: HEADER_WORDMARK_PATH,
        letters: HEADER_LETTERS,
        wordmarkTransform: 'translate(-1.35 99.117)',
        dotPath: HEADER_DOT_PATH,
        leftDotTransform: 'translate(12.609 0)',
        rightDotTransform: 'translate(42.799 0)',
        sourceFile: 'NewLoginDesign/logo.svg',
    },
    {
        variant: 'badge-ring',
        label: 'badge ring',
        viewBox: '0 0 150 150',
        wordmarkPath: BADGE_WORDMARK_PATH,
        letters: BADGE_LETTERS,
        wordmarkTransform: 'translate(34.048 131.633)',
        dotPath: BADGE_DOT_PATH,
        leftDotTransform: 'translate(48.606 31.631)',
        rightDotTransform: 'translate(78.798 31.631)',
        sourceFile: 'NewLoginDesign/QuickPreviewBottomLogo.svg',
    },
];

const PATTERNS: LogoAnimationType[] = LOGO_ANIMATION_PRESETS.map((preset) => preset.id);

function draw(animation: LogoAnimationType, variant: 'header' | 'badge-ring') {
    const { container } = render(
        <LogoAnimationProvider initialAnimation={animation}>
            <NewLoginLogo variant={variant} dotColor={DOT_COLOR} ringColor={RING_COLOR} />
        </LogoAnimationProvider>,
    );
    const svg = container.querySelector('svg');
    if (!svg) throw new Error(`the ${variant} logo rendered no svg at all for pattern "${animation}"`);
    return svg;
}

const partPath = (svg: SVGElement, part: string) =>
    svg.querySelector(`[data-logo-part="${part}"] path`);

describe('NewLoginLogo — the ten patterns never change the mark', () => {
    for (const preset of LOGO_ANIMATION_PRESETS) {
        for (const v of VARIANTS) {
            const where = `pattern "${preset.id}" on the ${v.label}`;

            it(`${where}: leaves the wordmark exactly as the design file drew it`, () => {
                const svg = draw(preset.id, v.variant);
                const drawn = Array.from(
                    svg.querySelectorAll('[data-logo-part="wordmark"] path'),
                );

                expect(
                    drawn.length,
                    `${where}: the wordmark is missing from the rendered logo`,
                ).toBeGreaterThan(0);

                // The word is drawn one of two ways, and both have to be
                // checked, because either one being wrong damages the mark.
                //
                // A pattern that leaves `letters` unset gets the single path
                // from the design file. A pattern that sets it gets one path
                // per letter, generated from that same string by
                // scripts/split-wordmark.mjs so the letters can be staggered.
                // Which form a pattern uses is its own choice; what neither is
                // allowed to do is change an outline.
                const perLetter = drawn.length > 1;
                if (perLetter) {
                    expect(
                        drawn.map((path) => path.getAttribute('d')),
                        `${where}: the word is drawn as ${drawn.length} letters but they are not the generated letter outlines. A pattern may move a whole letter, never reshape one`,
                    ).toEqual(v.letters.map((letter) => letter.d));
                } else {
                    expect(
                        drawn[0].getAttribute('d'),
                        `${where}: the wordmark path data was rewritten. A pattern may hide part of the wordmark with a clip, never reshape it`,
                    ).toBe(v.wordmarkPath);
                }

                for (const [index, path] of drawn.entries()) {
                    const which = perLetter
                        ? `letter "${v.letters[index]?.id ?? index}" of the wordmark`
                        : 'the wordmark';

                    expect(
                        path.getAttribute('stroke'),
                        `${where}: a stroke was added to ${which}. A stroke on these fill-only glyphs thickens every letter and closes the counters, the holes inside the "d" and the "o"`,
                    ).toBeNull();

                    expect(
                        path.getAttribute('stroke-dasharray'),
                        `${where}: a stroke-dasharray was added to ${which}, which means something is trying to draw the letters on by stroking them. Use the clip path instead`,
                    ).toBeNull();

                    expect(
                        path.getAttribute('filter'),
                        `${where}: a filter was put on ${which}. Filters blur and recolour glyph edges, and under the scaled canvas they also force a new raster layer`,
                    ).toBeNull();

                    expect(
                        path.getAttribute('style'),
                        `${where}: ${which} was given an inline style. Motion belongs on the group around a letter, never on the glyph path itself`,
                    ).toBeNull();

                    expect(
                        path.getAttribute('transform'),
                        `${where}: ${which} moved. Its transform must stay the sum of the design file's translates`,
                    ).toBe(v.wordmarkTransform);

                    expect(
                        path.getAttribute('fill'),
                        `${where}: the colour of ${which} changed`,
                    ).toBe(WORDMARK_FILL);
                }
            });

            it(`${where}: leaves the dots and the ring exactly as the design file drew them`, () => {
                const svg = draw(preset.id, v.variant);

                for (const side of ['dot-left', 'dot-right'] as const) {
                    const dot = partPath(svg, side);
                    expect(dot, `${where}: the ${side} path is missing from the rendered logo`).not.toBeNull();
                    expect(
                        dot?.getAttribute('d'),
                        `${where}: the ${side} shape was rewritten. A dot may be moved and scaled, never redrawn`,
                    ).toBe(v.dotPath);
                    expect(
                        dot?.getAttribute('fill'),
                        `${where}: the ${side} colour changed away from the colour the screen asked for`,
                    ).toBe(DOT_COLOR);
                }

                expect(
                    svg.querySelector('[data-logo-part="dot-left"]')?.getAttribute('transform'),
                    `${where}: the left dot's resting position moved`,
                ).toBe(v.leftDotTransform);

                expect(
                    svg.querySelector('[data-logo-part="dot-right"]')?.getAttribute('transform'),
                    `${where}: the right dot's resting position moved`,
                ).toBe(v.rightDotTransform);

                if (v.variant !== 'badge-ring') return;

                const ring = partPath(svg, 'ring');
                expect(ring, `${where}: the dotted ring is missing from the rendered badge`).not.toBeNull();
                expect(
                    ring?.getAttribute('d'),
                    `${where}: the ring path was rewritten. Redrawing it as a plain arc is the usual cause, and it turns the dotted ring solid`,
                ).toBe(BADGE_RING_PATH);
                expect(
                    ring?.getAttribute('fill'),
                    `${where}: the ring colour changed away from the colour the screen asked for`,
                ).toBe(RING_COLOR);
            });

            it(`${where}: keeps its decoration under the mark, or masked to the ring`, () => {
                const svg = draw(preset.id, v.variant);
                const wordmark = svg.querySelector('[data-logo-part="wordmark"]');
                expect(wordmark, `${where}: the wordmark group is missing, so paint order cannot be checked`).not.toBeNull();

                for (const deco of Array.from(svg.querySelectorAll('[data-logo-decoration]'))) {
                    const name = deco.getAttribute('data-logo-decoration');
                    const paintedFirst = Boolean(
                        wordmark!.compareDocumentPosition(deco) & Node.DOCUMENT_POSITION_PRECEDING,
                    );
                    const maskedToTheRing = deco.hasAttribute('mask');
                    expect(
                        paintedFirst || maskedToTheRing,
                        `${where}: decoration "${name}" is painted after the wordmark and carries no mask, so it can cover the letters. Decoration goes behind the mark, and anything painted over the ring must be masked to the ring path`,
                    ).toBe(true);
                }
            });
        }
    }

    for (const preset of LOGO_ANIMATION_PRESETS) {
        for (const v of VARIANTS) {
            // Framer Motion animates svg attributes as well as styles, and an
            // attribute that is only ever given a value by the animation is
            // written out as the string "undefined" on the first render. The
            // browser then rejects it — `<circle> attribute r: Expected length,
            // "undefined"` — and the shape is dropped. It is only visible in the
            // console, so nothing on the screen says why a decoration vanished.
            it(`pattern "${preset.id}" on the ${v.label}: gives every svg attribute a real starting value`, () => {
                const svg = draw(preset.id, v.variant);
                for (const el of Array.from(svg.querySelectorAll('*'))) {
                    for (const attr of Array.from(el.attributes)) {
                        expect(
                            attr.value,
                            `pattern "${preset.id}" on the ${v.label}: <${el.tagName}> was rendered with ${attr.name}="undefined". An attribute the animation drives also needs a static starting value, or the browser rejects it and drops the shape`,
                        ).not.toBe('undefined');
                    }
                }
            });
        }
    }

    for (const v of VARIANTS) {
        it(`${v.label}: keeps the same viewBox whichever pattern is running`, () => {
            for (const id of PATTERNS) {
                expect(
                    draw(id, v.variant).getAttribute('viewBox'),
                    `pattern "${id}" changed the ${v.label} viewBox, which rescales the whole mark inside the box the screen gave it`,
                ).toBe(v.viewBox);
            }
        });
    }
});

describe('NewLoginLogo — two logos on one screen do not collide', () => {
    // The Quick Preview screen shows the header lockup and the badge at the same
    // time. svg ids are global to the document, so a mask id reused by both logos
    // would make one of them capture the other's mask.
    it('gives every pattern its own svg ids, so a second logo cannot capture the first one\'s mask', () => {
        for (const id of PATTERNS) {
            const { container } = render(
                <LogoAnimationProvider initialAnimation={id}>
                    <NewLoginLogo variant="badge-ring" dotColor={DOT_COLOR} ringColor={RING_COLOR} />
                    <NewLoginLogo variant="badge-ring" dotColor={DOT_COLOR} ringColor={RING_COLOR} />
                </LogoAnimationProvider>,
            );

            const ids = Array.from(container.querySelectorAll('[id]')).map((el) => el.id);
            const repeated = ids.filter((value, index) => ids.indexOf(value) !== index);

            expect(
                repeated,
                `pattern "${id}" gave two logos on the same screen the same svg id: ${repeated.join(', ')}. The second logo's mask or filter will be applied to the first one`,
            ).toEqual([]);
        }
    });
});

describe('NewLoginLogo — the mark lands where the design file puts it', () => {
    /** Adds up every translate() from an element up to its <svg>. */
    function cumulativeTranslate(el: Element): { x: number; y: number } {
        let x = 0;
        let y = 0;
        let node: Element | null = el;
        while (node && node.tagName.toLowerCase() !== 'svg') {
            const transform = node.getAttribute('transform');
            // The y value is optional: the design files write `translate(13.207)`
            // for a horizontal-only shift, and dropping that one on the floor is
            // exactly the kind of silent 13px error this block exists to catch.
            const match =
                transform && /translate\(\s*(-?[\d.]+)(?:[\s,]+(-?[\d.]+))?\s*\)/.exec(transform);
            if (match) {
                x += parseFloat(match[1]);
                y += parseFloat(match[2] ?? '0');
            }
            node = node.parentElement;
        }
        return { x, y };
    }

    function sourceSvg(file: string): Document {
        const xml = readFileSync(path.join(process.cwd(), file), 'utf8');
        return new DOMParser().parseFromString(xml, 'image/svg+xml');
    }

    for (const v of VARIANTS) {
        it(`${v.label}: the flattened transforms add up to the same place as ${v.sourceFile}`, () => {
            const source = sourceSvg(v.sourceFile);
            const rendered = draw('none', v.variant);

            const sourcePaths = Array.from(source.querySelectorAll('path'));

            const sourceWordmark = sourcePaths.find((p) => p.getAttribute('d') === v.wordmarkPath);
            expect(
                sourceWordmark,
                `${v.label}: no path in ${v.sourceFile} matches the wordmark data the component renders, so the generated logoPaths.ts is out of step with the design file`,
            ).toBeDefined();

            const wantWordmark = cumulativeTranslate(sourceWordmark!);
            const gotWordmark = cumulativeTranslate(partPath(rendered, 'wordmark')!);
            expect(
                [Number(gotWordmark.x.toFixed(3)), Number(gotWordmark.y.toFixed(3))],
                `${v.label}: the wordmark is rendered at (${gotWordmark.x}, ${gotWordmark.y}) but ${v.sourceFile} puts it at (${wantWordmark.x}, ${wantWordmark.y})`,
            ).toEqual([Number(wantWordmark.x.toFixed(3)), Number(wantWordmark.y.toFixed(3))]);

            const sourceDots = sourcePaths
                .filter((p) => p.getAttribute('d') === v.dotPath)
                .map(cumulativeTranslate)
                .sort((a, b) => a.x - b.x);

            const renderedDots = (['dot-left', 'dot-right'] as const)
                .map((part) => cumulativeTranslate(partPath(rendered, part)!))
                .sort((a, b) => a.x - b.x);

            for (const [index, side] of ['left', 'right'].entries()) {
                expect(
                    [
                        Number(renderedDots[index].x.toFixed(3)),
                        Number(renderedDots[index].y.toFixed(3)),
                    ],
                    `${v.label}: the ${side} dot is rendered at (${renderedDots[index].x}, ${renderedDots[index].y}) but ${v.sourceFile} puts it at (${sourceDots[index].x}, ${sourceDots[index].y})`,
                ).toEqual([
                    Number(sourceDots[index].x.toFixed(3)),
                    Number(sourceDots[index].y.toFixed(3)),
                ]);
            }

            if (v.variant !== 'badge-ring') return;

            const sourceRing = sourcePaths.find((p) => p.getAttribute('d') === BADGE_RING_PATH);
            expect(
                sourceRing,
                `${v.label}: no path in ${v.sourceFile} matches the ring data the component renders`,
            ).toBeDefined();

            const wantRing = cumulativeTranslate(sourceRing!);
            const gotRing = cumulativeTranslate(partPath(rendered, 'ring')!);
            expect(
                [Number(gotRing.x.toFixed(3)), Number(gotRing.y.toFixed(3))],
                `${v.label}: the dotted ring is rendered at (${gotRing.x}, ${gotRing.y}) but ${v.sourceFile} puts it at (${wantRing.x}, ${wantRing.y})`,
            ).toEqual([Number(wantRing.x.toFixed(3)), Number(wantRing.y.toFixed(3))]);
        });
    }
});

/**
 * The loop length is a setting, and it has to reach every pattern.
 *
 * The demo route lets the client play the same pattern over 1 to 20 seconds
 * before choosing one. That only works if each pattern actually reads the
 * number it is handed. A pattern that keeps its own hard-coded cycle looks
 * fine on its own and is only wrong next to the others, which is exactly the
 * comparison the picker exists to make.
 *
 * The second check is the other half: with no number given, a pattern must
 * still run on the cycle it was designed on. The product never sets one.
 */
describe('the loop length reaches every pattern', () => {
    /** Every `duration` a pattern puts on one element, nested ones included. */
    function durationsOf(motion: { transition?: unknown } | undefined): number[] {
        const transition = motion?.transition as Record<string, unknown> | undefined;
        if (!transition) return [];
        const found: number[] = [];
        if (typeof transition.duration === 'number') found.push(transition.duration);
        for (const value of Object.values(transition)) {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                const nested = (value as Record<string, unknown>).duration;
                if (typeof nested === 'number') found.push(nested);
            }
        }
        return found;
    }

    /** The cycle each pattern was designed on, and falls back to. */
    const DESIGNED_CYCLE: Record<string, number> = {
        wink: 4,
        relay: 4,
        firefly: 4,
        canon: 4,
        tempo: 4,
        spark: 4,
        reveal: 4.5,
        gust: 4,
        escape: 4,
        sway: 4,
    };

    for (const seconds of [1, 9, 20]) {
        it(`plays every pattern over ${seconds} seconds when asked to`, async () => {
            const { LOGO_PATTERNS } = await import('../../NewLoginDesign/animations/patterns');
            const { LOGO_GEOMETRY } = await import('../../NewLoginDesign/animations/geometry');

            for (const [id, factory] of Object.entries(LOGO_PATTERNS)) {
                for (const variant of ['header', 'badge-ring'] as const) {
                    const result = factory({
                        variant,
                        geo: LOGO_GEOMETRY[variant],
                        dotColor: DOT_COLOR,
                        ringColor: RING_COLOR,
                        uid: 'test',
                        blink: { left: 1, right: 1 },
                        cycle: seconds,
                    });

                    const durations = durationsOf(result.leftDot);
                    expect(
                        durations.includes(seconds),
                        `pattern "${id}" on the ${variant} was told to loop in ${seconds}s, but its left dot runs on ${durations.join(', ') || 'no duration at all'}. The picker's loop-length control does nothing for this pattern`,
                    ).toBe(true);
                }
            }
        });
    }

    it('falls back to the cycle each pattern was designed on', async () => {
        const { LOGO_PATTERNS } = await import('../../NewLoginDesign/animations/patterns');
        const { LOGO_GEOMETRY } = await import('../../NewLoginDesign/animations/geometry');

        for (const [id, factory] of Object.entries(LOGO_PATTERNS)) {
            const designed = DESIGNED_CYCLE[id];
            expect(
                designed,
                `pattern "${id}" has no designed cycle recorded in this test, so nothing checks what it does when no loop length is given`,
            ).toBeDefined();

            const result = factory({
                variant: 'badge-ring',
                geo: LOGO_GEOMETRY['badge-ring'],
                dotColor: DOT_COLOR,
                ringColor: RING_COLOR,
                uid: 'test',
                blink: { left: 1, right: 1 },
            });

            const durations = durationsOf(result.leftDot);
            expect(
                durations.includes(designed),
                `pattern "${id}" was given no loop length, so it should run on the ${designed}s cycle it was designed on, but its left dot runs on ${durations.join(', ') || 'no duration at all'}`,
            ).toBe(true);
        }
    });
});
