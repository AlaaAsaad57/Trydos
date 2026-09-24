import { letterCentre } from '../geometry';
import type { LogoMotion, PatternContext } from '../types';

/**
 * 9 — Escape. Motion language: a joke with a held beat.
 *
 * Everything is still. The last letter of the word slips, tips over and lies
 * there. The eyes snap to it, hold wide, then narrow into a flat stare.
 * Nothing moves for a second. Then the letter hops back into place, the rest of
 * the word bounces, and the mark goes still again.
 *
 * The silence is the pattern
 * --------------------------
 * Well over a third of the loop has nothing moving at all, and the longest
 * single stretch is the one second stare after the letter has fallen. That
 * pause is the joke — a reaction shot is a held drawing, not a movement — and
 * it is the one
 * thing no other pattern in this set does. `tempo` ticks constantly, `spark`
 * drifts constantly, and even `wink` is always doing something small. Here the
 * stillness is deliberate and it is timed.
 *
 * It is also the pattern that could not exist before the wordmark was split.
 * One letter leaving a six-letter word needs six paths; with one path the only
 * options were to move the whole word or nothing.
 *
 * The letter falls rather than slides off the side. Sliding was the first
 * version and it put the "s" past the right edge of the lockup box, where the
 * mark ends exactly on x=176.18 and there is no room at all. Falling keeps the
 * whole move inside the artwork on both variants.
 */

const CYCLE = 4;

/* The beats, as fractions of the cycle. Written out because the timing is the
   design here, and a reader should be able to check it without a calculator.
   At 4 seconds that is: 1.2s still, 0.3s fall, 0.1s before the eyes catch it,
   1.0s stare, 0.32s hop home, 0.56s still.

   The stare is the number that matters. Everything else could be squeezed when
   the set moved from a 9 second cycle to a 4 second one; the held beat could
   not, because a pause that is over before it registers is not a pause, it is
   a gap. So the stare kept its full second and the calm either side gave up
   the time instead. */
const SLIP = 0.3;
const LANDED = 0.375;
const NOTICED = 0.4;
const NARROW = 0.47;
const HOP = 0.72;
const HOME = 0.8;
const SETTLED = 0.86;

/** How far the letter falls, and how far over it tips. */
const FALL = 10;
const TIP = 18;
/** How far an eye turns to look at it. Inside the header lockup's 8.5 limit. */
const REACH = 6.5;

export function escapePattern({ geo, variant, cycle = CYCLE }: PatternContext): LogoMotion {
    const runaway = geo.letters.length - 1;
    const target = letterCentre(geo, runaway);

    /**
     * Aim one eye at where the fallen letter is lying.
     *
     * The offset is the unit vector towards it times a fixed reach, so the eye
     * points dead at it and never tries to reach it — the same rig `firefly`
     * uses. Aiming the two eyes separately is what makes them converge slightly
     * on the badge, where the letter is close; on the lockup it is far to the
     * right, so both eyes end up nearly parallel. Neither case is written down.
     */
    const aim = (dot: { x: number; y: number }) => {
        const dx = target.x - dot.x;
        const dy = target.y + FALL - dot.y;
        const len = Math.hypot(dx, dy) || 1;
        return { x: (REACH * dx) / len, y: (REACH * dy) / len };
    };

    const eye = (dot: { x: number; y: number }) => {
        const look = aim(dot);
        return {
            animate: {
                // Still, still, snap to it, hold, hold, back to centre, still.
                x: [0, 0, look.x, look.x, look.x, look.x, 0, 0],
                y: [0, 0, look.y, look.y, look.y, look.y, 0, 0],
                // Wide on the snap, then narrowed to a flat stare, then back.
                // The stare is a half-lid held for a whole second: eyes that
                // stay wide read as alarmed, and eyes that blink read as having
                // moved on. Neither is the joke.
                scaleY: [1, 1, 1.15, 1.15, 0.5, 0.5, 1, 1],
                scaleX: [1, 1, 1.15, 1.15, 1.02, 1.02, 1, 1],
            },
            transition: {
                duration: cycle,
                // The snap is one step from rest to the look, 45ms wide. A
                // gentler move here would read as the eye drifting over, and
                // the whole beat depends on it being caught by surprise.
                times: [0, LANDED, NOTICED, NARROW, NARROW + 0.005, HOP, SETTLED, 1],
                ease: 'easeOut' as const,
                repeat: Infinity,
            },
        };
    };

    /**
     * The letter that falls.
     *
     * It goes over, lies there through the stare, then hops home — up past its
     * own place by 2, and landing with an even squash. The squash is on both
     * axes: a letter squashed on one axis only is a condensed typeface, which
     * on a logo is damage rather than motion.
     */
    const fallen = {
        animate: {
            y: [0, 0, FALL, FALL, FALL, -2, 0, 0, 0],
            x: [0, 0, 2, 2, 2, 0.5, 0, 0, 0],
            rotate: [0, 0, TIP, TIP, TIP, -3, 0, 0, 0],
            // Lands, squashes, and is back to its own size 270ms later. The
            // squash needs its own keyframe to come out of, or it eases back
            // across the stillness that follows and reads as the letter
            // slowly inflating.
            scale: [1, 1, 1, 1, 1, 1.02, 0.97, 1, 1],
        },
        transition: {
            duration: cycle,
            times: [0, SLIP, LANDED, NARROW, HOP, HOME, HOME + 0.02, HOME + 0.05, 1],
            ease: 'easeOut' as const,
            repeat: Infinity,
        },
    };

    /**
     * Every other letter. Still for the whole loop except one 1px bounce when
     * the runaway lands back in the word, each a little later than the one to
     * its left. That sympathy bounce is what ties the word together — without
     * it the last letter looks like it belongs to a different logo.
     */
    const neighbour = (index: number) => {
        const start = HOME + 0.008 * index;
        return {
            animate: { y: [0, 0, 1, -0.2, 0, 0] },
            transition: {
                duration: cycle,
                times: [0, start, start + 0.008, start + 0.022, start + 0.04, 1],
                ease: 'easeOut' as const,
                repeat: Infinity,
            },
        };
    };

    const letters = geo.letters.map((_, index) =>
        index === runaway ? fallen : neighbour(index),
    );

    return {
        // The letter tips past the bottom of the wordmark box, and on the
        // lockup its far corner passes the right edge of the artwork by about
        // 6 units while it is over.
        overflowVisible: true,
        leftDot: eye(geo.leftDot),
        rightDot: eye(geo.rightDot),
        letters,
        /**
         * The ring takes one small kick when the letter lands back, then
         * carries on turning. The kick and the turn are on separate clocks, so
         * the slow lap is not dragged down to the pattern's 4 seconds. Both
         * start and end in the same place, so the loop has no seam.
         */
        ring:
            variant === 'badge-ring'
                ? {
                      animate: {
                          rotate: [0, 360],
                          scale: [1, 1, 1.012, 1, 1],
                      },
                      transition: {
                          rotate: { duration: 80, ease: 'linear' as const, repeat: Infinity },
                          scale: {
                              duration: cycle,
                              times: [0, HOME, HOME + 0.012, HOME + 0.05, 1],
                              ease: 'easeOut' as const,
                              repeat: Infinity,
                          },
                      },
                  }
                : undefined,
    };
}
