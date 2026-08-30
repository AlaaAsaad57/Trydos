import { motion } from 'framer-motion';
import type { Easing } from 'framer-motion';
import { ringCircumference } from '../geometry';
import type { LogoMotion, PatternContext } from '../types';

/**
 * 8 — Cinematic Assembly. Motion language: a build, and then it stays built.
 *
 * The mark assembles itself in three overlapping beats and stops on the
 * finished mark. As a share of the whole run:
 *
 *   0%    the ring starts drawing itself round, anti-clockwise from the top
 *   21%   the wordmark starts wiping in from the left
 *   66%   the two dots start dropping in, the left one first
 *   100%  assembled — and it holds there, for as long as the screen is shown
 *
 * It used to run the build backwards and start again. That is wrong for what
 * the screen is doing: the mark is being introduced, and an introduction that
 * takes itself apart every few seconds reads as a loading state. The last
 * keyframe of every list below is the assembled value, and framer-motion holds
 * a finished animation on its last keyframe, so the mark simply stays.
 *
 * The beats fill the whole run rather than the first third of it. `at()` below
 * divides by the length of the build, not by a fixed number, so the seconds a
 * caller asks for are the seconds the build takes.
 *
 * The wordmark is not "drawn" by stroking the letters and animating a dash.
 * That trick is everywhere, and on this mark it is wrong: it needs a stroke
 * added to a fill-only glyph, and a 1.5px stroke on a 176px logo thickens every
 * letter and closes up the counters — the holes inside the d and the o. This
 * uses a clip path instead. A clip only ever hides part of the artwork and
 * hands the rest back exactly as drawn, so at every frame of the wipe the
 * letters that are showing are the real letters.
 *
 * The ring is treated the same way: it is masked by a growing arc, not redrawn.
 *
 * Every beat is written as keyframes on one shared `duration`, never as a
 * `delay` plus a spring. A `delay` only applies to the first run, so a looping
 * pattern built out of delays holds its stagger once and then runs everything
 * together; and a spring has no fixed length, so it cannot be placed on a
 * timeline at all. Keyframes plus `times` give both, and they repeat exactly.
 */

/** The cycle the pattern falls back to when a caller names no length. */
const CYCLE = 4.5;

const WIPE_IN: Easing = [0.22, 1, 0.36, 1];
const RING_EASE: Easing = [0.65, 0, 0.35, 1];

/** One easing per gap between keyframes: wait, then move, then hold. */
const WIPE_EASE: Easing[] = ['linear', WIPE_IN, 'linear'];
const RING_EASE_STEPS: Easing[] = [RING_EASE, 'linear'];
const DROP_EASE: Easing[] = ['linear', 'easeOut', 'easeOut', 'linear'];

/** How long a dot takes to fall in, and where in that fall it overshoots. */
const DROP = 0.4;
const DROP_OVERSHOOT = 0.22;

export function revealPattern({ variant, geo, uid, cycle = CYCLE }: PatternContext): LogoMotion {
    const clipId = `${uid}-reveal-wipe`;
    const w = geo.wordmark;
    const isBadge = variant === 'badge-ring' && geo.ring !== null;

    // The badge starts later on both beats, because it has a ring to draw
    // first. The header has nothing to wait for.
    const wipeStart = isBadge ? 0.3 : 0.15;
    const wipeEnd = wipeStart + 0.85;
    const dropStart = isBadge ? 0.95 : 0.75;

    /**
     * The build ends when the last dot lands, and the last dot is the right
     * one, 80ms behind the left. Measuring from that, rather than from a fixed
     * number, is what makes the whole run be the build: the badge has a ring to
     * draw first and so takes longer than the header, and each fills its own
     * time instead of the header finishing early and waiting.
     */
    const build = dropStart + 0.08 + DROP;

    /** Seconds into the build, as the 0..1 position `times` wants. */
    const at = (seconds: number) => seconds / build;

    const wipeWidth = w.width + 6;

    const wipe = (
        <clipPath id={clipId}>
            <motion.rect
                x={w.x - 3}
                y={w.y - 4}
                height={w.height + 8}
                // Static width as well: the first render has no animation value
                // yet, and width="undefined" is rejected.
                width={0}
                initial={{ width: 0 }}
                animate={{ width: [0, 0, wipeWidth, wipeWidth] }}
                transition={{
                    duration: cycle,
                    times: [0, at(wipeStart), at(wipeEnd), 1],
                    ease: WIPE_EASE,
                }}
            />
        </clipPath>
    );

    /**
     * One dot's whole run: waiting above the mark, falling in past its resting
     * place, settling on it, and staying there.
     */
    const drop = (start: number) => ({
        animate: {
            y: [-16, -16, 2.5, 0, 0],
            scale: [0.5, 0.5, 1.06, 1, 1],
            opacity: [0, 0, 1, 1, 1],
        },
        transition: {
            duration: cycle,
            times: [0, at(start), at(start + DROP_OVERSHOOT), at(start + DROP), 1],
            ease: DROP_EASE,
        },
    });

    const dots = {
        // 80ms apart, so the pair lands as two beats rather than as one thud.
        leftDot: drop(dropStart),
        rightDot: drop(dropStart + 0.08),
    };

    if (!isBadge || !geo.ring) {
        return { overflowVisible: true, defs: wipe, wordmarkClipId: clipId, ...dots };
    }

    const { cx, cy, r } = geo.ring;
    const c = ringCircumference(geo);
    const maskId = `${uid}-reveal-ring`;
    const ringEnd = 1;

    return {
        overflowVisible: true,
        defs: (
            <>
                {wipe}
                <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={geo.width} height={geo.height}>
                    <motion.circle
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill="none"
                        stroke="#fff"
                        // 5 is wider than the ring's own dots (diameter 1.876),
                        // so the mask never shaves one in half as it passes.
                        strokeWidth={5}
                        strokeDasharray={c}
                        strokeDashoffset={c}
                        transform={`rotate(-90 ${cx} ${cy})`}
                        initial={{ strokeDashoffset: c }}
                        animate={{ strokeDashoffset: [c, 0, 0] }}
                        transition={{
                            duration: cycle,
                            times: [0, at(ringEnd), 1],
                            ease: RING_EASE_STEPS,
                        }}
                    />
                </mask>
            </>
        ),
        wordmarkClipId: clipId,
        ringMaskId: maskId,
        ...dots,
    };
}
