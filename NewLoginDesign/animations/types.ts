import type { CSSProperties, ReactNode } from 'react';
import type { TargetAndTransition, Transition } from 'framer-motion';
import type { LogoGeometry } from './geometry';

export type LogoVariant = 'header' | 'badge-ring';

/**
 * What a pattern is allowed to move.
 *
 * The list is short on purpose. The wordmark is not in it: no pattern may set
 * a stroke, a filter, a transform or a colour on the glyph path, because every
 * one of those changes the shape of the letters. The single exception is
 * `wordmarkClipId` — a clip path only ever hides part of the mark and hands it
 * back untouched, so a reveal cannot deform a glyph.
 */
export interface ElementMotion {
    initial?: TargetAndTransition;
    animate?: TargetAndTransition;
    transition?: Transition;
    style?: CSSProperties;
}

export interface LogoMotion {
    /**
     * Whether the engine handed out a pattern at all. Rendered onto the svg as
     * `data-logo-motion`, so "is it meant to be moving" can be read straight off
     * the element instead of guessed from whether it happens to be moving.
     */
    isActive?: boolean;
    /** <filter>, <mask>, <clipPath>, <linearGradient> — ids must come from `uid`. */
    defs?: ReactNode;
    /** Decoration painted before the mark, so the mark always sits on top of it. */
    behind?: ReactNode;
    /**
     * Decoration painted straight after the ring path and masked to it, so it
     * can recolour the ring dots and nothing else. Badge variant only.
     */
    ringOverlay?: ReactNode;
    leftDot?: ElementMotion;
    rightDot?: ElementMotion;
    ring?: ElementMotion;
    /** id of a <clipPath> in `defs`. The only handle a pattern has on the wordmark. */
    wordmarkClipId?: string;
    /**
     * One entry per letter of `geo.letters`, left to right, or absent.
     *
     * Setting it switches the wordmark from one `<path>` to one group per
     * letter, so the letters can be staggered. Leaving it out keeps the single
     * path, which is why the seven patterns written before this existed draw
     * exactly what they always drew.
     *
     * The ban on reshaping a glyph has not moved. A letter group may be
     * translated, rotated, scaled and faded; it may not be stroked, filtered or
     * recoloured, and it must be scaled evenly. `scaleX: 1.2` on a letter is
     * not motion, it is a condensed typeface nobody licensed.
     *
     * Shorter than `geo.letters` is allowed — the rest simply do not move.
     */
    letters?: ElementMotion[];
    /** id of a <mask> in `defs`, applied to the ring path. Hides, never redraws. */
    ringMaskId?: string;
    /**
     * true when the pattern moves something past the edge of the viewBox and
     * needs the svg to paint outside its box instead of cutting it off.
     */
    overflowVisible?: boolean;
}

/** Eye-lid state, 1 = open, ~0 = shut. Only the `wink` pattern reads it. */
export interface BlinkState {
    left: number;
    right: number;
}

export interface PatternContext {
    variant: LogoVariant;
    /**
     * How long one loop of the pattern takes, in seconds.
     *
     * Left out, every pattern uses the cycle it was designed on — 4 seconds for
     * nine of them, 4.5 for `reveal`. The demo route sets it, so the client can
     * watch the same pattern run slow or fast before choosing one.
     *
     * Only the length of the loop changes. Every `times` array in this folder is
     * written as a fraction of the cycle, so each beat keeps its place inside it
     * however long the loop is told to be. The slow background turn some
     * patterns give the badge ring is not part of the loop and does not follow
     * this value.
     */
    cycle?: number;
    geo: LogoGeometry;
    dotColor: string;
    ringColor: string;
    /** Unique per mounted logo. Every svg id must start with it, or two logos on
     *  one screen will fight over the same <mask>. */
    uid: string;
    blink: BlinkState;
}

export type PatternFactory = (ctx: PatternContext) => LogoMotion;

export const STATIC_MOTION: LogoMotion = {};
