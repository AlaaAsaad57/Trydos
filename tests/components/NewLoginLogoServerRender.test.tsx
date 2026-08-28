import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import NewLoginLogo from '../../NewLoginDesign/NewLoginLogo';
import {
    LogoAnimationProvider,
    LOGO_ANIMATION_PRESETS,
    type LogoAnimationType,
} from '../../NewLoginDesign/LogoAnimationContext';

/**
 * Why this file exists.
 *
 * Framer Motion has no clock on the server. When a motion element is rendered
 * there with an `animate` target and no `initial`, it writes the *target* into
 * the html — so a ring told to turn to 360 degrees is served already turned to
 * 360 degrees. The browser then hydrates, reads the current rotation as 360,
 * compares it with the target of 360, finds nothing to do, and the ring never
 * turns. It looks exactly like a dead animation, and only on the screens that
 * are server rendered, which is why it survives a click-through of the others.
 *
 * That is not a thing to remember and work around per pattern. The rule is that
 * the mark is served static and the motion starts in the browser, and this file
 * holds that rule for every pattern and both variants.
 *
 * It also removes the second half of the same fault. The engine turns motion
 * off for `prefers-reduced-motion`, which the server cannot know, so branching
 * the markup on it made the server and the browser disagree and React reported
 * a hydration mismatch. Serving the static mark either way settles both.
 */

function ssr(animation: LogoAnimationType, variant: 'header' | 'badge-ring') {
    return renderToString(
        <LogoAnimationProvider initialAnimation={animation}>
            <NewLoginLogo variant={variant} dotColor="#402CDD" ringColor="#28C452" />
        </LogoAnimationProvider>,
    ).replace(/ data-logo-animation="[a-z-]+"/, '');
}

describe('NewLoginLogo — the server sends the static mark, and motion starts in the browser', () => {
    for (const variant of ['header', 'badge-ring'] as const) {
        const still = ssr('none', variant);

        for (const preset of LOGO_ANIMATION_PRESETS) {
            if (preset.id === 'none') continue;

            it(`${variant}: pattern "${preset.id}" is server rendered as the plain static mark`, () => {
                expect(
                    ssr(preset.id, variant),
                    `${variant}: pattern "${preset.id}" wrote animation state into the server html. Framer Motion has no clock there, so it writes the end of the animation, and the browser then has nothing left to animate towards — the pattern will look dead on every server rendered screen`,
                ).toBe(still);
            });
        }
    }
});

