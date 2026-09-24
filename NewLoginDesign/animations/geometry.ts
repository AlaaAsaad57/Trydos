/**
 * geometry.ts — where every part of the mark sits, in viewBox units.
 *
 * The numbers below are read straight out of the two source files,
 * `logo.svg` (header lockup) and `QuickPreviewBottomLogo.svg` (badge ring),
 * by adding up the nested `transform="translate(...)"` values. They are the
 * only place an animation is allowed to learn a coordinate from. A pattern
 * that hardcodes its own number will drift the day a source file changes.
 *
 * header lockup — viewBox "0 0 176.18 87.574"
 *   outer group          translate(-127, -398.633)
 *   dots group           translate(126.402, 398.633) -> translate(13.207, 0)
 *     net dot offset     (12.609, 0)
 *     left dot centre    (12.609 + 11.321, 11.321)  = (23.930, 11.321)
 *     right dot centre   (12.609 + 41.511, 11.321)  = (54.120, 11.321)
 *   wordmark             translate(125.65, 497.75) -> net (-1.35, 99.117)
 *
 * badge ring — viewBox "0 0 150 150"
 *   outer groups cancel  translate(-140, -284) + translate(140, 284) = (0, 0)
 *   inner group          translate(27.849, 27.853) -> translate(7.549, 3.778)
 *   dots group           translate(13.208, 0)
 *     net dot offset     (48.606, 31.631)
 *     left dot centre    (48.606 + 11.322, 31.631 + 11.322) = (59.928, 42.953)
 *     right dot centre   (48.606 + 41.514, 42.953)          = (90.120, 42.953)
 *   ring path            spans the full 0..150 box; its little dots have
 *                        radius 0.938, so the track centre radius is
 *                        75 - 0.938 = 74.062
 */

import {
    BADGE_LETTERS,
    BADGE_WORDMARK_PATH,
    HEADER_LETTERS,
    HEADER_WORDMARK_PATH,
    type WordmarkLetter,
} from '../logoPaths';
import type { LogoVariant } from './types';

export interface LogoGeometry {
    viewBox: string;
    width: number;
    height: number;
    /** Radius of the two brand dots. */
    dotR: number;
    leftDot: { x: number; y: number };
    rightDot: { x: number; y: number };
    /**
     * The real ink box of the wordmark glyphs, read out of a browser with
     * `getBBox()` rather than estimated from the path data. The reveal wipe
     * clips to this box, so an estimate that is a few px short silently cuts
     * the descender off the "y" — which is exactly what a guessed number did.
     * If the artwork changes, measure it again; do not adjust it by eye.
     */
    wordmark: { x: number; y: number; width: number; height: number };
    /**
     * The glyph outline and the transform that puts it in place.
     *
     * `NewLoginLogo` paints the real wordmark from these, and a pattern that
     * wants a shadow of the word behind the mark paints the same two. Holding
     * them in one place is what stops the shadow drifting off the letters the
     * day the artwork is regenerated — a second copy of the translate would go
     * stale silently, and a mark with a shadow 2px out of register looks like a
     * printing fault rather than a bug.
     */
    wordmarkPath: string;
    wordmarkTransform: string;
    /**
     * The same word, one entry per letter, left to right.
     *
     * A pattern that sets `letters` in its `LogoMotion` gets the word rendered
     * as one group per letter and can stagger them. A pattern that does not is
     * unaffected: the component still draws `wordmarkPath` as a single path.
     *
     * Each letter's `d` is in the same coordinate space as `wordmarkPath`, so
     * `wordmarkTransform` applies to it unchanged.
     */
    letters: WordmarkLetter[];
    /** The dotted badge ring. `null` on the header lockup, which has no ring. */
    ring: { cx: number; cy: number; r: number } | null;
}

const HEADER: LogoGeometry = {
    viewBox: '0 0 176.18 87.574',
    width: 176.18,
    height: 87.574,
    dotR: 11.321,
    leftDot: { x: 23.93, y: 11.321 },
    rightDot: { x: 54.12, y: 11.321 },
    wordmark: { x: 0, y: 32.516, width: 176.191, height: 55.058 },
    wordmarkPath: HEADER_WORDMARK_PATH,
    wordmarkTransform: 'translate(-1.35 99.117)',
    letters: HEADER_LETTERS,
    ring: null,
};

const BADGE: LogoGeometry = {
    viewBox: '0 0 150 150',
    width: 150,
    height: 150,
    dotR: 11.322,
    leftDot: { x: 59.928, y: 42.953 },
    rightDot: { x: 90.12, y: 42.953 },
    wordmark: { x: 35.397, y: 69.367, width: 79.259, height: 49.997 },
    wordmarkPath: BADGE_WORDMARK_PATH,
    wordmarkTransform: 'translate(34.048 131.633)',
    letters: BADGE_LETTERS,
    ring: { cx: 75, cy: 75, r: 74.062 },
};

export const LOGO_GEOMETRY: Record<LogoVariant, LogoGeometry> = {
    header: HEADER,
    'badge-ring': BADGE,
};

/** Distance between the two dot centres. */
function dotGap(geo: LogoGeometry): number {
    return geo.rightDot.x - geo.leftDot.x;
}

/**
 * How far each dot may travel towards the other before the two touch.
 * Used by every pattern that pulls the dots together, so none of them has to
 * guess a safe number.
 */
export function maxPullIn(geo: LogoGeometry): number {
    return (dotGap(geo) - geo.dotR * 2) / 2;
}

/** Length of the ring track, for stroke-dasharray maths. */
export function ringCircumference(geo: LogoGeometry): number {
    return geo.ring ? 2 * Math.PI * geo.ring.r : 0;
}

/**
 * The middle of one letter, in viewBox units — the same space the dots are in.
 *
 * `WordmarkLetter.box` is in the wordmark's own coordinates, because that is
 * the space its `d` is drawn in. A pattern that wants to aim an eye at a letter
 * needs it in the space the eyes live in, which means adding the wordmark's own
 * translate. Doing that here, by reading the one transform string the component
 * also uses, is what stops a pattern writing the offset down a second time and
 * having it go stale the day the artwork moves.
 */
export function letterCentre(geo: LogoGeometry, index: number): { x: number; y: number } {
    const letter = geo.letters[index];
    if (!letter) return { x: geo.width / 2, y: geo.height / 2 };

    const match = /translate\(\s*(-?[\d.]+)(?:[\s,]+(-?[\d.]+))?\s*\)/.exec(geo.wordmarkTransform);
    // The y value is optional in svg — `translate(13.207)` is legal and means
    // no vertical shift — so a missing second number is 0, never a failure.
    const offsetX = match ? parseFloat(match[1]) : 0;
    const offsetY = match ? parseFloat(match[2] ?? '0') : 0;

    return {
        x: letter.box.x + letter.box.width / 2 + offsetX,
        y: letter.box.y + letter.box.height / 2 + offsetY,
    };
}
