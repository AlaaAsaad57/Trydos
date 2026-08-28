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