describe('NewLoginLogo — an animated svg attribute also has a static starting value', () => {
    /**
     * Framer Motion drives svg attributes as well as styles. An attribute that
     * only ever gets a value from the animation is written into the first render
     * as the string "undefined", and the browser rejects it —
     * `<circle> attribute r: Expected length, "undefined"` — and drops the shape.
     * Nothing on the screen says why the decoration went missing; it is console
     * only.
     *
     * `x` and `y` are not in the list because svg defaults them to 0, which is a
     * valid length. `r`, `width` and `height` have no usable default.
     */
    const NEEDS_A_START = ['r', 'width', 'height'];

    function walk(node: unknown, visit: (el: React.ReactElement) => void) {
        React.Children.forEach(node as React.ReactNode, (child) => {
            if (!React.isValidElement(child)) return;
            visit(child);
            const props = child.props as { children?: React.ReactNode };
            if (props.children) walk(props.children, visit);
        });
    }

    it('every decoration says where each animated value starts', async () => {
        const { LOGO_PATTERNS } = await import('../../NewLoginDesign/animations/patterns');
        const { LOGO_GEOMETRY } = await import('../../NewLoginDesign/animations/geometry');

        for (const [id, factory] of Object.entries(LOGO_PATTERNS)) {
            for (const variant of ['header', 'badge-ring'] as const) {
                const result = factory({
                    variant,
                    geo: LOGO_GEOMETRY[variant],
                    dotColor: '#402CDD',
                    ringColor: '#28C452',
                    uid: 'test',
                    blink: { left: 1, right: 1 },
                });

                for (const slot of ['defs', 'behind', 'ringOverlay'] as const) {
                    walk(result[slot], (el) => {
                        const props = el.props as Record<string, unknown>;
                        const animate = props.animate as Record<string, unknown> | undefined;
                        if (!animate) return;
                        const initial = (props.initial ?? {}) as Record<string, unknown>;
                        for (const key of Object.keys(animate)) {
                            expect(
                                key in initial,
                                `pattern "${id}" on the ${variant}: its "${slot}" decoration animates "${key}" without an initial value. Framer Motion writes svg values as attributes, and on the first render, before it has a value of its own, it writes the string "undefined" — the browser then rejects the attribute and drops the shape`,
                            ).toBe(true);
                        }
                    });
                }
            }
        }
    });

    it('the dots and the ring say where each animated value starts', async () => {
        const { LOGO_PATTERNS } = await import('../../NewLoginDesign/animations/patterns');
        const { LOGO_GEOMETRY } = await import('../../NewLoginDesign/animations/geometry');
        const { normaliseMotion } = await import('../../NewLoginDesign/animations/normalise');

        for (const [id, factory] of Object.entries(LOGO_PATTERNS)) {
            for (const variant of ['header', 'badge-ring'] as const) {
                const result = normaliseMotion(
                    factory({
                        variant,
                        geo: LOGO_GEOMETRY[variant],
                        dotColor: '#402CDD',
                        ringColor: '#28C452',
                        uid: 'test',
                        blink: { left: 1, right: 1 },
                    }),
                );

                for (const part of ['leftDot', 'rightDot', 'ring'] as const) {
                    const motion = result[part];
                    if (!motion?.animate) continue;
                    const initial = (motion.initial ?? {}) as Record<string, unknown>;
                    for (const [key, value] of Object.entries(motion.animate)) {
                        // A plain number says where it starts by being where it is.
                        if (!Array.isArray(value)) continue;
                        expect(
                            key in initial,
                            `pattern "${id}" on the ${variant}: its ${part} animates "${key}" with no starting value, and the engine did not fill one in. On an svg attribute such as opacity that means the first render writes "undefined" and the browser rejects it`,
                        ).toBe(true);
                    }
                }
            }
        }
    });

    it('every decoration that animates r, width or height also renders one', async () => {
        const { LOGO_PATTERNS } = await import('../../NewLoginDesign/animations/patterns');
        const { LOGO_GEOMETRY } = await import('../../NewLoginDesign/animations/geometry');

        for (const [id, factory] of Object.entries(LOGO_PATTERNS)) {
            for (const variant of ['header', 'badge-ring'] as const) {
                const result = factory({
                    variant,
                    geo: LOGO_GEOMETRY[variant],
                    dotColor: '#402CDD',
                    ringColor: '#28C452',
                    uid: 'test',
                    blink: { left: 1, right: 1 },
                });

                for (const slot of ['defs', 'behind', 'ringOverlay'] as const) {
                    walk(result[slot], (el) => {
                        const props = el.props as Record<string, unknown>;
                        const animate = props.animate as Record<string, unknown> | undefined;
                        if (!animate) return;
                        for (const attr of NEEDS_A_START) {
                            if (!(attr in animate)) continue;
                            expect(
                                props[attr],
                                `pattern "${id}" on the ${variant}: its "${slot}" decoration animates "${attr}" but never renders a starting one. The first render writes ${attr}="undefined", the browser rejects it, and the shape is dropped with only a console message to say so`,
                            ).toBeDefined();
                        }
                    });
                }
            }
        }
    });
});

