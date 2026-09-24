'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useLogoAnimation, LogoAnimationType } from './LogoAnimationContext';
import { useAnimationEngine } from './animations/useAnimationEngine';
import { LOGO_GEOMETRY } from './animations/geometry';
import type { ElementMotion } from './animations/types';
import {
    BADGE_DOT_PATH,
    BADGE_FRAME_PATH,
    BADGE_RING_PATH,
    HEADER_DOT_PATH,
} from './logoPaths';

export type LogoDotColor = 'purple' | 'green' | 'orange' | 'blue' | string;

export interface NewLoginLogoProps {
    variant?: 'header' | 'badge-ring';
    dotColor?: LogoDotColor;
    ringColor?: string;
    className?: string;
    width?: number;
    height?: number;
    /** Overrides the pattern coming from LogoAnimationProvider, for one logo. */
    animationVariant?: LogoAnimationType;
    /** Overrides the loop length coming from the provider, for one logo. */
    durationSeconds?: number;
    /**
     * Let the pattern touch the word. Default true.
     *
     * `false` takes the wordmark clip and the per-letter groups away, so the
     * ring and the dots still move and the word stands still. It is the
     * "cinematic build, glyphs held" the Quick Preview asks for.
     */
    animateWord?: boolean;
}

const COLOR_MAP: Record<string, string> = {
    purple: '#402CDD',
    green: '#28C452',
    orange: '#FAAA2E',
    blue: '#388CFF',
};

const WORDMARK_FILL = '#1d1d1d';

/**
 * `transform-origin: center` on its own is not enough inside an svg: by default
 * the browser measures the origin from the svg viewport, not from the element,
 * so a group sitting inside a translated parent scales about a point that is
 * nowhere near it. `transform-box: fill-box` moves the reference box onto the
 * element's own bounding box, which for a group holding one circle is the
 * circle. Scale and rotate then pivot on the true centre of the dot, and no
 * coordinate is written down anywhere to go stale.
 */
const PIVOT_ON_SELF: React.CSSProperties = {
    transformBox: 'fill-box',
    transformOrigin: 'center',
};

/**
 * NewLoginLogo — the trydos mark, with an optional motion pattern.
 *
 * The path data is imported from `logoPaths.ts`, which is generated from the
 * design files. This component never edits it, and neither does any pattern.
 *
 * What may move, and what may not
 * -------------------------------
 * The dots and the ring move freely. The word moves only as whole letters: a
 * pattern that sets `letters` gets one group per letter and may translate,
 * rotate, evenly scale and fade each one. It still cannot give a glyph a
 * stroke, a filter or a colour, because there is no prop for any of those, and
 * it cannot reshape one, because it only ever receives the outline the design
 * file drew.
 *
 * That last part is the point. The obvious way to animate a wordmark is to
 * stroke it and run stroke-dashoffset, which draws the letters on. On this mark
 * it is wrong: the glyphs are fill-only, so the stroke has to be added, and a
 * 1.5px stroke on a 176px-wide logo fattens every letter and starts closing the
 * counters, the holes inside the d and the o. It is quiet damage. A clip path
 * reaches the same effect and cannot deform anything.
 *
 * Moving a whole letter is a different thing from reshaping one, and it is the
 * reason the split was worth doing: the letterforms are untouched, only their
 * places change. An uneven scale would cross back over that line — `scaleX` on
 * its own is a condensed typeface — so patterns keep letter scaling even.
 *
 * Decoration is painted before the mark, so the mark is always on top of it.
 * The one exception is the ring overlay, which is painted over the ring but
 * masked to the ring's own path, so it can recolour the ring's little dots and
 * reach nothing else.
 *
 * The transforms below are the design file's nested translates added up. Every
 * one of them is a pure translate, so the sum is exact and the mark lands on
 * the same pixel as the source svg. See animations/geometry.ts for the working.
 */
