import { motion } from 'framer-motion';
import type { Easing } from 'framer-motion';
import { ringCircumference } from '../geometry';
import type { LogoMotion, PatternContext } from '../types';

/**
 * 8 — Cinematic Assembly. Motion language: a build, run backwards, for ever.
 *
 * The mark assembles itself in three beats, holds, then takes itself apart
 * again in the same three beats played in reverse order:
 *
 *   0.00s  the ring draws itself round, anti-clockwise from the top
 *   0.30s  the wordmark is wiped in from the left
 *   0.95s  the two dots drop in, the left one first
 *   ~1.4s  assembled, and held there for about two seconds
 *   3.07s  the dots lift back out, the right one first
 *   3.35s  the wordmark is wiped back out to the left
 *   3.50s  the ring un-draws itself
 *   4.50s  back exactly where it started, and it goes again
 *
 * The reverse half is not written out twice. Every beat that runs from `a` to
 * `b` on the way in runs from `CYCLE - b` to `CYCLE - a` on the way out, which
 * is what `mirror()` below does. Two things follow from that and both matter:
 * the order really is reversed, so the dot that arrived last leaves first; and
 * the value at the end of the cycle is the value at the start of it, so the
 * loop has no seam and needs no pause to hide one.
 *
 * The easing is mirrored too. The reverse of `cubic-bezier(x1,y1,x2,y2)` is
 * `cubic-bezier(1-x2, 1-y2, 1-x1, 1-y1)`, so a beat that eased out on the way
 * in eases in on the way out. Reusing the forward curve backwards is the thing
 * that makes a "reverse" look like a different, softer animation.
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

/** One full build-and-unbuild, in seconds. */
const CYCLE = 4.5;

/** Seconds to the 0..1 position framer-motion's `times` wants. */
const at = (seconds: number) => seconds / CYCLE;

/** Where a beat that runs `a -> b` on the way in runs on the way out. */
const mirror = (seconds: number) => CYCLE - seconds;

/** Forward easings, and the exact reverse of each. */
const WIPE_IN: Easing = [0.22, 1, 0.36, 1];
const WIPE_OUT: Easing = [0.64, 0, 0.78, 0];
const RING_EASE: Easing = [0.65, 0, 0.35, 1];

/** Hold, open, hold, close, hold. One easing per gap between keyframes. */
const WIPE_EASE: Easing[] = ['linear', WIPE_IN, 'linear', WIPE_OUT, 'linear'];
const RING_EASE_STEPS: Easing[] = [RING_EASE, 'linear', RING_EASE];
const DROP_EASE: Easing[] = [
    'linear',
    'easeOut',
    'easeOut',
    'linear',
    'easeIn',
    'easeIn',
    'linear',
];

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
                animate={{ width: [0, 0, wipeWidth, wipeWidth, 0, 0] }}
                transition={{
                    duration: cycle,
                    times: [
                        0,
                        at(wipeStart),
                        at(wipeEnd),
                        at(mirror(wipeEnd)),
                        at(mirror(wipeStart)),
                        1,
                    ],
                    ease: WIPE_EASE,
                    repeat: Infinity,
                }}
            />
        </clipPath>
    );

    /**
     * One dot's whole cycle: waiting above the mark, falling in past its
     * resting place, settling, holding, gathering itself, and flying back out
     * the way it came.
     */
    const drop = (start: number) => ({
        animate: {
            y: [-16, -16, 2.5, 0, 0, 2.5, -16, -16],
            scale: [0.5, 0.5, 1.06, 1, 1, 1.06, 0.5, 0.5],
            opacity: [0, 0, 1, 1, 1, 1, 0, 0],
        },
        transition: {
            duration: cycle,
            times: [
                0,
                at(start),
                at(start + DROP_OVERSHOOT),
                at(start + DROP),
                at(mirror(start + DROP)),
                at(mirror(start + DROP_OVERSHOOT)),
                at(mirror(start)),
                1,
            ],
            ease: DROP_EASE,
            repeat: Infinity,
        },
    });

    const dots = {
        // 80ms apart on the way in. The mirror puts the right dot out first,
        // which is what makes the second half read as a reversal rather than
        // as a second, different animation.
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
                        animate={{ strokeDashoffset: [c, 0, 0, c] }}
                        transition={{
                            duration: cycle,
                            times: [0, at(ringEnd), at(mirror(ringEnd)), 1],
                            // The forward curve is symmetric, so its own
                            // reverse is itself. It is named twice all the same,
                            // so the pair stays right if the curve is changed.
                            ease: RING_EASE_STEPS,
                            repeat: Infinity,
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