describe('NewLoginLogo — the reveal wipe uncovers the whole wordmark', () => {
    /**
     * The wipe is a clip rectangle that grows across the wordmark. When it stops
     * growing it has to be bigger than the glyphs on all four sides, or the part
     * left outside it never comes back — and the part that goes missing is the
     * descender of the "y", a few pixels at the bottom that read as a slightly
     * odd letter rather than as a bug.
     *
     * The box it is checked against is measured, not estimated. An estimate is
     * what cut the descender in the first place.
     */
    it('the clip rectangle ends up larger than the glyphs on every side', async () => {
        const { LOGO_PATTERNS } = await import('../../NewLoginDesign/animations/patterns');
        const { LOGO_GEOMETRY } = await import('../../NewLoginDesign/animations/geometry');

        for (const variant of ['header', 'badge-ring'] as const) {
            const geo = LOGO_GEOMETRY[variant];
            const result = LOGO_PATTERNS.reveal({
                variant,
                geo,
                dotColor: '#402CDD',
                ringColor: '#28C452',
                uid: 'test',
                blink: { left: 1, right: 1 },
            });

            let rect: Record<string, unknown> | null = null;
            const find = (node: unknown) => {
                React.Children.forEach(node as React.ReactNode, (child) => {
                    if (!React.isValidElement(child)) return;
                    const props = child.props as Record<string, unknown>;
                    if (props.animate && (props.animate as Record<string, unknown>).width !== undefined) {
                        rect = props;
                    }
                    if (props.children) find(props.children);
                });
            };
            find(result.defs);

            expect(
                rect,
                `${variant}: the reveal pattern has no clip rectangle in its defs, so nothing is wiping the wordmark in`,
            ).not.toBeNull();

            const box = rect as unknown as {
                x: number;
                y: number;
                height: number;
                animate: { width: number };
            };
            const w = geo.wordmark;

            expect(
                box.x,
                `${variant}: the reveal clip starts at x=${box.x} but the glyphs start at x=${w.x}, so the left edge of the wordmark stays hidden`,
            ).toBeLessThan(w.x);

            expect(
                box.x + box.animate.width,
                `${variant}: the reveal clip ends at x=${box.x + box.animate.width} but the glyphs run to x=${w.x + w.width}, so the right edge of the wordmark stays hidden`,
            ).toBeGreaterThan(w.x + w.width);

            expect(
                box.y,
                `${variant}: the reveal clip starts at y=${box.y} but the glyphs start at y=${w.y}, so the tops of the letters stay hidden`,
            ).toBeLessThan(w.y);

            expect(
                box.y + box.height,
                `${variant}: the reveal clip ends at y=${box.y + box.height} but the glyphs run to y=${w.y + w.height}, so the bottom of the wordmark is cut off — the descender of the "y" is the first thing to go`,
            ).toBeGreaterThan(w.y + w.height);
        }
    });
});

describe('NewLoginLogo — a spin is written as keyframes, never as a bare target', () => {
    // Belt and braces for the same fault. `animate={{ rotate: 360 }}` depends on
    // the element starting at 0, which is only true if nothing rendered it first.
    // `animate={{ rotate: [0, 360] }}` says where it starts, so it turns whatever
    // state the element was handed.
    it('every rotation in every pattern names its own starting angle', async () => {
        const { LOGO_PATTERNS } = await import('../../NewLoginDesign/animations/patterns');
        const { LOGO_GEOMETRY } = await import('../../NewLoginDesign/animations/geometry');

        for (const [id, factory] of Object.entries(LOGO_PATTERNS)) {
            for (const variant of ['header', 'badge-ring'] as const) {
                const result = factory({
                    variant,
                    geo: LOGO_GEOMETRY[variant],
                    dotColor: '#402CDD',
                    ringColor: '#28C452',
                    uid: 'test',
                    blink: { left: 1, right: 1 },
                });

                const rotate = result.ring?.animate?.rotate;
                if (rotate === undefined) continue;

                expect(
                    Array.isArray(rotate),
                    `pattern "${id}" on the ${variant} spins its ring with a bare target of ${JSON.stringify(rotate)} instead of keyframes. If anything set the rotation first, the ring is already at the target and will not move`,
                ).toBe(true);
            }
        }
    });
});