export default function NewLoginLogo({
    variant = 'header',
    dotColor = 'purple',
    ringColor,
    className = '',
    width,
    height,
    animationVariant,
    durationSeconds,
    animateWord = true,
}: NewLoginLogoProps) {
    const context = useLogoAnimation();
    const animation: LogoAnimationType = animationVariant ?? context.animation ?? 'none';

    const resolvedDotColor = COLOR_MAP[dotColor] || dotColor;
    const resolvedRingColor = ringColor || resolvedDotColor;

    const geo = LOGO_GEOMETRY[variant];
    const engineMotion = useAnimationEngine(
        animation,
        variant,
        resolvedDotColor,
        resolvedRingColor,
        context.ignoreReducedMotion,
        durationSeconds ?? context.durationSeconds,
    );

    /**
     * `animateWord: false` takes away the only two handles a pattern has on the
     * word — the clip path and the per-letter groups. Everything else it does is
     * left alone, so the ring still draws and the dots still drop; the word is
     * simply there the whole time. The unused <clipPath> stays in `defs`, where
     * it paints nothing.
     */
    const logoMotion = animateWord
        ? engineMotion
        : { ...engineMotion, wordmarkClipId: undefined, letters: undefined };

    const dot = (props: ElementMotion | undefined, children: React.ReactNode) => (
        <motion.g
            style={{ ...PIVOT_ON_SELF, ...props?.style }}
            initial={props?.initial}
            animate={props?.animate}
            transition={props?.transition}
        >
            {children}
        </motion.g>
    );

    /**
     * The word, drawn one of two ways.
     *
     * Without `letters` it is the single path from the design file, which is
     * what the mark has always been and what the seven older patterns expect.
     * With `letters` it is one group per letter, so a pattern can stagger them.
     *
     * The two are the same picture. The letters are generated from that same
     * path by `scripts/split-wordmark.mjs`, no two letters in "trydos" or "try"
     * overlap, and each letter keeps its own counter as a subpath — so the fill
     * rule still cuts the hole in the "d" and the "o". None of that is true of
     * every possible wordmark, which is why the single path stays the default
     * rather than being deleted.
     *
     * Each letter carries the wordmark's own transform on the inner `<path>`,
     * not on the animated group. That leaves the group's bounding box sitting
     * on the letter itself, so `transform-box: fill-box` makes the letter turn
     * and scale about its own middle with no coordinate written down anywhere.
     */
    const wordmark = () => {
        if (!logoMotion.letters) {
            return (
                <path d={geo.wordmarkPath} transform={geo.wordmarkTransform} fill={WORDMARK_FILL} />
            );
        }
        return geo.letters.map((letter, index) => {
            const props = logoMotion.letters?.[index];
            return (
                <motion.g
                    key={letter.id}
                    data-logo-letter={letter.id}
                    style={{ ...PIVOT_ON_SELF, ...props?.style }}
                    initial={props?.initial}
                    animate={props?.animate}
                    transition={props?.transition}
                >
                    <path d={letter.d} transform={geo.wordmarkTransform} fill={WORDMARK_FILL} />
                </motion.g>
            );
        });
    };

    const svgStyle: React.CSSProperties | undefined = logoMotion.overflowVisible
        ? { overflow: 'visible' }
        : undefined;

    const wordmarkClip = logoMotion.wordmarkClipId
        ? `url(#${logoMotion.wordmarkClipId})`
        : undefined;

    if (variant === 'badge-ring') {
        const ring = logoMotion.ring;
        return (
            <svg
                // Remount on a pattern change. Framer Motion holds on to every
                // value it has driven, so without this a dot keeps the translate
                // the last pattern left on it, and any value the new pattern does
                // not set is written out as the string "undefined".
                key={animation}
                xmlns="http://www.w3.org/2000/svg"
                width={width || geo.width}
                height={height || geo.height}
                viewBox={geo.viewBox}
                className={className}
                style={svgStyle}
                data-logo-variant="badge-ring"
                data-logo-animation={animation}
                data-logo-motion={logoMotion.isActive ? 'running' : 'static'}
            >
                <defs>{logoMotion.defs}</defs>
                {logoMotion.behind}

                {/* Invisible artboard square from the design file. Keeps spacing. */}
                <path d={BADGE_FRAME_PATH} transform="translate(27.849 27.853)" fill="none" />

                {/* Wordmark. The clip group carries no transform of its own, so a
                    pattern's clip rectangle is read in plain viewBox units. */}
                <g clipPath={wordmarkClip} data-logo-part="wordmark">
                    {wordmark()}
                </g>

                <g transform="translate(78.798 31.631)" data-logo-part="dot-right">
                    {dot(logoMotion.rightDot, <path d={BADGE_DOT_PATH} fill={resolvedDotColor} />)}
                </g>
                <g transform="translate(48.606 31.631)" data-logo-part="dot-left">
                    {dot(logoMotion.leftDot, <path d={BADGE_DOT_PATH} fill={resolvedDotColor} />)}
                </g>

                <g mask={logoMotion.ringMaskId ? `url(#${logoMotion.ringMaskId})` : undefined}>
                    <motion.g
                        style={{ ...PIVOT_ON_SELF, ...ring?.style }}
                        initial={ring?.initial}
                        animate={ring?.animate}
                        transition={ring?.transition}
                        data-logo-part="ring"
                    >
                        <path
                            d={BADGE_RING_PATH}
                            transform="translate(-0.004 0)"
                            fill={resolvedRingColor}
                        />
                    </motion.g>
                </g>
                {logoMotion.ringOverlay}
            </svg>
        );
    }

    return (
        <svg
            key={animation}
            xmlns="http://www.w3.org/2000/svg"
            width={width || geo.width}
            height={height || geo.height}
            viewBox={geo.viewBox}
            className={className}
            style={svgStyle}
            data-logo-variant="header"
            data-logo-animation={animation}
            data-logo-motion={logoMotion.isActive ? 'running' : 'static'}
        >
            <defs>{logoMotion.defs}</defs>
            {logoMotion.behind}

            <g clipPath={wordmarkClip} data-logo-part="wordmark">
                    {wordmark()}
                </g>

            <g transform="translate(42.799 0)" data-logo-part="dot-right">
                {dot(logoMotion.rightDot, <path d={HEADER_DOT_PATH} fill={resolvedDotColor} />)}
            </g>
            <g transform="translate(12.609 0)" data-logo-part="dot-left">
                {dot(logoMotion.leftDot, <path d={HEADER_DOT_PATH} fill={resolvedDotColor} />)}
            </g>
        </svg>
    );
}
